-- v_edital_cobertura fixava 30/80/60 no código, enquanto v_diagnostico_caderno,
-- v_diagnostico_disciplina e v_diagnostico_geral já liam de get_user_param.
-- Resultado: mudar "mínimo de questões" em Configurações mudava a classificação
-- em todo o painel MENOS na Cobertura do Edital, que continuava exigindo 30.
-- Duas telas discordando sobre o que é "medido" é pior que o limiar errado.
-- Descoberto em 06/08/2026 ao baixar o limiar de 30 para 20 (cadernos do
-- usuário têm 20 questões, então exigir 30 obrigava a refazer questões já
-- vistas — o que infla o acerto em vez de aumentar a evidência).
DROP VIEW IF EXISTS v_edital_cobertura;

CREATE VIEW v_edital_cobertura AS
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
  LEFT JOIN study_sessions ss
    ON ss.question_set_id = v.question_set_id
   AND ss.user_id = v.user_id
   AND ss.status = 'ativo'::record_status
   AND (ss.study_type = ANY (ARRAY['questao'::study_type, 'simulado'::study_type, 'discursiva'::study_type]))
  LEFT JOIN session_results sr ON sr.session_id = ss.id
  GROUP BY v.topic_id
)
SELECT t.id AS topic_id, t.user_id, t.exam_id, t.discipline_id,
       d.name AS disciplina_nome, t.parent_id, t."position",
       t.name AS topico_nome, t.expected_questions,
       COALESCE(r.cadernos_vinculados, 0::bigint) AS cadernos_vinculados,
       COALESCE(r.questoes, 0::bigint) AS questoes,
       COALESCE(r.acertos, 0::bigint) AS acertos,
       CASE WHEN COALESCE(r.questoes, 0::bigint) = 0 THEN NULL::numeric
            ELSE wilson_lower_bound(r.acertos::integer, r.questoes::integer)
       END AS wilson_pct,
       r.ultimo_estudo,
       CASE
         WHEN COALESCE(r.cadernos_vinculados, 0::bigint) = 0 THEN 'sem_caderno'::text
         WHEN COALESCE(r.questoes, 0::bigint) = 0 THEN 'nao_estudado'::text
         WHEN COALESCE(r.questoes, 0::bigint)
              < ((get_user_param(t.user_id, 'diagnostico_min_n', to_jsonb(30)))::text)::integer
           THEN 'preliminar'::text
         WHEN wilson_lower_bound(r.acertos::integer, r.questoes::integer)
              >= ((get_user_param(t.user_id, 'wilson_thresholds', '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'consolidado'))::numeric
           THEN 'consolidado'::text
         WHEN wilson_lower_bound(r.acertos::integer, r.questoes::integer)
              >= ((get_user_param(t.user_id, 'wilson_thresholds', '{"atencao": 60, "consolidado": 80}'::jsonb) ->> 'atencao'))::numeric
           THEN 'atencao'::text
         ELSE 'critico'::text
       END AS situacao
FROM exam_topics t
JOIN disciplines d ON d.id = t.discipline_id
LEFT JOIN resultados r ON r.topic_id = t.id;;
