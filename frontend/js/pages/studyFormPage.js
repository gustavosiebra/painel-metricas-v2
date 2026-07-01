// Tela "Nova Sessão" / "Editar Sessão" (Doc. 16, T03) — registro agregado por
// caderno. Cadernos são criados sob demanda aqui mesmo (Fase 4, decisão de
// 01/07/2026). Mesma tela serve os dois modos: params.get("id") define edição.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExams, listExamBoards, listQuestionSets, createQuestionSet } from "../services/catalogService.js";
import {
  createStudySession,
  updateStudySession,
  getSessionById,
  hasMeasurableResult,
} from "../services/studyService.js";
import { getState } from "../state.js";
import { navigate } from "../router.js";

const STUDY_TYPES = [
  { value: "questao", label: "Questões" },
  { value: "simulado", label: "Simulado" },
  { value: "discursiva", label: "Discursiva" },
  { value: "revisao", label: "Revisão" },
  { value: "flashcard", label: "Flashcard" },
  { value: "leitura", label: "Leitura" },
  { value: "videoaula", label: "Videoaula" },
];

export async function renderStudyFormPage(container, params) {
  const editingId = params?.get ? params.get("id") : null;

  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/sessoes/nova")}
        <main class="app-content">
          <div class="card" style="max-width:560px;">
            <h2 class="form-title">${editingId ? "Editar Sessão" : "Nova Sessão"}</h2>
            <div id="alert-box"></div>
            <p>Carregando catálogo…</p>
          </div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const card = container.querySelector(".card");
  const alertBox = container.querySelector("#alert-box");

  let disciplines = [];
  let exams = [];
  let boards = [];
  let questionSets = [];
  let existingSession = null;

  try {
    const loads = [listDisciplines(), listExams(), listExamBoards(), listQuestionSets()];
    if (editingId) loads.push(getSessionById(editingId));
    const results = await Promise.all(loads);
    [disciplines, exams, boards, questionSets] = results;
    if (editingId) existingSession = results[4];
  } catch (err) {
    card.innerHTML += `<div class="alert alert--error">Erro ao carregar dados: ${escapeHtml(err.message)}</div>`;
    return;
  }

  renderForm();

  function renderForm() {
    const result = existingSession?.session_results?.[0] || existingSession?.session_results || null;

    card.innerHTML = `
      <h2 class="form-title">${editingId ? "Editar Sessão" : "Nova Sessão"}</h2>
      <div id="alert-box"></div>
      <form id="study-form">
        <div class="form-field">
          <label for="occurred_at">Data</label>
          <input type="date" id="occurred_at" required value="${existingSession ? existingSession.occurred_at.slice(0, 10) : todayISO()}" />
        </div>
        <div class="form-field">
          <label for="exam_id">Concurso (opcional)</label>
          <select id="exam_id">
            <option value="">— Estudo geral, sem concurso específico —</option>
            ${exams.map((e) => `<option value="${e.id}" ${existingSession?.exam_id === e.id ? "selected" : ""}>${escapeHtml(e.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="board_id">Banca (opcional)</label>
          <select id="board_id">
            <option value="">— Não informar —</option>
            ${boards.map((b) => `<option value="${b.id}" ${existingSession?.board_id === b.id ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="discipline_id">Disciplina</label>
          <select id="discipline_id" required>
            <option value="">Selecione…</option>
            ${disciplines.map((d) => `<option value="${d.id}" ${existingSession?.discipline_id === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field" id="question-set-field" style="display:${existingSession?.discipline_id ? "block" : "none"};">
          <label for="question_set_id">Caderno</label>
          <select id="question_set_id">
            <option value="">Selecione a disciplina primeiro…</option>
          </select>
          <div id="new-caderno-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_caderno_name" placeholder="Nome do novo caderno" />
          </div>
        </div>
        <div class="form-field">
          <label for="study_type">Tipo de estudo</label>
          <select id="study_type" required>
            ${STUDY_TYPES.map((t) => `<option value="${t.value}" ${existingSession?.study_type === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
          </select>
        </div>

        <div id="measurable-fields" style="display:none;">
          <div class="form-field">
            <label for="questions_total">Questões</label>
            <input type="number" id="questions_total" min="0" step="1" value="${result?.questions_total ?? ""}" />
          </div>
          <div class="form-field">
            <label for="correct_total">Acertos</label>
            <input type="number" id="correct_total" min="0" step="1" value="${result?.correct_total ?? ""}" />
          </div>
          <div class="form-field">
            <label>Erros (calculado)</label>
            <input type="text" id="wrong_total_display" disabled value="${result?.wrong_total ?? 0}" />
          </div>
          <div class="form-field" id="score-field" style="display:none;">
            <label for="score">Nota (0–100)</label>
            <input type="number" id="score" min="0" max="100" step="0.01" value="${result?.score ?? ""}" />
          </div>
          <div class="form-field">
            <label for="self_confidence">Confiança autodeclarada</label>
            <select id="self_confidence">
              <option value="">Não informar</option>
              <option value="baixa" ${existingSession?.self_confidence === "baixa" ? "selected" : ""}>Baixa</option>
              <option value="media" ${existingSession?.self_confidence === "media" ? "selected" : ""}>Média</option>
              <option value="alta" ${existingSession?.self_confidence === "alta" ? "selected" : ""}>Alta</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label for="duration_minutes">Tempo líquido (minutos)</label>
          <input type="number" id="duration_minutes" min="0" step="1" required value="${existingSession?.duration_minutes ?? ""}" />
        </div>
        <div class="form-field">
          <label for="notes">Observações (opcional)</label>
          <input type="text" id="notes" value="${existingSession?.notes ? escapeHtml(existingSession.notes) : ""}" />
        </div>
        <button type="submit" class="btn">${editingId ? "Salvar alterações" : "Salvar sessão"}</button>
      </form>
    `;

    wireForm();
  }

  function wireForm() {
    const disciplineSelect = card.querySelector("#discipline_id");
    const questionSetField = card.querySelector("#question-set-field");
    const questionSetSelect = card.querySelector("#question_set_id");
    const newCadernoBox = card.querySelector("#new-caderno-box");
    const studyTypeSelect = card.querySelector("#study_type");
    const measurableFields = card.querySelector("#measurable-fields");
    const scoreField = card.querySelector("#score-field");
    const questionsTotalInput = card.querySelector("#questions_total");
    const correctTotalInput = card.querySelector("#correct_total");
    const wrongTotalDisplay = card.querySelector("#wrong_total_display");

    function populateQuestionSets(disciplineId, selectedId) {
      const filtered = questionSets.filter((q) => q.discipline_id === disciplineId);
      questionSetSelect.innerHTML = `
        <option value="">— Nenhum caderno específico —</option>
        ${filtered.map((q) => `<option value="${q.id}" ${selectedId === q.id ? "selected" : ""}>${escapeHtml(q.name)}</option>`).join("")}
        <option value="__new__">+ Criar novo caderno…</option>
      `;
    }

    disciplineSelect.addEventListener("change", () => {
      const disciplineId = disciplineSelect.value;
      if (!disciplineId) {
        questionSetField.style.display = "none";
        return;
      }
      questionSetField.style.display = "block";
      populateQuestionSets(disciplineId, null);
    });

    // Pré-popular caderno em modo edição, já com a disciplina existente.
    if (existingSession?.discipline_id) {
      populateQuestionSets(existingSession.discipline_id, existingSession.question_set_id);
    }

    questionSetSelect.addEventListener("change", () => {
      newCadernoBox.style.display = questionSetSelect.value === "__new__" ? "block" : "none";
    });

    function updateStudyTypeUI() {
      const measurable = hasMeasurableResult(studyTypeSelect.value);
      measurableFields.style.display = measurable ? "block" : "none";
      scoreField.style.display = ["simulado", "discursiva"].includes(studyTypeSelect.value) ? "block" : "none";
      const showQuestionCounts = ["questao", "simulado"].includes(studyTypeSelect.value);
      questionsTotalInput.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
      correctTotalInput.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
      wrongTotalDisplay.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
    }
    studyTypeSelect.addEventListener("change", updateStudyTypeUI);
    updateStudyTypeUI();

    function recomputeWrong() {
      const total = Number(questionsTotalInput.value || 0);
      const correct = Number(correctTotalInput.value || 0);
      wrongTotalDisplay.value = Math.max(total - correct, 0);
    }
    questionsTotalInput.addEventListener("input", recomputeWrong);
    correctTotalInput.addEventListener("input", recomputeWrong);

    card.querySelector("#study-form").addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { user, isAdmin } = getState();
    alertBox.innerHTML = "";

    const disciplineId = card.querySelector("#discipline_id").value;
    const examId = card.querySelector("#exam_id").value;
    const studyType = card.querySelector("#study_type").value;
    const questionSetSelect = card.querySelector("#question_set_id");
    let questionSetId = questionSetSelect.value;

    const questionsTotal = Number(card.querySelector("#questions_total").value || 0);
    const correctTotal = Number(card.querySelector("#correct_total").value || 0);
    const wrongTotal = Math.max(questionsTotal - correctTotal, 0);

    if (["questao", "simulado"].includes(studyType) && correctTotal > questionsTotal) {
      alertBox.innerHTML = `<div class="alert alert--error">Acertos não pode ser maior que Questões.</div>`;
      return;
    }

    try {
      if (questionSetId === "__new__") {
        const name = card.querySelector("#new_caderno_name").value.trim();
        if (!name) {
          alertBox.innerHTML = `<div class="alert alert--error">Informe o nome do novo caderno.</div>`;
          return;
        }
        const created = await createQuestionSet({
          name,
          disciplineId,
          examId: examId || null,
          isAdmin,
          userId: user.id,
        });
        questionSets.push(created);
        questionSetId = created.id;
      }

      const scoreValue = card.querySelector("#score").value;

      const payload = {
        userId: user.id,
        // meio-dia local evita o input <date> (sem horário) cair no dia anterior
        // ao converter para UTC em fusos negativos (ex.: America/Fortaleza).
        occurredAt: new Date(`${card.querySelector("#occurred_at").value}T12:00:00`).toISOString(),
        examId: examId || null,
        boardId: card.querySelector("#board_id").value || null,
        disciplineId,
        questionSetId: questionSetId || null,
        studyType,
        durationMinutes: Number(card.querySelector("#duration_minutes").value),
        selfConfidence: card.querySelector("#self_confidence")?.value || null,
        notes: card.querySelector("#notes").value || null,
        questionsTotal,
        correctTotal,
        wrongTotal,
        score: scoreValue ? Number(scoreValue) : null,
        scoreIsEstimate: studyType === "simulado",
      };

      if (editingId) {
        await updateStudySession(editingId, payload);
        alertBox.innerHTML = `<div class="alert alert--success">Sessão atualizada com sucesso.</div>`;
      } else {
        await createStudySession(payload);
        alertBox.innerHTML = `<div class="alert alert--success">Sessão registrada com sucesso.</div>`;
      }
      setTimeout(() => navigate("/sessoes"), 800);
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
    }
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
