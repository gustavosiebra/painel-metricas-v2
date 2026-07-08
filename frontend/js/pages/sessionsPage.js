// Tela "Sessões" (Doc. 16, T04) — consultar, filtrar, editar e arquivar
// (exclusão lógica por padrão — RN-009, nunca apagar histórico sem querer).
// Exportar CSV adicionado em 05/07/2026 (pedido do usuário) — exporta a
// visão atual (com filtro e ordenação aplicados), gerado no cliente, sem
// round-trip nenhum ao banco.
// "Apagar definitivamente" adicionado em 05/07/2026 (pedido explícito do
// usuário, exceção consciente a RN-009) — precisava conseguir apagar uma
// sessão de teste que travava a exclusão de uma disciplina de teste no
// Catálogo (discipline_id é obrigatório em study_sessions). Confirmação
// reforçada (digitar "APAGAR") justamente porque isso é irreversível.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines } from "../services/catalogService.js";
import { listSessions, setSessionStatus, deleteStudySession } from "../services/studyService.js";
import { navigate } from "../router.js";

const STUDY_TYPE_LABELS = {
  questao: "Questões",
  simulado: "Simulado",
  discursiva: "Discursiva",
  revisao: "Revisão",
  flashcard: "Flashcard",
  leitura: "Leitura",
  videoaula: "Videoaula",
};

