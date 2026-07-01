-- Fase 1 — correção 2 do Advisor:
-- 1) Índice ausente em questions.user_id (unindexed_foreign_keys).
-- 2) Segurança: revoke anterior não bastou porque PUBLIC (papel implícito de
--    anon/authenticated) ainda concedia EXECUTE por padrão de criação de função.
-- 3) Performance: RLS reavaliando auth.uid()/is_admin() por linha em vez de uma vez
--    por consulta (auth_rls_initplan) — recriar policies com (select auth.<fn>()).

-- 1) índice ausente
create index questions_user_id_idx on public.questions (user_id);

-- 2) segurança — revogar de PUBLIC de verdade
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.protect_is_admin() from public;
revoke execute on function public.set_updated_at() from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3) performance — recriar todas as policies com (select auth.<fn>())

-- profiles
drop policy profiles_select_own on public.profiles;
drop policy profiles_insert_own on public.profiles;
drop policy profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles
for select to authenticated
using (id = (select auth.uid()));

create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- catálogo (6 tabelas x 4 policies)
do $$
declare
  t text;
begin
  foreach t in array array['exam_boards','disciplines','exams','question_sets','questions','risk_rules']
  loop
    execute format('drop policy %1$s_select on public.%1$s;', t);
    execute format('drop policy %1$s_insert on public.%1$s;', t);
    execute format('drop policy %1$s_update on public.%1$s;', t);
    execute format('drop policy %1$s_delete on public.%1$s;', t);

    execute format($f$
      create policy %1$s_select on public.%1$s
      for select to authenticated
      using (user_id is null or user_id = (select auth.uid()));
    $f$, t);

    execute format($f$
      create policy %1$s_insert on public.%1$s
      for insert to authenticated
      with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));
    $f$, t);

    execute format($f$
      create policy %1$s_update on public.%1$s
      for update to authenticated
      using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())))
      with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));
    $f$, t);

    execute format($f$
      create policy %1$s_delete on public.%1$s
      for delete to authenticated
      using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));
    $f$, t);
  end loop;
end;
$$;

-- pessoal (5 tabelas x 1 policy)
do $$
declare
  t text;
begin
  foreach t in array array['exam_disciplines','study_sessions','session_results','question_attempts','user_parameters']
  loop
    execute format('drop policy %1$s_all_own on public.%1$s;', t);
    execute format($f$
      create policy %1$s_all_own on public.%1$s
      for all to authenticated
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()));
    $f$, t);
  end loop;
end;
$$;
