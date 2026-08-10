// simuladoService (27/07/2026; v2 no mesmo dia) — Modelos de Prova
// reutilizáveis + tentativas (simulado ou prova oficial). Ver migrações
// exam_templates_attempts e exam_template_modules_rules para o racional.
// v2: blocos ganham módulo (Gerais/Específicos/...) e o modelo ganha
// critérios de habilitação acumuláveis (exam_template_rules) — pesquisa em
// editais mostrou que habilitação real é multi-critério (TCE-SP: 12 questões
// nas Gerais E 36 nas Específicas; FGV: % por módulo e/ou não zerar
// disciplina; Cebraspe: pontos líquidos; combinados: 50% por módulo E 60%
// total). Toda listagem nasce paginada (lição do corte de 1000 linhas).

import { supabase } from "../supabaseClient.js";
import { createStudySession } from "./studyService.js";

async function listAll(table, select, orderCol, ascending = true) {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(orderCol, { ascending })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

export async function listTemplates() {
  return listAll(
    "exam_templates",
    "id, name, board_id, scoring_mode, duration_minutes, min_total_pct, cutoff_score, notes, status, created_at",
    "created_at",
    false
  );
}

export async function listTemplateBlocks() {
  return listAll(
    "exam_template_blocks",
    "id, template_id, position, name, module, discipline_id, questions, weight, min_pct",
    "position",
    true
  );
}

export async function listTemplateRules() {
  return listAll("exam_template_rules", "id, template_id, scope, module_name, kind, value", "created_at", true);
}

export async function listAttempts() {
  return listAll(
    "exam_attempts",
    "id, template_id, occurred_at, origem, duration_minutes, session_id, notes, created_at",
    "occurred_at",
    false
  );
}

export async function listAttemptBlocks() {
  return listAll("exam_attempt_blocks", "id, attempt_id, block_id, correct, wrong", "id", true);
}

// blocks: [{ name, module, disciplineId, questions, weight }] na ordem da tela.
// rules: [{ scope, moduleName, kind, value }] — todos precisam passar (AND).
export async function createTemplate({ userId, name, boardId, scoringMode, durationMinutes, cutoffScore, notes, blocks, rules }) {
  const { data: tpl, error } = await supabase
    .from("exam_templates")
    .insert({
      user_id: userId,
      name,
      board_id: boardId || null,
      scoring_mode: scoringMode,
      duration_minutes: durationMinutes ?? null,
      cutoff_score: cutoffScore ?? null,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: blocksError } = await supabase.from("exam_template_blocks").insert(
    blocks.map((b, i) => ({
      user_id: userId,
      template_id: tpl.id,
      position: i,
      name: b.name,
      module: b.module || null,
      discipline_id: b.disciplineId || null,
      questions: b.questions,
      weight: b.weight,
    }))
  );
  if (blocksError) throw blocksError;

  if (rules && rules.length > 0) {
    const { error: rulesError } = await supabase.from("exam_template_rules").insert(
      rules.map((r) => ({
        user_id: userId,
        template_id: tpl.id,
        scope: r.scope,
        module_name: r.scope === "modulo" ? r.moduleName : null,
        kind: r.kind,
        value: r.value,
      }))
    );
    if (rulesError) throw rulesError;
  }
  return tpl;
}

// Arquivamento lógico — tentativas antigas continuam referenciando o modelo.
export async function setTemplateStatus(id, status) {
  const { error } = await supabase.from("exam_templates").update({ status }).eq("id", id);
  if (error) throw error;
}

// Edição completa do modelo (27/07/2026) — abre o modelo inteiro, não só
// corte/duração. Blocos: os que vêm com id são atualizados; sem id, criados;
// os que sumiram da tela são apagados — MAS a página bloqueia remover bloco
// que já tem resultado registrado (o delete cascatearia em
// exam_attempt_blocks e corromperia tentativas antigas). Regras não têm essa
// dependência: são substituídas em bloco (apaga todas, insere as novas).
export async function updateTemplate({ id, userId, name, boardId, scoringMode, durationMinutes, cutoffScore, notes, blocks, rules }) {
  const { error } = await supabase
    .from("exam_templates")
    .update({
      name,
      board_id: boardId || null,
      scoring_mode: scoringMode,
      duration_minutes: durationMinutes ?? null,
      cutoff_score: cutoffScore ?? null,
      notes: notes || null,
    })
    .eq("id", id);
  if (error) throw error;

  const manter = blocks.filter((b) => b.id).map((b) => b.id);
  let delQuery = supabase.from("exam_template_blocks").delete().eq("template_id", id);
  if (manter.length > 0) delQuery = delQuery.not("id", "in", `(${manter.join(",")})`);
  const { error: delError } = await delQuery;
  if (delError) throw delError;

  for (const [i, b] of blocks.entries()) {
    const payload = {
      user_id: userId,
      template_id: id,
      position: i,
      name: b.name,
      module: b.module || null,
      discipline_id: b.disciplineId || null,
      questions: b.questions,
      weight: b.weight,
    };
    if (b.id) {
      const { error: upError } = await supabase.from("exam_template_blocks").update(payload).eq("id", b.id);
      if (upError) throw upError;
    } else {
      const { error: insError } = await supabase.from("exam_template_blocks").insert(payload);
      if (insError) throw insError;
    }
  }

  const { error: delRules } = await supabase.from("exam_template_rules").delete().eq("template_id", id);
  if (delRules) throw delRules;
  if (rules && rules.length > 0) {
    const { error: insRules } = await supabase.from("exam_template_rules").insert(
      rules.map((r) => ({
        user_id: userId,
        template_id: id,
        scope: r.scope,
        module_name: r.scope === "modulo" ? r.moduleName : null,
        kind: r.kind,
        value: r.value,
      }))
    );
    if (insRules) throw insRules;
  }
}

// results: [{ blockId, correct, wrong }] — wrong só relevante no modo líquido.
// Gera junto uma study_session (tipo simulado, sem disciplina) com o total
// agregado, pra horas/questões semanais do dashboard ficarem consistentes
// sem digitação dupla. A sessão NÃO tem caderno/disciplina de propósito —
// simulado é cross-disciplina (mesma regra do caderno de erros).
export async function createAttempt({ userId, templateId, occurredAt, origem, durationMinutes, notes, results, totals }) {
  let sessionId = null;
  if (durationMinutes > 0) {
    const session = await createStudySession({
      userId,
      occurredAt,
      examId: null,
      boardIds: [],
      disciplineId: null,
      questionSetId: null,
      studyType: "simulado",
      durationMinutes,
      selfConfidence: null,
      notes: notes || null,
      questionsTotal: totals.questions,
      correctTotal: totals.correct,
      wrongTotal: totals.questions - totals.correct,
      score: totals.scorePct,
      scoreIsEstimate: true,
    });
    sessionId = session.id;
  }

  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .insert({
      user_id: userId,
      template_id: templateId,
      occurred_at: occurredAt,
      origem,
      duration_minutes: durationMinutes || null,
      session_id: sessionId,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: blocksError } = await supabase.from("exam_attempt_blocks").insert(
    results.map((r) => ({
      user_id: userId,
      attempt_id: attempt.id,
      block_id: r.blockId,
      correct: r.correct,
      wrong: r.wrong || 0,
    }))
  );
  if (blocksError) throw blocksError;
  return attempt;
}

// Apaga a tentativa. `apagarSessao` decide o destino da study_session que foi
// criada junto (ver createAttempt).
//
// Até 06/08/2026 a sessão NUNCA era apagada, com o argumento de que "as horas
// foram estudadas de verdade". O argumento tem mérito, mas o comportamento
// falhou na prática (caso real do usuário): a sessão órfã ficou somando 4h,
// 60 questões e ZERO acertos — porque carrega também o RESULTADO agregado,
// não só o tempo. Resultado sem tentativa de origem é dado inconsistente, e
// pior, afundava o percentual de acerto da semana. E não havia como o usuário
// descobrir qual das sessões pertencia à tentativa apagada.
//
// Agora quem decide é a tela, perguntando na hora. A sessão é ARQUIVADA
// (status inativo), não apagada fisicamente: sai de todas as métricas, que
// filtram status='ativo', e continua recuperável — respeita RN-009 e não
// destrói histórico por um clique.
export async function deleteAttempt(id, { apagarSessao = false } = {}) {
  let sessionId = null;
  if (apagarSessao) {
    const { data } = await supabase.from("exam_attempts").select("session_id").eq("id", id).maybeSingle();
    sessionId = data?.session_id || null;
  }

  const { error } = await supabase.from("exam_attempts").delete().eq("id", id);
  if (error) throw error;

  if (sessionId) {
    const { error: erroSessao } = await supabase
      .from("study_sessions")
      .update({ status: "inativo" })
      .eq("id", sessionId);
    if (erroSessao) throw erroSessao;
  }
  return { sessaoArquivada: Boolean(sessionId) };
}

// Sessões de simulado cujo exam_attempt não existe mais — resultado do
// comportamento antigo, em que apagar a tentativa deixava a sessão para trás.
// Serve pra tela oferecer a limpeza em vez de o usuário caçar na mão.
export async function listSessoesSimuladoOrfas(userId) {
  const [sessoesRes, attemptsRes] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("id, occurred_at, duration_minutes, session_results(questions_total, correct_total)")
      .eq("user_id", userId)
      .eq("status", "ativo")
      .eq("study_type", "simulado"),
    supabase.from("exam_attempts").select("session_id").eq("user_id", userId).not("session_id", "is", null),
  ]);
  if (sessoesRes.error) throw sessoesRes.error;
  if (attemptsRes.error) throw attemptsRes.error;

  const vinculadas = new Set((attemptsRes.data || []).map((a) => a.session_id));
  return (sessoesRes.data || [])
    .filter((s) => !vinculadas.has(s.id))
    .map((s) => {
      const r = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
      return {
        id: s.id,
        occurredAt: s.occurred_at,
        minutos: Number(s.duration_minutes || 0),
        questoes: Number(r?.questions_total || 0),
        acertos: Number(r?.correct_total || 0),
      };
    });
}

export async function arquivarSessao(sessionId) {
  const { error } = await supabase.from("study_sessions").update({ status: "inativo" }).eq("id", sessionId);
  if (error) throw error;
}
