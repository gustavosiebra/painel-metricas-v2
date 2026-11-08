-- 0082 — Sweep dos gabaritos definitivos da FAFIPA e correcao do simulado 6
--
-- AUTORIZADO pelo usuario em 08/11. Conferi o gabarito de TODO o material
-- contra os gabaritos DEFINITIVOS publicados pela banca apos o julgamento dos
-- recursos, e nao mais contra o marcador "GABARITO PRELIMINAR" dos cadernos.
--
-- METODO E RASTREABILIDADE:
--   1. Listei os concursos em fafipa.selecao.net.br e localizei, para cada
--      prova do acervo, o "Anexo I do Edital de Gabarito Definitivo".
--   2. Os anexos ficam em dois dominios. O anexos-r2 responde a fetch direto;
--      o anexos.cdn bloqueia por CORS. Contornei navegando ate o PDF (o que o
--      torna same-origin) e descomprimindo os streams FlateDecode no proprio
--      navegador para extrair o texto.
--   3. Para cada prova, extrai o bloco do cargo ENGENHEIRO CIVIL e comparei
--      questao a questao com o gabarito impresso no meu material.
--   4. Quando a divergencia foi alta demais para ser recurso (13 de 16 na SESA,
--      15 de 17 em Ivaipora), tratei como ERRO DE MAPEAMENTO, nao como achado.
--      A SESA tem tres versoes de prova; a correta e a PROVA 2 (0 divergencias).
--      Ivaipora ficou sem conferencia: o concurso da prova que ele tem e
--      recente e ainda nao publicou definitivo.
--
-- RESULTADO: 350 questoes conferidas em 25 provas. NOVE problemas = 2,6%.
--
--   GABARITO ALTERADO EM RECURSO (3 = 0,86%)
--     Planalto Q27   D -> B   Simulado 10, questao 24   (ja tratado na 0081)
--     Planalto Q24   B -> C   Simulado 13, questao 27   (nao resolvido ainda)
--     Arapongas Q23  A -> B   Simulado 14, questao 39   (nao resolvido ainda)
--
--   QUESTAO ANULADA PELA BANCA (6 = 1,71%)
--     Uniflor Q14       Simulado 6,  questao 09   (ele ACERTOU)
--     Nova Aurora Q24   Simulado 6,  questao 30   (ele ERROU)  <-- muda a nota
--     Cruz Machado Q12  Simulado 11, questao 09   (nao resolvido)
--     Matinhos Q40      Simulado 11, questao 17   (nao resolvido)
--     Arapongas Q16     Simulado 14, questao 20   (nao resolvido)
--     Campo Mourao Q19  Simulado 14, questao 21   (nao resolvido)
--
-- ============================================================
-- EU SUPERESTIMEI O VALOR DO RECURSO. DUAS VEZES.
-- ============================================================
-- Na 0081 eu disse 6,7% com base so em Planalto, e sugeri que recursos valeriam
-- 4 a 6 pontos na prova de Curitiba. Depois corrigi para 2,3%. O numero final
-- com 350 questoes e 2,6%, mas a decomposicao importa mais que o total:
--   ANULACOES (1,71%) acontecem sozinhas e o ponto e concedido a todos. Ele nao
--     precisa fazer nada, e isso NAO e vantagem competitiva.
--   ALTERACOES DE GABARITO (0,86%) sao o que recurso de fato ganha. Em 40
--     questoes isso da 0,34 questao, ou 0,7 ponto esperado.
-- Ou seja: o recurso vale menos de um ponto em expectativa, nao 4 a 6. Eu
-- generalizei de n=1 duas vezes seguidas. Fica registrado como erro de metodo.
-- A ressalva que sobrevive: a Planalto Q27 foi uma alteracao real que atingiu
-- ele diretamente, entao o evento nao e teorico — so e raro.
--
-- ============================================================
-- CORRECAO DO SIMULADO 6 (aplicacao simetrica, como combinado)
-- ============================================================
-- A questao 30 do simulado 6 e a Nova Aurora Q24, ANULADA pela banca. Ele
-- tinha errado. Pela pratica da FAFIPA a questao anulada e concedida a todos,
-- entao o ponto volta: 28/40 -> 29/40, 56 -> 58 pontos. CE passa de 20 para 21.
-- A questao 09 do mesmo simulado (Uniflor Q14) tambem foi anulada, mas ele
-- havia ACERTADO, entao nao ha mudanca — e este e justamente o teste da regra
-- de simetria: corrigi nos dois sentidos e so um lado moveu a nota.
--
-- SERIE ATUALIZADA: 30, 31, 31, 31, 32, 29, 28, 28, 32, 33
-- ACUMULADO: LP 41/50 | INF 43/50 | CE 221/300 (73,7%) | TOTAL 305/400 = 76,3%
-- PROJECAO pelos simulados: 0,820x10 + 0,860x10 + 0,7367x60 = 61,0 de 80.
--
-- PENDENCIA: a unidade do edital da questao 30 do simulado 6 nao foi
-- reclassificada aqui. O rotulo impresso e do classificador por palavra-chave,
-- que ja se mostrou errado; nao vou atribuir unidade por chute. O acumulado por
-- unidade segue como estava na 0081 ate reclassificacao manual.
--
-- NAO CONFERIDAS (50 questoes em 7 provas, sem definitivo acessivel):
--   20H e 40H Campo do Tenente, Campo Largo 2020, Ivaipora, Mercedes,
--   Santa Isabel do Ivai, Tres Barras - SC (arquivo da raiz).
--   Mercedes: o anexo do concurso 4086 nao traz cargo de Engenheiro Civil —
--   provavel mapeamento errado de concurso, a investigar.
--
-- ACOES PARA O USUARIO, ANTES DE RESOLVER OS SIMULADOS 11, 13 E 14:
--   Simulado 11: questoes 09 e 17 ANULADAS (desconsiderar)
--   Simulado 13: questao 27 -> gabarito C
--   Simulado 14: questoes 20 e 21 ANULADAS; questao 39 -> gabarito B

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_s6 uuid; v_att uuid; v_b_ce uuid;
begin
  select id into v_s6 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 6 %';
  if v_s6 is null then raise exception 'simulado 6 nao encontrado'; end if;

  if (select metadata ? 'sweep_gabarito_definitivo' from public.study_sessions where id=v_s6) then
    raise notice 'sweep ja registrado no simulado 6; nada a fazer';
    return;
  end if;

  select id into v_att from public.exam_attempts where session_id=v_s6;
  select tb.id into v_b_ce from public.exam_template_blocks tb
   where tb.template_id='59e345e4-02cd-4edb-8987-a566eb20d3c2'
     and tb.name='Conhecimentos Específicos';

  update public.study_sessions
     set metadata = metadata || jsonb_build_object(
       'sweep_gabarito_definitivo','conferido em 08/11/2026 contra os gabaritos definitivos da banca (migration 0082)',
       'q30_anulada','a questao 30 (Nova Aurora Q24) foi ANULADA pela banca. Ele havia errado; o ponto e concedido a todos. Nota corrigida de 28/40 para 29/40.',
       'q09_anulada_sem_efeito','a questao 09 (Uniflor Q14) tambem foi anulada, mas ele acertou — sem mudanca. Teste da regra de simetria: corrigido nos dois sentidos, so um lado moveu.',
       'erros_apos_sweep', jsonb_build_array(1,3,14,17,21,23,24,26,34,37,39),
       'erros_brutos_reportados', jsonb_build_array(1,3,14,17,21,23,24,26,30,34,37,39),
       'pontuacao_ponderada',58,
       'unidade_q30_pendente','nao reclassifiquei a unidade do edital da questao 30; o rotulo impresso vem do classificador por palavra-chave e nao e confiavel')
   where id = v_s6;

  update public.study_sessions
     set notes = notes || '

