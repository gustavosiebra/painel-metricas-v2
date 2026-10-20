
-- Registro de erros T1–T7 (27/07/2026) — metodologia de fechamento de erro
-- por causa raiz adotada pelo usuário. Cada linha é UM erro (ou chute/acerto
-- inseguro) classificado, com ciclo de vida aberto → encerrado (encerra
-- quando o usuário acerta questão nova do mesmo ponto e sabe explicar a
-- regra). NÃO é repetição espaçada — memorização continua no Anki; aqui é
-- gestão e indicadores (reincidência por subtema, distribuição por tipo,
-- taxa de fechamento).
create table public.error_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Sessão de origem (opcional): herança de contexto quando o registro parte
  -- do atalho pós-salvamento em Nova Sessão. set null: apagar a sessão não
  -- pode destruir o registro do erro (o aprendizado sobrevive à sessão).
  session_id uuid references public.study_sessions(id) on delete set null,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  question_set_id uuid references public.question_sets(id) on delete set null,
  -- Banca (pedido do usuário): habilita o filtro pré-prova "erros T6 desta
  -- banca" quando o edital definir a organizadora.
  board_id uuid references public.exam_boards(id) on delete set null,
  subtema text not null,
  resultado text not null default 'errada'
    check (resultado in ('errada', 'chute', 'acerto_inseguro')),
  tipo text not null
    check (tipo in ('T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7')),
  causa text not null,
  regra text,
  gatilho text,
  -- Texto simples + URLs (decisão consciente contra rich-text: ver discussão
  -- de 27/07/2026 — resumo elaborado pertence ao material de teoria/Anki,
  -- não ao registro de erro, que precisa ser seco pra sobreviver como hábito).
  anotacao text,
  status text not null default 'aberto'
    check (status in ('aberto', 'encerrado')),
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.error_records enable row level security;

create policy error_records_select on public.error_records
  for select using (user_id = (select auth.uid()));
create policy error_records_insert on public.error_records
  for insert with check (user_id = (select auth.uid()));
create policy error_records_update on public.error_records
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy error_records_delete on public.error_records
  for delete using (user_id = (select auth.uid()));

create index error_records_user_status_idx on public.error_records (user_id, status);
create index error_records_user_disc_idx on public.error_records (user_id, discipline_id);
create index error_records_user_created_idx on public.error_records (user_id, created_at desc);
;
