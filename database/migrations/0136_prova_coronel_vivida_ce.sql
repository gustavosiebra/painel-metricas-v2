-- 0136 - Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil): 18 questoes de Engenharia, 23/11/2026
--
-- AUTORIZADO pelo usuario em 23/11/2026: "resolvi apenas as questoes de eng civil em 1h05, 18 questoes
-- ao todo. faca as analises e inclua onde precisar os dados".
--
-- RESULTADO: 12/18 = 66,7% em 65 min (3,6 min por questao, bem acima dos ~1,4 min dos simulados).
-- ERROS (6, enviados em tela): Q26 (2.4), Q27 e Q28 (2.3), Q30 e Q37 (2.7), Q34 (2.9).
-- Os 12 acertos entram por DIFERENCA (nao ha letra marcada individual). Gabarito PRELIMINAR da banca; os 6 das telas do
-- usuario (marca verde) conferem com o que li pela posicao do rotulo na copia da area do candidato.
-- Origem 'caderno' (derivada das tags), numerada 251-268 (Q23 -> 251) para seguir a numeracao do caderno FAFIPA;
-- sessoes por UNIDADE com tempo rateado, mesmo padrao dos blocos do caderno (0106 em diante).
-- Nao resolvidas: Q19-Q22 (legislacao de Coronel Vivida), LP (Q1-6), Matematica e Conhecimentos Gerais.
-- Q35 (areas da edificacao) classificada em 2.8, Q36 e Q37 em 2.7: escolhas de fronteira.

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam  uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_board uuid := 'e7e5c690-d2a7-4335-b55c-2bdfff4563db';  -- FAFIPA
  v_ts    timestamptz := '2026-11-23 19:00:00-03';
  v_sess uuid; v_q uuid; r record; n_tot int := 0; n_ok int := 0;
