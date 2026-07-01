-- Fase 1 — profiles (pessoal, 1:1 com auth.users)
-- is_admin: superusuário simples (Doc. Único, seção 2.0 / TEC-008)

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'America/Fortaleza',
  preferences jsonb not null default '{}'::jsonb,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil do usuário. is_admin controla escrita nas tabelas de catálogo (ver TEC-008/TEC-009).';
