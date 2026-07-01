// weightService — Peso (weight) por disciplina × concurso (exam_disciplines).
// Antecipado da Fase 7 (Parâmetros) para a Fase 5, por decisão do usuário: a
// métrica Prioridade (Peso × Diagnóstico Wilson, NEG-007) precisa de dado real
// de peso para não ficar vazia até a Fase 7 ter uma tela completa de parâmetros.
// exam_disciplines é tabela Pessoal (sempre user_id = auth.uid(), RLS estrito) —
// não é dado histórico de estudo (RN-009 não se aplica), então permite
// update/delete diretos.

import { supabase } from "../supabaseClient.js";

export async function listWeights() {
  const { data, error } = await supabase
    .from("exam_disciplines")
    .select("id, exam_id, discipline_id, weight, target_accuracy, expected_questions, exams(name), disciplines(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Upsert por (user_id, exam_id, discipline_id) — unique constraint já existe no banco.
export async function upsertWeight({ userId, examId, disciplineId, weight, targetAccuracy, expectedQuestions }) {
  const { data, error } = await supabase
    .from("exam_disciplines")
    .upsert(
      {
        user_id: userId,
        exam_id: examId,
        discipline_id: disciplineId,
        weight,
        target_accuracy: targetAccuracy || null,
        expected_questions: expectedQuestions || null,
      },
      { onConflict: "user_id,exam_id,discipline_id" }
    )
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWeight(id) {
  const { error } = await supabase.from("exam_disciplines").delete().eq("id", id);
  if (error) throw error;
}
