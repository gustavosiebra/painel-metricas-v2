// Tela de consulta do Catálogo (Doc. 15, M02 — Cadastro Base).
// Só leitura na V2 inicial: cadastro de bancas/disciplinas/concursos é feito pelo
// superusuário fora da UI por enquanto (ver TEC-009). Cadernos aparecem conforme
// forem criados no fluxo de Registro de Estudos (Fase 4).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExamBoards, listExams, listQuestionSets } from "../services/catalogService.js";

export async function renderCatalogPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/catalogo")}
        <main class="app-content">
          <h2 class="form-title">Catálogo</h2>
          <div id="catalog-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#catalog-content");

  try {
    const [disciplines, boards, exams, questionSets] = await Promise.all([
      listDisciplines(),
      listExamBoards(),
      listExams(),
      listQuestionSets(),
    ]);

    content.innerHTML = [
      renderSection("Disciplinas", disciplines, (d) => [d.name, d.category || "—", d.status]),
      renderSection("Bancas", boards, (b) => [b.name]),
      renderSection(
        "Concursos",
        exams,
        (e) => [e.name, e.year ?? "—", e.role ?? "—", e.exam_date ?? "—", e.status],
        undefined,
        ["Nome", "Ano", "Cargo", "Data da prova", "Status"]
      ),
      renderSection(
        "Cadernos",
        questionSets,
        (q) => [q.name, q.learning_level, q.status],
        "Nenhum caderno criado ainda — eles aparecem aqui conforme você registra sessões de estudo.",
        ["Nome", "Situação", "Status"]
      ),
    ].join("");
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar catálogo: ${escapeHtml(err.message)}</div>`;
  }
}

function renderSection(title, items, rowFn, emptyMessage, headers) {
  if (!items || items.length === 0) {
    return `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">${title} (0)</h3>
        <p style="color:var(--color-text-muted);">${emptyMessage || "Nenhum registro ainda."}</p>
      </div>
    `;
  }

  const headerRow = headers
    ? `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`
    : "";
  const rows = items
    .map((item) => `<tr>${rowFn(item).map((c) => `<td>${escapeHtml(String(c))}</td>`).join("")}</tr>`)
    .join("");

  return `
    <div class="card" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">${title} (${items.length})</h3>
      <table class="data-table">${headerRow}${rows}</table>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
