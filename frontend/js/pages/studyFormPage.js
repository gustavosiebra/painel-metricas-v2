// Tela "Nova Sessão" / "Editar Sessão" (Doc. 16, T03) — registro agregado por
// caderno. Cadernos são criados sob demanda aqui mesmo (Fase 4, decisão de
// 01/07/2026). Mesma tela serve os dois modos: params.get("id") define edição.
//
// Campos obrigatórios (05/07/2026, pedido explícito do usuário, revertendo a
// decisão anterior de Concurso/Banca opcionais): Concurso, Banca, Disciplina,
// Caderno e Peso (na 1ª vez que o par Concurso×Disciplina é usado) agora são
// todos obrigatórios — ninguém consegue salvar sem preencher. Como ainda
// existe utilidade real em "estudo geral, sem edital específico" e "sem
// banca definida", essas continuam existindo como OPÇÕES EXPLÍCITAS dentro
// dos selects (sentinelas "__geral__" e "__nenhuma__") — a diferença é que
// agora precisam ser escolhidas conscientemente (o <select> abre sem nada
// marcado, graças a um <option disabled> de placeholder + required), em vez
// de vir pré-selecionada em branco sem o usuário decidir nada. Mesmo padrão
// pro Caderno ("__nenhum__"). O tipo de estudo também ganhou regra: Questões/
// Simulado exige Total de questões + Acertos; qualquer outro tipo exige
// Tempo líquido (já era sempre obrigatório) + Confiança autodeclarada.

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

// Ordem alfabética pelo rótulo (08/07/2026, pedido do usuário) — mais fácil
// de achar um tipo específico numa lista de 8 do que decorar uma ordem
// arbitrária.
const STUDY_TYPES = [
  { value: "caderno_erros", label: "Caderno de Erros" },
  { value: "discursiva", label: "Discursiva" },
  { value: "flashcard", label: "Flashcard" },
  { value: "leitura", label: "Leitura" },
  { value: "questao", label: "Questões" },
  { value: "revisao", label: "Revisão" },
  { value: "simulado", label: "Simulado" },
  { value: "videoaula", label: "Videoaula" },
];

