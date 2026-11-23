-- 0135 - Simulado FAFIPA 13 (Prefeitura de Curitiba), 23/11/2026
--
-- AUTORIZADO pelo usuario em 23/11/2026: enviou o resumo gerado por Simulado_13.html
-- ("Simulado 13 FAFIPA - 34/40 (68/80) ...") dentro da rotina de sempre
-- (painel, Mapa, caderno de reteste, classificar erros).
--
-- RESULTADO: 34/40 = 85,0% | 68 de 80 pontos | 54 min de 240. NOVO RECORDE da serie
--   (maximo anterior 33: simulados 10 e 12). LP 4/5 | INF 5/5 | CE 25/30.
--   Serie de acertos: 30,31,31,31,32,29,28,28,32,33,28,33,34 (n=13, media 30,77).
--   Serie de CE: 23,22,22,24,24,21,20,19,22,24,19,24,25.
-- CORRECAO: automatica, pelo gabarito DEFINITIVO da banca embutido no HTML (errata
--   08/11/2026: so a Q27 mudou, B -> C). Nao e autodeclarada. Hora da sessao (14:00)
--   e arbitraria; duracao e tempo por questao vieram do cronometro do HTML.
--
-- ERROS (6): marcada -> gabarito, confianca declarada, segundos
--   Q04 C -> D  LP 1.1.6   funcao de "que" (pronome relativo, nao conjuncao)  dúvida   164 s
--   Q12 C -> B  CE 2.3     aco: ponto de contencao lateral; B (no de portico com
--                          ligacoes articuladas) NAO e valido                  chute    195 s
--   Q16 D -> E  CE 2.1     obras sujeitas a mera Licenca (Codigo de Obras de MATINHOS,
--                          nao de Curitiba); errou 2 dos 5 itens (3 e 4)       chute    190 s
--   Q27 B -> C  CE 2.4     fundacoes profundas V/F; B era o gabarito PRELIMINAR,
--                          o definitivo e C (muda o item 1)                    duvida   104 s
--   Q29 D -> A  CE 2.3     concreto simples com armadura de distribuicao: a armadura
--                          so controla fissuracao e nao entra no calculo        CERTEZA  155 s
--   Q40 A -> B  CE 2.7     ensaio de impacto de corpo duro = corpo de massa e forma
--                          conhecidas em queda livre. MESMA questao do TEC3937713,
--                          errada em 17/11 (marcou E)                           CERTEZA   51 s
-- Q04: o 'que' foi classificado em 1.1.6 (classes de palavras); 1.1.8 (funcoes
-- sintaticas) e a outra leitura possivel; no simulado 12 a Q04 (oracao subordinada
-- adjetiva, tambem sobre 'que') foi classificada em 1.1.8.
--
-- POR UNIDADE (CE): 2.1 3/4 | 2.2 1/1 | 2.3 0/2 | 2.4 1/2 | 2.5 2/2 | 2.6 3/3 | 2.7 5/6
--   | 2.9 4/4 | 2.11 6/6 (2.8 e 2.10 sem questao). LP: 1.1.1 2/2, 1.1.3 1/1, 1.1.6 0/1,
--   1.1.7 1/1. INF: 1.2.7, 1.2.9, 1.2.11, 1.2.13, 1.2.14 todas 1/1.
-- Fronteiras de classificacao: Q35 e Q40 (NBR 15575, desempenho) em 2.7 como nos
-- simulados anteriores; Q19 e Q30 (ambiental e aterro sanitario) em 2.6; Q25 (poder
-- de policia edilicio) em 2.1; Q24 (NR-18, rotulado "Instalacoes prediais" no PDF) em 2.9.
-- Q23 e Q28 sao as questoes substituidas em 31/10 (rotulo do PDF).

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam  uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_tpl   uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';  -- PMC Curitiba
  v_b_lp  uuid := '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f';
  v_b_inf uuid := 'ae44d810-271a-4e27-858f-520cbb7cd67b';
  v_b_ce  uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
  v_disc  uuid := '9c5b311e-c889-4442-bb0b-1a4a9689cccb';  -- mesma dos question_sets tecnicos da 0095
  v_ts    timestamptz := '2026-11-23 14:00:00-03';
  v_set uuid; v_sess uuid; v_att uuid; v_q uuid;
  r record; n_tot int := 0; n_ok int := 0;
