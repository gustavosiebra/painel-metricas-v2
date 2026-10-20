
-- Correção do peso na fila (03/08/2026): a versão anterior ligava
-- exam_disciplines pelo exam_id DO CADERNO, mas os cadernos importados do
-- índice do TEC são globais e têm exam_id nulo — resultado: peso sempre null.
-- O peso é do par (concurso do usuário × disciplina), não do caderno; então a
-- ligação correta é pela disciplina, dentro dos concursos ativos do usuário.
-- DROP + CREATE porque o tipo da coluna peso_disciplina muda (weight_level -> text).
drop view if exists public.v_fila_revisao_caderno;

create view public.v_fila_revisao_caderno
with (security_invoker = true) as
with toques as (
  select ss.user_id, ss.question_set_id,
         max(ss.occurred_at) as ultimo_estudo,
         count(distinct (ss.occurred_at at time zone 'America/Fortaleza')::date) as dias_distintos
  from study_sessions ss
  where ss.status = 'ativo'::record_status
    and ss.question_set_id is not null
    and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
  group by ss.user_id, ss.question_set_id
),
reencontro as (
  select distinct on (user_id, question_set_id)
         user_id, question_set_id, faixa, pct_acerto as reencontro_pct
  from v_retencao_caderno
  where faixa_ordem > 1 and questoes_total > 0
  order by user_id, question_set_id, faixa_ordem desc
),
pesos as (
  select ed.user_id, ed.discipline_id,
         max(case when ed.weight = 'alto' then 2 else 1 end) as peso_rank
  from exam_disciplines ed
  join exams e on e.id = ed.exam_id and e.status = 'ativo'
  group by ed.user_id, ed.discipline_id
)
select
  p.user_id, p.question_set_id, p.caderno_nome, p.discipline_id, p.disciplina_nome,
  p.questoes_total, p.wilson_pct, p.classificacao_wilson,
  p.classificacao_recorrencia, p.classificacao_prioridade, p.prioridade_rank,
  (case when pe.peso_rank = 2 then 'alto' when pe.peso_rank = 1 then 'baixo' else null end)::text as peso_disciplina,
  t.ultimo_estudo, t.dias_distintos,
  case when t.ultimo_estudo is null then null
       else (current_date - (t.ultimo_estudo at time zone 'America/Fortaleza')::date) end as dias_sem_estudar,
  r.reencontro_pct, r.faixa as reencontro_faixa
from v_prioridade_caderno p
left join toques t on t.user_id = p.user_id and t.question_set_id = p.question_set_id
left join reencontro r on r.user_id = p.user_id and r.question_set_id = p.question_set_id
left join question_sets qs on qs.id = p.question_set_id
left join pesos pe on pe.user_id = p.user_id and pe.discipline_id = p.discipline_id
where qs.status = 'ativo'
  and t.ultimo_estudo is not null;
;
