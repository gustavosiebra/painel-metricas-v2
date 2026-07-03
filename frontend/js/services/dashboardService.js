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

// Tendência Semanal (Fase 6-C, 03/07/2026) — o gráfico diário original virou
// ilegível com o volume de dados de teste (400 dias plotados, um por um).
// Aqui reagrupamos os mesmos dias diários (já buscados por
// getMediaMovelSemanal) em blocos de 7 dias corridos, terminando no dia mais
// recente com dado — nenhum cálculo estatístico novo, só soma de
// questoes/acertos já retornados pela RPC e uma razão simples (mesmo padrão
// de getProdutividadeGeral: soma bruta primeiro, divide uma vez só).
// n_semanas=12 (~3 meses) é uma escolha de exibição, não um corte estatístico.
export function getTendenciaSemanal(diario, nSemanas = 12) {
  if (!diario || diario.length === 0) {
    return { semanas: [], semanaAtual: null, semanaAnterior: null, deltaSemana: null };
  }
  const ultimaData = new Date(diario[diario.length - 1].dia);
  const semanas = [];
  for (let w = 0; w < nSemanas; w++) {
    const fim = new Date(ultimaData);
    fim.setDate(fim.getDate() - w * 7);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 6);
    const diasNaSemana = diario.filter((d) => {
      const dt = new Date(d.dia);
      return dt >= inicio && dt <= fim;
    });
    const questoes = diasNaSemana.reduce((acc, d) => acc + Number(d.questoes || 0), 0);
    const acertos = diasNaSemana.reduce((acc, d) => acc + Number(d.acertos || 0), 0);
    semanas.unshift({
      inicio: inicio.toISOString().slice(0, 10),
      fim: fim.toISOString().slice(0, 10),
      questoes,
      acertos,
      erros: questoes - acertos, // volume bruto, não % — pedido do usuário (03/07/2026): ver acertos/erros crescendo/encolhendo em número absoluto, não só razão
      pct: questoes > 0 ? Math.round((acertos / questoes) * 1000) / 10 : null,
    });
  }
  const semanaAtual = semanas[semanas.length - 1] ?? null;
  const semanaAnterior = semanas[semanas.length - 2] ?? null;
  const deltaSemana =
    semanaAtual?.pct != null && semanaAnterior?.pct != null
      ? Math.round((semanaAtual.pct - semanaAnterior.pct) * 10) / 10
      : null;
  return { semanas, semanaAtual, semanaAnterior, deltaSemana };
}

// Janela de Tendência por Disciplina (view já existia desde a Fase 5,
// v_janela_tendencia, nunca tinha sido exposta em tela nenhuma). Compara as
// últimas ~100 questões (curta) com as últimas ~300 (longa) por disciplina —
// responde "em quais disciplinas realmente evoluí" e "tendência subir ou
// estagnar", olhando desempenho recente vs. desempenho de janela mais longa,
// não percentual acumulado desde o início.
// Faixa de "estável" (+-3 pontos percentuais) é uma escolha de exibição para
// não rotular ruído de amostra pequena como tendência real — não é um corte
// estatístico validado, só um filtro de sensibilidade.
const BANDA_ESTAVEL_PP = 3;

function classificarTendencia(pctCurta, pctLonga) {
  if (pctCurta == null || pctLonga == null) return { delta: null, tendencia: null };
  const delta = Math.round((pctCurta - pctLonga) * 10) / 10;
  const tendencia = delta > BANDA_ESTAVEL_PP ? "subindo" : delta < -BANDA_ESTAVEL_PP ? "caindo" : "estavel";
  return { delta, tendencia };
}

