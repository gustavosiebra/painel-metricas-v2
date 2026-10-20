
-- Resposta à pergunta do usuário sobre os 4 cadernos-pai com recorrência
-- zerada (Estruturas de Concreto, Estruturas de Concreto Armado,
-- Especificações de Materiais (Obras Rodoviárias), Planejamento e Controle
-- de Obras): no import TEC eles só têm linha is_leaf=false (0 filhos
-- is_leaf=true importados sob eles), e a view excluía toda linha não-leaf
-- por padrão — para não contar duas vezes quando pai E filho existem.
-- Fix: só ignora a linha não-leaf quando existe uma linha is_leaf=true real
-- para o MESMO (question_set_id, board_id). Quando não existe filha leaf
-- nenhuma, a própria linha não-leaf passa a ser usada (não há risco de
-- dupla contagem, pois não há filha para somar).
create or replace view public.v_recorrencia_caderno
with (security_invoker = true)
as
with user_boards as (
  select distinct ss.user_id, ssb.board_id
  from public.study_sessions ss
  join public.study_session_boards ssb on ssb.session_id = ss.id
  join public.exam_boards eb on eb.id = ssb.board_id
  where ss.status = 'ativo'
    and eb.name <> 'Multibanca'
),
disciplina_banca_total as (
  select qs.discipline_id, hqs.board_id, sum(hqs.quantidade) as total_quantidade
  from public.historical_question_stats hqs
  join public.question_sets qs on qs.id = hqs.question_set_id
  where hqs.is_leaf
  group by qs.discipline_id, hqs.board_id
),
user_caderno_banca as (
  select
    ub.user_id,
    qs.id as question_set_id,
    qs.discipline_id,
    ub.board_id,
    eb.name as board_name,
    coalesce(hqs.percentual, 0) as percentual,
    coalesce(dbt.total_quantidade, 0) as total_disciplina_banca
  from user_boards ub
  join public.exam_boards eb on eb.id = ub.board_id
  cross join public.question_sets qs
  left join public.historical_question_stats hqs
    on hqs.board_id = ub.board_id and hqs.question_set_id = qs.id
    and (
      hqs.is_leaf
      or not exists (
        select 1 from public.historical_question_stats hqs2
        where hqs2.board_id = hqs.board_id and hqs2.question_set_id = hqs.question_set_id and hqs2.is_leaf
      )
    )
  left join disciplina_banca_total dbt
    on dbt.discipline_id = qs.discipline_id and dbt.board_id = ub.board_id
  where qs.status = 'ativo'
),
recorrencia_bruta as (
  select
    user_id,
    question_set_id,
    discipline_id,
    array_agg(distinct board_name order by board_name) as bancas_consideradas,
    count(*) as n_bancas,
    sum(percentual * sqrt(total_disciplina_banca)) / nullif(sum(sqrt(total_disciplina_banca)), 0) as recorrencia_ponderada,
    case when avg(percentual) = 0 then null
         else stddev_pop(percentual) / avg(percentual)
    end as cv
  from user_caderno_banca
  group by user_id, question_set_id, discipline_id
),
com_classificacao_dispersao as (
  select
    r.*,
    case
      when r.cv is null then 'sem_dispersao'
      when r.cv <= (public.get_user_param(r.user_id, 'cv_thresholds', '{"moderada":0.40,"banca_dependente":0.70,"fortemente_banca_dependente":1.00}'::jsonb)->>'moderada')::numeric then 'estavel'
      when r.cv <= (public.get_user_param(r.user_id, 'cv_thresholds', '{"moderada":0.40,"banca_dependente":0.70,"fortemente_banca_dependente":1.00}'::jsonb)->>'banca_dependente')::numeric then 'moderada'
      when r.cv <= (public.get_user_param(r.user_id, 'cv_thresholds', '{"moderada":0.40,"banca_dependente":0.70,"fortemente_banca_dependente":1.00}'::jsonb)->>'fortemente_banca_dependente')::numeric then 'banca_dependente'
      else 'fortemente_banca_dependente'
    end as classificacao_dispersao,
    case
      when r.cv is null or r.cv <= (public.get_user_param(r.user_id, 'cv_thresholds', '{"moderada":0.40,"banca_dependente":0.70,"fortemente_banca_dependente":1.00}'::jsonb)->>'moderada')::numeric
        then r.recorrencia_ponderada
      else r.recorrencia_ponderada / (1 + r.cv)
    end as recorrencia_ajustada
  from recorrencia_bruta r
),
disciplina_percentis as (
  select
    user_id, discipline_id,
    percentile_cont(0.25) within group (order by recorrencia_ajustada) as p25,
    percentile_cont(0.75) within group (order by recorrencia_ajustada) as p75
  from com_classificacao_dispersao
  group by user_id, discipline_id
)
select
  c.user_id,
  c.question_set_id,
  qs.name as caderno_nome,
  c.discipline_id,
  d.name as disciplina_nome,
  c.bancas_consideradas,
  c.n_bancas,
  round(c.recorrencia_ponderada::numeric, 4) as recorrencia_ponderada,
  round(c.cv::numeric, 4) as cv,
  c.classificacao_dispersao,
  round(c.recorrencia_ajustada::numeric, 4) as recorrencia_ajustada,
  case
    when c.recorrencia_ajustada >= dp.p75 then 'alta'
    when c.recorrencia_ajustada <= dp.p25 then 'baixa'
    else 'media'
  end as classificacao_recorrencia
from com_classificacao_dispersao c
join disciplina_percentis dp on dp.user_id = c.user_id and dp.discipline_id = c.discipline_id
join public.question_sets qs on qs.id = c.question_set_id
join public.disciplines d on d.id = c.discipline_id;

comment on view public.v_recorrencia_caderno is
  'Recorrência histórica por caderno (não por disciplina — decisão explícita), ponderada entre as bancas que o usuário estuda (escopo global, derivado de study_session_boards, excluindo a entrada de catálogo "Multibanca" que é só gatilho de UI). Peso = √total da disciplina na banca; ausência de dado numa banca = 0%, não exclusão; dispersão via CV (parametrizado em user_parameters.cv_thresholds), penalização só acima de CV 0.40; Alta/Média/Baixa = quartis por disciplina. Cadernos sem nenhuma linha is_leaf=true própria usam a linha is_leaf=false diretamente (sem risco de dupla contagem, pois não há filha leaf para somar) — fix de 03/07/2026. Sinal novo e separado do Peso manual (exam_disciplines.weight) — não o substitui.';

revoke all on public.v_recorrencia_caderno from public, anon;
grant select on public.v_recorrencia_caderno to authenticated;
;
