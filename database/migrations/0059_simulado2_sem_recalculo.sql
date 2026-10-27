-- 0059 — Remove o recálculo "31/39" do simulado 2
--
-- POR QUE (27/10/2026): decisão do usuário. "Nao quero que desconte nada,
-- deixa como esta. Nao diminua o erro."
--
-- Na 0058 eu anotei que, descontando a Q19 (conteúdo que não transfere para
-- Curitiba), o aproveitamento em questões válidas seria 31/39 = 79,5% em vez
-- de 31/40 = 77,5%. Era uma leitura defensável e, olhando de novo, também é
-- uma leitura mais generosa do que a situação merece: o erro aconteceu, e na
-- prova real haverá questões fora de controle do mesmo jeito. Recalcular para
-- cima treina o hábito errado de procurar o número que favorece.
--
-- O QUE FICA: a anotação de que o CONTEÚDO da Q19 não vale para Curitiba —
-- isso é informação de estudo, serve para ele não decorar a regra de Marialva.
-- O QUE SAI: a nota recalculada e a chave de metadata correspondente.
--
-- Resultado registrado continua 31/40 = 77,5%, 62 de 80 pontos.

update public.study_sessions
set notes = replace(notes,
      E'\nEm questoes validas para Curitiba o resultado e 31/39 = 79,5%.', ''),
    metadata = (metadata - 'acertos_em_questoes_validas')
where user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'
  and study_type = 'simulado'
  and (occurred_at at time zone 'America/Fortaleza')::date = '2026-10-27';
