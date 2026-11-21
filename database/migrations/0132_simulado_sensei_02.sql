-- 0132 - Simulado 02 do Projeto Sensei (Prefeitura de Curitiba), 21/11/2026
--
-- AUTORIZADO pelo usuario em 21/11/2026: "adicione as infos no painel, mapa,
-- caderno e classifique os erros / vamos continuar as mesmas analises de sempre".
--
-- Tudo em UMA migration, na ordem que a 0114+0115+0116+0117 levaram quatro para
-- acertar: sessao COM exam_id e board_id, study_session_boards, e exam_attempt
-- (alimenta a tabela Historico). tags.banca='SENSEI' faz as views derivarem a
-- origem 'sensei' (migration 0115). Sem tags.simulado, fora da serie FAFIPA.
--
-- PROVA: SIMULADO 2 - PROJETO SENSEI CURITIBA, 40 questoes (LP 01-05, INF 06-10,
-- CE 11-40). Arquivo FAFIPA/SIMULADOS/simuladoSensei_2.pdf (digitalizado).
--
-- RESULTADO (ranking do Planeja): 30/40 = 60,00 pontos | 57 min de 240.
--   Turma: 3 participantes. Gauderio 33/7 (1h04), MFGDAP 31/9 (56 min), usuario
--   30/10 (57 min): 3o de 3. Media da turma 31,3. n=3 NAO permite delta por assunto.
--   Aberto ate 30/11/2026 17:41; a turma pode crescer.
--   LP 3/5 | INF 4/5 | CE 23/30 (76,7%)
--
-- RESSALVA: gabarito oficial NAO foi fornecido (esta no Planeja). Correcao
-- AUTODECLARADA: usuario informou os 10 numeros e as letras marcadas; as 30
-- restantes entram como acerto por diferenca, sem verificacao independente.
-- score_is_estimate = true. A HORA da sessao (10:00) e arbitraria.
--
-- ERROS (marcada -> gabarito determinado por mim, NAO oficial):
--   01 C -> A  (media)  interpretar x compreender; inferencia = "interpretar"
--   02 A -> D  (alta)   hiperbole
--   06 C -> A  (alta)   Word 2016: Referencias > Inserir Nota de Rodape
--   15 B -> D  (alta)   TCPO (FAFIPA Bombinhas-SC 2009; gabarito da banca nao conferido)
--   18 C -> B  (alta)   DNIT 107/2009-ES, 8.1.3, texto lido no PDF oficial
--   20 D -> A  (media)  NBR 12209:2011, por eliminacao; norma NAO consultada
--   24 B -> C  (media)  NBR 5410 4.2.1.2.3, 1,50 m; confirmado so em fonte secundaria
--   30 D -> B  (alta)   NBR 6118 18.3.3.2: 0,6d e 300 mm; de memoria, norma nao consultada
--   31 A -> C  (alta)   solo colapsivel (FAFIPA Toledo-PR 2015)
--   37 B -> A  (media)  ZROC de Curitiba; lei nao consultada, alternativas absurdas
--
-- POR UNIDADE (CE): 2.1 3/4 (erro 37) | 2.2 1/1 | 2.3 3/4 (erro 30) | 2.4 3/4 (erro 31)
--   2.5 3/4 (erro 18) | 2.6 3/4 (erro 20) | 2.8 1/2 (erro 15) | 2.9 2/2 | 2.11 4/4 | IND 0/1 (erro 24)
-- Classificacao feita por mim lendo cada enunciado; 18 (terraplenagem) em 2.5,
-- 33/34 (fundacoes) em 2.4, 10 (atalho do Chrome) em 1.2.10 sao escolhas de fronteira.

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam  uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_board uuid := '7f5d84db-b2c4-4548-be17-372fea7cb07a';  -- Multibanca
  v_tpl   uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';  -- PMC Curitiba
  v_b_lp  uuid := '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f';
  v_b_inf uuid := 'ae44d810-271a-4e27-858f-520cbb7cd67b';
  v_b_ce  uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
  v_ts    timestamptz := '2026-11-21 10:00:00-03';
  v_set uuid; v_sess uuid; v_att uuid; v_q uuid;
  r record;
  n_tot int := 0; n_ok int := 0;
