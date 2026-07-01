// navbar — reutilizado por todas as telas autenticadas (Doc. 17: componente navbar).

import { navigate } from "../router.js";
import { signOut } from "../services/authService.js";
import { getState } from "../state.js";

export function renderNavbar(activeRoute) {
  const { user, isAdmin } = getState();
  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/sessoes/nova", label: "Nova Sessão" },
    { path: "/sessoes", label: "Sessões" },
    { path: "/catalogo", label: "Catálogo" },
  ];

  const linksHtml = links
    .map(
      (l) => `<a href="#${l.path}" class="nav-link${activeRoute === l.path ? " nav-link--active" : ""}" data-path="${l.path}">${l.label}</a>`
    )
    .join("");

  return `
    <header class="app-topbar">
      <div style="display:flex; align-items:center; gap:24px;">
        <strong>Painel de Métricas</strong>
        <nav class="app-nav">${linksHtml}</nav>
      </div>
      <div>
        <span style="margin-right:16px;">${user ? escapeHtml(user.email) : ""}${isAdmin ? " (admin)" : ""}</span>
        <button id="logout-btn" class="btn-link" style="color:#fff;">Sair</button>
      </div>
    </header>
  `;
}

export function wireNavbar(container) {
  container.querySelectorAll(".nav-link").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(el.dataset.path);
    });
  });
  const logoutBtn = container.querySelector("#logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => signOut());
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
