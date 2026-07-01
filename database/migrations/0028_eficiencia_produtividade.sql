-- Fase 5 — Eficiência (Estrita/Global) e Produtividade, por caderno.
-- p_dias = janela temporal em dias (null = todo o histórico).
--
-- NOTA [PENDENTE]: o catálogo de métricas diz que Eficiência Global "só é alerta
-- se Situação já for Consolidando/Dominado", mas não define o limiar numérico do
-- que conta como "baixa" eficiência. Não invento esse corte aqui — a função expõe
-- os números (estrita, global, learning_level) para quem consumir decidir a regra
-- de alerta na Fase 6 (dashboard), quando o limiar puder ser parametrizado de
-- verdade (NEG-005), em vez de um número mágico decidido agora sem justificativa.
create or replace function public.eficiencia_caderno(p_dias int default null)
returns table (
  question_set_id uuid,
  caderno_nome text,
  discipline_id uuid,
  learning_level text,
  acertos_mensuravel int,
  horas_mensuravel numeric,
  eficiencia_estrita numeric,
  horas_totais numeric,
  eficiencia_global numeric,
  questoes_total int,
  produtividade_questoes_hora numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
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
      sum(correct_total) filter (where study_type in ('questao', 'simulado', 'discursiva')) as acertos_mensuravel,
      sum(questions_total) filter (where study_type in ('questao', 'simulado', 'discursiva')) as questoes_total,
      sum(duration_minutes) filter (where study_type in ('questao', 'simulado', 'discursiva')) as minutos_mensuravel,
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
$$;

comment on function public.eficiencia_caderno(int) is
  'Eficiência Estrita (acertos/hora mensurável), Eficiência Global (acertos/hora total, inclui revisão/flashcard/leitura/videoaula) e Produtividade (questões/hora), por caderno. p_dias=null usa todo o histórico. RLS restringe ao usuário autenticado.';

revoke execute on function public.eficiencia_caderno(int) from public;
grant execute on function public.eficiencia_caderno(int) to authenticated;
