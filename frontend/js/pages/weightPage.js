// Tela "Peso" — mínima, antecipada da Fase 7 (Parâmetros) para a Fase 5 por
// decisão do usuário: sem isso, a métrica Prioridade (Peso × Diagnóstico Wilson,
// NEG-007) fica sem dado real até a Fase 7 existir. Só define weight por
// disciplina × concurso; faixas/limiares completos continuam na Fase 7.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExams } from "../services/catalogService.js";
import { listWeights, upsertWeight, deleteWeight } from "../services/weightService.js";
import { getState } from "../state.js";

const WEIGHT_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "alto", label: "Alto" },
];

export async function renderWeightPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/pesos")}
        <main class="app-content">
          <h2 class="form-title">Peso por Disciplina × Concurso</h2>
          <p style="color:var(--color-text-muted); max-width:640px;">
            Define o peso (Baixo/Alto) que uma disciplina tem em um concurso específico.
            Usado pela métrica Prioridade (peso × Diagnóstico Wilson) — nunca entra no cálculo
            de desempenho histórico, só em priorização (NEG-001).
          </p>
          <div id="alert-box"></div>
          <div class="card" style="max-width:640px; margin-bottom:16px;">
            <h3 style="margin-top:0;">Definir / atualizar peso</h3>
            <form id="weight-form">
              <div class="form-field">
                <label for="exam_id">Concurso</label>
                <select id="exam_id" required><option value="">Carregando…</option></select>
              </div>
              <div class="form-field">
                <label for="discipline_id">Disciplina</label>
                <select id="discipline_id" required><option value="">Carregando…</option></select>
              </div>
              <div class="form-field">
                <label for="weight">Peso</label>
                <select id="weight" required>
                  ${WEIGHT_OPTIONS.map((w) => `<option value="${w.value}">${w.label}</option>`).join("")}
                </select>
              </div>
              <div class="form-field">
                <label for="target_accuracy">Meta de acerto % (opcional)</label>
                <input type="number" id="target_accuracy" min="0" max="100" step="0.01" />
              </div>
              <div class="form-field">
                <label for="expected_questions">Questões esperadas na prova (opcional)</label>
                <input type="number" id="expected_questions" min="0" step="1" />
              </div>
              <button type="submit" class="btn">Salvar peso</button>
            </form>
          </div>
          <div id="weights-table"><p>Carregando pesos definidos…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const alertBox = container.querySelector("#alert-box");
  const examSelect = container.querySelector("#exam_id");
  const disciplineSelect = container.querySelector("#discipline_id");
  const tableBox = container.querySelector("#weights-table");

  let exams = [];
  let disciplines = [];

  try {
    [exams, disciplines] = await Promise.all([listExams(), listDisciplines()]);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert--error">Erro ao carregar catálogo: ${escapeHtml(err.message)}</div>`;
    return;
  }

  examSelect.innerHTML = `<option value="">Selecione…</option>${exams
    .map((e) => `<option value="${e.id}">${escapeHtml(e.name)}</option>`)
    .join("")}`;
  disciplineSelect.innerHTML = `<option value="">Selecione…</option>${disciplines
    .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
    .join("")}`;

  await refreshTable();

  container.querySelector("#weight-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    alertBox.innerHTML = "";
    const { user } = getState();

    const examId = examSelect.value;
    const disciplineId = disciplineSelect.value;
    const weight = container.querySelector("#weight").value;
    const targetAccuracy = container.querySelector("#target_accuracy").value;
    const expectedQuestions = container.querySelector("#expected_questions").value;

    if (!examId || !disciplineId) {
      alertBox.innerHTML = `<div class="alert alert--error">Selecione concurso e disciplina.</div>`;
      return;
    }

    try {
      await upsertWeight({
        userId: user.id,
        examId,
        disciplineId,
        weight,
        targetAccuracy: targetAccuracy ? Number(targetAccuracy) : null,
        expectedQuestions: expectedQuestions ? Number(expectedQuestions) : null,
      });
      alertBox.innerHTML = `<div class="alert alert--success">Peso salvo.</div>`;
      await refreshTable();
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
    }
  });

  async function refreshTable() {
    let weights = [];
    try {
      weights = await listWeights();
    } catch (err) {
      tableBox.innerHTML = `<div class="alert alert--error">Erro ao carregar pesos: ${escapeHtml(err.message)}</div>`;
      return;
    }

    if (weights.length === 0) {
      tableBox.innerHTML = `<div class="card"><p style="color:var(--color-text-muted);">Nenhum peso definido ainda.</p></div>`;
      return;
    }

    const rows = weights
      .map(
        (w) => `
        <tr>
          <td>${escapeHtml(w.exams?.name || "—")}</td>
          <td>${escapeHtml(w.disciplines?.name || "—")}</td>
          <td>${escapeHtml(w.weight)}</td>
          <td>${w.target_accuracy ?? "—"}</td>
          <td>${w.expected_questions ?? "—"}</td>
          <td><button class="btn-link" data-id="${w.id}" data-action="remove">Remover</button></td>
        </tr>
      `
      )
      .join("");

    tableBox.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0;">Pesos definidos (${weights.length})</h3>
        <table class="data-table">
          <tr><th>Concurso</th><th>Disciplina</th><th>Peso</th><th>Meta %</th><th>Questões esp.</th><th></th></tr>
          ${rows}
        </table>
      </div>
    `;

    tableBox.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await deleteWeight(btn.dataset.id);
          await refreshTable();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao remover: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
