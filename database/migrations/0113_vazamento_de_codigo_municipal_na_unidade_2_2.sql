-- 0113 — Vazamento de legislacao municipal alheia dentro da unidade 2.2
--
-- AUTORIZADO pelo usuario em 12/11/2026 ("sim" a: reclassificar a 077 para 2.1
-- com legislacao_de_curitiba = false, e varrer as outras 2.2 do caderno atras
-- do mesmo vazamento).
--
-- ============================================================
-- O QUE DISPAROU
-- ============================================================
-- Ele mandou verificar a 077 ("qual seria o gabarito para Curitiba?"). A questao
-- e do Codigo de Obras de MERCEDES - PR e pergunta de quem e a responsabilidade
-- de colocar a placa de obra. Gabarito de la: C (responsavel tecnico).
--
-- Em Curitiba, a Lei 11.095/2004, art. 109, e IMPESSOAL: diz "deverá haver"
-- uma placa e lista os cinco itens obrigatorios, mas NAO atribui a obrigacao a
-- ninguem, e nao ha inciso de infracao especifico. A Lei 16.488/2025 alterou o
-- art. 334 (multas/dengue), nao o 109.
-- Para Curitiba a questao NAO TEM GABARITO. C e a leitura mais defensavel pelo
-- art. 3, par. 2, "b" (o RT responde pela obra do inicio a conclusao), mas a
-- resposta dele, D, tem apoio no proprio codigo: o art. 55 poe a placa de
-- NUMERACAO no proprietario, e o art. 105, par. 1, usa responsabilidade
-- solidaria proprietario + RT. Quando Curitiba quer atribuir, atribui; para a
-- placa de obra, nao atribuiu.
--
-- Ao abrir a questao vi o problema maior: a 077 estava classificada em
-- 2.2 MATERIAIS E TECNICAS DE CONSTRUCAO. E legislacao de edificacoes (2.1), e
-- o campo legislacao_de_curitiba estava NULO — nunca passou pela triagem que
-- fizemos nas 021-061. Mesma familia do erro das 152/156 (migration 0104).
--
-- ============================================================
-- A VARREDURA DA 2.2
-- ============================================================
-- Varri as 26 questoes do bloco 2.2 do caderno atras de vocabulario de lei
-- municipal (codigo de obras/posturas, lei organica, alvara, estatuto de
-- servidores, infracao, municipio de X). Achei TRES, nao uma:
--
--   077  MERCEDES q.18    placa de obra, Codigo de Obras de Mercedes
--        -> 2.1, legislacao_de_curitiba = false. Ele ERROU (marcou D, gab C).
--           Permanece no placar, como as 152/156 na 0104.
--
--   100  MATINHOS q.45    espessura minima de paredes de alvenaria
--        -> 2.1, legislacao_de_curitiba = false. Ele ACERTOU (C).
--           Parece questao tecnica, mas os valores (15/20/10 cm) vem do Codigo
--           de Obras de Matinhos, nao de norma. Conferi: a Lei 11.095/2004 de
--           Curitiba NAO fixa espessura de parede; remete a ABNT (ex.: art. 124
--           para escadas). Acertou a regra de Matinhos, que nao vale aqui.
--
--   081  RIO BRANCO DO SUL q.33   Lei 1.501/2025, plano de carreira e
--        remuneracao dos servidores do quadro geral do municipio.
--        -> FORA. Nao e 2.1 nem 2.2 nem CE: e regime de pessoal de outro
--           municipio, sem relacao com Engenharia Civil. NAO foi respondida,
--           entao nao mexe no placar.
--
-- EFEITO NO PLACAR DO CADERNO
--   2.2: 27 questoes / 17 acertos (63,0%)  ->  25 / 16 (64,0%)
--   2.1: ganha 2 questoes, 1 acerto (a 100) e 1 erro (a 077)
--   totais do caderno: inalterados (nenhuma tentativa foi removida)
--
-- ============================================================
-- FICA REGISTRADO: O VAZAMENTO E MUITO MAIOR QUE A 2.2
-- ============================================================
-- A mesma varredura rodada sobre as 250 questoes de CE acusou legislacao
-- municipal alheia classificada FORA da 2.1 em pelo menos mais estas, que NAO
-- foram tocadas aqui porque a autorizacao do usuario cobria so a 2.2:
--
--   109, 110, 115  [2.4]  estatutos/planos de carreira de servidores
--   201            [2.10] Estatuto dos Servidores de Rio Branco do Sul
--   220, 227, 230, 245, 246  [2.11] Lei Organica, aposentadoria, acumulacao
--                                   de cargos, estatutos de servidores
--   218, 219, 234, 241       [2.11] alvara, auto de infracao, aprovacao de
--                                   projeto — isso e 2.1, nao 2.11
--   168, 169       [2.8]  isencao de RT e ruidos, Codigo de Mercedes
--   186            [2.9]  seguranca na obra, Codigo de Medianeira
--   200            [2.10] EIV, Codigo de Mercedes
--   128, 129, 131, 132, 150, 175  [2.6/2.9] planos municipais de saneamento e
--                                 residuos de Campo Mourao e Matinhos
--
-- NENHUMA delas foi respondida ainda (ele fez 001-100, 117-121, 151-156), entao
-- o placar atual nao esta contaminado por elas. Mas se forem resolvidas como
-- estao, vao poluir as taxas de 2.4, 2.6, 2.8, 2.9, 2.10 e 2.11 com acerto ou
-- erro sobre lei de municipio que nao e Curitiba. Precisa de decisao do
-- usuario antes de qualquer alteracao.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  n int;
begin
  -- 077 e 100: codigo de obras de outro municipio -> 2.1, nao vale para Curitiba
  update public.questions
     set tags = tags
       || jsonb_build_object(
            'unidade','2.1',
            'legislacao_de_curitiba', false,
            'unidade_anterior','2.2',
            'reclassificado_em','2026-11-12',
            'reclassificado_por','migration 0113')
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int in (77,100)
     and tags->>'unidade' = '2.2';
  get diagnostics n = row_count;
  if n <> 2 then
    raise exception '0113: esperava reclassificar 2 questoes (077,100), reclassifiquei %', n;
  end if;

  update public.questions
     set tags = tags || jsonb_build_object(
            'nota','Codigo de Obras de Mercedes. Em Curitiba a Lei 11.095/2004, art. 109, e impessoal: exige a placa e lista os 5 itens obrigatorios, mas nao atribui a obrigacao a ninguem. Questao SEM GABARITO para Curitiba. O aproveitavel e o conteudo obrigatorio do art. 109 e o teto de 2,00 m2.')
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int = 77;

  update public.questions
     set tags = tags || jsonb_build_object(
            'nota','Espessuras minimas de parede do Codigo de Obras de Matinhos. A Lei 11.095/2004 de Curitiba nao fixa espessura de parede; remete a ABNT. Valores nao transferiveis.')
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int = 100;

  -- 081: regime de pessoal de outro municipio -> fora do edital de CE
  update public.questions
     set tags = tags
       || jsonb_build_object(
            'unidade','FORA',
            'unidade_anterior','2.2',
            'reclassificado_em','2026-11-12',
            'reclassificado_por','migration 0113',
            'nota','Lei 1.501/2025 de Rio Branco do Sul, plano de carreira e remuneracao dos servidores do quadro geral. Nao e Engenharia Civil nem legislacao de edificacoes. Fora do edital de CE de Curitiba. Nao responder.')
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int = 81
     and tags->>'unidade' = '2.2';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception '0113: esperava mover 1 questao (081) para FORA, movi %', n;
  end if;

  -- lista de trabalho do vazamento remanescente, para decisao do usuario
  delete from public.user_parameters
   where user_id = v_user and key = 'vazamento_legislacao_municipal_alheia';

  insert into public.user_parameters(user_id, key, value)
  values (v_user, 'vazamento_legislacao_municipal_alheia', jsonb_build_object(
    'varrido_em','2026-11-12',
    'escopo','250 questoes de CE do Caderno_Questoes_FAFIPA.pdf',
    'metodo','busca por vocabulario de lei municipal (codigo de obras/posturas, lei organica, alvara, estatuto de servidores, auto de infracao, "municipio de X") em questoes classificadas FORA da unidade 2.1',
    'corrigidas_nesta_migration', jsonb_build_array(77,100,81),
    'pendentes_de_decisao', jsonb_build_object(
      'fora_do_edital_regime_de_pessoal', jsonb_build_array(109,110,115,201,220,227,230,245,246),
      'sao_2_1_e_estao_em_2_11', jsonb_build_array(218,219,234,241),
      'codigo_municipal_em_outras_unidades', jsonb_build_array(168,169,186,200),
      'planos_municipais_saneamento_residuos', jsonb_build_array(128,129,131,132,150,175)),
    'situacao','nenhuma das pendentes foi respondida ainda; o placar atual nao esta contaminado por elas',
    'risco','se resolvidas como estao, poluem as taxas de 2.4, 2.6, 2.8, 2.9, 2.10 e 2.11 com lei de municipio que nao e Curitiba'));

  raise notice '0113: 077 e 100 -> 2.1, 081 -> FORA, lista de pendentes gravada';
end $$;
