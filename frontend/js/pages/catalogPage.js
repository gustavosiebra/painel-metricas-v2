// Tela "Catálogo" (Doc. 15, M02) — consulta de Disciplinas, Bancas, Concursos
// e Cadernos. Reintroduzida em 05/07/2026 (Fase 10) pra TODO usuário, incluindo
// admin: cada um só vê global (user_id nulo) + o que ele mesmo cadastrou (RLS
// cuida disso sozinho, não replicamos a regra aqui). Editar/Apagar só aparece
// nos itens que são do próprio usuário — em item global o botão nem existe,
// porque a RLS bloquearia mesmo (é reforço visual, a segurança real é RLS).
// Cadernos ganhou filtro por disciplina aqui (pedido do usuário) porque a
// lista já passa de mil linhas — busca só por nome não ajuda muito sozinha.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getState } from "../state.js";
import {
  listDisciplines,
  listExamBoards,
  listExams,
  listQuestionSets,
  updateDisciplineName,
  updateExamBoardName,
  updateExamName,
  updateQuestionSetName,
  deleteDiscipline,
  deleteExamBoard,
  deleteExam,
  deleteQuestionSet,
} from "../services/catalogService.js";

export async function renderCatalogPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/catalogo")}
        <main class="app-content">
          <h2 class="form-title">Catálogo</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Disciplinas, Bancas, Concursos e Cadernos. Editar/Apagar só disponível nos itens que você mesmo cadastrou.
          </p>
          <div id="catalog-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#catalog-content");
  const { user } = getState();

  await carregarERenderizar(content, user.id);
}

async function carregarERenderizar(content, userId) {
  content.innerHTML = "<p>Carregando…</p>";
  let disciplines, boards, exams, questionSets;
  try {
    [disciplines, boards, exams, questionSets] = await Promise.all([
      listDisciplines(),
      listExamBoards(),
      listExams(),
      listQuestionSets(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar catálogo: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const disciplineNameMap = new Map(disciplines.map((d) => [d.id, d.name]));

  content.innerHTML = [
    renderSection({
      titulo: "Disciplinas",
      itens: disciplines,
      userId,
      colunasExtra: [
        { header: "Categoria", extrair: (item) => escapeHtml(item.category || "—") },
        { header: "Status", extrair: (item) => escapeHtml(item.status || "—") },
      ],
    }),
    renderSection({
      titulo: "Bancas",
      itens: boards,
      userId,
      colunasExtra: [],
    }),
    renderSection({
      titulo: "Concursos",
      itens: exams,
      userId,
      colunasExtra: [
        { header: "Ano", extrair: (item) => escapeHtml(item.year ?? "—") },
        { header: "Cargo", extrair: (item) => escapeHtml(item.role || "—") },
        { header: "Status", extrair: (item) => escapeHtml(item.status || "—") },
      ],
    }),
    renderSection({
      titulo: "Cadernos",
      itens: questionSets,
      userId,
      colunasExtra: [
        { header: "Disciplina", extrair: (item) => escapeHtml(disciplineNameMap.get(item.discipline_id) || "—") },
        { header: "Situação", extrair: (item) => escapeHtml(item.learning_level || "—") },
        { header: "Status", extrair: (item) => escapeHtml(item.status || "—") },
      ],
      filtroDisciplina: disciplines,
    }),
  ]
    .map((s) => s.html)
    .join("");

  wireSection(content, "discipline", { update: updateDisciplineName, delete: deleteDiscipline }, () => carregarERenderizar(content, userId));
  wireSection(content, "board", { update: updateExamBoardName, delete: deleteExamBoard }, () => carregarERenderizar(content, userId));
  wireSection(content, "exam", { update: updateExamName, delete: deleteExam }, () => carregarERenderizar(content, userId));
  wireSection(content, "questionSet", { update: updateQuestionSetName, delete: deleteQuestionSet }, () => carregarERenderizar(content, userId));

  // Busca por nome, em todas as seções.
  content.querySelectorAll("[data-filter-input]").forEach((input) => {
    const tipo = input.dataset.filterInput;
    const table = content.querySelector(`[data-filter-table="${tipo}"]`);
    input.addEventListener("input", () => aplicarFiltros(table, input.value, disciplineFilterFor(content, tipo)));
  });

  // Filtro por disciplina, só existe na seção de Cadernos.
  const disciplineFilterSelect = content.querySelector("[data-filter-discipline]");
  if (disciplineFilterSelect) {
    disciplineFilterSelect.addEventListener("change", () => {
      const table = content.querySelector('[data-filter-table="questionSet"]');
      const nameInput = content.querySelector('[data-filter-input="questionSet"]');
      aplicarFiltros(table, nameInput ? nameInput.value : "", disciplineFilterSelect.value);
    });
  }
}

function disciplineFilterFor(content, tipo) {
  if (tipo !== "questionSet") return "";
  const select = content.querySelector("[data-filter-discipline]");
  return select ? select.value : "";
}

function aplicarFiltros(table, termoNome, disciplinaId) {
  const termo = (termoNome || "").trim().toLowerCase();
  table.querySelectorAll("[data-filter-row]").forEach((row) => {
    const bateNome = !termo || row.dataset.filterNome.includes(termo);
    const bateDisciplina = !disciplinaId || row.dataset.filterDiscipline === disciplinaId;
    row.style.display = bateNome && bateDisciplina ? "" : "none";
  });
}

function wireSection(content, tipo, acoes, onChange) {
  content.querySelectorAll(`[data-edit-tipo="${tipo}"]`).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.editId;
      const nomeAtual = btn.dataset.editNome;
      const novoNome = window.prompt("Novo nome:", nomeAtual);
      if (novoNome === null) return;
      const trimmed = novoNome.trim();
      if (!trimmed || trimmed === nomeAtual) return;
      try {
        await acoes.update(id, trimmed);
        await onChange();
      } catch (err) {
        window.alert("Erro ao editar: " + (err.message || "desconhecido"));
      }
    });
  });

  content.querySelectorAll(`[data-delete-tipo="${tipo}"]`).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteId;
      const nome = btn.dataset.deleteNome;
      if (!window.confirm(`Apagar "${nome}" definitivamente? Isso não pode ser desfeito.`)) return;
      try {
        await acoes.delete(id);
        await onChange();
      } catch (err) {
        if (err.code === "23503") {
          window.alert(`Não é possível apagar "${nome}": existem sessões, cadernos ou pesos vinculados a esse registro.`);
        } else {
          window.alert("Erro ao apagar: " + (err.message || "desconhecido"));
        }
      }
    });
  });
}

