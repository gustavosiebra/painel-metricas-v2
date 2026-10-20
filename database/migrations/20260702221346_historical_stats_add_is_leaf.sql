-- Correção: somar quantidade em TODOS os níveis da hierarquia contava a mesma
-- questão várias vezes (nó pai já inclui a contagem dos filhos no índice do
-- TEC). is_leaf marca os nós-folha (sem subitem próprio) -- somar só esses
-- bate exatamente com o total de cada banca (validado: Cebraspe 3425, FCC
-- 1315, Vunesp 2501, FGV 2027 -- conferido direto nos arquivos originais).
alter table public.historical_question_stats add column is_leaf boolean not null default false;
create index historical_question_stats_is_leaf_idx on public.historical_question_stats (is_leaf) where is_leaf;
;
