
-- Edital estruturado + cobertura (03/08/2026).
--
-- Objetivo declarado pelo usuário: confrontar o conteúdo programático com o
-- que já estudou, pra depois montar cronograma e responder "dá tempo?".
--
-- Decisão de modelagem: o tópico do edital NÃO é o caderno. Um tópico pode
-- ser coberto por vários cadernos do TEC (ex.: "Licitações e Contratos" cai
-- em 54 cadernos) e um caderno pode servir a mais de um tópico. Daí o vínculo
-- N:N. Sem isso, ou o usuário seria forçado a reorganizar o catálogo inteiro
-- pra espelhar o edital, ou perderíamos a granularidade de diagnóstico que já
-- existe por caderno.
--
-- expected_questions é opcional de propósito: nem todo edital informa quantas
-- questões cada tópico vale (o TCE-SC/FGV só dá o total por disciplina).
-- Quando existe, entra na priorização; quando não, cai no peso da disciplina.

create table public.exam_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  discipline_id uuid references public.disciplines(id) on delete set null,
  -- Hierarquia opcional (tópico > subtópico), pra editais que numeram em
  -- níveis. Null = tópico de 1º nível.
  parent_id uuid references public.exam_topics(id) on delete cascade,
  position int not null default 0,
  name text not null,
  expected_questions int,
  notes text,
  created_at timestamptz not null default now()
);

create table public.exam_topic_question_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.exam_topics(id) on delete cascade,
  question_set_id uuid not null references public.question_sets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (topic_id, question_set_id)
);

alter table public.exam_topics enable row level security;
alter table public.exam_topic_question_sets enable row level security;

create policy exam_topics_all on public.exam_topics
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy exam_topic_qs_all on public.exam_topic_question_sets
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index exam_topics_exam_idx on public.exam_topics (exam_id, discipline_id, position);
create index exam_topic_qs_topic_idx on public.exam_topic_question_sets (topic_id);
create index exam_topic_qs_qs_idx on public.exam_topic_question_sets (question_set_id);

-- Cobertura: por tópico, o que já foi estudado nos cadernos vinculados.
-- Reusa wilson_lower_bound (mesma régua do resto do painel) pra não criar uma
-- segunda definição de "estou bem nisso".
create view public.v_edital_cobertura
with (security_invoker = true) as
with vinculos as (
  select t.id as topic_id, t.user_id, t.exam_id, t.discipline_id, t.name as topico_nome,
         t.position, t.expected_questions, t.parent_id,
         tqs.question_set_id
  from exam_topics t
  left join exam_topic_question_sets tqs on tqs.topic_id = t.id
),
resultados as (
  select v.topic_id,
         count(distinct v.question_set_id) as cadernos_vinculados,
         sum(coalesce(sr.questions_total,0)) as questoes,
         sum(coalesce(sr.correct_total,0)) as acertos,
         max((ss.occurred_at at time zone 'America/Fortaleza')::date) as ultimo_estudo
  from vinculos v
  left join study_sessions ss
    on ss.question_set_id = v.question_set_id
   and ss.user_id = v.user_id
   and ss.status = 'ativo'::record_status
   and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
  left join session_results sr on sr.session_id = ss.id
  group by v.topic_id
)
select
  t.id as topic_id, t.user_id, t.exam_id, t.discipline_id, d.name as disciplina_nome,
  t.parent_id, t.position, t.name as topico_nome, t.expected_questions,
  coalesce(r.cadernos_vinculados,0) as cadernos_vinculados,
  coalesce(r.questoes,0) as questoes,
  coalesce(r.acertos,0) as acertos,
  case when coalesce(r.questoes,0) = 0 then null
       else wilson_lower_bound(r.acertos::int, r.questoes::int) end as wilson_pct,
  r.ultimo_estudo,
  case
    when coalesce(r.cadernos_vinculados,0) = 0 then 'sem_caderno'
    when coalesce(r.questoes,0) = 0 then 'nao_estudado'
    when coalesce(r.questoes,0) < 30 then 'preliminar'
    when wilson_lower_bound(r.acertos::int, r.questoes::int) >= 80 then 'consolidado'
    when wilson_lower_bound(r.acertos::int, r.questoes::int) >= 60 then 'atencao'
    else 'critico'
  end as situacao
from exam_topics t
join disciplines d on d.id = t.discipline_id
left join resultados r on r.topic_id = t.id;
;
