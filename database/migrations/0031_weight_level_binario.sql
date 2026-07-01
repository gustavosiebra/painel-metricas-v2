-- Fase 5 — Peso passa a binário (alto/baixo), remove "medio" (decisão de 01/07/2026).
-- Justificativa: peso só serve para priorização (NEG-001), nunca para pontuação;
-- 3 níveis tendem a virar "todo mundo marca médio" (viés de tendência central).
-- Zero linhas usavam "medio" em exam_disciplines ou risk_rules — troca sem custo
-- de migração de dado. Postgres não permite remover valor de enum diretamente,
-- então o tipo é recriado. v_prioridade depende de exam_disciplines.weight —
-- precisa ser removida e recriada (aproveitado para já incluir peso_numerico_pct,
-- ver 0032).

drop view if exists public.v_prioridade;

create type weight_level_new as enum ('baixo', 'alto');

alter table public.exam_disciplines
  alter column weight type weight_level_new using weight::text::weight_level_new;

alter table public.risk_rules
  alter column weight type weight_level_new using weight::text::weight_level_new;

drop type weight_level;
alter type weight_level_new rename to weight_level;
