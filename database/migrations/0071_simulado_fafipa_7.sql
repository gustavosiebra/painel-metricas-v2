-- 0071 — Simulado FAFIPA nº 7, 01/11/2026
--
-- RESULTADO: 28/40 = 70,0%. Ponderado 56 de 80 pontos.
-- TEMPO: 68 min de 240.
-- BLOCOS: Portugues 4/5 · Informatica 4/5 · Especificas 20/30.
--
-- SEM PENDENCIA DE TRANSCRICAO: as 12 letras informadas divergem todas do
-- gabarito. Primeira vez em quatro simulados.
--
-- SERIE DOS SETE:
--   #1  26/10  55 min  30/40  60 pts
--   #2  27/10  70 min  31/40  62 pts
--   #3  28/10  75 min  31/40  62 pts
--   #4  29/10  66 min  31/40  62 pts
--   #5  30/10  60 min  32/40  64 pts
--   #6  31/10  65 min  28/40  56 pts
--   #7  01/11  68 min  28/40  56 pts
--
-- ACUMULADO: LP 27/35 (77,1%) · INF 29/35 (82,9%) · CE 155/210 (73,8%)
--            TOTAL 211/280 = 75,36%
--
-- LEITURA ESTATISTICA — O SINAL MUDOU DE FORCA:
-- 28/40 contra os 183/240 anteriores: z = -0,81. Isolado, nao e significativo.
-- Mas agora sao DOIS 28 seguidos depois de cinco entre 30 e 32.
--   primeiros 5 ... 155/200 = 77,5%
--   ultimos   2 ...  56/80  = 70,0%
--   delta -7,5 pp ... z = -1,27 ... p = 0,20
-- Ainda dentro do ruido, mas e o sinal mais forte de queda da serie. O desvio
-- sobe para 1,57 questao; o acaso binomial a 75,4% em 40 questoes vale 2,73,
-- entao a serie segue mais estavel que o acaso. Tratar como patamar ~30 +/- 2
-- com dois pontos baixos, nao como queda confirmada.
--
-- ERROS (questao · gabarito · marcou · norma · item do edital):
-- 05 · B · C · Figuras de linguagem: anafora, metafora, eufemismo   · 1.1.12
-- 08 · D · E · Google Drive: permissoes de Editor                   · 1.2.11
-- 15 · A · C · NR-18: emendas em rede de protecao, proibida
--              sobreposicao, mantidas as caracteristicas originais  · 2.9.4
-- 17 · B · A · NBR 12218: rede de agua SEMPRE acima da de esgoto    · 2.6.1
-- 19 · A->D· NBR 6122: carga admissivel sai da CARGA DE RUPTURA     · 2.4.4
-- 23 · C · E · Lei 11.445/2007: solucoes individuais conforme
--              normas da entidade reguladora e orgaos competentes   · 2.6.1
-- 24 · D · B · Lei 14.133/2021, art. 145: antecipacao de pagamento
--              exige justificativa previa e previsao no instrumento,
--              so com sensivel economia ou condicao indispensavel   · 2.11.1
-- 26 · D · E · NBR 8160: BARRILETE DE VENTILACAO                    · 2.2.2
-- 29 · D · E · NBR 9575: declividade minima 1% em areas horizontais
--              (a assertiva dizia 5%); 0,5% em calhas e internas    · 2.2.8
-- 36 · C · D · NBR 6122: o solo e elemento NAO resistente a tracao  · 2.4.4
-- 37 · A · E · NBR 15575: fissuras ATIVAS variam com movimentacao
--              higrotermica; PASSIVAS tem abertura constante        · 2.9.1
-- 38 · E · D · Lei 14.133/2021, art. 25, par. 5: uso de mao de obra
--              e materiais locais desde que NAO prejudique a
--              competitividade e a eficiencia do contrato           · 2.11.1
--
-- ADERENCIA AO EDITAL: as 40 questoes estao no conteudo programatico.
--
-- ZERO ERROS DE RACIOCINIO. Os 12 sao recall de norma, definicao ou
-- nomenclatura. O erro de interpretacao da Q01 do simulado 6 fica como ponto
-- isolado: 1 em 280 questoes. O diagnostico original volta a valer em cheio —
-- o teto e estoque de informacao, nao capacidade.
--
-- SANEAMENTO: TRES erros de novo (Q17, Q23, Q26). Dez na serie, disparado a
-- pior disciplina. Mas o detalhe importa:
--   ele REVISOU ETE / NBR 12209 por 25 min hoje, antes do simulado
--   e as tres que errou NAO SAO DE ETE:
--     Q17 rede de distribuicao de agua ... NBR 12218
--     Q23 solucoes individuais de abastecimento ... Lei 11.445
--     Q26 ventilacao de esgoto predial ... NBR 8160
--   A unica de saneamento que acertou foi a Q11.
-- Ou seja: estudou a disciplina certa e o sub-topico errado. Saneamento no
-- edital sao os itens 2.6.1 a 2.6.6 mais a drenagem em 2.5.1 a 2.5.10 — ETE e
-- apenas o 2.6.2.
--
-- CONTRAPROVA DA DOSE, no mesmo simulado:
--   ele LEU a NBR 14653 por 29 min hoje
--   cairam QUATRO questoes de avaliacoes e pericias (Q18, Q20, Q21, Q33)
--   acertou AS QUATRO
--   e tinha errado exatamente NBR 14653 no simulado 6 (Q39)
-- Terceiro caso do padrao: estudou com dose suficiente, parou de errar.
--
-- FUNDACOES virou fraqueza nova: DOIS erros (Q19 e Q36), ambos NBR 6122.
-- NR-18 errada pelo terceiro simulado seguido contando o #6 (que teve dois).

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_tpl  uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';
  v_board uuid; v_sess uuid; v_att uuid;
