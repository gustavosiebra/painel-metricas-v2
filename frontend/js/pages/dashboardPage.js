// Placeholder do Dashboard — só para provar autenticação + isolamento ponta a ponta
// na Fase 2. O Dashboard real (KPIs, gráficos, ranking) é construído na Fase 6.

import { getState } from "../state.js";
import { signOut } from "../services/authService.js";

export function renderDashboardPage(container) {
  const { user, isAdmin } = getState();

  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        <header class="app-topbar">
          <strong>Painel de Métricas dos Estudos</strong>
          <div>
            <span style="margin-right:16px;">${user ? escapeHtml(user.email) : ""} ${isAdmin ? " (admin)" : ""}</span>
            <button id="logout-btn" class="btn-link" style="color:#fff;">Sair</button>
          </div>
        </header>
        <main class="app-content">
          <div class="card">
            <h2 class="form-title">Login funcionando</h2>
            <p>Você está autenticado como <strong>${user ? escapeHtml(user.email) : "?"}</strong>.</p>
            <p>Este é um placeholder da Fase 2 — o Dashboard real (KPIs, gráficos, ranking de risco) entra na Fase 6.</p>
          </div>
        </main>
      </div>
    </div>
  `;

  container.querySelector("#logout-btn").addEventListener("click", async () => {
    await signOut();
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
