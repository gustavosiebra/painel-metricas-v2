-- 0054 — Estabilidade passa a separar ruído de oscilação real
--
-- POR QUE (27/10/2026):
-- O card "Estabilidade" mostrava o desvio padrão bruto entre sessões e
-- rotulava "Oscila muito / Oscila / Consistente" a partir dele. O número
-- estava certo e a leitura, errada.
--
-- Com sessões de 10 a 18 questões, o ACASO sozinho já produz desvio grande.
-- Acerto real de 65% em sessões de 10 questões gera, sem nenhuma mudança de
-- conhecimento, desvio padrão de 15,1 pp. De 20 questões, 10,7. De 40, 7,5.
--
-- Medido no acervo do usuário em 27/10:
--
--   disciplina             sess  DP obs  DP acaso  DP real  % que e acaso
--   Informatica             11    23,6     12,8     19,9       29%
--   AFO                     12    20,4     12,8     15,9       39%
--   Direito Administrativo  30    18,9     14,8     11,7       61%
--   Direito Constitucional   7    16,7     10,9     12,7       42%
--   Lingua Portuguesa       20    16,7     13,9      9,2       69%
--   PNFL                    20    15,5     13,1      8,3       72%
--   Controle Externo        14    15,2     14,4      4,7       90%
--   Obras Rodoviarias       14    14,5     13,7      4,8       89%
--   Edificacoes             36    10,4     13,2      0,0      100%
--   Direito Ambiental        6     9,4     13,0      0,0      100%
--   Obras Hidricas          13     8,7     12,3      0,0      100%
--
-- Em TRES disciplinas a oscilacao real e ZERO: o desvio observado e MENOR que
-- o do puro sorteio. Nao ha nada a corrigir ali — o candidato ja e tao
-- consistente quanto a amostra permite medir.
--
-- E o ranking da tela nao era o ranking da instabilidade real. Edificacoes
-- (10,4 bruto) aparecia abaixo de Obras Rodoviarias (14,5), quando a primeira
-- tem 0,0 de oscilacao real e a segunda, 4,8. O frontend passa a ordenar e
-- classificar por desvio_real.
--
-- COMO SE CALCULA: para k sessoes com n_i questoes cada e taxa geral p, a
-- variancia esperada so por acaso binomial e  p(1-p) * media(1/n_i).
-- A oscilacao real e  sqrt(max(0, DP_obs^2 - DP_acaso^2)).
-- Usa-se media(1/n_i), nao 1/media(n_i): a media harmonica e o que a
-- variancia pede, e trocar uma pela outra subestima o ruido em ~7%.
--
-- Alteracao ADITIVA: nenhuma coluna existente muda de nome ou de tipo.
-- Acrescenta desvio_acaso, desvio_real e tamanho_medio_sessao.
--
-- ATENCAO: view recriada COM (security_invoker = true) — regra 3 do README,
-- nascida do estrago da migration 0046.

drop view if exists public.v_estabilidade_disciplina;

create view public.v_estabilidade_disciplina
with (security_invoker = true) as
 WITH sess AS (
         SELECT ss.user_id, ss.discipline_id,
            100.0 * sr.correct_total::numeric / NULLIF(sr.questions_total, 0)::numeric AS pct_acerto,
            sr.questions_total, sr.correct_total
           FROM study_sessions ss
             JOIN session_results sr ON sr.session_id = ss.id
          WHERE ss.status = 'ativo'::record_status
            AND (ss.study_type = ANY (ARRAY['questao'::study_type, 'simulado'::study_type, 'prova_oficial'::study_type, 'discursiva'::study_type]))
            AND ss.discipline_id IS NOT NULL AND sr.questions_total > 0
        ), agg AS (
         SELECT s.user_id, s.discipline_id,
            count(*) AS n_sessoes,
            sum(s.questions_total) AS questoes_total,
            sum(s.correct_total) AS acertos_total,
            avg(s.pct_acerto) AS media_sessoes,
            stddev_samp(s.pct_acerto) AS desvio_padrao,
            min(s.pct_acerto) AS pior_sessao,
            max(s.pct_acerto) AS melhor_sessao,
            sum(1.0 / s.questions_total::numeric) AS soma_inv_n
           FROM sess s
          GROUP BY s.user_id, s.discipline_id
        ), calc AS (
         SELECT a.*,
            (a.acertos_total::numeric / NULLIF(a.questoes_total, 0)::numeric) AS p,
            sqrt(10000::numeric
                 * (a.acertos_total::numeric / NULLIF(a.questoes_total, 0)::numeric)
                 * (1 - a.acertos_total::numeric / NULLIF(a.questoes_total, 0)::numeric)
                 * a.soma_inv_n / a.n_sessoes::numeric) AS desvio_acaso
           FROM agg a
        )
 SELECT c.user_id, c.discipline_id, d.name AS disciplina_nome,
    c.n_sessoes, c.questoes_total,
    round(100.0 * c.acertos_total::numeric / NULLIF(c.questoes_total, 0)::numeric, 2) AS pct_acerto_geral,
    round(c.media_sessoes, 2) AS media_sessoes,
    round(c.desvio_padrao, 2) AS desvio_padrao,
    round(c.pior_sessao, 2) AS pior_sessao,
    round(c.melhor_sessao, 2) AS melhor_sessao,
    round(c.melhor_sessao - c.pior_sessao, 2) AS amplitude,
    c.n_sessoes >= 3 AS amostra_suficiente,
    round(c.desvio_acaso, 2) AS desvio_acaso,
    round(sqrt(greatest(0::numeric, c.desvio_padrao ^ 2 - c.desvio_acaso ^ 2)), 2) AS desvio_real,
    round(c.questoes_total::numeric / c.n_sessoes::numeric, 1) AS tamanho_medio_sessao
   FROM calc c
     JOIN disciplines d ON d.id = c.discipline_id;

grant select on public.v_estabilidade_disciplina to authenticated;

comment on view public.v_estabilidade_disciplina is
  'Dispersao do acerto entre sessoes da mesma disciplina. desvio_padrao e o bruto; desvio_acaso e o que o puro sorteio binomial produziria dados os tamanhos reais das sessoes; desvio_real e a parte que sobra. Ler desvio_padrao sozinho leva a erro: em sessoes de 10 questoes o acaso ja gera ~15 pp.';
