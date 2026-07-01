-- Fase 1 — questions (catálogo)
-- external_id/statement_hash existem para dedup, essencial em catálogo compartilhado.

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question_set_id uuid not null references public.question_sets(id) on delete cascade,
  external_id text,
  statement_hash text,
  board_id uuid references public.exam_boards(id) on delete set null,
  year int,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index questions_dedup_uk on public.questions (question_set_id, statement_hash) where statement_hash is not null;
create index questions_question_set_id_idx on public.questions (question_set_id);
create index questions_board_id_idx on public.questions (board_id);
create index questions_tags_gin_idx on public.questions using gin (tags);
