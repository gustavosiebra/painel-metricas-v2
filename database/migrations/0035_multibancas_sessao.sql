-- Fase 4 (extensão) — Multibancas por sessão (decisão de 02/07/2026): uma
-- sessão de estudo pode referenciar mais de uma banca simultaneamente (ex.:
-- simulado misturando questões de bancas diferentes). study_sessions.board_id
-- é mantido como está (campo legado/atalho, usado quando só uma banca é
-- informada); study_session_boards é a fonte de verdade para múltiplas
-- bancas e para qualquer consumo futuro (ex. recorrência histórica por banca
-- combinada, Fase 5-B).

create table public.study_session_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  board_id uuid not null references public.exam_boards(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (session_id, board_id)
);

comment on table public.study_session_boards is
  'Bancas associadas a uma sessão de estudo (0..N). Suporta múltiplas bancas por sessão (ex. simulado misto). study_sessions.board_id continua existindo como atalho para o caso de banca única — não foi removido.';

create index study_session_boards_session_id_idx on public.study_session_boards (session_id);
create index study_session_boards_board_id_idx on public.study_session_boards (board_id);
create index study_session_boards_user_id_idx on public.study_session_boards (user_id);

-- Backfill: toda sessão que já tem board_id preenchido ganha 1 linha aqui,
-- para as duas fontes ficarem consistentes desde já.
insert into public.study_session_boards (user_id, session_id, board_id)
select user_id, id, board_id
from public.study_sessions
where board_id is not null
on conflict (session_id, board_id) do nothing;

create policy study_session_boards_all_own on public.study_session_boards
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
