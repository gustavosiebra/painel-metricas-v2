// Tela "Planejamento" (13/07/2026, pedido do usuário) — acompanhamento dos
// concursos que o usuário está estudando: data da prova, prazo de inscrição
// (com contador de dias, pra não esquecer) e valor da taxa. Reaproveita a
// tabela exams (mesma do Catálogo/Nova Sessão) — só adiciona campos que o
// cadastro rápido não pedia (registration_date, fee_amount, migration
// planejamento_concurso_datas_valor). Suporta VÁRIOS concursos ao mesmo
// tempo (decisão do usuário, 13/07/2026) — cada um em seu próprio card com
// contador independente, não um "concurso principal" único em destaque.
// Editar nome continua só no Catálogo (updateExamName) — aqui é só o que é
// específico de planejamento (datas/valor). Apagar também continua só no
// Catálogo, pra não duplicar uma ação destrutiva em duas telas.

import { renderNavbar, wireNavbar } from "../components/navbar.js";
import { getState } from "../state.js";
import { listExams, createExam, updateExamPlanning } from "../services/catalogService.js";

export async function renderPlanningPage(container) {
  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/planejamento")}
        <main class="app-content">
          <h2 class="form-title">Planejamento</h2>
          <p style="color:var(--color-text-muted); margin-top:-8px;">
            Data da prova, prazo de inscrição e valor da taxa de cada concurso que você está estudando.
          </p>
          <div id="alert-box"></div>
          <div class="card" style="margin-bottom:16px; max-width:640px;">
            <h3 style="margin-top:0;">+ Novo concurso</h3>
            <form id="new-exam-form">
              <div class="form-field">
                <label for="new_name">Nome</label>
                <input type="text" id="new_name" required />
              </div>
              <div class="form-field">
                <label for="new_exam_date">Data da prova</label>
                <input type="date" id="new_exam_date" />
              </div>
              <div class="form-field">
                <label for="new_registration_date">Prazo de inscrição</label>
                <input type="date" id="new_registration_date" />
              </div>
              <div class="form-field">
                <label for="new_fee">Valor da taxa (R$)</label>
                <input type="number" id="new_fee" min="0" step="0.01" />
              </div>
              <button type="submit" class="btn" style="width:auto; padding:8px 16px;">Cadastrar concurso</button>
            </form>
          </div>
          <div id="exams-list"><p>Carregando…</p></div>
        </main>
      </div>
    </div>
  `;
  wireNavbar(container);

  const { user } = getState();
  const alertBox = container.querySelector("#alert-box");
  const listBox = container.querySelector("#exams-list");
  let editingId = null;

  await carregar();

  container.querySelector("#new-exam-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    alertBox.innerHTML = "";
    const form = event.target;
    const name = form.querySelector("#new_name").value.trim();
    if (!name) return;
    try {
      await createExam({
        name,
        userId: user.id,
        examDate: form.querySelector("#new_exam_date").value || null,
        registrationDate: form.querySelector("#new_registration_date").value || null,
        feeAmount: form.querySelector("#new_fee").value ? Number(form.querySelector("#new_fee").value) : null,
      });
      form.reset();
      alertBox.innerHTML = `<div class="alert alert--success">Concurso cadastrado.</div>`;
      await carregar();
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">Erro ao cadastrar: ${escapeHtml(err.message)}</div>`;
    }
  });

  async function carregar() {
    let exams;
    try {
      exams = await listExams();
    } catch (err) {
      listBox.innerHTML = `<div class="alert alert--error">Erro ao carregar concursos: ${escapeHtml(err.message)}</div>`;
      return;
    }
    renderLista(exams);
  }

  function renderLista(exams) {
    if (!exams || exams.length === 0) {
      listBox.innerHTML = `<div class="card"><p style="color:var(--color-text-muted);">Nenhum concurso cadastrado ainda — use o formulário acima.</p></div>`;
      return;
    }
    listBox.innerHTML = exams.map((e) => (editingId === e.id ? cardEdicao(e) : cardExibicao(e, user.id))).join("");
    wireCards(exams);
  }

  function cardExibicao(e, userId) {
    const isOwn = e.user_id === userId;
    const valorTexto =
      e.fee_amount != null ? Number(e.fee_amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
    return `
      <div class="card" style="margin-bottom:16px; max-width:640px;">
        <h3 style="margin-top:0;">${escapeHtml(e.name)}</h3>
        ${contadorProva(e.exam_date)}
        ${contadorInscricao(e.registration_date)}
        <p style="margin:4px 0;">Valor da taxa: <strong>${valorTexto}</strong></p>
        ${isOwn ? `<button class="btn-link" data-edit="${e.id}">Editar</button>` : `<span style="color:var(--color-text-muted);">Concurso de outro usuário — sem edição aqui.</span>`}
      </div>
    `;
  }

  function cardEdicao(e) {
    return `
      <div class="card" style="margin-bottom:16px; max-width:640px; background:var(--color-bg-subtle, #f5f5f5);">
        <h3 style="margin-top:0;">${escapeHtml(e.name)}</h3>
        <div class="form-field">
          <label for="edit-exam-date-${e.id}">Data da prova</label>
          <input type="date" id="edit-exam-date-${e.id}" class="edit-exam-date" value="${e.exam_date || ""}" />
        </div>
        <div class="form-field">
          <label for="edit-registration-date-${e.id}">Prazo de inscrição</label>
          <input type="date" id="edit-registration-date-${e.id}" class="edit-registration-date" value="${e.registration_date || ""}" />
        </div>
        <div class="form-field">
          <label for="edit-fee-${e.id}">Valor da taxa (R$)</label>
          <input type="number" id="edit-fee-${e.id}" class="edit-fee" min="0" step="0.01" value="${e.fee_amount ?? ""}" />
        </div>
        <button class="btn-link" data-save="${e.id}">Salvar</button>
        &nbsp;|&nbsp;
        <button class="btn-link" data-cancel="${e.id}">Cancelar</button>
      </div>
    `;
  }

  function wireCards(exams) {
    listBox.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingId = btn.dataset.edit;
        renderLista(exams);
      });
    });
    listBox.querySelectorAll("[data-cancel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingId = null;
        renderLista(exams);
      });
    });
    listBox.querySelectorAll("[data-save]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".card");
        const examDate = card.querySelector(".edit-exam-date").value || null;
        const registrationDate = card.querySelector(".edit-registration-date").value || null;
        const feeRaw = card.querySelector(".edit-fee").value;
        try {
          await updateExamPlanning(btn.dataset.save, {
            examDate,
            registrationDate,
            feeAmount: feeRaw === "" ? null : Number(feeRaw),
          });
          editingId = null;
          await carregar();
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert--error">Erro ao salvar: ${escapeHtml(err.message)}</div>`;
        }
      });
    });
  }
}

