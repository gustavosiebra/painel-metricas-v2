-- Fase 1 — RLS de profiles + proteção contra o próprio usuário se promover a admin

create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_admin is distinct from old.is_admin) and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_is_admin
before update on public.profiles
for each row execute function public.protect_is_admin();
