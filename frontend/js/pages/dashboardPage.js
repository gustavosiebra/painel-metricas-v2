// Dashboard (Fase 6) — KPIs, Ranking de Risco, Próxima Ação e gráfico de
// Média Móvel Semanal. Consome as views/funções analíticas da Fase 5; nenhum
// cálculo estatístico é refeito aqui (TEC-006).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import {
  getKpis,
  getRankingRisco,
  getMediaMovelSemanal,
  getContadoresSituacao,
  getProdutividadeGeral,
  getTendenciaSemanal,
  getJanelaTendenciaDisciplina,
  getJanelaTendenciaCadernoDestaques,
  getTransferenciaCadernos,
  getRetencaoGeral,
  getHorasPorDisciplina,
  pickProximaAcao,
} from "../services/dashboardService.js";

const SITUACAO_LABELS = {
  consolidado: { label: "Consolidados", color: "var(--color-success)" },
  atencao: { label: "Atenção", color: "#b45309" },
  critico: { label: "Críticos", color: "var(--color-error)" },
  preliminar: { label: "Preliminares", color: "var(--color-text-muted)" },
};

let chartTendenciaInstance = null;
let chartHorasInstance = null;
let chartRetencaoInstance = null;

export async function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/dashboard")}
        <main class="app-content">
          <h2 class="form-title">Dashboard</h2>
          <div id="dashboard-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#dashboard-content");

  let kpis, ranking, mediaMovelDiaria, situacao, produtividade, janelaDisciplina, janelaCaderno, transferencia, retencaoGeral, horasPorDisciplina;
  try {
    [kpis, ranking, mediaMovelDiaria, situacao, produtividade, janelaDisciplina, janelaCaderno, transferencia, retencaoGeral, horasPorDisciplina] = await Promise.all([
      getKpis(),
      getRankingRisco(),
      getMediaMovelSemanal(),
      getContadoresSituacao(),
      getProdutividadeGeral(),
      getJanelaTendenciaDisciplina(),
      getJanelaTendenciaCadernoDestaques(),
      getTransferenciaCadernos(),
      getRetencaoGeral(),
      getHorasPorDisciplina(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar dashboard: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const proximaAcao = pickProximaAcao(ranking);
  const tendenciaSemanal = getTendenciaSemanal(mediaMovelDiaria);

  content.innerHTML = `
    ${renderKpis(kpis)}
    ${renderSituacao(situacao)}
    ${renderProdutividade(produtividade)}
    ${renderProximaAcao(proximaAcao)}
    ${renderTendenciaSemanal(tendenciaSemanal)}
    ${renderHorasPorDisciplina(horasPorDisciplina)}
    ${renderJanelaTendenciaDisciplina(janelaDisciplina)}
    ${renderJanelaTendenciaCaderno(janelaCaderno)}
    ${renderTransferencia(transferencia)}
    ${renderRetencaoGeral(retencaoGeral)}
    ${renderRanking(ranking)}
  `;

  // Cada gráfico é isolado no próprio try/catch: um erro de desenho (ex.:
  // Chart.js não carregado) não pode derrubar os outros gráficos do dashboard.
  if (tendenciaSemanal.semanas.length > 0) {
    tentarDesenhar(content, "media-movel-chart", () => renderChartTendencia(content.querySelector("#media-movel-chart"), tendenciaSemanal.semanas));
  }
  if (horasPorDisciplina.length > 0) {
    tentarDesenhar(content, "horas-disciplina-chart", () => renderChartHoras(content.querySelector("#horas-disciplina-chart"), horasPorDisciplina));
  }
  if (retencaoGeral.length > 0) {
    tentarDesenhar(content, "retencao-geral-chart", () => renderChartRetencao(content.querySelector("#retencao-geral-chart"), retencaoGeral));
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

function renderKpis(kpis) {
  const diag = kpis.diagnosticoGeral;
  const diagLabel = diag ? `${diag.wilson_pct}%` : "—";
  const diagBadge = diag ? renderBadge(diag.classificacao) : "";
  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <p class="kpi-card__label">Horas estudadas</p>
        <p class="kpi-card__value">${kpis.horasTotais}h</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Sessões ativas</p>
        <p class="kpi-card__value">${kpis.sessoesAtivas}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Disciplinas em estudo</p>
        <p class="kpi-card__value">${kpis.disciplinasComSessao}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Diagnóstico geral</p>
        <p class="kpi-card__value">${diagLabel} ${diagBadge}</p>
      </div>
    </div>
  `;
}

// Contadores por Situação (Fase 6-B) — quantos cadernos caem em cada
// classificação de Diagnóstico Wilson. Responde "como estou" no nível mais
// granular (caderno), complementando o KPI de Diagnóstico Geral (agregado
// total) e o Ranking de Risco (por disciplina).
function renderSituacao(situacao) {
  const total = Object.values(situacao).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return "";
  }
  const cards = Object.entries(SITUACAO_LABELS)
    .map(([key, meta]) => {
      const count = situacao[key] ?? 0;
      return `
        <div class="kpi-card">
          <p class="kpi-card__label">${escapeHtml(meta.label)}</p>
          <p class="kpi-card__value" style="color:${meta.color};">${count}</p>
        </div>
      `;
    })
    .join("");
  return `
    <h3 style="margin: 24px 0 8px;">Cadernos por Situação</h3>
    <div class="kpi-grid">${cards}</div>
  `;
}

// Produtividade e Eficiência (Fase 6-B). Eficiência Estrita = acertos/hora só
// nas horas com resultado mensurável (questão/simulado/discursiva).
// Produtividade = questões/hora mensurável. Eficiência Global (acertos/hora
// TOTAL) foi removida por decisão do usuário — misturar acerto com horas que
// incluem tipos sem acerto nenhum (revisão/flashcard/leitura/videoaula) causa
// viés; horas totais continuam só no KPI "Horas estudadas", sem cruzar com acerto.
function renderProdutividade(p) {
  const fmt = (v) => (v == null ? "—" : v);
  return `
    <h3 style="margin: 24px 0 8px;">Produtividade e Eficiência</h3>
    <div class="kpi-grid">
      <div class="kpi-card">
        <p class="kpi-card__label">Eficiência Estrita (acertos/h mensurável)</p>
        <p class="kpi-card__value">${fmt(p.eficienciaEstrita)}</p>
      </div>
      <div class="kpi-card">
        <p class="kpi-card__label">Produtividade (questões/h)</p>
        <p class="kpi-card__value">${fmt(p.produtividade)}</p>
      </div>
    </div>
  `;
}

// Tendência Semanal (Fase 6-C/6-D) — substitui o gráfico diário (400 pontos,
// ilegível) por 12 blocos semanais. O gráfico mostra volume BRUTO de acertos
// e erros (área empilhada), não só %, pra responder também "o volume de
// erros está encolhendo" e não só a razão — pedido do usuário (03/07/2026),
// referência: dashboards de Gran Cursos/Deltinha/Aprovado. O texto de delta
// (semana atual vs anterior) continua sendo a resposta direta a "melhorou ou
// piorou em relação à semana passada?".
function renderTendenciaSemanal(t) {
  if (!t.semanas || t.semanas.length === 0) {
    return `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Acertos vs. Erros por Semana</h3>
        <p style="color:var(--color-text-muted);">Sem sessões mensuráveis suficientes ainda.</p>
      </div>
    `;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  let deltaHtml = '<p style="color:var(--color-text-muted);">Ainda não há uma semana anterior completa para comparar.</p>';
  if (t.deltaSemana != null) {
    const cor = t.deltaSemana > 0 ? "var(--color-success)" : t.deltaSemana < 0 ? "var(--color-error)" : "var(--color-text-muted)";
    const seta = t.deltaSemana > 0 ? "▲" : t.deltaSemana < 0 ? "▼" : "＝";
    deltaHtml = `
      <p style="margin: 4px 0 12px;">
        Semana atual (${fmtData(t.semanaAtual.inicio)}–${fmtData(t.semanaAtual.fim)}): <strong>${t.semanaAtual.pct ?? "—"}%</strong>
        vs. semana anterior (${fmtData(t.semanaAnterior.inicio)}–${fmtData(t.semanaAnterior.fim)}): <strong>${t.semanaAnterior.pct ?? "—"}%</strong>
        — <strong style="color:${cor};">${seta} ${Math.abs(t.deltaSemana)} p.p.</strong>
      </p>
    `;
  }
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Acertos vs. Erros por Semana</h3>
      ${deltaHtml}
      <canvas id="media-movel-chart" height="90"></canvas>
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
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Horas por Disciplina</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Total: ${Math.round(total * 10) / 10}h, todos os tipos de estudo.</p>
      <div style="max-width:420px;">
        <canvas id="horas-disciplina-chart" height="260"></canvas>
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
          <td>${l.pctCurta ?? "—"}% (${l.questoesCurta ?? 0}q)</td>
          <td>${l.pctLonga ?? "—"}% (${l.questoesLonga ?? 0}q)</td>
          <td style="color:${cor};"><strong>${l.delta != null ? (l.delta > 0 ? "+" : "") + l.delta : "—"} p.p. — ${label}</strong></td>
        </tr>
      `;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Tendência por Disciplina (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Compara as últimas ~100 questões com as últimas ~300 — diferença até 3 p.p. é tratada como estável.</p>
      <table class="data-table">
        <tr><th>Disciplina</th><th>Janela curta</th><th>Janela longa</th><th>Delta</th></tr>
        ${rows}
      </table>
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
      <td>${l.pctCurta}%</td>
      <td>${l.pctLonga}%</td>
      <td>${l.delta > 0 ? "+" : ""}${l.delta} p.p.</td>
    </tr>
  `;
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Cadernos que mais mudaram (recente vs. mais antigo)</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Só cadernos com pelo menos 20 questões na janela longa. Mostra os 5 maiores avanços e as 5 maiores quedas.</p>
      <div style="display:flex; gap:24px; flex-wrap:wrap;">
        <div style="flex:1; min-width:280px;">
          <p style="margin:0 0 4px; color:var(--color-success); font-weight:600;">Maiores avanços</p>
          <table class="data-table">
            <tr><th>Caderno</th><th>Curta</th><th>Longa</th><th>Delta</th></tr>
            ${dados.subindo.map(linha).join("") || '<tr><td colspan="4">—</td></tr>'}
          </table>
        </div>
        <div style="flex:1; min-width:280px;">
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

// Transferência entre Editais (Fase 6-C) — mesmo caderno reaproveitado em
// concursos diferentes. Só entra quem tem >=2 concursos distintos. Amplitude
// alta = desempenho disperso entre editais (sinal de transferência fraca);
// não é rotulado automaticamente, só ordenado pela amplitude bruta.
function renderTransferencia(linhas) {
  if (!linhas || linhas.length === 0) {
    return `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Transferência entre Concursos</h3>
        <p style="color:var(--color-text-muted);">Nenhum caderno seu apareceu em 2+ concursos diferentes ainda — sem base de comparação.</p>
      </div>
    `;
  }
  const rows = linhas
    .slice(0, 15)
    .map((item) => {
      const detalhe = item.concursos
        .map((c) => `${escapeHtml(c.concursoNome)}: ${c.wilsonPct ?? "—"}% (${c.questoesTotal}q)`)
        .join(" · ");
      return `
        <tr>
          <td>${escapeHtml(item.cadernoNome)}</td>
          <td>${item.concursos.length}</td>
          <td>${detalhe}</td>
          <td>${item.amplitude ?? "—"} p.p.</td>
        </tr>
      `;
    })
    .join("");
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Transferência entre Concursos</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Mesmo caderno, Wilson por concurso. Amplitude = maior menos menor Wilson entre os concursos — quanto maior, mais disperso o desempenho entre editais.</p>
      <table class="data-table">
        <tr><th>Caderno</th><th>Concursos</th><th>Wilson por concurso</th><th>Amplitude</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

// Retenção Geral por faixa de intervalo (Fase 6-C) — agrega v_retencao_caderno
// (proxy por caderno, Fase 5) somando todos os cadernos por faixa. Responde
// "minhas revisões estão aumentando minha retenção" — olhe se o % de acerto
// sobe conforme o intervalo desde o último toque diminui. Isto é o dado bruto,
// sem conclusão automática: com poucas questões numa faixa, a diferença pode
// ser ruído, não sinal real.
function renderRetencaoGeral(linhas) {
  if (!linhas || linhas.length === 0) return "";
  const rows = linhas
    .map(
      (l) => `
      <tr>
        <td>${escapeHtml(l.faixa)}</td>
        <td>${l.pct ?? "—"}%</td>
        <td>${l.questoes}</td>
      </tr>
    `
    )
    .join("");
  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Retenção por Intervalo de Revisão</h3>
      <p style="color:var(--color-text-muted); margin-top:0;">Acerto médio agrupado pelo intervalo desde a última vez que você tocou naquele caderno (qualquer tipo de estudo conta como "toque"). Proxy por caderno — não por questão individual (question_attempts não é usado, registro é agregado desde a Fase 4). Curva no estilo da curva de esquecimento (Anki): se sobe da direita pra esquerda, revisão está segurando retenção.</p>
      <canvas id="retencao-geral-chart" height="80"></canvas>
      <table class="data-table" style="margin-top:16px;">
        <tr><th>Intervalo desde o último toque</th><th>% acerto</th><th>Questões</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

function renderProximaAcao(item) {
  if (!item) {
    return `<div class="proxima-acao"><strong>Próxima ação:</strong> ainda não há dado mensurável suficiente para sugerir foco.</div>`;
  }
  const pesoTexto = item.weight ? ` — peso ${item.weight}` : " — peso não definido";
  return `
    <div class="proxima-acao">
      <strong>Próxima ação:</strong> foco sugerido em <strong>${escapeHtml(item.disciplinaNome)}</strong>
      (${renderBadge(item.classificacao)}${pesoTexto}, Wilson ${item.wilsonPct}%).
    </div>
  `;
}

function renderRanking(ranking) {
  if (ranking.length === 0) {
    return `<div class="card"><p style="color:var(--color-text-muted);">Nenhuma disciplina com sessão mensurável ainda.</p></div>`;
  }
  const rows = ranking
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.disciplinaNome)}</td>
        <td>${renderBadge(r.classificacao)}</td>
        <td>${r.wilsonPct}%</td>
        <td>${r.questoesTotal}</td>
        <td>${r.weight ? renderPesoBadge(r.weight) : "—"}${r.pesoNumericoPct != null ? ` (${r.pesoNumericoPct}%)` : ""}</td>
      </tr>
    `
    )
    .join("");

  return `
    <div class="card">
      <h3 style="margin-top:0;">Ranking de Risco</h3>
      <table class="data-table">
        <tr><th>Disciplina</th><th>Diagnóstico</th><th>Wilson</th><th>Questões</th><th>Peso</th></tr>
        ${rows}
      </table>
    </div>
  `;
}

function renderBadge(classificacao) {
  if (!classificacao) return "";
  return `<span class="badge badge--${classificacao}">${classificacao}</span>`;
}

function renderPesoBadge(weight) {
  return `<span class="badge badge--peso-${weight}">${weight}</span>`;
}

// Recebe os blocos semanais já agregados (getTendenciaSemanal) — no máximo
// ~12 pontos, em vez dos ~400 dias corridos que tornavam o gráfico anterior
// ilegível (muitos rótulos amontoados no eixo X, linha diária cheia de ruído
// escondendo qualquer tendência). Duas áreas (acertos/erros) em volume bruto,
// não %, no mesmo padrão de dashboards de apps de concurso (Gran/Deltinha/
// Aprovado) — mostra se o volume de erros está encolhendo em número absoluto.
function renderChartTendencia(canvas, semanas) {
  if (chartTendenciaInstance) {
    chartTendenciaInstance.destroy();
    chartTendenciaInstance = null;
  }
  const fmtData = (iso) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  const labels = semanas.map((s) => `${fmtData(s.inicio)}–${fmtData(s.fim)}`);
  const dataAcertos = semanas.map((s) => s.acertos);
  const dataErros = semanas.map((s) => s.erros);

  chartTendenciaInstance = new Chart(canvas, {
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

// Rosca de horas por disciplina (Fase 6-D).
function renderChartHoras(canvas, linhas) {
  if (chartHorasInstance) {
    chartHorasInstance.destroy();
    chartHorasInstance = null;
  }
  const CORES = ["#1f3864", "#2e7d32", "#c0392b", "#b45309", "#6a1b9a", "#00838f", "#8d6e63", "#546e7a", "#ad1457"];
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
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}h` } },
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
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
      plugins: { legend: { display: false } },
    },
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
