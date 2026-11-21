-- 0096 — Views sobre as 480 questoes carregadas na 0095
--
-- AUTORIZADO pelo usuario em 11/11/2026 (itens 1 a 4 do plano).
--
-- Tres views novas. Nenhuma altera nada existente.
--
-- v_simulados_por_unidade
--   Desempenho por unidade do edital a partir dos simulados, com o peso do
--   edital, as questoes esperadas na prova e o GANHO EM PONTOS.
--   O ganho e TETO TEORICO: questoes esperadas x lacuna ate 100% x 2,00 pontos.
--   Supoe que a prova siga o peso do edital e que ele chegue a 100%. Nenhuma
--   das duas premissas se realiza. Serve para ORDENAR a fila de estudo, nunca
--   para prever nota.
--   A coluna exposicao e quanto ele treinou a unidade dividido pelo que o peso
--   do edital pediria. Abaixo de 1,00 ele treina MENOS do que a prova cobra.
--   Estado em 11/11/2026: 2.5 Hidrologia em 0,09x valendo 16,0% do edital, e
--   2.1 Legislacao em 0,52x valendo outros 16,0%. As duas unidades mais pesadas
--   sao as duas menos treinadas.
--
-- v_erros_simulados
--   Os 114 erros dos simulados 1 a 12, com unidade, prova de origem, gabarito
--   e a letra marcada. Os simulados 1 a 4 (37 erros) NAO tem letra registrada
--   e nao ha fonte para recuperar — na epoca so o numero da questao era
--   reportado. Para esses, refazer a questao e o unico jeito de obter o
--   distrator, que e o que da valor ao caderno de erros.
--
-- v_erros_sem_ficha
--   Erros que ainda nao tem analise escrita em error_records.
--
--   DECISAO IMPORTANTE, registrada: eu havia proposto ao usuario despejar os
--   114 erros dentro de error_records, e ele autorizou. Abri a tabela antes de
--   executar e vi que ela e o caderno de erros MANUAL dele — causa, regra,
--   gatilho e anotacao escritos a mao, com taxonomia propria T1 a T7, 21
--   registros cuidados um a um. Despejar 114 linhas esqueleto ali destruiria
--   exatamente o que da valor a tabela: a analise que so ele pode escrever.
--   Entao NAO despejei. Os erros ficam na camada de dados (questions e
--   question_attempts, migration 0095) e esta view vira LISTA DE TRABALHO:
--   mostra o que falta fichar sem fichar no lugar dele.
--   Isso contraria o item 3 como eu mesmo o havia descrito; a mudanca foi
--   comunicada a ele.
--
-- Ao final, descarta a tabela de staging public._carga_0095 usada pela 0095.

create or replace view public.v_simulados_por_unidade as
with pesos(unidade, nome, subitens) as (values
  ('2.1','Legislacao Municipal, Urbanistica e de Edificacoes',13),
  ('2.2','Materiais e Tecnicas de Construcao',8),
  ('2.3','Estruturas',5),
  ('2.4','Geologia, Geotecnia e Mecanica dos Solos',5),
  ('2.5','Hidrologia, Drenagem e Obras de Infraestrutura',13),
  ('2.6','Saneamento e Meio Ambiente',6),
  ('2.7','Arquitetura, Urbanismo e Acessibilidade',3),
  ('2.8','Planejamento, Orcamento e Gerenciamento de Obras',5),
  ('2.9','Patologia, Qualidade e Seguranca das Obras',5),
  ('2.10','Avaliacoes, Pericias e Documentacao Tecnica',6),
  ('2.11','Licitacoes e Contratos de Obras e Servicos de Engenharia',12)
),
base as (
  select q.user_id, q.tags->>'unidade' as unidade,
         count(*)::int as questoes,
         count(*) filter (where qa.is_correct)::int as acertos
    from public.questions q
    join public.question_attempts qa on qa.question_id = q.id
   where q.tags ? 'simulado'
   group by 1,2
),
tot as (select sum(subitens)::numeric s from pesos)
select b.user_id, p.unidade, p.nome,
       b.questoes, b.acertos, (b.questoes - b.acertos) as erros,
       round(100.0*b.acertos/b.questoes, 1)                          as pct_acerto,
       round(100.0*wilson_lower_bound(b.acertos, b.questoes), 1)/100 as wilson_pct,
       round(100.0*p.subitens/t.s, 1)                                as pct_edital,
       round(30.0*p.subitens/t.s, 1)                                 as questoes_esperadas_prova,
       round(30.0*p.subitens/t.s * (1 - b.acertos::numeric/b.questoes) * 2, 1) as ganho_pontos,
       round(b.questoes / nullif(360.0*p.subitens/t.s, 0), 2)        as exposicao
  from pesos p
  cross join tot t
  left join base b on b.unidade = p.unidade;

comment on view public.v_simulados_por_unidade is
'Desempenho por unidade do edital a partir das 480 questoes de simulado (migration 0095).
ganho_pontos e teto teorico, serve para ordenar a fila e nao para prever nota.
exposicao < 1 = treinou menos do que o peso do edital pede. Ver migration 0096.';

create or replace view public.v_erros_simulados as
select q.user_id,
       (q.tags->>'simulado')::int   as simulado,
       (q.tags->>'questao')::int    as questao,
       q.tags->>'unidade'           as unidade,
       q.tags->>'prova_origem'      as prova_origem,
       q.tags->>'questao_origem'    as questao_na_prova,
       q.tags->>'gabarito'          as gabarito,
       q.tags->>'marcada'           as marcou,
       (q.tags ? 'marcada')         as tem_letra_marcada,
       qa.attempted_at::date        as feito_em,
       q.id                         as question_id,
       qa.session_id
  from public.questions q
  join public.question_attempts qa on qa.question_id = q.id
 where q.tags ? 'simulado'
   and not qa.is_correct
   and q.tags->>'unidade' <> 'ANULADA';

comment on view public.v_erros_simulados is
'Os 114 erros dos simulados 1 a 12. Os simulados 1 a 4 (37 erros) nao tem a letra
marcada registrada e nao ha fonte para recuperar: refazer essas questoes e o caminho.';

create or replace view public.v_erros_sem_ficha as
select e.*
  from public.v_erros_simulados e
 where not exists (
   select 1 from public.error_records er
    where er.user_id = e.user_id
      and er.session_id = e.session_id
      and er.status = 'aberto'
      and er.anotacao is not null);

comment on view public.v_erros_sem_ficha is
'Lista de trabalho do caderno de erros: erros de simulado ainda sem analise escrita
em error_records. NAO preenche nada — error_records e manual, com causa, regra e
gatilho escritos pelo usuario. Ver migration 0096.';

drop table if exists public._carga_0095;
