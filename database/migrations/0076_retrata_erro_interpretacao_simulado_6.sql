-- 0076 — Retrata a conclusao do "primeiro erro de interpretacao" do simulado 6
--
-- ATENCAO AO LER ESTE ARQUIVO: esta migration foi DESFEITA pela 0077, depois
-- que o usuario confirmou que usou o texto certo. Ela fica no historico porque
-- documenta um erro meu de metodo: retratar uma conclusao com base em metadado
-- de arquivo, sem esperar a resposta de quem resolveu a prova.
--
-- O QUE EU AFIRMEI (migrations 0068 e 0069, e repeti na 0071 e 0073):
--   "QUEBRA DE PADRAO: a Q01 e erro de INTERPRETACAO. Nos 45 erros anteriores
--    nao havia nenhum de raciocinio — e o primeiro em 240 questoes."
--   E usei esse ponto como o unico contraexemplo da tese de que todos os erros
--   dele sao de recall.
--
-- POR QUE ISSO NAO SE SUSTENTA:
-- Auditando os textos-base dos simulados a pedido dele, encontrei que o arquivo
-- Simulado_6.pdf gravado em 31/10 as 16:19 — o mesmo dia em que ele resolveu o
-- simulado 6 — esta SEM O TEXTO-BASE de Lingua Portuguesa. Zero caracteres
-- entre o cabecalho do bloco e a Questao 01.
--
-- A Q01 do simulado 6 pergunta literalmente "A ideia principal do texto e:".
-- SEM O TEXTO, A QUESTAO E IMPOSSIVEL. E foi exatamente essa que ele errou.
--
-- VERIFICACAO FEITA, item por item:
--   Simulado_6.md  (26/10)          ... TEM o texto (1.871 caracteres)
--   Simulado_6.pdf (31/10 16:19)    ... NAO tem o texto     <-- o que esta em disco
--   Simulado_6_v2.pdf (01/11 11:56) ... TEM o texto, versao corrigida
--   Das tres questoes do bloco que citam o texto (Q01, Q04 e Q05), a Q04 e a
--   Q05 reproduzem o trecho dentro do proprio enunciado e continuam
--   respondiveis. SO A Q01 depende do texto corrido. E so ela foi errada.
--
-- O QUE NAO CONSIGO PROVAR: qual arquivo ele imprimiu. A sessao esta registrada
-- as 16:00 (horario padrao que eu escolhi, nao medido) e o PDF sem texto e de
-- 16:19. Se ele imprimiu antes das 16:19, pode ter tido o texto. Nao ha como
-- decidir com o que existe. Registro a duvida, nao a conclusao.
--
-- CONSEQUENCIA: a afirmacao "primeiro erro de interpretacao em 240 questoes"
-- sai de pe. O erro da Q01 passa a ser NAO CLASSIFICAVEL — pode ser erro de
-- interpretacao ou pode ser questao sem enunciado completo.
--
-- EFEITO NO DIAGNOSTICO GERAL: reforca, nao enfraquece. Tirando a Q01, a serie
-- de 9 simulados e 360 questoes fica com UM unico erro nao-recall confirmado:
-- a Q35 do #9, que e erro de COMANDO (questao EXCETO respondida com alternativa
-- correta), registrado na 0073. A tese "o teto e estoque de informacao, nao
-- capacidade" fica mais forte do que estava.
--
-- A NOTA 28/40 DO SIMULADO 6 NAO MUDA. Ele marcou e errou; o resultado
-- registrado continua valido. O que muda e a INTERPRETACAO do erro.
--
-- PENDENCIA PARA O USUARIO: confirmar se o caderno do simulado 6 que ele
-- imprimiu em 31/10 tinha o texto de Portugues antes da Questao 01.
-- (RESPONDIDA em 07/11: "sobre o simulado seis ja foi feito e usei o texto
--  certo". Esta migration foi desfeita pela 0077.)

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_s6 uuid; v_s7 uuid; v_s9 uuid;
begin
  select id into v_s6 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 6 %';
  select id into v_s7 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 7 %';
  select id into v_s9 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 9 %';
  if v_s6 is null then raise exception 'simulado 6 nao encontrado'; end if;

  update public.study_sessions
     set notes = replace(notes,
'QUEBRA DE PADRAO: a Q01 e erro de INTERPRETACAO. Nos 45 erros anteriores nao havia nenhum de
raciocinio — e o primeiro em 240 questoes.',
'ERRO DA Q01 — NAO CLASSIFICAVEL (ver migration 0076). Eu havia registrado como "o primeiro erro de
interpretacao em 240 questoes". Auditoria dos textos-base mostrou que o arquivo Simulado_6.pdf
gravado em 31/10 as 16:19, mesmo dia da resolucao, esta SEM o texto-base de Portugues. A Q01 pergunta
"A ideia principal do texto e:" e, sem o texto, e impossivel. Das tres questoes do bloco que citam o
texto, a Q04 e a Q05 trazem o trecho no proprio enunciado e seguem respondiveis; so a Q01 depende do
texto corrido, e so ela foi errada. Nao da para provar qual arquivo ele imprimiu (a versao .md de
26/10 e a v2 de 01/11 tem o texto). CONCLUSAO RETIRADA: o erro pode ser de interpretacao ou pode ser
questao sem enunciado completo. A nota 28/40 nao muda.'),
         metadata = metadata || jsonb_build_object(
           'q01_reclassificada','erro NAO CLASSIFICAVEL: o caderno em disco de 31/10 esta sem o texto-base de Portugues e a Q01 depende dele',
           'retratacao_0076','a afirmacao "primeiro erro de interpretacao em 240 questoes" foi retirada',
           'pendencia_usuario','confirmar se o caderno impresso do simulado 6 trazia o texto de Portugues antes da Questao 01')
   where id = v_s6;

  -- os simulados 7 e 9 repetem a afirmacao; corrigir tambem
  if v_s7 is not null then
    update public.study_sessions
       set notes = replace(notes,
'ZERO ERROS DE RACIOCINIO. Os 12 sao recall de norma, definicao ou nomenclatura. O erro de
interpretacao da Q01 do simulado 6 fica como ponto isolado: 1 em 280 questoes. O diagnostico original
volta a valer em cheio — o teto e estoque de informacao, nao capacidade.',
'ZERO ERROS DE RACIOCINIO. Os 12 sao recall de norma, definicao ou nomenclatura. O "erro de
interpretacao da Q01 do simulado 6" que eu citava aqui foi RETIRADO na migration 0076: aquele caderno
estava sem o texto-base. O diagnostico original vale em cheio — o teto e estoque de informacao, nao
capacidade.')
     where id = v_s7;
  end if;

  if v_s9 is not null then
    update public.study_sessions
       set notes = replace(notes,
'E a segunda ocorrencia
nao-recall em 360 questoes, junto com a Q01 do #6.',
'E, apos a retratacao da migration 0076, a UNICA ocorrencia
nao-recall confirmada em 360 questoes — a Q01 do #6 saiu da conta porque o caderno estava sem o
texto-base.')
     where id = v_s9;
  end if;

  raise notice 'ok 6=% 7=% 9=%', v_s6, v_s7, v_s9;
end $$;
