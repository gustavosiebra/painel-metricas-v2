-- 0055 — Simulado FAFIPA nº 2, 27/10/2026
--
-- ATENÇÃO: o resultado gravado aqui foi CORRIGIDO pela migration 0056.
-- A Q36 era erro, não acerto: o correto é 31/40 e 62 pontos.
--
-- TEMPO: 70 min de 240 (29%). 1,75 min/questao. No simulado 1 foram 55 min.
-- BLOCOS (apos a 0056): Portugues 5/5 · Informatica 4/5 · Especificas 22/30.
-- Portugues fechou — primeira vez em qualquer instrumento.
--
-- ERROS (questao · gabarito · marcou · o que falhou):
-- 07 · E · A · Word: localizar e substituir e Ctrl+H; marcou Ctrl+L
-- 12 · C · B · NBR 9050: faixa de travessia e fatores de impedancia
-- 16 · C · A · Pega acelerada em dia quente pede RETARDADOR; marcou superplastificante
-- 19 · D · C · Condicoes para edificacao ser considerada concluida
-- 23 · A · B · Sarilho x moitao (equipamento de canteiro)
-- 29 · D · E · Camadas da impermeabilizacao: berco e protecao mecanica
-- 33 · C · B · NBR 6118: espessura minima da nervura e 5 cm; marcou 11 cm
-- 34 · A · D · NR-18: torre de andaime nao estaiada, max 4x a menor dimensao da base
-- 36 · A · E · Avaliacoes: a EXCECAO e executar reparo; arbitramento E atribuicao
--
-- PADRAO, IGUAL AO DO SIMULADO 1: 8 dos 9 erros sao norma ou definicao
-- decorada. ZERO erros de raciocinio.
--
-- REPETICOES ENTRE OS DOIS SIMULADOS:
--   NBR 6118, espessura minima — errou no 1 (laje macica, 7 cm) e no 2
--     (nervura, 5 cm). Mesmo item da norma, duas formas.
--   NR-18 — errou no 1 (definicao de ancoragem) e no 2 (altura de andaime).
--   Impermeabilizacao/revestimentos — 2 dos erros de Especificas do simulado 2.

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
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-27') then
    raise notice 'simulado de 27/10 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-27 16:00:00-03', 'simulado', 70, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 2 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 32/40 = 80,0%. Ponderado 64/80 (corte 48). Tempo: 70 de 240 min.
BLOCOS: Portugues 5/5 · Informatica 4/5 · Especificas 23/30.
Simulado 1 (26/10): 30/40, 60 pontos, 55 min.
RESSALVA Q36: usuario informou ter marcado A, que e o gabarito. Registrado como acerto.
Se a Q36 foi erro, o resultado e 31/40 = 62 pontos. Pendencia nao arbitrada.
ERROS:
07 · E · A · Word: localizar e substituir e Ctrl+H; marcou Ctrl+L
12 · C · B · NBR 9050: faixa de travessia e fatores de impedancia
16 · C · A · Pega acelerada em dia quente pede RETARDADOR; marcou superplastificante
19 · D · C · Condicoes para edificacao ser considerada concluida
23 · A · B · Sarilho x moitao (equipamento de canteiro)
29 · D · E · Camadas da impermeabilizacao: berco e protecao mecanica
33 · C · B · NBR 6118: espessura minima da nervura e 5 cm; marcou 11 cm
34 · A · D · NR-18: torre de andaime nao estaiada, max 4x a menor dimensao da base
PADRAO: 7 dos 8 erros sao norma ou definicao decorada. ZERO de raciocinio. Igual ao simulado 1.
REPETICOES ENTRE OS DOIS SIMULADOS: NBR 6118 espessura minima (laje macica no 1, nervura no 2);
NR-18 (ancoragem no 1, andaime no 2). Impermeabilizacao foi 2 dos 7 erros de Especificas aqui.
EVOLUCAO: Portugues 3/5 -> 5/5. Especificas 23/30 nos dois.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',64,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','maioria 5 (A-E); a prova de Curitiba tera 4',
      'erros', jsonb_build_array(7,12,16,19,23,29,33,34),
      'pendencia','Q36 informada como erro mas a marcacao coincide com o gabarito'
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
  values (v_user, v_tpl, timestamptz '2026-10-27 16:00:00-03', 'simulado', 70, v_sess,
          'Simulado FAFIPA no 2.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 5, 0),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 4, 1),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 23, 7);
  raise notice 'ok % %', v_sess, v_att;
end $$;
