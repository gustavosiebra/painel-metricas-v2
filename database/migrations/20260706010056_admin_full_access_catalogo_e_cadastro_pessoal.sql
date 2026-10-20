
-- Fase 10 (05/07/2026) — duas mudanças pedidas pelo usuário:
--
-- 1) Cadastro sob demanda (Nova Sessão) deixa de criar Concurso/Banca/
--    Disciplina/Caderno como "global" quando quem cadastra é admin. A partir
--    de agora TODO mundo (inclusive admin) cria como item pessoal
--    (user_id = quem criou) — novos usuários passam a ver essas 4 listas
--    vazias até cadastrarem os próprios itens, em vez de herdar o catálogo
--    de teste do admin. Promover algo pessoal pra global vira uma ação
--    manual (avisada caso a caso pelo usuário), não mais automática.
--
-- 2) Painel admin: precisa ver e editar/apagar o catálogo de TODOS os
--    usuários (não só o próprio). RLS de select/update/delete das 4 tabelas
--    ganha bypass de is_admin() sem a restrição "só se for global" que
--    existia antes (a policy antiga só deixava admin mexer em item global
--    OU próprio — não em item pessoal de outro usuário).

alter policy disciplines_select on disciplines
  using ((user_id is null) or (user_id = (select auth.uid())) or (select is_admin()));
alter policy disciplines_update on disciplines
  using ((user_id = (select auth.uid())) or (select is_admin()))
  with check ((user_id = (select auth.uid())) or (select is_admin()));
alter policy disciplines_delete on disciplines
  using ((user_id = (select auth.uid())) or (select is_admin()));

alter policy exam_boards_select on exam_boards
  using ((user_id is null) or (user_id = (select auth.uid())) or (select is_admin()));
alter policy exam_boards_update on exam_boards
  using ((user_id = (select auth.uid())) or (select is_admin()))
  with check ((user_id = (select auth.uid())) or (select is_admin()));
alter policy exam_boards_delete on exam_boards
  using ((user_id = (select auth.uid())) or (select is_admin()));

alter policy exams_select on exams
  using ((user_id is null) or (user_id = (select auth.uid())) or (select is_admin()));
alter policy exams_update on exams
  using ((user_id = (select auth.uid())) or (select is_admin()))
  with check ((user_id = (select auth.uid())) or (select is_admin()));
alter policy exams_delete on exams
  using ((user_id = (select auth.uid())) or (select is_admin()));

alter policy question_sets_select on question_sets
  using ((user_id is null) or (user_id = (select auth.uid())) or (select is_admin()));
alter policy question_sets_update on question_sets
  using ((user_id = (select auth.uid())) or (select is_admin()))
  with check ((user_id = (select auth.uid())) or (select is_admin()));
alter policy question_sets_delete on question_sets
  using ((user_id = (select auth.uid())) or (select is_admin()));

-- Dado existente (pedido explícito do usuário, 05/07/2026): os 6 concursos
-- que hoje são globais (visíveis a todo mundo) viram pessoais do admin — não
-- some nada pro admin (ele continua vendo tudo, é dono agora), mas novos
-- usuários deixam de herdar esses concursos de teste. Bancas ficam
-- intocadas (pedido explícito: "deixe a banca intacta").
update exams set user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a' where user_id is null;

-- Função de apoio pro painel admin: junta auth.users (não acessível direto
-- via PostgREST) com profiles pra mostrar dono (email/nome) de cada item do
-- catálogo. SECURITY DEFINER pra poder ler auth.users; o "where is_admin()"
-- interno garante que só admin recebe linhas de volta (não-admin chama e
-- recebe 0 linhas, sem erro).
create or replace function public.admin_list_users()
returns table (id uuid, email text, display_name text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email::text, p.display_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  where (select is_admin());
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
;
