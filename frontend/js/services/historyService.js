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

// Transferência entre Editais (movido do Dashboard pro Histórico, 03/07/2026
// — decisão do usuário: não é acionável no dia a dia, é mais exploratório,
// mesmo espírito do Comparativo por Concurso acima). Mesmo caderno
// (question_set_id) reaproveitado em concursos diferentes; compara Wilson por
// concurso. Só entra quem tem >=2 concursos distintos — com 1 só não há o que
// comparar. Amplitude = maior Wilson - menor Wilson entre os concursos daquele
// caderno (maior amplitude = desempenho mais disperso entre editais, sinal de
// transferência fraca; não fazemos julgamento automático, só ordenamos pelo
// dado bruto).
export async function getTransferenciaCadernos() {
  const { data, error } = await supabase
    .from("v_transferencia_caderno")
    .select("question_set_id, caderno_nome, discipline_id, exam_id, concurso_nome, questoes_total, wilson_pct");
  if (error) throw error;

  const porCaderno = new Map();
  for (const r of data || []) {
    if (!porCaderno.has(r.question_set_id)) {
      porCaderno.set(r.question_set_id, { cadernoNome: r.caderno_nome, disciplineId: r.discipline_id, concursos: [] });
    }
    porCaderno.get(r.question_set_id).concursos.push({
      concursoNome: r.concurso_nome,
      questoesTotal: r.questoes_total,
      wilsonPct: r.wilson_pct != null ? Number(r.wilson_pct) : null,
    });
  }

  const resultado = [];
  for (const item of porCaderno.values()) {
    if (item.concursos.length < 2) continue;
    const wilsons = item.concursos.map((c) => c.wilsonPct).filter((v) => v != null);
    const amplitude = wilsons.length > 0 ? Math.round((Math.max(...wilsons) - Math.min(...wilsons)) * 10) / 10 : null;
    resultado.push({ ...item, amplitude });
  }
  resultado.sort((a, b) => (b.amplitude ?? 0) - (a.amplitude ?? 0));
  return resultado;
}
