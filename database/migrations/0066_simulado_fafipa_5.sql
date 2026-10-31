-- 0066 — Simulado FAFIPA nº 5, 30/10/2026
--
-- RESULTADO: 32/40 = 80,0%. Ponderado 64 de 80 pontos. Melhor da serie.
-- TEMPO: 60 min de 240.
-- BLOCOS: Portugues 3/5 · Informatica 5/5 · Especificas 24/30.
--
-- SEM PENDENCIA DE TRANSCRICAO. As 8 letras informadas divergem todas do
-- gabarito — primeira vez em quatro simulados que nao houve divergencia.
--
-- SERIE DOS CINCO:
--   #1  26/10  55 min  30/40  60 pts  PT 3/5 · INF 4/5 · ESP 23/30
--   #2  27/10  70 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #3  28/10  75 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #4  29/10  66 min  31/40  62 pts  PT 4/5 · INF 3/5 · ESP 24/30
--   #5  30/10  60 min  32/40  64 pts  PT 3/5 · INF 5/5 · ESP 24/30
--
-- ACUMULADO: LP 20/25 (80,0%) · INF 20/25 (80,0%) · CE 115/150 (76,7%)
--            TOTAL 155/200 = 77,5%
--
-- LEITURA ESTATISTICA, CONTRA A LEITURA INTUITIVA:
-- 32 nao e distinguivel de 31. Teste de 32/40 contra os 123/160 dos quatro
-- anteriores: delta +3,1 pp, z = 0,44. Nada aconteceu.
-- Informatica 5/5 tambem nao e melhora: na taxa anterior de 75%, a chance de
-- acertar as cinco e 23,7%. Portugues 3/5 tambem nao e piora: na taxa de 85%,
-- a chance de 3 ou menos e 16,5%.
-- A serie 30-31-31-31-32 tem desvio observado de 0,71 questao quando o puro
-- acaso binomial, a 77,5% em 40 questoes, produz 2,66. A serie e MAIS estavel
-- do que o acaso permite — com cinco pontos nao se distingue sorte de
-- consistencia, mas a regressao linear (inclinacao +0,4 q/simulado, p = 0,04)
-- e artefato desse residuo pequeno demais. Nao tratar como tendencia.
--
-- ERROS (questao · gabarito · marcou · norma · item do edital de Curitiba):
-- 04 · B · D · Generos e tipologias textuais (sem norma)         · 1.1.3
-- 05 · C · B · Funcoes sintaticas: sujeito oculto (sem norma)    · 1.1.8
-- 22 · D · E · Niveis de tratamento de esgoto: terciario remove
--              nutrientes e microrganismos (conceito, sem NBR)   · 2.6.2
-- 23 · B · D · NBR 15575-1, secao 3: manutenibilidade            · 2.7.3
-- 27 · A · D · Resolucao CONFEA 1.025/2009, art. 7 (tipos de ART)· FORA
-- 28 · B · E · NBR 9050, item 10.3: faixa livre minima de 0,30 m
--              entre o modulo de referencia e a fileira          · 2.7.2
-- 38 · B · E · NBR 7196 (execucao de coberturas de fibrocimento)
--              e manuais de fabricante: furacao 2 mm maior que o
--              parafuso, vedado uso de ferramenta de impacto     · 2.2.6
-- 39 · E · A · NBR 15575-1, secao 3: custo global, degradacao,
--              retrofit, documentacao as built                   · 2.7.3
--
-- PADRAO MANTIDO: 8 de 8 erros sao definicao, norma ou classificacao decorada.
-- ZERO erros de raciocinio pelo quinto simulado seguido. 45 de 45 na serie.
--
-- ADERENCIA AO EDITAL: 39 das 40 questoes mapeiam para itens do conteudo
-- programatico do Edital 5/2026-PMC. A unica fora e a Q27 (tipos de ART pela
-- Resolucao CONFEA 1.025/2009). ART, CREA, CONFEA e Codigo de Etica nao
-- aparecem em nenhum dos 107 itens do edital. Agravante: a Resolucao 1.025/2009
-- foi revogada pela Resolucao CONFEA 1.137/2023 — a questao cobra norma que nao
-- esta no edital e nao esta mais em vigor. Terceiro erro fora do edital na
-- serie: Q19 do #2, Q27 do #4 (Codigo de Etica) e Q27 do #5. 3 de 45 = 6,7%.
-- Ressalva: a Q18 (coeficiente de aproveitamento) tem o TEMA dentro do edital
-- pelo item 2.1.4 (Lei 15.511/2019), mas a norma de origem e o Estatuto da
-- Cidade (Lei 10.257/2001), que o edital nao cita. Ele acertou.
--
-- RECORRENCIAS NOS CINCO SIMULADOS:
--   NBR 9050 — erro em #2, #3, #4 e #5. QUATRO SEGUIDOS. A reincidencia mais
--     persistente da serie. Item 2.7.2 do edital.
--   NBR 15575 — DOIS erros no mesmo simulado (Q23 e Q39), ambos na secao de
--     termos e definicoes. Item 2.7.3. Primeira vez que aparece dobrada.
--   Materiais de construcao — #2, #3 e #4; sem erro no #5.
--   Saneamento — #3 (2x), #4 e #5. Quatro erros, todos de vocabulario tecnico.
--   Impermeabilizacao e coberturas — #2, #3 e #5.
--   Informatica — errou em #1 a #4, zerou no #5.
--
-- O QUE MUDOU DE FATO: nada mensuravel no resultado. O que mudou foi a
-- COMPOSICAO: pela primeira vez o bloco de Informatica saiu limpo e o de
-- Portugues entregou o pior resultado da serie. As Especificas repetiram 24/30.
--
-- ORCAMENTO DE ERRO PARA O ALVO DE 35: 5 erros. Ele esta em 8. Para fechar 35
-- precisa de LP 5/5 e INF 5/5 simultaneos com CE 25/30 — combinacao que nenhum
-- dos cinco simulados produziu.

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
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-30') then
    raise notice 'simulado de 30/10 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-30 16:00:00-03', 'simulado', 60, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 5 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 32/40 = 80,0%. Ponderado 64/80 (corte 48). Tempo: 60 de 240 min.