function renderSection({ titulo, itens, userId, colunasExtra, filtroDisciplina }) {
  const tipoPorTitulo = { Disciplinas: "discipline", Bancas: "board", Concursos: "exam", Cadernos: "questionSet" };
  const tipo = tipoPorTitulo[titulo];

  if (!itens || itens.length === 0) {
    return {
      html: `
        <div class="card" style="margin-bottom:16px;">
          <h3 style="margin-top:0;">${titulo} (0)</h3>
          <p style="color:var(--color-text-muted);">Nenhum registro ainda.</p>
        </div>
      `,
    };
  }

  const extraHeaders = colunasExtra.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const rows = itens
    .map((item) => {
      const extraCols = colunasExtra.map((c) => `<td>${c.extrair(item)}</td>`).join("");
      const isOwn = item.user_id === userId;
      const dono = item.user_id ? (isOwn ? "Seu" : "Outro usuário") : "Global";
      const acoes = isOwn
        ? `
          <button class="btn-link" data-edit-tipo="${tipo}" data-edit-id="${item.id}" data-edit-nome="${escapeHtml(item.name)}">Editar</button>
          &nbsp;|&nbsp;
          <button class="btn-link" style="color:var(--color-error);" data-delete-tipo="${tipo}" data-delete-id="${item.id}" data-delete-nome="${escapeHtml(item.name)}">Apagar</button>
        `
        : `<span style="color:var(--color-text-muted);">—</span>`;
      const filterDiscipline = tipo === "questionSet" ? ` data-filter-discipline="${item.discipline_id || ""}"` : "";
      return `
        <tr data-filter-row data-filter-nome="${escapeHtml(item.name.toLowerCase())}"${filterDiscipline}>
          <td>${escapeHtml(item.name)}</td>
          ${extraCols}
          <td>${dono}</td>
          <td>${acoes}</td>
        </tr>
      `;
    })
    .join("");

  const filtroDisciplinaHtml =
    tipo === "questionSet" && filtroDisciplina && filtroDisciplina.length > 0
      ? `
        <div class="form-field" style="max-width:280px; display:inline-block; margin-right:12px;">
          <select data-filter-discipline>
            <option value="">Todas as disciplinas</option>
            ${filtroDisciplina.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
      `
      : "";

  return {
    html: `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">${titulo} (${itens.length})</h3>
        <div style="display:flex; align-items:end; flex-wrap:wrap; margin-bottom:8px;">
          ${filtroDisciplinaHtml}
          <div class="form-field" style="max-width:320px; margin-bottom:0;">
            <input type="text" data-filter-input="${tipo}" placeholder="Buscar por nome..." />
          </div>
        </div>
        <table class="data-table" data-filter-table="${tipo}">
          <tr><th>Nome</th>${extraHeaders}<th>Dono</th><th>Ações</th></tr>
          ${rows}
        </table>
      </div>
    `,
  };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
