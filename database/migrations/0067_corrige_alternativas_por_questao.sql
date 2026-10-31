-- 0067 — Corrige erro factual meu sobre o formato da prova de Curitiba
--
-- As cinco sessoes de simulado FAFIPA foram gravadas com o metadado
--   'alternativas_por_questao' = 'maioria 5 (A-E); a prova de Curitiba tera 4'
--
-- A segunda metade da frase esta ERRADA. Conferido hoje no texto do proprio
-- Edital Normativo no 5/2026 - PMC, item 11.22:
--
--   "A prova objetiva sera composta de 40 (quarenta) questoes distribuidas por
--    areas de conhecimento. Cada questao da prova objetiva tera 05 (cinco)
--    alternativas, sendo que cada questao tera apenas 1 (uma) alternativa
--    correta, pontuadas conforme a tabela do item 10."
--
-- Ou seja: a prova de Curitiba tera CINCO alternativas, nao quatro. Eu havia
-- afirmado o contrario e repetido isso em cinco registros.
--
-- Demais parametros do mesmo bloco do edital, conferidos na mesma leitura:
--   item 11.22  40 questoes, 5 alternativas, 1 correta
--   item 11.23  duracao de 04 (quatro) horas, incluida a marcacao do cartao
--   item 11.25  nota minima de 48 pontos numa escala de 0 a 80
--
-- Consequencia pratica: os simulados montados com questoes de 5 alternativas
-- estao CERTOS em formato. O desvio esta nas 43 questoes de 4 alternativas
-- herdadas de provas antigas da banca, concentradas nos simulados 1 a 7.
--
-- Atualizacao por id de sessao, via chave do metadado.

update public.study_sessions
set metadata = metadata || jsonb_build_object(
      'alternativas_por_questao', '5 (A-E), conforme o item 11.22 do Edital 5/2026-PMC',
      'formato_prova_edital', '40 questoes - 5 alternativas - 1 correta - 4 horas - minimo 48 de 80 pontos (itens 11.22, 11.23 e 11.25)')
where user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'
  and metadata->>'alternativas_por_questao' = 'maioria 5 (A-E); a prova de Curitiba tera 4';
