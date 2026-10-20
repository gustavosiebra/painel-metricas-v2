create table public.historical_question_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  board_id uuid not null references public.exam_boards(id) on delete cascade,
  question_set_id uuid not null references public.question_sets(id) on delete cascade,
  quantidade integer not null check (quantidade >= 0),
  percentual numeric(6,3),
  periodo text not null,
  fonte text not null default 'TEC Concursos',
  created_at timestamptz not null default now(),
  unique (board_id, question_set_id)
);

comment on table public.historical_question_stats is 'Frequencia historica de questoes por banca x caderno (catalogo). Referencia para a tela de Peso -- nao entra sozinha em v_prioridade (NEG-007).';

create index historical_question_stats_board_id_idx on public.historical_question_stats (board_id);
create index historical_question_stats_question_set_id_idx on public.historical_question_stats (question_set_id);
create index historical_question_stats_user_id_idx on public.historical_question_stats (user_id);

alter table public.historical_question_stats enable row level security;

create policy historical_question_stats_select on public.historical_question_stats
for select to authenticated
using (user_id is null or user_id = (select auth.uid()));

create policy historical_question_stats_insert on public.historical_question_stats
for insert to authenticated
with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));

create policy historical_question_stats_update on public.historical_question_stats
for update to authenticated
using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())))
with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));

create policy historical_question_stats_delete on public.historical_question_stats
for delete to authenticated
using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));
;
