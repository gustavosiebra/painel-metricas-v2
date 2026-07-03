// Tela "Prioridade" (Fase 5-B) — lista de cadernos ordenada por
// v_prioridade_caderno.prioridade_rank (recorrência histórica × Wilson do
// caderno). Sinal novo e separado do Peso manual por disciplina (não mexe
// em exam_disciplines.weight).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines } from "../services/catalogService.js";
import { listPriority } from "../services/priorityService.js";

const PRIORIDADE_LABELS = {
  prioridade_maxima: { label: "Prioridade máxima", color: "var(--color-error)" },
  testar_logo: { label: "Testar logo", color: "var(--color-error)" },
  manutencao: { label: "Manutenção", color: "var(--color-text-muted)" },
  prioridade_media: { label: "Prioridade média", color: "#b45309" },
  testar_quando_puder: { label: "Testar quando puder", color: "#b45309" },
  manutencao_leve: { label: "Manutenção leve", color: "var(--color-text-muted)" },
  baixa_prioridade: { label: "Baixa prioridade", color: "var(--color-text-muted)" },
  nao_prioritario: { label: "Não prioritário", color: "var(--color-text-muted)" },
};

const RECORRENCIA_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };
const WILSON_LABELS = { preliminar: "Preliminar", critico: "Crítico", atencao: "Atenção", consolidado: "Consolidado" };
const DISPERSAO_LABELS = {
  sem_dispersao: "Sem dado",
  estavel: "Estável",
  moderada: "Moderada",
  banca_dependente: "Banca-dependente",
  fortemente_banca_dependente: "Fortemente banca-dependente",
};

export async function renderPriorityPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/prioridade")}
        <main class="app-content">
          <h2 class="form-title">Prioridade por Caderno</h2>
          <p style="color:var(--color-text-muted); max-width:640px;">
            Cruza a recorrência histórica do caderno naquela banca (ponderada entre as bancas que você
            estuda) com o seu Diagnóstico Wilson naquele caderno específico. Sinal novo, separado do
            Peso manual por disciplina — não substitui nem altera aquele.
          </p>
          <div class="card" style="margin-bottom:16px;">
            <div class="form-field" style="margin-bottom:0; max-width:320px;">
              <label for="filter-discipline">Disciplina</label>
              <select id="filter-discipline"><option value="">Todas</option></select>
            </div>
          </div>
          <div id="priority-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const disciplineSelect = container.querySelector("#filter-discipline");
  const content = container.querySelector("#priority-content");

  try {
    const disciplines = await listDisciplines();
    disciplineSelect.innerHTML += disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("");
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar disciplinas: ${escapeHtml(err.message)}</div>`;
    return;
  }

  disciplineSelect.addEventListener("change", loadPriority);

  let currentRows = [];
  const sortState = { column: "prioridade_rank", direction: "asc" };

  await loadPriority();

  async function loadPriority() {
    content.innerHTML = "<p>Carregando…</p>";
    try {
      currentRows = await listPriority({ disciplineId: disciplineSelect.value || undefined });
      renderTable(sortRows(currentRows));
    } catch (err) {
      content.innerHTML = `<div class="alert alert--error">Erro ao carregar prioridade: ${escapeHtml(err.message)}</div>`;
    }
  }

  function sortRows(rows) {
    const { column, direction } = sortState;
    const factor = direction === "asc" ? 1 : -1;
    const sorted = [...rows];
    sorted.sort((a, b) => {
      let va = a[column];
      let vb = b[column];
      if (va == null) va = column === "prioridade_rank" ? 99 : "";
      if (vb == null) vb = column === "prioridade_rank" ? 99 : "";
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

  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      content.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">Nenhum caderno encontrado — precisa de pelo menos uma sessão ativa com banca real registrada.</p>
        </div>
      `;
      return;
    }

    const trs = rows
      .map((r) => {
        const p = PRIORIDADE_LABELS[r.classificacao_prioridade] || { label: r.classificacao_prioridade, color: "var(--color-text-muted)" };
        const wilsonText = r.wilson_pct != null ? `${Number(r.wilson_pct).toFixed(1)}%` : "—";
        return `
          <tr>
            <td><span style="color:${p.color}; font-weight:600;">${escapeHtml(p.label)}</span></td>
            <td title="${escapeHtml(r.caderno_nome)}">${escapeHtml(truncateLabel(r.caderno_nome))}</td>
            <td>${escapeHtml(r.disciplina_nome)}</td>
            <td>${RECORRENCIA_LABELS[r.classificacao_recorrencia] || r.classificacao_recorrencia}</td>
            <td>${DISPERSAO_LABELS[r.classificacao_dispersao] || r.classificacao_dispersao}</td>
            <td>${WILSON_LABELS[r.classificacao_wilson] || r.classificacao_wilson} ${wilsonText !== "—" ? `(${wilsonText})` : ""}</td>
          </tr>
        `;
      })
      .join("");

    content.innerHTML = `
      <div class="card">
        <table class="data-table">
          <tr>
            <th data-sort-col="prioridade_rank" style="cursor:pointer;">Prioridade${sortIndicator("prioridade_rank")}</th>
            <th>Caderno</th>
            <th data-sort-col="disciplina_nome" style="cursor:pointer;">Disciplina${sortIndicator("disciplina_nome")}</th>
            <th data-sort-col="classificacao_recorrencia" style="cursor:pointer;">Recorrência${sortIndicator("classificacao_recorrencia")}</th>
            <th>Dispersão entre bancas</th>
            <th data-sort-col="wilson_pct" style="cursor:pointer;">Wilson${sortIndicator("wilson_pct")}</th>
          </tr>
          ${trs}
        </table>
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
        renderTable(sortRows(currentRows));
      });
    });
  }
}

function truncateLabel(text, maxLen = 60) {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