// Tipos em que Disciplina deixa de ser obrigatória (ver #discipline_none_option
// em updateStudyTypeUI) — extraído pra constante nomeada em 13/07/2026 (antes
// era um `if` inline com só 2 valores); o usuário avisou que essa lista deve
// crescer, então um array nomeado deixa "liberar um tipo novo" ser só uma
// linha aqui, sem caçar a lógica espalhada. Caderno de Erros e Simulado:
// cross-disciplina por natureza (revisão semanal de erros / simulado cobre
// várias matérias de uma vez). Flashcard (13/07/2026): decisão do usuário de
// estudar pelo baralho RAIZ do Anki, intercalando todas as disciplinas juntas
// (repetição espaçada intercalada retém mais do que baralho filtrado por
// caderno) — forçar uma disciplina única por sessão não reflete esse fluxo.
const STUDY_TYPES_ALLOW_NO_DISCIPLINE = ["caderno_erros", "simulado", "flashcard"];

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
          <!-- Tipo de estudo vem logo depois de Data (08/07/2026, pedido do
               usuário) — precisa vir ANTES de Disciplina porque Disciplina
               só libera "Nenhuma disciplina específica" pra Simulado/Caderno
               de Erros (ver updateStudyTypeUI); com Tipo de estudo lá embaixo
               como antes, dava pra chegar em Disciplina sem essa opção ainda
               ter sido liberada, obrigando escolher uma disciplina real e
               depois voltar. Placeholder "— Selecione —" (08/07/2026) —
               depois de alfabetizar STUDY_TYPES, "Caderno de Erros" virou a
               1ª opção da lista e o <select> vinha com ela pré-marcada sem o
               usuário escolher nada; mesmo padrão de Concurso/Banca/
               Disciplina/Caderno já usado neste arquivo, força escolha
               consciente em vez de cair num tipo por acidente. -->
          <label for="study_type">Tipo de estudo</label>
          <select id="study_type" required>
            <option value="" disabled ${!existingSession ? "selected" : ""}>— Selecione —</option>
            ${STUDY_TYPES.map((t) => `<option value="${t.value}" ${existingSession?.study_type === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="exam_id">Concurso</label>
          <select id="exam_id" required>
            <option value="" disabled ${!existingSession ? "selected" : ""}>— Selecione —</option>
            <option value="__geral__" ${existingSession && !existingSession.exam_id ? "selected" : ""}>Estudo geral, sem concurso específico</option>
            ${exams.map((e) => `<option value="${e.id}" ${existingSession?.exam_id === e.id ? "selected" : ""}>${escapeHtml(e.name)}</option>`).join("")}
            <option value="__new__">+ Cadastrar novo concurso…</option>
          </select>
          <div id="new-exam-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_exam_name" aria-label="Nome do novo concurso" placeholder="Nome do novo concurso" />
          </div>
        </div>
        <div class="form-field">
          <label for="board_id">Banca</label>
          <select id="board_id" required>
            <option value="" disabled ${!existingSession ? "selected" : ""}>— Selecione —</option>
            <option value="__nenhuma__" ${existingSession && initialBoardIds.length === 0 ? "selected" : ""}>Não informar</option>
            ${boardOptions.map((b) => `<option value="${b.id}" ${existingSession?.board_id === b.id && initialBoardIds.length <= 1 && initialBoardIds.includes(b.id) ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
            ${multibancaBoard ? `<option value="${multibancaBoard.id}" ${existingSession && initialBoardIds.length > 1 ? "selected" : ""}>${escapeHtml(multibancaBoard.name)}</option>` : ""}
            <option value="__new__">+ Cadastrar nova banca…</option>
          </select>
          <div id="new-board-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_board_name" aria-label="Nome da nova banca" placeholder="Nome da nova banca" />
          </div>
        </div>
        <div class="form-field" id="board-multi-field" style="display:none;">
          <label class="form-field-heading">Bancas</label>
          <div id="board-multi-checkboxes" class="checkbox-list">
            ${boardOptions
              .map(
                (b) => `
              <label>
                <input type="checkbox" id="board-multi-${b.id}" name="board_multi" class="board-multi-checkbox" value="${b.id}" ${initialBoardIds.includes(b.id) ? "checked" : ""} />
                ${escapeHtml(b.name)}
              </label>`
              )
              .join("")}
          </div>
        </div>
        <div class="form-field">
          <label for="discipline_id">Disciplina</label>
          <select id="discipline_id" required>
            <option value="" disabled ${!existingSession ? "selected" : ""}>— Selecione —</option>
            <option value="__nenhuma__" id="discipline_none_option" ${existingSession && existingSession.discipline_id == null ? "selected" : ""}>Nenhuma disciplina específica</option>
            ${disciplines.map((d) => `<option value="${d.id}" ${existingSession?.discipline_id === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
            <option value="__new__">+ Cadastrar nova disciplina…</option>
          </select>
          <div id="new-discipline-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_discipline_name" aria-label="Nome da nova disciplina" placeholder="Nome da nova disciplina" />
          </div>
        </div>
        <div class="card" id="weight-shortcut-box" style="display:none; margin:8px 0; padding:12px; background:var(--color-bg-subtle, #f5f5f5);">
          <p style="margin:0 0 8px 0;">Ainda não há peso definido para esta disciplina neste concurso — obrigatório na primeira vez.</p>
          <div class="form-field">
            <label for="shortcut_weight">Peso</label>
            <select id="shortcut_weight">
              <option value="" disabled selected>— Selecione —</option>
              <option value="baixo">Baixo</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <div class="form-field">
            <label for="shortcut_expected_questions">Questões esperadas na prova (opcional)</label>
            <input type="number" id="shortcut_expected_questions" min="0" step="1" />
          </div>
        </div>
        <div class="form-field" id="question-set-field" style="display:${existingSession?.discipline_id ? "block" : "none"};">
          <label for="question_set_id">Caderno</label>
          <select id="question_set_id" ${existingSession?.discipline_id ? "required" : ""}>
            <option value="" disabled selected>Selecione a disciplina primeiro…</option>
          </select>
          <div id="new-caderno-box" style="display:none; margin-top:8px;">
            <input type="text" id="new_caderno_name" aria-label="Nome do novo caderno" placeholder="Nome do novo caderno" />
          </div>
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
            <label for="wrong_total_display">Erros (calculado)</label>
            <input type="text" id="wrong_total_display" disabled value="${result?.wrong_total ?? 0}" />
          </div>
          <div class="form-field" id="score-field" style="display:none;">
            <label for="score">Nota (0–100)</label>
            <input type="number" id="score" min="0" max="100" step="0.01" value="${result?.score ?? ""}" />
          </div>
        </div>

        <div class="form-field">
          <label for="self_confidence">Confiança autodeclarada</label>
          <select id="self_confidence">
            <option value="" id="self_confidence_none">Não informar</option>
            <option value="baixa" ${existingSession?.self_confidence === "baixa" ? "selected" : ""}>Baixa</option>
            <option value="media" ${existingSession?.self_confidence === "media" ? "selected" : ""}>Média</option>
            <option value="alta" ${existingSession?.self_confidence === "alta" ? "selected" : ""}>Alta</option>
          </select>
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
    const weightSelect = card.querySelector("#shortcut_weight");
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
    const selfConfidenceSelect = card.querySelector("#self_confidence");

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

    // selectedId: undefined = ainda sem escolha do usuário nesta interação
    // (marca o placeholder "— Selecione —", forçando escolha consciente);
    // null = sessão existente que já tinha "nenhum caderno" decidido de
    // propósito (marca a opção "Nenhum caderno específico"); string = id
    // real de um caderno já escolhido antes (edição).
    function populateQuestionSets(disciplineId, selectedId) {
      const filtered = questionSets.filter((q) => q.discipline_id === disciplineId);
      // CSS trunca a caixa fechada, mas a lista aberta de um <select> nativo
      // ignora CSS de largura — o navegador sempre dimensiona o popup pelo
      // texto mais longo. Cadernos importados do TEC passam de 100
      // caracteres, então a única forma confiável de conter o popup é
      // truncar o próprio texto da opção; o nome completo fica no atributo
      // title (aparece ao passar o mouse) e o value continua sendo o id real.
      questionSetSelect.innerHTML = `
        <option value="" disabled ${selectedId === undefined ? "selected" : ""}>— Selecione —</option>
        <option value="__nenhum__" ${selectedId === null ? "selected" : ""}>Nenhum caderno específico</option>
        ${filtered
          .map(
            (q) =>
              `<option value="${q.id}" title="${escapeHtml(q.name)}" ${selectedId === q.id ? "selected" : ""}>${escapeHtml(truncateLabel(q.name))}</option>`
          )
          .join("")}
        <option value="__new__">+ Criar novo caderno…</option>
      `;
      newCadernoBox.style.display = questionSetSelect.value === "__new__" ? "block" : "none";
    }

    disciplineSelect.addEventListener("change", () => {
      const disciplineId = disciplineSelect.value;
      newDisciplineBox.style.display = disciplineId === "__new__" ? "block" : "none";
      // "__nenhuma__" (só existe pra Caderno de Erros, ver updateStudyTypeUI):
      // sem disciplina não existe caderno pra vincular — mesmo tratamento de
      // "nada selecionado ainda".
      if (!disciplineId || disciplineId === "__nenhuma__") {
        // required=false (08/07/2026, correção de bug) — sem isso, o <select>
        // de Caderno ficava obrigatório mas escondido (display:none) quando
        // "Nenhuma disciplina específica" era escolhida (Caderno de Erros/
        // Simulado): o navegador barra o submit por causa dele, mas como está
        // invisível não mostra aviso nenhum — clicar em Salvar não fazia nada.
        questionSetSelect.required = false;
        questionSetField.style.display = "none";
        checkWeightShortcut();
        return;
      }
      // Disciplina nova ainda não existe (só é criada no submit) — filtro por
      // disciplineId="__new__" naturalmente não bate com nenhum caderno real,
      // então a lista aparece vazia, que é o esperado (disciplina sem histórico).
      questionSetSelect.required = true;
      questionSetField.style.display = "block";
      populateQuestionSets(disciplineId, undefined);
      checkWeightShortcut();
    });

    // Pré-popular caderno em modo edição, já com a disciplina existente.
    if (existingSession?.discipline_id) {
      populateQuestionSets(existingSession.discipline_id, existingSession.question_set_id ?? null);
    }

    // Peso obrigatório na 1ª vez que o par Concurso×Disciplina é usado
    // (05/07/2026, pedido do usuário — antes era um atalho opcional com botão
    // próprio de salvar; agora é só mais um campo obrigatório do formulário,
    // validado e gravado junto no submit principal). Não se aplica a "Estudo
    // geral" (sem concurso, não tem em que "pendurar" o peso). Quando o
    // concurso ou a disciplina ainda são "__new__" (cadastro sob demanda),
    // não dá pra checar o banco (não existem de verdade ainda), mas também
    // não precisa: é garantidamente a 1ª vez, então o campo aparece direto.
    async function checkWeightShortcut() {
      const examId = examSelect.value;
      const disciplineId = disciplineSelect.value;

      if (!examId || examId === "__geral__" || !disciplineId || disciplineId === "__nenhuma__") {
        setWeightBoxVisible(false);
        return;
      }
      if (examId === "__new__" || disciplineId === "__new__") {
        setWeightBoxVisible(true);
        return;
      }
      try {
        const existing = await getWeight({ examId, disciplineId });
        setWeightBoxVisible(!existing);
      } catch (err) {
        // Falha ao checar não deve travar o formulário inteiro — melhor
        // pedir o peso de novo (inofensivo, upsert) do que travar o usuário.
        setWeightBoxVisible(true);
      }
    }

    function setWeightBoxVisible(visible) {
      weightShortcutBox.style.display = visible ? "block" : "none";
      weightSelect.required = visible;
      // Sempre reseta ao trocar de combo (Concurso/Disciplina) — senão um
      // "Alto" escolhido pro combo anterior ficaria marcado por engano ao
      // trocar pra outro combo que também exige peso.
      weightSelect.value = "";
      const expectedInput = card.querySelector("#shortcut_expected_questions");
      if (expectedInput) expectedInput.value = "";
    }

    examSelect.addEventListener("change", checkWeightShortcut);
    if (existingSession?.exam_id && existingSession?.discipline_id) checkWeightShortcut();

    questionSetSelect.addEventListener("change", () => {
      newCadernoBox.style.display = questionSetSelect.value === "__new__" ? "block" : "none";
    });

    // Regra por tipo de estudo (05/07/2026, pedido do usuário): Questões e
    // Simulado exigem Total de questões + Acertos; qualquer outro tipo exige
    // Confiança autodeclarada (Tempo líquido já é sempre obrigatório, não
    // muda por tipo). Nota (Simulado/Discursiva) continua opcional — é uma
    // estimativa, nem toda banca dá nota fechada.
    function updateStudyTypeUI() {
      const type = studyTypeSelect.value;
      const measurable = hasMeasurableResult(type);
      measurableFields.style.display = measurable ? "block" : "none";
      scoreField.style.display = ["simulado", "discursiva"].includes(type) ? "block" : "none";

      const showQuestionCounts = ["questao", "simulado", "caderno_erros"].includes(type);
      questionsTotalInput.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
      correctTotalInput.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
      wrongTotalDisplay.closest(".form-field").style.display = showQuestionCounts ? "block" : "none";
      questionsTotalInput.required = showQuestionCounts;
      correctTotalInput.required = showQuestionCounts;

      selfConfidenceSelect.required = !showQuestionCounts;
      // Sem isso, "Não informar" (value="") continua selecionável mesmo
      // quando o campo vira required — o navegador bloqueia o submit
      // silenciosamente (value vazio + required = inválido), mas a opção
      // segue na lista como se fosse uma escolha válida. Desabilita a opção
      // quando required (mesmo padrão de placeholder disabled já usado em
      // Concurso/Banca/Disciplina/Caderno neste arquivo); se ela já estava
      // selecionada, empurra pra "Baixa" pra não deixar o select num estado
      // desabilitado-selecionado.
      const noneOption = card.querySelector("#self_confidence_none");
      noneOption.disabled = selfConfidenceSelect.required;
      if (selfConfidenceSelect.required && selfConfidenceSelect.value === "") {
        selfConfidenceSelect.value = "baixa";
      }

      // Disciplina opcional (ver STUDY_TYPES_ALLOW_NO_DISCIPLINE, topo do
      // arquivo). Desabilita a sentinela pros demais tipos, pra não deixar
      // "Nenhuma disciplina específica" escolhível em Questões/Revisão/etc.
      // Se o tipo mudar PRA FORA da lista com a sentinela já selecionada,
      // força reescolha (não dá pra "adivinhar" uma disciplina).
      const allowNoDiscipline = STUDY_TYPES_ALLOW_NO_DISCIPLINE.includes(type);
      const disciplineNoneOption = card.querySelector("#discipline_none_option");
      disciplineNoneOption.disabled = !allowNoDiscipline;
      if (!allowNoDiscipline && disciplineSelect.value === "__nenhuma__") {
        disciplineSelect.value = "";
        questionSetSelect.required = false;
        questionSetField.style.display = "none";
        setWeightBoxVisible(false);
      }
    }
    studyTypeSelect.addEventListener("change", updateStudyTypeUI);
    updateStudyTypeUI();

    // Acertos não pode passar de Questões (05/07/2026, reforçado a pedido do
    // usuário) — duas camadas: "max" dinâmico no campo (o navegador já barra
    // digitar/incrementar acima do total) + destaque vermelho caso ainda
    // assim o valor fique inconsistente (ex.: usuário reduz Questões DEPOIS
    // de já ter preenchido Acertos maior). handleSubmit repete a checagem
    // final antes de gravar, como rede de segurança.
    function recomputeWrong() {
      const total = Number(questionsTotalInput.value || 0);
      const correct = Number(correctTotalInput.value || 0);
      wrongTotalDisplay.value = Math.max(total - correct, 0);
      correctTotalInput.max = questionsTotalInput.value || "";
      const invalido = questionsTotalInput.value !== "" && correct > total;
      correctTotalInput.classList.toggle("input-error", invalido);
    }
    questionsTotalInput.addEventListener("input", recomputeWrong);
    correctTotalInput.addEventListener("input", recomputeWrong);
    recomputeWrong();

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
    const boardSelectValue = card.querySelector("#board_id").value;

    // "__nenhuma__" só é selecionável em Caderno de Erros (ver
    // updateStudyTypeUI) — sem disciplina não existe caderno pra vincular,
    // então força questionSetId junto, ignorando qualquer valor obsoleto que
    // tenha sobrado no <select> escondido de uma disciplina escolhida antes.
    if (disciplineId === "__nenhuma__") {
      disciplineId = null;
      questionSetId = null;
    }

    // Peso: captura ANTES de resolver "__new__" (reflete exatamente o que o
    // usuário viu/preencheu na tela). weightShortcutBox só fica visível
    // (e required) quando o peso é de fato obrigatório pra esse combo — ver
    // checkWeightShortcut em wireForm.
    const weightShortcutBox = card.querySelector("#weight-shortcut-box");
    const pesoNecessario = weightShortcutBox.style.display !== "none";
    const pesoEscolhido = card.querySelector("#shortcut_weight").value;
    const questoesEsperadas = card.querySelector("#shortcut_expected_questions").value;

    const questionsTotal = Number(card.querySelector("#questions_total").value || 0);
    const correctTotal = Number(card.querySelector("#correct_total").value || 0);
    const wrongTotal = Math.max(questionsTotal - correctTotal, 0);

    const correctTotalInput = card.querySelector("#correct_total");
    if (["questao", "simulado"].includes(studyType) && correctTotal > questionsTotal) {
      correctTotalInput.classList.add("input-error");
      alertBox.innerHTML = `<div class="alert alert--error">Acertos não pode ser maior que Questões.</div>`;
      return;
    }

    // Multibancas: o <select> de Banca já valida "algo foi escolhido", mas
    // não garante que pelo menos 1 checkbox foi marcado dentro do modo
    // multibancas — checagem manual aqui (05/07/2026, banca não é mais opcional).
    if (multibancaBoard && boardSelectValue === multibancaBoard.id) {
      const marcadas = card.querySelectorAll(".board-multi-checkbox:checked").length;
      if (marcadas === 0) {
        alertBox.innerHTML = `<div class="alert alert--error">Escolha pelo menos uma banca na lista de Multibancas.</div>`;
        return;
      }
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
      } else if (examId === "__geral__") {
        examId = null;
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

      // Peso — obrigatório na 1ª vez (ver checkWeightShortcut). Grava aqui,
      // já com examId/disciplineId reais (podem ter acabado de ser criados
      // acima), antes do Caderno.
      if (pesoNecessario && examId) {
        if (!pesoEscolhido) {
          alertBox.innerHTML = `<div class="alert alert--error">Escolha o Peso (Baixo ou Alto) para esta disciplina neste concurso.</div>`;
          return;
        }
        await upsertWeight({
          userId: user.id,
          examId,
          disciplineId,
          weight: pesoEscolhido,
          expectedQuestions: questoesEsperadas ? Number(questoesEsperadas) : null,
        });
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
      } else if (questionSetId === "__nenhum__") {
        questionSetId = null;
      }

      const scoreValue = card.querySelector("#score").value;

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
      } else if (boardSelectValue === "__nenhuma__") {
        boardIds = [];
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
