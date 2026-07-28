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

// Ajustes pós-cadastro (27/07/2026): corte estimado é classificatório
// (emerge do resultado, muda a cada edição do concurso) e a duração pode ter
// sido esquecida no cadastro — os dois editáveis sem recriar o modelo.
// Estrutura (blocos/critérios) continua imutável de propósito: alterá-la
// invalidaria a comparação entre tentativas já registradas.
export async function updateTemplateBasics(id, { cutoffScore, durationMinutes }) {
  const { error } = await supabase
    .from("exam_templates")
    .update({ cutoff_score: cutoffScore ?? null, duration_minutes: durationMinutes ?? null })
    .eq("id", id);
  if (error) throw error;
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

// Apaga a tentativa; a study_session vinculada NÃO é apagada junto de
// propósito (as horas foram estudadas de verdade — apagar o registro do
// simulado não desfaz o tempo investido). Quem quiser remove a sessão
// manualmente em Sessões.
export async function deleteAttempt(id) {
  const { error } = await supabase.from("exam_attempts").delete().eq("id", id);
  if (error) throw error;
}
