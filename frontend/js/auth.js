// Controle de sessão e proteção de rota.
// getProfile lê profiles.is_admin/display_name — RLS (profiles_select_own) já
// garante que cada usuário só enxerga a própria linha, então esta consulta é
// segura por natureza.

import { getSession, onAuthStateChange, getProfile } from "./services/authService.js";
import { getState, setState } from "./state.js";

const PUBLIC_ROUTES = ["/login"];

function currentRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return hash.split("?")[0] || "/";
}

export function guardRoute(navigate) {
  const { user } = getState();
  const route = currentRoute();
  const isPublic = PUBLIC_ROUTES.includes(route);

  if (!user && !isPublic) {
    navigate("/login");
  } else if (user && isPublic) {
    navigate("/dashboard");
  }
}

export async function initAuth(navigate) {
  const session = await getSession();
  const user = session?.user ?? null;
  const profile = user ? await getProfile(user.id) : { isAdmin: false, displayName: null };
  setState({ session, user, isAdmin: profile.isAdmin, displayName: profile.displayName, ready: true });

  onAuthStateChange(async (_event, newSession) => {
    const newUser = newSession?.user ?? null;
    const newProfile = newUser ? await getProfile(newUser.id) : { isAdmin: false, displayName: null };
    setState({ session: newSession, user: newUser, isAdmin: newProfile.isAdmin, displayName: newProfile.displayName });
    guardRoute(navigate);
  });

  guardRoute(navigate);
  return getState();
}
