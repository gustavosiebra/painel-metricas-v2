-- Fase 1 — risk_rules (catálogo)
-- Alimenta Calibração de Confiança e recommended_action (NEG-007).
-- NÃO é mais a fonte oficial de risco — isso é a métrica Prioridade (Wilson x Peso).

create table public.risk_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  learning_level learning_level not null,
  weight weight_level not null,
  risk risk_level not null,
  recommended_action text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index risk_rules_global_uk on public.risk_rules (learning_level, weight) where user_id is null;
create unique index risk_rules_personal_uk on public.risk_rules (user_id, learning_level, weight) where user_id is not null;
create index risk_rules_user_id_idx on public.risk_rules (user_id);
