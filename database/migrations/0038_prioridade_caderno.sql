-- Fase 5-B (Fase 3 do plano de recorrência) — Prioridade por caderno: cruza
-- a recorrência histórica (v_recorrencia_caderno) com o Diagnóstico Wilson
-- do caderno (v_diagnostico_caderno). LEFT JOIN de propósito — cadernos
-- nunca estudados (sem linha em v_diagnostico_caderno) continuam aparecendo,
-- tratados como 'preliminar' (mesma regra de classify_diagnostico pra N<min_n),
-- porque são justamente onde esse sinal mais ajuda a decidir o que começar.
--
-- Diferente de v_prioridade (nível disciplina, Fase 5 original), aqui a
-- matriz de prioridade É um score ordinal explícito (prioridade_rank,
-- 1=mais urgente a 8=menos), não só dado bruto lado a lado — decisão
-- deliberada porque o propósito explícito deste caminho é "classificar
-- prioridade", diferente do caso de disciplina onde a fórmula de combinação
-- ficou em aberto.
--
-- Matriz (recorrência × Wilson):
--   Alta   + crítico/atenção   → 1 prioridade_maxima
--   Alta   + preliminar        → 2 testar_logo
--   Alta   + consolidado        → 3 manutencao
--   Média  + crítico/atenção   → 4 prioridade_media
--   Média  + preliminar        → 5 testar_quando_puder
--   Média  + consolidado        → 6 manutencao_leve
--   Baixa  + crítico/atenção/preliminar → 7 baixa_prioridade
--   Baixa  + consolidado        → 8 nao_prioritario

create view public.v_prioridade_caderno
with (security_invoker = true)
as
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
from public.v_recorrencia_caderno vr
left join public.v_diagnostico_caderno vd
  on vd.user_id = vr.user_id and vd.question_set_id = vr.question_set_id;

comment on view public.v_prioridade_caderno is
  'Prioridade por caderno = recorrência histórica ajustada (v_recorrencia_caderno) × Diagnóstico Wilson do caderno (v_diagnostico_caderno, LEFT JOIN — cadernos nunca estudados entram como preliminar). prioridade_rank 1 (mais urgente) a 8 (menos). Matriz documentada no comentário da migration 0038; ordinal explícito, diferente de v_prioridade (disciplina) que não define score único.';

revoke all on public.v_prioridade_caderno from public, anon;
grant select on public.v_prioridade_caderno to authenticated;