BLOCOS: Portugues 3/5 · Informatica 5/5 · Especificas 24/30.
SERIE: #1 30/40 · #2 31/40 · #3 31/40 · #4 31/40 · #5 32/40.
ACUMULADO: LP 20/25 (80,0%) · INF 20/25 (80,0%) · CE 115/150 (76,7%) · TOTAL 155/200 (77,5%).
SEM PENDENCIA DE TRANSCRICAO — as 8 letras informadas divergem todas do gabarito.
LEITURA ESTATISTICA: 32 nao e distinguivel de 31 (z = 0,44 contra os 123/160 anteriores).
Informatica 5/5 nao e melhora (23,7% de chance na taxa anterior de 75%).
Portugues 3/5 nao e piora (16,5% de chance na taxa de 85%).
A serie 30-31-31-31-32 oscila 0,71 questao quando o acaso binomial produz 2,66: mais estavel
do que o acaso permite. Nao tratar a inclinacao de +0,4 q/simulado como tendencia.
ERROS (questao · gabarito · marcou · norma · item do edital):
04 · B · D · Generos e tipologias textuais, sem norma · 1.1.3
05 · C · B · Funcoes sintaticas, sujeito oculto, sem norma · 1.1.8
22 · D · E · Tratamento terciario de esgoto remove nutrientes e microrganismos · 2.6.2
23 · B · D · NBR 15575-1 secao 3: manutenibilidade · 2.7.3
27 · A · D · Resolucao CONFEA 1.025/2009 art. 7, tipos de ART · FORA DO EDITAL
28 · B · E · NBR 9050 item 10.3: faixa livre de 0,30 m entre o modulo de referencia e a fileira · 2.7.2
38 · B · E · NBR 7196 e manuais: furacao 2 mm maior que o parafuso, sem ferramenta de impacto · 2.2.6
39 · E · A · NBR 15575-1 secao 3: custo global, degradacao, retrofit, as built · 2.7.3
PADRAO: 8 de 8 erros sao norma ou definicao decorada. ZERO de raciocinio — 45 de 45 na serie.
ADERENCIA AO EDITAL: 39 das 40 questoes estao no conteudo programatico. So a Q27 esta fora, e a
Resolucao 1.025/2009 foi revogada pela 1.137/2023. Terceiro erro fora do edital na serie (3 de 45).
RECORRENCIAS: NBR 9050 errada em #2, #3, #4 e #5 — QUATRO SEGUIDOS, a mais persistente.
NBR 15575 com DOIS erros no mesmo simulado, ambos em termos e definicoes.
Saneamento em #3 (2x), #4 e #5. Impermeabilizacao e coberturas em #2, #3 e #5.
Informatica errou de #1 a #4 e zerou no #5.
ALVO DE 35 (5 erros): esta em 8. Exige LP 5/5 e INF 5/5 simultaneos com CE 25/30 — combinacao
que nenhum dos cinco simulados produziu.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',64,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','maioria 5 (A-E); a prova de Curitiba tera 4',
      'erros', jsonb_build_array(4,5,22,23,27,28,38,39),
      'erros_fora_do_edital', jsonb_build_array(27),
      'normas_dos_erros', jsonb_build_array(
        'NBR 15575-1 (Q23, Q39)','NBR 9050 item 10.3 (Q28)',
        'NBR 7196 e manuais de fabricante (Q38)',
        'Resolucao CONFEA 1.025/2009, revogada pela 1.137/2023 (Q27, fora do edital)')
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 32, 8, 64, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-10-30 16:00:00-03', 'simulado', 60, v_sess,
          'Simulado FAFIPA no 5.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 3, 2),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 5, 0),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 24, 6);
  raise notice 'ok % %', v_sess, v_att;
end $$;
