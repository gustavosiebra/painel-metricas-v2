-- Fase 4 — a tela de Sessões exige exclusão lógica, não física (Doc. 16: "evitar
-- exclusão física, preferir status ativo/inativo"; RN-009: nenhum cálculo apaga
-- histórico). study_sessions não tinha essa coluna — corrigindo antes de construir
-- a tela de listagem/arquivamento.

alter table public.study_sessions
  add column status record_status not null default 'ativo';

create index study_sessions_status_idx on public.study_sessions (status);
