-- Fase 1 — exam_boards (catálogo: bancas)
-- user_id nulo = registro global de catálogo (só admin cria); preenchido = pessoal (TEC-009)

create table public.exam_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.exam_boards.metadata is 'Inclui scoring_type quando a regra de pontuação por banca for definida (NEG-010) — não criar coluna dedicada antes disso.';

create unique index exam_boards_global_name_uk on public.exam_boards (lower(name)) where user_id is null;
create unique index exam_boards_personal_name_uk on public.exam_boards (user_id, lower(name)) where user_id is not null;
create index exam_boards_user_id_idx on public.exam_boards (user_id);
