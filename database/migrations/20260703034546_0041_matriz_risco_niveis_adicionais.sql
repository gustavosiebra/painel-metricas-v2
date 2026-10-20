
-- Aditivo, sem conflito com decisão anterior: adiciona valores que nunca
-- existiram nesses enums (ALTER TYPE ADD VALUE não quebra nada existente).
-- 'critico' em learning_level: nível de aprendizado com desempenho ruim mas
-- já com dado (distinto de 'novo' = ainda sem prática/dado). Vem da matriz
-- de risco real do usuário (planilha Excel, coluna "Nível Atual").
alter type learning_level add value if not exists 'critico';
-- 'muito_baixo' em risk_level: a matriz do usuário tem 5 níveis de risco
-- (a tabela atual só ia até muito_alto, faltava o extremo oposto).
alter type risk_level add value if not exists 'muito_baixo';
;
