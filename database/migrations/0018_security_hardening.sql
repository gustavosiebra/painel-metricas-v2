-- Fase 1 — correções apontadas pelo Security Advisor do Supabase
-- 1) set_updated_at tinha search_path mutável (risco de search_path hijacking).
-- 2) handle_new_user e protect_is_admin são funções de trigger, sem uso legítimo
--    como RPC direto — revogar execução de anon/authenticated.
-- 3) is_admin(): revogar de anon (para authenticated, uso legítimo no frontend).
-- Observação: rls_auto_enable() é função interna do próprio Supabase, não criada
-- por este projeto — fora de escopo desta correção.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.protect_is_admin() from anon, authenticated;
revoke execute on function public.is_admin() from anon;
