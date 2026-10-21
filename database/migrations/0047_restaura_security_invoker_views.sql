-- 0047 — URGENTE: restaura security_invoker nas views
--
-- O QUE QUEBROU (21/10/2026):
-- A migration 0046 usou `create or replace view <nome> as <corpo>` sem a
-- cláusula WITH. No PostgreSQL, CREATE OR REPLACE VIEW sem WITH **zera as
-- reloptions da view**, e com elas foi embora o `security_invoker = true` das
-- 15 views atualizadas.
--
-- CONSEQUÊNCIA: sem security_invoker, a view é avaliada com os privilégios do
-- DONO, não os de quem consulta. As policies de RLS de study_sessions
-- (user_id = auth.uid()) deixaram de ser aplicadas ao chamador, e as views
-- passaram a devolver as linhas de TODOS os usuários.
--
-- Sintoma visível: o dashboard quebrou com "JSON object requested, multiple
-- (or no) rows returned" (PGRST116), porque getKpis() faz
-- `from('v_diagnostico_geral').select('*').maybeSingle()` e a view, que
-- agrupa por user_id, passou de 1 linha para 3.
--
-- O erro do dashboard foi sorte: ele expôs em minutos o que de outro modo
-- seria uma exposição silenciosa de dados entre usuários.
--
-- TAMBÉM CORRIGIDO AQUI (defeito anterior, descoberto na investigação):
-- v_desempenho_relativo, _semana e _disciplina nunca tiveram
-- security_invoker. Foram criadas assim nas migrations 0040 (15/10) e 0041
-- (20/10) — escritas com `create view` + grants, sem a cláusula. Estão com o
-- mesmo defeito desde 15/10/2026, não desde ontem.
--
-- VERIFICADO após a aplicação:
--   23 de 23 views de public com security_invoker = true;
--   consulta a v_diagnostico_geral como role `authenticated` com
--   request.jwt.claims.sub = b0d56062 devolve 1 linha (3.286 questões),
--   contra 3 linhas vistas por service_role, que ignora RLS por definição.
--
-- REGRA A PARTIR DAQUI: toda view em public é criada ou substituída com
--   create or replace view ... with (security_invoker = true) as ...
-- e nenhuma alteração de view usa CREATE OR REPLACE sem repetir o WITH.

do $$
declare
  v record;
  n int := 0;
begin
  for v in
    select c.oid, c.relname
    from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname = 'public' and c.relkind = 'v'
      and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=true%'
    order by c.relname
  loop
    execute format('alter view public.%I set (security_invoker = true)', v.relname);
    n := n + 1;
    raise notice 'security_invoker restaurado em %', v.relname;
  end loop;
  raise notice 'Total: % views corrigidas', n;
end $$;

do $$
declare
  faltando text;
begin
  select string_agg(c.relname, ', ')
  into faltando
  from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'public' and c.relkind = 'v'
    and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=true%';

  if faltando is not null then
    raise exception 'Views ainda sem security_invoker: %', faltando;
  end if;
  raise notice 'OK: todas as views de public tem security_invoker = true';
end $$;
