-- Fase 5 — v_prioridade recriada: Peso binário (alto/baixo) + precedência de
-- expected_questions quando o edital publica a distribuição real de questões
-- por disciplina (decisão de 01/07/2026). peso_numerico_pct = participação da
-- disciplina no total de questões conhecidas daquele concurso (só entre as
-- disciplinas que TÊM expected_questions preenchido — não dilui pelas que não
-- têm). NULL quando você não preencheu esse número ainda; nesse caso, use
-- weight (alto/baixo) como estimativa. Sem fórmula de combinação num score
-- único — a decisão de blend fica para a Fase 6 (ver 0030).
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
  (ed.expected_questions is not null) as tem_distribuicao_numerica,
  case
    when ed.expected_questions is null then null
    else round(
      100.0 * ed.expected_questions
      / nullif(sum(ed.expected_questions) filter (where ed.expected_questions is not null) over (partition by ed.user_id, ed.exam_id), 0),
      2
    )
  end as peso_numerico_pct,
  d.wilson_pct,
  d.classificacao,
  d.questoes_total
from public.exam_disciplines ed
join public.exams e on e.id = ed.exam_id
left join public.v_diagnostico_disciplina d
  on d.user_id = ed.user_id and d.discipline_id = ed.discipline_id;

comment on view public.v_prioridade is
  'Peso (alto/baixo) e, quando disponível, peso_numerico_pct (participação real no total de questões do concurso, via expected_questions) ao lado do Diagnóstico Wilson (NEG-007). peso_numerico_pct tem precedência sobre weight quando preenchido; sem fórmula de score único — decisão de combinação/ranking fica para a Fase 6.';

revoke all on public.v_prioridade from public, anon;
grant select on public.v_prioridade to authenticated;
