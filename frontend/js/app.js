// Ponto de entrada. Registra rotas, inicializa autenticação e sobe o router.

import { registerRoute, startRouter, navigate } from "./router.js";
import { initAuth, guardRoute } from "./auth.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";
import { renderCatalogPage } from "./pages/catalogPage.js";
import { renderStudyFormPage } from "./pages/studyFormPage.js";
import { renderSessionsPage } from "./pages/sessionsPage.js";
import { renderHistoryPage } from "./pages/historyPage.js";
import { renderParametersPage } from "./pages/parametersPage.js";
import { renderPriorityPage } from "./pages/priorityPage.js";

// "/pesos" removido em 05/07/2026 — Peso virou sub-aba dentro de Catálogo
// (catalogPage.js). weightPage.js fica no repo sem uso, sem risco.
registerRoute("/login", renderLoginPage);
registerRoute("/dashboard", renderDashboardPage);
registerRoute("/catalogo", renderCatalogPage);
registerRoute("/sessoes/nova", renderStudyFormPage);
registerRoute("/sessoes", renderSessionsPage);
registerRoute("/historico", renderHistoryPage);
registerRoute("/parametros", renderParametersPage);
registerRoute("/prioridade", renderPriorityPage);
registerRoute("/", renderDashboardPage);

async function bootstrap() {
  const app = document.getElementById("app");
  await initAuth(navigate);
  startRouter(app, () => guardRoute(navigate));
}

bootstrap();
