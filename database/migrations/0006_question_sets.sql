-- Fase 1 — question_sets (catálogo: cadernos)
-- learning_level = Situação, decidida por Caderno (não por Disciplina) — decisão de 01/07/2026.

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  exam_id uuid references public.exams(id) on delete set null,
  name text not null,
  source text,
  status record_status not null default 'ativo',
  learning_level learning_level not null default 'novo',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on column public.question_sets.exam_id is 'Opcional: caderno pode ser de estudo geral (reaproveitado entre concursos) ou travado a um edital específico. Ver Doc. Único 2.3.';

create index question_sets_discipline_id_idx on public.question_sets (discipline_id);
create index question_sets_exam_id_idx on public.question_sets (exam_id);
create index question_sets_user_id_idx on public.question_sets (user_id);
create index question_sets_status_idx on public.question_sets (status);
