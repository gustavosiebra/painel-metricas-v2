
-- Dados sintéticos para o usuário testar Prioridade/Histórico/Dashboard,
-- pedido de 03/07/2026. Escopo: >1 ano (400 dias), 6 sessões/dia (1 de cada
-- study_type, exceto simulado), disciplina/banca/caderno/concurso variados,
-- Multibanca incluída. Todas as linhas marcadas com
-- metadata->>'synthetic_test_data'='true' para localizar/apagar depois com
-- 1 query (DELETE FROM study_sessions WHERE metadata->>'synthetic_test_data'
-- = 'true' — cascade cuida de session_results e study_session_boards).
-- Disciplinas usadas: as 7 já estudadas de fato (Edificações, Obras
-- Rodoviárias, Obras Hídricas, AFO, Direito Administrativo, Direito
-- Constitucional, PNFL) — não expandi para o catálogo completo de 12
-- disciplinas do concurso sem confirmar, por interpretar "disciplinas
-- estudadas" literalmente.

create temporary table tmp_base on commit drop as
with parametros as (
  select 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'::uuid as user_id
),
dias as (
  select generate_series(0, 399) as dia_idx
),
tipos_arr as (
  select array['questao','discursiva','revisao','flashcard','leitura','videoaula']::study_type[] as arr
),
base as (
  select dias.dia_idx, (tipos_arr.arr)[s.i] as study_type
  from dias cross join tipos_arr cross join generate_series(1,6) as s(i)
),
disciplinas_arr as (
  select array[
    '34982203-64ae-4486-8ee5-ce125f29993c','6cf22e19-2bd9-42a8-8517-6e8ac22f9d49',
    '910b8aaf-105a-4a84-9835-59c27ff21c6b','330621d4-0fc0-4de9-865a-7b681d34970c',
    'da477c41-15d7-42e6-977b-03523dee40f8','2a70ceba-8d02-4c5f-93fb-4eed8dfa932f',
    '0b88ae96-52c2-44e5-aadf-e6bd54d7091f'
  ]::uuid[] as arr
),
bancas_arr as (
  select array[
    '3c75d5c7-f6fe-4c10-81e3-1cadc7a85679','2d9df3ec-014c-4b2b-b0e5-e420d8088eb1',
    'd31b6398-3b78-4085-aaa4-467f54305823','5b1f4eaf-27f2-40a7-b8fc-5c76da38e353'
  ]::uuid[] as arr
),
exams_arr as (
  select array[
    '8c05d8b1-a000-45c1-ba2d-c27d051cf97f','a0ae5922-add5-4255-9e28-f4ed6dcd9479',
    'fc3a84ad-2779-4895-9963-3c3697bbadb4','0db7f1a6-75df-48ba-99f0-d0ea0c4d7b69'
  ]::uuid[] as arr
)
select
  gen_random_uuid() as session_id,
  parametros.user_id,
  base.dia_idx,
  ((current_date - interval '400 days') + (interval '1 day' * base.dia_idx) + (interval '1 hour' * (7 + floor(random()*15))))::timestamptz as occurred_at,
  case when random() < 0.8 then '8efa35c0-43bd-4106-991b-cc28f7f430bf'::uuid
       else (exams_arr.arr)[1 + floor(random()*4)::int] end as exam_id,
  (disciplinas_arr.arr)[1 + floor(random()*7)::int] as discipline_id,
  base.study_type,
  (20 + floor(random()*70))::numeric as duration_minutes,
  (array['baixa','media','media','alta']::confidence_level[])[1 + floor(random()*4)::int] as self_confidence,
  case when random() < 0.65 then 'single' else 'multi' end as modo_banca,
  (bancas_arr.arr)[1 + floor(random()*4)::int] as banca_unica_id
from base, parametros, disciplinas_arr, bancas_arr, exams_arr;

alter table tmp_base add column question_set_id uuid;
update tmp_base t set question_set_id = (
  select qs.id from public.question_sets qs
  where qs.discipline_id = t.discipline_id
    and qs.source = 'TEC Concursos - Índice de Assuntos'
    and qs.status = 'ativo'
    and exists (select 1 from public.historical_question_stats h where h.question_set_id = qs.id)
  order by random() limit 1
)
where random() < 0.85;

alter table tmp_base add column questions_total int;
update tmp_base set questions_total = (10 + floor(random()*21))::int;

alter table tmp_base add column correct_total int;
update tmp_base set correct_total = round(
  questions_total * least(0.95::numeric, greatest(0.30::numeric,
    (0.50 + 0.30*(random()-0.5) + 0.15*(dia_idx::numeric/400))::numeric
  ))
)::int;

alter table tmp_base add column wrong_total int;
update tmp_base set wrong_total = questions_total - correct_total;

alter table tmp_base add column new_questions int;
update tmp_base set new_questions = round(questions_total * (0.6+0.3*random()))::int;

alter table tmp_base add column review_questions int;
update tmp_base set review_questions = questions_total - new_questions;

-- Bancas: temp table separada pois Multibanca gera N linhas por sessão.
create temporary table tmp_bancas on commit drop as
select
  t.session_id,
  t.user_id,
  case
    when t.modo_banca = 'single' then t.banca_unica_id
    else sub.board_id
  end as board_id
from tmp_base t
left join lateral (
  select unnest(arr) as board_id
  from (
    select array(
      select x from unnest(array[
        '3c75d5c7-f6fe-4c10-81e3-1cadc7a85679','2d9df3ec-014c-4b2b-b0e5-e420d8088eb1',
        'd31b6398-3b78-4085-aaa4-467f54305823','5b1f4eaf-27f2-40a7-b8fc-5c76da38e353'
      ]::uuid[]) as x
      order by random()
      limit (2 + floor(random()*3)::int)
    ) as arr
  ) shuffled
  where t.modo_banca = 'multi'
) sub on true
where t.modo_banca = 'single' or sub.board_id is not null;

insert into public.study_sessions
  (id, user_id, occurred_at, exam_id, discipline_id, question_set_id, study_type, duration_minutes, self_confidence, notes, metadata, board_id, status)
select
  session_id, user_id, occurred_at, exam_id, discipline_id, question_set_id, study_type, duration_minutes, self_confidence,
  null,
  '{"synthetic_test_data": true}'::jsonb,
  case when modo_banca = 'single' then banca_unica_id else null end,
  'ativo'
from tmp_base;

insert into public.session_results
  (id, user_id, session_id, questions_total, correct_total, wrong_total, new_questions, review_questions, score, score_is_estimate, metadata)
select
  gen_random_uuid(), user_id, session_id, questions_total, correct_total, wrong_total, new_questions, review_questions,
  round(100.0 * correct_total / nullif(questions_total,0), 2),
  false,
  '{"synthetic_test_data": true}'::jsonb
from tmp_base;

insert into public.study_session_boards (session_id, board_id, user_id)
select session_id, board_id, user_id from tmp_bancas;
;
