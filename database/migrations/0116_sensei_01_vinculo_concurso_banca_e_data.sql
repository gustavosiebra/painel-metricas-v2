-- 0116 — Correcao: a sessao do Sensei 01 nao aparecia no painel
--
-- O usuario reportou: "no painel nao contem nada de estudado hj e nem o
-- simulado feito". Ele estava certo nas duas coisas, e as duas sao erro meu
-- na migration 0114.
--
-- ============================================================
-- ERRO 1 — SESSAO ORFA: sem concurso e sem banca
-- ============================================================
-- Gravei a sessao com exam_id = NULL e board_id = NULL.
-- TODAS as outras 390+ sessoes dele tem exam_id preenchido. O painel filtra
-- pelo concurso ativo (Prefeitura de Curitiba 2026, 8dfb6aba-...), entao uma
-- sessao com exam_id nulo simplesmente nao existe para a interface.
-- Eu conferi a sessao por SELECT direto na tabela e dei por correta; nao
-- conferi se ela aparecia pelo caminho que o usuario usa. Dado gravado nao e
-- a mesma coisa que dado visivel.
--
--   exam_id  -> 8dfb6aba-99fa-4513-8e23-1fb3d60fe68d  Prefeitura de Curitiba 2026
--   board_id -> 7f5d84db-b2c4-4548-be17-372fea7cb07a  Multibanca
--
-- "Multibanca" e a banca certa e ja existia no cadastro dele: o Sensei compila
-- questoes de varias bancas (IPREMED 2021 nas de LP, entre outras) e algumas
-- sao autorais. NAO e Fundacao FAFIPA.
-- Falta tambem a linha em study_session_boards, que e como as outras sessoes
-- ligam sessao e banca.
--
-- ============================================================
-- ERRO 2 — DATA ERRADA
-- ============================================================
-- Gravei occurred_at = 12/11/2026 20:00. Ele me contou do simulado em
-- 13/11/2026; eu presumi "ontem a noite" sem perguntar. Corrigido para
-- 13/11/2026.
-- A HORA (11:30) e ARBITRARIA: so sei o dia e a duracao de 89 min. Fica
-- marcado em metadata.hora_estimada para que ninguem leia como medicao.
--
-- ============================================================
-- ERRO 3 — DISCIPLINA FORA DA CONVENCAO
-- ============================================================
-- Gravei discipline_id = 'Legislacao Especifica'. Um simulado de 40 questoes
-- cobre LP, Informatica e nove unidades de CE: nao e de uma disciplina so.
-- A convencao dele ja era essa: das 19 sessoes com study_type = 'simulado',
-- 18 tem discipline_id NULL. A minha era a unica fora do padrao.
--   discipline_id -> NULL
--
-- Nenhuma questao, tentativa ou resultado e alterado. So os vinculos da sessao.

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam  uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';  -- Prefeitura de Curitiba 2026
  v_board uuid := '7f5d84db-b2c4-4548-be17-372fea7cb07a';  -- Multibanca
  v_set   uuid;
  v_sess  uuid;
  n int;
begin
  select id into v_set from public.question_sets
   where user_id = v_user and name = 'Simulado Sensei 01 — Prefeitura de Curitiba';
  if v_set is null then
    raise exception '0116: question_set do Sensei 01 nao encontrado';
  end if;

  select id into v_sess from public.study_sessions
   where user_id = v_user and question_set_id = v_set and study_type = 'simulado';
  if v_sess is null then
    raise exception '0116: sessao do Sensei 01 nao encontrada';
  end if;

  update public.study_sessions
     set exam_id       = v_exam,
         board_id      = v_board,
         discipline_id = null,
         occurred_at   = '2026-11-13 11:30:00-03',
         metadata      = metadata || jsonb_build_object(
           'hora_estimada', true,
           'hora_estimada_nota','so o dia e a duracao de 89 min sao informados pelo usuario; a hora e arbitraria',
           'corrigido_em','2026-11-13',
           'corrigido_por','migration 0116: a sessao estava sem exam_id e sem board_id e por isso nao aparecia no painel; a data estava em 12/11 por presuncao minha')
   where id = v_sess;

  update public.question_sets
     set exam_id = v_exam
   where id = v_set and exam_id is null;

  insert into public.study_session_boards(user_id, session_id, board_id)
  select v_user, v_sess, v_board
   where not exists (
     select 1 from public.study_session_boards
      where session_id = v_sess and board_id = v_board);

  -- as tentativas acompanham a data da sessao
  update public.question_attempts qa
     set attempted_at = '2026-11-13 11:30:00-03'
    from public.questions q
   where q.id = qa.question_id
     and q.user_id = v_user
     and q.tags->>'banca' = 'SENSEI';
  get diagnostics n = row_count;
  if n <> 40 then
    raise exception '0116: esperava reposicionar 40 tentativas, reposicionei %', n;
  end if;

  raise notice '0116: sessao do Sensei 01 vinculada ao concurso e a banca Multibanca, movida para 13/11';
end $$;
