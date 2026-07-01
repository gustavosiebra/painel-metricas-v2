// Placeholder do Dashboard — prova autenticação + isolamento ponta a ponta na
// Fase 2. O Dashboard real (KPIs, gráficos, ranking) é construído na Fase 6.

import { getState } from "../state.js";
import { renderNavbar, wireNavbar } from "../components/navbar.js";

export function renderDashboardPage(container) {
  const { user } = getState();

  container.innerHTML = `
    <div class="app-shell">
      <div style="flex:1; display:flex; flex-direction:column;">
        ${renderNavbar("/dashboard")}
        <main class="app-content">
          <div class="card">
            <h2 class="form-title">Login funcionando</h2>
            <p>Você está autenticado como <strong>${user ? escapeHtml(user.email) : "?"}</strong>.</p>
            <p>Este é um placeholder da Fase 2 — o Dashboard real (KPIs, gráficos, ranking de risco) entra na Fase 6.</p>
            <p>Enquanto isso, veja o <a href="#/catalogo">Catálogo</a> já cadastrado (Fase 3), ou <a href="#/sessoes/nova">registre uma sessão de estudo</a> (Fase 4).</p>
          </div>
        </main>
      </div>
    </div>
  `;

  wireNavbar(container);

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
