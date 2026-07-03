// Tela Histórico (Fase 7) — evolução temporal por disciplina e comparação
// entre bancas/concursos. Consome views da Fase 5/7; nenhum cálculo novo aqui.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines } from "../services/catalogService.js";
import {
  getEvolucaoMensal,
  getMediaMovelSemanal,
  getComparativoBanca,
  getComparativoConcurso,
} from "../services/historyService.js";
import { formatPct } from "../utils/format.js";

const charts = {};

export async function renderHistoryPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/historico")}
        <main class="app-content">
          <h2 class="form-title">Histórico</h2>
          <div class="card" style="margin-bottom:16px; max-width:420px;">
            <div class="form-field">
              <label for="discipline-filter">Disciplina</label>
              <select id="discipline-filter"><option value="">Carregando…</option></select>
            </div>
          </div>
          <div id="discipline-section"><p style="color:var(--color-text-muted);">Selecione uma disciplina para ver a evolução.</p></div>
          <div id="comparativos-section"><p>Carregando comparativos…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const disciplineFilter = container.querySelector("#discipline-filter");
  const disciplineSection = container.querySelector("#discipline-section");
  const comparativosSection = container.querySelector("#comparativos-section");

  let disciplines = [];
  try {
    disciplines = await listDisciplines();
  } catch (err) {
    disciplineSection.innerHTML = `<div class="alert alert--error">Erro ao carregar disciplinas: ${escapeHtml(err.message)}</div>`;
    return;
  }

  disciplineFilter.innerHTML = `<option value="">Selecione…</option>${disciplines
    .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
    .join("")}`;

  disciplineFilter.addEventListener("change", () => renderDisciplineSection(disciplineFilter.value));

  await renderComparativos();

  async function renderDisciplineSection(disciplineId) {
    if (!disciplineId) {
      disciplineSection.innerHTML = `<p style="color:var(--color-text-muted);">Selecione uma disciplina para ver a evolução.</p>`;
      return;
    }
    disciplineSection.innerHTML = `<p>Carregando…</p>`;
    let evolucao, mediaMovel;
    try {
      [evolucao, mediaMovel] = await Promise.all([getEvolucaoMensal(disciplineId), getMediaMovelSemanal(disciplineId)]);
    } catch (err) {
      disciplineSection.innerHTML = `<div class="alert alert--error">Erro: ${escapeHtml(err.message)}</div>`;
      return;
    }

    disciplineSection.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Evolução Mensal</h3>
        ${evolucao.length === 0 ? '<p style="color:var(--color-text-muted);">Sem dado mensurável nessa disciplina ainda.</p>' : '<canvas id="chart-evolucao-mensal" height="80"></canvas>'}
      </div>
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Média Móvel Semanal</h3>
        ${mediaMovel.length === 0 ? '<p style="color:var(--color-text-muted);">Sem dado mensurável nessa disciplina ainda.</p>' : '<canvas id="chart-media-movel" height="80"></canvas>'}
      </div>
    `;

    if (evolucao.length > 0) {
      renderBarChart("chart-evolucao-mensal", disciplineSection.querySelector("#chart-evolucao-mensal"), {
        labels: evolucao.map((e) => e.mes),
        label: "% acerto no mês",
        data: evolucao.map((e) => e.pct_acerto),
      });
    }
    if (mediaMovel.length > 0) {
      renderLineChart("chart-media-movel", disciplineSection.querySelector("#chart-media-movel"), {
        labels: mediaMovel.map((d) => d.dia),
        datasets: [
          { label: "% acerto do dia", data: mediaMovel.map((d) => d.pct_acerto_dia), borderColor: "#9fb3d1", borderDash: [4, 4], pointRadius: 2, tension: 0.2 },
          { label: "Média móvel 7 dias", data: mediaMovel.map((d) => d.media_movel_7d), borderColor: "#1f3864", borderWidth: 2, pointRadius: 2, tension: 0.2 },
        ],
      });
    }
  }

  async function renderComparativos() {
    let porBanca, porConcurso;
    try {
      [porBanca, porConcurso] = await Promise.all([getComparativoBanca(), getComparativoConcurso()]);
    } catch (err) {
      comparativosSection.innerHTML = `<div class="alert alert--error">Erro ao carregar comparativos: ${escapeHtml(err.message)}</div>`;
      return;
    }

    comparativosSection.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Comparativo por Banca</h3>
        ${renderComparativoTable(porBanca, "banca_nome")}
      </div>
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Comparativo por Concurso</h3>
        ${renderComparativoTable(porConcurso, "concurso_nome")}
      </div>
    `;
  }

  function renderComparativoTable(rows, nameKey) {
    if (rows.length === 0) {
      return `<p style="color:var(--color-text-muted);">Nenhuma sessão com esse dado informado ainda.</p>`;
    }
    const trs = rows
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r[nameKey])}</td>
          <td>${formatPct(r.wilson_pct)}</td>
          <td>${r.questoes_total}</td>
        </tr>
      `
      )
      .join("");
    return `
      <table class="data-table">
        <tr><th>Nome</th><th>Wilson</th><th>Questões</th></tr>
        ${trs}
      </table>
    `;
  }
}

function renderBarChart(key, canvas, { labels, label, data }) {
  if (charts[key]) {
    charts[key].destroy();
  }
  charts[key] = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ label, data, backgroundColor: "#2e5395" }] },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatPct(ctx.parsed.y)}` } } },
    },
  });
}

function renderLineChart(key, canvas, { labels, datasets }) {
  if (charts[key]) {
    charts[key].destroy();
  }
  charts[key] = new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => formatPct(v) } } },
      plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatPct(ctx.parsed.y)}` } } },
    },
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
