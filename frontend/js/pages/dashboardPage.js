// Dashboard (Fase 6) — KPIs, Ranking de Risco, Próxima Ação e gráfico de
// Média Móvel Semanal. Consome as views/funções analíticas da Fase 5; nenhum
// cálculo estatístico é refeito aqui (TEC-006).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { navigate } from "../router.js";
import { getState } from "../state.js";
import { formatPct, formatDeltaPct } from "../utils/format.js";
import { getParam } from "../services/parameterService.js";
import {
  getKpis,
  getRankingRisco,
  getMediaMovelSemanal,
  getContadoresSituacao,
  getProdutividadeGeral,
  getTendenciaSemanal,
  getJanelaTendenciaDisciplina,
  getJanelaTendenciaCadernoDestaques,
  getRetencaoPorDisciplina,
  getHorasPorDisciplina,
  getHorasPorTipoEstudo,
  getHorasSemanais,
  getMetaSemanalAtual,
  pickProximaAcao,
} from "../services/dashboardService.js";

// "Preliminares" foi trocado por "Poucos dados" (pedido do usuário,
// 03/07/2026) — o termo técnico não deixava claro que só significa "ainda não
// há questões suficientes pra classificar", não é uma categoria de resultado.
const SITUACAO_LABELS = {
  consolidado: { label: "Consolidados", color: "var(--color-success)" },
  atencao: { label: "Atenção", color: "#b45309" },
  critico: { label: "Críticos", color: "var(--color-error)" },
  preliminar: { label: "Poucos dados", color: "var(--color-text-muted)" },
};

// Rótulo no singular/acentuado da mesma classificação acima (04/07/2026) —
// usado no badge de Próxima Ação e no Ranking de Risco, onde o texto aparece
// junto de UM item ("Edificações (Crítico)"), não uma contagem plural.
const CLASSIFICACAO_LABEL = {
  consolidado: "Consolidado",
  atencao: "Atenção",
  critico: "Crítico",
  preliminar: "Poucos dados",
};

// Rótulos de study_type (07/07/2026) — mesmo texto usado em sessionsPage.js,
// duplicado aqui de propósito (mesmo padrão já usado pros outros rótulos
// acima nesta página, em vez de criar um módulo compartilhado só pra isso).
const STUDY_TYPE_LABELS = {
  questao: "Questões",
  simulado: "Simulado",
  discursiva: "Discursiva",
  revisao: "Revisão",
  flashcard: "Flashcard",
  leitura: "Leitura",
  videoaula: "Videoaula",
  caderno_erros: "Caderno de Erros",
};

let chartMediaMovelInstance = null;
let chartAcertosErrosInstance = null;
let chartHorasInstance = null;
let chartHorasTipoInstance = null;
let chartRetencaoInstance = null;
let chartHorasSemanaisInstance = null;
let chartMetaSemanalInstance = null;

