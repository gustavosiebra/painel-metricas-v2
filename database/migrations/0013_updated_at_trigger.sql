-- Fase 1 — trigger genérico para manter updated_at em dia

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_parameters_set_updated_at
before update on public.user_parameters
for each row execute function public.set_updated_at();
