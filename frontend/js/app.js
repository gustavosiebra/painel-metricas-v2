// Ponto de entrada. Registra rotas, inicializa autenticação e sobe o router.

import { registerRoute, startRouter, navigate } from "./router.js";
import { initAuth, guardRoute } from "./auth.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";

registerRoute("/login", renderLoginPage);
registerRoute("/dashboard", renderDashboardPage);
registerRoute("/", renderDashboardPage);

async function bootstrap() {
  const app = document.getElementById("app");
  await initAuth(navigate);
  startRouter(app, () => guardRoute(navigate));
}

bootstrap();
