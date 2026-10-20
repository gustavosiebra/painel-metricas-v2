-- 0042 — GRANTs explícitos nas tabelas do schema public
--
-- POR QUE (20/10/2026):
-- A partir de 30/10/2026 o Supabase deixa de conceder automaticamente acesso
-- à Data API para tabelas novas criadas em "public" em projetos existentes.
-- Tabelas já existentes mantêm as concessões atuais e não são afetadas.
--
-- O problema não é a produção de hoje: é a reconstrução. Nenhuma das 13
-- migrations que criam tabela (0001–0012, 0035) tem GRANT — todas dependiam
-- da concessão automática. As views e funções sempre tiveram GRANT explícito
-- (25 declarações nas migrations), então só as tabelas estavam descobertas.
--
-- Logo, um `supabase db reset`, um branch de preview ou um projeto novo
-- aplicado depois de 30/10 recriaria as 22 tabelas SEM permissão, e a API
-- devolveria "permission denied" em tudo. Painel em branco.
--
-- Esta migration é no-op no banco atual (as concessões já existem) e existe
-- para que a reconstrução reproduza o estado correto.
--
-- GRANT x RLS são camadas distintas e ambas são necessárias: o GRANT abre a
-- tabela para o papel; a policy decide quais linhas ele enxerga. Todas as 22
-- tabelas já têm RLS ligado e policies por user_id = auth.uid().
--
-- SOBRE O PAPEL "anon": hoje ele tem SELECT em todas as tabelas, herdado da
-- concessão automática. Na prática não lê nada, porque as policies exigem
-- auth.uid(). Mantido aqui para que o reset reproduza o estado atual sem
-- surpresa. Se o objetivo for reduzir superfície, revogar é uma decisão
-- separada e deve ser feita de propósito, em migration própria — não de
-- carona numa correção de compatibilidade.
--
-- CONVENÇÃO A PARTIR DAQUI: toda migration que criar tabela em public inclui
-- os GRANTs na mesma migration. Sem exceção.

do $$
declare
  t text;
  tabelas text[] := array[
    'profiles', 'exam_boards', 'disciplines', 'exams', 'exam_disciplines',
    'question_sets', 'questions', 'study_sessions', 'session_results',
    'question_attempts', 'user_parameters', 'risk_rules', 'error_records',
    'historical_question_stats', 'study_session_boards',
    'exam_templates', 'exam_template_blocks', 'exam_template_rules',
    'exam_attempts', 'exam_attempt_blocks',
    'exam_topics', 'exam_topic_question_sets'
  ];
begin
  foreach t in array tabelas loop
    if to_regclass('public.' || quote_ident(t)) is null then
      raise notice 'tabela public.% nao existe, pulando', t;
      continue;
    end if;
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;
