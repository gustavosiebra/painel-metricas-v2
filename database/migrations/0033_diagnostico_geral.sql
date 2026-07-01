-- Fase 6 — Diagnóstico Geral: Wilson sobre a soma bruta de TODAS as disciplinas
-- do usuário (sem quebra por disciplina), para o KPI de topo do Dashboard.
-- Mesmo princípio de agregação de v_diagnostico_disciplina (3.3): soma bruta,
-- Wilson recalculado uma única vez sobre o total — não é média das disciplinas.
create view public.v_diagnostico_geral
with (security_invoker = true)
as
select
  ss.user_id,
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
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'simulado', 'discursiva')
group by ss.user_id;

comment on view public.v_diagnostico_geral is
  'Diagnóstico Wilson agregado de todas as disciplinas do usuário (soma bruta, não média) — KPI de topo do Dashboard (Fase 6).';

revoke all on public.v_diagnostico_geral from public, anon;
grant select on public.v_diagnostico_geral to authenticated;
