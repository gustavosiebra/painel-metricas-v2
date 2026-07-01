// Controle de sessão e proteção de rota.
// checkIsAdmin lê profiles.is_admin — RLS (profiles_select_own) já garante que
// cada usuário só enxerga a própria linha, então esta consulta é segura por natureza.

import { supabase } from "./supabaseClient.js";
import { getSession, onAuthStateChange } from "./services/authService.js";
import { getState, setState } from "./state.js";

const PUBLIC_ROUTES = ["/login"];

async function checkIsAdmin(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  if (error || !data) return false;
  return !!data.is_admin;
}

function currentRoute() {
  return window.location.hash.replace(/^#/, "") || "/";
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
  const isAdmin = user ? await checkIsAdmin(user.id) : false;
  setState({ session, user, isAdmin, ready: true });

  onAuthStateChange(async (_event, newSession) => {
    const newUser = newSession?.user ?? null;
    const admin = newUser ? await checkIsAdmin(newUser.id) : false;
    setState({ session: newSession, user: newUser, isAdmin: admin });
    guardRoute(navigate);
  });

  guardRoute(navigate);
  return getState();
}
