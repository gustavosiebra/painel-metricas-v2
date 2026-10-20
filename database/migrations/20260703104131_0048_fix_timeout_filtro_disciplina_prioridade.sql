
-- Causa raiz real do timeout na Prioridade (achada com EXPLAIN ANALYZE
-- filtrando por discipline_id): o planner subestima a seletividade do
-- filtro (espera ~3 linhas, real são 237 pra Direito Administrativo) e por
-- isso escolhe repetir a agregação cara de v_diagnostico_caderno (soma de
-- acertos/questões por caderno) uma vez PRA CADA linha do lado filtrado —
-- 237 execuções de ~40ms cada = ~9,5s. Sem filtro de disciplina a mesma
-- agregação roda 1 vez só (~46ms), por isso só falhava filtrando.
-- Fix: força as duas views de entrada a serem materializadas uma única vez
-- via CTE MATERIALIZED, ANTES do join — Postgres não pode mais escolher
-- recalcular em loop, seja qual for o filtro aplicado depois.
create or replace view public.v_prioridade_caderno
with (security_invoker = true)
as
with vr_mat as materialized (
  select * from public.v_recorrencia_caderno
),
vd_mat as materialized (
  select * from public.v_diagnostico_caderno
)
select
  vr.user_id,
  vr.question_set_id,
  vr.caderno_nome,
  vr.discipline_id,
  vr.disciplina_nome,
  vr.bancas_consideradas,
  vr.recorrencia_ajustada,
  vr.classificacao_recorrencia,
  vr.classificacao_dispersao,
  vd.questoes_total,
  vd.wilson_pct,
  coalesce(vd.classificacao, 'preliminar') as classificacao_wilson,
  case
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao') then 1
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') = 'preliminar' then 2
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') = 'consolidado' then 3
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao') then 4
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') = 'preliminar' then 5
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') = 'consolidado' then 6
    when vr.classificacao_recorrencia = 'baixa' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao', 'preliminar') then 7
    else 8
  end as prioridade_rank,
  case
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao') then 'prioridade_maxima'
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') = 'preliminar' then 'testar_logo'
    when vr.classificacao_recorrencia = 'alta' and coalesce(vd.classificacao, 'preliminar') = 'consolidado' then 'manutencao'
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao') then 'prioridade_media'
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') = 'preliminar' then 'testar_quando_puder'
    when vr.classificacao_recorrencia = 'media' and coalesce(vd.classificacao, 'preliminar') = 'consolidado' then 'manutencao_leve'
    when vr.classificacao_recorrencia = 'baixa' and coalesce(vd.classificacao, 'preliminar') in ('critico', 'atencao', 'preliminar') then 'baixa_prioridade'
    else 'nao_prioritario'
  end as classificacao_prioridade
from vr_mat vr
left join vd_mat vd
  on vd.user_id = vr.user_id and vd.question_set_id = vr.question_set_id;

comment on view public.v_prioridade_caderno is
  'Prioridade por caderno = recorrência histórica ajustada (v_recorrencia_caderno) × Diagnóstico Wilson do caderno (v_diagnostico_caderno, LEFT JOIN — cadernos nunca estudados entram como preliminar). prioridade_rank 1 (mais urgente) a 8 (menos). Matriz documentada no comentário da migration 0038; ordinal explícito, diferente de v_prioridade (disciplina) que não define score único. Entradas materializadas via CTE (fix de 03/07/2026) para impedir o planner de recalcular a agregação de v_diagnostico_caderno em loop quando um filtro externo (ex.: discipline_id) tem seletividade mal estimada.';

revoke all on public.v_prioridade_caderno from public, anon;
grant select on public.v_prioridade_caderno to authenticated;
;
