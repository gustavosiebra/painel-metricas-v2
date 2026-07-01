-- Fase 4 — ajuste: Banca precisa ser selecionável na sessão independente de
-- Concurso (ex.: treinar no estilo de uma banca sem mirar edital específico).
-- board_id opcional, independente de exam_id.

alter table public.study_sessions
  add column board_id uuid references public.exam_boards(id) on delete set null;

create index study_sessions_board_id_idx on public.study_sessions (board_id);
