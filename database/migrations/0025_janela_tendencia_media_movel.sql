-- Fase 5 — Janela de Tendência (últimas 100/300 questões) e Média Móvel Semanal.

-- Janela de Tendência: acumula sessões mensuráveis por disciplina, da mais recente
-- para trás, até cobrir a janela (100 ou 300 questões, parametrizável). Como não há
-- granularidade por questão (registro agregado, Fase 4), a sessão que cruza o limite
-- entra inteira — aproximação por sessão, não corte exato por questão.
create view public.v_janela_tendencia
with (security_invoker = true)
as
with base as (
  select
    ss.user_id,
    ss.discipline_id,
    ss.occurred_at,
    sr.questions_total,
    sr.correct_total
  from public.study_sessions ss
  join public.session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'
    and ss.study_type in ('questao', 'simulado', 'discursiva')
),
acumulado as (
  select
    b.*,
    sum(b.questions_total) over (
      partition by b.user_id, b.discipline_id
      order by b.occurred_at desc
      rows between unbounded preceding and 1 preceding
    ) as questoes_antes
  from base b
),
params as (
  select distinct
    user_id,
    ((public.get_user_param(user_id, 'janela_tendencia', '{"curta":100,"longa":300}'::jsonb))->>'curta')::int as janela_curta,
    ((public.get_user_param(user_id, 'janela_tendencia', '{"curta":100,"longa":300}'::jsonb))->>'longa')::int as janela_longa
  from base
)
select
  a.user_id,
  a.discipline_id,
  d.name as disciplina_nome,
  p.janela_curta,
  p.janela_longa,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta) as questoes_janela_curta,
  sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta) as acertos_janela_curta,
  round(
    100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta)
    / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta), 0),
    2
  ) as pct_janela_curta,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa) as questoes_janela_longa,
  sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa) as acertos_janela_longa,
  round(
    100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa)
    / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa), 0),
    2
  ) as pct_janela_longa
from acumulado a
join public.disciplines d on d.id = a.discipline_id
join params p on p.user_id = a.user_id
group by a.user_id, a.discipline_id, d.name, p.janela_curta, p.janela_longa;

comment on view public.v_janela_tendencia is
  'Janela de Tendência (curta/longa, default 100/300 questões via user_parameters). Aproximação por sessão inteira, não corte exato por questão — Fase 4 registra agregado, não por questão individual.';

revoke all on public.v_janela_tendencia from public, anon;
grant select on public.v_janela_tendencia to authenticated;

-- Média Móvel Semanal: função (parâmetro opcional de disciplina). 7 dias corridos,
-- mas a média divide só pelos dias com estudo dentro da janela (dias sem estudo não
-- entram como 0%, só ficam de fora do denominador).
create or replace function public.media_movel_semanal(p_discipline_id uuid default null)
returns table (
  dia date,
  questoes int,
  acertos int,
  pct_acerto_dia numeric,
  media_movel_7d numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with daily as (
    select
      ss.occurred_at::date as dia,
      sum(sr.questions_total)::int as questoes,
      sum(sr.correct_total)::int as acertos
    from public.study_sessions ss
    join public.session_results sr on sr.session_id = ss.id
    where ss.status = 'ativo'
      and ss.study_type in ('questao', 'simulado', 'discursiva')
      and (p_discipline_id is null or ss.discipline_id = p_discipline_id)
    group by ss.occurred_at::date
  )
  select
    d.dia,
    d.questoes,
    d.acertos,
    round(100.0 * d.acertos / nullif(d.questoes, 0), 2) as pct_acerto_dia,
    round(
      avg(100.0 * d.acertos / nullif(d.questoes, 0)) over (
        order by d.dia
        range between '6 days'::interval preceding and current row
      ),
      2
    ) as media_movel_7d
  from daily d
  order by d.dia;
$$;

comment on function public.media_movel_semanal(uuid) is
  'Média móvel de 7 dias corridos do % de acerto diário (RLS restringe ao usuário autenticado). Dias sem estudo não entram no cálculo (não contam como 0%).';

revoke execute on function public.media_movel_semanal(uuid) from public;
grant execute on function public.media_movel_semanal(uuid) to authenticated;
