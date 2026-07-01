-- Fase 5 — Calibração de Confiança e Prioridade (NEG-007).

-- Calibração de Confiança: confiança autodeclarada da sessão mais recente de cada
-- caderno vs. classificação Wilson real desse caderno. excesso_confianca segue a
-- regra literal do catálogo: declarado "alta" e índice real "critico"/"atencao".
create view public.v_calibracao_confianca
with (security_invoker = true)
as
with ultima_confianca as (
  select distinct on (user_id, question_set_id)
    user_id, question_set_id, self_confidence, occurred_at
  from public.study_sessions
  where status = 'ativo'
    and question_set_id is not null
    and self_confidence is not null
  order by user_id, question_set_id, occurred_at desc
)
select
  uc.user_id,
  uc.question_set_id,
  qs.name as caderno_nome,
  qs.discipline_id,
  uc.self_confidence,
  uc.occurred_at as data_confianca,
  d.wilson_pct,
  d.classificacao,
  (uc.self_confidence = 'alta' and d.classificacao in ('critico', 'atencao')) as excesso_confianca
from ultima_confianca uc
join public.question_sets qs on qs.id = uc.question_set_id
left join public.v_diagnostico_caderno d
  on d.user_id = uc.user_id and d.question_set_id = uc.question_set_id;

comment on view public.v_calibracao_confianca is
  'Confiança autodeclarada (sessão mais recente do caderno) vs. Diagnóstico Wilson real. excesso_confianca = declarado "alta" com índice real "critico" ou "atencao" (regra literal do catálogo de métricas).';

revoke all on public.v_calibracao_confianca from public, anon;
grant select on public.v_calibracao_confianca to authenticated;

-- Prioridade: Peso (por edital, exam_disciplines) cruzado com Diagnóstico Wilson
-- da disciplina (NEG-007 — substitui risk_rules como risco/priorização oficial).
--
-- NOTA [PENDENTE]: o catálogo diz "Peso cruzado com Diagnóstico Wilson" mas não
-- define a FÓRMULA de combinação em um score único de ranking. Não invento essa
-- fórmula aqui — a view expõe peso e Wilson lado a lado (dado bruto, rastreável);
-- a decisão de como combinar em um número de prioridade fica para quando o
-- dashboard (Fase 6) precisar de fato ordenar uma lista por prioridade.
create view public.v_prioridade
with (security_invoker = true)
as
select
  ed.user_id,
  ed.exam_id,
  e.name as concurso_nome,
  ed.discipline_id,
  d.disciplina_nome,
  ed.weight,
  ed.target_accuracy,
  ed.expected_questions,
  d.wilson_pct,
  d.classificacao,
  d.questoes_total
from public.exam_disciplines ed
join public.exams e on e.id = ed.exam_id
left join public.v_diagnostico_disciplina d
  on d.user_id = ed.user_id and d.discipline_id = ed.discipline_id;

comment on view public.v_prioridade is
  'Peso (por edital) ao lado do Diagnóstico Wilson da disciplina (NEG-007). Dado bruto cruzado, sem fórmula de ranking única — decisão de combinação em score fica para a Fase 6.';

revoke all on public.v_prioridade from public, anon;
grant select on public.v_prioridade to authenticated;
