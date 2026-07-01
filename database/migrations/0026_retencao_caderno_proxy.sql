-- Fase 5 — Retenção por Caderno (PROXY, decisão de 01/07/2026).
-- NÃO é a métrica "Retenção" original do catálogo (3.2), que pedia acerto por
-- questão individual conforme dias desde a última vez que VOCÊ VIU AQUELA QUESTÃO.
-- Isso exige question_attempts (0 linhas, tabela não usada — registro é agregado
-- desde a Fase 4). Impossível reconstruir isso a partir de session_results.
--
-- O que esta view mede de fato: para cada sessão mensurável de um caderno, o
-- intervalo (em dias) desde a sessão ANTERIOR nesse MESMO caderno (qualquer tipo
-- conta como "toque" — revisão/flashcard/leitura/videoaula também), e o acerto
-- dessa sessão, agrupado em faixas de intervalo. Responde: "quando eu volto a
-- esse caderno depois de N dias, qual o acerto típico?" — um proxy real de
-- esquecimento no nível do caderno, não da questão.

create or replace function public.classify_gap_bucket(p_gap_dias int, p_buckets jsonb)
returns jsonb
language sql
immutable
security invoker
set search_path = ''
as $$
  select b
  from jsonb_array_elements(p_buckets) as b
  where p_gap_dias <= coalesce((b->>'max')::int, 2147483647)
  order by coalesce((b->>'max')::int, 2147483647)
  limit 1;
$$;

comment on function public.classify_gap_bucket(int, jsonb) is
  'Encontra a primeira faixa (ordenada por max crescente) que cobre p_gap_dias, dentro de um array jsonb [{"max":N,"label":"..."}]. max=null = sem teto (última faixa).';

revoke execute on function public.classify_gap_bucket(int, jsonb) from public;
grant execute on function public.classify_gap_bucket(int, jsonb) to authenticated;

create view public.v_retencao_caderno
with (security_invoker = true)
as
with toques as (
  select user_id, question_set_id, occurred_at
  from public.study_sessions
  where status = 'ativo' and question_set_id is not null
),
mensuraveis as (
  select
    ss.user_id,
    ss.question_set_id,
    ss.occurred_at,
    sr.questions_total,
    sr.correct_total,
    (
      select max(t.occurred_at)::date
      from toques t
      where t.user_id = ss.user_id
        and t.question_set_id = ss.question_set_id
        and t.occurred_at < ss.occurred_at
    ) as ultimo_toque_anterior
  from public.study_sessions ss
  join public.session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'
    and ss.study_type in ('questao', 'simulado', 'discursiva')
    and ss.question_set_id is not null
),
classificado as (
  select
    m.*,
    case
      when m.ultimo_toque_anterior is null then null
      else (m.occurred_at::date - m.ultimo_toque_anterior)
    end as gap_dias,
    case
      when m.ultimo_toque_anterior is null then '{"label":"Primeira vez neste caderno","max":null}'::jsonb
      else public.classify_gap_bucket(
        (m.occurred_at::date - m.ultimo_toque_anterior)::int,
        public.get_user_param(
          m.user_id, 'retencao_buckets',
          '[{"max":3,"label":"0-3 dias"},{"max":7,"label":"4-7 dias"},{"max":14,"label":"8-14 dias"},{"max":30,"label":"15-30 dias"},{"max":null,"label":"30+ dias"}]'::jsonb
        )
      )
    end as bucket
  from mensuraveis m
)
select
  c.user_id,
  c.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  c.bucket->>'label' as faixa,
  coalesce((c.bucket->>'max')::int, 999999) as faixa_ordem,
  count(*) as n_sessoes,
  sum(c.questions_total) as questoes_total,
  sum(c.correct_total) as acertos_total,
  round(100.0 * sum(c.correct_total) / nullif(sum(c.questions_total), 0), 2) as pct_acerto
from classificado c
join public.question_sets qs on qs.id = c.question_set_id
group by c.user_id, c.question_set_id, qs.name, qs.discipline_id, c.bucket->>'label', coalesce((c.bucket->>'max')::int, 999999);

comment on view public.v_retencao_caderno is
  'PROXY de retenção no nível do caderno (não por questão — question_attempts não é usado, Fase 4 é registro agregado). Acerto médio por faixa de dias desde o último toque no mesmo caderno.';

revoke all on public.v_retencao_caderno from public, anon;
grant select on public.v_retencao_caderno to authenticated;
