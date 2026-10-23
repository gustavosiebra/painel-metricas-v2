-- 0051 — exam_topics.expected_questions passa a aceitar fração
--
-- POR QUE (23/10/2026):
-- A coluna era integer. Em Curitiba o bloco de Português tem 5 questões para
-- 12 tópicos e o de Informática 5 para 14: nenhuma incidência por tópico chega
-- a 1 questão inteira. Com integer, "Interpretação de Texto" (1,26 questões
-- esperadas) viraria 1 e todo o resto viraria 0 — a informação morreria no
-- arredondamento.
--
-- Questão esperada por tópico é grandeza contínua: é o valor esperado de uma
-- variável aleatória, não uma contagem. numeric(6,2) é o tipo certo.
--
-- Recriação da view obrigatória: PostgreSQL recusa ALTER TYPE em coluna usada
-- por view. v_edital_cobertura não tem dependentes (conferido em pg_depend),
-- então drop e recreate resolve.
--
-- ATENÇÃO: a view volta COM (security_invoker = true). Em 21/10 a migration
-- 0046 recriou 15 views sem a cláusula e derrubou o RLS de todas — ver 0047 e
-- a regra 3 do README. Não repetir.

drop view if exists public.v_edital_cobertura;

alter table public.exam_topics
  alter column expected_questions type numeric(6,2);

create view public.v_edital_cobertura
with (security_invoker = true) as
 WITH vinculos AS (
         SELECT t_1.id AS topic_id, t_1.user_id, t_1.exam_id, t_1.discipline_id,
            t_1.name AS topico_nome, t_1."position", t_1.expected_questions,
            t_1.parent_id, tqs.question_set_id
           FROM exam_topics t_1
             LEFT JOIN exam_topic_question_sets tqs ON tqs.topic_id = t_1.id
        ), resultados AS (
         SELECT v.topic_id,
            count(DISTINCT v.question_set_id) AS cadernos_vinculados,
            sum(COALESCE(sr.questions_total, 0)) AS questoes,
            sum(COALESCE(sr.correct_total, 0)) AS acertos,
            max((ss.occurred_at AT TIME ZONE 'America/Fortaleza'::text)::date) AS ultimo_estudo
           FROM vinculos v
             LEFT JOIN study_sessions ss ON ss.question_set_id = v.question_set_id AND ss.user_id = v.user_id AND ss.status = 'ativo'::record_status AND (ss.study_type = ANY (ARRAY['questao'::study_type, 'simulado'::study_type, 'prova_oficial'::study_type, 'discursiva'::study_type]))
             LEFT JOIN session_results sr ON sr.session_id = ss.id
          GROUP BY v.topic_id
        )
 SELECT t.id AS topic_id, t.user_id, t.exam_id, t.discipline_id,
    d.name AS disciplina_nome, t.parent_id, t."position",
    t.name AS topico_nome, t.expected_questions,
    COALESCE(r.cadernos_vinculados, 0::bigint) AS cadernos_vinculados,
    COALESCE(r.questoes, 0::bigint) AS questoes,
    COALESCE(r.acertos, 0::bigint) AS acertos,
        CASE
            WHEN COALESCE(r.questoes, 0::bigint) = 0 THEN NULL::numeric
            ELSE wilson_lower_bound(r.acertos::integer, r.questoes::integer)
        END AS wilson_pct,
    r.ultimo_estudo,
        CASE
            WHEN COALESCE(r.cadernos_vinculados, 0::bigint) = 0 THEN 'sem_caderno'::text
            WHEN COALESCE(r.questoes, 0::bigint) = 0 THEN 'nao_estudado'::text
            WHEN COALESCE(r.questoes, 0::bigint) < get_user_param(t.user_id, 'diagnostico_min_n'::text, to_jsonb(30))::text::integer THEN 'preliminar'::text
            WHEN wilson_lower_bound(r.acertos::integer, r.questoes::integer) >= ((get_user_param(t.user_id, 'wilson_thresholds'::text, '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'consolidado'::text)::numeric) THEN 'consolidado'::text
            WHEN wilson_lower_bound(r.acertos::integer, r.questoes::integer) >= ((get_user_param(t.user_id, 'wilson_thresholds'::text, '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'atencao'::text)::numeric) THEN 'atencao'::text
            ELSE 'critico'::text
        END AS situacao
   FROM exam_topics t
     JOIN disciplines d ON d.id = t.discipline_id
     LEFT JOIN resultados r ON r.topic_id = t.id;

grant select on public.v_edital_cobertura to authenticated;

comment on column public.exam_topics.expected_questions is
  'Questoes esperadas do topico na prova. Fracionario de proposito: e valor esperado, nao contagem. Em blocos pequenos (Curitiba tem 5 questoes para 12 topicos de Portugues) nenhum topico chega a 1.';
