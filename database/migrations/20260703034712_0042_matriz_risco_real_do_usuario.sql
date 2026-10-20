
-- Substitui o esqueleto genérico (0040) pela matriz real e já validada pelo
-- usuário na própria planilha Excel (Nível Atual x Peso -> Risco -> Ação).
-- Peso ficou binário (decisão mantida): "Médio" da planilha foi colapsado
-- para "Baixo" (decisão explícita do usuário — "médio vira baixo"), então a
-- linha usada aqui é a coluna "Baixo" original da planilha, não uma média.
-- 'novo' (caderno sem dado/prática ainda) não existe na planilha do usuário
-- (ela não tem esse estado) — as 2 linhas 'novo' abaixo são extrapolação
-- minha para não deixar a matriz incompleta; usuário deve revisar/ajustar.

delete from public.risk_rules where user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';

insert into public.risk_rules (user_id, learning_level, weight, risk, recommended_action, active, metadata)
values
  -- Da planilha do usuário (fonte real, validada):
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','critico','alto','muito_alto','TEORIA + ERROS', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','critico','baixo','medio','QUESTÕES DIRECIONADAS', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','aprendendo','alto','alto','REVISAR + ERROS', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','aprendendo','baixo','medio','QUESTÕES DIRECIONADAS', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','consolidando','alto','baixo','MANUTENÇÃO SEMANAL', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','consolidando','baixo','baixo','MANUTENÇÃO SEMANAL', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','dominado','alto','muito_baixo','REVISÃO ESPAÇADA', true, '{"origem":"planilha_usuario"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','dominado','baixo','muito_baixo','REVISÃO ESPAÇADA', true, '{"origem":"planilha_usuario"}'),
  -- Extrapolação minha (caderno nunca estudado — estado que não existe na planilha):
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','novo','alto','alto','REVISAR + ERROS', true, '{"origem":"extrapolacao_claude_revisar"}'),
  ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','novo','baixo','medio','QUESTÕES DIRECIONADAS', true, '{"origem":"extrapolacao_claude_revisar"}');
;
