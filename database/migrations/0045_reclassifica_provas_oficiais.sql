-- 0045 — Reclassifica como 'prova_oficial' as provas efetivamente prestadas
--
-- POR QUE (21/10/2026): complemento da 0044. Três sessões foram confirmadas
-- pelo usuário como provas prestadas, inscrito, valendo aprovação:
--
--   bdd7a5af  09/08/2026  TJ-CE    60 questões  240 min  34 acertos
--   1e62261c  16/08/2026  ALECE    70 questões  300 min  33 acertos
--   2790b3e8  11/10/2026  TCE-SP   80 questões  240 min  46 acertos
--
-- Atualização por id, nunca por data + study_type: em 20/10 um WHERE por data
-- atingiu três sessões em vez de uma e sobrescreveu dados. Não se repete.
--
-- PERMANECEM como 'simulado', por decisão explícita:
--   9ce8dfd7  13/09  1o simulado TCE-SP
--   547cc2cf  27/09  2o simulado TCE-SP
--   89b377dd  04/10  3o simulado TCE-SP
--   3e05daae  08/10  4o simulado TCE-SP
--   c69afcb2  21/10  Santos/IBAM — caderno oficial, condição de simulado
--
-- NÃO RECLASSIFICADA: cb6af21c (27/07/2026, 80 questões, 171 min, 55 acertos,
-- sem notas e sem banca). Origem não identificada; classificar sem saber seria
-- inventar. Fica como 'simulado' até o usuário confirmar o que foi.
--
-- ATENÇÃO — EFEITO COLATERAL NÃO RESOLVIDO AQUI:
-- 15 views filtram study_type in ('questao','simulado','discursiva'). Com a
-- reclassificação, as três sessões saíram de todas elas. Como nenhuma das três
-- tem disciplina nem caderno, as views por caderno/disciplina já as excluíam e
-- não mudaram; o efeito real é nas views de nível de sessão. Medido:
--   ago/2026  266q 71,1%  ->  396q 64,6%  (-6,4 pp se prova_oficial voltar)
--   out/2026  738q 71,8%  ->  818q 70,4%  (-1,4 pp)
-- Decidir se 'prova_oficial' entra nesses filtros é decisão pendente do
-- usuário e deve ir em migration própria, não de carona aqui.

update public.study_sessions
set study_type = 'prova_oficial'
where id in (
  'bdd7a5af-a75d-4439-94b5-46528627a100',
  '1e62261c-63ee-4965-aa59-f4f8ede27480',
  '2790b3e8-2ec2-420a-8f63-b01ab0e94da2'
)
and study_type = 'simulado';
