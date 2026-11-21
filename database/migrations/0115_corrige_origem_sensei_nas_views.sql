-- 0115 — Correcao de um erro meu na 0114: o Sensei estava contando como CADERNO
--
-- ============================================================
-- O ERRO
-- ============================================================
-- Na 0114 gravei as 40 questoes do Simulado Sensei 01 com tags.banca = 'SENSEI'
-- e tags.sensei = 1, e deliberadamente SEM tags.simulado, para que nao
-- entrassem na serie dos simulados FAFIPA nem no benchmark por prova de origem.
--
-- O que eu nao conferi: v_questoes_por_unidade e v_caderno_de_erros decidem a
-- origem com um CASE BINARIO —
--     case when q.tags ? 'simulado' then 'simulado' else 'caderno' end
-- Sem a tag 'simulado', as 40 cairam em 'caderno'. Resultado: o painel passou a
-- mostrar coisas falsas, por exemplo
--     2.6 caderno = 7 questoes  (o caderno FAFIPA nao tem NENHUMA de 2.6)
--     2.4 caderno = 4 questoes  (o caderno FAFIPA nao tem nenhuma)
--     2.11 caderno = 5 questoes (idem)
--     2.5 caderno = 7           (sao 5 do caderno + 2 do Sensei)
--     2.1 caderno = 3 linhas, uma delas com 4 questoes a 50%
--
-- Ou seja: eu separei as origens no arquivo questoes.json e no Mapa, mas NAO no
-- painel, que e a fonte de verdade. A rastreabilidade por origem — que e
-- exatamente o que o usuario pediu quando mandou nao juntar tudo (ver a
-- discussao que gerou a migration 0101) — estava quebrada desde a 0114.
--
-- Mesma familia do erro de 11/11: tratar como binario um eixo que ja tem tres
-- valores.
--
-- ============================================================
-- A CORRECAO
-- ============================================================
-- As duas views passam a derivar a origem de tres fontes, nesta ordem:
--   tags.banca = 'SENSEI'  -> 'sensei'
--   tags ? 'simulado'      -> 'simulado'
--   caso contrario         -> 'caderno'
--
-- Nenhum dado de questions ou question_attempts e alterado. So a leitura.
--
-- Valores corretos depois desta migration (CE):
--   2.1  simulado 30 | caderno 57 | sensei 4
--   2.5  simulado  5 | caderno  5 | sensei 2
--   2.6  simulado 43 | caderno  0 | sensei 7
--   2.11 simulado 58 | caderno  0 | sensei 5

create or replace view public.v_questoes_por_unidade as
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
tot as (select sum(subitens)::numeric s from pesos),
base as (
  select q.user_id,
         q.tags->>'unidade' as unidade,
         case when q.tags->>'banca' = 'SENSEI' then 'sensei'
              when q.tags ? 'simulado'         then 'simulado'
              else 'caderno' end as origem,
         (q.tags->>'legislacao_de_curitiba')::boolean as de_curitiba,
         count(*)::int as questoes,
         count(*) filter (where qa.is_correct)::int as acertos
    from public.questions q
    join public.question_attempts qa on qa.question_id = q.id
   where q.tags->>'unidade' <> 'ANULADA'
     and coalesce((q.tags->>'anulada')::boolean, false) = false
   group by 1,2,3,4
)
select b.user_id, b.unidade, p.nome, b.origem, b.de_curitiba,
       b.questoes, b.acertos, (b.questoes - b.acertos) as erros,
       round(100.0*b.acertos/b.questoes, 1) as pct_acerto,
       round(100.0*p.subitens/t.s, 1)       as pct_edital,
       round(30.0*p.subitens/t.s, 1)        as questoes_esperadas_prova
  from base b
  cross join tot t
  left join pesos p on p.unidade = b.unidade;

comment on view public.v_questoes_por_unidade is
'Desempenho por unidade do edital, com TRES origens: simulado FAFIPA, caderno FAFIPA
e sensei (outra banca, ver migration 0114). Exclui anuladas e a 071 (migration 0112).
A origem sensei foi separada na 0115; antes dela o Sensei contava como caderno.';

create or replace view public.v_caderno_de_erros as
select q.user_id,
       case when q.tags->>'banca' = 'SENSEI' then 'sensei'
            when q.tags ? 'simulado'         then 'simulado'
            else 'caderno' end                as origem,
       (q.tags->>'simulado')::int             as simulado,
       (q.tags->>'questao_caderno')::int      as questao_caderno,
       (q.tags->>'questao_sensei')::int       as questao_sensei,
       coalesce((q.tags->>'questao')::int,
                (q.tags->>'questao_caderno')::int,
                (q.tags->>'questao_sensei')::int) as questao,
       q.tags->>'unidade'                     as unidade,
       q.tags->>'prova_origem'                as prova_origem,
       q.tags->>'questao_origem'              as questao_na_prova,
       coalesce(q.tags->>'gabarito',
                q.tags->>'gabarito_determinado')  as gabarito,
       q.tags->>'marcada'                     as marcou,
       (q.tags ? 'marcada')                   as tem_letra_marcada,
       (q.tags->>'legislacao_de_curitiba')::boolean as vale_para_curitiba,
       q.tags->>'gabarito_fonte'              as gabarito_fonte,
       qa.attempted_at::date                  as feito_em,
       q.id                                   as question_id,
       qa.session_id
  from public.questions q
  join public.question_attempts qa on qa.question_id = q.id
 where not qa.is_correct
   and q.tags->>'unidade' <> 'ANULADA'
   and coalesce((q.tags->>'anulada')::boolean, false) = false;

comment on view public.v_caderno_de_erros is
'Todos os erros, com origem simulado / caderno / sensei. O gabarito do Sensei e
o determinado pela norma (tags.gabarito_determinado), NAO o oficial: a plataforma
Planeja tem o oficial e ele ainda nao foi fornecido. Ver migrations 0114 e 0115.';
