-- Fase 5 — Diagnóstico por Caderno e por Disciplina (índice Wilson).
-- Agregação por soma bruta (NEG-002/3.3): a Disciplina soma acertos e questões de
-- TODOS os cadernos e recalcula Wilson uma vez sobre o total — não herda
-- classificação de nenhum caderno específico.

create or replace function public.classify_diagnostico(
  p_wilson_pct numeric,
  p_n int,
  p_min_n int,
  p_limiar_consolidado numeric,
  p_limiar_atencao numeric
) returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_n is null or p_n < p_min_n then 'preliminar'
    when p_wilson_pct >= p_limiar_consolidado then 'consolidado'
    when p_wilson_pct >= p_limiar_atencao then 'atencao'
    else 'critico'
  end;
$$;

comment on function public.classify_diagnostico(numeric, int, int, numeric, numeric) is
  'Classifica o índice Wilson em preliminar (N<min_n) / critico / atencao / consolidado, conforme limiares parametrizados.';

revoke execute on function public.classify_diagnostico(numeric, int, int, numeric, numeric) from public;
grant execute on function public.classify_diagnostico(numeric, int, int, numeric, numeric) to authenticated;

-- Diagnóstico por Caderno
create view public.v_diagnostico_caderno
with (security_invoker = true)
as
select
  ss.user_id,
  ss.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int) as wilson_pct,
  public.classify_diagnostico(
    public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int),
    sum(sr.questions_total)::int,
    ((public.get_user_param(ss.user_id, 'diagnostico_min_n', to_jsonb(30)))::text)::int,
    ((public.get_user_param(ss.user_id, 'wilson_thresholds', '{"consolidado":80,"atencao":60}'::jsonb))->>'consolidado')::numeric,
    ((public.get_user_param(ss.user_id, 'wilson_thresholds', '{"consolidado":80,"atencao":60}'::jsonb))->>'atencao')::numeric
  ) as classificacao
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.question_sets qs on qs.id = ss.question_set_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
  and ss.question_set_id is not null
group by ss.user_id, ss.question_set_id, qs.name, qs.discipline_id;

comment on view public.v_diagnostico_caderno is
  'Diagnóstico Wilson por caderno, só sessões ativas (NEG-012), tipos mensuráveis.';

-- Diagnóstico por Disciplina (soma bruta de todos os cadernos + sessões sem caderno)
create view public.v_diagnostico_disciplina
with (security_invoker = true)
as
select
  ss.user_id,
  ss.discipline_id,
  d.name as disciplina_nome,
  sum(sr.questions_total)::int as questoes_total,
  sum(sr.correct_total)::int as acertos_total,
  public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int) as wilson_pct,
  public.classify_diagnostico(
    public.wilson_lower_bound(sum(sr.correct_total)::int, sum(sr.questions_total)::int),
    sum(sr.questions_total)::int,
    ((public.get_user_param(ss.user_id, 'diagnostico_min_n', to_jsonb(30)))::text)::int,
    ((public.get_user_param(ss.user_id, 'wilson_thresholds', '{"consolidado":80,"atencao":60}'::jsonb))->>'consolidado')::numeric,
    ((public.get_user_param(ss.user_id, 'wilson_thresholds', '{"consolidado":80,"atencao":60}'::jsonb))->>'atencao')::numeric
  ) as classificacao
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
join public.disciplines d on d.id = ss.discipline_id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
group by ss.user_id, ss.discipline_id, d.name;

comment on view public.v_diagnostico_disciplina is
  'Diagnóstico Wilson por disciplina, soma bruta de todos os cadernos (inclusive sessões sem caderno vinculado), só sessões ativas.';

revoke all on public.v_diagnostico_caderno from public, anon;
revoke all on public.v_diagnostico_disciplina from public, anon;
grant select on public.v_diagnostico_caderno to authenticated;
grant select on public.v_diagnostico_disciplina to authenticated;