begin
  if exists (select 1 from public.question_sets where user_id=v_user and name='Simulado FAFIPA no 13 (questoes)') then
    raise notice '0135: Simulado 13 ja existe; nada a fazer'; return;
  end if;

  insert into public.question_sets(user_id, discipline_id, exam_id, name, source, status, metadata)
  values (v_user, v_disc, v_exam, 'Simulado FAFIPA no 13 (questoes)',
          'simulado proprio montado a partir de provas FAFIPA', 'inativo',
          jsonb_build_object('origem','migration 0135','simulado',13,
            'observacao','question_set tecnico, criado so para satisfazer a FK NOT NULL de questions.question_set_id; status inativo de proposito'))
  returning id into v_set;

  insert into public.study_sessions(user_id, occurred_at, exam_id, board_id, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, v_ts, v_exam, null, null, null, 'simulado', 54,
$n$Simulado FAFIPA no 13 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 34/40 = 85,0%. Pontuacao ponderada 68 de 80. Tempo 54 min de 240 (cronometro do HTML).
LP 4/5 | INF 5/5 | CE 25/30. NOVO RECORDE da serie (maximo anterior: 33, simulados 10 e 12).
Serie de acertos: 30, 31, 31, 31, 32, 29, 28, 28, 32, 33, 28, 33, 34 (n=13, media 30,77).
Serie de CE:      23, 22, 22, 24, 24, 21, 20, 19, 22, 24, 19, 24, 25.
Correcao automatica pelo gabarito definitivo da banca (errata 08/11/2026, so a Q27 mudou B->C).

ERROS (6):
  LP 1.1.6 — Q04 funcao de "que" (pronome relativo); marcou conjuncao coordenativa explicativa. Duvida, 164 s.
             Segundo simulado seguido com erro sobre o "que" (S12 Q04, oracao subordinada adjetiva).
  2.3 Estruturas — DOIS erros, 0/2:
    Q12 aco, ponto de contencao lateral: marcou C; a invalida e B (no de portico com ligacoes
        articuladas). Chute, 195 s.
    Q29 concreto simples com malha de distribuicao: armadura so para controle de fissuracao, nao
        contabilizada na resistencia (A); marcou D (recalcular como concreto armado). CERTEZA, 155 s.
  2.4 Fundacoes — Q27 V/F de fundacoes profundas; marcou B, que era o gabarito PRELIMINAR. O
        definitivo e C (primeiro item e F). Duvida, 104 s.
  2.1 Legislacao — Q16 obras sujeitas a mera Licenca (provavel Codigo de Obras de MATINHOS (inferencia), nao de Curitiba);
        marcou V,V,F,V,V; gabarito V,V,V,F,V (erro nos itens 3 e 4). Chute, 190 s.
  2.7 — Q40 resistencia a impacto de corpo duro: corpo de massa e forma conhecidas em queda livre (B);
        marcou A. CERTEZA, 51 s. E a MESMA questao do TEC3937713 (SESA PR 2026), errada em 17/11.

O QUE ESTE SIMULADO MOSTRA:
  Confianca declarada: certeza 29/31 (93,5%); duvida 4/6 (66,7%); chute 0/2; sem marcar 1/1.
  Calibracao boa. Os dois erros com CERTEZA sao os que importam: Q29 (norma de concreto) e Q40
  (repeticao de erro ja registrado no TEC).
  2.3 Estruturas zera (0/2): acumulado nos simulados (classificacao atual do painel) passa a 23/36 = 63,9%; so 2.7 esta pior (16/30 = 53,3%).
  Tempo: 54 min, o mais rapido da serie FAFIPA (anterior: 55 min). Mais demoradas: Q01 295 s (texto-base), Q12 195 s,
  Q16 190 s, Q24 181 s, Q04 164 s, Q19 164 s.

ACUMULADO (13 simulados, 520 questoes; LP e INF por bloco do caderno, CE por classificacao): LP 53/65 = 81,5% | INF 58/65 = 89,2% | CE 289/390 = 74,1%
TOTAL 400/520 = 76,9%.$n$,
          'ativo',
          jsonb_build_object('corte',48,'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
            'erros', jsonb_build_array(4,12,16,27,29,40),
            'marcadas', jsonb_build_object('4','C','12','C','16','D','27','B','29','D','40','A'),
            'gabaritos', jsonb_build_object('4','D','12','B','16','E','27','C','29','A','40','B'),
            'confianca_por_questao', '1c 2c 3- 4d 5c 6c 7c 8c 9c 10c 11c 12x 13c 14c 15c 16x 17c 18c 19c 20c 21c 22c 23d 24c 25c 26c 27d 28c 29c 30c 31c 32c 33d 34c 35d 36c 37c 38d 39c 40c',
            'confianca_resumo', jsonb_build_object('certeza','29/31','duvida','4/6','chute','0/2','sem_marcar','1/1'),
            'tempo_por_questao_s', '1:295 2:71 3:99 4:164 5:80 6:30 7:28 8:16 9:27 10:39 11:51 12:195 13:24 14:31 15:12 16:190 17:30 18:141 19:164 20:78 21:44 22:65 23:118 24:181 25:70 26:74 27:104 28:69 29:155 30:87 31:80 32:43 33:71 34:56 35:32 36:33 37:21 38:79 39:36 40:51',
            'revisar_depois', jsonb_build_array(4,12,16,23,26,33),
            'recorde','34/40, acima do maximo anterior (33, simulados 10 e 12)',
            'erro_repetido', jsonb_build_object('q40','TEC3937713 (SESA PR 2026): errada no TEC em 17/11 (marcou E) e de novo hoje (marcou A) com certeza'),
            'q27_gabarito','marcou o PRELIMINAR (B); o definitivo da banca e C',
            'acumulado_serie', jsonb_build_object('ce','289/390','lp','53/65','inf','58/65','pct',76.9,'acertos',400,'questoes',520,'simulados',13),
            'por_unidade_edital', jsonb_build_object('2.1','3/4','2.2','1/1','2.3','0/2','2.4','1/2','2.5','2/2','2.6','3/3','2.7','5/6','2.9','4/4','2.11','6/6'),
            'hora_estimada', true, 'fonte_tempo','cronometro do Simulado_13.html',
            'pontuacao_maxima',80,'pontuacao_ponderada',68,'tempo_oficial_min',240))
  returning id into v_sess;

  insert into public.session_results(user_id, session_id, questions_total, correct_total, wrong_total, new_questions,
                                     review_questions, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 34, 6, 0, 0, 68, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.exam_attempts(user_id, session_id, template_id, occurred_at, duration_minutes, origem, notes)
  values (v_user, v_sess, v_tpl, v_ts, 54, 'simulado',
          'Simulado FAFIPA no 13. 34/40 = 68 de 80 pontos em 54 min. LP 4/5, INF 5/5, CE 25/30. Recorde da serie.')
  returning id into v_att;
  insert into public.exam_attempt_blocks(user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, v_b_lp, 4, 1), (v_user, v_att, v_b_inf, 5, 0), (v_user, v_att, v_b_ce, 25, 5);

  for r in
    select * from (values
      ( 1,'LP','1.1.1','MATINHOS',null,'A','c',295,'',1),
      ( 2,'LP','1.1.1','MATINHOS',null,'A','c',71,'',2),
      ( 3,'LP','1.1.3','MATINHOS',null,'C','-',99,'',3),
      ( 4,'LP','1.1.6','MATINHOS','C','D','d',164,'',4),
      ( 5,'LP','1.1.7','MATINHOS',null,'E','c',80,'',5),
      ( 6,'INF','1.2.11','MATINHOS',null,'D','c',30,'',27),
      ( 7,'INF','1.2.7','GOIORE',null,'A','c',28,'',13),
      ( 8,'INF','1.2.9','MATINHOS',null,'E','c',16,'',25),
      ( 9,'INF','1.2.14','MATINHOS',null,'B','c',27,'',30),
      (10,'INF','1.2.13','MATINHOS',null,'C','c',39,'',29),
      (11,'CE','2.6','LIDIANOPOLIS',null,'D','c',51,'',21),
      (12,'CE','2.3','PARANA EDUCACAO','C','B','x',195,'',23),
      (13,'CE','2.7','MATINHOS',null,'C','c',24,'',55),
      (14,'CE','2.7','LIDIANOPOLIS',null,'A','c',31,'',26),
      (15,'CE','2.7','RIO BRANCO DO SUL',null,'A','c',12,'',47),
      (16,'CE','2.1','MATINHOS','D','E','x',190,'',42),
      (17,'CE','2.4','NOVA SANTA RITA',null,'C','c',30,'',40),
      (18,'CE','2.5','PLANALTO',null,'C','c',141,'',19),
      (19,'CE','2.6','MATINHOS',null,'B','c',164,'',36),
      (20,'CE','2.9','RIO BRANCO DO SUL',null,'C','c',78,'',45),
      (21,'CE','2.5','CRUZ MACHADO',null,'B','c',44,'',28),
      (22,'CE','2.9','LIDIANOPOLIS',null,'A','c',65,'',18),
      (23,'CE','2.11','PRESIDENTE CASTELO BRANCO',null,'B','d',118,'',30),
      (24,'CE','2.9','JAPURA',null,'E','c',181,'',22),
      (25,'CE','2.1','GOIORE',null,'E','c',70,'',38),
      (26,'CE','2.11','SESA PR',null,'C','c',74,'',46),
      (27,'CE','2.4','PLANALTO','B','C','d',104,'',24),
      (28,'CE','2.1','GOIORE',null,'B','c',69,'',37),
      (29,'CE','2.3','LIDIANOPOLIS','D','A','c',155,'',29),
      (30,'CE','2.6','CRUZ MACHADO',null,'E','c',87,'',39),
      (31,'CE','2.11','SESA PR',null,'D','c',80,'',57),
      (32,'CE','2.11','PARANA EDUCACAO',null,'D','c',43,'',32),
      (33,'CE','2.9','SESA PR',null,'C','d',71,'',53),
      (34,'CE','2.11','PLANALTO',null,'C','c',56,'',30),
      (35,'CE','2.7','CRUZ MACHADO',null,'A','d',32,'',37),
      (36,'CE','2.2','PLANALTO',null,'D','c',33,'',25),
      (37,'CE','2.7','PARANA EDUCACAO',null,'C','c',21,'',26),
      (38,'CE','2.1','CRUZ MACHADO',null,'D','d',79,'',31),
      (39,'CE','2.11','CRUZ MACHADO',null,'C','c',36,'',36),
      (40,'CE','2.7','SESA PR','A','B','c',51,'',39)
    ) as t(q, bloco, unidade, prova, marcada, gab, conf, seg, _x, qorig)
    order by 1
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags, metadata)
    values (v_user, v_set, 'S13 Q' || lpad(r.q::text,2,'0'), 2026,
            jsonb_strip_nulls(jsonb_build_object('questao',r.q,'unidade',r.unidade,'gabarito',r.gab,'simulado',13,
              'prova_origem',r.prova,'questao_origem',r.qorig,'marcada',r.marcada)),
            jsonb_build_object('carregado_por','migration 0135'))
    returning id into v_q;
    insert into public.question_attempts(user_id, question_id, session_id, attempted_at, is_correct, contact_type,
                                         time_seconds, metadata)
    values (v_user, v_q, v_sess, v_ts, (r.marcada is null), 'primeira_tentativa', r.seg,
            jsonb_build_object('carregado_por','migration 0135','confianca',
              case r.conf when 'c' then 'certeza' when 'd' then 'duvida' when 'x' then 'chute' else 'sem_marcar' end));
    n_tot := n_tot + 1; if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;

  if n_tot <> 40 then raise exception '0135: esperava 40 questoes, inseri %', n_tot; end if;
  if n_ok  <> 34 then raise exception '0135: esperava 34 acertos, contei %', n_ok; end if;
  raise notice '0135: Simulado FAFIPA 13 registrado: 34/40';
end $$;
