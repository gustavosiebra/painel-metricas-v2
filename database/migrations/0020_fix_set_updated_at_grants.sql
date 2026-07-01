-- Fase 1 — correção 3: set_updated_at ainda era executável por anon/authenticated
-- (privilégio padrão do Supabase para novas funções no schema public, separado de PUBLIC).
-- Confirmado via information_schema.routine_privileges, não era cache do advisor.

revoke execute on function public.set_updated_at() from anon, authenticated;