begin
  if exists (select 1 from public.question_sets
              where user_id=v_user and name='Simulado Sensei 02 — Prefeitura de Curitiba') then
    raise notice '0132: Sensei 02 ja existe; nada a fazer'; return;
  end if;

  -- question_sets.discipline_id e NOT NULL; mesma disciplina do conjunto do Sensei 01 (0114)
  insert into public.question_sets(user_id, exam_id, discipline_id, name, source, status, learning_level, metadata)
  values (v_user, v_exam, '9c5b311e-c889-4442-bb0b-1a4a9689cccb', 'Simulado Sensei 02 — Prefeitura de Curitiba',
          'Projeto Sensei da Aprovacao — planeja.senseiconcursos.com.br', 'ativo', 'novo',
          jsonb_build_object('banca','SENSEI',
            'formato','40 questoes: LP 01-05, INF 06-10, CE 11-40 (igual ao edital 5/2026-PMC)',
            'tempo_oficial_min',240,'arquivo','FAFIPA/SIMULADOS/simuladoSensei_2.pdf',
            'observacao','compilado de varias bancas (inclui FAFIPA Bombinhas 2009, Toledo 2015, Cariacica 2010) e autorais; NAO e FAFIPA'))
  returning id into v_set;

  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, v_board, null, v_set, 'simulado', 57,
          'Simulado 02 do Projeto Sensei (Curitiba). 40 questoes em 57 min de 240. 30 acertos = 60/80. 3o de 3 na turma (media 31,3). LP 3/5, INF 4/5, CE 23/30. Correcao autodeclarada: gabarito oficial no Planeja, nao fornecido. Hora arbitraria.',
          'ativo',
          jsonb_build_object('banca','SENSEI','sensei',2,'tempo_permitido_min',240,'tempo_usado_pct',23.8,
            'min_por_questao',1.4,'pontos_escala_curitiba',60.00,'hora_estimada',true,
            'correcao','autodeclarada: usuario informou os 10 numeros errados e a letra marcada',
            'ranking', jsonb_build_object('posicao',3,'de',3,'media_turma_acertos',31.3,
              'outros', jsonb_build_array(
                 jsonb_build_object('nome','Gauderio','acertos',33,'erros',7,'tempo','1h04'),
                 jsonb_build_object('nome','MFGDAP','acertos',31,'erros',9,'tempo','56min')),
              'aberto_ate','2026-11-30 17:41','criterio_desempate','tempo','amostra','n=3, nao sustenta delta por assunto')))
  returning id into v_sess;

  insert into public.study_session_boards(user_id, session_id, board_id) values (v_user, v_sess, v_board);

  -- (numero, bloco, unidade, marcada se errou, gabarito determinado, confianca, fonte)
  for r in
    select * from (values
      ( 1,'LP' ,'1.1.1' ,'C','A','media','interpretar = inferir (chateada, entristecida ou preocupada sao hipoteses); compreender = o que o texto diz. Sem fonte externa; coerente com C estar errada'),
      ( 2,'LP' ,'1.1.12','A','D','alta' ,'hiperbole: exagero expressivo (um milhao de vezes; morrendo de fome)'),
      ( 3,'LP' ,'1.1.8' ,null,null,null,null), ( 4,'LP' ,'1.1.6' ,null,null,null,null),
      ( 5,'LP' ,'1.1.4' ,null,null,null,null),
      ( 6,'INF','1.2.8' ,'C','A','alta' ,'Word 2016: aba Referencias, grupo Notas de Rodape, Inserir Nota de Rodape'),
      ( 7,'INF','1.2.8' ,null,null,null,null), ( 8,'INF','1.2.6' ,null,null,null,null),
      ( 9,'INF','1.2.3' ,null,null,null,null), (10,'INF','1.2.10',null,null,null,null),
      (11,'CE','2.11',null,null,null,null), (12,'CE','2.11',null,null,null,null),
      (13,'CE','2.11',null,null,null,null), (14,'CE','2.11',null,null,null,null),
      (15,'CE','2.8' ,'B','D','alta' ,'TCPO (Tabelas de Composicoes de Precos para Orcamentos, PINI). Questao FAFIPA Bombinhas-SC 2009; gabarito oficial da banca nao conferido'),
      (16,'CE','2.9' ,null,null,null,null), (17,'CE','2.8' ,null,null,null,null),
      (18,'CE','2.5' ,'C','B','alta' ,'DNIT 107/2009-ES, item 8.1.3 (texto lido no PDF oficial gov.br): extensao axial entre o centro de gravidade de cada emprestimo e o centro de gravidade do segmento de aterro em construcao'),
      (19,'CE','2.5' ,null,null,null,null),
      (20,'CE','2.6' ,'D','A','media','NBR 12209:2011 NAO consultada. Por eliminacao: B (SSV < 0,2 e baixo demais para alta taxa), C (recirculacao externa e admitida), D (descarte de lodo exige diametro maior que 50 mm), E (fundo deve ter declividade). Resta A'),
      (21,'CE','2.6' ,null,null,null,null), (22,'CE','2.5' ,null,null,null,null),
      (23,'CE','2.5' ,null,null,null,null),
      (24,'CE','IND' ,'B','C','media','NBR 5410 item 4.2.1.2.3: TUE a no maximo 1,5 m do equipamento. Confirmado so em fonte secundaria; a norma nao foi consultada'),
      (25,'CE','2.6' ,null,null,null,null), (26,'CE','2.6' ,null,null,null,null),
      (27,'CE','2.3' ,null,null,null,null), (28,'CE','2.3' ,null,null,null,null),
      (29,'CE','2.3' ,null,null,null,null),
      (30,'CE','2.3' ,'D','B','alta' ,'NBR 6118 item 18.3.3.2: VSd <= 0,67 VRd2 -> smax = 0,6d <= 300 mm; senao 0,3d <= 200 mm. De memoria, norma nao consultada nesta sessao'),
      (31,'CE','2.4' ,'A','C','alta' ,'solo colapsivel: brusca reducao de volume com o aumento de umidade (expansivo aumentaria). Questao FAFIPA Toledo-PR 2015'),
      (32,'CE','2.4' ,null,null,null,null), (33,'CE','2.4' ,null,null,null,null),
      (34,'CE','2.4' ,null,null,null,null), (35,'CE','2.9' ,null,null,null,null),
      (36,'CE','2.2' ,null,null,null,null),
      (37,'CE','2.1' ,'B','A','media','ZROC de Curitiba (Zona Residencial de Ocupacao Controlada): divisas do Municipio, macicos florestais, baixa densidade. Lei de zoneamento NAO consultada; demais alternativas descabidas'),
      (38,'CE','2.1' ,null,null,null,null), (39,'CE','2.1' ,null,null,null,null),
      (40,'CE','2.1' ,null,null,null,null)
    ) as t(q, bloco, unidade, marcada, gab, conf, fonte)
    order by 1
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags)
    values (v_user, v_set, 'SENSEI02-' || lpad(r.q::text,2,'0'), 2026,
            jsonb_strip_nulls(jsonb_build_object(
              'banca','SENSEI','sensei',2,'questao_sensei',r.q,'bloco',r.bloco,'unidade',r.unidade,
              'prova_origem','SENSEI 02 - Curitiba','marcada',r.marcada,
              'gabarito_oficial_indisponivel',true,
              'gabarito_determinado',r.gab,'gabarito_confianca',r.conf,'gabarito_fonte',r.fonte)))
    returning id into v_q;

    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa');
    n_tot := n_tot + 1;
    if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;

  if n_tot <> 40 then raise exception '0132: esperava 40 questoes, inseri %', n_tot; end if;
  if n_ok  <> 30 then raise exception '0132: esperava 30 acertos, contei %', n_ok; end if;

  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total,
                                     new_questions, review_questions, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 30, 10, 40, 0, 60.00, true,
          jsonb_build_object('escala','2,00 pontos por questao (80 na objetiva)',
            'por_bloco', jsonb_build_object(
              'LP',  jsonb_build_object('n',5,'acertos',3,'pct',60.0),
              'INF', jsonb_build_object('n',5,'acertos',4,'pct',80.0),
              'CE',  jsonb_build_object('n',30,'acertos',23,'pct',76.7)),
            'score_is_estimate_porque','gabarito oficial no Planeja nao fornecido; correcao autodeclarada'));

  insert into public.exam_attempts(user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, v_ts, 'simulado', 57, v_sess,
          'Simulado 02 do Projeto Sensei (Multibanca, NAO e FAFIPA). 30/40 = 60 de 80 em 57 min de 240. LP 3/5, INF 4/5, CE 23/30. 3o de 3 na turma (media 31,3). Correcao AUTODECLARADA (erros 1, 2, 6, 15, 18, 20, 24, 30, 31, 37); 30 acertos por diferenca. Hora arbitraria.')
  returning id into v_att;

  insert into public.exam_attempt_blocks(user_id, attempt_id, block_id, correct, wrong)
  values (v_user, v_att, v_b_lp, 3, 2), (v_user, v_att, v_b_inf, 4, 1), (v_user, v_att, v_b_ce, 23, 7);

  raise notice '0132: Sensei 02 gravado - 40 questoes, 30 acertos, 57 min';
end $$;
