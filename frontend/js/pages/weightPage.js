// Tela "Peso" — painel de consulta cruzado com Wilson/classificação
// (v_prioridade, Fase 5/6). Editar peso reintroduzido aqui em 05/07/2026
// (pedido do usuário): antes só dava pra editar via atalho inline em Nova
// Sessão; agora dá pra editar direto na linha, sem sair da tela. Reaproveita
// o mesmo upsertWeight() do atalho (upsert por user_id+exam_id+discipline_id,
// já existe no banco), então não duplica lógica — só a UI.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listWeightSummary, upsertWeight } from "../services/weightService.js";
import { getState } from "../state.js";
import { formatPct } from "../utils/format.js";

export async function renderWeightPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/pesos")}
        <main class="app-content">
          <h2 class="form-title">Peso por Disciplina × Concurso</h2>
          <p style="color:var(--color-text-muted); max-width:640px;">
            Aqui o peso já aparece cruzado com o Diagnóstico Wilson e a classificação de Prioridade
            por disciplina (NEG-007). Clique em Editar pra ajustar peso, meta % ou questões esperadas.
          </p>
          <div id="alert-box"></div>
          <div id="weights-table"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();
  const alertBox = container.querySelector("#alert-box");
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
            Nenhum peso definido ainda. Defina pelo atalho inline em Nova Sessão ou clique em Editar aqui após criar um.
          </p>
        </div>
      `;
      return;
    }

    const trs = currentRows.map((r) => (editingKey === keyOf(r) ? linhaEdicao(r) : linhaExibicao(r))).join("");

    tableBox.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0;">Pesos definidos (${currentRows.length})</h3>
        <table class="data-table">
          <tr>
            <th>Concurso</th><th>Disciplina</th><th>Peso</th><th>Meta %</th>
            <th>Questões esp.</th><th>Wilson</th><th>Classificação</th><th>Ações</th>
          </tr>
          ${trs}
        </table>
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
          <select class="edit-weight">
            <option value="baixo" ${r.weight === "baixo" ? "selected" : ""}>Baixo</option>
            <option value="alto" ${r.weight === "alto" ? "selected" : ""}>Alto</option>
          </select>
        </td>
        <td><input type="number" class="edit-target" min="0" max="100" step="0.1" value="${r.target_accuracy ?? ""}" style="width:80px;" /></td>
        <td><input type="number" class="edit-expected" min="0" step="1" value="${r.expected_questions ?? ""}" style="width:80px;" /></td>
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
            userId: user.id,
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
    const { supabase } = await import("../supabaseClient.js");
    const { error } = await supabase
      .from("exam_disciplines")
      .delete()
      .eq("exam_id", examId)
      .eq("discipline_id", disciplineId);
    if (error) throw error;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
