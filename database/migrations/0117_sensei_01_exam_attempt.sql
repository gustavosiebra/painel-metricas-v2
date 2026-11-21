-- 0117 — O Sensei 01 faltava na tabela Historico: nao existia exam_attempt
--
-- O usuario: "nao aparece, mas consta a hora estudada e as questoes no
-- dashboard". Diagnostico exato dele, e aponta para o que eu ainda nao tinha
-- entendido: o painel grava um simulado em DOIS lugares independentes.
--
--   study_sessions + session_results  -> alimenta horas estudadas e questoes
--   exam_attempts  + exam_attempt_blocks -> alimenta a tabela HISTORICO,
--                                           com Modelo, Origem, Nota /80 e
--                                           Habilitacao
--
-- Nas migrations 0114 e 0116 eu preenchi so o primeiro par. Por isso o
-- dashboard somou as 89 horas-minuto e as 40 questoes, e o Historico continuou
-- parando em 10/11/2026.
--
-- Os 12 simulados FAFIPA anteriores todos tem exam_attempt no template
-- "PMC Curitiba" (59e345e4-...), cuja estrutura e exatamente a do edital:
--   bloco 0  Lingua Portuguesa        5 questoes, peso 2
--   bloco 1  Nocoes de Informatica    5 questoes, peso 2
--   bloco 2  Conhecimentos Especificos 30 questoes, peso 2
--   total 40 questoes x 2 = 80 pontos
--
-- O Sensei 01 tem essa mesma estrutura, entao entra no mesmo template e fica
-- comparavel na serie. A distincao de banca NAO se perde: ela esta em
-- study_sessions.board_id = Multibanca (migration 0116), no nome do
-- question_set e em tags.banca de cada questao.
--
-- LANCAMENTO
--   13/11/2026 11:30 (hora arbitraria, ver 0116) | 89 min | origem 'simulado'
--   LP  5/5   INF 5/5   CE 22/30
--   32/40 = 64 de 80 pontos = 80,00%
--
-- Ressalva que acompanha o registro: a correcao e AUTODECLARADA. O gabarito
-- oficial esta na plataforma Planeja e nao foi fornecido; o usuario informou os
-- 8 numeros errados e a letra marcada, e as 32 restantes entraram como acerto
-- por diferenca.

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_tpl   uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';  -- PMC Curitiba
  v_b_lp  uuid := '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f';
  v_b_inf uuid := 'ae44d810-271a-4e27-858f-520cbb7cd67b';
  v_b_ce  uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
  v_set   uuid;
  v_sess  uuid;
  v_att   uuid;
begin
  select id into v_set from public.question_sets
   where user_id = v_user and name = 'Simulado Sensei 01 — Prefeitura de Curitiba';
  select id into v_sess from public.study_sessions
   where user_id = v_user and question_set_id = v_set and study_type = 'simulado';
  if v_sess is null then
    raise exception '0117: sessao do Sensei 01 nao encontrada';
  end if;

  if exists (select 1 from public.exam_attempts where session_id = v_sess) then
    raise notice '0117: exam_attempt do Sensei 01 ja existe, nada a fazer';
    return;
  end if;

  insert into public.exam_attempts(user_id, template_id, occurred_at, origem,
                                   duration_minutes, session_id, notes)
  values (v_user, v_tpl, '2026-11-13 11:30:00-03', 'simulado', 89, v_sess,
          'Simulado 01 do Projeto Sensei da Aprovacao (banca Multibanca, NAO e FAFIPA). '
          || '32/40 = 64 de 80 pontos em 89 min de 240 permitidos. LP 5/5, INF 5/5, CE 22/30. '
          || 'Correcao AUTODECLARADA: o gabarito oficial esta na plataforma Planeja e nao foi '
          || 'fornecido; o usuario informou os 8 erros (16, 20, 22, 24, 27, 31, 32, 33) e a letra '
          || 'marcada, e as 32 restantes entraram como acerto por diferenca. Hora arbitraria.')
  returning id into v_att;

  insert into public.exam_attempt_blocks(user_id, attempt_id, block_id, correct, wrong)
  values (v_user, v_att, v_b_lp,   5, 0),
         (v_user, v_att, v_b_inf,  5, 0),
         (v_user, v_att, v_b_ce,  22, 8);

  raise notice '0117: exam_attempt do Sensei 01 criado — 64/80';
end $$;
