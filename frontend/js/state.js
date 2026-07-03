// Estado global mínimo da aplicação (Doc. 17, princípio: concentrar estado aqui,
// nunca variáveis globais soltas espalhadas pelas páginas).

const state = {
  session: null,
  user: null,
  isAdmin: false,
  displayName: null,
  ready: false,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
