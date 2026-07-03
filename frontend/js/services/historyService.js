// historyService — Fase 7 (Histórico). Consome as views/funções da Fase 5/6;
// nenhum cálculo estatístico novo aqui (TEC-006).

import { supabase } from "../supabaseClient.js";

export async function getEvolucaoMensal(disciplineId) {
  let query = supabase.from("v_evolucao_mensal").select("*").order("mes", { ascending: true });
  if (disciplineId) query = query.eq("discipline_id", disciplineId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getMediaMovelSemanal(disciplineId) {
  const { data, error } = await supabase.rpc("media_movel_semanal", { p_discipline_id: disciplineId || null });
  if (error) throw error;
  return data || [];
}

export async function getComparativoBanca() {
  const { data, error } = await supabase.from("v_comparativo_banca").select("*").order("wilson_pct", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getComparativoConcurso() {
  const { data, error } = await supabase.from("v_comparativo_concurso").select("*").order("wilson_pct", { ascending: true });
  if (error) throw error;
  return data || [];
}
