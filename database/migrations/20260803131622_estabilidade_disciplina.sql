
-- Estabilidade por DISCIPLINA (02/08/2026, decidido com o usuário).
--
-- Racional: as janelas de tendência (recente vs anterior) respondem "estou
-- subindo ou caindo", mas exigem histórico longo — com ~5 semanas de dados a
-- janela anterior fica raquítica em quase toda disciplina. O usuário pediu
-- outra coisa: identificar o que OSCILA vs o que está estável. Isso é
-- dispersão, não direção, e funciona bem com pouco histórico.
--
-- Já existia v_estabilidade_caderno (Fase 5) calculando isso por caderno, mas
-- nunca foi exposta em tela nenhuma. Esta view é a irmã por disciplina, para
-- servir de nível macro: disciplina com desvio alto e média baixa é onde há
-- mais ponto a ganhar, porque o teto já foi demonstrado numa sessão boa —
-- o problema não é capacidade, é algum subtema que despenca.
--
-- Unidade = sessão (bloco de questões), não questão individual: é a menor
-- unidade em que o registro é agregado (decisão da Fase 4).
create or replace view public.v_estabilidade_disciplina
with (security_invoker = true) as
with sess as (
  select ss.user_id, ss.discipline_id,
         100.0 * sr.correct_total::numeric / nullif(sr.questions_total, 0)::numeric as pct_acerto,
         sr.questions_total, sr.correct_total
  from study_sessions ss
  join session_results sr on sr.session_id = ss.id
  where ss.status = 'ativo'::record_status
    and ss.study_type = any (array['questao'::study_type,'simulado'::study_type,'discursiva'::study_type])
    and ss.discipline_id is not null
    and sr.questions_total > 0
)
select s.user_id, s.discipline_id, d.name as disciplina_nome,
  count(*) as n_sessoes,
  sum(s.questions_total) as questoes_total,
  round(100.0 * sum(s.correct_total)::numeric / nullif(sum(s.questions_total),0)::numeric, 2) as pct_acerto_geral,
  round(avg(s.pct_acerto), 2) as media_sessoes,
  round(stddev_samp(s.pct_acerto), 2) as desvio_padrao,
  round(min(s.pct_acerto), 2) as pior_sessao,
  round(max(s.pct_acerto), 2) as melhor_sessao,
  -- Amplitude: distância entre a melhor e a pior sessão. Mais intuitivo que
  -- desvio pra leitura rápida ("varia de 20% a 83%").
  round(max(s.pct_acerto) - min(s.pct_acerto), 2) as amplitude,
  -- Desvio só é interpretável com algumas sessões; abaixo disso é ruído.
  count(*) >= 3 as amostra_suficiente
from sess s
join disciplines d on d.id = s.discipline_id
group by s.user_id, s.discipline_id, d.name;
;
