-- 0068 — Simulado FAFIPA nº 6, 31/10/2026
--
-- RESULTADO: 29/40 = 72,5%. Ponderado 58 de 80 pontos. PIOR DA SERIE.
-- TEMPO: 65 min de 240.
-- BLOCOS: Portugues 3/5 · Informatica 5/5 · Especificas 21/30.
--
-- PENDENCIA Q17: o usuario informou "17-e" entre os erros, mas E e o gabarito
-- (lajes cogumelo, apoiadas em pilares com capiteis). Registrado como ACERTO,
-- sem arbitrar. QUARTA ocorrencia: Q36 do #2, Q01 do #3, Q34 do #4, Q17 agora.
-- Se a Q17 foi erro: 28/40 = 56 pontos e Especificas 20/30.
--
-- SERIE DOS SEIS:
--   #1  26/10  55 min  30/40  60 pts  PT 3/5 · INF 4/5 · ESP 23/30
--   #2  27/10  70 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #3  28/10  75 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #4  29/10  66 min  31/40  62 pts  PT 4/5 · INF 3/5 · ESP 24/30
--   #5  30/10  60 min  32/40  64 pts  PT 3/5 · INF 5/5 · ESP 24/30
--   #6  31/10  65 min  29/40  58 pts  PT 3/5 · INF 5/5 · ESP 21/30
--
-- ACUMULADO: LP 23/30 (76,7%) · INF 25/30 (83,3%) · CE 136/180 (75,6%)
--            TOTAL 184/240 = 76,7%
--
-- LEITURA ESTATISTICA: 29 nao e queda significativa. Teste de 29/40 contra os
-- 155/200 anteriores: delta -5,0 pp, z = -0,65. Dentro do ruido.
-- Mas a serie deixou de ser plana: era 30-31-31-31-32, desvio de 0,71 questao,
-- menos que o acaso binomial permite (2,66). Com o 29 o desvio sobe para 1,05.
-- Continua abaixo do acaso — ou seja, ainda e cedo para ler tendencia.
--
-- INFORMATICA 5/5 PELO SEGUNDO SIMULADO SEGUIDO: 10 de 10 nos dois ultimos.
-- Na taxa antiga de 75%, a chance disso por acaso e 5,6% (0,75^10), contra
-- 23,7% quando era so um simulado. Isso NAO e prova, mas e o primeiro indicio
-- com forca de que os 108 exercicios de Informatica de 29/10 produziram efeito.
--
-- ERROS (questao · gabarito · marcou · norma · item do edital):
-- 01 · A · E · Interpretacao: ideia principal do texto (sem norma)     · 1.1.1
-- 03 · B · D · Sintaxe: sujeito simples (sem norma)                    · 1.1.8
-- 14 · E · A · NR-18, item 18.12.1 alinea "e": sistema de acesso ao
--              andaime quando superior a 0,40 m                        · 2.9.4
-- 21 · A · D · Filtro aerado submerso: excesso de biomassa removido
--              por CONTRALAVAGEM (conceito de engenharia sanitaria)    · 2.6.2
-- 23 · D · A · Brita CORRIDA: britas sem classificacao previa + po de
--              pedra (nomenclatura de materiais)                       · 2.2.1
-- 24 · B · C · Angulo de ATRITO INTERNO do solo                        · 2.4.2
-- 26 · A · C · DESAGUAMENTO: operacao que reduz a umidade do lodo      · 2.6.2
-- 30 · A · C · Gerenciamento de custos: revisar composicoes para
--              reduzir o orcamento e ESTIMATIVA de custos              · 2.8.4
-- 34 · C · B · Lei 11.445/2007, art. 3, I: saneamento basico sao os
--              QUATRO componentes (agua, esgoto, residuos, drenagem)   · 2.6.4
-- 37 · C · B · NR-18, item 18.8.4: rampas e passarelas de canteiro com
--              largura minima de 0,80 m                                · 2.9.4
-- 39 · B · A · NBR 14653: metodo comparativo direto, involutivo,
--              evolutivo — as definicoes estavam trocadas              · 2.10.3
--
-- ADERENCIA AO EDITAL: as 40 questoes estao no conteudo programatico. Este e
-- o primeiro simulado da serie sem nenhuma questao fora do edital — a Q13, que
-- cobrava nulidade da ART, foi substituida em 31/10 por uma de Lei 6.766.
--
-- QUEBRA DE PADRAO IMPORTANTE:
-- A Q01 e um erro de INTERPRETACAO DE TEXTO — identificar a ideia principal.
-- Nos cinco simulados anteriores, os 45 erros eram todos recall de norma,
-- definicao ou sintaxe de funcao, ZERO de raciocinio. Este e o primeiro erro
-- de raciocinio em 240 questoes. Um ponto nao faz padrao, mas o diagnostico
-- "o teto dele e estoque, nao capacidade" perde um pouco de forca ate que o
-- proximo simulado confirme ou descarte.
--
-- SANEAMENTO VIROU O PIOR BLOCO: TRES erros neste simulado (Q21, Q26, Q34).
-- Acumulado na serie: #3 duas vezes, #4 uma, #5 uma, #6 tres = SETE erros,
-- mais que qualquer outra disciplina. E a de maior peso no edital e aquela em
-- que ele bate os pares em +9,9 pp. Os sete sao vocabulario tecnico decorado:
-- perdas reais x aparentes, emissario, booster, terciario, contralavagem,
-- desaguamento, componentes do saneamento basico.
--
-- NR-18 APARECEU DUAS VEZES (Q14 e Q37), ambas erradas, ambas cota numerica.
-- Ele leu a NR-18 em 30/10 (20 min) e a NR-35 em 29/10 (28 min). Leitura de
-- norma de novo nao fixou numero — mesmo padrao do erro da NBR 9050.

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
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-31') then
    raise notice 'simulado de 31/10 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-31 16:00:00-03', 'simulado', 65, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 6 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 29/40 = 72,5%. Ponderado 58/80 (corte 48). Tempo: 65 de 240 min. PIOR DA SERIE.
