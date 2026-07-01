// Router mínimo baseado em hash (#/login, #/dashboard, #/sessoes/editar?id=...)
// — sem framework, só o suficiente para trocar a tela montada em #app (Doc. 17).
// Suporta querystring simples para parâmetros (ex.: id de edição).

const routes = new Map();
let container = null;
let onNavigate = null;

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

function parseHash() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const [path, queryString] = hash.split("?");
  return { path: path || "/", params: new URLSearchParams(queryString || "") };
}

export function navigate(path, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const target = path + query;
  const current = window.location.hash.replace(/^#/, "");
  if (current === target) {
    renderCurrent();
  } else {
    window.location.hash = target;
  }
}

function renderCurrent() {
  const { path, params } = parseHash();
  if (onNavigate) onNavigate();
  const renderFn = routes.get(path) || routes.get("/");
  container.innerHTML = "";
  if (renderFn) renderFn(container, params);
}

export function startRouter(appContainer, guard) {
  container = appContainer;
  onNavigate = guard;
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}
