
-- Janelas de tendência DISJUNTAS (02/08/2026, decidido com o usuário).
--
-- Problema 1 — diluição: as janelas eram cumulativas (curta = últimas 100;
-- longa = últimas 300, CONTENDO as 100). Comparar uma com a outra compara o
-- recente contra uma média que já inclui o recente, então toda mudança
-- aparece menor do que é. Caso real: AFO evoluiu de 51,7% (60 questões
-- anteriores) para 72% (100 recentes) = +20 p.p., mas a tela mostrava +7,6.
-- Como "Subindo" exige >3 p.p., melhora real virava "Estável" — falso
-- negativo, que esconde progresso.
--
-- Problema 2 — escala errada no caderno: usava a mesma janela 100/300 das
-- disciplinas, mas nenhum caderno passa de 80 questões. Resultado: as duas
-- janelas eram sempre o caderno inteiro e os 44 cadernos mostravam delta
-- 0,00 — a seção "Cadernos que mais mudaram" era ruído puro. Caderno ganha
-- parâmetro próprio (janela_tendencia_caderno, padrão 20/60), coerente com
-- blocos de 20 questões.
--
-- Convenção mantida: a sessão que cruza a fronteira entra inteira na janela
-- em que começa (por isso "~100", não exatamente 100). DROP + CREATE porque
-- os nomes das colunas mudaram (curta/longa -> recente/anterior): "longa"
-- não descreve mais o que o campo contém.

drop view if exists public.v_janela_tendencia;
drop view if exists public.v_janela_tendencia_caderno;

create view public.v_janela_tendencia
with (security_invoker = true) as
with base as (
  select ss.user_id, ss.discipline_id, ss.occurred_at, sr.questions_total, sr.correct_total
  from study_sessions ss
  join session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'::record_status
    and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
), acumulado as (
  select b.*,
         sum(b.questions_total) over (
           partition by b.user_id, b.discipline_id
           order by b.occurred_at desc
           rows between unbounded preceding and 1 preceding
         ) as questoes_antes
  from base b
), params as (
  select distinct base.user_id,
    (get_user_param(base.user_id,'janela_tendencia','{"curta":100,"longa":300}'::jsonb)->>'curta')::integer as janela_recente,
    (get_user_param(base.user_id,'janela_tendencia','{"curta":100,"longa":300}'::jsonb)->>'longa')::integer as janela_limite
  from base
)
select a.user_id, a.discipline_id, d.name as disciplina_nome,
  p.janela_recente, p.janela_limite,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente) as questoes_recente,
  round(100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente)::numeric
        / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente),0)::numeric, 2) as pct_recente,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite) as questoes_anterior,
  round(100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite)::numeric
        / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite),0)::numeric, 2) as pct_anterior
from acumulado a
join disciplines d on d.id = a.discipline_id
join params p on p.user_id = a.user_id
group by a.user_id, a.discipline_id, d.name, p.janela_recente, p.janela_limite;

create view public.v_janela_tendencia_caderno
with (security_invoker = true) as
with base as (
  select ss.user_id, ss.question_set_id, ss.occurred_at, sr.questions_total, sr.correct_total
  from study_sessions ss
  join session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'::record_status
    and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
    and ss.question_set_id is not null
), acumulado as (
  select b.*,
         sum(b.questions_total) over (
           partition by b.user_id, b.question_set_id
           order by b.occurred_at desc
           rows between unbounded preceding and 1 preceding
         ) as questoes_antes
  from base b
), params as (
  select distinct base.user_id,
    (get_user_param(base.user_id,'janela_tendencia_caderno','{"curta":20,"longa":60}'::jsonb)->>'curta')::integer as janela_recente,
    (get_user_param(base.user_id,'janela_tendencia_caderno','{"curta":20,"longa":60}'::jsonb)->>'longa')::integer as janela_limite
  from base
)
select a.user_id, a.question_set_id, qs.name as caderno_nome, qs.discipline_id,
  p.janela_recente, p.janela_limite,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente) as questoes_recente,
  round(100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente)::numeric
        / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) < p.janela_recente),0)::numeric, 2) as pct_recente,
  sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite) as questoes_anterior,
  round(100.0 * sum(a.correct_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite)::numeric
        / nullif(sum(a.questions_total) filter (where coalesce(a.questoes_antes,0) >= p.janela_recente and coalesce(a.questoes_antes,0) < p.janela_limite),0)::numeric, 2) as pct_anterior
from acumulado a
join question_sets qs on qs.id = a.question_set_id
join params p on p.user_id = a.user_id
group by a.user_id, a.question_set_id, qs.name, qs.discipline_id, p.janela_recente, p.janela_limite;
;
