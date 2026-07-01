// Router mínimo baseado em hash (#/login, #/dashboard...) — sem framework,
// só o suficiente para trocar a tela montada em #app (Doc. 17).

const routes = new Map();
let container = null;
let onNavigate = null;

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function navigate(path) {
  if (window.location.hash.replace(/^#/, "") === path) {
    renderCurrent();
  } else {
    window.location.hash = path;
  }
}

function renderCurrent() {
  const path = window.location.hash.replace(/^#/, "") || "/";
  if (onNavigate) onNavigate();
  const renderFn = routes.get(path) || routes.get("/");
  container.innerHTML = "";
  if (renderFn) renderFn(container);
}

export function startRouter(appContainer, guard) {
  container = appContainer;
  onNavigate = guard;
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}
