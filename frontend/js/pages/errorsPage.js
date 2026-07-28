// Tela "Erros" (27/07/2026) — registro e gestão de erros por causa raiz
// (T1–T7), metodologia adotada pelo usuário (fluxo: questão → classificação →
// regra correta → ação corretiva → revisão → nova questão). Decisões de
// escopo discutidas antes de construir:
// - NÃO é repetição espaçada (memorização fica no Anki); aqui é gestão:
//   ciclo aberto → encerrado + indicadores (reincidência por subtema,
//   distribuição por tipo, taxa de fechamento, tempo de vida do erro).
// - Anotação é texto simples + URLs clicáveis, de propósito (rich-text
//   convidaria o registro a virar caderno de resumos — o "depósito" que a
//   própria metodologia proíbe; resumo elaborado pertence à teoria/Anki).
// - Encerrar exige, por definição, ter acertado questão NOVA do mesmo ponto
//   sabendo explicar a regra — o confirm() do botão lembra isso.
// - Dois pontos de entrada: esta página (registro durante a correção ativa)
//   e o atalho pós-salvamento em Nova Sessão (pré-preenche disciplina/
//   caderno/banca e vincula a sessão via querystring).

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { listDisciplines, listExamBoards, listQuestionSets } from "../services/catalogService.js";
import { listErrorRecords, createErrorRecord, setErrorStatus, deleteErrorRecord } from "../services/errorService.js";
import { getState } from "../state.js";

// Rótulos e ação corretiva sugerida por tipo (seções 2 e 7 da metodologia).
// A ação aparece como dica ao escolher o tipo no formulário e no detalhe de
// cada registro — a classificação só tem valor se mudar a próxima ação.
const TIPOS = [
  { value: "T1", label: "T1 — Falta de teoria", acao: "Estudar a teoria específica (15–30 min) + 5 a 10 questões do mesmo ponto. Flashcard só se houver regra objetiva." },
  { value: "T2", label: "T2 — Confusão conceitual", acao: "Montar comparação lado a lado, escrever a diferença decisiva, criar flashcard \"A × B\" no Anki." },
  { value: "T3", label: "T3 — Esquecimento", acao: "Transformar em flashcard (Anki) e verificar em 7 e 15 dias se o erro reaparece." },
  { value: "T4", label: "T4 — Leitura/interpretação", acao: "Registrar a palavra ignorada no Gatilho; reler o comando antes das alternativas; atenção a \"sempre\", \"somente\", \"exceto\"." },
  { value: "T5", label: "T5 — Cálculo/procedimento", acao: "Refazer sem olhar a resolução; escrever o procedimento padrão; checklist pra cálculos semelhantes." },
  { value: "T6", label: "T6 — Pegadinha/padrão da banca", acao: "Registrar o padrão da armadilha (\"a banca tentou me induzir a…\") e resolver questões semelhantes da mesma banca." },
  { value: "T7", label: "T7 — Chute/baixa segurança", acao: "Tratar como erro: identificar o conhecimento que faltou e reclassificar como T1, T2 ou T3." },
];
const TIPO_LABEL = Object.fromEntries(TIPOS.map((t) => [t.value, t.label]));
const TIPO_ACAO = Object.fromEntries(TIPOS.map((t) => [t.value, t.acao]));

const RESULTADO_LABEL = {
  errada: "Errada",
  chute: "Acerto por chute",
  acerto_inseguro: "Acerto inseguro",
};

