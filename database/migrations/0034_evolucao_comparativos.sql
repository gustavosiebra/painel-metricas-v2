-- Fase 7 — Histórico: evolução mensal (complementa a média móvel semanal da
-- Fase 5, que é diária/curto prazo) e comparativos por Banca e por Concurso.

create view public.v_evolucao_mensal
with (security_invoker = true)
as
select
  ss.user_id,
  ss.discipline_id,
  d.name as disciplina_nome,
  date_trunc('month', ss.occurred_at)::date as mes,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  round(100.0 * sum(sr.correct_total) / nullif(sum(sr.questions_total), 0), 2) as pct_acerto
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.disciplines d on d.id = ss.discipline_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
group by ss.user_id, ss.discipline_id, d.name, date_trunc('month', ss.occurred_at)::date;

comment on view public.v_evolucao_mensal is
  '% de acerto por disciplina, agregado por mês — visão de médio/longo prazo (Histórico, Fase 7), complementar à média móvel semanal (Fase 5, curto prazo).';

revoke all on public.v_evolucao_mensal from public, anon;
grant select on public.v_evolucao_mensal to authenticated;

create view public.v_comparativo_banca
with (security_invoker = true)
as
select
  ss.user_id,
  ss.board_id,
  eb.name as banca_nome,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int) as wilson_pct
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.exam_boards eb on eb.id = ss.board_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
  and ss.board_id is not null
group by ss.user_id, ss.board_id, eb.name;

comment on view public.v_comparativo_banca is
  'Wilson e volume de questões por Banca (study_sessions.board_id) — só sessões com banca informada. Histórico, Fase 7.';

revoke all on public.v_comparativo_banca from public, anon;
grant select on public.v_comparativo_banca to authenticated;

create view public.v_comparativo_concurso
with (security_invoker = true)
as
select
  ss.user_id,
  ss.exam_id,
  e.name as concurso_nome,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int) as wilson_pct
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.exams e on e.id = ss.exam_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
  and ss.exam_id is not null
group by ss.user_id, ss.exam_id, e.name;

comment on view public.v_comparativo_concurso is
  'Wilson e volume de questões por Concurso (study_sessions.exam_id) — só sessões com concurso informado. Histórico, Fase 7.';

revoke all on public.v_comparativo_concurso from public, anon;
grant select on public.v_comparativo_concurso to authenticated;
