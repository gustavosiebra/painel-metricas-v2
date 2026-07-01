-- Fase 1 — exam_disciplines (pessoal: peso/priorização por edital)
-- RN-004: weight nunca entra em fórmula de desempenho, só em priorização.

create table public.exam_disciplines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  discipline_id uuid not null references public.disciplines(id) on delete cascade,
  weight weight_level not null,
  target_accuracy numeric(5,2) check (target_accuracy is null or (target_accuracy >= 0 and target_accuracy <= 100)),
  expected_questions int check (expected_questions is null or expected_questions >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, exam_id, discipline_id)
);

create index exam_disciplines_user_id_idx on public.exam_disciplines (user_id);
create index exam_disciplines_exam_id_idx on public.exam_disciplines (exam_id);
create index exam_disciplines_discipline_id_idx on public.exam_disciplines (discipline_id);
