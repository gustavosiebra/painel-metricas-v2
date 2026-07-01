-- Fase 1 — user_parameters (pessoal)
-- Guarda faixas, pesos e limiares configuráveis, inclusive os cortes 80/60 do Wilson (NEG-002).

create table public.user_parameters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  scope text not null default 'global',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope, key)
);

create index user_parameters_user_id_idx on public.user_parameters (user_id);
