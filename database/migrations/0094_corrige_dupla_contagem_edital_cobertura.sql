-- 0094 — Corrige a dupla contagem da v_edital_cobertura
--
-- AUTORIZADO pelo usuario em 11/11/2026, depois que ele perguntou se valia
-- implementar o Mapa de Estudo no painel. Fui olhar antes de responder e achei
-- um defeito que vale mais do que a feature pedida.
--
-- ============================================================
-- O DEFEITO
-- ============================================================
-- A view credita o caderno INTEIRO para CADA topico ao qual ele esta vinculado.
-- Um caderno ligado a tres subitens aparece tres vezes com o numero cheio.
--
-- Medido em 11/11/2026 no concurso de Curitiba:
--   caderno "Hidrologia" (28 questoes) -> vinculado a 3 topicos
--     2.5.1 Hidrologia aplicada ............. mostra 28 questoes, 14 acertos
--     2.5.2 Curvas IDF ...................... mostra 28 questoes, 14 acertos
--     2.5.3 Metodos de calculo de vazao ..... mostra 28 questoes, 14 acertos
--   caderno "Estacao de Tratamento de Esgoto" (42 q) -> 3 topicos
--   caderno "NR-18" (30 q) -> 2 topicos (Seguranca em obras e NR-18)
--   caderno de Windows/atalhos (91 q) -> 2 topicos
--
-- Sao 180 vinculos para 161 cadernos distintos. A soma da coluna "questoes"
-- da 2.384, numero que nao corresponde a questao nenhuma resolvida.
--
-- POR QUE ISSO IMPORTA MAIS DO QUE PARECE: o usuario confirmou em 11/11 que
-- ABRE O PAINEL COM FREQUENCIA para decidir o que estudar. A inflacao esta
-- concentrada justamente em Hidrologia, Drenagem, Saneamento e NR-18 — e
-- 2.5 Hidrologia vale 16,0% do edital de Curitiba e e a unidade com menor
-- exposicao medida nos simulados (0,09x). Ou seja: o painel vinha mostrando
-- cobertura tripla exatamente onde ele esta mais descoberto.
--
-- ============================================================
-- O QUE ESTA MIGRATION FAZ E O QUE NAO FAZ
-- ============================================================
-- NAO apaga vinculo nenhum. Os vinculos estao CORRETOS: o caderno de
-- Hidrologia cobre mesmo os tres subitens. O erro e de leitura, nao de dado.
--
-- NAO altera nenhuma coluna existente da view, para nao quebrar o front-end.
-- Somente ACRESCENTA colunas:
--
--   questoes_rateadas / acertos_rateados
--     o caderno e dividido pelo numero de topicos aos quais esta vinculado.
--     Somam corretamente no agregado. Pagam o preco de assumir divisao
--     igual entre os subitens, o que e um CHUTE — nao sabemos o split real.
--     Servem para somar, nao para avaliar um subitem isolado.
--
--   topicos_compartilhando
--     maior numero de topicos que dividem um mesmo caderno deste topico.
--     Quando for > 1, a coluna "questoes" esta inflada e o usuario precisa
--     saber disso ao olhar a linha.
--
--   cobertura_confiavel
--     false quando topicos_compartilhando > 1. E o sinal de leitura.
--
-- DECISAO DE PROJETO, registrada: eu poderia ter trocado "questoes" pela
-- versao rateada e resolvido de uma vez. Nao fiz porque (a) quebraria o
-- front-end sem aviso e (b) o rateio e estimativa, e substituir um numero
-- medido por um estimado sem deixar os dois visiveis e o tipo de coisa que
-- eu ja errei nesta preparacao. Ficam os dois lado a lado.