BLOCOS: Portugues 3/5 · Informatica 5/5 · Especificas 21/30.
SERIE: #1 30 · #2 31 · #3 31 · #4 31 · #5 32 · #6 29.
ACUMULADO: LP 23/30 (76,7%) · INF 25/30 (83,3%) · CE 136/180 (75,6%) · TOTAL 184/240 (76,7%).
PENDENCIA Q17: informada como erro mas "E" e o gabarito (lajes cogumelo). Registrada como acerto,
nao arbitrada. QUARTA ocorrencia na serie. Se foi erro: 28/40 = 56 pontos e Especificas 20/30.
LEITURA ESTATISTICA: 29 nao e queda significativa (z = -0,65 contra os 155/200 anteriores).
A serie ainda oscila menos que o acaso binomial permite — e cedo para ler tendencia.
INFORMATICA 10 de 10 nos dois ultimos simulados. Na taxa antiga de 75% isso tem 5,6% de chance por
acaso, contra 23,7% quando era so um. Primeiro indicio forte de que os 108 exercicios de 29/10 pegaram.
ERROS (questao · gabarito · marcou · norma · item do edital):
01 · A · E · Interpretacao: ideia principal do texto · 1.1.1
03 · B · D · Sintaxe: sujeito simples · 1.1.8
14 · E · A · NR-18 item 18.12.1 alinea e: acesso ao andaime quando superior a 0,40 m · 2.9.4
21 · A · D · Filtro aerado submerso: biomassa removida por CONTRALAVAGEM · 2.6.2
23 · D · A · Brita CORRIDA: britas sem classificacao previa com po de pedra · 2.2.1
24 · B · C · Angulo de ATRITO INTERNO · 2.4.2
26 · A · C · DESAGUAMENTO reduz a umidade do lodo · 2.6.2
30 · A · C · Gerenciamento de custos: ESTIMATIVA de custos · 2.8.4
34 · C · B · Lei 11.445/2007 art. 3 I: saneamento basico sao os QUATRO componentes · 2.6.4
37 · C · B · NR-18 item 18.8.4: rampas e passarelas com largura minima de 0,80 m · 2.9.4
39 · B · A · NBR 14653: metodos comparativo direto, involutivo e evolutivo trocados · 2.10.3
ADERENCIA: as 40 questoes estao no edital. Primeiro simulado da serie sem questao fora — a Q13 foi
substituida em 31/10 por uma de Lei 6.766.
QUEBRA DE PADRAO: a Q01 e erro de INTERPRETACAO. Nos 45 erros anteriores nao havia nenhum de
raciocinio — e o primeiro em 240 questoes.
SANEAMENTO VIROU O PIOR BLOCO: 3 erros aqui (Q21, Q26, Q34) e 7 na serie, mais que qualquer outra
disciplina. Todos de vocabulario tecnico.
NR-18 errada DUAS VEZES, ambas cota numerica (0,40 m e 0,80 m), depois de ele ter lido a norma em
30/10. Leitura de novo nao fixou numero.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',58,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','5 (A-E), conforme o item 11.22 do Edital 5/2026-PMC',
      'formato_prova_edital','40 questoes - 5 alternativas - 1 correta - 4 horas - minimo 48 de 80 pontos (itens 11.22, 11.23 e 11.25)',
      'erros', jsonb_build_array(1,3,14,21,23,24,26,30,34,37,39),
      'pendencia','Q17 informada como erro mas a marcacao coincide com o gabarito',
      'normas_dos_erros', jsonb_build_array(
        'NR-18 item 18.12.1-e (Q14)','NR-18 item 18.8.4 (Q37)',
        'Lei 11.445/2007 art. 3 I (Q34)','NBR 14653 (Q39)')
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 29, 11, 58, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-10-31 16:00:00-03', 'simulado', 65, v_sess,
          'Simulado FAFIPA no 6.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 3, 2),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 5, 0),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 21, 9);
  raise notice 'ok % %', v_sess, v_att;
end $$;
