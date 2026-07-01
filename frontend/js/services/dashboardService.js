// dashboardService — Fase 6. Consome as views/funções analíticas da Fase 5
// (nenhum cálculo de Wilson/agregação é refeito aqui — isso mora no banco,
// TEC-006). Este arquivo só busca, junta e ordena o que as views já calcularam.

import { supabase } from "../supabaseClient.js";

const TYPES_WITH_MEASURABLE_RESULT = ["questao", "simulado", "discursiva"];

// KPIs de topo: horas totais, sessões ativas, disciplinas em estudo (qualquer
// tipo, não só mensurável) e o Diagnóstico Wilson geral (v_diagnostico_geral).
export async function getKpis() {
  const [sessionsResult, diagGeralResult] = await Promise.all([
    supabase.from("study_sessions").select("duration_minutes, discipline_id").eq("status", "ativo"),
    supabase.from("v_diagnostico_geral").select("*").maybeSingle(),
  ]);

  if (sessionsResult.error) throw sessionsResult.error;
  if (diagGeralResult.error) throw diagGeralResult.error;

  const sessions = sessionsResult.data || [];
  const horasTotais = sessions.reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0) / 60;
  const disciplinasComSessao = new Set(sessions.map((s) => s.discipline_id)).size;

  return {
    horasTotais: Math.round(horasTotais * 10) / 10,
    sessoesAtivas: sessions.length,
    disciplinasComSessao,
    diagnosticoGeral: diagGeralResult.data || null, // null = nenhuma sessão mensurável ainda
  };
}

// Ranking de Risco: junta Diagnóstico por Disciplina (sempre existe se houver
// sessão mensurável) com Prioridade (só existe se houver peso definido em
// exam_disciplines para aquele par disciplina×concurso). Uma disciplina sem
// peso aparece com weight=null — sem peso definido, não com peso "baixo".
const SEVERIDADE = { critico: 0, atencao: 1, preliminar: 2, consolidado: 3 };

export async function getRankingRisco() {
  const [diagResult, prioResult] = await Promise.all([
    supabase.from("v_diagnostico_disciplina").select("*"),
    supabase.from("v_prioridade").select("*"),
  ]);
  if (diagResult.error) throw diagResult.error;
  if (prioResult.error) throw prioResult.error;

  const pesoPorDisciplina = new Map();
  for (const p of prioResult.data || []) {
    // Se houver mais de um concurso com peso para a mesma disciplina, fica o de peso mais alto.
    const atual = pesoPorDisciplina.get(p.discipline_id);
    if (!atual || (p.weight === "alto" && atual.weight !== "alto")) {
      pesoPorDisciplina.set(p.discipline_id, p);
    }
  }

  const linhas = (diagResult.data || []).map((d) => {
    const peso = pesoPorDisciplina.get(d.discipline_id);
    return {
      disciplineId: d.discipline_id,
      disciplinaNome: d.disciplina_nome,
      questoesTotal: d.questoes_total,
      wilsonPct: d.wilson_pct,
      classificacao: d.classificacao,
      weight: peso?.weight ?? null,
      pesoNumericoPct: peso?.peso_numerico_pct ?? null,
    };
  });

  linhas.sort((a, b) => {
    const sevDiff = SEVERIDADE[a.classificacao] - SEVERIDADE[b.classificacao];
    if (sevDiff !== 0) return sevDiff;
    return (a.wilsonPct ?? 0) - (b.wilsonPct ?? 0);
  });

  return linhas;
}

// Média Móvel Semanal geral (todas as disciplinas), via RPC da Fase 5.
export async function getMediaMovelSemanal() {
  const { data, error } = await supabase.rpc("media_movel_semanal", { p_discipline_id: null });
  if (error) throw error;
  return data || [];
}

// Próxima Ação: seleção em JS (regra de ordenação, não fórmula estatística nova
// — o número (Wilson, classificação) já vem pronto do banco). Prioriza
// disciplinas com peso "alto"; sem nenhuma, cai para a pior classificação geral.
// Ordem de severidade: critico > atencao > preliminar (falta dado) > consolidado.
export function pickProximaAcao(ranking) {
  if (!ranking || ranking.length === 0) return null;
  const comPesoAlto = ranking.filter((r) => r.weight === "alto");
  const pool = comPesoAlto.length > 0 ? comPesoAlto : ranking;
  return pool[0]; // ranking já vem ordenado por severidade/wilson (getRankingRisco)
}

export function hasMeasurableResult(studyType) {
  return TYPES_WITH_MEASURABLE_RESULT.includes(studyType);
}
