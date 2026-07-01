-- Fase 1 — question_attempts (pessoal)
-- Sustenta RN-008: preservar o primeiro contato com cada questão, nunca sobrescrever.

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  contact_type contact_type not null,
  is_correct boolean not null,
  time_seconds int check (time_seconds is null or time_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb
);

create index question_attempts_user_id_idx on public.question_attempts (user_id);
create index question_attempts_question_id_idx on public.question_attempts (question_id);
create index question_attempts_session_id_idx on public.question_attempts (session_id);
