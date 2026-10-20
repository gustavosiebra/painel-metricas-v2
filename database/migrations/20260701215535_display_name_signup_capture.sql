-- Validação em uso real (01/07/2026) — pedido explícito: mostrar nome de
-- exibição do usuário na navbar em vez do e-mail cru. Decisão (ver doc único,
-- NEG-016): login continua por e-mail (Supabase Auth nativo); só o nome
-- exibido muda. handle_new_user() passa a ler display_name enviado no cadastro
-- via supabase.auth.signUp({ options: { data: { display_name } } }) e gravar
-- em profiles.display_name já na criação da conta.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
;