export async function renderSessionsPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/sessoes")}
        <main class="app-content">
          <h2 class="form-title">Sessões</h2>
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex; gap:16px; align-items:end; flex-wrap:wrap;">
              <div class="form-field" style="margin-bottom:0; min-width:220px;">
                <label for="filter-discipline">Disciplina</label>
                <select id="filter-discipline"><option value="">Todas</option></select>
              </div>
              <div class="form-field" style="margin-bottom:0;">
                <label for="filter-status">Mostrar</label>
                <select id="filter-status">
                  <option value="ativo">Ativas</option>
                  <option value="inativo">Arquivadas</option>
                  <option value="">Todas</option>
                </select>
              </div>
              <a href="#/sessoes/nova" class="btn" style="width:auto; padding:8px 16px;">+ Nova Sessão</a>
              <button id="export-csv-btn" type="button" class="btn" style="width:auto; padding:8px 16px; background:var(--color-surface); color:var(--color-primary); border:1px solid var(--color-border);">Exportar CSV</button>
            </div>
          </div>
          <div id="sessions-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const disciplineSelect = container.querySelector("#filter-discipline");
  const statusSelect = container.querySelector("#filter-status");
  const content = container.querySelector("#sessions-content");
  let disciplinesById = {};

  try {
    const disciplines = await listDisciplines();
    disciplinesById = Object.fromEntries(disciplines.map((d) => [d.id, d.name]));
    disciplineSelect.innerHTML += disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("");
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar disciplinas: ${escapeHtml(err.message)}</div>`;
    return;
  }

  disciplineSelect.addEventListener("change", loadSessions);
  statusSelect.addEventListener("change", loadSessions);

  const exportCsvBtn = container.querySelector("#export-csv-btn");
  exportCsvBtn.addEventListener("click", () => exportarCsv(sortSessions(currentSessions), disciplinesById));

  let currentSessions = [];
  // Ordenação é só em memória, sobre o que já foi carregado — não refaz a
  // consulta ao trocar de coluna/direção, só reordena o array atual.
  const sortState = { column: "occurred_at", direction: "desc" };

  await loadSessions();

  async function loadSessions() {
    content.innerHTML = "<p>Carregando…</p>";
    try {
      currentSessions = await listSessions({
        disciplineId: disciplineSelect.value || undefined,
        status: statusSelect.value || undefined,
      });
      renderTable(sortSessions(currentSessions));
    } catch (err) {
      content.innerHTML = `<div class="alert alert--error">Erro ao carregar sessões: ${escapeHtml(err.message)}</div>`;
    }
  }

  function sortSessions(sessions) {
    const { column, direction } = sortState;
    const factor = direction === "asc" ? 1 : -1;
    const sorted = [...sessions];
    sorted.sort((a, b) => {
      let va, vb;
      if (column === "discipline") {
        va = disciplinesById[a.discipline_id] || "";
        vb = disciplinesById[b.discipline_id] || "";
      } else if (column === "study_type") {
        va = STUDY_TYPE_LABELS[a.study_type] || a.study_type || "";
        vb = STUDY_TYPE_LABELS[b.study_type] || b.study_type || "";
      } else {
        va = a.occurred_at || "";
        vb = b.occurred_at || "";
      }
      if (va < vb) return -1 * factor;
      if (va > vb) return 1 * factor;
      return 0;
    });
    return sorted;
  }

  function sortIndicator(column) {
    if (sortState.column !== column) return "";
    return sortState.direction === "asc" ? " ▲" : " ▼";
  }

  function renderTable(sessions) {
    if (!sessions || sessions.length === 0) {
      content.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">Nenhuma sessão encontrada com esse filtro.</p>
        </div>
      `;
      return;
    }

    const rows = sessions
      .map((s) => {
        const result = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
        const desempenho = result
          ? `${result.correct_total}/${result.questions_total}${result.score != null ? ` · nota ${result.score}` : ""}`
          : "—";
        const isArchived = s.status === "inativo";
        return `
          <tr>
            <td>${new Date(s.occurred_at).toLocaleDateString("pt-BR")}</td>
            <td>${escapeHtml(disciplinesById[s.discipline_id] || "—")}</td>
            <td>${STUDY_TYPE_LABELS[s.study_type] || s.study_type}</td>
            <td>${desempenho}</td>
            <td>${s.duration_minutes} min</td>
            <td>
              <button class="btn-link" data-edit="${s.id}">Editar</button>
              &nbsp;|&nbsp;
              <button class="btn-link" data-toggle="${s.id}" data-next-status="${isArchived ? "ativo" : "inativo"}">
                ${isArchived ? "Reativar" : "Arquivar"}
              </button>
              &nbsp;|&nbsp;
              <button class="btn-link" style="color:var(--color-error);" data-delete="${s.id}">Apagar definitivamente</button>
            </td>
          </tr>
        `;
      })
      .join("");

    content.innerHTML = `
      <div class="card">
        <div style="overflow-x:auto;">
          <table class="data-table">
            <tr>
              <th data-sort-col="occurred_at" style="cursor:pointer;">Data${sortIndicator("occurred_at")}</th>
              <th data-sort-col="discipline" style="cursor:pointer;">Disciplina${sortIndicator("discipline")}</th>
              <th data-sort-col="study_type" style="cursor:pointer;">Tipo${sortIndicator("study_type")}</th>
              <th>Desempenho</th>
              <th>Tempo</th>
              <th>Ações</th>
            </tr>
            ${rows}
          </table>
        </div>
      </div>
    `;

    content.querySelectorAll("[data-sort-col]").forEach((th) => {
      th.addEventListener("click", () => {
        const column = th.dataset.sortCol;
        if (sortState.column === column) {
          sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState.column = column;
          sortState.direction = "asc";
        }
        renderTable(sortSessions(currentSessions));
      });
    });

    content.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => navigate("/sessoes/nova", { id: btn.dataset.edit }));
    });

    content.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await setSessionStatus(btn.dataset.toggle, btn.dataset.nextStatus);
          await loadSessions();
        } catch (err) {
          content.innerHTML = `<div class="alert alert--error">Erro ao atualizar status: ${escapeHtml(err.message)}</div>`;
        }
      });
    });

    content.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        // Confirmação reforçada de propósito (pedido do usuário): apagar
        // aqui é físico e sem volta, diferente de Arquivar. Exigir digitar
        // a palavra evita clique acidental num botão que já é destrutivo.
        const digitado = window.prompt('Isso apaga a sessão PARA SEMPRE, sem volta (diferente de Arquivar). Digite APAGAR para confirmar:');
        if (digitado !== "APAGAR") return;
        btn.disabled = true;
        try {
          await deleteStudySession(btn.dataset.delete);
          await loadSessions();
        } catch (err) {
          content.innerHTML = `<div class="alert alert--error">Erro ao apagar: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

// Exportar CSV (05/07/2026, pedido do usuário) — exporta exatamente o que
// está filtrado/ordenado na tela no momento do clique, não a base inteira.
function exportarCsv(sessions, disciplinesById) {
  if (!sessions || sessions.length === 0) {
    window.alert("Nenhuma sessão pra exportar com o filtro atual.");
    return;
  }

  const headers = ["Data", "Disciplina", "Tipo", "Acertos", "Total de questões", "Nota", "Tempo (min)", "Status"];
  const linhas = sessions.map((s) => {
    const result = Array.isArray(s.session_results) ? s.session_results[0] : s.session_results;
    return [
      new Date(s.occurred_at).toLocaleDateString("pt-BR"),
      disciplinesById[s.discipline_id] || "",
      STUDY_TYPE_LABELS[s.study_type] || s.study_type || "",
      result?.correct_total ?? "",
      result?.questions_total ?? "",
      result?.score ?? "",
      s.duration_minutes ?? "",
      s.status === "inativo" ? "Arquivada" : "Ativa",
    ];
  });

  const csv = [headers, ...linhas]
    .map((linha) => linha.map(csvEscape).join(";"))
    .join("\r\n");

  // BOM (﻿) pra Excel abrir acentos certos sem precisar escolher encoding manual.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const hoje = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `sessoes-${hoje}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
