// navbar — reutilizado por todas as telas autenticadas (Doc. 17: componente navbar).

import { navigate } from "../router.js";
import { signOut, updateDisplayName } from "../services/authService.js";
import { getState, setState } from "../state.js";

export function renderNavbar(activeRoute) {
  const { user, isAdmin, displayName } = getState();
  const shownName = displayName || user?.email || "";
  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/sessoes/nova", label: "Nova Sessão" },
    { path: "/sessoes", label: "Sessões" },
    { path: "/catalogo", label: "Catálogo" },
    { path: "/pesos", label: "Peso" },
    { path: "/historico", label: "Histórico" },
    { path: "/parametros", label: "Parâmetros" },
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
        <span id="display-name-label" style="margin-right:4px; cursor:pointer;" title="Clique para editar o nome de exibição">${escapeHtml(shownName)}</span>
        <span style="margin-right:16px;">${isAdmin ? " (admin)" : ""}</span>
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

  // Atalho inline de edição do nome (perfil ainda não tem tela própria).
  const nameLabel = container.querySelector("#display-name-label");
  if (nameLabel) {
    nameLabel.addEventListener("click", async () => {
      const { user, displayName } = getState();
      if (!user) return;
      const newName = window.prompt("Nome de exibição:", displayName || "");
      if (newName === null) return;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === displayName) return;
      try {
        await updateDisplayName(user.id, trimmed);
        setState({ displayName: trimmed });
        nameLabel.textContent = trimmed;
      } catch (err) {
        window.alert("Erro ao salvar nome: " + (err.message || "desconhecido"));
      }
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
