// studyService — registro, consulta e edição de sessões de estudo (Fases 4).
// Modo agregado por decisão do usuário (01/07/2026): total por caderno quando
// study_type = "questao"/"simulado"/"discursiva" (session_results); só tempo
// nos demais tipos (revisao/flashcard/leitura/videoaula). question_attempts
// fica vazio por enquanto — schema já preparado, sem uso ainda.
// Exclusão é sempre lógica (status ativo/inativo) — nunca DELETE físico (RN-009).
//
// "caderno_erros" (08/07/2026) — revisão semanal de questões erradas,
// cruzando disciplinas. Também é mensurável (questões/acertos/erros), mas de
// propósito NÃO entra nas views de Diagnóstico Wilson/Retenção/Eficiência
// (0024/0026/0028) — essas já filtram study_type in ('questao','simulado',
// 'discursiva') explicitamente, então um tipo novo nasce isolado sem precisar
// mudar SQL nenhum. Fica de fora de propósito: misturar "questão nova" com
// "reteste do seu pior erro" no mesmo % de Wilson distorceria o diagnóstico
// pra pior sem representar queda real de desempenho.

import { supabase } from "../supabaseClient.js";

const TYPES_WITH_MEASURABLE_RESULT = ["questao", "simulado", "discursiva", "caderno_erros"];

export function hasMeasurableResult(studyType) {
  return TYPES_WITH_MEASURABLE_RESULT.includes(studyType);
}

// payload: {
//   userId, occurredAt, examId, boardId, boardIds, disciplineId, questionSetId, studyType,
//   durationMinutes, selfConfidence, notes,
//   // só quando hasMeasurableResult(studyType):
//   questionsTotal, correctTotal, wrongTotal, score, scoreIsEstimate
// }
// boardIds (array, opcional): sessão "multibancas" (decisão de 02/07/2026).
// Com length <= 1, board_id (coluna legada) continua preenchido normalmente
// (compatibilidade com views existentes, ex. v_comparativo_banca). Com
// length > 1, board_id fica null — study_session_boards passa a ser a fonte
// de verdade (não dá pra representar "mais de uma banca" numa FK única).
function resolveBoardIds(payload) {
  if (Array.isArray(payload.boardIds)) return payload.boardIds.filter(Boolean);
  return payload.boardId ? [payload.boardId] : [];
}

export async function createStudySession(payload) {
  const boardIds = resolveBoardIds(payload);

  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      user_id: payload.userId,
      occurred_at: payload.occurredAt,
      exam_id: payload.examId || null,
      board_id: boardIds.length === 1 ? boardIds[0] : null,
      discipline_id: payload.disciplineId,
      question_set_id: payload.questionSetId || null,
      study_type: payload.studyType,
      duration_minutes: payload.durationMinutes,
      self_confidence: payload.selfConfidence || null,
      notes: payload.notes || null,
    })
    .select("id")
    .single();

  if (sessionError) throw sessionError;

  if (boardIds.length > 0) {
    const { error: boardsError } = await supabase
      .from("study_session_boards")
      .insert(boardIds.map((boardId) => ({ user_id: payload.userId, session_id: session.id, board_id: boardId })));
    if (boardsError) throw boardsError;
  }

  if (hasMeasurableResult(payload.studyType)) {
    const { error: resultError } = await supabase.from("session_results").insert({
      user_id: payload.userId,
      session_id: session.id,
      questions_total: payload.questionsTotal ?? 0,
      correct_total: payload.correctTotal ?? 0,
      wrong_total: payload.wrongTotal ?? 0,
      score: payload.score ?? null,
      score_is_estimate: payload.scoreIsEstimate ?? false,
    });
    if (resultError) throw resultError;
  }

  return session;
}