create or replace view public.v_edital_cobertura as
with vinculos as (
  select t.id as topic_id, t.user_id, t.exam_id, t.discipline_id,
         t.name as topico_nome, t."position", t.expected_questions, t.parent_id,
         tqs.question_set_id
    from public.exam_topics t
    left join public.exam_topic_question_sets tqs on tqs.topic_id = t.id
),
-- quantos topicos dividem cada caderno (dentro do mesmo concurso)
compartilhamento as (
  select tqs.question_set_id, t.exam_id, count(distinct tqs.topic_id) as n_topicos
    from public.exam_topic_question_sets tqs
    join public.exam_topics t on t.id = tqs.topic_id
   group by tqs.question_set_id, t.exam_id
),
resultados as (
  select v.topic_id,
         count(distinct v.question_set_id)                                as cadernos_vinculados,
         sum(coalesce(sr.questions_total,0))                              as questoes,
         sum(coalesce(sr.correct_total,0))                                as acertos,
         sum(coalesce(sr.questions_total,0)::numeric
             / greatest(coalesce(c.n_topicos,1),1))                       as questoes_rateadas,
         sum(coalesce(sr.correct_total,0)::numeric
             / greatest(coalesce(c.n_topicos,1),1))                       as acertos_rateados,
         max(coalesce(c.n_topicos,1))                                     as topicos_compartilhando,
         max((ss.occurred_at at time zone 'America/Fortaleza')::date)     as ultimo_estudo
    from vinculos v
    left join compartilhamento c
           on c.question_set_id = v.question_set_id and c.exam_id = v.exam_id
    left join public.study_sessions ss
           on ss.question_set_id = v.question_set_id
          and ss.user_id = v.user_id
          and ss.status = 'ativo'::record_status
          and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,
                                         'prova_oficial'::study_type,'discursiva'::study_type])
    left join public.session_results sr on sr.session_id = ss.id
   group by v.topic_id
)
select t.id as topic_id, t.user_id, t.exam_id, t.discipline_id,
       d.name as disciplina_nome, t.parent_id, t."position",
       t.name as topico_nome, t.expected_questions,
       coalesce(r.cadernos_vinculados,0::bigint) as cadernos_vinculados,
       coalesce(r.questoes,0::bigint)            as questoes,
       coalesce(r.acertos,0::bigint)             as acertos,
       case when coalesce(r.questoes,0::bigint)=0 then null::numeric
            else wilson_lower_bound(r.acertos::integer, r.questoes::integer) end as wilson_pct,
       r.ultimo_estudo,
       case
         when coalesce(r.cadernos_vinculados,0::bigint)=0 then 'sem_caderno'::text
         when coalesce(r.questoes,0::bigint)=0 then 'nao_estudado'::text
         when coalesce(r.questoes,0::bigint)
              < get_user_param(t.user_id,'diagnostico_min_n'::text,to_jsonb(30))::text::integer
              then 'preliminar'::text
         when wilson_lower_bound(r.acertos::integer, r.questoes::integer)
              >= ((get_user_param(t.user_id,'wilson_thresholds'::text,
                   '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'consolidado')::numeric)
              then 'consolidado'::text
         when wilson_lower_bound(r.acertos::integer, r.questoes::integer)
              >= ((get_user_param(t.user_id,'wilson_thresholds'::text,
                   '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'atencao')::numeric)
              then 'atencao'::text
         else 'critico'::text
       end as situacao,
       -- ---- colunas novas (0094) ----
       round(coalesce(r.questoes_rateadas,0),1)        as questoes_rateadas,
       round(coalesce(r.acertos_rateados,0),1)         as acertos_rateados,
       coalesce(r.topicos_compartilhando,1)            as topicos_compartilhando,
       (coalesce(r.topicos_compartilhando,1) <= 1)     as cobertura_confiavel
  from public.exam_topics t
  join public.disciplines d on d.id = t.discipline_id
  left join resultados r on r.topic_id = t.id;

comment on view public.v_edital_cobertura is
'Cobertura do edital por topico. ATENCAO: a coluna "questoes" credita o caderno
inteiro a cada topico vinculado; quando topicos_compartilhando > 1 ela esta
inflada e cobertura_confiavel = false. Use questoes_rateadas/acertos_rateados
para somar (rateio igual entre topicos, estimativa). Ver migration 0094.';

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid; n_infl int; soma_bruta numeric; soma_rat numeric;
begin
  select id into v_exam from public.exams
   where user_id=v_user and name='Prefeitura de Curitiba 2026';

  select count(*), sum(questoes), sum(questoes_rateadas)
    into n_infl, soma_bruta, soma_rat
    from public.v_edital_cobertura
   where exam_id=v_exam and not cobertura_confiavel;

  raise notice '0094 aplicada. Topicos com cobertura inflada: %', n_infl;
  raise notice '  soma bruta desses topicos: %   soma rateada: %', soma_bruta, soma_rat;

  if n_infl = 0 then
    raise warning 'nenhum topico marcado como inflado — conferir se o join de compartilhamento esta certo';
  end if;
end $$;
