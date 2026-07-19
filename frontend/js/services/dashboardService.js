// dashboardService — Fase 6. Consome as views/funções analíticas da Fase 5
// (nenhum cálculo de Wilson/agregação é refeito aqui — isso mora no banco,
// TEC-006). Este arquivo só busca, junta e ordena o que as views já calcularam.

import { supabase } from "../supabaseClient.js";

const TYPES_WITH_MEASURABLE_RESULT = ["questao", "simulado", "discursiva", "caderno_erros"];

// 19/07/2026 — helper pra formatar Date como YYYY-MM-DD usando os componentes
// LOCAIS (getFullYear/getMonth/getDate), nunca .toISOString().slice(0,10).
// toISOString() converte pra UTC antes de fatiar a string — pra quem está em
// fuso atrás de UTC (Brasil, UTC-3), um horário de fim-de-dia local (23:59:59)
// vira madrugada do dia seguinte em UTC, e a data exibida "vaza" um dia à
// frente do que realmente é no relógio do usuário. Bug real encontrado em
// getMetaSemanalAtual (rótulo mostrava "19/07–26/07", 8 dias, devia ser
// "19/07–25/07", 7 dias, domingo a sábado).
function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 19/07/2026 — normaliza qualquer entrada de data pro MEIO-DIA... não, pra
// MEIA-NOITE local do calendário certo, ANTES de fazer qualquer conta com
// setDate(). Existem dois tipos de entrada nesse arquivo e cada um precisa de
// um tratamento diferente pra chegar no mesmo calendário local:
//   - isDateOnly=true: veio de uma coluna `date` do Postgres (ex.: `dia` de
//     media_movel_semanal), serializada como "2026-07-17" sem hora. String
//     ISO sem hora é interpretada pelo JS como MEIA-NOITE UTC — então pra
//     recuperar o calendário certo tem que ler com getters UTC (getUTCDate
//     etc.), não locais, senão o dia "vaza" pra trás em fuso atrás de UTC.
//   - isDateOnly=false: veio de uma coluna `timestamptz` (ex.: `occurred_at`),
//     um instante de verdade. Aqui é o oposto: tem que ler com getters LOCAIS
//     pra saber em que dia do calendário DO USUÁRIO aquele instante caiu
//     (uma sessão às 22h30 em Brasília é salva como madrugada em UTC).
// Sem essa normalização, medir "de que dia até que dia é essa semana"
// misturava os dois critérios sem querer e podia render 1 dia errado pra
// qualquer lado dependendo de qual delas alimentava a função.
function normalizeToLocalMidnight(dateLike, isDateOnly) {
  const d = new Date(dateLike);
  const y = isDateOnly ? d.getUTCFullYear() : d.getFullYear();
  const m = isDateOnly ? d.getUTCMonth() : d.getMonth();
  const dia = isDateOnly ? d.getUTCDate() : d.getDate();
  return new Date(y, m, dia);
}