export async function renderDashboardPage(container) {
  // Sem H2 "Dashboard" na página (pedido do usuário, 03/07/2026) — o nome já
  // está na aba de navegação, repetir aqui só ocupa espaço sem dizer nada novo.
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/dashboard")}
        <main class="app-content">
          <div class="print-header">
            <h1>Painel de Métricas — Dashboard</h1>
            <p>Exportado em ${escapeHtml(new Date().toLocaleString("pt-BR"))}</p>
          </div>
          <div class="dashboard-toolbar" style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; margin-bottom:var(--spacing-3);">
            <a href="#/sessoes/nova" class="btn" style="width:auto; padding:8px 16px;">+ Nova Sessão</a>
            <button id="export-img-btn" class="btn" style="width:auto; padding:8px 16px; background:var(--color-surface); color:var(--color-primary); border:1px solid var(--color-border);">Exportar Imagem</button>
          </div>
          <div id="dashboard-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  // Exportar PDF foi removido (pedido do usuário, 05/07/2026) — a Exportar
  // Imagem abaixo cobre o caso de uso real (compartilhar de forma fluida),
  // e evita manter duas opções redundantes na tela.

  // Exportar Imagem (Fase 10, 05/07/2026) — pedido do usuário pra compartilhar
  // num grupo de WhatsApp: uma única imagem PNG contínua, sem paginação
  // nenhuma (diferente do PDF, que sempre corta em folhas). Usa html2canvas
  // (vendorizada localmente, mesmo padrão do Chart.js) pra capturar o
  // dashboard inteiro como está na tela. onclone só mexe numa cópia
  // temporária do DOM feita pela própria lib — a tela real do usuário não é
  // alterada em nenhum momento.
  const exportImgBtn = container.querySelector("#export-img-btn");
  if (exportImgBtn) {
    exportImgBtn.addEventListener("click", async () => {
      const textoOriginal = exportImgBtn.textContent;
      exportImgBtn.disabled = true;
      exportImgBtn.textContent = "Gerando imagem…";
      try {
        const alvo = container.querySelector(".app-content");
        const canvasImagem = await html2canvas(alvo, {
          backgroundColor: "#f5f6f8",
          scale: 2,
          useCORS: true,
          ignoreElements: (el) => el.classList?.contains("dashboard-toolbar"),
          onclone: (clonedDoc) => {
            const header = clonedDoc.querySelector(".print-header");
            if (header) header.style.display = "block";
          },
        });
        const hoje = new Date().toISOString().slice(0, 10);
        const link = document.createElement("a");
        link.href = canvasImagem.toDataURL("image/png");
        link.download = `metricas-${hoje}.png`;
        link.click();
      } catch (err) {
        window.alert("Erro ao gerar imagem: " + (err.message || "desconhecido"));
      } finally {
        exportImgBtn.disabled = false;
        exportImgBtn.textContent = textoOriginal;
      }
    });
  }

  const content = container.querySelector("#dashboard-content");
  const { user } = getState();

  let kpis, ranking, mediaMovelDiaria, situacao, produtividadeVitalicia, produtividadeRecente, janelaDisciplina, janelaCaderno, retencaoPorDisciplina, horasPorDisciplina, horasPorTipoEstudo, horasSemanais, metaSemanal, janelaProdutividadeDias, tendenciaMinQuestoes, metaHoras, metaQuestoes;
  try {
    // Janela de Produtividade Recente (07/07/2026, pedido do usuário) —
    // configurável em Configurações (padrão 28 dias); busca ANTES do
    // Promise.all principal porque getProdutividadeGeral(janela) depende
    // desse valor. Piso de N da Tendência Semanal (08/07/2026) e Metas de
    // Estudo Semanal (13/07/2026) seguem o mesmo padrão — buscados à parte
    // porque só são usados DEPOIS do Promise.all principal.
    [janelaProdutividadeDias, tendenciaMinQuestoes, metaHoras, metaQuestoes] = await Promise.all([
      getParam(user.id, "produtividade_janela_dias"),
      getParam(user.id, "tendencia_semanal_min_questoes"),
      getParam(user.id, "meta_semanal_horas"),
      getParam(user.id, "meta_semanal_questoes"),
    ]);

    [
      kpis,
      ranking,
      mediaMovelDiaria,
      situacao,
      produtividadeVitalicia,
      produtividadeRecente,
      janelaDisciplina,
      janelaCaderno,
      retencaoPorDisciplina,
      horasPorDisciplina,
      horasPorTipoEstudo,
      horasSemanais,
      metaSemanal,
    ] = await Promise.all([
      getKpis(),
      getRankingRisco(),
      getMediaMovelSemanal(),
      getContadoresSituacao(),
      getProdutividadeGeral(null),
      getProdutividadeGeral(janelaProdutividadeDias),
      getJanelaTendenciaDisciplina(),
      getJanelaTendenciaCadernoDestaques(),
      getRetencaoPorDisciplina(),
      getHorasPorDisciplina(),
      getHorasPorTipoEstudo(),
      getHorasSemanais(),
      getMetaSemanalAtual(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar dashboard: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const proximaAcao = pickProximaAcao(ranking);
  const tendenciaSemanal = getTendenciaSemanal(mediaMovelDiaria, 12, tendenciaMinQuestoes);

  // Ordem por impacto de decisão (03/07/2026), não pela ordem em que cada
  // métrica foi construída: 1) visão geral (KPIs + Cadernos por Situação),
  // 2) ação concreta (Próxima Ação + Ranking), 3) tendência ao longo do tempo,
  // 4) aprofundamento (Janela, Transferência, Retenção) pra quem quer investigar mais.
  content.innerHTML = `
    ${renderVisaoGeral(kpis, produtividadeVitalicia, produtividadeRecente, janelaProdutividadeDias, situacao)}
    ${renderMetaSemanal(metaSemanal, metaHoras, metaQuestoes)}
    ${renderProximaAcao(proximaAcao)}
    ${renderRanking(ranking)}
    ${renderMediaMovelSemanal(tendenciaSemanal)}
    ${renderAcertosErrosSemana(tendenciaSemanal)}
    ${renderHorasSemanais(horasSemanais)}
    ${renderHorasPorDisciplina(horasPorDisciplina)}
    ${renderHorasPorTipoEstudo(horasPorTipoEstudo)}
    ${renderJanelaTendenciaDisciplina(janelaDisciplina)}
    ${renderJanelaTendenciaCaderno(janelaCaderno)}
    ${renderRetencaoPorDisciplina(retencaoPorDisciplina)}
  `;

  // Cards de Situação clicáveis (05/07/2026) — levam pra Prioridade já
  // filtrada pela classificação clicada (ver renderVisaoGeral).
  content.querySelectorAll("[data-situacao-link]").forEach((el) => {
    el.addEventListener("click", () => navigate("/prioridade", { classificacao: el.dataset.situacaoLink }));
  });

  // Cada gráfico é isolado no próprio try/catch: um erro de desenho (ex.:
  // Chart.js não carregado) não pode derrubar os outros gráficos do dashboard.
  // Meta de Estudo Semanal — sempre desenha (7 dias fixos, mesmo que todos
  // zerados, diferente dos gráficos abaixo que só desenham com dado real).
  let metaMetricaAtual = "horas";
  tentarDesenhar(content, "meta-semanal-chart", () => renderChartMetaSemanal(content.querySelector("#meta-semanal-chart"), metaSemanal.porDia, metaMetricaAtual));
  const metaBtnHoras = content.querySelector("#meta-toggle-horas");
  const metaBtnQuestoes = content.querySelector("#meta-toggle-questoes");
  function estilizarToggle(btn, ativo) {
    btn.style.background = ativo ? "var(--color-primary)" : "var(--color-surface)";
    btn.style.color = ativo ? "#fff" : "var(--color-primary)";
    btn.style.border = ativo ? "1px solid var(--color-primary)" : "1px solid var(--color-border)";
  }
  function atualizarMetaToggle() {
    estilizarToggle(metaBtnHoras, metaMetricaAtual === "horas");
    estilizarToggle(metaBtnQuestoes, metaMetricaAtual === "questoes");
  }
  atualizarMetaToggle();
  metaBtnHoras.addEventListener("click", () => {
    metaMetricaAtual = "horas";
    atualizarMetaToggle();
    tentarDesenhar(content, "meta-semanal-chart", () => renderChartMetaSemanal(content.querySelector("#meta-semanal-chart"), metaSemanal.porDia, metaMetricaAtual));
  });
  metaBtnQuestoes.addEventListener("click", () => {
    metaMetricaAtual = "questoes";
    atualizarMetaToggle();
    tentarDesenhar(content, "meta-semanal-chart", () => renderChartMetaSemanal(content.querySelector("#meta-semanal-chart"), metaSemanal.porDia, metaMetricaAtual));
  });

  if (tendenciaSemanal.semanas.length > 0) {
    tentarDesenhar(content, "media-movel-chart", () => renderChartMediaMovel(content.querySelector("#media-movel-chart"), tendenciaSemanal.semanas, tendenciaMinQuestoes));
    tentarDesenhar(content, "acertos-erros-chart", () => renderChartAcertosErros(content.querySelector("#acertos-erros-chart"), tendenciaSemanal.semanas));
  }
  if (horasSemanais.length > 0) {
    tentarDesenhar(content, "horas-semanais-chart", () => renderChartHorasSemanais(content.querySelector("#horas-semanais-chart"), horasSemanais));
  }
  if (horasPorDisciplina.length > 0) {
    tentarDesenhar(content, "horas-disciplina-chart", () => renderChartHoras(content.querySelector("#horas-disciplina-chart"), horasPorDisciplina));
  }
  if (horasPorTipoEstudo.length > 0) {
    tentarDesenhar(content, "horas-tipo-chart", () => renderChartHorasTipo(content.querySelector("#horas-tipo-chart"), horasPorTipoEstudo));
  }
}

// Antes falhava em silêncio (canvas ficava em branco, sem pista nenhuma) —
// normalmente Chart.js não carregou (CDN bloqueado/rede), já que a lib vem
// de um <script> externo no index.html.
function tentarDesenhar(content, canvasId, desenhar) {
  try {
    desenhar();
  } catch (err) {
    const canvasEl = content.querySelector(`#${canvasId}`);
    if (canvasEl) {
      canvasEl.outerHTML = `<div class="alert alert--error">Erro ao desenhar o gráfico: ${escapeHtml(err.message)}. Verifique se o Chart.js carregou (console do navegador) — provável CDN bloqueado.</div>`;
    }
  }
}

// Visão Geral (Fase 6-G, 04/07/2026): KPIs + Contadores por Situação num
// ÚNICO grid, não dois grids empilhados. Antes cada bloco tinha seu próprio
// <div class="kpi-grid">, e como um tinha 6 cartões e o outro 4, o auto-fit do
// CSS gerava colunas de largura DIFERENTE em cada bloco — as colunas não
// alinhavam entre as duas fileiras. Num grid só, os cartões compartilham as
// mesmas trilhas de coluna, garantindo alinhamento vertical e horizontal.
// "Diagnóstico geral" virou "Desempenho geral". "Sessões ativas" saiu
// (contagem bruta não ajuda a decidir nada). "Cadernos estudados" e as duas
// métricas que antes viviam em "Produtividade e Eficiência" (Eficiência
// Estrita → "Acertos por hora"; Produtividade → "Questões por hora") entraram
// aqui, sem rótulo técnico — Eficiência Global continua fora (decisão
// anterior: mistura acerto com horas não mensuráveis, vicia o número).
//
// Acertos/hora e Questões/hora passaram a mostrar a janela RECENTE (padrão 28
// dias, configurável em Configurações) como valor principal, com o vitalício
// como subtexto (07/07/2026, pedido do usuário) — a média vitalícia sozinha
// fica cada vez menos sensível ao presente conforme o total de horas
// acumuladas cresce; a versão recente devolve o "termômetro do agora" sem
// descartar a referência histórica.
function renderVisaoGeral(kpis, produtividadeVitalicia, produtividadeRecente, janelaDias, situacao) {
  const diag = kpis.diagnosticoGeral;
  const diagLabel = diag ? formatPct(diag.wilson_pct) : "—";
  const diagBadge = diag ? renderBadge(diag.classificacao) : "";

  const subvitalicio = (valor) =>
    `<p style="font-size:11px; color:var(--color-text-muted); margin:2px 0 0;">vitalício: ${valor == null ? "—" : `${valor}/h`}</p>`;

  // Ordem esquerda->direita (13/07/2026, pedido do usuário): Desempenho
  // geral, Questões resolvidas, Horas estudadas, Disciplinas em estudo,
  // Acertos/h, Questões/h. "Cadernos estudados" saiu do grid (substituído
  // por Questões resolvidas — número bruto de questões, não de cadernos).
  const cartoesKpi = `
    <div class="kpi-card">
      <p class="kpi-card__label">Desempenho geral</p>
      <p class="kpi-card__value">${diagLabel} ${diagBadge}</p>
    </div>
    <div class="kpi-card">
      <p class="kpi-card__label">Questões resolvidas</p>
      <p class="kpi-card__value">${kpis.questoesResolvidas}</p>
    </div>
    <div class="kpi-card">
      <p class="kpi-card__label">Horas estudadas</p>
      <p class="kpi-card__value">${kpis.horasTotais}h</p>
    </div>
    <div class="kpi-card">
      <p class="kpi-card__label">Disciplinas em estudo</p>
      <p class="kpi-card__value">${kpis.disciplinasComSessao}</p>
    </div>
    <div class="kpi-card" title="Últimos ${janelaDias} dias">
      <p class="kpi-card__label">Acertos por hora (${janelaDias}d)</p>
      <p class="kpi-card__value">${produtividadeRecente.eficienciaEstrita == null ? "—" : `${produtividadeRecente.eficienciaEstrita}/h`}</p>
      ${subvitalicio(produtividadeVitalicia.eficienciaEstrita)}
    </div>
    <div class="kpi-card" title="Últimos ${janelaDias} dias">
      <p class="kpi-card__label">Questões por hora (${janelaDias}d)</p>
      <p class="kpi-card__value">${produtividadeRecente.produtividade == null ? "—" : `${produtividadeRecente.produtividade}/h`}</p>
      ${subvitalicio(produtividadeVitalicia.produtividade)}
    </div>
  `;

  const totalSituacao = Object.values(situacao).reduce((a, b) => a + b, 0);
  const cartoesSituacao =
    totalSituacao === 0
      ? ""
      : Object.entries(SITUACAO_LABELS)
          .map(([key, meta]) => {
            const count = situacao[key] ?? 0;
            // Clicável (05/07/2026, pedido do usuário — testando essa opção):
            // leva pra Prioridade já filtrada por essa classificação, em vez
            // de duplicar uma lista de cadernos aqui dentro do Dashboard.
            return `
              <div class="kpi-card kpi-card--clickable" data-situacao-link="${key}" title="Ver cadernos ${escapeHtml(meta.label.toLowerCase())} em Prioridade">
                <p class="kpi-card__label">${escapeHtml(meta.label)}</p>
                <p class="kpi-card__value" style="color:${meta.color};">${count}</p>
              </div>
            `;
          })
          .join("");

  return `<div class="kpi-grid">${cartoesKpi}${cartoesSituacao}</div>`;
}

// Metas de Estudo Semanal (13/07/2026, pedido do usuário) — barra de
// progresso de Horas e de Questões contra a meta configurável (Configurações),
// mais o gráfico Dom-Sáb da semana civil atual com toggle Horas/Questões. De
// propósito SEM % de acerto aqui — ver comentário em meta_semanal_horas
// (parameterService.js) sobre por que % não vira "meta" com barra de progresso.
function renderMetaSemanal(meta, metaHoras, metaQuestoes) {
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  // Barra trava em 100% (não estoura visualmente), mas o texto ao lado
  // sempre mostra o valor real, mesmo passando da meta — a contagem em si
  // nunca para. Quando atinge/ultrapassa (13/07/2026, pedido do usuário), a
  // barra muda pra --color-success e aparece "✓ Meta batida! +X" com o
  // excedente; antes disso era tudo em --color-primary, sem nenhum aviso.
  const barra = (atual, alvo) => {
    const atingiu = alvo > 0 && atual >= alvo;
    const pct = alvo > 0 ? Math.min(100, Math.round((atual / alvo) * 100)) : 0;
    const cor = atingiu ? "var(--color-success)" : "var(--color-primary)";
    return `
      <div style="background:var(--color-border); border-radius:6px; height:10px; overflow:hidden; margin:6px 0;">
        <div style="width:${pct}%; height:100%; background:${cor};"></div>
      </div>
    `;
  };
  const badgeMeta = (atual, alvo, sufixo, formatar) => {
    if (!(alvo > 0 && atual >= alvo)) return "";
    return `<span style="color:var(--color-success); font-weight:600; font-size:13px; margin-left:8px;">✓ Meta batida! +${formatar(atual - alvo)}${sufixo}</span>`;
  };
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Metas de Estudo — Semana Atual (${fmtData(meta.inicio)}–${fmtData(meta.fim)})</h3>
      <div style="display:flex; gap:32px; flex-wrap:wrap; margin-bottom:16px;">
        <div style="flex:1; min-width:220px;">
          <p style="margin:0;">Horas estudadas: <strong>${meta.horasTotais}h</strong> / ${metaHoras}h${badgeMeta(meta.horasTotais, metaHoras, "h", (v) => Math.round(v * 10) / 10)}</p>
          ${barra(meta.horasTotais, metaHoras)}
        </div>
        <div style="flex:1; min-width:220px;">
          <p style="margin:0;">Questões resolvidas: <strong>${meta.questoesTotais}</strong> / ${metaQuestoes}${badgeMeta(meta.questoesTotais, metaQuestoes, " questões", (v) => v)}</p>
          ${barra(meta.questoesTotais, metaQuestoes)}
        </div>
      </div>
      <div style="display:flex; gap:8px; margin-bottom:8px;">
        <button type="button" id="meta-toggle-horas" class="btn" style="width:auto; padding:6px 14px;">Horas</button>
        <button type="button" id="meta-toggle-questoes" class="btn" style="width:auto; padding:6px 14px;">Questões</button>
      </div>
      <canvas id="meta-semanal-chart" height="90"></canvas>
    </div>
  `;
}

// Tendência Semanal (Fase 6-C) — substitui o gráfico diário original (400
// pontos, ilegível) por 12 blocos semanais + comparação explícita semana
// atual vs anterior. Continua sendo a resposta direta a "melhorou ou piorou
// em relação à semana passada?". O usuário pediu de volta (03/07/2026) —
// tinha sido trocado pelo card de Acertos vs Erros por engano; os dois
// ficam, não é um ou outro.
function renderMediaMovelSemanal(t) {
  if (!t.semanas || t.semanas.length === 0) {
    return `
      <div class="card" style="margin-bottom:24px;">
        <h3 style="margin-top:0;">Tendência Semanal (% de acerto)</h3>
        <p style="color:var(--color-text-muted);">Sem sessões mensuráveis suficientes ainda.</p>
      </div>
    `;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  // Piso de N (08/07/2026) — se a semana atual e/ou anterior não bateu o
  // mínimo de questões, deltaSemana já vem null de getTendenciaSemanal (pct
  // null de qualquer um dos dois lados invalida a comparação); aqui só
  // escolhemos o texto certo pra explicar POR QUE não há comparação, em vez
  // de tratar "sem semana anterior" (caso original) e "semana sem dado
  // suficiente" (caso novo) com a mesma frase genérica.
  let deltaHtml;
  if (t.deltaSemana != null) {
    const cor = t.deltaSemana > 0 ? "var(--color-success)" : t.deltaSemana < 0 ? "var(--color-error)" : "var(--color-text-muted)";
    const seta = t.deltaSemana > 0 ? "▲" : t.deltaSemana < 0 ? "▼" : "＝";
    deltaHtml = `
      <p style="margin: 4px 0 12px;">
        Semana atual (${fmtData(t.semanaAtual.inicio)}–${fmtData(t.semanaAtual.fim)}): <strong>${formatPct(t.semanaAtual.pct)}</strong>
        vs. semana anterior (${fmtData(t.semanaAnterior.inicio)}–${fmtData(t.semanaAnterior.fim)}): <strong>${formatPct(t.semanaAnterior.pct)}</strong>
        — <strong style="color:${cor};">${seta} ${Math.abs(t.deltaSemana).toFixed(2)} p.p.</strong>
      </p>
    `;
  } else if (t.semanaAnterior == null) {
    deltaHtml = '<p style="color:var(--color-text-muted);">Ainda não há uma semana anterior completa para comparar.</p>';
  } else if (t.semanaAtual?.suficiente === false || t.semanaAnterior?.suficiente === false) {
    deltaHtml = '<p style="color:var(--color-text-muted);">Dado insuficiente na semana atual ou na anterior — comparação não exibida.</p>';
  } else {
    deltaHtml = '<p style="color:var(--color-text-muted);">Ainda não há uma semana anterior completa para comparar.</p>';
  }
  const temInsuficiente = t.semanas.some((s) => !s.suficiente);
  const notaRodape = temInsuficiente
    ? `<p style="font-size:12px; color:var(--color-text-muted); margin: 8px 0 0;">* semana com poucas questões — % não exibido para não distorcer o gráfico.</p>`
    : "";
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Tendência Semanal (% de acerto)</h3>
      ${deltaHtml}
      <canvas id="media-movel-chart" height="90"></canvas>
      ${notaRodape}
    </div>
  `;
}

// Acertos vs. Erros por Semana (Fase 6-D) — card adicional, não substitui o
// de cima. Mostra volume BRUTO (não %) pra responder também "o volume de
// erros está encolhendo", complementando a razão do gráfico de %. Referência:
// dashboards de Gran Cursos/Deltinha/Aprovado.
function renderAcertosErrosSemana(t) {
  if (!t.semanas || t.semanas.length === 0) return "";
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Acertos vs. Erros por Semana (volume)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Volume bruto de questões por semana (não percentual) — mostra se o número de erros está caindo em valores absolutos, complementando o gráfico de % de acerto acima.</p>
      <canvas id="acertos-erros-chart" height="90"></canvas>
    </div>
  `;
}

// Horas Semanais, valor bruto (07/07/2026, pedido do usuário) — consistência
// de esforço semana a semana. Sem suavização de propósito, mesma decisão já
// tomada pro card de cima (Acertos vs. Erros): uma semana fraca de verdade
// precisa aparecer fraca, não escondida atrás de uma média móvel.
function renderHorasSemanais(semanas) {
  if (!semanas || semanas.length === 0) return "";
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Horas Semanais</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Total de horas estudadas por semana.</p>
      <canvas id="horas-semanais-chart" height="90"></canvas>
    </div>
  `;
}

// Horas por Disciplina (Fase 6-D) — rosca (doughnut) de alocação de tempo.
// Preenche a lacuna do KPI único "Horas estudadas" (não quebrado por nada).
// Todos os tipos de estudo contam (mesmo critério do KPI) — é tempo, não
// acerto, sem risco de viés tipo Eficiência Global.
function renderHorasPorDisciplina(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  // Tabela com % exato ao lado do gráfico: com 9 disciplinas e horas muito
  // desiguais, uma fatia com <1h num total de ~2000h vira uma fatia de menos
  // de 1 grau — visualmente imperceptível na rosca (não é bug, é matemática
  // de pizza), mas o número exato precisa continuar visível em algum lugar.
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.disciplinaNome)}</td>
        <td>${l.horas}h</td>
        <td>${formatPct(total > 0 ? (l.horas / total) * 100 : null)}</td>
      </tr>
    `
    )
    .join("");
  const totalRow = `
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${Math.round(total * 10) / 10}h</strong></td>
      <td><strong>100%</strong></td>
    </tr>
  `;
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Horas por Disciplina</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Disciplinas com fatia muito pequena podem não aparecer visível no gráfico. Sessões sem disciplina vinculada (Caderno de Erros, Simulado, Flashcard por baralho raiz) não entram aqui — esse tempo aparece em "Horas por Tipo de Estudo" abaixo.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;">
        <div style="max-width:340px; flex:1; min-width:280px;">
          <canvas id="horas-disciplina-chart" height="260"></canvas>
        </div>
        <div style="flex:1; min-width:280px; overflow-x:auto;">
          <table class="data-table">
            <tr><th>Disciplina</th><th>Horas</th><th>%</th></tr>
            ${rows}
            ${totalRow}
          </table>
        </div>
      </div>
    </div>
  `;
}

// Horas por Tipo de Estudo (07/07/2026, pedido do usuário) — mesmo padrão
// visual de Horas por Disciplina (rosca + tabela com Total), só que quebrado
// por study_type em vez de disciplina: responde "estou gastando meu tempo em
// quê" (questões vs. leitura vs. revisão vs. videoaula...).
function renderHorasPorTipoEstudo(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(STUDY_TYPE_LABELS[l.studyType] || l.studyType)}</td>
        <td>${l.horas}h</td>
        <td>${formatPct(total > 0 ? (l.horas / total) * 100 : null)}</td>
      </tr>
    `
    )
    .join("");
  const totalRow = `
    <tr>
      <td><strong>Total</strong></td>
      <td><strong>${Math.round(total * 10) / 10}h</strong></td>
      <td><strong>100%</strong></td>
    </tr>
  `;
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Horas por Tipo de Estudo</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Estudos com fatia muito pequena podem não aparecer visível no gráfico.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;">
        <div style="max-width:340px; flex:1; min-width:280px;">
          <canvas id="horas-tipo-chart" height="260"></canvas>
        </div>
        <div style="flex:1; min-width:280px; overflow-x:auto;">
          <table class="data-table">
            <tr><th>Tipo de estudo</th><th>Horas</th><th>%</th></tr>
            ${rows}
            ${totalRow}
          </table>
        </div>
      </div>
    </div>
  `;
}

// Janela de Tendência por Disciplina (Fase 6-C) — view v_janela_tendencia já
// existia (Fase 5) mas nunca foi exposta em tela. Curta = últimas ~100
// questões; Longa = últimas ~300. Responde "em quais disciplinas realmente
// evoluí" e "tendência subir ou estagnar" olhando desempenho recente vs. mais
// antigo, não percentual acumulado desde o início.
function renderJanelaTendenciaDisciplina(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const TENDENCIA_LABEL = { subindo: "Subindo", caindo: "Caindo", estavel: "Estável" };
  const TENDENCIA_COR = { subindo: "var(--color-success)", caindo: "var(--color-error)", estavel: "var(--color-text-muted)" };
  const rows = linhas
    .map((l) => {
      const cor = TENDENCIA_COR[l.tendencia] || "var(--color-text-muted)";
      const label = TENDENCIA_LABEL[l.tendencia] || "—";
      return `
        <tr>
          <td>${escapeHtml(l.disciplinaNome)}</td>
          <td>${formatPct(l.pctCurta)} (${l.questoesCurta ?? 0}q)</td>
          <td>${formatPct(l.pctLonga)} (${l.questoesLonga ?? 0}q)</td>
          <td style="color:${cor};"><strong>${formatDeltaPct(l.delta)} — ${label}</strong></td>
        </tr>
      `;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Tendência por Disciplina (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Compara as últimas ~100 questões com as últimas ~300 — diferença até 3 p.p. é tratada como estável.</p>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <tr><th>Disciplina</th><th>Janela curta</th><th>Janela longa</th><th>Delta</th></tr>
          ${rows}
        </table>
      </div>
    </div>
  `;
}

// Cadernos que mais subiram/caíram (Fase 6-C) — mesma lógica, granularidade
// de caderno, só destaques (não lista completa) pra não poluir o dashboard.
function renderJanelaTendenciaCaderno(dados) {
  if (!dados || (dados.subindo.length === 0 && dados.caindo.length === 0)) return "";
  const linha = (l) => `
    <tr>
      <td>${escapeHtml(l.cadernoNome)}</td>
      <td>${formatPct(l.pctCurta)}</td>
      <td>${formatPct(l.pctLonga)}</td>
      <td>${formatDeltaPct(l.delta)}</td>
    </tr>
  `;
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Cadernos que mais mudaram (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Só cadernos com pelo menos 20 questões na janela longa. Mostra os 5 maiores avanços e as 5 maiores quedas.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div style="flex:1; min-width:280px; overflow-x:auto;">
          <p style="margin:0 0 4px; color:var(--color-success); font-weight:600;">Maiores avanços</p>
          <table class="data-table">
            <tr><th>Caderno</th><th>Curta</th><th>Longa</th><th>Delta</th></tr>
            ${dados.subindo.map(linha).join("") || '<tr><td colspan="4">—</td></tr>'}
          </table>
        </div>
        <div style="flex:1; min-width:280px; overflow-x:auto;">
          <p style="margin:0 0 4px; color:var(--color-error); font-weight:600;">Maiores quedas</p>
          <table class="data-table">
            <tr><th>Caderno</th><th>Curta</th><th>Longa</th><th>Delta</th></tr>
            ${dados.caindo.map(linha).join("") || '<tr><td colspan="4">—</td></tr>'}
          </table>
        </div>
      </div>
    </div>
  `;
}

// Transferência entre Editais foi movida pra historyPage.js (03/07/2026 —
// decisão do usuário: não é acionável no dia a dia, mais exploratória).

// Retenção Geral por faixa de intervalo (Fase 6-C) — agrega v_retencao_caderno
// (proxy por caderno, Fase 5) somando todos os cadernos por faixa. Responde
// "minhas revisões estão aumentando minha retenção" — olhe se o % de acerto
// sobe conforme o intervalo desde o último toque diminui. Isto é o dado bruto,
// sem conclusão automática: com poucas questões numa faixa, a diferença pode
// ser ruído, não sinal real.
//
// OCULTADO do Dashboard em 07/07/2026 (pedido do usuário: "não está me
// retornando nenhuma informação") — conferido no banco antes de tirar: a
// query tem dado real (~12700 questões distribuídas nas faixas), não é bug.
// O problema é o SINAL: com o dataset atual o % de acerto fica quase idêntico
// em todas as faixas (55-61%), sem curva perceptível — não há nada pra essa
// visualização comunicar hoje. Função/serviço ficam no código, sem chamada
// nenhuma — fácil trazer de volta se o padrão mudar com mais dado real.
function renderRetencaoGeral(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.faixa)}</td>
        <td>${formatPct(l.pct)}</td>
        <td>${l.questoes}</td>
      </tr>
    `
    )
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Retenção por Intervalo de Revisão</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Acerto médio agrupado pelo intervalo desde a última vez que você tocou naquele caderno (qualquer tipo de estudo conta como "toque"). Proxy por caderno — não por questão individual (question_attempts não é usado, registro é agregado desde a Fase 4). Curva no estilo da curva de esquecimento (Anki): se sobe da direita pra esquerda, revisão está segurando retenção.</p>
      <canvas id="retencao-geral-chart" height="80"></canvas>
      <div style="overflow-x:auto;">
        <table class="data-table" style="margin-top:16px;">
          <tr><th>Intervalo desde o último toque</th><th>% acerto</th><th>Questões</th></tr>
          ${rows}
        </table>
      </div>
    </div>
  `;
}

// Retenção por Disciplina (Fase 6-F, 03/07/2026) — resposta direta a "como vou
// saber qual disciplina/caderno eu revisei": a curva geral acima soma tudo, aqui
// quebra a mesma faixa por disciplina. Disciplina é o meio-termo — por caderno
// individual (613 deles) seria uma tabela ilegível; por disciplina (9) cabe
// numa tela só. Célula em branco = disciplina sem sessão naquela faixa ainda.
function renderRetencaoPorDisciplina(dados) {
  if (!dados || !dados.disciplinas || dados.disciplinas.length === 0) return "";
  const headerFaixas = dados.faixasOrdenadas.map((f) => `<th>${escapeHtml(f)}</th>`).join("");
  const rows = dados.disciplinas
    .map((d) => {
      const celulas = d.faixas
        .map((f) => (f.questoes > 0 ? `<td>${formatPct(f.pct)} <span style="color:var(--color-text-muted); font-size:11px;">(${f.questoes}q)</span></td>` : `<td style="color:var(--color-text-muted);">—</td>`))
        .join("");
      return `<tr><td>${escapeHtml(d.disciplinaNome)}</td>${celulas}</tr>`;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Retenção por Disciplina</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Mesma curva de cima, quebrada por disciplina — pra ver qual disciplina está puxando pra cima ou pra baixo cada faixa de intervalo.</p>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <tr><th>Disciplina</th>${headerFaixas}</tr>
          ${rows}
        </table>
      </div>
    </div>
  `;
}

// Próxima Ação (reescrita 04/07/2026, formato definitivo pedido pelo usuário):
// "Ação recomendada: [Disciplina] (Situação)" — direto, sem % Wilson nem peso
// exposto (decisão de 03/07/2026 mantida: quem não conhece os cortes de
// classificação não entenderia o número). A Situação usa o mesmo rótulo
// acentuado do Ranking de Risco logo abaixo, onde quem quiser o detalhe
// completo (Wilson %, peso) encontra.
function renderProximaAcao(item) {
  if (!item) {
    return `<div class="proxima-acao"><strong>Ação recomendada:</strong> ainda não há dado mensurável suficiente para sugerir foco.</div>`;
  }
  return `
    <div class="proxima-acao">
      <strong>Ação recomendada:</strong> <strong>${escapeHtml(item.disciplinaNome)}</strong> — ${renderBadge(item.classificacao)}
    </div>
  `;
}

function renderRanking(ranking) {
  if (ranking.length === 0) {
    return `<div class="card" style="margin-bottom:24px;"><p style="color:var(--color-text-muted);">Nenhuma disciplina com sessão mensurável ainda.</p></div>`;
  }
  const rows = ranking
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.disciplinaNome)}</td>
        <td>${renderBadge(r.classificacao)}</td>
        <td>${formatPct(r.wilsonPct)}</td>
        <td>${r.questoesTotal}</td>
        <td>${r.weight ? renderPesoBadge(r.weight) : "—"}${r.pesoNumericoPct != null ? ` (${formatPct(r.pesoNumericoPct)})` : ""}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="card" style="margin-bottom:24px;">
      <h3 style="margin-top:0;">Ranking de Risco</h3>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <tr><th>Disciplina</th><th>Diagnóstico</th><th>Wilson</th><th>Questões</th><th>Peso</th></tr>
          ${rows}
        </table>
      </div>
    </div>
  `;
}

function renderBadge(classificacao) {
  if (!classificacao) return "";
  const label = CLASSIFICACAO_LABEL[classificacao] ?? classificacao;
  return `<span class="badge badge--${classificacao}">${label}</span>`;
}

function renderPesoBadge(weight) {
  return `<span class="badge badge--peso-${weight}">${weight}</span>`;
}

// Recebe os blocos semanais já agregados (getTendenciaSemanal) — no máximo
// ~12 pontos, em vez dos ~400 dias corridos que tornavam o gráfico anterior
// ilegível (muitos rótulos amontoados no eixo X, linha diária cheia de ruído
// escondendo qualquer tendência). % de acerto por semana — o gráfico original
// (Fase 6-C), restaurado como card próprio a pedido do usuário (03/07/2026).
// minQuestoes (08/07/2026) só é usado aqui pro texto do tooltip — a decisão
// de esconder o % (pct=null) já veio pronta de getTendenciaSemanal. "*" no
// rótulo do eixo sinaliza visualmente a barra ausente (Chart.js não desenha
// barra pra valor null); nota de rodapé no card explica o "*" por extenso.
function renderChartMediaMovel(canvas, semanas, minQuestoes = null) {
  if (chartMediaMovelInstance) {
    chartMediaMovelInstance.destroy();
    chartMediaMovelInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}${s.suficiente ? "" : " *"}`);
  const dataPct = semanas.map((s) => s.pct);

  chartMediaMovelInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "% acerto na semana", data: dataPct, backgroundColor: "#1f3864" }],
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const s = semanas[ctx.dataIndex];
              if (!s.suficiente) {
                return `Dado insuficiente: ${s.questoes} questão(ões) (mínimo ${minQuestoes ?? "?"})`;
              }
              return `${ctx.dataset.label}: ${formatPct(ctx.parsed.y)}`;
            },
          },
        },
      },
    },
  });
}

// Acertos vs. Erros por Semana (Fase 6-D) — duas áreas em volume bruto (não
// %), no mesmo padrão de dashboards de apps de concurso (Gran/Deltinha/
// Aprovado) — mostra se o volume de erros está encolhendo em número absoluto,
// complementando (não substituindo) o gráfico de % acima.
function renderChartAcertosErros(canvas, semanas) {
  if (chartAcertosErrosInstance) {
    chartAcertosErrosInstance.destroy();
    chartAcertosErrosInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}`);
  const dataAcertos = semanas.map((s) => s.acertos);
  const dataErros = semanas.map((s) => s.erros);

  chartAcertosErrosInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Acertos",
          data: dataAcertos,
          borderColor: "#1e7e34",
          backgroundColor: "rgba(30, 126, 52, 0.25)",
          fill: "origin",
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Erros",
          data: dataErros,
          borderColor: "#c0392b",
          backgroundColor: "rgba(192, 57, 43, 0.25)",
          fill: "origin",
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, title: { display: true, text: "Questões" } } },
    },
  });
}

