-- 0041 — Separa primeira passada de reencontro no desempenho relativo
--
-- POR QUE (20/10/2026):
-- A migration 0040 incluiu 'caderno_erros' no agregado do delta contra os
-- demais usuários do TEC. Foi erro de desenho, descoberto no primeiro caderno
-- de erros medido com benchmark.
--
-- No caderno de erros o usuário está na SEGUNDA passada — são questões que ele
-- já errou e já viu. Os "demais usuários" do TEC estão na PRIMEIRA. O delta
-- ali mede efeito de exposição prévia, não nível.
--
-- Tamanho do problema, medido em 20/10/2026:
--
--   Com caderno de erros ....... 356 questões · 75,00% × 65,94% = +9,06 pp
--   Só primeira passada ........ 243 questões · 70,37% × 68,74% = +1,63 pp
--   Só o caderno de erros ...... 113 questões · 84,96% × 59,90% = +25,06 pp
--
-- O caderno de erros sozinho pesava 32% do total de questões e inflava o
-- delta em +7,44 pp. Reportado assim, diria "+9 acima dos pares" quando o
-- número real é +1,6 — que, com n = 243 e erro padrão de 2,93 pp, nem sequer
-- é distinguível de zero.
--
-- A informação do caderno de erros não se perde: ela tem métrica própria e
-- correta, que é a REINCIDÊNCIA (fração dos erros que sobrevive ao reencontro
-- — 15,0% em 20/10 contra 32,3% do histórico do ciclo TCE-SP, z = 3,60).
-- Delta mede onde você está; reincidência mede se você aprende com o erro.
-- Misturar as duas fazia celebrar a coisa errada.
--
-- A view detalhada mantém as duas passadas, com a coluna `passada` para
-- distingui-las. Os agregados (semana e disciplina) filtram primeira passada.

drop view if exists public.v_desempenho_relativo cascade;
create view public.v_desempenho_relativo as
select
  ss.user_id,
  ss.id                                                   as session_id,
  (ss.occurred_at at time zone 'America/Fortaleza')::date  as data,
  date_trunc('week', (ss.occurred_at at time zone 'America/Fortaleza'))::date as semana,
  ss.study_type,
  case when ss.study_type = 'caderno_erros' then 'reencontro' else 'primeira' end as passada,
  ss.discipline_id,
  ss.question_set_id,
  ss.exam_id,
  sr.questions_total,
  sr.correct_total,
  round(100.0 * sr.correct_total / sr.questions_total, 2) as acerto_pct,
  sr.peer_correct_pct,
  sr.difficulty_pct,
  round(100.0 * sr.correct_total / sr.questions_total - sr.peer_correct_pct, 2) as delta_pp
from public.study_sessions ss
join public.session_results sr on sr.session_id = ss.id
where ss.status = 'ativo'
  and ss.study_type in ('questao', 'caderno_erros')
  and sr.questions_total > 0
  and sr.peer_correct_pct is not null;

comment on view public.v_desempenho_relativo is
  'Delta contra os demais usuarios do TEC, por sessao. ATENCAO a coluna passada: em caderno_erros o usuario esta na SEGUNDA passada (questoes que ja errou) e os demais na PRIMEIRA. O delta ali mede efeito de exposicao previa, nao superioridade, e NAO entra nos agregados.';

drop view if exists public.v_desempenho_relativo_semana cascade;
create view public.v_desempenho_relativo_semana as
select
  user_id,
  semana,
  count(*)                       as sessoes,
  sum(questions_total)           as questoes,
  sum(correct_total)             as acertos,
  round(100.0 * sum(correct_total) / sum(questions_total), 2) as acerto_pct,
  round(sum(peer_correct_pct * questions_total) / sum(questions_total), 2) as peer_pct,
  round(
    100.0 * sum(correct_total) / sum(questions_total)
    - sum(peer_correct_pct * questions_total) / sum(questions_total)
  , 2)                           as delta_pp
from public.v_desempenho_relativo
where passada = 'primeira'
group by user_id, semana;

comment on view public.v_desempenho_relativo_semana is
  'Delta semanal ponderado por questoes, SOMENTE primeira passada. Caderno de erros fica fora: incluir inflava o delta em +7,4 pp na medicao de 20/10/2026 e pesava 32% do total de questoes.';

drop view if exists public.v_desempenho_relativo_disciplina cascade;
create view public.v_desempenho_relativo_disciplina as
select
  r.user_id,
  r.discipline_id,
  d.name                         as disciplina,
  count(*)                       as sessoes,
  sum(r.questions_total)         as questoes,
  round(100.0 * sum(r.correct_total) / sum(r.questions_total), 2) as acerto_pct,
  round(sum(r.peer_correct_pct * r.questions_total) / sum(r.questions_total), 2) as peer_pct,
  round(
    100.0 * sum(r.correct_total) / sum(r.questions_total)
    - sum(r.peer_correct_pct * r.questions_total) / sum(r.questions_total)
  , 2)                           as delta_pp,
  min(r.data)                    as primeira,
  max(r.data)                    as ultima
from public.v_desempenho_relativo r
left join public.disciplines d on d.id = r.discipline_id
where r.passada = 'primeira'
group by r.user_id, r.discipline_id, d.name;

comment on view public.v_desempenho_relativo_disciplina is
  'Delta por disciplina, ponderado por questoes, somente primeira passada. Separa "assunto dificil" de "fraqueza do candidato" - distincao que o acerto bruto nao faz.';

grant select on public.v_desempenho_relativo              to authenticated;
grant select on public.v_desempenho_relativo_semana       to authenticated;
grant select on public.v_desempenho_relativo_disciplina   to authenticated;
