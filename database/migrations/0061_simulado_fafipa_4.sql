-- 0061 — Simulado FAFIPA nº 4, 29/10/2026
--
-- RESULTADO: 32/40 = 80,0%. Ponderado 64 de 80 pontos (corte 48).
-- TEMPO: 66 min de 240 (28%).
-- BLOCOS: Portugues 4/5 · Informatica 3/5 · Especificas 25/30.
--
-- SERIE DOS QUATRO:
--   #1  26/10  55 min  30/40  60 pts  PT 3/5 · INF 4/5 · ESP 23/30
--   #2  27/10  70 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #3  28/10  75 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #4  29/10  66 min  32/40  64 pts  PT 4/5 · INF 3/5 · ESP 25/30
--
-- A VIRADA: Especificas saiu de 22-23 para 25/30. Primeiro movimento do bloco
-- que vale 60 dos 80 pontos em quatro simulados. Corresponde a leitura dirigida
-- registrada entre 27 e 29/10 (Lei 6.766, Decreto 2.397, Lei 15.511, NBR 9050,
-- Lei 10.098) mais as sessoes de flashcard.
--
-- A TROCA: Informatica caiu para o pior resultado da serie (3/5), e Portugues
-- perdeu uma. O ganho liquido foi de so +1 questao porque os blocos pequenos
-- devolveram o que as Especificas ganharam.
--
-- PENDENCIA Q34: usuario informou "34-c" entre os erros, mas C e o gabarito
-- (NBR 10004, residuo inflamavel = D001). Registrado como ACERTO. Terceira vez
-- que isso acontece: Q36 do #2, Q01 do #3 (confirmada como acerto), Q34 agora.
-- Se a Q34 foi erro: 31/40 = 62 pontos e Especificas 24/30.
--
-- ERROS (questao · gabarito · marcou · o que falhou):
-- 04 · B · A · Sintaxe: periodo simples com um nucleo verbal; marcou objeto direto
-- 06 · D · B · Windows 11: Sensor de Armazenamento; marcou Limpeza de Disco
-- 07 · C · B · Excel SOMASE: ordem dos argumentos (intervalo; criterio; soma)
-- 17 · D · B · Escavacao: avaliar risco a partir de 1,25 m; marcou 1,50 m
-- 27 · C · D · Codigo de Etica CONFEA: so o item IV; marcou "todos"
-- 29 · E · C · NBR 9050: originalmente planejado acessivel = ADEQUADO (nao "acessivel")
-- 31 · B->A · Cimento: maior finura acelera hidratacao e resistencia inicial
-- 32 · B · D · Elevatoria com pressao a montante: BOOSTER
--
-- PADRAO MANTIDO: 8 de 8 erros sao definicao, norma ou sintaxe de funcao.
-- ZERO erros de raciocinio pelo quarto simulado seguido.
--
-- RECORRENCIAS NOS QUATRO:
--   Informatica — erro em TODOS os quatro (4,4,4,3 de 5). 13 acertos em 20.
--   NBR 9050 — erro em #2, #3 e #4. TRES simulados seguidos.
--   Saneamento — erro em #3 (2x) e #4 (1x). Tres erros, todos de vocabulario.
--   Materiais de construcao — #2, #3 e #4. Tres simulados seguidos.
--   ART/Codigo de Etica CONFEA — #3 e #4. Nao esta no edital de Curitiba.
--
-- OBSERVACAO SOBRE A Q27: Codigo de Etica do CONFEA nao consta do conteudo
-- programatico de Curitiba. Erro que nao precisa virar estudo.

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
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-29') then
    raise notice 'simulado de 29/10 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-29 16:00:00-03', 'simulado', 66, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 4 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 32/40 = 80,0%. Ponderado 64/80 (corte 48). Tempo: 66 de 240 min.
BLOCOS: Portugues 4/5 · Informatica 3/5 · Especificas 25/30.
SERIE: #1 30/40 (55min) · #2 31/40 (70min) · #3 31/40 (75min) · #4 32/40 (66min).
VIRADA: Especificas saiu de 22-23 para 25/30 — primeiro movimento em 4 simulados do bloco
que vale 60 dos 80 pontos. Coincide com a leitura dirigida de 27 a 29/10.
TROCA: Informatica caiu para 3/5, o pior da serie, e Portugues perdeu uma. Ganho liquido +1.
PENDENCIA Q34: informada como erro mas "C" e o gabarito (NBR 10004, inflamavel = D001).
Registrada como acerto. Se foi erro: 31/40 = 62 pontos e Especificas 24/30.
ERROS:
04 · B · A · Sintaxe: periodo simples com um nucleo verbal; marcou objeto direto
06 · D · B · Windows 11: Sensor de Armazenamento; marcou Limpeza de Disco
07 · C · B · Excel SOMASE: ordem dos argumentos — (intervalo; criterio; intervalo_soma)
17 · D · B · Escavacao: avaliar risco a partir de 1,25 m; marcou 1,50 m
27 · C · D · Codigo de Etica CONFEA: so o item IV; marcou "todos" — FORA do edital de Curitiba
29 · E · C · NBR 9050: originalmente planejado acessivel = ADEQUADO, nao "acessivel"
31 · A · B · Cimento: maior finura acelera hidratacao e resistencia inicial
32 · B · D · Elevatoria que reforca pressao a montante: BOOSTER
PADRAO: 8 de 8 erros sao definicao, norma ou sintaxe. ZERO de raciocinio, 4o simulado seguido.
RECORRENCIAS NOS 4: Informatica erra em todos (13/20 acumulado); NBR 9050 em #2, #3 e #4;
Saneamento em #3 (2x) e #4; Materiais de construcao em #2, #3 e #4.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',64,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','maioria 5 (A-E); a prova de Curitiba tera 4',
      'erros', jsonb_build_array(4,6,7,17,27,29,31,32),
      'pendencia','Q34 informada como erro mas a marcacao coincide com o gabarito'
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
  values (v_user, v_tpl, timestamptz '2026-10-29 16:00:00-03', 'simulado', 66, v_sess,
          'Simulado FAFIPA no 4.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 4, 1),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 3, 2),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 25, 5);
  raise notice 'ok % %', v_sess, v_att;
end $$;
