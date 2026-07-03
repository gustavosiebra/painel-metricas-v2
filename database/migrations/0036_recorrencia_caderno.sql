-- Fase 5-B — Recorrência histórica por caderno, ponderada entre as bancas
-- que o usuário efetivamente estuda (decisões de 02-03/07/2026):
--
-- 1) Bancas de referência: escopo GLOBAL — derivadas de TODAS as sessões
--    ativas do usuário (study_session_boards), não por caderno específico.
--    Reaplicadas a todo caderno, inclusive os nunca estudados — é
--    justamente aí que o sinal de prioridade mais importa.
-- 2) Banca de referência sem registro pra um caderno (sem linha em
--    historical_question_stats) entra como percentual = 0, não é excluída
--    do cálculo — captura corretamente "essa banca não cobre esse tema".
-- 3) Peso de cada banca na combinação = √(total de questões da disciplina
--    naquela banca) — pondera pelo volume de dado catalogado sem deixar a
--    banca com mais cadernos indexados dominar (ver exemplo Denotação e
--    Conotação: raw sum inflava Vunesp).
-- 4) Dispersão entre bancas = coeficiente de variação (CV = desvio padrão /
--    média), com faixas parametrizadas em user_parameters (cv_thresholds).
--    Penalização (recorrencia_ponderada / (1+CV)) só entra acima do limiar
--    "moderada" (0.40) — dentro de "estável" não há desconto.
-- 5) Classificação Alta/Média/Baixa recorrência = quartis (p25/p75) da
--    recorrência ajustada, calculados por disciplina (a escala de
--    percentual varia muito entre disciplinas — não dá pra usar corte fixo
--    universal).
--
-- Não substitui o Peso manual (exam_disciplines.weight) — é um sinal novo e
-- separado, no nível caderno/tópico, não no nível disciplina (decisão
-- explícita: usar total agregado por disciplina foi rejeitado).

create view public.v_recorrencia_caderno
with (security_invoker = true)
as
with user_boards as (
  -- Escopo global: toda banca que aparece em qualquer sessão ativa do
  -- usuário, independente de qual caderno essa sessão registrou.
  select distinct ss.user_id, ssb.board_id
  from public.study_sessions ss
  join public.study_session_boards ssb on ssb.session_id = ss.id
  where ss.status = 'ativo'
),
disciplina_banca_total as (
  -- Pool bruto por disciplina x banca (só linhas-folha), usado como peso.
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
    on hqs.board_id = ub.board_id and hqs.question_set_id = qs.id and hqs.is_leaf
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
    (public.get_user_param(r.user_id, 'cv_thresholds', '{"moderada":0.40,"banca_dependente":0.70,"fortemente_banca_dependente":1.00}'::jsonb)) as cv_thresholds,
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
  'Recorrência histórica por caderno (não por disciplina — decisão explícita), ponderada entre as bancas que o usuário estuda (escopo global, derivado de study_session_boards). Peso = √total da disciplina na banca; ausência de dado numa banca = 0%, não exclusão; dispersão via CV (parametrizado em user_parameters.cv_thresholds), penalização só acima de CV 0.40; Alta/Média/Baixa = quartis por disciplina. Sinal novo e separado do Peso manual (exam_disciplines.weight) — não o substitui.';

revoke all on public.v_recorrencia_caderno from public, anon;
grant select on public.v_recorrencia_caderno to authenticated;
