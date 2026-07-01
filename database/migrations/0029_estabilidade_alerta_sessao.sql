-- Fase 5 — Estabilidade (desvio padrão / CV do % de acerto entre sessões) e
-- Alerta de Sessão (última sessão vs. média histórica do caderno).
-- N mínimo de sessões para Estabilidade parametrizável (default 30 — NEG-002/3.3).

create view public.v_estabilidade_caderno
with (security_invoker = true)
as
with sess as (
  select
    ss.user_id,
    ss.question_set_id,
    100.0 * sr.correct_total / nullif(sr.questions_total, 0) as pct_acerto
  from public.study_sessions ss
  join public.session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'
    and ss.study_type in ('questao', 'simulado', 'discursiva')
    and ss.question_set_id is not null
)
select
  s.user_id,
  s.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  count(*) as n_sessoes,
  round(avg(s.pct_acerto), 2) as media_pct_acerto,
  round(stddev_samp(s.pct_acerto), 2) as desvio_padrao,
  round(100.0 * stddev_samp(s.pct_acerto) / nullif(avg(s.pct_acerto), 0), 2) as coef_variacao_pct,
  (count(*) >= ((public.get_user_param(s.user_id, 'estabilidade_min_n', to_jsonb(30)))::text)::int) as amostra_suficiente
from sess s
join public.question_sets qs on qs.id = s.question_set_id
group by s.user_id, s.question_set_id, qs.name, qs.discipline_id;

comment on view public.v_estabilidade_caderno is
  'Desvio padrão e coeficiente de variação do % de acerto entre sessões, por caderno. amostra_suficiente = false quando n_sessoes < N mínimo parametrizado (default 30, erro relativo ~13% — 3.3).';

revoke all on public.v_estabilidade_caderno from public, anon;
grant select on public.v_estabilidade_caderno to authenticated;

-- Alerta de Sessão: última sessão mensurável de cada caderno vs. média das
-- sessões ANTERIORES (exclui a própria última sessão do cálculo da média, para
-- medir desvio real, não uma média que já inclui o próprio ponto).
create view public.v_alerta_sessao
with (security_invoker = true)
as
with sess as (
  select
    ss.user_id,
    ss.question_set_id,
    ss.id as session_id,
    ss.occurred_at,
    100.0 * sr.correct_total / nullif(sr.questions_total, 0) as pct_acerto
  from public.study_sessions ss
  join public.session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'
    and ss.study_type in ('questao', 'simulado', 'discursiva')
    and ss.question_set_id is not null
),
ultima as (
  select distinct on (user_id, question_set_id)
    user_id, question_set_id, session_id, occurred_at, pct_acerto
  from sess
  order by user_id, question_set_id, occurred_at desc
),
media_anterior as (
  select
    u.user_id,
    u.question_set_id,
    avg(s.pct_acerto) as media_pct_anterior,
    count(s.*) as n_sessoes_anteriores
  from ultima u
  join sess s
    on s.user_id = u.user_id
    and s.question_set_id = u.question_set_id
    and s.session_id <> u.session_id
    and s.occurred_at < u.occurred_at
  group by u.user_id, u.question_set_id
)
select
  u.user_id,
  u.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  u.occurred_at as data_ultima_sessao,
  round(u.pct_acerto, 2) as pct_ultima_sessao,
  round(m.media_pct_anterior, 2) as media_pct_anterior,
  coalesce(m.n_sessoes_anteriores, 0) as n_sessoes_anteriores,
  case
    when m.media_pct_anterior is null then null
    else round(u.pct_acerto - m.media_pct_anterior, 2)
  end as delta_pct
from ultima u
join public.question_sets qs on qs.id = u.question_set_id
left join media_anterior m on m.user_id = u.user_id and m.question_set_id = u.question_set_id;

comment on view public.v_alerta_sessao is
  'Última sessão mensurável de cada caderno vs. média das sessões anteriores no mesmo caderno. delta_pct negativo = regressão pontual. NULL quando não há sessão anterior para comparar.';

revoke all on public.v_alerta_sessao from public, anon;
grant select on public.v_alerta_sessao to authenticated;
