// Tela "Prioridade" (Fase 5-B) — lista de cadernos ordenada por
// v_prioridade_caderno.prioridade_rank (recorrência histórica × Wilson do
// caderno). Sinal novo e separado do Peso manual por disciplina (não mexe
// em exam_disciplines.weight).
//
// Filtro obrigatório (05/07/2026, mesmo padrão do Catálogo > Cadernos): a
// tabela não renderiza nada até o usuário escolher uma disciplina (ou
// explicitamente "Todas as disciplinas") — evita despejar todos os cadernos
// do catálogo de uma vez (a view cruza TODO o catálogo com as bancas que o
// usuário estuda, de propósito, pra também sinalizar cadernos nunca
// estudados que são frequentes — ver decisão anterior).
// Também aceita chegar via link do Dashboard (clique num card de Consolidado/
// Atenção/Crítico/Poucos dados) com ?classificacao=X na URL — nesse caso já
// abre com "Todas as disciplinas" + aquela classificação pré-marcados,
// mostrando a lista direto, sem exigir clique extra.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines } from "../services/catalogService.js";
import { listPriority } from "../services/priorityService.js";
import { formatPct } from "../utils/format.js";

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
// "Preliminar" virou "Poucos dados" (pedido do usuário, 03/07/2026, mesmo
// ajuste feito no Dashboard) — mais claro que só falta questão suficiente
// pra classificar, não é um resultado.
const WILSON_LABELS = { preliminar: "Poucos dados", critico: "Crítico", atencao: "Atenção", consolidado: "Consolidado" };
const WILSON_FILTRO_OPCOES = [
  ["", "Todas"],
  ["consolidado", "Consolidado"],
  ["atencao", "Atenção"],
  ["critico", "Crítico"],
  ["preliminar", "Poucos dados"],
];
const DISPERSAO_LABELS = {
  sem_dispersao: "Sem dado",
  estavel: "Estável",
  moderada: "Moderada",
  banca_dependente: "Banca-dependente",
  fortemente_banca_dependente: "Fortemente banca-dependente",
};

export async function renderPriorityPage(container, params) {
  const classificacaoInicial = params?.get ? params.get("classificacao") : null;

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
            <div style="display:flex; gap:16px; align-items:end; flex-wrap:wrap;">
              <div class="form-field" style="margin-bottom:0; min-width:240px;">
                <label for="filter-discipline">Disciplina</label>
                <select id="filter-discipline">
                  <option value="" disabled ${!classificacaoInicial ? "selected" : ""}>— Escolha —</option>
                  <option value="__todas__" ${classificacaoInicial ? "selected" : ""}>Todas as disciplinas</option>
                </select>
              </div>
              <div class="form-field" style="margin-bottom:0; min-width:200px;">
                <label for="filter-classificacao">Classificação Wilson</label>
                <select id="filter-classificacao">
                  ${WILSON_FILTRO_OPCOES.map(([v, l]) => `<option value="${v}" ${classificacaoInicial === v ? "selected" : ""}>${l}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>
          <p id="priority-placeholder" style="color:var(--color-text-muted);">Escolha uma disciplina acima (ou "Todas as disciplinas") pra ver a prioridade.</p>
          <div id="priority-content" style="display:none;"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const disciplineSelect = container.querySelector("#filter-discipline");
  const classificacaoSelect = container.querySelector("#filter-classificacao");
  const placeholder = container.querySelector("#priority-placeholder");
  const content = container.querySelector("#priority-content");

  try {
    const disciplines = await listDisciplines();
    disciplineSelect.innerHTML += disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("");
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar disciplinas: ${escapeHtml(err.message)}</div>`;
    content.style.display = "block";
    placeholder.style.display = "none";
    return;
  }

  disciplineSelect.addEventListener("change", () => {
    if (!disciplineSelect.value) return; // opção "— Escolha —" (disabled), não deveria disparar, mas defensivo
    loadPriority();
  });
  classificacaoSelect.addEventListener("change", () => {
    if (!disciplineSelect.value) return; // ainda não escolheu disciplina — nada carregado pra refiltrar
    renderTable(sortRows(aplicarFiltroClassificacao(currentRows)));
  });

  let currentRows = [];
  const sortState = { column: "prioridade_rank", direction: "asc" };

  // Deep-link do Dashboard (?classificacao=X): já chega com "Todas as
  // disciplinas" selecionado (ver template acima) — carrega direto, sem
  // esperar o usuário mexer em nada.
  if (classificacaoInicial) {
    await loadPriority();
  }

  async function loadPriority() {
    placeholder.style.display = "none";
    content.style.display = "block";
    content.innerHTML = "<p>Carregando…</p>";
    try {
      const disciplineId = disciplineSelect.value === "__todas__" ? undefined : disciplineSelect.value;
      currentRows = await listPriority({ disciplineId });
      renderTable(sortRows(aplicarFiltroClassificacao(currentRows)));
    } catch (err) {
      content.innerHTML = `<div class="alert alert--error">Erro ao carregar prioridade: ${escapeHtml(err.message)}</div>`;
    }
  }

  function aplicarFiltroClassificacao(rows) {
    const classificacao = classificacaoSelect.value;
    if (!classificacao) return rows;
    return rows.filter((r) => (r.classificacao_wilson || "preliminar") === classificacao);
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
          <p style="color:var(--color-text-muted);">Nenhum caderno encontrado com esse filtro.</p>
        </div>
      `;
      return;
    }

    const trs = rows
      .map((r) => {
        const p = PRIORIDADE_LABELS[r.classificacao_prioridade] || { label: r.classificacao_prioridade, color: "var(--color-text-muted)" };
        const wilsonText = formatPct(r.wilson_pct);
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
        renderTable(sortRows(aplicarFiltroClassificacao(currentRows)));
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
