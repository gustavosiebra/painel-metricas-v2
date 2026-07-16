// Tela "Catálogo" (Doc. 15, M02) — consulta de Concursos, Bancas, Disciplinas
// e Cadernos. Reintroduzida em 05/07/2026 (Fase 10) pra TODO usuário, incluindo
// admin: cada um só vê global (user_id nulo) + o que ele mesmo cadastrou (RLS
// cuida disso sozinho, não replicamos a regra aqui). Editar/Apagar só aparece
// nos itens que são do próprio usuário — em item global o botão nem existe,
// porque a RLS bloquearia mesmo (é reforço visual, a segurança real é RLS).
// Ordem Concurso → Banca → Disciplina → Caderno = mesma hierarquia de cima
// pra baixo usada em Nova Sessão (pedido do usuário, 05/07/2026).
// Colunas reduzidas ao que diferencia cada linha — "Status" tirado de todas
// as seções (era sempre "ativo", zero informação útil) — pedido do usuário.
// Cadernos passa de 1000 linhas: NÃO renderiza nada até o usuário escolher
// uma disciplina ou digitar um nome — evita o "dump" de mil linhas de uma vez
// (pedido do usuário, 05/07/2026).
//
// Peso incorporado aqui como sub-aba (05/07/2026, reorganização de navegação
// discutida e aprovada pelo usuário) — Catálogo e Peso são a mesma
// preocupação de fundo ("estrutura por trás dos números"), então viraram uma
// única entrada na barra em vez de duas. A tela "/pesos" antiga foi
// descontinuada (weightPage.js fica no repo sem uso, sem risco); a lógica de
// listar/editar/remover peso foi trazida pra cá quase sem alteração.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getState } from "../state.js";
import { supabase } from "../supabaseClient.js";
import { formatPct } from "../utils/format.js";
import { listWeightSummary, upsertWeight } from "../services/weightService.js";
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
            Concursos, Bancas, Disciplinas, Cadernos e Peso. Editar/Apagar só disponível nos itens que você mesmo cadastrou.
          </p>
          <div class="subtabs">
            <button type="button" class="subtab-btn subtab-btn--active" data-subtab="cadastro">Cadastro</button>
            <button type="button" class="subtab-btn" data-subtab="peso">Peso</button>
          </div>
          <div id="subtab-cadastro">
            <div id="catalog-content"><p>Carregando…</p></div>
          </div>
          <div id="subtab-peso" style="display:none;">
            <div id="weight-alert-box"></div>
            <div id="weights-table"><p>Carregando…</p></div>
          </div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();

  // Sub-abas: Cadastro (padrão) e Peso — troca só visibilidade, sem recarregar
  // o que já foi buscado. Peso é carregado sob demanda (só no primeiro clique
  // na aba), pra não pagar o custo da consulta cruzada com Wilson/Prioridade
  // em quem só veio mexer no catálogo.
  let pesoCarregado = false;
  container.querySelectorAll("[data-subtab]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const alvo = btn.dataset.subtab;
      container.querySelectorAll("[data-subtab]").forEach((b) => b.classList.toggle("subtab-btn--active", b === btn));
      container.querySelector("#subtab-cadastro").style.display = alvo === "cadastro" ? "block" : "none";
      container.querySelector("#subtab-peso").style.display = alvo === "peso" ? "block" : "none";
      if (alvo === "peso" && !pesoCarregado) {
        pesoCarregado = true;
        await carregarPeso(container, user.id);
      }
    });
  });

  const content = container.querySelector("#catalog-content");
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

  content.innerHTML = [
    renderSection({
      titulo: "Concursos",
      itens: exams,
      userId,
      colunasExtra: [
        { header: "Ano", extrair: (item) => escapeHtml(item.year ?? "—") },
        { header: "Cargo", extrair: (item) => escapeHtml(item.role || "—") },
      ],
    }),
    renderSection({
      titulo: "Bancas",
      itens: boards,
      userId,
      colunasExtra: [],
    }),
    renderSection({
      titulo: "Disciplinas",
      itens: disciplines,
      userId,
      colunasExtra: [{ header: "Categoria", extrair: (item) => escapeHtml(item.category || "—") }],
    }),
    renderSection({
      titulo: "Cadernos",
      itens: questionSets,
      userId,
      colunasExtra: [{ header: "Situação", extrair: (item) => escapeHtml(item.learning_level || "—") }],
      filtroDisciplina: disciplines,
      exigeFiltro: true,
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
    input.addEventListener("input", () => aplicarFiltros(content, tipo));
  });

  // Filtro por disciplina, só existe na seção de Cadernos.
  const disciplineFilterSelect = content.querySelector("[data-filter-discipline]");
  if (disciplineFilterSelect) {
    disciplineFilterSelect.addEventListener("change", () => aplicarFiltros(content, "questionSet"));
  }
}

