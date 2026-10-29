-- 0064 — CORREÇÃO DE REGRESSÃO: 'prova_oficial' nas funções
--
-- O QUE QUEBREI (21/10/2026, descoberto em 29/10):
-- A migration 0045 reclassificou três sessões de 'simulado' para
-- 'prova_oficial' (TJ-CE 09/08 com 60 questões, ALECE 16/08 com 70,
-- TCE-SP 11/10 com 80). A 0046 acrescentou 'prova_oficial' ao filtro de 15
-- VIEWS — e eu conferi as 15, uma a uma.
--
-- Não conferi as FUNÇÕES. Duas filtram study_type e ficaram sem o novo valor:
--
--   media_movel_semanal  — alimenta o card "Tendência Semanal (% de acerto)"
--   eficiencia_caderno   — alimenta as métricas de acertos por hora
--
-- SINTOMA QUE O USUÁRIO VIU: a barra da semana de 10 a 16/08 desapareceu do
-- gráfico de Tendência Semanal. Sem 'prova_oficial' a RPC passou a enxergar 38
-- questões no lugar de 108, abaixo do piso de 50
-- (tendencia_semanal_min_questoes), e o painel escondeu a barra — com o rodapé
-- "semana com poucas questões", que estava errado.
--
-- EFEITO SILENCIOSO, pior que o visível: as semanas que continuaram acima do
-- piso passaram a exibir percentual MAIS ALTO do que o real, porque as provas
-- reais — as medições mais verdadeiras da série — ficaram de fora.
--
-- MEDIDO APÓS A CORREÇÃO (semanas ISO, segunda a domingo):
--
--   semana        sem prova_oficial     com prova_oficial
--   03 a 09/08    148 q · 69,59%        208 q · 65,87%
--   10 a 16/08     38 q · 65,79%        108 q · 53,70%   (barra oculta antes)
--
-- É exatamente o viés otimista que a 0046 existia para eliminar. Eliminei nas
-- views e reintroduzi pelas funções.
--
-- NOTA DE RASTREABILIDADE: o comentário registrado em
-- supabase_migrations.schema_migrations no momento da aplicação trazia, para a
-- semana de 03 a 09/08, "291 questões, 66,3%" — número que eu havia apurado
-- antes, em janela de datas diferente, e que não se confirmou na verificação
-- feita depois de aplicar. Os valores acima são os medidos. O SQL executável
-- deste arquivo é idêntico ao aplicado; só o comentário foi corrigido.
--
-- VERIFICAÇÃO FEITA: varri pg_proc inteiro atrás de rotinas que citam
-- study_type. São só estas duas. Nenhuma outra função ou procedure filtra o
-- tipo de estudo.
--
-- LIÇÃO PARA O README: quando um valor de enum entra, a varredura tem de
-- cobrir views E funções. Procurar só em pg_class deixa metade de fora.

create or replace function public.media_movel_semanal(p_discipline_id uuid default null::uuid)
 returns table(dia date, questoes integer, acertos integer, pct_acerto_dia numeric, media_movel_7d numeric)
 language sql
 stable
 set search_path to ''
as $function$
  with daily as (
    select
      ss.occurred_at::date as dia,
      sum(sr.questions_total)::int as questoes,
      sum(sr.correct_total)::int as acertos
    from public.study_sessions ss
    join public.session_results sr on sr.session_id = ss.id
    where ss.status = 'ativo'
      and ss.study_type in ('questao', 'simulado', 'prova_oficial', 'discursiva')
      and (p_discipline_id is null or ss.discipline_id = p_discipline_id)
    group by ss.occurred_at::date
  )
  select
    d.dia,
    d.questoes,
    d.acertos,
    round(100.0 * d.acertos / nullif(d.questoes, 0), 2) as pct_acerto_dia,
    round(
      avg(100.0 * d.acertos / nullif(d.questoes, 0)) over (
        order by d.dia
        range between '6 days'::interval preceding and current row
      ),
      2
    ) as media_movel_7d
  from daily d
  order by d.dia;
$function$;

create or replace function public.eficiencia_caderno(p_dias integer default null::integer)
 returns table(question_set_id uuid, caderno_nome text, discipline_id uuid, learning_level text, acertos_mensuravel integer, horas_mensuravel numeric, eficiencia_estrita numeric, horas_totais numeric, eficiencia_global numeric, questoes_total integer, produtividade_questoes_hora numeric)
 language sql
 stable
 set search_path to ''
as $function$
  with sess as (
    select
      ss.question_set_id,
      ss.study_type,
      ss.duration_minutes,
      coalesce(sr.correct_total, 0) as correct_total,
      coalesce(sr.questions_total, 0) as questions_total
    from public.study_sessions ss
    left join public.session_results sr on sr.session_id = ss.id
    where ss.status = 'ativo'
      and ss.question_set_id is not null
      and (p_dias is null or ss.occurred_at >= now() - (p_dias || ' days')::interval)
  ),
  agg as (
    select
      question_set_id,
      sum(correct_total) filter (where study_type in ('questao', 'simulado', 'prova_oficial', 'discursiva')) as acertos_mensuravel,
      sum(questions_total) filter (where study_type in ('questao', 'simulado', 'prova_oficial', 'discursiva')) as questoes_total,
      sum(duration_minutes) filter (where study_type in ('questao', 'simulado', 'prova_oficial', 'discursiva')) as minutos_mensuravel,
      sum(duration_minutes) as minutos_totais
    from sess
    group by question_set_id
  )
  select
    a.question_set_id,
    qs.name as caderno_nome,
    qs.discipline_id,
    qs.learning_level::text,
    a.acertos_mensuravel::int,
    round(a.minutos_mensuravel / 60.0, 2) as horas_mensuravel,
    round(a.acertos_mensuravel / nullif(a.minutos_mensuravel / 60.0, 0), 2) as eficiencia_estrita,
    round(a.minutos_totais / 60.0, 2) as horas_totais,
    round(a.acertos_mensuravel / nullif(a.minutos_totais / 60.0, 0), 2) as eficiencia_global,
    a.questoes_total::int,
    round(a.questoes_total / nullif(a.minutos_mensuravel / 60.0, 0), 2) as produtividade_questoes_hora
  from agg a
  join public.question_sets qs on qs.id = a.question_set_id;
$function$;
