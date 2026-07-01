-- Fase 5 — funções auxiliares da camada analítica.
-- get_user_param: parametrização centralizada (NEG-005) sem pré-popular user_parameters.
-- Busca (user_id, scope='global', key); se não existir, cai no default embutido no
-- código chamador. Nada é forjado no banco — o usuário só ganha uma linha real em
-- user_parameters no dia em que decidir sobrescrever algo (Fase 7).
create or replace function public.get_user_param(
  p_user_id uuid,
  p_key text,
  p_default jsonb
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select up.value from public.user_parameters up
     where up.user_id = p_user_id and up.scope = 'global' and up.key = p_key
     limit 1),
    p_default
  );
$$;

comment on function public.get_user_param(uuid, text, jsonb) is
  'Lookup parametrizado (NEG-005): retorna user_parameters.value se existir, senão o default passado pelo chamador. Não pré-popula a tabela.';

revoke execute on function public.get_user_param(uuid, text, jsonb) from public;
grant execute on function public.get_user_param(uuid, text, jsonb) to authenticated;

-- wilson_lower_bound: limite inferior do intervalo de Wilson, 80% de confiança
-- bilateral fixo (z ≈ 1,2816 — decisão NEG-002, não é o mesmo "80%" dos cortes de
-- classificação Consolidado/Atenção/Crítico, que são aplicados depois sobre este
-- valor). Retorna percentual (0–100). NULL se total = 0.
create or replace function public.wilson_lower_bound(
  p_correct int,
  p_total int,
  p_z numeric default 1.2816
) returns numeric
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_total is null or p_total = 0 then null
    else round(
      (
        (p_correct::numeric / p_total)
        + (p_z * p_z) / (2 * p_total)
        - p_z * sqrt(
            ((p_correct::numeric / p_total) * (1 - (p_correct::numeric / p_total))
             + (p_z * p_z) / (4 * p_total)) / p_total
          )
      ) / (1 + (p_z * p_z) / p_total)
      * 100,
      3
    )
  end;
$$;

comment on function public.wilson_lower_bound(int, int, numeric) is
  'Limite inferior de Wilson em % (0-100), 80% de confiança bilateral fixo (NEG-002). NULL se total=0.';

revoke execute on function public.wilson_lower_bound(int, int, numeric) from public;
grant execute on function public.wilson_lower_bound(int, int, numeric) to authenticated;