export async function getJanelaTendenciaDisciplina() {
  const { data, error } = await supabase
    .from("v_janela_tendencia")
    .select("discipline_id, disciplina_nome, pct_janela_curta, pct_janela_longa, questoes_janela_curta, questoes_janela_longa");
  if (error) throw error;
  const linhas = (data || []).map((r) => {
    const { delta, tendencia } = classificarTendencia(Number(r.pct_janela_curta), Number(r.pct_janela_longa));
    return {
      disciplinaNome: r.disciplina_nome,
      pctCurta: r.pct_janela_curta != null ? Number(r.pct_janela_curta) : null,
      pctLonga: r.pct_janela_longa != null ? Number(r.pct_janela_longa) : null,
      questoesCurta: r.questoes_janela_curta,
      questoesLonga: r.questoes_janela_longa,
      delta,
      tendencia,
    };
  });
  linhas.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
  return linhas;
}

// Janela de Tendência por Caderno (view nova, migration
// janela_tendencia_caderno_e_transferencia_editais) — mesma lógica, granularidade
// mais fina. Só mostramos os cadernos com volume mínimo na janela longa
// (>=20 questões) pra não poluir com ruído de amostra muito pequena, e
// limitamos a quem mais subiu/caiu (não é lista completa de todos os cadernos).
export async function getJanelaTendenciaCadernoDestaques(nDestaques = 5) {
  const { data, error } = await supabase
    .from("v_janela_tendencia_caderno")
    .select("question_set_id, caderno_nome, discipline_id, pct_janela_curta, pct_janela_longa, questoes_janela_curta, questoes_janela_longa")
    .gte("questoes_janela_longa", 20);
  if (error) throw error;
  const linhas = (data || []).map((r) => {
    const { delta, tendencia } = classificarTendencia(Number(r.pct_janela_curta), Number(r.pct_janela_longa));
    return {
      cadernoNome: r.caderno_nome,
      pctCurta: r.pct_janela_curta != null ? Number(r.pct_janela_curta) : null,
      pctLonga: r.pct_janela_longa != null ? Number(r.pct_janela_longa) : null,
      questoesLonga: r.questoes_janela_longa,
      delta,
      tendencia,
    };
  });
  const comDelta = linhas.filter((l) => l.delta != null);
  comDelta.sort((a, b) => b.delta - a.delta);
  const subindo = comDelta.slice(0, nDestaques);
  const caindo = comDelta.slice(-nDestaques).reverse();
  return { subindo, caindo };
}

// Transferência entre Editais (view nova) — o MESMO caderno reaproveitado em
// concursos diferentes; compara Wilson por concurso. Só entra na lista quem
// tem >=2 concursos distintos — com 1 só não há o que comparar. Amplitude =
// maior Wilson - menor Wilson entre os concursos daquele caderno (maior
// amplitude = desempenho mais disperso entre editais, sinal de transferência
// fraca; não fazemos julgamento automático, só ordenamos pelo dado bruto).
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

// Retenção agregada por faixa de intervalo (Fase 6-C) — v_retencao_caderno já
// existia por caderno individual (proxy, não por questão — question_attempts
// vazio, ver comentário da migration 0026). Aqui somamos TODOS os cadernos por
// faixa pra ter uma curva geral: "quando eu volto a estudar algo depois de N
// dias, qual o acerto típico?" — responde "minhas revisões estão aumentando
// minha retenção" olhando se o acerto sobe conforme o intervalo diminui.
export async function getRetencaoGeral() {
  const { data, error } = await supabase
    .from("v_retencao_caderno")
    .select("faixa, faixa_ordem, questoes_total, acertos_total");
  if (error) throw error;

  const porFaixa = new Map();
  for (const r of data || []) {
    const atual = porFaixa.get(r.faixa) || { faixa: r.faixa, faixaOrdem: r.faixa_ordem, questoes: 0, acertos: 0 };
    atual.questoes += Number(r.questoes_total || 0);
    atual.acertos += Number(r.acertos_total || 0);
    porFaixa.set(r.faixa, atual);
  }
  const linhas = Array.from(porFaixa.values()).map((f) => ({
    ...f,
    pct: f.questoes > 0 ? Math.round((f.acertos / f.questoes) * 1000) / 10 : null,
  }));
  linhas.sort((a, b) => a.faixaOrdem - b.faixaOrdem);
  return linhas;
}

