// editalService (03/08/2026) — conteúdo programático e cobertura.
//
// Por que o vínculo é N:N e não "um caderno = um tópico": um tópico do edital
// costuma ser coberto por vários cadernos do TEC (ex.: "Licitações e
// Contratos" cai em 54) e um caderno pode servir a mais de um tópico. Forçar
// 1:1 exigiria reorganizar o catálogo inteiro pra espelhar o edital — e
// destruiria a granularidade de diagnóstico que já existe por caderno.
//
// O gargalo real desta feature não é o código, é o TRABALHO MANUAL de ligar
// tópico a caderno. Por isso `sugerirCadernos` existe: propõe candidatos por
// similaridade de nome, transformando digitação em confirmação.

import { supabase } from "../supabaseClient.js";

const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
// Palavras que aparecem em quase todo nome de caderno/tópico e não ajudam a
// discriminar — se entrassem no cálculo, "Lei nº X" pareceria similar a
// "Lei nº Y" só por causa de "lei".
const STOPWORDS = new Set([
  "de","da","do","das","dos","e","a","o","as","os","em","no","na","nos","nas","para","por","com","sem",
  "the","lei","art","arts","artigo","artigos","n","nº","seus","sua","suas","seu","ou","ao","aos","que",
  "tópicos","topicos","mesclados","demais","temas","outras","outros","questões","questoes","geral","gerais",
]);

function tokens(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export async function listTopics(examId) {
  const { data, error } = await supabase
    .from("exam_topics")
    .select("id, exam_id, discipline_id, parent_id, position, name, expected_questions, notes")
    .eq("exam_id", examId)
    .order("position");
  if (error) throw error;
  return data;
}

export async function listVinculos(examId) {
  // Traz os vínculos dos tópicos deste edital (join implícito via topic).
  const { data, error } = await supabase
    .from("exam_topic_question_sets")
    .select("id, topic_id, question_set_id, exam_topics!inner(exam_id)")
    .eq("exam_topics.exam_id", examId);
  if (error) throw error;
  return (data || []).map((v) => ({ id: v.id, topicId: v.topic_id, questionSetId: v.question_set_id }));
}

export async function listCobertura(examId) {
  const { data, error } = await supabase
    .from("v_edital_cobertura")
    .select("topic_id, discipline_id, disciplina_nome, position, topico_nome, expected_questions, cadernos_vinculados, questoes, acertos, wilson_pct, ultimo_estudo, situacao")
    .eq("exam_id", examId)
    .order("position");
  if (error) throw error;
  return (data || []).map((r) => ({
    topicId: r.topic_id,
    disciplineId: r.discipline_id,
    disciplinaNome: r.disciplina_nome,
    topicoNome: r.topico_nome,
    expectedQuestions: r.expected_questions,
    cadernosVinculados: r.cadernos_vinculados,
    questoes: Number(r.questoes || 0),
    acertos: Number(r.acertos || 0),
    wilson: r.wilson_pct == null ? null : Number(r.wilson_pct),
    ultimoEstudo: r.ultimo_estudo,
    situacao: r.situacao,
  }));
}

// linhas: [{ name, disciplineId, expectedQuestions }] — cadastro em lote a
// partir de texto colado do edital. Em lote de propósito: digitar 100 tópicos
// um a um num formulário seria o suficiente pra feature morrer no primeiro dia.
export async function createTopics({ userId, examId, linhas }) {
  const { data: existentes, error: errExist } = await supabase
    .from("exam_topics")
    .select("position")
    .eq("exam_id", examId)
    .order("position", { ascending: false })
    .limit(1);
  if (errExist) throw errExist;
  let pos = existentes && existentes.length ? Number(existentes[0].position) + 1 : 0;

  const payload = linhas.map((l) => ({
    user_id: userId,
    exam_id: examId,
    discipline_id: l.disciplineId || null,
    name: l.name,
    expected_questions: l.expectedQuestions ?? null,
    position: pos++,
  }));
  const { data, error } = await supabase.from("exam_topics").insert(payload).select("id, name, discipline_id, position");
  if (error) throw error;
  return data;
}

export async function deleteTopic(id) {
  const { error } = await supabase.from("exam_topics").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTopic(id, { name, disciplineId, expectedQuestions }) {
  const { error } = await supabase
    .from("exam_topics")
    .update({ name, discipline_id: disciplineId || null, expected_questions: expectedQuestions ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function vincularCaderno({ userId, topicId, questionSetId }) {
  const { error } = await supabase
    .from("exam_topic_question_sets")
    .insert({ user_id: userId, topic_id: topicId, question_set_id: questionSetId });
  // 23505 = já vinculado; não é erro do ponto de vista do usuário.
  if (error && error.code !== "23505") throw error;
}

export async function desvincularCaderno(id) {
  const { error } = await supabase.from("exam_topic_question_sets").delete().eq("id", id);
  if (error) throw error;
}

// Sugere cadernos para um tópico por sobreposição de tokens. Heurística
// simples de propósito: o objetivo não é acertar sozinha, é encurtar a lista
// de 1120 cadernos pra uma dúzia de candidatos que o usuário confirma com um
// clique. Restringe à disciplina do tópico — cruzar disciplinas geraria ruído.
export function sugerirCadernos(topico, cadernos, { limite = 12 } = {}) {
  const alvo = tokens(topico.name);
  if (alvo.length === 0) return [];
  const alvoSet = new Set(alvo);

  return cadernos
    .filter((c) => !topico.disciplineId || c.discipline_id === topico.disciplineId)
    .map((c) => {
      const t = tokens(c.name);
      if (t.length === 0) return { caderno: c, score: 0 };
      let comuns = 0;
      for (const tok of new Set(t)) if (alvoSet.has(tok)) comuns += 1;
      // Normaliza pelo tamanho do MENOR conjunto: um tópico curto ("Modalidades")
      // não deve ser penalizado por bater com um caderno de nome longo.
      const score = comuns / Math.min(alvoSet.size, new Set(t).size);
      return { caderno: c, score, comuns };
    })
    .filter((x) => x.comuns > 0)
    .sort((a, b) => b.score - a.score || b.comuns - a.comuns)
    .slice(0, limite);
}
