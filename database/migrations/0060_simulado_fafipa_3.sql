-- 0060 — Simulado FAFIPA nº 3, 28/10/2026
--
-- RESULTADO: 31/40 = 77,5%. Ponderado 62 de 80 pontos (corte 48).
-- TEMPO: 75 min de 240 (31%). Simulado 1: 55 min. Simulado 2: 70 min.
-- BLOCOS: Portugues 5/5 · Informatica 4/5 · Especificas 22/30.
--
-- SERIE ATE AQUI:
--   #1  26/10  55 min  30/40  60 pts  PT 3/5 · INF 4/5 · ESP 23/30
--   #2  27/10  70 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #3  28/10  75 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--
-- PENDENCIA Q01: o usuario informou "1-b" entre os erros, mas B e o gabarito
-- (Tipologia e genero textual, CAMPO LARGO Q1). Registrado como ACERTO, pela
-- mesma razao da Q36 do simulado 2 — nao arbitrar. Se a Q01 foi erro, o
-- resultado e 30/40 = 60 pontos e Portugues cai para 4/5.
--
-- ERROS (questao · gabarito · marcou · o que falhou):
-- 07 · D · A · Atalhos: colar mantendo formatacao e Ctrl+Alt+V; marcou Ctrl+Shift+V
-- 14 · C · E · Lei 14.133: impedimento de licitar alcanca o ENTE que aplicou, max 3 anos
-- 16 · B · E · NBR 9575: produto pre-fabricado por calandragem e MANTA, nao mastique
-- 19 · E · B · Nulidade da ART: so os incisos II e III; marcou "todos"
-- 24 · D · B · Argamassa colante para granito em parede: AC-III; marcou AC-I
-- 26 · B->A · Perdas na rede: agua produzida que nao chega e perda REAL; marcou aparente
-- 28 · A · C · Plano de Contratacoes Anual: aquisicao direta emergencial NAO e objetivo
-- 30 · D · C · NBR 9050: deslocamento 90 graus com percurso intermediario, 0,60 a 1,20
-- 31 · D · E · Trecho sem contribuicao ao longo do percurso e EMISSARIO
--
-- PADRAO MANTIDO: 9 de 9 erros sao norma, lei ou definicao tecnica decorada.
-- ZERO erros de raciocinio pelo terceiro simulado seguido.
--
-- O QUE MUDOU NESTE: SANEAMENTO apareceu como erro pela primeira vez, e
-- apareceu DUAS VEZES (Q26 perdas reais x aparentes; Q31 emissario). Saneamento
-- e a unica disciplina onde ele bate os pares (+9,9 pp) e a de maior peso no
-- edital. Dois erros ali em um unico simulado e sinal de alerta, nao ruido de
-- um caderno dificil: as duas sao definicao de vocabulario tecnico basico.
--
-- RECORRENCIAS ACUMULADAS NOS TRES SIMULADOS:
--   Informatica — 1 erro em TODOS os tres (4/5, 4/5, 4/5).
--     Dois deles foram ATALHOS DE TECLADO (#2 Ctrl+H, #3 Ctrl+Alt+V).
--   Impermeabilizacao — #2 Q29 (camadas), #3 Q16 (manta). 2 erros.
--   Acessibilidade NBR 9050 — #2 Q12, #3 Q30. 2 erros.
--   Materiais de construcao — #2 Q16 (aditivos), #3 Q24 (argamassa AC). 2 erros.
--   Licitacoes — #3 Q14 e Q28, duas no mesmo simulado.
--
-- ESPECIFICAS TRAVADAS: 23, 22, 22. E o bloco que vale 60 dos 80 pontos e nao
-- se moveu em tres simulados. Portugues resolveu (3/5 -> 5/5 -> 5/5).

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
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-28') then
    raise notice 'simulado de 28/10 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-28 16:00:00-03', 'simulado', 75, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 3 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 31/40 = 77,5%. Ponderado 62/80 (corte 48). Tempo: 75 de 240 min.
BLOCOS: Portugues 5/5 · Informatica 4/5 · Especificas 22/30.
SERIE: #1 30/40 (55min) · #2 31/40 (70min) · #3 31/40 (75min).
PENDENCIA Q01: informada como erro mas "B" e o gabarito. Registrada como acerto, nao arbitrada.
Se a Q01 foi erro: 30/40 = 60 pontos e Portugues 4/5.
ERROS:
07 · D · A · Atalhos: colar mantendo formatacao e Ctrl+Alt+V; marcou Ctrl+Shift+V
14 · C · E · Lei 14.133: impedimento de licitar alcanca o ENTE que aplicou, max 3 anos
16 · B · E · NBR 9575: produto pre-fabricado por calandragem e MANTA; marcou mastique
19 · E · B · Nulidade da ART: so II e III; marcou "todos os itens"
24 · D · B · Argamassa colante para granito em parede: AC-III; marcou AC-I
26 · A · B · Perdas na rede: agua produzida que nao chega e perda REAL; marcou aparente
28 · A · C · Plano de Contratacoes Anual: aquisicao direta emergencial NAO e objetivo
30 · D · C · NBR 9050: giro de 90 graus com percurso intermediario, 0,60 a 1,20 m
31 · D · E · Trecho sem contribuicao ao longo do percurso e EMISSARIO
PADRAO: 9 de 9 erros sao norma, lei ou definicao decorada. ZERO de raciocinio, 3o simulado seguido.
ALERTA: SANEAMENTO errado DUAS VEZES (Q26 e Q31) — e a unica disciplina onde ele bate os pares
(+9,9 pp) e a de maior peso no edital. As duas sao vocabulario tecnico basico, nao caderno dificil.
RECORRENCIAS NOS 3 SIMULADOS: Informatica 1 erro em todos (2 deles em ATALHOS);
Impermeabilizacao 2; NBR 9050 2; Materiais de construcao 2; Licitacoes 2 (ambas no #3).
ESPECIFICAS TRAVADAS EM 23/22/22 — o bloco que vale 60 dos 80 pontos nao se moveu.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',62,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','maioria 5 (A-E); a prova de Curitiba tera 4',
      'erros', jsonb_build_array(7,14,16,19,24,26,28,30,31),
      'pendencia','Q01 informada como erro mas a marcacao coincide com o gabarito',
      'questoes_nao_aplicaveis', jsonb_build_array(25)
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 31, 9, 62, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-10-28 16:00:00-03', 'simulado', 75, v_sess,
          'Simulado FAFIPA no 3.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 5, 0),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 4, 1),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 22, 8);
  raise notice 'ok % %', v_sess, v_att;
end $$;
