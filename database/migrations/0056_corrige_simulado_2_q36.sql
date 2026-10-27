-- 0056 — Corrige o simulado nº 2: a Q36 era erro
--
-- POR QUE (27/10/2026):
-- Na primeira informação o usuário listou "36-a" entre os erros, mas A é o
-- gabarito da questão. Registrei na 0055 como acerto (32/40) e deixei a
-- pendência anotada em vez de arbitrar. Ele corrigiu em seguida: marcou E.
--
-- Q36 (Avaliações e perícias, 20H CAMPO DO TENENTE Q25) pede a atividade que
-- NÃO é atribuição do engenheiro que avalia a estrutura. Gabarito A, "executar
-- serviços de reparo e manutenção". O usuário marcou E, "efetuar
-- arbitramentos" — que É atribuição, logo não era a exceção.
--
-- CORREÇÃO: 32/40 e 64 pontos passam a 31/40 e 62 pontos.
--
--   bloco           antes    depois
--   Portugues        5/5      5/5
--   Informatica      4/5      4/5
--   Especificas     23/30    22/30
--   TOTAL           32/40    31/40   (64 -> 62 pontos)
--
-- Com isso o simulado 2 fica em 31/40 contra 30/40 do simulado 1: +1 questão,
-- não +2. E Específicas vai de 23/30 para 22/30 entre os dois — piorou uma.
--
-- Atualização por id da sessão, nunca por data — a regra desde o incidente de
-- 20/10, quando um WHERE por data atingiu três sessões em vez de uma.
--
-- DEFEITO DESTA MIGRATION, corrigido na 0057: a remoção da chave 'pendencia'
-- do metadata não funcionou por precedência de operador no jsonb.

do $$
declare
  v_sess uuid;
  v_bloco_esp uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
begin
  select ss.id into v_sess
  from public.study_sessions ss
  where ss.user_id = 'b0d56062-0a37-48de-ae34-5aa79be0aa2a'
    and ss.study_type = 'simulado'
    and (ss.occurred_at at time zone 'America/Fortaleza')::date = '2026-10-27';
  if v_sess is null then raise exception 'sessao do simulado 2 nao encontrada'; end if;

  update public.session_results
  set correct_total = 31, wrong_total = 9, score = 62
  where session_id = v_sess;

  update public.exam_attempt_blocks ab
  set correct = 22, wrong = 8
  from public.exam_attempts ea
  where ea.id = ab.attempt_id and ea.session_id = v_sess and ab.block_id = v_bloco_esp;

  update public.study_sessions
  set notes = replace(replace(replace(notes,
        'RESULTADO: 32/40 = 80,0%. Ponderado 64/80',
        'RESULTADO: 31/40 = 77,5%. Ponderado 62/80'),
        'Especificas 23/30.',
        'Especificas 22/30.'),
        'RESSALVA Q36: usuario informou ter marcado A, que e o gabarito. Registrado como acerto.
Se a Q36 foi erro, o resultado e 31/40 = 62 pontos. Pendencia nao arbitrada.',
        '36 · A · E · Avaliacoes: a EXCECAO e executar reparo e manutencao; arbitramento E atribuicao
(a primeira informacao dizia "36-a"; corrigido pelo usuario para E — ver migration 0056)'),
      metadata = metadata
        || jsonb_build_object('pontuacao_ponderada', 62,
                              'erros', jsonb_build_array(7,12,16,19,23,29,33,34,36))
        - 'pendencia'
  where id = v_sess;

  raise notice 'simulado 2 corrigido para 31/40';
end $$;
