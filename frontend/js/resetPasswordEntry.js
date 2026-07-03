// Página estática dedicada (fora do router #/ da SPA), usada exclusivamente
// como destino do link de recuperação de senha do Supabase Auth.
//
// Motivo técnico (bug encontrado em teste real, 01/07/2026): o Supabase Auth
// (fluxo implícito, padrão do supabase-js v2 para link de e-mail) devolve o
// token de recuperação como fragmento de URL — #access_token=...&type=
// recovery&... — e o supabase-js faz o parse desse fragmento sozinho ao
// carregar a página. Isso colide com o roteador hash da SPA (#/rota): quando
// o redirectTo apontava para ".../index.html#/reset-password", o navegador
// só reconhece o PRIMEIRO "#" da URL, então o token do Supabase virava parte
// literal do "path" do nosso router em vez de um fragmento próprio — o
// supabase-js nunca conseguia extrair access_token/type corretamente, a
// sessão de recuperação nunca era criada, e a tela de nova senha nunca
// aparecia (só o placeholder/dashboard, via fallback do router). Uma página
// HTML separada, fora do roteador da SPA, resolve isso: aqui o hash da URL é
// só o token do Supabase, sem nenhum prefixo de rota na frente.

import { supabase } from "./supabaseClient.js";
import { updatePassword } from "./services/authService.js";

const alertBox = document.querySelector("#alert-box");
const form = document.querySelector("#reset-form");

let recoveryReady = false;

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") {
    recoveryReady = true;
  }
});

// Fallback para a corrida rara em que o evento PASSWORD_RECOVERY já disparou
// antes deste listener ser registrado: getSession() ainda reflete a sessão de
// recuperação que o supabase-js cria ao processar o hash no carregamento.
supabase.auth.getSession().then(({ data }) => {
  if (data.session) recoveryReady = true;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  alertBox.innerHTML = "";

  const password = document.querySelector("#password").value;
  const confirm = document.querySelector("#password-confirm").value;

  if (password !== confirm) {
    alertBox.innerHTML = `<div class="alert alert--error">As senhas não coincidem.</div>`;
    return;
  }

  if (!recoveryReady) {
    alertBox.innerHTML = `<div class="alert alert--error">Link de recuperação inválido, expirado ou já usado. Solicite um novo link na tela de login.</div>`;
    return;
  }

  try {
    await updatePassword(password);
    alertBox.innerHTML = `<div class="alert alert--success">Senha atualizada. Redirecionando…</div>`;
    setTimeout(() => {
      window.location.href = "index.html#/dashboard";
    }, 1200);
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert--error">${escapeHtml(err.message || "Erro ao atualizar senha.")}</div>`;
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