// Horas por Disciplina (Fase 6-D, 03/07/2026) — quebra do KPI único "Horas
// estudadas" por disciplina. Usa TODOS os tipos de estudo (mesmo critério do
// KPI de horas totais) — é alocação de tempo, não razão de acerto, então não
// tem o risco de viés da Eficiência Global (não mistura acerto com hora não
// mensurável, só soma hora bruta).
export async function getHorasPorDisciplina() {
  const [sessionsResult, disciplinesResult] = await Promise.all([
    supabase.from("study_sessions").select("duration_minutes, discipline_id").eq("status", "ativo"),
    supabase.from("disciplines").select("id, name"),
  ]);
  if (sessionsResult.error) throw sessionsResult.error;
  if (disciplinesResult.error) throw disciplinesResult.error;

  const nomePorId = new Map((disciplinesResult.data || []).map((d) => [d.id, d.name]));
  const porDisciplina = new Map();
  for (const r of sessionsResult.data || []) {
    const nome = nomePorId.get(r.discipline_id) || "Sem disciplina";
    const atual = porDisciplina.get(nome) || 0;
    porDisciplina.set(nome, atual + Number(r.duration_minutes || 0));
  }
  const linhas = Array.from(porDisciplina.entries()).map(([disciplinaNome, minutos]) => ({
    disciplinaNome,
    horas: Math.round((minutos / 60) * 10) / 10,
  }));
  linhas.sort((a, b) => b.horas - a.horas);
  return linhas;
}

// Contadores por Situação (Fase 6-B) — quantos CADERNOS caem em cada
// classificação de Diagnóstico Wilson (v_diagnostico_caderno). Não usa
// question_sets.learning_level (campo nunca ficou de fato preenchido pela
// interface — todas as 1025 linhas do catálogo continuam no valor padrão
// "novo", sem sinal real). Situação real e viva do sistema hoje é a
// classificação Wilson por caderno: preliminar/critico/atencao/consolidado.
const CLASSIFICACOES = ["consolidado", "atencao", "critico", "preliminar"];

export async function getContadoresSituacao() {
  const { data, error } = await supabase.from("v_diagnostico_caderno").select("classificacao");
  if (error) throw error;

  const counts = Object.fromEntries(CLASSIFICACOES.map((c) => [c, 0]));
  for (const row of data || []) {
    if (row.classificacao in counts) counts[row.classificacao] += 1;
  }
  return counts;
}

// Produtividade e Eficiência geral (Fase 6-B) — eficiencia_caderno() (Fase 5)
// devolve uma linha por caderno já com as razões calculadas (acertos/hora,
// questões/hora); aqui somamos os números BRUTOS (acertos, horas, questões)
// de todos os cadernos e dividimos uma única vez, para não cair em média de
// médias (evita viés tipo paradoxo de Simpson — caderno com poucas horas não
// pode pesar igual a um com muitas).
//
// Eficiência Global (acertos/hora TOTAL, incluindo revisão/flashcard/leitura/
// videoaula) foi removida daqui por decisão do usuário (03/07/2026): misturar
// acerto (que só existe pra questão/simulado/discursiva) com horas totais
// (que incluem tipos sem acerto nenhum) produz um número enviesado — parece
// "eficiência" mas na prática mede outra coisa. Horas totais continuam
// disponíveis sozinhas (KPI "Horas estudadas"), sem cruzar com acerto.
export async function getProdutividadeGeral() {
  const { data, error } = await supabase.rpc("eficiencia_caderno", { p_dias: null });
  if (error) throw error;

  const rows = data || [];
  let acertos = 0;
  let horasMensuravel = 0;
  let questoes = 0;
  for (const r of rows) {
    acertos += Number(r.acertos_mensuravel || 0);
    horasMensuravel += Number(r.horas_mensuravel || 0);
    questoes += Number(r.questoes_total || 0);
  }

  return {
    eficienciaEstrita: horasMensuravel > 0 ? Math.round((acertos / horasMensuravel) * 100) / 100 : null,
    produtividade: horasMensuravel > 0 ? Math.round((questoes / horasMensuravel) * 100) / 100 : null,
  };
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