=== SWEEP DOS GABARITOS DEFINITIVOS, 08/11/2026 (migration 0082) ===
A questao 30 deste simulado e a Nova Aurora Q24 e foi ANULADA pela banca no gabarito definitivo.
Ele havia errado. Questao anulada e concedida a todos, entao o ponto volta: 28/40 -> 29/40, 56 -> 58 pontos.
CE passa de 20/30 para 21/30.
A questao 09 (Uniflor Q14) tambem foi anulada, mas ele ACERTOU, entao nao ha mudanca. Esse par e o teste
da regra de simetria combinada com ele: a correcao foi aplicada nos dois sentidos e so um lado moveu a nota.
Serie atualizada: 30, 31, 31, 31, 32, 29, 28, 28, 32, 33. Acumulado 305/400 = 76,3%.'
   where id = v_s6;

  update public.session_results
     set correct_total = 29, wrong_total = 11, score = 58.00,
         metadata = metadata || jsonb_build_object(
           'retificado_em','2026-11-08',
           'motivo','questao 30 (Nova Aurora Q24) anulada pela banca; migration 0082')
   where session_id = v_s6;

  if v_att is not null and v_b_ce is not null then
    update public.exam_attempt_blocks set correct = 21, wrong = 9
     where attempt_id = v_att and block_id = v_b_ce;
    update public.exam_attempts
       set notes = coalesce(notes,'') || ' [0082] Retificado: 29/40 = 58 pontos; questao 30 anulada pela banca.'
     where id = v_att;
  end if;

  update public.exams
     set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
       'sweep_gabaritos_definitivos', jsonb_build_object(
         'feito_em','2026-11-08',
         'questoes_conferidas',350,
         'provas_conferidas',25,
         'problemas',9,
         'taxa_total','2,6%',
         'taxa_alteracao_de_gabarito','0,86% (3 em 350) — e isso que recurso ganha',
         'taxa_anulacao','1,71% (6 em 350) — concedida a todos, nao depende de recurso',
         'expectativa_prova_curitiba','cerca de 1 questao afetada em 40; o componente recorrivel vale ~0,7 ponto, nao os 4 a 6 que eu havia estimado',
         'correcao_de_estimativa','eu estimei 6,7% a partir de uma unica prova (Planalto) e depois 2,3%; o numero final com 350 questoes e 2,6%, mas a decomposicao mostra que o valor do recurso e bem menor do que afirmei',
         'nao_conferidas','50 questoes em 7 provas: 20H e 40H Campo do Tenente, Campo Largo 2020, Ivaipora, Mercedes, Santa Isabel do Ivai, Tres Barras - SC',
         'correcoes_pendentes_no_material', jsonb_build_array(
           'Simulado 11: questoes 09 e 17 ANULADAS',
           'Simulado 13: questao 27 -> gabarito C',
           'Simulado 14: questoes 20 e 21 ANULADAS; questao 39 -> gabarito B')))
   where user_id=v_user and name='Prefeitura de Curitiba 2026';

  raise notice 'sweep registrado; simulado 6 corrigido para 29/40';
end $$;
