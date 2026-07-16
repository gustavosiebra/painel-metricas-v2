// navbar — reutilizado por todas as telas autenticadas (Doc. 17: componente navbar).

import { navigate } from "../router.js";
import { signOut, updateDisplayName } from "../services/authService.js";
import { getState, setState } from "../state.js";

export function renderNavbar(activeRoute) {
  const { user, isAdmin, displayName } = getState();
  const shownName = displayName || user?.email || "";
  // Navegação reorganizada em 05/07/2026 (discutida e aprovada pelo
  // usuário): "Dashboard" virou o título/logo; "Peso" foi incorporado como
  // sub-aba dentro de Catálogo (mesma preocupação de fundo: estrutura por
  // trás dos números); "Configurações" saiu da barra principal (uso raro) e
  // virou um ícone de engrenagem perto do nome/Sair. Nova Sessão continua
  // aqui (ação mais frequente do app, não vale o risco de esconder atrás de
  // um clique a mais) — ganhou também um atalho direto no Dashboard.
  const links = [
    { path: "/sessoes/nova", label: "Nova Sessão" },
    { path: "/sessoes", label: "Sessões" },
    { path: "/catalogo", label: "Catálogo" },
    { path: "/planejamento", label: "Planejamento" },
    { path: "/prioridade", label: "Prioridade" },
    { path: "/historico", label: "Histórico" },
  ];
  // Dicionário (Admin) removido em 05/07/2026 — o Catálogo voltou a existir
  // pra todo mundo (com editar/apagar local), então a tela exclusiva de admin
  // perdeu a razão de ser. Rota/arquivo ficaram no repo sem uso, sem risco.
  // "/pesos" (weightPage.js) também ficou sem uso — mesma lógica agora vive
  // na sub-aba Peso de catalogPage.js.

  const linksHtml = links
    .map(
      (l) => `<a href="#${l.path}" class="nav-link${activeRoute === l.path ? " nav-link--active" : ""}" data-path="${l.path}">${l.label}</a>`
    )
    .join("");

  // Grupos viraram classes (07/07/2026, validação mobile) em vez de inline
  // style — precisava de flex-wrap responsivo em telas estreitas, e um
  // style="" inline com gap fixo (24px) tem prioridade sobre qualquer regra
  // de media query no CSS, então não dava pra sobrescrever sem !important.
  // Com classes, .navbar-left/.navbar-right controlam isso de verdade.
  return `
    <header class="app-topbar">
      <div class="navbar-left">
        <button type="button" id="nav-toggle" class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="app-nav">☰</button>
        <a href="#/dashboard" class="nav-link nav-link--brand${activeRoute === "/dashboard" ? " nav-link--active" : ""}" data-path="/dashboard"><strong>Painel de Métricas</strong></a>
        <nav class="app-nav" id="app-nav">${linksHtml}</nav>
      </div>
      <div class="navbar-right">
        <a href="#/parametros" class="settings-link${activeRoute === "/parametros" ? " nav-link--active" : ""}" data-path="/parametros" title="Configurações">⚙</a>
        <span id="display-name-label" class="navbar-name" title="Clique para editar o nome de exibição">${escapeHtml(shownName)}</span>
        <span style="margin-right:16px;">${isAdmin ? " (admin)" : ""}</span>
        <button id="logout-btn" class="btn-link" style="color:#fff;">Sair</button>
      </div>
    </header>
  `;
}

export function wireNavbar(container) {
  const appNav = container.querySelector("#app-nav");
  const navToggle = container.querySelector("#nav-toggle");
  if (navToggle && appNav) {
    navToggle.addEventListener("click", () => {
      const aberto = appNav.classList.toggle("app-nav--open");
      navToggle.setAttribute("aria-expanded", String(aberto));
    });
  }

  container.querySelectorAll(".nav-link").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      // Fecha o menu mobile ao navegar (13/07/2026) — sem isso, o menu
      // aberto atravessava pra tela seguinte, sobrando visível por cima
      // do conteúdo novo até o usuário fechar manualmente.
      if (appNav) {
        appNav.classList.remove("app-nav--open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      }
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
