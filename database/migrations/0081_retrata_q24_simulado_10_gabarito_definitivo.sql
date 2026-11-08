-- 0081 — Retrata a Q24 do simulado 10 e registra defeito sistemico do material
--
-- O usuario insistiu que a Q24 do simulado 10 era alternativa B e nao D.
-- Fui conferir. Ele esta certo, e nao por mérito interpretativo: o GABARITO
-- DEFINITIVO da propria banca diz B.
--
-- FONTE PRIMARIA (consultada em 08/11/2026):
--   Municipio de Planalto - PR, Concurso Publico 001/2026, Fundacao FAFIPA.
--   ANEXO I DO EDITAL N.o 08.001/2026 - GABARITO DEFINITIVO, de 17/06/2026.
--   Cargo 8205 - ENGENHEIRO CIVIL, questao 27: B.
--   https://anexos-r2.selecao.net.br/uploads/281/concursos/4156/anexos/1ba4087b-8a02-477d-be54-ad252a600355.pdf
--   Pagina do concurso: https://fafipa.selecao.net.br/concurso/4156-concurso-publico-do-municipio-de-planalto-pr
--
-- O meu material trazia D porque extrai do marcador "GABARITO PRELIMINAR"
-- impresso no caderno do candidato (Edital 07.001/2026, de 25/05/2026).
-- A banca alterou de D para B no julgamento dos recursos.
--
-- ============================================================
-- DEFEITO SISTEMICO: TODO O MATERIAL USA O GABARITO PRELIMINAR
-- ============================================================
-- Os 15 simulados e o caderno tematico tiram o gabarito do marcador
-- "GABARITO PRELIMINAR" das provas em PDF. Eu nunca conferi contra o gabarito
-- definitivo. Em Planalto, Engenheiro Civil, 2 das 30 questoes mudaram:
--   Planalto Q27: preliminar D -> definitivo B  => Simulado 10, Q24
--   Planalto Q24: preliminar B -> definitivo C  => Simulado 13, Q27 (nao resolvido ainda)
-- As duas questoes alteradas da prova cairam no material. 2/30 = 6,7%.
-- Se essa taxa valesse para a serie inteira, seriam ~27 das 400 questoes ja
-- resolvidas com gabarito errado, contra 97 erros registrados. Uma prova nao
-- estabelece taxa, mas a ordem de grandeza torna o sweep obrigatorio.
-- PENDENCIA CRITICA: conferir as 34 provas contra os gabaritos definitivos.
-- Nao alterei nenhum PDF; aguarda validacao do usuario.
-- ACAO IMEDIATA COMUNICADA: corrigir Simulado 13 Q27 para C antes de resolver.
--
-- ============================================================
-- O MERITO, CONFERIDO CONTRA A NBR 9050:2020 (arquivo na pasta do usuario)
-- ============================================================
-- Enunciado: "assinale a alternativa que apresenta as NAO conformidades".
--   Item I   piso polido, baixa rugosidade, perfeito estado de conservacao
--     6.3.2 Revestimentos: "devem ter superficie regular, firme, estavel e nao
--     trepidante para dispositivos com rodas e ANTIDERRAPANTES, SOB QUALQUER
--     CONDICAO (seco ou molhado)". Baixa rugosidade nega antiderrapancia; estado
--     de conservacao nao supre. NAO CONFORMIDADE.
--   Item II  grelhas com vaos longitudinais no sentido do deslocamento
--     6.3.5: vaos "devem ser instalados PERPENDICULARMENTE ao fluxo principal".
--     NAO CONFORMIDADE.
--   Item III desnivel de 1,5 cm sem tratamento
--     6.3.4.1: ate 5 mm dispensa tratamento; "superiores a 5 mm ate 20 mm devem
--     possuir inclinacao maxima de 1:2 (50%)". 15 mm sem tratamento.
--     NAO CONFORMIDADE.
--   Item IV  tapetes soltos sem fixacao
--     6.3.7: "devem ser firmemente fixados ao piso". NAO CONFORMIDADE.
--   Item V   sinalizacao tatil direcional continua -> CONFORME.
-- Logo: I, II, III e IV = alternativa B. Confirmado pelo gabarito definitivo.
-- A defesa possivel de D (ler 6.3.2 como criterio de material, nao de
-- circulacao) cai contra a 6.3.1: "Os pisos devem atender as caracteristicas de
-- revestimento, inclinacao e desnivel, conforme descrito em 6.3.2 a 6.3.8".
--
-- ============================================================
-- CORRECAO DO MEU DIAGNOSTICO (erro meu, nao dele)
-- ============================================================
-- Na 0080 eu classifiquei a Q24 como "nao soube descartar o item I". ESTAVA
-- INVERTIDO: ele identificou o item I corretamente e o gabarito preliminar nao.
-- Consequencia: dos tres erros de 2.7 no simulado 10, apenas DOIS sao reais
-- (Q14 cotas de empunhadura, Q37 definicao de linha guia). O padrao
-- diagnosticado (cotas e definicoes fechadas da NBR 9050) sobrevive; a
-- magnitude que eu afirmei estava inflada por uma questao que nao era erro dele.
--
-- ============================================================
-- REGRA ADOTADA, A PEDIDO DO USUARIO
-- ============================================================
-- CASO A (este): existe gabarito DEFINITIVO e ele divergiu do material. O
--   definitivo prevalece e a questao conta como acerto. Nao e concessao: e a
--   medicao correta, porque em 06/12 a classificacao sai do definitivo.
-- CASO B: nao existe definitivo e ele discorda do preliminar. NAO se converte
--   em acerto automaticamente — seria autoavaliacao. Exige dispositivo citado e
--   conferencia independente, e fica registrado como "contestado". As 187
--   questoes sem gabarito do caderno sao todas caso B.
-- CONDICAO DE SIMETRIA: o sweep sera aplicado nos DOIS sentidos. Pode haver
--   questao marcada como acerto pelo preliminar que esteja errada pelo
--   definitivo. Corrigir so o que favorece reintroduz o vies que ele me manda
--   vigiar.
-- RESSALVA OPERACIONAL: em Planalto a questao so virou porque alguem
--   protocolou recurso. Na prova de Curitiba o ponto e condicional a ele
--   protocolar entre 08 e 09/12 (cronograma do Anexo III do Edital 5/2026-PMC).
--   Sem recurso, vale o preliminar.
--
-- ============================================================
-- NUMEROS CORRIGIDOS
-- ============================================================
--   Simulado 10 ......... 32/40 e 64 pts  ->  33/40 e 66 pts (recorde ISOLADO)
--   Serie de acertos .... 30,31,31,31,32,28,28,28,32,32 -> ...,32,33
--   Acumulado ........... 303/400 = 75,8% -> 304/400 = 76,0%
--   CE acumulado ........ 219/300 = 73,0% -> 220/300 = 73,3%
--   2.7 no simulado 10 .. 1/4 -> 2/4
--   2.7 acumulado ....... 5/14 = 35,7% -> 6/14 = 42,9%
--   NBR 9050 (painel 13/32 + simulados) .. 18/46 = 39,1% -> 19/46 = 41,3%

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_sess uuid;
  v_att  uuid;
  v_b_ce uuid;
