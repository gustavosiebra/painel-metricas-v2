-- 0114 — Simulado 01 do Projeto Sensei (Prefeitura de Curitiba), 12/11/2026
--
-- AUTORIZADO pelo usuario em 13/11/2026: "fiz o simulado do sensei ... registre
-- no painel e no mapa, faremos as mesmas analises anteriores e registre os erros."
--
-- ============================================================
-- A PROVA
-- ============================================================
-- "SIMULADO 01 - PROJETO SENSEI PREFEITURA DE CURITIBA", 40 questoes, 240 min.
-- Arquivo: FAFIPA/SIMULADOS/simuladoSensei.pdf (digitalizado, sem camada de
-- texto; lido por renderizacao de pagina em imagem).
--
-- Estrutura, identica ao edital 5/2026-PMC:
--   Lingua Portuguesa     questoes 01-05
--   Informatica           questoes 06-10
--   Conhecimentos Espec.  questoes 11-40
--
-- BANCA: Sensei da Aprovacao, NAO e FAFIPA. As questoes sao compiladas de
-- varias bancas (IPREMED 2021 nas de LP, entre outras) e algumas sao autorais.
-- Por isso NAO entra no benchmark por prova de origem (migration 0097) nem na
-- serie dos simulados FAFIPA: tags.banca = 'SENSEI' e tags.simulado ausente.
--
-- ============================================================
-- RESULTADO
-- ============================================================
--   32 / 40 acertos = 80,0%   |   64,00 pontos na escala de Curitiba (2,00/q)
--   tempo: 89 min de 240 permitidos (37%), 2,2 min por questao
--
--   Lingua Portuguesa      5/5   100,0%
--   Informatica            5/5   100,0%
--   Conhecimentos Espec.  22/30   73,3%
--
-- TODOS os 8 erros estao em Conhecimentos Especificos.
--
-- RESSALVA METODOLOGICA, IMPORTANTE: o gabarito oficial esta na plataforma
-- Planeja e NAO foi fornecido. A correcao aqui e AUTODECLARADA: ele informou os
-- 8 numeros que errou e a letra que marcou. As 32 restantes estao gravadas como
-- acerto por diferenca, sem verificacao independente. score_is_estimate = true.
--
-- ============================================================
-- POR UNIDADE DO EDITAL (os 30 de CE)
-- ============================================================
--   2.1  Legislacao .................  2/4   50,0%   erros 24, 27
--   2.3  Estruturas .................  1/2   50,0%   erro  16
--   2.4  Geologia/Geotecnia .........  3/4   75,0%   erro  22
--   2.5  Hidrologia/Drenagem ........  0/2    0,0%   erros 32, 33
--   2.6  Saneamento ................. 6/7   85,7%   erro  31
--   2.8  Planejamento/Orcamento .....  1/1  100,0%
--   2.9  Patologia/Seguranca ........  2/2  100,0%
--   2.10 Avaliacoes/Pericias ........  2/2  100,0%
--   2.11 Licitacoes e Contratos .....  5/5  100,0%
--   IND  Instalacoes eletricas ......  0/1    0,0%   erro  20
--
-- A questao 20 e NBR 5410 (tempo de seccionamento). Nao consegui mapear
-- "instalacoes eletricas prediais" em nenhuma das 11 unidades 2.1 a 2.11 sem o
-- texto dos subitens do edital, que nao esta nos arquivos. Fica em 'IND' ate o
-- usuario confirmar. Mesma duvida vale, em menor grau, para as hidraulicas
-- prediais (14, 15, 21, 23), que coloquei em 2.6.
--
-- ============================================================
-- OS DOIS ACHADOS QUE IMPORTAM
-- ============================================================
-- 1. LEGISLACAO DE CURITIBA DE VERDADE: 2/4.
--    Este simulado cobra a lei real — Lei 15.511/2019 (eixos estruturantes),
--    Decreto Municipal 1.206/2023, Codigo de Obras e Posturas de Curitiba, Lei
--    Organica de Curitiba. Ele errou 24 (eixos) e 27 (orcamento na Lei
--    Organica): 50%.
--    No caderno FAFIPA a unidade 2.1 marcava 77,8% — mas aquele numero vem
--    majoritariamente de codigos de obras de OUTROS municipios (ver migrations
--    0104 e 0113). Primeira medicao contra Curitiba real, e ela e 27,8 pontos
--    percentuais pior. A 2.1 vale 16,0% do edital.
--
-- 2. HIDROLOGIA: 0/2.
--    Em 12/11 eu disse a ele que a FAFIPA historicamente quase nao cobra 2.5
--    (2,0% do acervo, 0 de 20 no PARANAEDUCACAO) e que a exposicao era menor do
--    que o peso do edital sugeria. Este simulado, montado para o edital de
--    Curitiba, trouxe 2 de 30 (6,7%) e ele zerou as duas.
--    n=2 nao decide nada sozinho. Mas a amostra medida de 2.5 passa de 10
--    questoes (90,0%) para 12 (9/12 = 75,0%), e os 90% que o Mapa reportava
--    eram, como eu disse, o ponto mais otimista de uma faixa larga.
--    O historico TEC dele em 2.5 e 56,1% em 150 questoes.
--
-- ============================================================
-- GABARITOS QUE CONSEGUI DETERMINAR PELA NORMA (nao sao oficiais)
-- ============================================================
--   16 -> D (200). NBR 6118, item 15.8.1: para Nd >= 0,10 fcd Ac o indice de
--         esbeltez nao pode ultrapassar 200. Ele marcou C (140).
--   20 -> C (0,40 s; ate 5,0 s). NBR 5410, Tabela 25, esquema TN, Uo = 220 V,
--         situacao 1. Ele marcou A.
--   22 -> C (100 estacas). NBR 6122, Tabela 6, helice continua monitorada e
--         pre-moldadas. Ele marcou A (50).
--   31 -> B (chuveiro de emergencia e lava-olhos). NBR 12216, item 5.21.4.
--         Ele marcou E.
--   32 -> C (controle de lancamentos, zoneamento, educacao ambiental sao as
--         medidas NAO estruturais). Ele marcou B (jardins de chuva e telhados
--         verdes, que sao estruturais compensatorias).
--   33 -> C (diques e polders sao estruturais intensivas e transferem a cheia
--         para jusante). Ele marcou D.
--   24 -> EM ABERTO. Nao tenho o texto da Lei 15.511/2019. Ele marcou C.
--   27 -> EM ABERTO. Nao conferi a Lei Organica de Curitiba. Ele marcou D.
--         A alternativa C reproduz a redacao do art. 168 da CF (entrega ate o
--         dia vinte de cada mes), o que a torna a candidata mais provavel, mas
--         NAO confirmei e nao registro palpite como gabarito.
--   O gabarito oficial das 8 esta no Planeja. Pedir ao usuario.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_disc uuid := '9c5b311e-c889-4442-bb0b-1a4a9689cccb';
  v_set  uuid;
  v_sess uuid;
  r record;
  v_q uuid;
  n_ok int := 0; n_tot int := 0;
