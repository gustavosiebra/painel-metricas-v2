-- Fase 1 — RLS das tabelas de Catálogo: exam_boards, disciplines, exams,
-- question_sets, questions, risk_rules.
-- SELECT liberado a qualquer autenticado para linha global (user_id null) e para a própria.
-- INSERT/UPDATE/DELETE em linha global restrito a is_admin(); linha própria livre ao dono.

do $$
declare
  t text;
begin
  foreach t in array array['exam_boards','disciplines','exams','question_sets','questions','risk_rules']
  loop
    execute format($f$
      create policy %1$s_select on public.%1$s
      for select to authenticated
      using (user_id is null or user_id = auth.uid());
    $f$, t);

    execute format($f$
      create policy %1$s_insert on public.%1$s
      for insert to authenticated
      with check (user_id = auth.uid() or (user_id is null and public.is_admin()));
    $f$, t);

    execute format($f$
      create policy %1$s_update on public.%1$s
      for update to authenticated
      using (user_id = auth.uid() or (user_id is null and public.is_admin()))
      with check (user_id = auth.uid() or (user_id is null and public.is_admin()));
    $f$, t);

    execute format($f$
      create policy %1$s_delete on public.%1$s
      for delete to authenticated
      using (user_id = auth.uid() or (user_id is null and public.is_admin()));
    $f$, t);
  end loop;
end;
$$;
