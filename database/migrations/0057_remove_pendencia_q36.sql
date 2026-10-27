-- 0057 — Remove a chave 'pendencia' do metadata do simulado 2
--
-- Defeito da própria 0056: escrevi
--     metadata || jsonb_build_object(...) - 'pendencia'
-- e o operador '-' do jsonb liga mais forte que o '||'. O que foi avaliado
-- primeiro foi  jsonb_build_object(...) - 'pendencia'  — removendo a chave de
-- um objeto que não a tinha — e só depois o merge. A pendência original
-- sobreviveu, descrevendo uma dúvida que já estava resolvida.
--
-- Agora com parênteses. Conferido que notes já estava correto.

update public.study_sessions
set metadata = (metadata - 'pendencia')
where user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'
  and study_type = 'simulado'
  and (occurred_at at time zone 'America/Fortaleza')::date = '2026-10-27'
  and metadata ? 'pendencia';
