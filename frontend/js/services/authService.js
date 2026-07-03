// authService — única porta de entrada para operações de autenticação.
// Regras de negócio críticas não vivem aqui; isso só fala com o Supabase Auth.

import { supabase } from "../supabaseClient.js";

export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

// Edição do nome de exibição (perfil ainda não tem tela própria — usado pelo
// atalho inline da navbar). RLS: profiles_update_own já cobre update na
// própria linha (id = auth.uid()), nenhuma policy nova é necessária.
export async function updateDisplayName(userId, displayName) {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", userId)
    .single();
  if (error || !data) return { isAdmin: false, displayName: null };
  return { isAdmin: !!data.is_admin, displayName: data.display_name };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  // Aponta para uma página HTML própria (reset-password.html), fora do
  // roteador hash da SPA — ver js/resetPasswordEntry.js para o motivo técnico
  // (colisão entre o fragmento de recuperação do Supabase e o #/rota da SPA).
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname.replace(/index\.html$/, "")}reset-password.html`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  return data.subscription;
}
