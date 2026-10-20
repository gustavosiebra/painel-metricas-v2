
-- "Licitação e Contratos Administrativos" (ad-hoc) -> "Tópicos Mesclados da
-- Lei nº 14.133/2021" (nome oficial da lei é "Lei de Licitações e Contratos
-- Administrativos" — o usuário apontou corretamente que essa correspondência
-- existe; eu tinha buscado só por "licita"/"contrat" e não por número de lei).
update public.study_sessions
set question_set_id = '7098837a-2a8b-4b60-83fc-506a3ea65476'
where question_set_id = '9a4a5950-0c09-459a-bb88-4d5b5c2896f3';

update public.question_sets set status = 'inativo'
where id = '9a4a5950-0c09-459a-bb88-4d5b5c2896f3';

-- Esqueleto inicial da Matriz de Risco (Situação x Peso). O campo "risco" usa
-- uma lógica padrão defensável (peso alto + aprendizado baixo = risco maior),
-- mas é só ponto de partida — o usuário deve revisar/ajustar cada linha.
-- O texto de "ação recomendada" é DELIBERADAMENTE um placeholder, não uma
-- recomendação real: o usuário pediu explicitamente para escrever esse texto.
insert into public.risk_rules (user_id, learning_level, weight, risk, recommended_action, active, metadata)
values
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','novo','alto','muito_alto','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','novo','baixo','medio','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','aprendendo','alto','alto','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','aprendendo','baixo','medio','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','consolidando','alto','medio','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','consolidando','baixo','baixo','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','dominado','alto','baixo','(defina sua ação recomendada)', true, '{}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','dominado','baixo','baixo','(defina sua ação recomendada)', true, '{}');
;