// Atualiza sessão existente. Se o tipo mudar de mensurável para não-mensurável
// (ou vice-versa), ajusta session_results de acordo (upsert ou remove).
// boardIds: mesma regra de createStudySession — recria do zero as linhas de
// study_session_boards (mais simples e seguro que tentar diff incremental).
export async function updateStudySession(sessionId, payload) {
  const boardIds = resolveBoardIds(payload);

  const { error: sessionError } = await supabase
    .from("study_sessions")
    .update({
      occurred_at: payload.occurredAt,
      exam_id: payload.examId || null,
      board_id: boardIds.length === 1 ? boardIds[0] : null,
      discipline_id: payload.disciplineId,
      question_set_id: payload.questionSetId || null,
      study_type: payload.studyType,
      duration_minutes: payload.durationMinutes,
      self_confidence: payload.selfConfidence || null,
      notes: payload.notes || null,
    })
    .eq("id", sessionId);
  if (sessionError) throw sessionError;

  const { error: deleteBoardsError } = await supabase.from("study_session_boards").delete().eq("session_id", sessionId);
  if (deleteBoardsError) throw deleteBoardsError;
  if (boardIds.length > 0) {
    const { error: boardsError } = await supabase
      .from("study_session_boards")
      .insert(boardIds.map((boardId) => ({ user_id: payload.userId, session_id: sessionId, board_id: boardId })));
    if (boardsError) throw boardsError;
  }

  if (hasMeasurableResult(payload.studyType)) {
    const { error: upsertError } = await supabase.from("session_results").upsert(
      {
        session_id: sessionId,
        user_id: payload.userId,
        questions_total: payload.questionsTotal ?? 0,
        correct_total: payload.correctTotal ?? 0,
        wrong_total: payload.wrongTotal ?? 0,
        score: payload.score ?? null,
        score_is_estimate: payload.scoreIsEstimate ?? false,
      },
      { onConflict: "session_id" }
    );
    if (upsertError) throw upsertError;
  } else {
    const { error: deleteError } = await supabase.from("session_results").delete().eq("session_id", sessionId);
    if (deleteError) throw deleteError;
  }
}

export async function getSessionById(sessionId) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*, session_results(*), study_session_boards(board_id)")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

// status: "ativo" | "inativo" | undefined (undefined = sem filtro, todas).
// Sem valor padrão de propósito — "Todas" no formulário manda undefined, e um
// default aqui faria "Todas" se comportar como "Ativas" por acidente.
// Select expandido em 08/07/2026 (pedido do usuário: Exportar CSV precisa
// trazer TODOS os dados de entrada, não só o que já aparecia na tela) —
// notes, score_is_estimate e study_session_boards (multibancas) entraram
// aqui só pra alimentar o CSV; a tabela em tela continua mostrando as mesmas
// colunas de antes (ver renderTable em sessionsPage.js).
export async function listSessions({ disciplineId, status, limit = 5000 } = {}) {
  let query = supabase
    .from("study_sessions")
    .select(
      "id, occurred_at, study_type, duration_minutes, discipline_id, question_set_id, exam_id, board_id, self_confidence, notes, status, session_results(questions_total, correct_total, wrong_total, score, score_is_estimate), study_session_boards(board_id)"
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (disciplineId) query = query.eq("discipline_id", disciplineId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Exclusão lógica — nunca DELETE físico de sessão (RN-009).
export async function setSessionStatus(sessionId, status) {
  const { error } = await supabase.from("study_sessions").update({ status }).eq("id", sessionId);
  if (error) throw error;
}

// Exclusão FÍSICA e definitiva (exceção a RN-009, aberta em 05/07/2026 a
// pedido explícito do usuário) — precisava conseguir apagar sessão de teste
// pra soltar uma disciplina/concurso/caderno de teste que ficava preso por
// causa dela (discipline_id é obrigatório em study_sessions, então enquanto
// a sessão existir — mesmo arquivada — a disciplina não pode ser apagada).
// RLS de study_sessions já é "ALL" (não só SELECT/UPDATE) restrito a
// user_id = auth.uid(), então cada usuário só apaga a própria sessão mesmo;
// session_results/study_session_boards/question_attempts cascadeiam junto
// (FK ON DELETE CASCADE, verificado antes de expor isso na UI). Use com
// cuidado: isso destrói histórico de verdade, sem recuperação possível.
export async function deleteStudySession(sessionId) {
  const { error } = await supabase.from("study_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