export async function renderErrorsPage(container, params) {
  // Pré-preenchimento vindo do atalho pós-salvamento de Nova Sessão.
  const preSessionId = params?.get ? params.get("sessionId") : null;
  const preDisciplineId = params?.get ? params.get("disciplineId") : null;
  const preQuestionSetId = params?.get ? params.get("questionSetId") : null;
  const preBoardId = params?.get ? params.get("boardId") : null;

  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/erros")}
        <main class="app-content">
          <h2 class="form-title">Erros</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Registre a causa do erro e a ação corretiva — não a questão. Um erro só encerra quando você acerta uma questão nova do mesmo ponto e sabe explicar a regra.
          </p>
          <div id="err-content"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const content = container.querySelector("#err-content");
  const { user } = getState();

  let disciplines = [];
  let boards = [];
  let questionSets = [];
  let records = [];
  try {
    [disciplines, boards, questionSets, records] = await Promise.all([
      listDisciplines(),
      listExamBoards(),
      listQuestionSets(),
      listErrorRecords(),
    ]);
  } catch (err) {
    content.innerHTML = `<div class="alert alert--error">Erro ao carregar: ${escapeHtml(err.message)}</div>`;
    return;
  }

  const disciplinesById = Object.fromEntries(disciplines.map((d) => [d.id, d.name]));
  const boardsById = Object.fromEntries(boards.map((b) => [b.id, b.name]));
  const questionSetsById = Object.fromEntries(questionSets.map((q) => [q.id, q.name]));

  // Filtros da lista — status "aberto" por padrão (o que exige ação).
  const filtros = { status: "aberto", disciplineId: "", tipo: "", boardId: "", busca: "" };

  content.innerHTML = `
    <div id="err-indicadores"></div>
    <div class="card card--form" style="margin-bottom:16px;">
      <h3 style="margin-top:0;">Registrar erro</h3>
      ${preSessionId ? '<p style="color:var(--color-text-muted); font-size:13px;">Os registros feitos agora ficarão vinculados à sessão que você acabou de salvar.</p>' : ""}
      <div id="err-form-alert"></div>
      <form id="err-form">
        <div class="form-field">
          <label for="err-disciplina">Disciplina</label>
          <select id="err-disciplina" required>
            <option value="" disabled ${preDisciplineId ? "" : "selected"}>— Selecione —</option>
            ${disciplines.map((d) => `<option value="${d.id}" ${preDisciplineId === d.id ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="err-caderno">Caderno (opcional)</label>
          <select id="err-caderno"><option value="">— Nenhum —</option></select>
        </div>
        <div class="form-field">
          <label for="err-banca">Banca (opcional)</label>
          <select id="err-banca">
            <option value="" ${preBoardId ? "" : "selected"}>— Não informar —</option>
            ${boards.map((b) => `<option value="${b.id}" ${preBoardId === b.id ? "selected" : ""}>${escapeHtml(b.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="err-subtema">Subtema</label>
          <input type="text" id="err-subtema" required placeholder="Ex.: Créditos adicionais, Imprimação x pintura de ligação" />
        </div>
        <div class="form-field">
          <label for="err-resultado">Resultado</label>
          <select id="err-resultado">
            <option value="errada" selected>Errada</option>
            <option value="chute">Acerto por chute</option>
            <option value="acerto_inseguro">Acerto inseguro</option>
          </select>
        </div>
        <div class="form-field">
          <label for="err-tipo">Tipo (causa principal)</label>
          <select id="err-tipo" required>
            <option value="" disabled selected>— Selecione —</option>
            ${TIPOS.map((t) => `<option value="${t.value}">${escapeHtml(t.label)}</option>`).join("")}
          </select>
          <p id="err-acao-sugerida" style="display:none; font-size:12px; color:var(--color-text-muted); margin:6px 0 0;"></p>
        </div>
        <div class="form-field">
          <label for="err-causa">Causa específica (uma frase)</label>
          <input type="text" id="err-causa" required placeholder="O que exatamente provocou o erro" />
        </div>
        <div class="form-field">
          <label for="err-regra">Regra correta</label>
          <input type="text" id="err-regra" placeholder="A informação que resolveria a questão" />
        </div>
        <div class="form-field">
          <label for="err-gatilho">Gatilho</label>
          <input type="text" id="err-gatilho" placeholder="Palavra ou característica que deveria ter percebido" />
        </div>
        <div class="form-field">
          <label for="err-anotacao">Anotação (opcional — links são clicáveis)</label>
          <textarea id="err-anotacao" rows="3" style="width:100%; max-width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid var(--color-border); border-radius:var(--radius); font-size:15px; font-family:inherit;"></textarea>
        </div>
        <button type="submit" class="btn" style="width:auto; padding:8px 20px;">Salvar erro</button>
      </form>
    </div>
    <div class="card">
      <h3 style="margin-top:0;">Registros</h3>
      <div class="filters-row">
        <div class="form-field">
          <label for="err-f-status">Status</label>
          <select id="err-f-status">
            <option value="aberto" selected>Abertos</option>
            <option value="encerrado">Encerrados</option>
            <option value="">Todos</option>
          </select>
        </div>
        <div class="form-field">
          <label for="err-f-disciplina">Disciplina</label>
          <select id="err-f-disciplina">
            <option value="">Todas</option>
            ${disciplines.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="err-f-tipo">Tipo</label>
          <select id="err-f-tipo">
            <option value="">Todos</option>
            ${TIPOS.map((t) => `<option value="${t.value}">${t.value}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="err-f-banca">Banca</label>
          <select id="err-f-banca">
            <option value="">Todas</option>
            ${boards.map((b) => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label for="err-f-busca">Subtema</label>
          <input type="text" id="err-f-busca" placeholder="Buscar por subtema..." />
        </div>
      </div>
      <div id="err-list"></div>
    </div>
  `;

  const formAlert = content.querySelector("#err-form-alert");
  const disciplinaSelect = content.querySelector("#err-disciplina");
  const cadernoSelect = content.querySelector("#err-caderno");
  const tipoSelect = content.querySelector("#err-tipo");
  const acaoSugerida = content.querySelector("#err-acao-sugerida");

  // Caderno filtrado pela disciplina escolhida (só ativos, mesmo critério de
  // Nova Sessão).
  function popularCadernos(disciplineId, selectedId) {
    const filtrados = questionSets.filter((q) => q.discipline_id === disciplineId && q.status !== "inativo");
    cadernoSelect.innerHTML = `
      <option value="">— Nenhum —</option>
      ${filtrados.map((q) => `<option value="${q.id}" title="${escapeHtml(q.name)}" ${selectedId === q.id ? "selected" : ""}>${escapeHtml(truncateLabel(q.name))}</option>`).join("")}
    `;
  }
  disciplinaSelect.addEventListener("change", () => popularCadernos(disciplinaSelect.value, undefined));
  if (preDisciplineId) popularCadernos(preDisciplineId, preQuestionSetId || undefined);

  tipoSelect.addEventListener("change", () => {
    const acao = TIPO_ACAO[tipoSelect.value];
    acaoSugerida.style.display = acao ? "block" : "none";
    acaoSugerida.textContent = acao ? `Ação sugerida: ${acao}` : "";
  });

  content.querySelector("#err-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    formAlert.innerHTML = "";
    try {
      const novo = await createErrorRecord({
        userId: user.id,
        sessionId: preSessionId || null,
        disciplineId: disciplinaSelect.value,
        questionSetId: cadernoSelect.value || null,
        boardId: content.querySelector("#err-banca").value || null,
        subtema: content.querySelector("#err-subtema").value.trim(),
        resultado: content.querySelector("#err-resultado").value,
        tipo: tipoSelect.value,
        causa: content.querySelector("#err-causa").value.trim(),
        regra: content.querySelector("#err-regra").value.trim(),
        gatilho: content.querySelector("#err-gatilho").value.trim(),
        anotacao: content.querySelector("#err-anotacao").value.trim(),
      });
      records.unshift(novo);
      // Mantém disciplina/caderno/banca (registro em lote do mesmo bloco é o
      // caso comum) — limpa só o que é específico do erro.
      ["err-subtema", "err-causa", "err-regra", "err-gatilho", "err-anotacao"].forEach((id) => {
        content.querySelector(`#${id}`).value = "";
      });
      tipoSelect.value = "";
      acaoSugerida.style.display = "none";
      formAlert.innerHTML = `<div class="alert alert--success">Erro registrado. Reincidência no subtema: ${contarReincidencia(novo)}×.</div>`;
      renderIndicadores();
      renderLista();
      content.querySelector("#err-subtema").focus();
    } catch (err) {
      formAlert.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
    }
  });

  ["err-f-status", "err-f-disciplina", "err-f-tipo", "err-f-banca"].forEach((id) => {
    content.querySelector(`#${id}`).addEventListener("change", (e) => {
      if (id === "err-f-status") filtros.status = e.target.value;
      if (id === "err-f-disciplina") filtros.disciplineId = e.target.value;
      if (id === "err-f-tipo") filtros.tipo = e.target.value;
      if (id === "err-f-banca") filtros.boardId = e.target.value;
      renderLista();
    });
  });
  content.querySelector("#err-f-busca").addEventListener("input", (e) => {
    filtros.busca = e.target.value;
    renderLista();
  });

  renderIndicadores();
  renderLista();

  // Quantas vezes esse subtema (normalizado) já foi registrado nesta
  // disciplina — o indicador-mestre da metodologia é reincidência.
  function contarReincidencia(rec) {
    const chave = normalizeForCompare(rec.subtema);
    return records.filter((r) => r.discipline_id === rec.discipline_id && normalizeForCompare(r.subtema) === chave).length;
  }

  function renderIndicadores() {
    const box = content.querySelector("#err-indicadores");
    if (records.length === 0) {
      box.innerHTML = "";
      return;
    }
    const agora = Date.now();
    const seteDias = 7 * 24 * 60 * 60 * 1000;
    const trintaDias = 30 * 24 * 60 * 60 * 1000;

    const abertos = records.filter((r) => r.status === "aberto").length;
    const encerradosSemana = records.filter((r) => r.closed_at && agora - new Date(r.closed_at).getTime() <= seteDias).length;
    const registradosSemana = records.filter((r) => agora - new Date(r.created_at).getTime() <= seteDias).length;

    // Distribuição por tipo (últimos 30 dias) — se T4/leitura dominar, o
    // problema é técnica de prova, não conteúdo.
    const porTipo = {};
    records
      .filter((r) => agora - new Date(r.created_at).getTime() <= trintaDias)
      .forEach((r) => { porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1; });
    const tiposOrdenados = Object.entries(porTipo).sort((a, b) => b[1] - a[1]);

    // Reincidência: subtema normalizado com 2+ registros na mesma disciplina.
    const grupos = {};
    records.forEach((r) => {
      const chave = `${r.discipline_id}|${normalizeForCompare(r.subtema)}`;
      if (!grupos[chave]) grupos[chave] = { disciplina: disciplinesById[r.discipline_id] || "—", subtema: r.subtema, n: 0 };
      grupos[chave].n += 1;
    });
    const reincidentes = Object.values(grupos).filter((g) => g.n >= 2).sort((a, b) => b.n - a.n).slice(0, 5);

    // Tempo médio de vida dos encerrados (criação → encerramento), em dias.
    const encerrados = records.filter((r) => r.closed_at);
    const vidaMedia = encerrados.length
      ? Math.round(encerrados.reduce((acc, r) => acc + (new Date(r.closed_at) - new Date(r.created_at)), 0) / encerrados.length / (24 * 60 * 60 * 1000))
      : null;

    box.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 style="margin-top:0;">Indicadores</h3>
        <p style="margin:4px 0;"><strong>${abertos}</strong> erro(s) em aberto · <strong>${registradosSemana}</strong> registrado(s) e <strong>${encerradosSemana}</strong> encerrado(s) nos últimos 7 dias${vidaMedia != null ? ` · vida média do erro encerrado: <strong>${vidaMedia}d</strong>` : ""}</p>
        ${tiposOrdenados.length ? `<p style="margin:4px 0;">Últimos 30 dias por tipo: ${tiposOrdenados.map(([t, n]) => `<span class="badge" style="background:#eceff1; color:#37474f;" title="${escapeHtml(TIPO_LABEL[t] || t)}">${t}: ${n}</span>`).join(" ")}</p>` : ""}
        ${reincidentes.length ? `<p style="margin:8px 0 0;"><strong style="color:var(--color-error);">Reincidência</strong> (mesmo subtema 2+ vezes): ${reincidentes.map((g) => `${escapeHtml(g.subtema)} — ${escapeHtml(g.disciplina)} (${g.n}×)`).join("; ")}</p>` : ""}
      </div>
    `;
  }

  function renderLista() {
    const listBox = content.querySelector("#err-list");
    const termo = normalizeForCompare(filtros.busca || "");
    const visiveis = records.filter((r) => {
      if (filtros.status && r.status !== filtros.status) return false;
      if (filtros.disciplineId && r.discipline_id !== filtros.disciplineId) return false;
      if (filtros.tipo && r.tipo !== filtros.tipo) return false;
      if (filtros.boardId && r.board_id !== filtros.boardId) return false;
      if (termo && !normalizeForCompare(r.subtema).includes(termo)) return false;
      return true;
    });

    if (visiveis.length === 0) {
      listBox.innerHTML = `<p style="color:var(--color-text-muted);">Nenhum registro com esse filtro.</p>`;
      return;
    }

    const rows = visiveis
      .map((r) => {
        const data = new Date(r.created_at).toLocaleDateString("pt-BR");
        const encerrado = r.status === "encerrado";
        return `
          <tr data-err-row="${r.id}" style="cursor:pointer;${encerrado ? " opacity:0.6;" : ""}">
            <td>${data}</td>
            <td>${escapeHtml(disciplinesById[r.discipline_id] || "—")}</td>
            <td>${escapeHtml(r.subtema)}</td>
            <td><span class="badge" style="background:#eceff1; color:#37474f;" title="${escapeHtml(TIPO_LABEL[r.tipo] || r.tipo)}">${r.tipo}</span></td>
            <td>${encerrado ? "Encerrado" : "Aberto"}</td>
            <td>
              <div class="row-actions">
                <button class="btn-link" data-err-toggle="${r.id}" data-next="${encerrado ? "aberto" : "encerrado"}">${encerrado ? "Reabrir" : "Encerrar"}</button>
                <span class="row-actions__sep">|</span>
                <button class="btn-link" style="color:var(--color-error);" data-err-delete="${r.id}">Apagar</button>
              </div>
            </td>
          </tr>
          <tr data-err-detail="${r.id}" style="display:none;">
            <td colspan="6" style="background:var(--color-bg-subtle, #f5f5f5);">
              <p style="margin:4px 0;"><strong>${escapeHtml(RESULTADO_LABEL[r.resultado] || r.resultado)}</strong> · ${escapeHtml(TIPO_LABEL[r.tipo] || r.tipo)}${r.question_set_id ? ` · Caderno: ${escapeHtml(questionSetsById[r.question_set_id] || "—")}` : ""}${r.board_id ? ` · Banca: ${escapeHtml(boardsById[r.board_id] || "—")}` : ""}</p>
              <p style="margin:4px 0;"><strong>Causa:</strong> ${escapeHtml(r.causa)}</p>
              ${r.regra ? `<p style="margin:4px 0;"><strong>Regra:</strong> ${escapeHtml(r.regra)}</p>` : ""}
              ${r.gatilho ? `<p style="margin:4px 0;"><strong>Gatilho:</strong> ${escapeHtml(r.gatilho)}</p>` : ""}
              ${r.anotacao ? `<p style="margin:4px 0;"><strong>Anotação:</strong> ${linkify(r.anotacao)}</p>` : ""}
              <p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">Ação sugerida (${r.tipo}): ${escapeHtml(TIPO_ACAO[r.tipo] || "—")}</p>
              ${r.closed_at ? `<p style="margin:4px 0; font-size:12px; color:var(--color-text-muted);">Encerrado em ${new Date(r.closed_at).toLocaleDateString("pt-BR")}</p>` : ""}
            </td>
          </tr>
        `;
      })
      .join("");

    listBox.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="data-table">
          <tr><th>Data</th><th>Disciplina</th><th>Subtema</th><th>Tipo</th><th>Status</th><th>Ações</th></tr>
          ${rows}
        </table>
      </div>
      <p style="font-size:12px; color:var(--color-text-muted); margin:8px 0 0;">${visiveis.length} registro(s). Clique numa linha pra ver causa, regra e gatilho.</p>
    `;

    listBox.querySelectorAll("[data-err-row]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const detail = listBox.querySelector(`[data-err-detail="${tr.dataset.errRow}"]`);
        if (detail) detail.style.display = detail.style.display === "none" ? "" : "none";
      });
    });

    listBox.querySelectorAll("[data-err-toggle]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const encerrar = btn.dataset.next === "encerrado";
        if (encerrar && !window.confirm("Encerrar = você acertou uma questão NOVA desse ponto e sabe explicar a regra. Confirma?")) return;
        btn.disabled = true;
        try {
          await setErrorStatus(btn.dataset.errToggle, btn.dataset.next);
          const rec = records.find((r) => r.id === btn.dataset.errToggle);
          if (rec) {
            rec.status = btn.dataset.next;
            rec.closed_at = encerrar ? new Date().toISOString() : null;
          }
          renderIndicadores();
          renderLista();
        } catch (err) {
          window.alert("Erro ao atualizar: " + (err.message || "desconhecido"));
          btn.disabled = false;
        }
      });
    });

    listBox.querySelectorAll("[data-err-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.confirm("Apagar este registro de erro definitivamente?")) return;
        btn.disabled = true;
        try {
          await deleteErrorRecord(btn.dataset.errDelete);
          records = records.filter((r) => r.id !== btn.dataset.errDelete);
          renderIndicadores();
          renderLista();
        } catch (err) {
          window.alert("Erro ao apagar: " + (err.message || "desconhecido"));
          btn.disabled = false;
        }
      });
    });
  }
}

// URLs viram links clicáveis (anotação é texto simples por decisão de
// escopo). SEMPRE escapa primeiro, linkifica depois — nunca o contrário.
function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

function truncateLabel(text, maxLen = 70) {
  if (!text || text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

const DIACRITICOS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeForCompare(text) {
  return (text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS_REGEX, "");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
