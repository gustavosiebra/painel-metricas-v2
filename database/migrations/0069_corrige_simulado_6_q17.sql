-- 0069 — Corrige o simulado nº 6: a Q17 era erro
--
-- POR QUE (31/10/2026): o usuario informou "17-e", mas E e o gabarito. Registrei
-- na 0068 como acerto e deixei a pendencia anotada em vez de arbitrar. Ele
-- corrigiu: "17-b eu que transcrevi aqui errado". Marcou B.
--
-- Q17 (AMAPORA Q21) — lajes apoiadas diretamente em pilares com capiteis.
-- Gabarito E = lajes COGUMELO. Ele marcou B = nervuradas.
-- Observacao de conteudo: laje LISA e a apoiada diretamente nos pilares SEM
-- capitel; com capitel e COGUMELO. O par lisa/cogumelo e a armadilha classica,
-- e as duas estavam entre as alternativas (A e E).
--
-- CORRECAO: 29/40 e 58 pontos passam a 28/40 e 56 pontos.
-- Conhecimentos Especificos cai de 21/30 para 20/30.
--
--   bloco          antes   depois
--   Portugues       3/5     3/5
--   Informatica     5/5     5/5
--   Especificas    21/30   20/30
--   TOTAL          29/40   28/40   (58 -> 56 pontos)
--
-- SERIE CORRIGIDA: 30 · 31 · 31 · 31 · 32 · 28
-- ACUMULADO: LP 23/30 (76,7%) · INF 25/30 (83,3%) · CE 135/180 (75,0%)
--            TOTAL 183/240 = 76,25%
--
-- ESTATISTICA REFEITA: 28/40 = 70,0% contra os 155/200 (77,5%) anteriores:
-- delta -7,5 pp, z = -0,96, p = 0,34. CONTINUA dentro do ruido — nao e queda.
-- Desvio da serie sobe de 0,71 (cinco simulados) para 1,38 (seis), ainda
-- abaixo do acaso binomial, que a 76,25% em 40 questoes vale 2,69. O patamar
-- real segue sendo ~30 +/- 2.
--
-- QUARTA DIVERGENCIA DE TRANSCRICAO, e a segunda em que ele informou a letra
-- do gabarito tendo marcado outra: Q36 do #2 (era E), Q01 do #3 (era acerto
-- mesmo), Q34 do #4 (era A) e Q17 agora (era B). Em tres das quatro a questao
-- era erro de fato. Vale conferir a folha antes de passar a lista.
--
-- EFEITO NO DIAGNOSTICO: a Q17 e recall de nomenclatura, nao raciocinio. Entao
-- dos 12 erros deste simulado, 11 sao recall e 1 e interpretacao (a Q01). O
-- achado da 0068 continua de pe: primeiro erro de raciocinio em 240 questoes.
--
-- EDIFICACOES passa a ter 2 erros neste simulado (Q17 lajes e Q23 brita).
--
-- Atualizacao por id da sessao, nunca por data.

do $$
declare
  v_sess uuid;
  v_esp uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
begin
  select id into v_sess from public.study_sessions
  where user_id='b0d56062-0a37-48de-ae34-5aa79be0aa2a' and study_type='simulado'
    and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-31';
  if v_sess is null then raise exception 'sessao do simulado 6 nao encontrada'; end if;

  update public.session_results
  set correct_total=28, wrong_total=12, score=56 where session_id=v_sess;

  update public.exam_attempt_blocks ab set correct=20, wrong=10
  from public.exam_attempts ea
  where ea.id=ab.attempt_id and ea.session_id=v_sess and ab.block_id=v_esp;

  update public.study_sessions
  set notes = replace(replace(replace(replace(notes,
        'RESULTADO: 29/40 = 72,5%. Ponderado 58/80',
        'RESULTADO: 28/40 = 70,0%. Ponderado 56/80'),
        'Especificas 21/30.','Especificas 20/30.'),
        'SERIE: #1 30 · #2 31 · #3 31 · #4 31 · #5 32 · #6 29.',
        'SERIE: #1 30 · #2 31 · #3 31 · #4 31 · #5 32 · #6 28.'),
        'PENDENCIA Q17: informada como erro mas "E" e o gabarito (lajes cogumelo). Registrada como acerto,
nao arbitrada. QUARTA ocorrencia na serie. Se foi erro: 28/40 = 56 pontos e Especificas 20/30.',
        '17 · E · B · Lajes COGUMELO sao as apoiadas em pilares com capitel; as LISAS sao sem capitel
(a primeira informacao dizia "17-e"; corrigido pelo usuario para B — ver migration 0069)'),
      metadata = (metadata - 'pendencia')
        || jsonb_build_object('pontuacao_ponderada',56,
             'erros', jsonb_build_array(1,3,14,17,21,23,24,26,30,34,37,39))
  where id=v_sess;

  update public.study_sessions
  set notes = replace(notes,
        'ACUMULADO: LP 23/30 (76,7%) · INF 25/30 (83,3%) · CE 136/180 (75,6%) · TOTAL 184/240 (76,7%).',
        'ACUMULADO: LP 23/30 (76,7%) · INF 25/30 (83,3%) · CE 135/180 (75,0%) · TOTAL 183/240 (76,25%).')
  where id=v_sess;

  update public.study_sessions
  set notes = replace(notes,
        'LEITURA ESTATISTICA: 29 nao e queda significativa (z = -0,65 contra os 155/200 anteriores).',
        'LEITURA ESTATISTICA: 28 nao e queda significativa (z = -0,96, p = 0,34, contra os 155/200 anteriores).')
  where id=v_sess;

  raise notice 'simulado 6 corrigido para 28/40';
end $$;