// Horas Semanais, valor bruto (07/07/2026) — barras, sem suavização de propósito.
function renderChartHorasSemanais(canvas, semanas) {
  if (chartHorasSemanaisInstance) {
    chartHorasSemanaisInstance.destroy();
    chartHorasSemanaisInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}`);
  const dataHoras = semanas.map((s) => s.horas);

  chartHorasSemanaisInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Horas na semana", data: dataHoras, backgroundColor: "#7a9cc6" }],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, title: { display: true, text: "Horas" } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}h` } },
      },
    },
  });
}

// Meta de Estudo Semanal (13/07/2026) — barras por dia da semana civil atual
// (domingo a sábado), alternando Horas/Questões pelos botões de toggle.
function renderChartMetaSemanal(canvas, porDia, metrica) {
  if (chartMetaSemanalInstance) {
    chartMetaSemanalInstance.destroy();
    chartMetaSemanalInstance = null;
  }
  const DIAS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  const dados = porDia.map((d) => (metrica === "horas" ? d.horas : d.questoes));
  chartMetaSemanalInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: DIAS,
      datasets: [
        {
          label: metrica === "horas" ? "Horas" : "Questões",
          data: dados,
          backgroundColor: metrica === "horas" ? "#1f3864" : "#2e7d32",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    },
  });
}