begin
  if exists (select 1 from public.questions where user_id=v_user and tags->>'prova_origem'='CORONEL VIVIDA') then
    raise notice '0136: Coronel Vivida ja registrada; nada a fazer'; return;
  end if;

  -- unidade 2.3: Q27,28,29
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '34982203-64ae-4486-8ee5-ce125f29993c', '60a2d13b-08c2-44ed-acd8-0cdbb9da766f', 'questao', 10.83,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 27,28,29, unidade 2.3. 1 de 3 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (10.83 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
ERROS:
  Q27 lajes, armadura minima: marcou II,III,IV; gabarito I,II,III. O item IV (barras lisas x alta aderencia) e falso. Itens I e III conferidos na NBR 6118:2026, 17.3.5.1 (armaduras positivas reduzidas em lajes armadas nas duas direcoes; armadura negativa de borda ate 0,15 do vao menor).
  Q28 elementos estruturais: marcou V,V,V,F; gabarito V,V,F,V. Item III inverte placa e chapa (NBR 6118:2026, 14.4.2.1: placa = acoes normais ao plano; 14.4.2.2: chapa = acoes no plano). Item IV (arcos) e verdadeiro.$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.3',
            'questoes_da_prova', jsonb_build_array(27,28,29), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 3, 1, 2, 3, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (27,255,'2.3','A','C'),
      (28,256,'2.3','C','B'),
      (29,257,'2.3',null,'D')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, '60a2d13b-08c2-44ed-acd8-0cdbb9da766f', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.4: Q25,26
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '34982203-64ae-4486-8ee5-ce125f29993c', '785255cd-8e56-4844-acfb-f014e1c265a2', 'questao', 7.22,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 25,26, unidade 2.4. 1 de 2 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (7.22 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
ERROS:
  Q26 tubuloes, base: marcou 1,5 m e 2,5 m; gabarito 1,8 m e 3,0 m. NBR 6122:2022, 8.2.3.6.1 (lida na pasta): base com altura de ate 1,8 m; a ar comprimido, ate 3,0 m.$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.4',
            'questoes_da_prova', jsonb_build_array(25,26), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 2, 1, 1, 2, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (25,253,'2.4',null,'B'),
      (26,254,'2.4','B','A')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, '785255cd-8e56-4844-acfb-f014e1c265a2', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.6: Q23,24
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '910b8aaf-105a-4a84-9835-59c27ff21c6b', '48c93813-9322-4138-89fe-13fc383479d2', 'questao', 7.22,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 23,24, unidade 2.6. 2 de 2 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (7.22 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.6',
            'questoes_da_prova', jsonb_build_array(23,24), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 2, 2, 0, 2, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (23,251,'2.6',null,'A'),
      (24,252,'2.6',null,'C')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, '48c93813-9322-4138-89fe-13fc383479d2', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.7: Q30,31,36,37
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '34982203-64ae-4486-8ee5-ce125f29993c', '5f4ea566-b524-4991-b143-4a201ce97889', 'questao', 14.44,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 30,31,36,37, unidade 2.7. 2 de 4 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (14.44 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
ERROS:
  Q30 grelhas e tampas (NBR 9050): marcou V,F,V,V; gabarito F,V,V,V. Item I falso: tampas NAO podem ter textura semelhante a sinalizacao tatil (6.3.6). Item II verdadeiro: vaos de ate 15 mm quando nao for possivel manter a grelha fora do fluxo (6.3.5).
  Q37 iluminacao natural (habitacoes): marcou peitoril max 1,20 m e testeira max 2,00 m; gabarito peitoril max 1,00 m e testeira max 2,20 m. NAO conferido: a norma de origem nao esta na pasta (busca por peitoril/testeira em NBR 15575-1 e -4 sem resultado).$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.7',
            'questoes_da_prova', jsonb_build_array(30,31,36,37), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 4, 2, 2, 4, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (30,258,'2.7','B','D'),
      (31,259,'2.7',null,'C'),
      (36,264,'2.7',null,'A'),
      (37,265,'2.7','B','A')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, '5f4ea566-b524-4991-b143-4a201ce97889', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.8: Q35
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '34982203-64ae-4486-8ee5-ce125f29993c', 'ddd67ebd-10d5-4336-87fe-dd77074e1aba', 'questao', 3.61,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 35, unidade 2.8. 1 de 1 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (3.61 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.8',
            'questoes_da_prova', jsonb_build_array(35), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 1, 1, 0, 1, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (35,263,'2.8',null,'A')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, 'ddd67ebd-10d5-4336-87fe-dd77074e1aba', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.9: Q32,33,34
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '34982203-64ae-4486-8ee5-ce125f29993c', 'd48cbdc9-0ac2-42c4-ae6b-d75d490a4507', 'questao', 10.83,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 32,33,34, unidade 2.9. 2 de 3 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (10.83 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
ERROS:
  Q34 NR-35, SPQ: marcou "avaliacao previa, capacitado"; gabarito "Analise de Risco (AR), qualificado". A AR precede todo trabalho em altura (folha NR-35 da pasta). O termo "qualificado" nao foi conferido no texto da pasta.$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.9',
            'questoes_da_prova', jsonb_build_array(32,33,34), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 3, 2, 1, 3, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (32,260,'2.9',null,'D'),
      (33,261,'2.9',null,'A'),
      (34,262,'2.9','B','D')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, 'd48cbdc9-0ac2-42c4-ae6b-d75d490a4507', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;
  -- unidade 2.11: Q38,39,40
  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, '0b88ae96-52c2-44e5-aadf-e6bd54d7091f', '850d07ed-3823-40af-9fb4-c402cdc6b120', 'questao', 10.83,
$n$Prova de CORONEL VIVIDA-PR (FAFIPA, Engenheiro Civil), questoes 38,39,40, unidade 2.11. 3 de 3 acertos.
Resolvidas somente as 18 questoes de Engenharia Civil que valem para Curitiba (Q23 a Q40) em 65 min no total; tempo RATEADO por numero de questoes (10.83 min nesta unidade). As Q19 a Q22 (legislacao do proprio municipio) e as de LP, Matematica e Conhecimentos Gerais nao foram resolvidas. Gabarito PRELIMINAR da banca (lido na copia da area do candidato); nao conferido com o definitivo. Acertos informados por diferenca: o usuario enviou so as telas das 6 questoes erradas.
$n$, 'ativo',
          jsonb_build_object('origem','migration 0136','prova','Coronel Vivida-PR (FAFIPA, Eng. Civil)','unidade','2.11',
            'questoes_da_prova', jsonb_build_array(38,39,40), 'duracao_e_estimativa', true,
            'duracao_medida_do_total', 65, 'criterio_do_rateio','proporcional ao numero de questoes',
            'gabarito','preliminar da banca','acertos_por_diferenca', true, 'hora_estimada', true))
  returning id into v_sess;
  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score_is_estimate, metadata)
  values (v_user, v_sess, 3, 3, 0, 3, 0, false,
          jsonb_build_object('gabarito','preliminar da banca'));
  for r in select * from (values
      (38,266,'2.11',null,'C'),
      (39,267,'2.11',null,'D'),
      (40,268,'2.11',null,'A')
    ) as t(qprova, qcad, unidade, marcada, gab) order by qprova
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, '850d07ed-3823-40af-9fb4-c402cdc6b120', 'FAFIPA-CAD-' || r.qcad, 2026,
            jsonb_strip_nulls(jsonb_build_object('caderno','FAFIPA','questao_caderno',r.qcad,'unidade',r.unidade,
              'gabarito',r.gab,'marcada',coalesce(r.marcada, r.gab),'prova_origem','CORONEL VIVIDA',
              'questao_origem',r.qprova,'gabarito_preliminar',true,'marcada_inferida',(r.marcada is null))),
            jsonb_build_object('carregado_por','migration 0136'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa',
            jsonb_build_object('carregado_por','migration 0136'));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;

  if n_tot <> 18 then raise exception '0136: esperava 18 questoes, inseri %', n_tot; end if;
  if n_ok  <> 12 then raise exception '0136: esperava 12 acertos, contei %', n_ok; end if;
  raise notice '0136: Coronel Vivida registrada: 12/18';
end $$;