begin
  select id into v_board from public.exam_boards where name = 'Fundação FAFIPA';
  if exists (select 1 from public.study_sessions
             where user_id=v_user and study_type='simulado'
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-11-01') then
    raise notice 'simulado de 01/11 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-11-01 16:00:00-03', 'simulado', 68, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 7 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 28/40 = 70,0%. Ponderado 56/80 (corte 48). Tempo: 68 de 240 min.
BLOCOS: Portugues 4/5 · Informatica 4/5 · Especificas 20/30.
SERIE: #1 30 · #2 31 · #3 31 · #4 31 · #5 32 · #6 28 · #7 28.
ACUMULADO: LP 27/35 (77,1%) · INF 29/35 (82,9%) · CE 155/210 (73,8%) · TOTAL 211/280 (75,36%).
SEM PENDENCIA DE TRANSCRICAO — as 12 letras divergem todas do gabarito. Primeira vez em 4 simulados.
LEITURA ESTATISTICA: 28 isolado nao e queda (z = -0,81). Mas sao DOIS 28 seguidos depois de cinco
entre 30 e 32: primeiros 5 = 77,5%, ultimos 2 = 70,0%, delta -7,5 pp, z = -1,27, p = 0,20. Ainda
dentro do ruido, porem e o sinal mais forte da serie. Patamar segue ~30 +/- 2 com dois pontos baixos.
ERROS (questao · gabarito · marcou · norma · item do edital):
05 · B · C · Figuras de linguagem: anafora, metafora, eufemismo · 1.1.12
08 · D · E · Google Drive: o que um Editor pode fazer · 1.2.11
15 · A · C · NR-18: emendas em rede de protecao, PROIBIDA sobreposicao · 2.9.4
17 · B · A · NBR 12218: rede de agua SEMPRE em nivel superior a de esgoto · 2.6.1
19 · D · A · NBR 6122: carga admissivel determinada a partir da CARGA DE RUPTURA · 2.4.4
23 · C · E · Lei 11.445/2007: solucoes individuais conforme a entidade reguladora · 2.6.1
24 · D · B · Lei 14.133/2021 art. 145: antecipacao exige justificativa previa e previsao no
             instrumento, so com sensivel economia ou condicao indispensavel · 2.11.1
26 · D · E · NBR 8160: BARRILETE DE VENTILACAO · 2.2.2
29 · D · E · NBR 9575: declividade minima 1% em areas horizontais (assertiva dizia 5%) e 0,5% em
             calhas e areas internas · 2.2.8
36 · C · D · NBR 6122: solo e elemento NAO resistente a tracao · 2.4.4
37 · A · E · NBR 15575: fissuras ATIVAS variam com movimentacao higrotermica, PASSIVAS nao · 2.9.1
38 · E · D · Lei 14.133/2021 art. 25 par. 5: mao de obra e materiais locais desde que NAO
             prejudiquem a competitividade e a eficiencia do contrato · 2.11.1
ADERENCIA: as 40 questoes estao no edital.
ZERO ERROS DE RACIOCINIO — os 12 sao recall. O erro de interpretacao do #6 fica como ponto isolado,
1 em 280 questoes: o diagnostico de que o teto e estoque, nao capacidade, volta a valer.
SANEAMENTO: 3 erros (Q17, Q23, Q26), 10 na serie, disparado a pior disciplina. MAS ele revisou
ETE/NBR 12209 por 25 min hoje e NENHUMA das tres e de ETE — sao rede de agua (NBR 12218),
abastecimento por solucao individual (Lei 11.445) e esgoto predial (NBR 8160). Estudou a disciplina
certa e o sub-topico errado. Saneamento no edital sao os itens 2.6.1 a 2.6.6 mais drenagem 2.5.x;
ETE e so o 2.6.2.
CONTRAPROVA DA DOSE no mesmo simulado: leu NBR 14653 por 29 min hoje, cairam QUATRO questoes de
avaliacoes e pericias (Q18, Q20, Q21, Q33) e acertou AS QUATRO — tendo errado NBR 14653 no #6 (Q39).
Terceiro caso do padrao estudou-com-dose-suficiente, parou de errar.
FUNDACOES e fraqueza nova: 2 erros (Q19 e Q36), ambos NBR 6122.
ESTUDO DO DIA (3h38): flashcards 30 min, NBR 14653 29 min, revisao ETE/NBR 12209 25 min,
concordancia 14 min, correcao ativa 52 min, simulado 68 min.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',56,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','5 (A-E), conforme o item 11.22 do Edital 5/2026-PMC',
      'erros', jsonb_build_array(5,8,15,17,19,23,24,26,29,36,37,38),
      'estudo_do_dia_min', 150,
      'normas_dos_erros', jsonb_build_array(
        'NR-18 (Q15)','NBR 12218 (Q17)','NBR 6122 (Q19, Q36)','Lei 11.445/2007 (Q23)',
        'Lei 14.133/2021 art. 145 (Q24)','Lei 14.133/2021 art. 25 par. 5 (Q38)',
        'NBR 8160 (Q26)','NBR 9575 (Q29)','NBR 15575 (Q37)')
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 28, 12, 56, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-11-01 16:00:00-03', 'simulado', 68, v_sess,
          'Simulado FAFIPA no 7.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 4, 1),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 4, 1),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 20, 10);
  raise notice 'ok % %', v_sess, v_att;
end $$;
