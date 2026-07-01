// studyService — registro, consulta e edição de sessões de estudo (Fases 4).
// Modo agregado por decisão do usuário (01/07/2026): total por caderno quando
// study_type = "questao"/"simulado"/"discursiva" (session_results); só tempo
// nos demais tipos (revisao/flashcard/leitura/videoaula). question_attempts
// fica vazio por enquanto — schema já preparado, sem uso ainda.
// Exclusão é sempre lógica (status ativo/inativo) — nunca DELETE físico (RN-009).

import { supabase } from "../supabaseClient.js";

const TYPES_WITH_MEASURABLE_RESULT = ["questao", "simulado", "discursiva"];

export function hasMeasurableResult(studyType) {
  return TYPES_WITH_MEASURABLE_RESULT.includes(studyType);
}

// payload: {
//   userId, occurredAt, examId, boardId, disciplineId, questionSetId, studyType,
//   durationMinutes, selfConfidence, notes,
//   // só quando hasMeasurableResult(studyType):
//   questionsTotal, correctTotal, wrongTotal, score, scoreIsEstimate
// }
export async function createStudySession(payload) {
  const { data: session, error: sessionError } = await supabase
    .from("study_sessions")
    .insert({
      user_id: payload.userId,
      occurred_at: payload.occurredAt,
      exam_id: payload.examId || null,
      board_id: payload.boardId || null,
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
export async function updateStudySession(sessionId, payload) {
  const { error: sessionError } = await supabase
    .from("study_sessions")
    .update({
      occurred_at: payload.occurredAt,
      exam_id: payload.examId || null,
      board_id: payload.boardId || null,
      discipline_id: payload.disciplineId,
      question_set_id: payload.questionSetId || null,
      study_type: payload.studyType,
      duration_minutes: payload.durationMinutes,
      self_confidence: payload.selfConfidence || null,
      notes: payload.notes || null,
    })
    .eq("id", sessionId);
  if (sessionError) throw sessionError;

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
    .select("*, session_results(*)")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

// status: "ativo" | "inativo" | undefined (undefined = sem filtro, todas).
// Sem valor padrão de propósito — "Todas" no formulário manda undefined, e um
// default aqui faria "Todas" se comportar como "Ativas" por acidente.
export async function listSessions({ disciplineId, status, limit = 100 } = {}) {
  let query = supabase
    .from("study_sessions")
    .select(
      "id, occurred_at, study_type, duration_minutes, discipline_id, question_set_id, exam_id, board_id, self_confidence, status, session_results(questions_total, correct_total, wrong_total, score)"
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
