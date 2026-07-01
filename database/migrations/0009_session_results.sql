-- Fase 1 — session_results (pessoal)
-- Relação 1:0..1 com study_sessions (TEC-010): só existe para study_type com
-- resultado mensurável (questao, simulado, discursiva). Revisao/flashcard/leitura/
-- videoaula não geram linha aqui, mas seu tempo já foi gravado em study_sessions.

create table public.session_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.study_sessions(id) on delete cascade,
  questions_total int not null default 0 check (questions_total >= 0),
  correct_total int not null default 0 check (correct_total >= 0),
  wrong_total int not null default 0 check (wrong_total >= 0),
  new_questions int not null default 0 check (new_questions >= 0),
  review_questions int not null default 0 check (review_questions >= 0),
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  score_is_estimate boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint session_results_totals_ck check (questions_total = correct_total + wrong_total),
  constraint session_results_correct_le_total_ck check (correct_total <= questions_total)
);

comment on column public.session_results.score is 'Nota 0–100 (NEG-008). score_is_estimate = true quando calculada como acertos - erros (sem negativo), não nota oficial da banca.';

create index session_results_user_id_idx on public.session_results (user_id);
