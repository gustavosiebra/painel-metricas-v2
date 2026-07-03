// Tela de Login/Cadastro/Recuperação de senha (Doc. 16, seção 4).

import { signIn, signUp, requestPasswordReset } from "../services/authService.js";

const MODE = { LOGIN: "login", SIGNUP: "signup", RECOVER: "recover" };

export function renderLoginPage(container) {
  let mode = MODE.LOGIN;
  render();

  function render() {
    container.innerHTML = `
      <div class="centered-page">
        <div class="card card--auth">
          <h1 class="form-title">${titleFor(mode)}</h1>
          <div id="alert-box"></div>
          <form id="auth-form">
            ${mode === MODE.SIGNUP ? `
            <div class="form-field">
              <label for="display-name">Nome</label>
              <input type="text" id="display-name" required autocomplete="name" placeholder="Como quer ser chamado no app" />
            </div>` : ""}
            <div class="form-field">
              <label for="email">E-mail</label>
              <input type="email" id="email" required autocomplete="email" />
            </div>
            ${mode !== MODE.RECOVER ? `
            <div class="form-field">
              <label for="password">Senha</label>
              <input type="password" id="password" required minlength="6" autocomplete="${mode === MODE.SIGNUP ? "new-password" : "current-password"}" />
            </div>` : ""}
            <button type="submit" class="btn">${submitLabelFor(mode)}</button>
          </form>
          <div class="form-links">
            ${mode !== MODE.LOGIN ? `<button class="btn-link" data-mode="${MODE.LOGIN}">Entrar</button>` : `<button class="btn-link" data-mode="${MODE.SIGNUP}">Criar conta</button>`}
            ${mode !== MODE.RECOVER ? `<button class="btn-link" data-mode="${MODE.RECOVER}">Esqueci a senha</button>` : ""}
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        render();
      });
    });

    container.querySelector("#auth-form").addEventListener("submit", handleSubmit);
  }

  function titleFor(m) {
    if (m === MODE.SIGNUP) return "Criar conta";
    if (m === MODE.RECOVER) return "Recuperar senha";
    return "Entrar";
  }

  function submitLabelFor(m) {
    if (m === MODE.SIGNUP) return "Criar conta";
    if (m === MODE.RECOVER) return "Enviar link de recuperação";
    return "Entrar";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const email = container.querySelector("#email").value.trim();
    const password = container.querySelector("#password")?.value ?? "";
    const alertBox = container.querySelector("#alert-box");
    alertBox.innerHTML = "";

    try {
      if (mode === MODE.SIGNUP) {
        const displayName = container.querySelector("#display-name").value.trim();
        await signUp(email, password, displayName);
        alertBox.innerHTML = `<div class="alert alert--success">Conta criada. Verifique seu e-mail para confirmar o cadastro.</div>`;
      } else if (mode === MODE.RECOVER) {
        await requestPasswordReset(email);
        alertBox.innerHTML = `<div class="alert alert--success">Se o e-mail existir, enviamos um link de recuperação.</div>`;
      } else {
        await signIn(email, password);
        // onAuthStateChange (auth.js) cuida do redirecionamento para /dashboard.
      }
    } catch (err) {
      alertBox.innerHTML = `<div class="alert alert--error">${escapeHtml(err.message || "Erro ao processar solicitação.")}</div>`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
