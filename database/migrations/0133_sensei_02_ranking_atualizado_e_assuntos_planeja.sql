-- 0133 - Sensei 02: ranking atualizado (4 participantes) e desempenho por assunto do Planeja
--
-- AUTORIZADO pelo usuario em 22/11/2026: "teve atualizacao no ranking e trago mais
-- dados para analise e comparacao" (3 telas do Planeja).
--
-- 1. RANKING: 3o de 4 (antes 3o de 3), media da turma 30,5 (antes 31,3). Entrou
--    "Ze gotinha": 28 acertos, 12 erros, 40 min. Continua aberto ate 30/11 17:41.
--    A coluna "Turma" por assunto INCLUI o usuario: 94% so e atingivel com 15/16
--    (4 pessoas x 4 questoes); sem ele seria 11/12 = 92% ou 12/12 = 100%.
--
-- 2. ASSUNTOS DO PLANEJA gravados em metadata.planeja_por_assunto (taxonomia do
--    Sensei, que NAO e a do edital). Os totais fecham com as minhas unidades:
--    Licitacoes 4/4 = 2.11; Legislacao Curitiba 3/4 = 2.1; Estruturas de Concreto
--    3/4 = 2.3; Geotecnia e Fundacoes 3/4 = 2.4; Obras Rodoviarias 1/2 = 18,19;
--    Portugues 3/5; Informatica 4/5; Interpretacao 0/1 = Q1; Figuras 0/1 = Q2.
--    INFERENCIAS minhas (o Planeja nao lista questao por assunto; so o agrupamento
--    que fecha as contas): "NBR 15575-1" 2/3 agrupa Q15, Q16, Q17 (TCPO, NR-18,
--    NBR 12721, nada a ver com 15575); "Saneamento" 3/4 inclui Q22 e Q23
--    (drenagem urbana), que classifiquei em 2.5. Por isso a taxonomia do Planeja
--    NAO substitui a minha; serve de conferencia dos totais.
--
-- 3. RECLASSIFICACAO Q5: 1.1.4 (coesao) -> 1.1.6 (classes de palavras). O Planeja
--    classifica as 5 de Portugues como Interpretacao (Q1), Figuras (Q2), Oracoes
--    Coordenadas (Q3), Preposicao (Q4) e Classes de Palavras (Q5, valor de
--    "mas/e/mal"). 1.1.6 do edital = Emprego das classes de palavras.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_sess uuid;
  n int;
begin
  select s.id into v_sess from public.study_sessions s
   where s.user_id=v_user and s.metadata->>'sensei'='2' and s.study_type='simulado';
  if v_sess is null then raise exception '0133: sessao Sensei 02 nao encontrada'; end if;
  if (select metadata ? 'planeja_por_assunto' from public.study_sessions where id=v_sess) then
    raise notice '0133: ja aplicada'; return;
  end if;

  update public.study_sessions
     set notes = replace(notes, '3o de 3 na turma (media 31,3)', '3o de 4 na turma (media 30,5)')
                 || ' [0133] Ranking atualizado em 22/11: 3o de 4, media 30,5; entrou Ze gotinha 28/12 em 40 min.',
         metadata = metadata
           || jsonb_build_object(
             'ranking', jsonb_build_object('posicao',3,'de',4,'media_turma_acertos',30.5,
               'outros', jsonb_build_array(
                 jsonb_build_object('nome','Gauderio','acertos',33,'erros',7,'tempo','1h04'),
                 jsonb_build_object('nome','MFGDAP','acertos',31,'erros',9,'tempo','56min'),
                 jsonb_build_object('nome','Ze gotinha','acertos',28,'erros',12,'tempo','40min')),
               'aberto_ate','2026-11-30 17:41','criterio_desempate','tempo',
               'amostra','n=4, a coluna Turma por assunto inclui o usuario',
               'atualizado_em','2026-11-22'),
             'planeja_por_assunto', jsonb_build_array(
               jsonb_build_array('EDIFICACOES','',12,16,75,72),
               jsonb_build_array('EDIFICACOES','NBR 15575-1',2,3,67,67),
               jsonb_build_array('EDIFICACOES','Instalacoes Prediais',2,3,67,58),
               jsonb_build_array('EDIFICACOES','Estruturas de Concreto',3,4,75,50),
               jsonb_build_array('EDIFICACOES','Geotecnia e Fundacoes',3,4,75,94),
               jsonb_build_array('EDIFICACOES','Impermeabilizacao',1,1,100,100),
               jsonb_build_array('EDIFICACOES','Alvenaria',1,1,100,100),
               jsonb_build_array('INFORMATICA','',4,5,80,90),
               jsonb_build_array('INFORMATICA','Software',2,3,67,83),
               jsonb_build_array('INFORMATICA','Seguranca da Informacao',1,1,100,100),
               jsonb_build_array('INFORMATICA','Internet',1,1,100,100),
               jsonb_build_array('LEGISLACAO MUNICIPAL','Curitiba',3,4,75,69),
               jsonb_build_array('LICITACOES E CONTRATOS','Licitacoes',4,4,100,88),
               jsonb_build_array('OBRAS HIDRICAS','Saneamento',3,4,75,75),
               jsonb_build_array('OBRAS RODOVIARIAS','',1,2,50,75),
               jsonb_build_array('OBRAS RODOVIARIAS','Terraplenagem',0,1,0,50),
               jsonb_build_array('OBRAS RODOVIARIAS','Pavimentacao',1,1,100,100),
               jsonb_build_array('PORTUGUES','',3,5,60,75),
               jsonb_build_array('PORTUGUES','Interpretacao de Textos',0,1,0,25),
               jsonb_build_array('PORTUGUES','Figuras de Linguagem',0,1,0,75),
               jsonb_build_array('PORTUGUES','Oracoes Coordenadas',1,1,100,100),
               jsonb_build_array('PORTUGUES','Preposicao',1,1,100,100),
               jsonb_build_array('PORTUGUES','Classes de Palavras',1,1,100,75)),
             'planeja_colunas', jsonb_build_array('grupo','assunto','acertos','n','pct_voce','pct_turma'),
             'planeja_ressalva','taxonomia do Sensei, nao a do edital; Turma inclui o usuario; n=4; 15575-1 e Saneamento agrupam questoes de outros assuntos (inferencia minha)')
   where id = v_sess;

  update public.exam_attempts
     set notes = replace(notes, '3o de 3 na turma (media 31,3)', '3o de 4 na turma (media 30,5)')
   where session_id = v_sess;

  update public.questions
     set tags = tags || jsonb_build_object('unidade','1.1.6','unidade_anterior','1.1.4',
         'unidade_motivo','Planeja classifica como Classes de Palavras (valor de mas/e/mal)')
   where user_id=v_user and tags->>'sensei'='2' and (tags->>'questao_sensei')::int=5;
  get diagnostics n = row_count;
  if n <> 1 then raise exception '0133: esperava reclassificar 1 questao, reclassifiquei %', n; end if;

  raise notice '0133: Sensei 02 atualizado - 3o de 4, media 30,5; Q5 -> 1.1.6';
end $$;
