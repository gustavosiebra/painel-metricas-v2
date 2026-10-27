-- 0058 — Q19 do simulado 2 não é conteúdo válido para Curitiba
--
-- POR QUE (27/10/2026): apontado pelo usuário.
--
-- A Q19 (MARIALVA Q26) pergunta quais condições fazem uma edificação ser
-- "considerada concluída" para efeito de regularização. Isso vem do Código de
-- Obras do município que aplicou a prova. Em Curitiba, quem define é o
-- Decreto Municipal 2.397/2023 e a Lei 11.095/2004, e a resposta pode ser
-- outra. O TEMA está no edital (itens 2.1.6 e 2.1.8); a RESPOSTA não transfere.
--
-- FALHA DO MEU FILTRO: ao montar os simulados eu excluí 33 questões de
-- Específicas que CITAVAM o nome de um município. Esta não cita — fala em
-- "órgão municipal" de forma genérica — e passou. Filtrar por nome de cidade
-- não pega dependência de lei local.
--
-- VARREDURA COMPLETA DOS 7 SIMULADOS, com critério estreito (código de obras,
-- código de edificações, habite-se, "considerada concluída", pedido de
-- regularização, lei orgânica): apenas DUAS questões em 280.
--   Simulado 2, Q19  — MARIALVA Q26     (esta)
--   Simulado 3, Q25  — MANOEL RIBAS Q21 (infrações a normas e posturas)
-- Os PDFs não serão refeitos por duas questões; ficam anotadas.
--
-- REVISADAS E MANTIDAS, uma a uma, apesar de mencionarem "município":
--   Sim1 Q16  declividade >= 30% no parcelamento — Lei 6.766 FEDERAL, vale
--   Sim1 Q25  regimes de contratação de obra — Lei 14.133, vale
--   Sim1 Q30  uso de área pública sem autorização — genérico, vale
--   Sim2 Q18  ensaio de compactação em obra municipal — técnico, vale
--   Sim2 Q22  posturas municipais — alternativas genéricas, vale
--   Sim2 Q24  coleta domiciliar de resíduos — técnico, vale
--   Sim2 Q30  vícios após recebimento definitivo — Código Civil/14.133, vale
--   Sim2 Q40  ampliação de sistema de abastecimento — técnico, vale
--   Sim7 Q32  aposentadoria de servidor — requisitos da EC 103, vale
--
-- EFEITO NA NOTA: nenhuma alteração no score medido, que é o que ele de fato
-- fez no caderno. Em questões válidas para Curitiba o resultado é 31 de 39.
-- Ele errou a Q19, então descontá-la melhora o aproveitamento: 79,5% contra
-- os 77,5% registrados.

update public.study_sessions
set notes = notes || E'\n\nANOTACAO (migration 0058): a Q19 nao e conteudo valido para Curitiba.'
  || E'\nAs condicoes para uma edificacao ser "considerada concluida" vem do Codigo de Obras do'
  || E'\nmunicipio que aplicou a prova; em Curitiba quem define e o Decreto 2.397/2023 e a Lei'
  || E'\n11.095/2004. O tema esta no edital (2.1.6 e 2.1.8), a resposta nao transfere.'
  || E'\nEm questoes validas para Curitiba o resultado e 31/39 = 79,5%.'
  || E'\nFalha do filtro de montagem: excluia questoes que CITAVAM o nome do municipio; esta diz'
  || E'\napenas "orgao municipal". Varredura dos 7 simulados achou so mais uma: simulado 3, Q25.',
    metadata = metadata || jsonb_build_object(
      'questoes_nao_aplicaveis', jsonb_build_array(19),
      'acertos_em_questoes_validas', '31/39',
      'revisado_em', '2026-10-27')
where user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'
  and study_type = 'simulado'
  and (occurred_at at time zone 'America/Fortaleza')::date = '2026-10-27';
