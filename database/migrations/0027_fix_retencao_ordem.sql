-- Fase 5 — correção: "Primeira vez neste caderno" estava ordenando por último
-- (faixa_ordem=999999, mesmo valor usado para max=null das faixas normais "30+ dias").
-- Passa a ter ordem própria (-1), aparecendo antes de qualquer faixa de intervalo.
create or replace view public.v_retencao_caderno
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
bucketed as (
  select
    m.*,
    case
      when m.ultimo_toque_anterior is null then null
      else public.classify_gap_bucket(
        (m.occurred_at::date - m.ultimo_toque_anterior)::int,
        public.get_user_param(
          m.user_id, 'retencao_buckets',
          '[{"max":3,"label":"0-3 dias"},{"max":7,"label":"4-7 dias"},{"max":14,"label":"8-14 dias"},{"max":30,"label":"15-30 dias"},{"max":null,"label":"30+ dias"}]'::jsonb
        )
      )
    end as bucket_jsonb
  from mensuraveis m
),
classificado as (
  select
    b.*,
    case when b.ultimo_toque_anterior is null then 'Primeira vez neste caderno' else b.bucket_jsonb->>'label' end as faixa,
    case when b.ultimo_toque_anterior is null then -1 else coalesce((b.bucket_jsonb->>'max')::int, 999999) end as faixa_ordem
  from bucketed b
)
select
  c.user_id,
  c.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  c.faixa,
  c.faixa_ordem,
  count(*) as n_sessoes,
  sum(c.questions_total) as questoes_total,
  sum(c.correct_total) as acertos_total,
  round(100.0 * sum(c.correct_total) / nullif(sum(c.questions_total), 0), 2) as pct_acerto
from classificado c
join public.question_sets qs on qs.id = c.question_set_id
group by c.user_id, c.question_set_id, qs.name, qs.discipline_id, c.faixa, c.faixa_ordem;

comment on view public.v_retencao_caderno is
  'PROXY de retenção no nível do caderno (não por questão — question_attempts não é usado, Fase 4 é registro agregado). Acerto médio por faixa de dias desde o último toque no mesmo caderno. "Primeira vez" ordena antes de qualquer faixa de intervalo (faixa_ordem=-1).';
