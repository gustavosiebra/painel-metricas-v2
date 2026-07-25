// Tela de Login/Cadastro/Recuperação de senha (Doc. 16, seção 4).

import { signIn, signUp, requestPasswordReset } from "../services/authService.js";

const MODE = { LOGIN: "login", SIGNUP: "signup", RECOVER: "recover" };

// Ícones do botão "mostrar senha" (19/07/2026, pedido do usuário) — SVG
// inline (sem lib de ícone nenhuma no projeto) em vez de emoji: o resto do
// app usa só símbolos monocromáticos (▲/▼/✓), um emoji colorido de olho
// destoaria. currentColor herda a cor do botão, acompanha hover automático.
const EYE_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_ICON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

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
              <div class="password-field-wrap">
                <input type="password" id="password" class="password-input" required minlength="6" autocomplete="${mode === MODE.SIGNUP ? "new-password" : "current-password"}" />
                <button type="button" id="toggle-password" class="password-toggle-btn" aria-label="Mostrar senha" title="Mostrar senha">${EYE_ICON}</button>
              </div>
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

    // Mostrar senha (19/07/2026, pedido do usuário) — só existe quando o
    // campo de senha está na tela (login/cadastro, não em "recuperar senha").
    const togglePasswordBtn = container.querySelector("#toggle-password");
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener("click", () => {
        const passwordInput = container.querySelector("#password");
        const oculta = passwordInput.type === "password";
        passwordInput.type = oculta ? "text" : "password";
        togglePasswordBtn.innerHTML = oculta ? EYE_OFF_ICON : EYE_ICON;
        const label = oculta ? "Ocultar senha" : "Mostrar senha";
        togglePasswordBtn.setAttribute("aria-label", label);
        togglePasswordBtn.setAttribute("title", label);
      });
    }
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
