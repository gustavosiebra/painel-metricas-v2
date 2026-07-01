-- Fase 1 — exams (catálogo: concursos/editais)

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  board_id uuid references public.exam_boards(id) on delete set null,
  name text not null,
  year int,
  role text,
  area text,
  exam_date date,
  status record_status not null default 'ativo',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index exams_user_id_idx on public.exams (user_id);
create index exams_board_id_idx on public.exams (board_id);
create index exams_status_idx on public.exams (status);
