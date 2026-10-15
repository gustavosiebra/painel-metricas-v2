-- 0040 — Desempenho relativo: acerto dos demais usuários e dificuldade do caderno
--
-- POR QUE (15/10/2026):
-- Em 14 semanas e 2.856 questões, a taxa de acerto do usuário ficou plana.
-- Regressão ponderada: inclinação +0,33 pp/semana, erro padrão 0,41, t = 0,82,
-- IC 95% [-0,46 ; +1,13] — não distinguível de zero. Primeira metade do período
-- 65,58%, segunda metade 66,25% (z = +0,37).
--
-- Mas o número bruto não consegue separar duas explicações opostas:
--   (a) o usuário não está melhorando; ou
--   (b) está mantendo o mesmo percentual em material progressivamente mais
--       difícil — o que seria melhora, e apareceria como estagnação.
--
-- Há evidência forte de que (b) pesa: agrupando por mês, a correlação entre
-- "cadernos novos abertos no mês" e "acerto do mês" é -0,975 (n=5). Em julho,
-- 46 cadernos novos → 62,3%; em outubro, 8 novos → 74,5%. O agregado estava
-- medindo taxa de novidade, não nível.
--
-- O TEC Concursos exibe, por caderno, o acerto dos DEMAIS USUÁRIOS sobre o
-- mesmo conjunto de questões. Isso é benchmark direto, e torna o delta
-- (usuário − demais) imune à dificuldade do material.
--
-- Demonstração do ganho, com os dois primeiros cadernos medidos em 15/10:
--   Instalações Prediais ......... usuário 67%  · demais 73,4% · delta  -6,4 pp
--   Saneamento/Abastecimento ..... usuário 70%  · demais 58,4% · delta +11,6 pp
-- Os brutos (67% e 70%) sugerem "parecido, um pouco melhor no segundo".
-- O relativo mostra 18 pontos de diferença. O bruto não estava incompleto:
-- estava enganando.
--
-- DIFICULDADE: o TEC também exibe um índice próprio de "dificuldade média do
-- caderno". NÃO é a taxa de erro dos demais — nos dois cadernos acima deu 26%
-- e 30%, contra erro dos demais de 26,6% e 41,6%. Coincidiu no primeiro e
-- divergiu no segundo. Como não se sabe como o TEC o calcula, o campo é
-- registrado para acumular pares e investigar depois; nenhuma view usa.

alter table public.session_results
  add column if not exists peer_correct_pct numeric(5,2),
  add column if not exists difficulty_pct   numeric(5,2);

comment on column public.session_results.peer_correct_pct is
  'Acerto dos demais usuarios no mesmo caderno (%), lido no TEC com o seletor em "Apenas Resolvidas". Benchmark para o delta de desempenho relativo.';
comment on column public.session_results.difficulty_pct is
  'Indice de dificuldade media do caderno (%), metrica propria do TEC. NAO e a taxa de erro dos demais. Registrado para investigacao; nenhuma view consome ainda.';

alter table public.session_results
  drop constraint if exists session_results_peer_correct_pct_check,
  drop constraint if exists session_results_difficulty_pct_check;
alter table public.session_results
  add constraint session_results_peer_correct_pct_check
    check (peer_correct_pct is null or (peer_correct_pct >= 0 and peer_correct_pct <= 100)),
  add constraint session_results_difficulty_pct_check
    check (difficulty_pct is null or (difficulty_pct >= 0 and difficulty_pct <= 100));

-- ---------------------------------------------------------------------------
-- v_desempenho_relativo — uma linha por sessão que tenha benchmark.
--
-- Só entra sessão com peer_correct_pct preenchido E questions_total > 0.
-- Tipos: 'questao' e 'caderno_erros'. Simulado fica de fora de propósito —
-- simulado não tem "demais usuarios" no TEC, e misturar distorceria o delta.
-- ---------------------------------------------------------------------------
drop view if exists public.v_desempenho_relativo cascade;
create view public.v_desempenho_relativo as
select
  ss.user_id,
  ss.id                                               as session_id,
  (ss.occurred_at at time zone 'America/Fortaleza')::date as data,
  date_trunc('week', (ss.occurred_at at time zone 'America/Fortaleza'))::date as semana,
  ss.study_type,
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
  'Delta de desempenho contra os demais usuarios do TEC, por sessao. delta_pp = acerto do usuario - acerto dos demais, no mesmo caderno. Imune a dificuldade do material, ao contrario do acerto bruto.';

-- ---------------------------------------------------------------------------
-- v_desempenho_relativo_semana — agregado semanal, PONDERADO POR QUESTÕES.
--
-- A ponderação não é detalhe: um delta de +11,6 pp em 20 questões vale mais
-- que um de -6,4 pp em 9. Média simples inverteria o sinal da semana.
-- ---------------------------------------------------------------------------
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
group by user_id, semana;

comment on view public.v_desempenho_relativo_semana is
  'Delta semanal ponderado por numero de questoes. E a serie a observar no lugar do acerto bruto: se delta_pp sobe enquanto acerto_pct fica parado, houve progresso real.';

-- ---------------------------------------------------------------------------
-- v_desempenho_relativo_disciplina — onde o usuario e forte/fraco DE VERDADE.
--
-- Acerto de 50% num caderno em que todos fazem 45% nao e fraqueza.
-- Acerto de 70% onde todos fazem 85% e. A classificacao atual do painel,
-- por limiar absoluto, erra nos dois casos.
-- ---------------------------------------------------------------------------
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
group by r.user_id, r.discipline_id, d.name;

comment on view public.v_desempenho_relativo_disciplina is
  'Delta por disciplina, ponderado por questoes. Separa "assunto dificil" de "fraqueza do candidato" - distincao que o acerto bruto nao faz.';

grant select on public.v_desempenho_relativo              to authenticated;
grant select on public.v_desempenho_relativo_semana       to authenticated;
grant select on public.v_desempenho_relativo_disciplina   to authenticated;