begin
  -- conjunto proprio, para nao misturar com os simulados FAFIPA
  select id into v_set from public.question_sets
   where user_id = v_user and name = 'Simulado Sensei 01 — Prefeitura de Curitiba';
  if v_set is null then
    insert into public.question_sets(user_id, discipline_id, name, source, status, learning_level, metadata)
    values (v_user, v_disc, 'Simulado Sensei 01 — Prefeitura de Curitiba',
            'Projeto Sensei da Aprovacao — planeja.senseiconcursos.com.br', 'ativo', 'novo',
            jsonb_build_object(
              'banca','SENSEI',
              'formato','40 questoes: LP 01-05, INF 06-10, CE 11-40 (igual ao edital 5/2026-PMC)',
              'tempo_oficial_min',240,
              'arquivo','FAFIPA/SIMULADOS/simuladoSensei.pdf',
              'observacao','questoes compiladas de varias bancas e autorais; NAO e FAFIPA, nao entra no benchmark por prova de origem'))
    returning id into v_set;
  end if;

  insert into public.study_sessions(user_id, occurred_at, discipline_id, question_set_id,
                                    study_type, duration_minutes, notes, status, metadata)
  values (v_user, '2026-11-12 20:00:00-03', v_disc, v_set, 'simulado', 89,
          'Simulado 01 do Projeto Sensei para a Prefeitura de Curitiba. 40 questoes em 89 min de 240 permitidos. 32 acertos. Correcao autodeclarada: o gabarito oficial esta na plataforma Planeja e nao foi fornecido.',
          'ativo',
          jsonb_build_object(
            'banca','SENSEI',
            'tempo_permitido_min',240,
            'tempo_usado_pct',37.1,
            'min_por_questao',2.2,
            'pontos_escala_curitiba',64.00,
            'correcao','autodeclarada: usuario informou os 8 numeros errados e a letra marcada'))
  returning id into v_sess;

  -- (numero, bloco, unidade, letra marcada quando errou)
  for r in
    select * from (values
      ( 1,'LP' ,'1.1.LP', null), ( 2,'LP' ,'1.1.LP', null), ( 3,'LP' ,'1.1.LP', null),
      ( 4,'LP' ,'1.1.LP', null), ( 5,'LP' ,'1.1.LP', null),
      ( 6,'INF','1.2.INF',null), ( 7,'INF','1.2.INF',null), ( 8,'INF','1.2.INF',null),
      ( 9,'INF','1.2.INF',null), (10,'INF','1.2.INF',null),
      (11,'CE','2.4' ,null), (12,'CE','2.4' ,null), (13,'CE','2.4' ,null),
      (14,'CE','2.6' ,null), (15,'CE','2.6' ,null),
      (16,'CE','2.3' ,'C' ), (17,'CE','2.9' ,null), (18,'CE','2.9' ,null),
      (19,'CE','2.3' ,null), (20,'CE','IND' ,'A' ), (21,'CE','2.6' ,null),
      (22,'CE','2.4' ,'A' ), (23,'CE','2.6' ,null), (24,'CE','2.1' ,'C' ),
      (25,'CE','2.11',null), (26,'CE','2.1' ,null), (27,'CE','2.1' ,'D' ),
      (28,'CE','2.1' ,null), (29,'CE','2.6' ,null), (30,'CE','2.6' ,null),
      (31,'CE','2.6' ,'E' ), (32,'CE','2.5' ,'B' ), (33,'CE','2.5' ,'D' ),
      (34,'CE','2.11',null), (35,'CE','2.11',null), (36,'CE','2.11',null),
      (37,'CE','2.11',null), (38,'CE','2.10',null), (39,'CE','2.10',null),
      (40,'CE','2.8' ,null)
    ) as t(q, bloco, unidade, marcada)
    order by 1
  loop
    insert into public.questions(user_id, question_set_id, external_id, year, tags)
    values (v_user, v_set,
            'SENSEI01-' || lpad(r.q::text,2,'0'), 2026,
            jsonb_strip_nulls(jsonb_build_object(
              'banca','SENSEI',
              'sensei', 1,
              'questao_sensei', r.q,
              'bloco', r.bloco,
              'unidade', r.unidade,
              'prova_origem','SENSEI 01 - Curitiba',
              'marcada', r.marcada,
              'gabarito_oficial_indisponivel', true)))
    returning id into v_q;

    insert into public.question_attempts(user_id, question_id, session_id, attempted_at,
                                         is_correct, contact_type)
    values (v_user, v_q, v_sess, '2026-11-12 20:00:00-03',
            (r.marcada is null), 'primeira_tentativa');

    n_tot := n_tot + 1;
    if r.marcada is null then n_ok := n_ok + 1; end if;
  end loop;

  if n_tot <> 40 then raise exception '0114: esperava 40 questoes, inseri %', n_tot; end if;
  if n_ok  <> 32 then raise exception '0114: esperava 32 acertos, contei %',  n_ok;  end if;

  insert into public.session_results(user_id, session_id, questions_total, correct_total,
                                     wrong_total, new_questions, review_questions,
                                     score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 32, 8, 40, 0, 64.00, true,
          jsonb_build_object(
            'escala','2,00 pontos por questao, igual ao edital 5/2026-PMC (80 na objetiva)',
            'por_bloco', jsonb_build_object(
              'LP',  jsonb_build_object('n',5,'acertos',5,'pct',100.0),
              'INF', jsonb_build_object('n',5,'acertos',5,'pct',100.0),
              'CE',  jsonb_build_object('n',30,'acertos',22,'pct',73.3)),
            'score_is_estimate_porque','gabarito oficial esta no Planeja e nao foi fornecido; correcao autodeclarada pelo usuario'));

  -- gabaritos determinados pela norma, nao oficiais
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','D',
         'gabarito_fonte','ABNT NBR 6118, item 15.8.1: para Nd >= 0,10 fcd Ac o indice de esbeltez nao pode ultrapassar 200','gabarito_confianca','alta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=16;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','C',
         'gabarito_fonte','ABNT NBR 5410, Tabela 25: esquema TN, Uo=220V, situacao 1, tempo 0,40 s; excecao de 5,0 s para circuitos de distribuicao e terminais que alimentem so equipamentos fixos','gabarito_confianca','alta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=20;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','C',
         'gabarito_fonte','ABNT NBR 6122, item 9.2.2.1 e Tabela 6: helice continua monitorada e pre-moldadas, 100 estacas','gabarito_confianca','media')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=22;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','B',
         'gabarito_fonte','ABNT NBR 12216, item 5.21.4: chuveiro de emergencia e dispositivo lava-olhos','gabarito_confianca','alta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=31;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','C',
         'gabarito_fonte','medidas NAO estruturais de drenagem sao as de gestao: controle de lancamentos, zoneamento urbano, educacao ambiental. Jardim de chuva e telhado verde sao estruturais compensatorias','gabarito_confianca','alta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=32;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado','C',
         'gabarito_fonte','diques e polders sao medidas estruturais INTENSIVAS, agem no leito, aceleram o escoamento e podem transferir a cheia para jusante','gabarito_confianca','alta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=33;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado', null,
         'gabarito_fonte','EM ABERTO: nao tenho o texto da Lei Municipal 15.511/2019 de Curitiba','gabarito_confianca','aberta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=24;
  update public.questions
     set tags = tags || jsonb_build_object('gabarito_determinado', null,
         'gabarito_fonte','EM ABERTO: nao conferi a Lei Organica de Curitiba. A alternativa C reproduz a redacao do art. 168 da CF (entrega ate o dia vinte de cada mes) e e a candidata mais provavel, mas nao foi confirmada','gabarito_confianca','aberta')
   where user_id=v_user and tags->>'banca'='SENSEI' and (tags->>'questao_sensei')::int=27;

  raise notice '0114: Sensei 01 gravado — 40 questoes, 32 acertos, 89 min';
end $$;
