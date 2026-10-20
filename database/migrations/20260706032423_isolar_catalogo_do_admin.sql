
-- Pedido do usuário (05/07/2026): reverter o bypass de is_admin() que eu
-- tinha colocado em SELECT/UPDATE/DELETE dos 4 catálogos pessoais na Fase 10
-- (pra alimentar a extinta aba "Dicionário Admin"). Com a aba removida, esse
-- bypass ficou órfão mas continuava ativo, fazendo o admin enxergar (e poder
-- editar/apagar) o catálogo pessoal de QUALQUER usuário pela tela normal de
-- Catálogo — não era mais intencional. Volta a ser: cada um só vê/edita/apaga
-- global (user_id null) + o que ele mesmo criou, admin incluso.
-- Alterações administrativas globais futuras (ex.: promover algo pessoal pra
-- global) passam a ser feitas manualmente no banco, só quando o usuário pedir
-- explicitamente — sem esse atalho automático na UI.

alter policy disciplines_select on disciplines
  using ((user_id is null) or (user_id = (select auth.uid())));
alter policy disciplines_update on disciplines
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy disciplines_delete on disciplines
  using (user_id = (select auth.uid()));

alter policy exam_boards_select on exam_boards
  using ((user_id is null) or (user_id = (select auth.uid())));
alter policy exam_boards_update on exam_boards
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy exam_boards_delete on exam_boards
  using (user_id = (select auth.uid()));

alter policy exams_select on exams
  using ((user_id is null) or (user_id = (select auth.uid())));
alter policy exams_update on exams
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy exams_delete on exams
  using (user_id = (select auth.uid()));

alter policy question_sets_select on question_sets
  using ((user_id is null) or (user_id = (select auth.uid())));
alter policy question_sets_update on question_sets
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy question_sets_delete on question_sets
  using (user_id = (select auth.uid()));
;
