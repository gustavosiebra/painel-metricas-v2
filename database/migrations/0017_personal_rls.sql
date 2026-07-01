-- Fase 1 — RLS das tabelas Pessoais: exam_disciplines, study_sessions,
-- session_results, question_attempts, user_parameters.
-- Isolamento estrito por user_id = auth.uid(), sem exceção e sem linha global.

do $$
declare
  t text;
begin
  foreach t in array array['exam_disciplines','study_sessions','session_results','question_attempts','user_parameters']
  loop
    execute format($f$
      create policy %1$s_all_own on public.%1$s
      for all to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
    $f$, t);
  end loop;
end;
$$;
