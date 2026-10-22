-- 0050 — Template e tentativa da prova de Santos (IBAM), corrigindo sessão órfã
--
-- O QUE QUEBROU (21/10/2026):
-- A sessão c69afcb2 (Santos/IBAM, 40 questões) foi inserida por SQL direto,
-- sem o exam_attempt que a interface cria junto. A tela Simulados detectou e
-- listou em "Sessões de simulado sem tentativa", oferecendo ARQUIVAR.
--
-- Arquivar seria perda de dado: aquele guard existe para resíduo de tentativa
-- APAGADA (ver deleteAttempt em simuladoService.js), e a sessão de Santos não
-- é resíduo — é registro legítimo ao qual faltava o vínculo. As outras 8
-- sessões de simulado/prova_oficial do acervo têm attempt; só esta não tinha.
--
-- Erro de processo, não da aplicação: inserir por SQL pulou a regra de que
-- toda sessão de simulado nasce de uma tentativa.
--
-- O QUE ESTA MIGRATION FAZ:
--   1. Cria o template "Santos/IBAM 2026" com os 5 blocos do edital
--   2. Cria o exam_attempt apontando para a sessão existente
--   3. Grava o placar bloco a bloco
--
-- FONTE DOS BLOCOS: Edital nº 74/2026 - SEPLA-RH, item 7.1.1, cargo
-- Engenheiro Civil. Conferido contra o caderno de questões, que traz os
-- mesmos cortes (Q01-10, 11-14, 15-19, 20-27, 28-40).
--
--   Bloco                                     Questões  Peso  Acertos
--   Língua Portuguesa (Q01-10)                   10       1      9
--   Rac. Lógico, Matemática e Dados (Q11-14)      4       1      4
--   Legislação, Dir. Adm., Contratos (Q15-19)     5       2      4
--   Planejamento Urbano, Amb., Obras (Q20-27)     8       3      5
--   Conhecimentos Específicos (Q28-40)           13       4     12
--                                                --            ---
--                                                40             34
--
-- 34/40 brutos = 85,0%. Ponderado: 84,0 de 100 pontos.
-- cutoff_score = 50: o edital exige 50% dos pontos da objetiva (Anexo II).
--
-- scoring_mode 'bruto' porque o IBAM não desconta erro. Os pesos por bloco
-- ficam em exam_template_blocks.weight, como no template da ALECE.
--
-- VERIFICADO após a aplicação: 5 blocos somando 40 questões e 100 pontos,
-- 84 pontos feitos; zero sessões de simulado órfãs no banco.

do $$
declare
  v_user   uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_sess   uuid := 'c69afcb2-f7e8-4146-b40a-b27fd367a1c5';
  v_board  uuid;
  v_tpl    uuid;
  v_att    uuid;
  b record;
begin
  select id into v_board from public.exam_boards where name = 'IBAM';
  if v_board is null then
    raise exception 'Banca IBAM não encontrada (migration 0043 não aplicada?)';
  end if;

  if exists (select 1 from public.exam_attempts where session_id = v_sess) then
    raise notice 'Sessão % já tem tentativa; nada a fazer', v_sess;
    return;
  end if;

  insert into public.exam_templates
    (user_id, name, board_id, scoring_mode, cutoff_score, duration_minutes, status, notes)
  values (v_user, 'Santos/IBAM 2026 - Engenheiro Civil', v_board, 'bruto', 50, 210, 'ativo',
    'Edital 74/2026-SEPLA-RH, item 7.1.1. Prova aplicada em 18/10/2026, 3h30. '
    || 'Aprovação: 50% dos pontos (Anexo II). Habilitação para títulos limitada aos '
    || '60 primeiros da lista geral / 12 da lista de negros.')
  returning id into v_tpl;

  insert into public.exam_template_blocks
    (user_id, template_id, position, name, questions, weight)
  values
    (v_user, v_tpl, 1, 'Língua Portuguesa',                        10, 1),
    (v_user, v_tpl, 2, 'Rac. Lógico, Matemática e Leitura de Dados', 4, 1),
    (v_user, v_tpl, 3, 'Legislação, Dir. Adm., Contratos',           5, 2),
    (v_user, v_tpl, 4, 'Planejamento Urbano, Meio Amb. e Obras',     8, 3),
    (v_user, v_tpl, 5, 'Conhecimentos Específicos',                 13, 4);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-10-21 14:00:00-03', 'simulado', 90, v_sess,
    'Caderno oficial da Prefeitura de Santos (IBAM), aplicado em 18/10/2026. '
    || 'Resolvido FORA do certame: sem inscrição, sem fiscalização, 90 de 210 min. '
    || 'Por isso a sessão é simulado, não prova_oficial. Gabarito preliminar.')
  returning id into v_att;

  for b in
    select bl.id, bl.position,
      (array[9, 4, 4, 5, 12])[bl.position] as acertos,
      bl.questions
    from public.exam_template_blocks bl
    where bl.template_id = v_tpl
    order by bl.position
  loop
    insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong)
    values (v_user, v_att, b.id, b.acertos, b.questions - b.acertos);
  end loop;

  raise notice 'Template %, tentativa % e 5 blocos criados', v_tpl, v_att;
end $$;
