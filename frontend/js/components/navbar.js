// navbar — reutilizado por todas as telas autenticadas (Doc. 17: componente navbar).

import { navigate } from "../router.js";
import { signOut, updateDisplayName } from "../services/authService.js";
import { getState, setState } from "../state.js";

// Navegação agrupada por MOMENTO DE USO (06/08/2026, discutido e aprovado pelo
// usuário). Antes eram 10 links soltos, todos com o mesmo peso visual — e o
// Catálogo, que se mexe uma vez por mês, ocupava o mesmo espaço que Nova
// Sessão, usada todo dia. Frequência medida no banco antes de decidir:
// 175 sessões, 15 erros, 2 simulados, 3 concursos, 1 catálogo global.
//
// Critério do agrupamento: não é por tipo de dado, é por quando se usa.
//   Nova Sessão / Revisar — todo dia, ficam diretos
//   Registros — o que já aconteceu (consulta e correção)
//   Escopo   — a montagem do que se vai estudar (raro, mas estruturante)
//   Histórico — leitura semanal, direto por ser um só
//
// Ordem escolhida pelo usuário em 06/08/2026: primeiro o que se FAZ (Nova
// Sessão), depois o que se DECIDE (Revisar), por último o que se OLHA
// (Registros, Escopo, Histórico).
//
// Prioridade saiu da navegação (06/08/2026). Não foi só reorganização: a tela
// listava os 1125 cadernos do catálogo global e 1065 deles (94,7%) nunca
// tinham sido estudados, então o ranking era dominado por linhas sem dado —
// "Access 2010" aparecia em 7º lugar pra um candidato a Engenheiro Civil. A
// pergunta que ela tentava responder ("o que ainda não toquei") tem lugar
// melhor na aba Cobertura do Edital, que conhece o escopo real. A rota segue
// registrada em app.js: links antigos continuam funcionando, só não é mais
// oferecida. Ver priorityPage.js.
const LINKS_DIRETOS_ANTES = [
  { path: "/sessoes/nova", label: "Nova Sessão" },
  { path: "/revisar", label: "Revisar" },
];
const LINKS_DIRETOS_DEPOIS = [{ path: "/historico", label: "Histórico" }];

const GRUPOS = [
  {
    label: "Registros",
    itens: [
      { path: "/sessoes", label: "Sessões" },
      { path: "/erros", label: "Erros" },
      { path: "/simulados", label: "Simulados" },
    ],
  },
  {
    label: "Escopo",
    itens: [
      { path: "/edital", label: "Edital" },
      { path: "/catalogo", label: "Catálogo" },
      { path: "/planejamento", label: "Planejamento" },
    ],
  },
];

export function renderNavbar(activeRoute) {
  const { user, isAdmin, displayName } = getState();
  const shownName = displayName || user?.email || "";

  const link = (l, extraClasse = "") =>
    `<a href="#${l.path}" class="nav-link${extraClasse}${activeRoute === l.path ? " nav-link--active" : ""}" data-path="${l.path}">${l.label}</a>`;

  const grupoHtml = (g) => {
    const temAtivo = g.itens.some((i) => i.path === activeRoute);
    return `
      <div class="nav-group">
        <button type="button" class="nav-link nav-group__btn${temAtivo ? " nav-link--active" : ""}" aria-expanded="false" aria-haspopup="true">
          ${g.label}<span class="nav-group__seta" aria-hidden="true">▾</span>
        </button>
        <div class="nav-dropdown">
          <span class="nav-dropdown__titulo">${g.label}</span>
          ${g.itens.map((i) => link(i, " nav-dropdown__item")).join("")}
        </div>
      </div>`;
  };

  // Nova Sessão é a ação mais frequente do app, mas fica como link comum
  // (06/08/2026, pedido do usuário): a versão em botão destacado poluía uma
  // barra que é toda de links limpos.
  const navHtml = [
    ...LINKS_DIRETOS_ANTES.map((l) => link(l)),
    ...GRUPOS.map(grupoHtml),
    ...LINKS_DIRETOS_DEPOIS.map((l) => link(l)),
  ].join("");

  return `
    <header class="app-topbar">
      <div class="navbar-left">
        <button type="button" id="nav-toggle" class="nav-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="app-nav">☰</button>
        <a href="#/dashboard" class="nav-link nav-link--brand${activeRoute === "/dashboard" ? " nav-link--active" : ""}" data-path="/dashboard"><strong>Painel de Métricas</strong></a>
        <nav class="app-nav" id="app-nav">${navHtml}</nav>
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

  // Dropdowns por clique, não por hover: hover não existe em toque, e um menu
  // que abre sozinho ao passar o mouse atrapalha quem só está indo pro link
  // seguinte. No mobile o CSS ignora isso e mostra os grupos já abertos, como
  // seções — menu dentro de menu em tela pequena é armadilha.
  const grupos = [...container.querySelectorAll(".nav-group")];
  const fecharGrupos = (exceto) => {
    for (const g of grupos) {
      if (g === exceto) continue;
      g.classList.remove("nav-group--aberto");
      g.querySelector(".nav-group__btn")?.setAttribute("aria-expanded", "false");
    }
  };
  for (const g of grupos) {
    const btn = g.querySelector(".nav-group__btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const abrindo = !g.classList.contains("nav-group--aberto");
      fecharGrupos(g);
      g.classList.toggle("nav-group--aberto", abrindo);
      btn.setAttribute("aria-expanded", String(abrindo));
    });
  }
  // Clique fora fecha. Sem isso o dropdown fica aberto atravessando a tela
  // seguinte — mesmo bug que o menu mobile já teve em 13/07/2026.
  document.addEventListener("click", () => fecharGrupos(null));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharGrupos(null);
  });

  container.querySelectorAll(".nav-link[data-path]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      // Fecha o menu mobile e os dropdowns ao navegar (13/07/2026) — sem isso,
      // o menu aberto atravessava pra tela seguinte, sobrando visível por cima
      // do conteúdo novo até o usuário fechar manualmente.
      if (appNav) {
        appNav.classList.remove("app-nav--open");
        if (navToggle) navToggle.setAttribute("aria-expanded", "false");
      }
      fecharGrupos(null);
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
