// Tela "Nova Sessão" / "Editar Sessão" (Doc. 16, T03) — registro agregado por
// caderno. Cadernos são criados sob demanda aqui mesmo (Fase 4, decisão de
// 01/07/2026). Mesma tela serve os dois modos: params.get("id") define edição.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import {
  listDisciplines,
  listExams,
  listExamBoards,
  listQuestionSets,
  createQuestionSet,
  createExam,
  createExamBoard,
  createDiscipline,
} from "../services/catalogService.js";
import {
  createStudySession,
  updateStudySession,
  getSessionById,
  hasMeasurableResult,
} from "../services/studyService.js";
import { getState } from "../state.js";
import { navigate } from "../router.js";
import { getWeight, upsertWeight } from "../services/weightService.js";

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

  // Multibancas: reaproveita a banca "Multibanca" já existente no catálogo
  // como gatilho — não é uma banca real, é a opção que revela os checkboxes
  // de seleção. Fica de fora da lista de checkboxes (não faz sentido marcar
  // "Multibanca" como uma das bancas dentro de uma sessão multibancas).
  // Calculado aqui (escopo de renderStudyFormPage) para ficar acessível em
  // renderForm/wireForm/handleSubmit, que são funções irmãs, não aninhadas.
  const multibancaBoard = boards.find((b) => b.name === "Multibanca");
  const boardOptions = boards.filter((b) => b.id !== multibancaBoard?.id);

  renderForm();

  function renderForm() {
    const result = existingSession?.session_results?.[0] || existingSession?.session_results || null;
    // Se a sessão já tem >1 banca vinculada, abre em modo multibanca por
    // padrão; com 0 ou 1, mantém o modo single-select atual.
    const initialBoardIds = existingSession?.study_session_boards?.length
      ? existingSession.study_session_boards.map((x) => x.board_id)
      : existingSession?.board_id
        ? [existingSession.board_id]
        : [];

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
            <option value="__new__">+ Cadastrar novo concurso…</option>
          </select>
          <div id="new-exam-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_exam_name" placeholder="Nome do novo concurso" />
          </div>
        </div>
        <div class="form-field">
          <label for="board_id">Banca (opcional)</label>
          <select id="board_id">
            <option value="">— Não informar —</option>
            ${boardOptions.map((b) => `<option value="${b.id}" ${existingSession?.board_id === b.id && initialBoardIds.length <= 1 ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
            ${multibancaBoard ? `<option value="${multibancaBoard.id}" ${initialBoardIds.length > 1 ? "selected" : ""}>${escapeHtml(multibancaBoard.name)}</option>` : ""}
            <option value="__new__">+ Cadastrar nova banca…</option>
          </select>
          <div id="new-board-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_board_name" placeholder="Nome da nova banca" />
          </div>
        </div>
        <div class="form-field" id="board-multi-field" style="display:none;">
          <label class="form-field-heading">Bancas</label>
          <div id="board-multi-checkboxes" class="checkbox-list">
            ${boardOptions
              .map(
                (b) => `
              <label>
                <input type="checkbox" class="board-multi-checkbox" value="${b.id}" ${initialBoardIds.includes(b.id) ? "checked" : ""} />
                ${escapeHtml(b.name)}
              </label>`
              )
              .join("")}
          </div>
        </div>
        <div class="form-field">
          <label for="discipline_id">Disciplina</label>
          <select id="discipline_id" required>
            <option value="">Selecione…</option>
            ${disciplines.map((d) => `<option value="${d.id}" ${existingSession?.discipline_id === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
            <option value="__new__">+ Cadastrar nova disciplina…</option>
          </select>
          <div id="new-discipline-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_discipline_name" placeholder="Nome da nova disciplina" />
          </div>
        </div>
        <div class="card" id="weight-shortcut-box" style="display:none; margin:8px 0; padding:12px; background:var(--color-bg-subtle, #f5f5f5);">
          <p style="margin:0 0 8px 0;">Ainda não há peso definido para esta disciplina neste concurso.</p>
          <div class="form-field">
            <label for="shortcut_weight">Peso</label>
            <select id="shortcut_weight">
              <option value="baixo">Baixo</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="form-field">
            <label for="shortcut_expected_questions">Questões esperadas na prova (opcional)</label>
            <input type="number" id="shortcut_expected_questions" min="0" step="1" />
          </div>
          <button type="button" id="shortcut_save_weight" class="btn-link">Salvar peso</button>
          <span id="weight-shortcut-status" style="margin-left:8px;"></span>
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
    const examSelect = card.querySelector("#exam_id");
    const disciplineSelect = card.querySelector("#discipline_id");
    const boardSelect = card.querySelector("#board_id");
    const boardMultiField = card.querySelector("#board-multi-field");
    const weightShortcutBox = card.querySelector("#weight-shortcut-box");
    const weightShortcutStatus = card.querySelector("#weight-shortcut-status");
    const questionSetField = card.querySelector("#question-set-field");
    const questionSetSelect = card.querySelector("#question_set_id");
    const newCadernoBox = card.querySelector("#new-caderno-box");
    const newExamBox = card.querySelector("#new-exam-box");
    const newBoardBox = card.querySelector("#new-board-box");
    const newDisciplineBox = card.querySelector("#new-discipline-box");
    const studyTypeSelect = card.querySelector("#study_type");
    const measurableFields = card.querySelector("#measurable-fields");
    const scoreField = card.querySelector("#score-field");
    const questionsTotalInput = card.querySelector("#questions_total");
    const correctTotalInput = card.querySelector("#correct_total");
    const wrongTotalDisplay = card.querySelector("#wrong_total_display");

    // "Multibanca" é uma opção dentro do próprio select de Banca (RN de
    // 02/07/2026) — só ao selecioná-la aparece a lista de checkboxes.
    function updateMultibancasUI() {
      boardMultiField.style.display = multibancaBoard && boardSelect.value === multibancaBoard.id ? "block" : "none";
    }
    boardSelect.addEventListener("change", updateMultibancasUI);
    updateMultibancasUI();

    // Cadastro sob demanda de Concurso, Banca e Disciplina (05/07/2026) — mesmo
    // padrão do "+ Criar novo caderno…" que já existia: escolher "__new__"
    // revela um campo de texto pro nome; a criação de fato só acontece no
    // submit (handleSubmit), pra não gravar nada no catálogo se a pessoa
    // desistir do formulário.
    function updateNewExamUI() {
      newExamBox.style.display = examSelect.value === "__new__" ? "block" : "none";
    }
    examSelect.addEventListener("change", updateNewExamUI);
    updateNewExamUI();

    function updateNewBoardUI() {
      newBoardBox.style.display = boardSelect.value === "__new__" ? "block" : "none";
    }
    boardSelect.addEventListener("change", updateNewBoardUI);
    updateNewBoardUI();

    function populateQuestionSets(disciplineId, selectedId) {
      const filtered = questionSets.filter((q) => q.discipline_id === disciplineId);
      // CSS trunca a caixa fechada, mas a lista aberta de um <select> nativo
      // ignora CSS de largura — o navegador sempre dimensiona o popup pelo
      // texto mais longo. Cadernos importados do TEC passam de 100
      // caracteres, então a única forma confiável de conter o popup é
      // truncar o próprio texto da opção; o nome completo fica no atributo
      // title (aparece ao passar o mouse) e o value continua sendo o id real.
      questionSetSelect.innerHTML = `
        <option value="">— Nenhum caderno específico —</option>
        ${filtered
          .map(
            (q) =>
              `<option value="${q.id}" title="${escapeHtml(q.name)}" ${selectedId === q.id ? "selected" : ""}>${escapeHtml(truncateLabel(q.name))}</option>`
          )
          .join("")}
        <option value="__new__">+ Criar novo caderno…</option>
      `;
    }

    disciplineSelect.addEventListener("change", () => {
      const disciplineId = disciplineSelect.value;
      newDisciplineBox.style.display = disciplineId === "__new__" ? "block" : "none";
      if (!disciplineId) {
        questionSetField.style.display = "none";
        return;
      }
      // Disciplina nova ainda não existe (só é criada no submit) — filtro por
      // disciplineId="__new__" naturalmente não bate com nenhum caderno real,
      // então a lista aparece vazia, que é o esperado (disciplina sem histórico).
      questionSetField.style.display = "block";
      populateQuestionSets(disciplineId, null);
      checkWeightShortcut();
    });

    // Pré-popular caderno em modo edição, já com a disciplina existente.
    if (existingSession?.discipline_id) {
      populateQuestionSets(existingSession.discipline_id, existingSession.question_set_id);
    }

    // Atalho de Peso: só faz sentido com concurso E disciplina escolhidos — sem
    // concurso não há em que "pendurar" o peso (é por disciplina × edital).
    // Some silenciosamente quando já existe peso salvo ou quando falta um dos dois.
    async function checkWeightShortcut() {
      const examId = examSelect.value;
      const disciplineId = disciplineSelect.value;
      weightShortcutStatus.textContent = "";
      // "__new__" ainda não é um id real (só existe depois do submit) — não dá
      // pra checar/salvar peso pra algo que ainda não foi criado no catálogo.
      if (!examId || !disciplineId || examId === "__new__" || disciplineId === "__new__") {
        weightShortcutBox.style.display = "none";
        return;
      }
      try {
        const existing = await getWeight({ examId, disciplineId });
        weightShortcutBox.style.display = existing ? "none" : "block";
      } catch (err) {
        // Falha silenciosa: o atalho é conveniência, não deve travar o registro da sessão.
        weightShortcutBox.style.display = "none";
      }
    }
    examSelect.addEventListener("change", checkWeightShortcut);
    if (existingSession?.exam_id && existingSession?.discipline_id) checkWeightShortcut();

    card.querySelector("#shortcut_save_weight").addEventListener("click", async () => {
      const { user } = getState();
      const examId = examSelect.value;
      const disciplineId = disciplineSelect.value;
      const weight = card.querySelector("#shortcut_weight").value;
      const expectedQuestions = card.querySelector("#shortcut_expected_questions").value;
      try {
        await upsertWeight({
          userId: user.id,
          examId,
          disciplineId,
          weight,
          expectedQuestions: expectedQuestions ? Number(expectedQuestions) : null,
        });
        weightShortcutBox.style.display = "none";
        weightShortcutStatus.textContent = "";
      } catch (err) {
        weightShortcutStatus.textContent = `Erro ao salvar peso: ${err.message}`;
      }
    });

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

    // Limpa o destaque vermelho assim que a pessoa mexe no campo de novo
    // (nome duplicado, ver handleSubmit) — não fica preso até reenviar o form.
    ["new_exam_name", "new_board_name", "new_discipline_name", "new_caderno_name"].forEach((id) => {
      const input = card.querySelector(`#${id}`);
      if (input) input.addEventListener("input", () => input.classList.remove("input-error"));
    });

    card.querySelector("#study-form").addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { user } = getState();
    alertBox.innerHTML = "";

    let disciplineId = card.querySelector("#discipline_id").value;
    let examId = card.querySelector("#exam_id").value;
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
      // Cadastro sob demanda (05/07/2026): resolve Concurso e Disciplina ANTES
      // do Caderno, porque um caderno novo sempre referencia disciplineId
      // (obrigatório) e, opcionalmente, examId — se qualquer um dos dois
      // ainda for "__new__" nesse ponto, o insert do caderno quebraria com um
      // id inválido.
      if (examId === "__new__") {
        const input = card.querySelector("#new_exam_name");
        const name = input.value.trim();
        input.classList.remove("input-error");
        if (!name) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Informe o nome do novo concurso.</div>`;
          return;
        }
        if (isDuplicateName(name, exams)) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Já existe um concurso chamado "${escapeHtml(name)}" — selecione-o na lista em vez de cadastrar de novo.</div>`;
          return;
        }
        const created = await createExam({ name, userId: user.id });
        exams.push(created);
        examId = created.id;
      }

      if (disciplineId === "__new__") {
        const input = card.querySelector("#new_discipline_name");
        const name = input.value.trim();
        input.classList.remove("input-error");
        if (!name) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Informe o nome da nova disciplina.</div>`;
          return;
        }
        if (isDuplicateName(name, disciplines)) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Já existe uma disciplina chamada "${escapeHtml(name)}" — selecione-a na lista em vez de cadastrar de novo.</div>`;
          return;
        }
        const created = await createDiscipline({ name, userId: user.id });
        disciplines.push(created);
        disciplineId = created.id;
      }

      if (questionSetId === "__new__") {
        const input = card.querySelector("#new_caderno_name");
        const name = input.value.trim();
        input.classList.remove("input-error");
        if (!name) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Informe o nome do novo caderno.</div>`;
          return;
        }
        // Escopo da checagem de duplicata é a disciplina — o mesmo nome de
        // caderno pode existir legitimamente em disciplinas diferentes.
        const cadernosDaDisciplina = questionSets.filter((q) => q.discipline_id === disciplineId);
        if (isDuplicateName(name, cadernosDaDisciplina)) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Já existe um caderno chamado "${escapeHtml(name)}" nessa disciplina — selecione-o na lista em vez de cadastrar de novo.</div>`;
          return;
        }
        const created = await createQuestionSet({
          name,
          disciplineId,
          examId: examId || null,
          userId: user.id,
        });
        questionSets.push(created);
        questionSetId = created.id;
      }

      const scoreValue = card.querySelector("#score").value;

      const boardSelectValue = card.querySelector("#board_id").value;
      let boardIds;
      if (multibancaBoard && boardSelectValue === multibancaBoard.id) {
        boardIds = Array.from(card.querySelectorAll(".board-multi-checkbox:checked")).map((cb) => cb.value);
      } else if (boardSelectValue === "__new__") {
        const input = card.querySelector("#new_board_name");
        const name = input.value.trim();
        input.classList.remove("input-error");
        if (!name) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Informe o nome da nova banca.</div>`;
          return;
        }
        if (isDuplicateName(name, boards)) {
          input.classList.add("input-error");
          alertBox.innerHTML = `<div class="alert alert--error">Já existe uma banca chamada "${escapeHtml(name)}" — selecione-a na lista em vez de cadastrar de novo.</div>`;
          return;
        }
        const created = await createExamBoard({ name, userId: user.id });
        boards.push(created);
        boardIds = [created.id];
      } else {
        boardIds = boardSelectValue ? [boardSelectValue] : [];
      }

      const payload = {
        userId: user.id,
        // meio-dia local evita o input <date> (sem horário) cair no dia anterior
        // ao converter para UTC em fusos negativos (ex.: America/Fortaleza).
        occurredAt: new Date(`${card.querySelector("#occurred_at").value}T12:00:00`).toISOString(),
        examId: examId || null,
        boardIds,
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
        setTimeout(() => navigate("/sessoes"), 800);
        return;
      }

      await createStudySession(payload);

      // Bug reportado pelo usuário (05/07/2026): o atalho de peso em cima
      // (checkWeightShortcut) só existe pra combos JÁ REAIS — se o concurso
      // foi cadastrado sob demanda nesta mesma tela, o exam_id só passou a
      // existir de verdade agora, depois do createStudySession acima, então
      // o atalho nunca teve chance de aparecer durante o preenchimento.
      // Confere de novo aqui com os ids já resolvidos e reoferece a mesma
      // opção antes de sair da tela, em vez de simplesmente perder a chance.
      let pesoJaExiste = true;
      if (examId) {
        try {
          pesoJaExiste = !!(await getWeight({ examId, disciplineId }));
        } catch {
          pesoJaExiste = true; // falha ao checar não deve travar o fluxo
        }
      }

      if (!examId || pesoJaExiste) {
        alertBox.innerHTML = `<div class="alert alert--success">Sessão registrada com sucesso.</div>`;
        setTimeout(() => navigate("/sessoes"), 800);
        return;
      }

      renderPostSaveWeightPrompt(examId, disciplineId);
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderPostSaveWeightPrompt(examId, disciplineId) {
    alertBox.innerHTML = `
      <div class="alert alert--success">Sessão registrada com sucesso.</div>
      <div class="card" style="margin-top:8px; padding:12px; background:var(--color-bg-subtle, #f5f5f5);">
        <p style="margin:0 0 8px 0;">Ainda não há peso definido para esta disciplina neste concurso.</p>
        <div class="form-field">
          <label for="postsave_weight">Peso</label>
          <select id="postsave_weight">
            <option value="baixo">Baixo</option>
            <option value="alto">Alto</option>
          </select>
        </div>
        <div class="form-field">
          <label for="postsave_expected_questions">Questões esperadas na prova (opcional)</label>
          <input type="number" id="postsave_expected_questions" min="0" step="1" />
        </div>
        <button type="button" id="postsave_save_weight" class="btn-link">Salvar peso</button>
        &nbsp;|&nbsp;
        <button type="button" id="postsave_skip_weight" class="btn-link">Pular</button>
        <span id="postsave_weight_status" style="margin-left:8px;"></span>
      </div>
    `;

    const statusEl = alertBox.querySelector("#postsave_weight_status");

    alertBox.querySelector("#postsave_save_weight").addEventListener("click", async () => {
      const { user } = getState();
      const weight = alertBox.querySelector("#postsave_weight").value;
      const expectedQuestions = alertBox.querySelector("#postsave_expected_questions").value;
      try {
        await upsertWeight({
          userId: user.id,
          examId,
          disciplineId,
          weight,
          expectedQuestions: expectedQuestions ? Number(expectedQuestions) : null,
        });
        navigate("/sessoes");
      } catch (err) {
        statusEl.textContent = `Erro ao salvar peso: ${err.message}`;
      }
    });

    alertBox.querySelector("#postsave_skip_weight").addEventListener("click", () => navigate("/sessoes"));
  }
}

// new Date().toISOString() converte pra UTC — em fusos negativos (ex.:
// America/Fortaleza, UTC-3) isso pode virar o dia seguinte à noite. Usa os
// componentes locais (getFullYear/getMonth/getDate) em vez de toISOString().
function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function truncateLabel(text, maxLen = 70) {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

// Checagem de duplicata no cadastro sob demanda (05/07/2026, endurecida em
// 05/07/2026 depois de achar "ALECE"/"Alece" duplicado 5x e 2 cadernos
// duplicados no banco) — normaliza maiúscula/minúscula E acento, senão
// "português", "Português" e "PORTUGUÊS" passam como nomes diferentes.
// normalize("NFD") separa a letra da marca de acento (ex.: "ê" vira "e" +
// marca combinante), e o regexp remove só a marca — mesmo efeito do
// unaccent() usado no banco pra achar/limpar as duplicatas existentes.
// Não existe constraint de unicidade no banco pra essas 4 tabelas (só chave
// primária) — a validação é só aqui no cliente.
// Regex construída via RegExp(string), com o intervalo de marcas de
// combinação Unicode (hex 0300 a 036f) escrito por código, em vez de
// caracteres de combinação digitados direto no arquivo-fonte — evita
// corromper em copy/paste entre editores/encodings.
const DIACRITICOS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeForCompare(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS_REGEX, "");
}

function isDuplicateName(name, list) {
  const normalized = normalizeForCompare(name);
  return list.some((item) => item.name && normalizeForCompare(item.name) === normalized);
}
