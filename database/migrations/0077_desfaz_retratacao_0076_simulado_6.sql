-- 0077 — Desfaz a retratacao da 0076: o caderno do simulado 6 TINHA o texto
--
-- Na 0076 eu retirei a conclusao de que a Q01 do simulado 6 era erro de
-- interpretacao, porque o arquivo Simulado_6.pdf gravado em 31/10 as 16:19
-- estava sem o texto-base e eu nao conseguia provar qual versao ele imprimiu.
-- Registrei a duvida e perguntei.
--
-- ELE RESPONDEU: "sobre o simulado seis ja foi feito e usei o texto certo".
--
-- Logo, o caderno que ele resolveu tinha o texto de Portugues. A Q01 era
-- respondivel e o erro e de INTERPRETACAO de fato. A conclusao original volta
-- a valer e a 0076 fica registrada como retratacao indevida — mantida no
-- historico porque o raciocinio que a motivou (auditoria dos textos-base) era
-- correto; so a premissa sobre qual arquivo ele usou estava errada.
--
-- ESTADO CORRETO DO DIAGNOSTICO, apos esta correcao:
--   Em 9 simulados e 360 questoes ha DOIS erros nao-recall:
--     #6 Q01 ... interpretacao (ideia principal do texto)
--     #9 Q35 ... comando (questao EXCETO respondida com alternativa correta)
--   Todos os outros 87 erros sao recall de norma, definicao, cota ou nomenclatura.
--   A tese segue de pe: o teto e estoque de informacao, nao capacidade.
--
-- LICAO DE PROCESSO, que fica registrada: o arquivo em disco nao prova o que
-- o candidato imprimiu. Antes de retratar uma conclusao com base em metadado
-- de arquivo, perguntar. Eu perguntei na 0076 e agir antes da resposta teria
-- gravado a correcao errada — o que de fato aconteceu e esta sendo desfeito.
--
-- DEFEITO DE ARQUIVO QUE PERMANECE E PRECISA SER CORRIGIDO EM DISCO:
-- o Simulado_6.pdf que esta na pasta continua sendo a versao sem texto-base.
-- A versao correta e o Simulado_6_v2.pdf. Isso nao afeta o resultado ja
-- registrado, mas afeta quem for refazer o simulado.

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
'ERRO DA Q01 — NAO CLASSIFICAVEL (ver migration 0076). Eu havia registrado como "o primeiro erro de
interpretacao em 240 questoes". Auditoria dos textos-base mostrou que o arquivo Simulado_6.pdf
gravado em 31/10 as 16:19, mesmo dia da resolucao, esta SEM o texto-base de Portugues. A Q01 pergunta
"A ideia principal do texto e:" e, sem o texto, e impossivel. Das tres questoes do bloco que citam o
texto, a Q04 e a Q05 trazem o trecho no proprio enunciado e seguem respondiveis; so a Q01 depende do
texto corrido, e so ela foi errada. Nao da para provar qual arquivo ele imprimiu (a versao .md de
26/10 e a v2 de 01/11 tem o texto). CONCLUSAO RETIRADA: o erro pode ser de interpretacao ou pode ser
questao sem enunciado completo. A nota 28/40 nao muda.',
'QUEBRA DE PADRAO: a Q01 e erro de INTERPRETACAO, e o primeiro em 240 questoes. CONFIRMADO pelo
usuario em 05/11 ("usei o texto certo") depois que a auditoria dos textos-base levantou a duvida:
o arquivo Simulado_6.pdf em disco esta sem o texto, mas o caderno que ele imprimiu tinha. A
retratacao da migration 0076 foi INDEVIDA e esta desfeita pela 0077.'),
         metadata = (metadata - 'q01_reclassificada' - 'retratacao_0076' - 'pendencia_usuario')
           || jsonb_build_object(
             'q01_confirmada','erro de interpretacao confirmado pelo usuario em 05/11: o caderno impresso tinha o texto-base',
             'historico_0076_0077','a 0076 retratou a conclusao com base no arquivo em disco; a 0077 desfez apos confirmacao do usuario',
             'defeito_em_disco','o Simulado_6.pdf da pasta e a versao sem texto-base; a correta e Simulado_6_v2.pdf')
   where id = v_s6;

  if v_s7 is not null then
    update public.study_sessions
       set notes = replace(notes,
'O "erro de
interpretacao da Q01 do simulado 6" que eu citava aqui foi RETIRADO na migration 0076: aquele caderno
estava sem o texto-base. O diagnostico original vale em cheio — o teto e estoque de informacao, nao
capacidade.',
'O erro de
interpretacao da Q01 do simulado 6 fica como ponto isolado: 1 em 280 questoes (confirmado pelo
usuario; ver migrations 0076 e 0077). O diagnostico original volta a valer em cheio — o teto e
estoque de informacao, nao capacidade.')
     where id = v_s7;
  end if;

  if v_s9 is not null then
    update public.study_sessions
       set notes = replace(notes,
'E, apos a retratacao da migration 0076, a UNICA ocorrencia
nao-recall confirmada em 360 questoes — a Q01 do #6 saiu da conta porque o caderno estava sem o
texto-base.',
'E a segunda ocorrencia
nao-recall em 360 questoes, junto com a Q01 do #6 — que foi confirmada pelo usuario em 05/11 e
continua valendo (ver migrations 0076 e 0077).')
     where id = v_s9;
  end if;

  raise notice 'ok';
end $$;
