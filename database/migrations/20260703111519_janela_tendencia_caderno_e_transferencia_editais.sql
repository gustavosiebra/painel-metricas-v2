-- Fase 6-C — duas novas views pra responder perguntas concretas do usuário
-- (03/07/2026) que não tinham sinal nenhum hoje:
--   1) "quais cadernos ganharam ou perderam desempenho real" — mesma lógica
--      de v_janela_tendencia (0025, curta/longa em nº de questões), só que
--      particionada por caderno em vez de por disciplina. Reaproveita a
--      abordagem já validada, não é método novo.
--   2) "estou transferindo aprendizado pra editais diferentes?" — cruza o
--      MESMO caderno (question_set_id) através de exam_id diferentes.
--      question_sets pode ser reaproveitado entre concursos (schema já
--      previa isso desde a Fase 1); esta view só nunca tinha sido escrita.

create view public.v_janela_tendencia_caderno
with (security_invoker = true)
as
with base as (
  select
    ss.user_id,
    ss.question_set_id,
    ss.occurred_at,
    sr.questions_total,
    sr.correct_total
  from public.study_sessions ss
  join public.session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'
    and ss.study_type in ('questao', 'simulado', 'discursiva')
    and ss.question_set_id is not null
),
acumulado as (
  select
    b.*,
    sum(b.questions_total) over (
      partition by b.user_id, b.question_set_id
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
  a.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  p.janela_curta,
  p.janela_longa,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta) as questoes_janela_curta,
  round(
    100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta)
    / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_curta), 0),
    2
  ) as pct_janela_curta,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa) as questoes_janela_longa,
  round(
    100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa)
    / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes, 0) < p.janela_longa), 0),
    2
  ) as pct_janela_longa
from acumulado a
join public.question_sets qs on qs.id = a.question_set_id
join params p on p.user_id = a.user_id
group by a.user_id, a.question_set_id, qs.name, qs.discipline_id, p.janela_curta, p.janela_longa;

comment on view public.v_janela_tendencia_caderno is
  'Janela de Tendência (curta/longa, default 100/300 questões) por CADERNO — mesma lógica de v_janela_tendencia (0025), granularidade mais fina. Aproximação por sessão inteira (Fase 4 é registro agregado).';

revoke all on public.v_janela_tendencia_caderno from public, anon;
grant select on public.v_janela_tendencia_caderno to authenticated;

create view public.v_transferencia_caderno
with (security_invoker = true)
as
select
  ss.user_id,
  ss.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  ss.exam_id,
  e.name as concurso_nome,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int) as wilson_pct
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.question_sets qs on qs.id = ss.question_set_id
join public.exams e on e.id = ss.exam_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
  and ss.question_set_id is not null
  and ss.exam_id is not null
group by ss.user_id, ss.question_set_id, qs.name, qs.discipline_id, ss.exam_id, e.name;

comment on view public.v_transferencia_caderno is
  'Wilson e volume por (caderno x concurso) — permite comparar o desempenho do MESMO caderno quando ele é reaproveitado em concursos diferentes (transferência de aprendizado entre editais). Só cadernos com >=2 concursos distintos têm sinal de transferência de fato; com 1 só, não há o que comparar.';

revoke all on public.v_transferencia_caderno from public, anon;
grant select on public.v_transferencia_caderno to authenticated;
;
