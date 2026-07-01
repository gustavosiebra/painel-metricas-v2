-- Fase 1 — disciplines (catálogo)

create table public.disciplines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text,
  status record_status not null default 'ativo',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index disciplines_global_name_uk on public.disciplines (lower(name)) where user_id is null;
create unique index disciplines_personal_name_uk on public.disciplines (user_id, lower(name)) where user_id is not null;
create index disciplines_user_id_idx on public.disciplines (user_id);
create index disciplines_status_idx on public.disciplines (status);