// Rosca de horas por disciplina (Fase 6-D).
function renderChartHoras(canvas, linhas) {
  if (chartHorasInstance) {
    chartHorasInstance.destroy();
    chartHorasInstance = null;
  }
  const CORES = ["#1f3864", "#2e7d32", "#c0392b", "#b45309", "#6a1b9a", "#00838f", "#8d6e63", "#546e7a", "#ad1457"];
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  chartHorasInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: linhas.map((l) => l.disciplinaNome),
      datasets: [
        {
          data: linhas.map((l) => l.horas),
          backgroundColor: linhas.map((_, i) => CORES[i % CORES.length]),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}h (${formatPct(total > 0 ? (ctx.parsed / total) * 100 : null)})`,
          },
        },
      },
    },
  });
}

// Rosca de horas por tipo de estudo (07/07/2026) — mesmo padrão visual e
// mesma paleta de renderChartHoras (Horas por Disciplina), só trocando o
// campo de rótulo (studyType/STUDY_TYPE_LABELS em vez de disciplinaNome).
function renderChartHorasTipo(canvas, linhas) {
  if (chartHorasTipoInstance) {
    chartHorasTipoInstance.destroy();
    chartHorasTipoInstance = null;
  }
  const CORES = ["#1f3864", "#2e7d32", "#c0392b", "#b45309", "#6a1b9a", "#00838f", "#8d6e63"];
  const total = linhas.reduce((acc, l) => acc + l.horas, 0);
  chartHorasTipoInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: linhas.map((l) => STUDY_TYPE_LABELS[l.studyType] || l.studyType),
      datasets: [
        {
          data: linhas.map((l) => l.horas),
          backgroundColor: linhas.map((_, i) => CORES[i % CORES.length]),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed}h (${formatPct(total > 0 ? (ctx.parsed / total) * 100 : null)})`,
          },
        },
      },
    },
  });
}

// Curva de Retenção (Fase 6-D) — estilo curva de esquecimento (Anki):
// intervalo desde o último toque no eixo X, % acerto no eixo Y.
function renderChartRetencao(canvas, linhas) {
  if (chartRetencaoInstance) {
    chartRetencaoInstance.destroy();
    chartRetencaoInstance = null;
  }
  chartRetencaoInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: linhas.map((l) => l.faixa),
      datasets: [
        {
          label: "% acerto",
          data: linhas.map((l) => l.pct),
          borderColor: "#1f3864",
          backgroundColor: "rgba(31, 56, 100, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => formatPct(ctx.parsed.y) } },
      },
    },
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