function contadorProva(examDate) {
  const dias = diasAte(examDate);
  if (dias === null) return `<p style="color:var(--color-text-muted); margin:4px 0;">Data da prova não definida.</p>`;
  if (dias > 0) return `<p style="margin:4px 0;"><strong>Faltam ${dias} dia${dias === 1 ? "" : "s"}</strong> para a prova (${fmtDataBr(examDate)}).</p>`;
  if (dias === 0) return `<p style="margin:4px 0; color:var(--color-error); font-weight:600;">A prova é hoje!</p>`;
  return `<p style="margin:4px 0; color:var(--color-text-muted);">Prova realizada em ${fmtDataBr(examDate)}.</p>`;
}

function contadorInscricao(registrationDate) {
  const dias = diasAte(registrationDate);
  if (dias === null) return `<p style="color:var(--color-text-muted); margin:4px 0;">Prazo de inscrição não definido.</p>`;
  if (dias > 0)
    return `<p style="margin:4px 0;">Faltam ${dias} dia${dias === 1 ? "" : "s"} para o prazo de inscrição (${fmtDataBr(registrationDate)}).</p>`;
  if (dias === 0) return `<p style="margin:4px 0; color:var(--color-error); font-weight:600;">O prazo de inscrição encerra hoje!</p>`;
  return `<p style="margin:4px 0; color:var(--color-text-muted);">Inscrição encerrada em ${fmtDataBr(registrationDate)}.</p>`;
}

function diasAte(dataISO) {
  if (!dataISO) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${dataISO}T00:00:00`);
  return Math.round((alvo - hoje) / 86400000);
}

function fmtDataBr(dataISO) {
  const [y, m, d] = dataISO.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
