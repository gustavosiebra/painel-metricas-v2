-- Fase 1 — study_sessions (pessoal)

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  exam_id uuid references public.exams(id) on delete set null,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  question_set_id uuid references public.question_sets(id) on delete set null,
  study_type study_type not null,
  duration_minutes numeric(8,2) not null check (duration_minutes >= 0),
  self_confidence confidence_level,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.study_sessions.duration_minutes is 'Sempre gravado, mesmo para study_type sem resultado mensurável (revisao/flashcard/leitura/videoaula) — conta em Eficiência Global e Produtividade.';

create index study_sessions_user_id_idx on public.study_sessions (user_id);
create index study_sessions_discipline_id_idx on public.study_sessions (discipline_id);
create index study_sessions_question_set_id_idx on public.study_sessions (question_set_id);
create index study_sessions_exam_id_idx on public.study_sessions (exam_id);
create index study_sessions_occurred_at_idx on public.study_sessions (occurred_at);
