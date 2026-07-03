// format.js — padrão único de formatação numérica da aplicação.
// Pedido do usuário (03/07/2026): todo número em porcentagem exibido em tela,
// em qualquer página, sempre com duas casas decimais. Antes cada tela formatava
// do seu jeito (algumas sem toFixed nenhum, herdando a precisão que vinha do
// banco; weightPage.js usava toFixed(1) num lugar e toFixed(2) em outro) —
// centralizado aqui pra não deixar essa inconsistência se repetir.

// Porcentagem simples (Wilson, % de acerto, meta, etc.). null/undefined/NaN → "—".
export function formatPct(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

// Delta em pontos percentuais, com sinal explícito (+/-). Usado em comparações
// (ex.: Janela de Tendência, semana atual vs. anterior).
export function formatDeltaPct(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "—";
  const sinal = n > 0 ? "+" : "";
  return `${sinal}${n.toFixed(2)} p.p.`;
}