begin
  select id into v_sess from public.study_sessions
   where user_id=v_user and study_type='simulado'
     and notes like 'Simulado FAFIPA no 10 %';
  if v_sess is null then
    raise exception 'simulado 10 nao encontrado';
  end if;

  if (select metadata ? 'retratacao_q24' from public.study_sessions where id=v_sess) then
    raise notice 'retratacao da Q24 ja registrada; nada a fazer';
    return;
  end if;

  select id into v_att from public.exam_attempts where session_id=v_sess;
  select tb.id into v_b_ce from public.exam_template_blocks tb
   where tb.template_id='59e345e4-02cd-4edb-8987-a566eb20d3c2'
     and tb.name='Conhecimentos Específicos';

  update public.study_sessions
     set metadata = (metadata - 'erros')
       || jsonb_build_object(
          'erros', jsonb_build_array(14,20,28,37,39,40),
          'erros_brutos_reportados', jsonb_build_array(8,14,20,24,28,37,39,40),
          'retratacao_q24', 'A Q24 NAO era erro dele. O GABARITO DEFINITIVO de Planalto (Anexo I do Edital 08.001/2026, de 17/06/2026, cargo 8205, questao 27) e B, a alternativa que ele marcou. Meu material trazia D porque usei o marcador GABARITO PRELIMINAR. Confirmado contra a NBR 9050:2020 itens 6.3.2 (antiderrapante sob qualquer condicao), 6.3.5 (vaos perpendiculares ao fluxo), 6.3.4.1 (desnivel 5-20 mm exige inclinacao 1:2) e 6.3.7 (tapetes firmemente fixados): as nao conformidades sao I, II, III e IV.',
          'retratacao_mecanismo_q24', 'Na 0080 eu classifiquei como "nao soube descartar o item I". Estava INVERTIDO: ele descartou corretamente e o gabarito preliminar nao. Dos tres erros de 2.7 no simulado 10, apenas dois sao reais (Q14 cotas, Q37 definicao de linha guia).',
          'defeito_gabarito_preliminar', 'DEFEITO SISTEMICO: os 15 simulados e o caderno tematico usam o marcador GABARITO PRELIMINAR das provas em PDF, nunca conferido contra o gabarito definitivo pos-recursos. Em Planalto Eng. Civil mudaram 2 das 30 (6,7%): Q27 D->B (Simulado 10 Q24) e Q24 B->C (Simulado 13 Q27, ainda nao resolvido). Sweep das 34 provas pendente; nenhum PDF alterado.',
          'acao_imediata_simulado_13', 'Antes de resolver o Simulado 13, corrigir o gabarito da Q27 de B para C (Planalto Q24, gabarito definitivo C).',
          'fonte_gabarito_definitivo', 'https://anexos-r2.selecao.net.br/uploads/281/concursos/4156/anexos/1ba4087b-8a02-477d-be54-ad252a600355.pdf',
          'regra_gabarito_definitivo', 'CASO A (gabarito definitivo divergente do material): o definitivo prevalece e conta como acerto, porque em 06/12 a classificacao sai do definitivo. CASO B (sem definitivo, ele discorda do preliminar): nao converte em acerto; exige dispositivo citado e fica como "contestado". SIMETRIA obrigatoria: o sweep corrige nos dois sentidos.',
          'ressalva_recurso_condicional', 'Em Planalto a questao so virou porque alguem protocolou recurso. Em Curitiba o ponto e condicional a ele protocolar entre 08 e 09/12 (Anexo III do Edital 5/2026-PMC). Sem recurso, vale o preliminar.',
          'por_unidade_edital', jsonb_build_object(
            '2.1','1/1','2.2','0/0','2.3','3/4','2.4','2/4','2.5','0/0','2.6','2/2',
            '2.7','2/4','2.8','4/4','2.9','5/5','2.10','0/1','2.11','5/5'),
          'acumulado_por_unidade', jsonb_build_object(
            '2.1','18/21','2.2','28/39','2.3','17/25','2.4','21/29','2.5','5/6','2.6','32/44',
            '2.7','6/14','2.8','26/31','2.9','22/32','2.10','13/19','2.11','32/39'),
          'acumulado_serie', jsonb_build_object(
            'simulados',10,'questoes',400,'acertos',304,'pct',76.0,
            'lp','41/50','inf','43/50','ce','220/300',
            'nota','corrigido pela retratacao da Q24; antes 303/400'),
          'pontuacao_ponderada',66,
          'recorde','33/40 e 66 pontos: recorde ISOLADO da serie apos a retratacao da Q24 (antes empatava em 32 com os simulados 5 e 9)')
   where id = v_sess;

  update public.study_sessions
     set notes = notes || '