function aplicarFiltros(content, tipo) {
  const table = content.querySelector(`[data-filter-table="${tipo}"]`);
  const placeholder = content.querySelector(`[data-filter-placeholder="${tipo}"]`);
  const nameInput = content.querySelector(`[data-filter-input="${tipo}"]`);
  const disciplineSelect = tipo === "questionSet" ? content.querySelector("[data-filter-discipline]") : null;

  const termo = (nameInput?.value || "").trim().toLowerCase();
  const disciplinaId = disciplineSelect ? disciplineSelect.value : "";
  const exigeFiltro = table?.dataset.exigeFiltro === "true";

  // Cadernos (exigeFiltro): sem disciplina escolhida E sem busca por nome,
  // não mostra a tabela — só o aviso pedindo pra escolher/buscar. Evita
  // renderizar as 1000 linhas de uma vez só de abrir a tela.
  if (exigeFiltro && !termo && !disciplinaId) {
    if (table) table.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
    return;
  }
  if (table) table.style.display = "";
  if (placeholder) placeholder.style.display = "none";

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

function renderSection({ titulo, itens, userId, colunasExtra, filtroDisciplina, exigeFiltro }) {
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
        <div class="form-field" style="max-width:280px; margin-bottom:0; margin-right:12px;">
          <select data-filter-discipline id="filter-discipline-${tipo}" aria-label="Filtrar por disciplina">
            <option value="">Escolha uma disciplina…</option>
            ${filtroDisciplina.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
      `
      : "";

  const placeholderHtml = exigeFiltro
    ? `<p data-filter-placeholder="${tipo}" style="color:var(--color-text-muted);">Escolha uma disciplina acima ou busque por nome pra ver os cadernos.</p>`
    : "";

  return {
    html: `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">${titulo} (${itens.length})</h3>
        <div style="display:flex; align-items:end; flex-wrap:wrap; margin-bottom:8px;">
          ${filtroDisciplinaHtml}
          <div class="form-field" style="max-width:320px; margin-bottom:0;">
            <input type="text" data-filter-input="${tipo}" id="filter-input-${tipo}" aria-label="Buscar por nome" placeholder="Buscar por nome..." />
          </div>
        </div>
        ${placeholderHtml}
        <div style="overflow-x:auto;">
          <table class="data-table data-table--fixed" data-filter-table="${tipo}" data-exige-filtro="${!!exigeFiltro}" style="${exigeFiltro ? "display:none;" : ""} min-width:480px;">
            <tr><th style="width:32%;">Nome</th>${extraHeaders}<th style="width:90px;">Dono</th><th style="width:140px;">Ações</th></tr>
            ${rows}
          </table>
        </div>
      </div>
    `,
  };
}

// ---------------------------------------------------------------------------
// Peso (sub-aba) — trazido quase sem alteração de weightPage.js (agora
// descontinuada). Mesmo comportamento: lista cruzada com Wilson/Prioridade
// (v_prioridade), edição inline por linha, remoção direta.
async function carregarPeso(container, userId) {
  const alertBox = container.querySelector("#weight-alert-box");
  const tableBox = container.querySelector("#weights-table");

  let currentRows = [];
  let editingKey = null;

  await refreshTable();

  function keyOf(r) {
    return `${r.exam_id}|${r.discipline_id}`;
  }

  async function refreshTable() {
    alertBox.innerHTML = "";
    try {
      currentRows = await listWeightSummary();
    } catch (err) {
      tableBox.innerHTML = `<div class="alert alert--error">Erro ao carregar pesos: ${escapeHtml(err.message)}</div>`;
      return;
    }
    renderRows();
  }

  function renderRows() {
    if (currentRows.length === 0) {
      tableBox.innerHTML = `
        <div class="card">
          <p style="color:var(--color-text-muted);">
            Nenhum peso definido ainda. Defina pelo atalho obrigatório em Nova Sessão (1ª vez que usa um Concurso × Disciplina) ou clique em Editar aqui depois de criar um.
          </p>
        </div>
      `;
      return;
    }

    const trs = currentRows.map((r) => (editingKey === keyOf(r) ? linhaEdicao(r) : linhaExibicao(r))).join("");

    tableBox.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0;">Pesos definidos (${currentRows.length})</h3>
        <div style="overflow-x:auto;">
          <table class="data-table" style="min-width:640px;">
            <tr>
              <th>Concurso</th><th>Disciplina</th><th>Peso</th><th>Meta %</th>
              <th>Questões esp.</th><th>Wilson</th><th>Classificação</th><th>Ações</th>
            </tr>
            ${trs}
          </table>
        </div>
      </div>
    `;

    wireRowActions();
  }

  function linhaExibicao(r) {
    const wilsonText = formatPct(r.wilson_pct);
    return `
      <tr data-row-key="${keyOf(r)}">
        <td>${escapeHtml(r.concurso_nome || "—")}</td>
        <td>${escapeHtml(r.disciplina_nome || "—")}</td>
        <td>${escapeHtml(r.weight || "—")}</td>
        <td>${formatPct(r.target_accuracy)}</td>
        <td>${r.expected_questions ?? "—"}</td>
        <td>${wilsonText}</td>
        <td>${escapeHtml(r.classificacao || "—")}</td>
        <td>
          <button class="btn-link" data-exam="${r.exam_id}" data-discipline="${r.discipline_id}" data-action="edit">Editar</button>
          &nbsp;|&nbsp;
          <button class="btn-link" data-exam="${r.exam_id}" data-discipline="${r.discipline_id}" data-action="remove">Remover</button>
        </td>
      </tr>
    `;
  }

  function linhaEdicao(r) {
    const wilsonText = formatPct(r.wilson_pct);
    return `
      <tr data-row-key="${keyOf(r)}" style="background:var(--color-bg-subtle, #f5f5f5);">
        <td>${escapeHtml(r.concurso_nome || "—")}</td>
        <td>${escapeHtml(r.disciplina_nome || "—")}</td>
        <td>
          <select class="edit-weight" name="edit_weight" aria-label="Peso">
            <option value="baixo" ${r.weight === "baixo" ? "selected" : ""}>Baixo</option>
            <option value="alto" ${r.weight === "alto" ? "selected" : ""}>Alto</option>
          </select>
        </td>
        <td><input type="number" class="edit-target" name="edit_target" aria-label="Meta de acerto (%)" min="0" max="100" step="0.1" value="${r.target_accuracy ?? ""}" style="width:80px;" /></td>
        <td><input type="number" class="edit-expected" name="edit_expected" aria-label="Questões esperadas" min="0" step="1" value="${r.expected_questions ?? ""}" style="width:80px;" /></td>
        <td>${wilsonText}</td>
        <td>${escapeHtml(r.classificacao || "—")}</td>
        <td>
          <button class="btn-link" data-exam="${r.exam_id}" data-discipline="${r.discipline_id}" data-action="save">Salvar</button>
          &nbsp;|&nbsp;
          <button class="btn-link" data-action="cancel">Cancelar</button>
        </td>
      </tr>
    `;
  }

  function wireRowActions() {
    tableBox.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        editingKey = `${btn.dataset.exam}|${btn.dataset.discipline}`;
        renderRows();
      });
    });

    tableBox.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        editingKey = null;
        renderRows();
      });
    });

    tableBox.querySelectorAll('[data-action="save"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const weight = tr.querySelector(".edit-weight").value;
        const targetRaw = tr.querySelector(".edit-target").value;
        const expectedRaw = tr.querySelector(".edit-expected").value;
        try {
          await upsertWeight({
            userId,
            examId: btn.dataset.exam,
            disciplineId: btn.dataset.discipline,
            weight,
            targetAccuracy: targetRaw === "" ? null : Number(targetRaw),
            expectedQuestions: expectedRaw === "" ? null : Number(expectedRaw),
          });
          editingKey = null;
          await refreshTable();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar peso: ${escapeHtml(err.message)}</div>`;
        }
      });
    });

    tableBox.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          // v_prioridade não expõe o id de exam_disciplines diretamente; a
          // remoção usa exam_id+discipline_id via delete direto no service.
          await deleteWeightByPair(btn.dataset.exam, btn.dataset.discipline);
          await refreshTable();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao remover: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }

  async function deleteWeightByPair(examId, disciplineId) {
    const { error } = await supabase.from("exam_disciplines").delete().eq("exam_id", examId).eq("discipline_id", disciplineId);
    if (error) throw error;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