// KPIs de topo: horas totais, disciplinas em estudo (qualquer tipo, não só
// mensurável) e o Diagnóstico Wilson geral (v_diagnostico_geral). "Sessões
// ativas" foi removido do retorno (decisão do usuário, 03/07/2026): contagem
// bruta de sessões não diz nada sobre qualidade nem direção, não ajuda a
// decidir nada.
export async function getKpis() {
  const [sessionsResult, diagGeralResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_minutes, discipline_id, session_results(questions_total)")
      .eq("status", "ativo"),
    supabase.from("v_diagnostico_geral").select("*").maybeSingle(),
  ]);

  if (sessionsResult.error) throw sessionsResult.error;
  if (diagGeralResult.error) throw diagGeralResult.error;

  const sessions = sessionsResult.data || [];
  const horasTotais = sessions.reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0) / 60;
  // filter(Boolean) (08/07/2026) — Caderno de Erros pode ter discipline_id
  // null (disciplina não é obrigatória nesse tipo); sem isso, "null" entrava
  // no Set como se fosse mais uma disciplina real, inflando a contagem em 1.
  const disciplinasComSessao = new Set(sessions.map((s) => s.discipline_id).filter(Boolean)).size;
  // Questões resolvidas (13/07/2026, pedido do usuário, substitui "Cadernos
  // estudados" no grid de KPIs) — soma bruta de questions_total de TODA
  // sessão mensurável (questao/simulado/discursiva/caderno_erros). É uma
  // contagem, não uma razão — sem o risco de viés do % de acerto (não há
  // "diluição" possível numa soma simples), então Caderno de Erros conta
  // aqui do mesmo jeito que conta em Horas estudadas.
  const questoesResolvidas = sessions.reduce((acc, s) => {
    const result = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
    return acc + Number(result?.questions_total || 0);
  }, 0);

  return {
    horasTotais: Math.round(horasTotais * 10) / 10,
    disciplinasComSessao,
    questoesResolvidas,
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
//
// Piso de N por semana (08/07/2026, pedido do usuário) — minQuestoes vem de
// tendencia_semanal_min_questoes (Configurações, padrão 50). Semana com
// questoes < minQuestoes fica com pct=null e suficiente=false: some do
// gráfico de % (barra em branco) em vez de mostrar um % instável tipo 100%
// em cima de 3 questões. Validado com o usuário: isso NÃO torna o % das
// semanas restantes "estatisticamente preciso" (IC 95% Wilson ainda largo
// nessa faixa de N) — é só uma barreira contra a distorção mais grosseira.
// Sem acúmulo/merge com a semana seguinte de propósito — cada semana é
// avaliada isolada (decisão do usuário: mais simples e mais fácil de ler do
// que juntar semanas até bater o piso). O volume bruto (questoes/acertos/
// erros) continua sempre exposto mesmo quando insuficiente — só o % some,
// porque só a razão vira enganosa com amostra pequena, volume absoluto não.
//
// Âncora compartilhada (19/07/2026, pedido do usuário) — antes ancorava
// sempre no último dia do próprio `diario` (só tipos mensuráveis). Horas
// Semanais (getHorasSemanais, mais abaixo) ancora no último dia de QUALQUER
// tipo de estudo — se o registro mais recente for de um tipo não-mensurável
// (ex.: Flashcard), as duas grades de semana ficavam deslocadas uma da
// outra (ex.: sábado–sexta vs. domingo–sábado), confuso de comparar lado a
// lado. `ultimaDataOverride` (opcional) permite que dashboardPage.js passe a
// MESMA âncora pros dois — sempre a data de QUALQUER atividade mais recente,
// nunca só a mensurável, já que ela é um superconjunto (toda data mensurável
// também tem atividade "de qualquer tipo", nunca o contrário). Sem o
// override, cai no comportamento antigo (retrocompatível).
export function getTendenciaSemanal(diario, nSemanas = 12, minQuestoes = null, ultimaDataOverride = null) {
  if (!diario || diario.length === 0) {
    return { semanas: [], semanaAtual: null, semanaAnterior: null, deltaSemana: null };
  }
  const ultimaData = ultimaDataOverride
    ? normalizeToLocalMidnight(ultimaDataOverride, false) // veio de occurred_at (timestamptz)
    : normalizeToLocalMidnight(diario[diario.length - 1].dia, true); // veio de `dia` (date)
  const semanas = [];
  for (let w = 0; w < nSemanas; w++) {
    const fim = new Date(ultimaData);
    fim.setDate(fim.getDate() - w * 7);
    const inicio = new Date(fim);
    inicio.setDate(inicio.getDate() - 6);
    const diasNaSemana = diario.filter((d) => {
      const dt = normalizeToLocalMidnight(d.dia, true);
      return dt >= inicio && dt <= fim;
    });
    const questoes = diasNaSemana.reduce((acc, d) => acc + Number(d.questoes || 0), 0);
    const acertos = diasNaSemana.reduce((acc, d) => acc + Number(d.acertos || 0), 0);
    const suficiente = minQuestoes == null || questoes >= minQuestoes;
    semanas.unshift({
      inicio: toLocalISODate(inicio),
      fim: toLocalISODate(fim),
      questoes,
      acertos,
      erros: questoes - acertos, // volume bruto, não % — pedido do usuário (03/07/2026): ver acertos/erros crescendo/encolhendo em número absoluto, não só razão
      pct: questoes > 0 && suficiente ? Math.round((acertos / questoes) * 1000) / 10 : null,
      suficiente,
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

// Meta de Estudo Semanal (13/07/2026, pedido do usuário) — semana de
// CALENDÁRIO (domingo a sábado), diferente de Horas Semanais/Tendência
// Semanal (janela corrida de 7 dias terminando no dado mais recente, feita
// pra OBSERVAR tendência ao longo do tempo). Aqui é meta que reseta no
// calendário, então precisa ser a semana civil atual, não uma janela corrida.
// Só horas e questões (nunca %) — ver comentário de meta_semanal_horas em
// parameterService.js sobre por que % de acerto não vira meta aqui.
//
// Semana anterior (19/07/2026, pedido do usuário) — só os totais (sem
// porDia), pra dar contexto discreto de "quanto rendi na semana passada" no
// início de cada semana nova, quando a semana atual ainda está zerada.
// Deliberadamente NÃO vira um gráfico/comparação de tendência — isso já
// existe em Acertos vs. Erros por Semana / Horas Semanais; aqui é só uma
// referência de fundo, não o foco do widget.
//
// Bug de fuso corrigido (19/07/2026): as datas usavam
// fim.toISOString().slice(0,10), que converte pra UTC antes de fatiar — em
// fuso atrás de UTC (Brasil), o fim do dia local (sábado 23:59:59) virava
// madrugada de domingo em UTC, e o rótulo mostrava "19/07–26/07" (8 dias) em
// vez de "19/07–25/07" (7 dias, domingo a sábado). Trocado por
// toLocalISODate, que usa os componentes locais da data em vez de UTC.
export async function getMetaSemanalAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - hoje.getDay()); // domingo desta semana
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  const inicioAnterior = new Date(inicio);
  inicioAnterior.setDate(inicio.getDate() - 7);
  const fimAnterior = new Date(inicio);
  fimAnterior.setDate(inicio.getDate() - 1);
  fimAnterior.setHours(23, 59, 59, 999);

  const [atualResult, anteriorResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("occurred_at, duration_minutes, session_results(questions_total)")
      .eq("status", "ativo")
      .gte("occurred_at", inicio.toISOString())
      .lte("occurred_at", fim.toISOString()),
    supabase
      .from("study_sessions")
      .select("duration_minutes, session_results(questions_total)")
      .eq("status", "ativo")
      .gte("occurred_at", inicioAnterior.toISOString())
      .lte("occurred_at", fimAnterior.toISOString()),
  ]);
  if (atualResult.error) throw atualResult.error;
  if (anteriorResult.error) throw anteriorResult.error;

  const porDia = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return { dia: toLocalISODate(d), horas: 0, questoes: 0 };
  });

  let horasTotais = 0;
  let questoesTotais = 0;
  for (const s of atualResult.data || []) {
    const horas = Number(s.duration_minutes || 0) / 60;
    const result = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
    const questoes = Number(result?.questions_total || 0);
    horasTotais += horas;
    questoesTotais += questoes;
    const idx = Math.floor((new Date(s.occurred_at) - inicio) / 86400000);
    if (idx >= 0 && idx < 7) {
      porDia[idx].horas += horas;
      porDia[idx].questoes += questoes;
    }
  }

  let horasTotaisAnterior = 0;
  let questoesTotaisAnterior = 0;
  for (const s of anteriorResult.data || []) {
    horasTotaisAnterior += Number(s.duration_minutes || 0) / 60;
    const result = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
    questoesTotaisAnterior += Number(result?.questions_total || 0);
  }

  return {
    inicio: toLocalISODate(inicio),
    fim: toLocalISODate(fim),
    horasTotais: Math.round(horasTotais * 10) / 10,
    questoesTotais,
    porDia: porDia.map((d) => ({ ...d, horas: Math.round(d.horas * 10) / 10 })),
    anteriorHoras: Math.round(horasTotaisAnterior * 10) / 10,
    anteriorQuestoes: questoesTotaisAnterior,
  };
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

// Transferência entre Editais foi movida pra historyService.js (03/07/2026 —
// decisão do usuário: não é acionável no dia a dia, mais exploratória, mesmo
// espírito do Comparativo por Concurso que já vive no Histórico).

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

// Retenção por Disciplina (Fase 6-F, 03/07/2026) — a curva geral acima
// responde "minhas revisões aumentam retenção", mas esconde QUAL disciplina/
// caderno está por trás de cada faixa. Aqui agrega a mesma v_retencao_caderno
// por disciplina em vez de somar tudo junto — permite ver, por exemplo, se
// "30+ dias" está sendo puxado pra baixo por uma disciplina específica.
// Ainda não é por caderno individual (613 cadernos numa tabela seria
// ilegível) — disciplina é o meio-termo entre "geral demais" e "granular demais".
export async function getRetencaoPorDisciplina() {
  const [retencaoResult, disciplinesResult] = await Promise.all([
    supabase.from("v_retencao_caderno").select("discipline_id, faixa, faixa_ordem, questoes_total, acertos_total"),
    supabase.from("disciplines").select("id, name"),
  ]);
  if (retencaoResult.error) throw retencaoResult.error;
  if (disciplinesResult.error) throw disciplinesResult.error;

  const nomePorId = new Map((disciplinesResult.data || []).map((d) => [d.id, d.name]));
  const chave = (disciplineId, faixa) => `${disciplineId}|${faixa}`;
  const porCelula = new Map();
  const faixasVistas = new Map(); // faixa -> faixaOrdem
  const disciplinasVistas = new Map(); // disciplineId -> nome

  for (const r of retencaoResult.data || []) {
    const nome = nomePorId.get(r.discipline_id) || "Sem disciplina";
    disciplinasVistas.set(r.discipline_id, nome);
    faixasVistas.set(r.faixa, r.faixa_ordem);
    const k = chave(r.discipline_id, r.faixa);
    const atual = porCelula.get(k) || { questoes: 0, acertos: 0 };
    atual.questoes += Number(r.questoes_total || 0);
    atual.acertos += Number(r.acertos_total || 0);
    porCelula.set(k, atual);
  }

  const faixasOrdenadas = Array.from(faixasVistas.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([faixa]) => faixa);

  const disciplinas = Array.from(disciplinasVistas.entries())
    .map(([id, nome]) => {
      const faixas = faixasOrdenadas.map((faixa) => {
        const cel = porCelula.get(chave(id, faixa));
        const questoes = cel ? cel.questoes : 0;
        return {
          faixa,
          questoes,
          pct: questoes > 0 ? Math.round((cel.acertos / questoes) * 1000) / 10 : null,
        };
      });
      return { disciplinaNome: nome, faixas };
    })
    .sort((a, b) => a.disciplinaNome.localeCompare(b.disciplinaNome));

  return { faixasOrdenadas, disciplinas };
}

// Horas por Disciplina (Fase 6-D, 03/07/2026) — quebra do KPI único "Horas
// estudadas" por disciplina. Usa TODOS os tipos de estudo (mesmo critério do
// KPI de horas totais) — é alocação de tempo, não razão de acerto, então não
// tem o risco de viés da Eficiência Global (não mistura acerto com hora não
// mensurável, só soma hora bruta).
export async function getHorasPorDisciplina() {
  const [sessionsResult, disciplinesResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_minutes, discipline_id")
      .eq("status", "ativo")
      .not("discipline_id", "is", null),
    supabase.from("disciplines").select("id, name"),
  ]);
  if (sessionsResult.error) throw sessionsResult.error;
  if (disciplinesResult.error) throw disciplinesResult.error;

  const nomePorId = new Map((disciplinesResult.data || []).map((d) => [d.id, d.name]));
  const porDisciplina = new Map();
  // Sessões sem disciplina (Caderno de Erros, Simulado, Flashcard por
  // baralho raiz — 13/07/2026, decisão do usuário) ficam de fora deste
  // gráfico (antes: entravam como pseudo-disciplina "Caderno de Erros"/
  // "Simulado", rótulo por rótulo). Trocado porque esse mapa de rótulos
  // crescia a cada tipo novo liberado pra ficar sem disciplina, e o
  // propósito daqui é comparar disciplina real com disciplina real. Esse
  // tempo continua visível em "Horas por Tipo de Estudo" (getHorasPorTipoEstudo),
  // que agrupa por study_type — presente em toda sessão, sem essa lacuna.
  for (const r of sessionsResult.data || []) {
    const nome = nomePorId.get(r.discipline_id);
    if (!nome) continue;
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

// Horas por Tipo de Estudo (07/07/2026, pedido do usuário) — mesmo espírito de
// getHorasPorDisciplina, mas quebrado por study_type em vez de disciplina:
// responde "estou gastando meu tempo em quê" (questões vs. leitura vs.
// revisão vs. videoaula...), não só "em qual disciplina". Mesmo critério de
// horas totais do KPI (todos os tipos contam, sem cruzar com acerto — só soma
// hora bruta). study_type já vem pronto em study_sessions, sem precisar de
// join com outra tabela.
export async function getHorasPorTipoEstudo() {
  const { data, error } = await supabase.from("study_sessions").select("duration_minutes, study_type").eq("status", "ativo");
  if (error) throw error;

  const porTipo = new Map();
  for (const r of data || []) {
    const atual = porTipo.get(r.study_type) || 0;
    porTipo.set(r.study_type, atual + Number(r.duration_minutes || 0));
  }
  const linhas = Array.from(porTipo.entries()).map(([studyType, minutos]) => ({
    studyType,
    horas: Math.round((minutos / 60) * 10) / 10,
  }));
  linhas.sort((a, b) => b.horas - a.horas);
  return linhas;
}

// Última data de atividade, QUALQUER tipo de estudo (19/07/2026) — âncora
// compartilhada entre getHorasSemanais e getTendenciaSemanal (ver comentário
// em getTendenciaSemanal). É a data mais recente possível, já que "qualquer
// tipo" é superconjunto de "tipo mensurável" — nunca fica atrás da âncora que
// getTendenciaSemanal usaria sozinha.
export async function getUltimaDataAtividade() {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("occurred_at")
    .eq("status", "ativo")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.occurred_at ?? null;
}

// Horas Semanais, valor bruto (07/07/2026, pedido do usuário) — consistência
// de esforço semana a semana. Sem suavização de propósito, mesma decisão já
// tomada pro gráfico de Acertos vs. Erros por Semana: uma semana fraca de
// verdade (viagem, imprevisto, doença) precisa aparecer fraca no gráfico, não
// escondida atrás de uma média móvel. TODOS os tipos de estudo contam (mesmo
// critério do KPI "Horas estudadas"), por isso não reaproveita os blocos
// semanais de getTendenciaSemanal (que só olha tipos mensuráveis) — busca e
// ancora no próprio dia mais recente com qualquer sessão.
//
// ultimaDataOverride (19/07/2026) — mesma âncora compartilhada de
// getTendenciaSemanal (ver comentário lá). Sem o parâmetro, mantém o
// comportamento antigo (ancora na própria última sessão).
export async function getHorasSemanais(nSemanas = 12, ultimaDataOverride = null) {
  const { data, error } = await supabase.from("study_sessions").select("occurred_at, duration_minutes").eq("status", "ativo");
  if (error) throw error;

  const sessoes = data || [];
  if (sessoes.length === 0) return [];

  const ultimaDataRaw =
    ultimaDataOverride ?? sessoes.reduce((max, s) => (s.occurred_at > max ? s.occurred_at : max), sessoes[0].occurred_at);
  const fimTotal = normalizeToLocalMidnight(ultimaDataRaw, false); // occurred_at é timestamptz

  const semanas = [];
  for (let w = 0; w < nSemanas; w++) {
    const fimDia = new Date(fimTotal);
    fimDia.setDate(fimDia.getDate() - w * 7);
    const inicioDia = new Date(fimDia);
    inicioDia.setDate(inicioDia.getDate() - 6);
    // Limite de filtro usa fim-do-dia (23:59:59.999 local), não meia-noite —
    // senão uma sessão feita à tarde/noite do próprio dia-limite (qualquer
    // hora depois de 00:00:00) ficaria de fora por "passar" de fimDia.
    const fimBoundary = new Date(fimDia);
    fimBoundary.setHours(23, 59, 59, 999);
    const minutos = sessoes
      .filter((s) => {
        const dt = new Date(s.occurred_at);
        return dt >= inicioDia && dt <= fimBoundary;
      })
      .reduce((acc, s) => acc + Number(s.duration_minutes || 0), 0);
    semanas.unshift({
      inicio: toLocalISODate(inicioDia),
      fim: toLocalISODate(fimDia),
      horas: Math.round((minutos / 60) * 10) / 10,
    });
  }
  return semanas;
}

// Contadores por Situação (Fase 6-B) — quantos CADERNOS caem em cada
// classificação de Diagnóstico Wilson (v_diagnostico_caderno). Não usa
// question_sets.learning_level (campo nunca ficou de fato preenchido pela
// interface — todas as 1025 linhas do catálogo continuam no valor padrão
// "novo", sem sinal real). Situação real e viva do sistema hoje é a
// classificação Wilson por caderno: preliminar/critico/atencao/consolidado.
const CLASSIFICACOES = ["consolidado", "atencao", "critico", "preliminar"];

// Filtro por caderno ATIVO (19/07/2026) — bug encontrado pelo usuário: clicar
// num card de Situação (ex.: "Atenção") leva pra Prioridade filtrada, mas às
// vezes não retorna nada mesmo o card mostrando "1". Causa: v_diagnostico_caderno
// classifica pelo HISTÓRICO de sessões (não olha se o caderno segue ativo no
// catálogo), enquanto a tela de Prioridade (v_recorrencia_caderno →
// v_prioridade_caderno) exige question_sets.status = 'ativo' — um caderno
// arquivado (Catálogo > Apagar/Arquivar) pode ter classificação Wilson válida
// (dado histórico real) mas nunca vai aparecer em Prioridade, porque essa
// tela é sobre o que priorizar ESTUDAR AGORA, não sobre histórico. Verificado
// no banco (19/07/2026): "Licitação e Contratos Administrativos" tinha
// classificacao='atencao' em v_diagnostico_caderno mas question_sets.status=
// 'inativo', ausente de v_recorrencia_caderno. Como o único propósito destes
// contadores é servir de link pra Prioridade (título do card: "Ver cadernos
// [situação] em Prioridade"), o contador tem que refletir só o que aquele
// clique de fato vai conseguir mostrar — daí o filtro por ativo aqui.
export async function getContadoresSituacao() {
  const [diagResult, cadernosAtivosResult] = await Promise.all([
    supabase.from("v_diagnostico_caderno").select("question_set_id, classificacao"),
    supabase.from("question_sets").select("id").eq("status", "ativo"),
  ]);
  if (diagResult.error) throw diagResult.error;
  if (cadernosAtivosResult.error) throw cadernosAtivosResult.error;

  const idsAtivos = new Set((cadernosAtivosResult.data || []).map((q) => q.id));
  const counts = Object.fromEntries(CLASSIFICACOES.map((c) => [c, 0]));
  for (const row of diagResult.data || []) {
    if (!idsAtivos.has(row.question_set_id)) continue;
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
// pDias (07/07/2026, pedido do usuário): null = vitalício (comportamento
// original); um número = só sessões dos últimos N dias corridos. A função no
// banco já suporta esse filtro nativamente (parâmetro p_dias, sem mudança de
// schema) — só passamos o valor adiante. Motivo de existir: uma média
// vitalícia fica cada vez menos sensível ao presente conforme o total de
// horas acumuladas cresce (uma semana ruim de verdade quase não move mais o
// número) — a versão recente existe pra continuar enxergando o "agora".
export async function getProdutividadeGeral(pDias = null) {
  const { data, error } = await supabase.rpc("eficiencia_caderno", { p_dias: pDias });
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
// usouPesoAlto fica marcado no retorno pra a tela poder explicar o motivo em
// linguagem simples (03/07/2026: texto não pode mais expor % Wilson/badge
// técnico direto — quem não conhece os cortes de classificação não entenderia).
export function pickProximaAcao(ranking) {
  if (!ranking || ranking.length === 0) return null;
  const comPesoAlto = ranking.filter((r) => r.weight === "alto");
  const usouPesoAlto = comPesoAlto.length > 0;
  const pool = usouPesoAlto ? comPesoAlto : ranking;
  return { ...pool[0], usouPesoAlto }; // ranking já vem ordenado por severidade/wilson (getRankingRisco)
}

export function hasMeasurableResult(studyType) {
  return TYPES_WITH_MEASURABLE_RESULT.includes(studyType);
}
