-- 0046 — 'prova_oficial' entra nos filtros das views de análise
--
-- POR QUE (21/10/2026):
-- A 0044/0045 criou o tipo e reclassificou TJ-CE (09/08), ALECE (16/08) e
-- TCE-SP (11/10). Efeito colateral: as 15 views que filtram
-- study_type in ('questao','simulado','discursiva') deixaram as três de fora,
-- e o histórico passou a mostrar só a preparação, nunca o resultado real.
--
-- Efeito medido ANTES desta migration (sem provas / com provas):
--   ago/2026   266q 71,1%  ->  396q 64,6%   (-6,4 pp)
--   out/2026   738q 71,8%  ->  818q 70,4%   (-1,4 pp)
--
-- DECISÃO (usuário, 21/10/2026): entram. A prova real é o dado mais verdadeiro
-- da série. Mantê-la fora faz o painel parecer melhor do que o candidato é —
-- que é exatamente o viés já medido na calibração painel x prova real
-- (correlação ponderada r = +0,209 entre acerto no painel e desempenho por
-- bloco no TCE-SP). Esconder as três provas do histórico seria escolher não
-- enxergar esse viés.
--
-- Aplicação por CREATE OR REPLACE, não DROP CASCADE: a estrutura de colunas
-- não muda (só o WHERE), então as dependências entre views, os GRANTs e os
-- COMMENTs são preservados sem precisar recriar nada em ordem.
--
-- FORA DESTA MIGRATION, de propósito:
--   v_desempenho_relativo — filtra ('questao','caderno_erros') e compara com
--   os demais usuários do TEC. Prova oficial não tem dado de pares; incluí-la
--   geraria linha com peer_correct_pct nulo ou, pior, delta sem referente.
--
-- Sem efeito prático, mas incluídas por uniformidade da regra: as views por
-- caderno/disciplina (cobertura, fila, retenção, estabilidade, transferência).
-- As três provas não têm disciplina nem caderno, então já não apareciam lá e
-- continuam não aparecendo. A regra fica uma só em vez de duas.
--
-- VERIFICADO após a aplicação: 15 views contêm 'prova_oficial', 0 views
-- mantêm o filtro antigo, GRANTs intactos. v_comparativo_concurso voltou a
-- mostrar TJ-CE (60 questões) e ALECE (108), que haviam sumido.

do $$
declare
  v record;
  antigo constant text :=
    'study_type = ANY (ARRAY[''questao''::study_type, ''simulado''::study_type, ''discursiva''::study_type])';
  novo constant text :=
    'study_type = ANY (ARRAY[''questao''::study_type, ''simulado''::study_type, ''prova_oficial''::study_type, ''discursiva''::study_type])';
  corpo text;
  n int := 0;
begin
  for v in
    select c.oid, c.relname
    from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname = 'public' and c.relkind = 'v'
      and position(antigo in pg_get_viewdef(c.oid)) > 0
    order by c.relname
  loop
    corpo := pg_get_viewdef(v.oid);
    corpo := replace(corpo, antigo, novo);
    corpo := rtrim(btrim(corpo), ';');
    execute format('create or replace view public.%I as %s', v.relname, corpo);
    n := n + 1;
    raise notice 'view % atualizada', v.relname;
  end loop;

  if n <> 15 then
    raise exception 'Esperadas 15 views, atualizadas %. Abortado.', n;
  end if;
  raise notice 'Total: % views atualizadas', n;
end $$;