=== RETRATACAO 08/11/2026 (migration 0081) ===
A Q24 NAO era erro dele. O GABARITO DEFINITIVO da banca (Municipio de Planalto - PR, Concurso 001/2026,
Anexo I do Edital 08.001/2026 de 17/06/2026, cargo 8205 Engenheiro Civil, questao 27) e B — exatamente a
alternativa que ele marcou. Meu material trazia D porque extrai do marcador GABARITO PRELIMINAR do caderno.
Conferido contra a NBR 9050:2020: item I viola 6.3.2 (antiderrapante sob qualquer condicao), item II viola
6.3.5 (vaos perpendiculares ao fluxo), item III viola 6.3.4.1 (desnivel de 5 a 20 mm exige inclinacao 1:2),
item IV viola 6.3.7 (tapetes firmemente fixados), item V esta conforme. Nao conformidades = I, II, III e IV = B.

RESULTADO CORRIGIDO: 33/40 = 66 pontos. Recorde ISOLADO da serie. CE passa a 24/30.
Serie de acertos: 30, 31, 31, 31, 32, 28, 28, 28, 32, 33. Acumulado 304/400 = 76,0%.
Unidade 2.7 no simulado: 2/4; acumulado 6/14 = 42,9% (era 5/14 = 35,7%).

DEFEITO SISTEMICO DO MATERIAL: todos os simulados e o caderno usam o gabarito PRELIMINAR, nunca conferido
contra o definitivo pos-recursos. Em Planalto mudaram 2 das 30 questoes, e as duas estao no material:
Planalto Q27 (D->B) no Simulado 10 Q24, e Planalto Q24 (B->C) no Simulado 13 Q27. Sweep das 34 provas
pendente de autorizacao; nenhum arquivo alterado. ACAO IMEDIATA: corrigir Simulado 13 Q27 para C.

ERRO MEU DE DIAGNOSTICO, CORRIGIDO: na 0080 eu classifiquei a Q24 como "nao soube descartar o item I".
Estava invertido. Dos tres erros de 2.7 do simulado 10, apenas dois sao reais (Q14 cotas, Q37 linha guia).'
   where id = v_sess;

  update public.session_results
     set correct_total = 33, wrong_total = 7, score = 66.00,
         metadata = metadata || jsonb_build_object(
           'retificado_em','2026-11-08',
           'motivo','gabarito definitivo da banca para a Q24 (Planalto Q27) e B, nao D; migration 0081')
   where session_id = v_sess;

  if v_att is not null and v_b_ce is not null then
    update public.exam_attempt_blocks
       set correct = 24, wrong = 6
     where attempt_id = v_att and block_id = v_b_ce;

    update public.exam_attempts
       set notes = 'Simulado FAFIPA no 10. 33/40 = 66 de 80 pontos em 76 min. LP 5/5, INF 4/5, CE 24/30. Retificado pela migration 0081: a Q24 estava com gabarito preliminar (D); o definitivo da banca e B.'
     where id = v_att;
  end if;

  raise notice 'retratacao aplicada na sessao %', v_sess;
end $$;
