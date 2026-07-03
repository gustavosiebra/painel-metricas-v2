// priorityService — leitura de v_prioridade_caderno (Fase 5-B / recorrência
// histórica cruzada com Wilson do caderno). Só leitura — a view já faz todo
// o cálculo no banco (RLS + security_invoker cuidam do escopo por usuário).

import { supabase } from "../supabaseClient.js";

export async function listPriority({ disciplineId } = {}) {
  let query = supabase
    .from("v_prioridade_caderno")
    .select(
      "question_set_id, caderno_nome, discipline_id, disciplina_nome, bancas_consideradas, recorrencia_ajustada, classificacao_recorrencia, classificacao_dispersao, questoes_total, wilson_pct, classificacao_wilson, prioridade_rank, classificacao_prioridade"
    )
    .order("prioridade_rank", { ascending: true });

  if (disciplineId) query = query.eq("discipline_id", disciplineId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
