// Dashboard (Fase 6) — KPIs, Ranking de Risco, Próxima Ação e gráfico de
// Média Móvel Semanal. Consome as views/funções analíticas da Fase 5; nenhum
// cálculo estatístico é refeito aqui (TEC-006).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getKpis, getRankingRisco, getMediaMovelSemanal, pickProximaAcao } from "../services/dashboardService.js";

let chartInstance = null;

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

  let kpis, ranking, mediaMovel;
  try {
    [kpis, ranking, mediaMovel] = await Promise.all([getKpis(), getRankingRisco(), getMediaMovelSemanal()]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar dashboard: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const proximaAcao = pickProximaAcao(ranking);

  content.innerHTML = `
    ${renderKpis(kpis)}
    ${renderProximaAcao(proximaAcao)}
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Média Móvel Semanal (% de acerto)</h3>
      ${mediaMovel.length === 0 ? '<p style="color:var(--color-text-muted);">Sem sessões mensuráveis suficientes ainda.</p>' : '<canvas id="media-movel-chart" height="90"></canvas>'}
    </div>
    ${renderRanking(ranking)}
  `;

  if (mediaMovel.length > 0) {
    try {
      renderChart(content.querySelector("#media-movel-chart"), mediaMovel);
    } catch (err) {
      // Antes falhava em silêncio (canvas ficava em branco, sem pista
      // nenhuma) — normalmente Chart.js não carregou (CDN bloqueado/rede),
      // já que a lib vem de um <script> externo no index.html.
      const canvasEl = content.querySelector("#media-movel-chart");
      if (canvasEl) {
        canvasEl.outerHTML = `<div class="alert alert--error">Erro ao desenhar o gráfico: ${escapeHtml(err.message)}. Verifique se o Chart.js carregou (console do navegador) — provável CDN bloqueado.</div>`;
      }
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

function renderChart(canvas, mediaMovel) {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  const labels = mediaMovel.map((d) => d.dia);
  const dataDia = mediaMovel.map((d) => d.pct_acerto_dia);
  const dataMedia = mediaMovel.map((d) => d.media_movel_7d);

  chartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "% acerto do dia", data: dataDia, borderColor: "#9fb3d1", borderDash: [4, 4], pointRadius: 2, tension: 0.2 },
        { label: "Média móvel 7 dias", data: dataMedia, borderColor: "#1f3864", borderWidth: 2, pointRadius: 2, tension: 0.2 },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
    },
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
