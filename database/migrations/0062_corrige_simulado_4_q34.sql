-- 0062 — Corrige o simulado nº 4: a Q34 era erro
--
-- POR QUE (29/10/2026): o usuário informou "34-c", mas C é o gabarito.
-- Registrei na 0061 como acerto e deixei a pendência anotada em vez de
-- arbitrar. Ele corrigiu: marcou A.
--
-- Q34 (MANOEL RIBAS Q19) — NBR 10004, código dos resíduos inflamáveis.
-- Gabarito C = D001. Ele marcou A = D003.
--
-- CORREÇÃO: 32/40 e 64 pontos passam a 31/40 e 62 pontos.
-- Conhecimentos Específicos cai de 25/30 para 24/30.
--
--   bloco          antes   depois
--   Portugues       4/5     4/5
--   Informatica     3/5     3/5
--   Especificas    25/30   24/30
--   TOTAL          32/40   31/40   (64 -> 62 pontos)
--
-- SERIE CORRIGIDA:
--   #1  55 min  30/40  60 pts  PT 3/5 · INF 4/5 · ESP 23/30
--   #2  70 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #3  75 min  31/40  62 pts  PT 5/5 · INF 4/5 · ESP 22/30
--   #4  66 min  31/40  62 pts  PT 4/5 · INF 3/5 · ESP 24/30
--
-- O total ficou em 31 por tres simulados seguidos. Especificas melhorou de
-- 22 para 24, mas Portugues e Informatica devolveram as duas questoes.
--
-- TERCEIRA OCORRENCIA desse tipo de divergencia na transcricao: Q36 do #2
-- (corrigida para E), Q01 do #3 (confirmada como acerto) e Q34 agora. Em dois
-- dos tres casos a letra informada era a do gabarito e a marcacao real era
-- outra. Vale conferir a folha antes de passar a lista.
--
-- Atualizacao por id da sessao, nunca por data.

do $$
declare
  v_sess uuid;
  v_esp uuid := '199a8c4c-7df7-4bfa-a77c-859f5b296b1f';
begin
  select id into v_sess from public.study_sessions
  where user_id='b0d56062-0a37-48de-ae34-5aa79be0aa2a' and study_type='simulado'
    and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-29';
  if v_sess is null then raise exception 'sessao do simulado 4 nao encontrada'; end if;

  update public.session_results
  set correct_total=31, wrong_total=9, score=62 where session_id=v_sess;

  update public.exam_attempt_blocks ab set correct=24, wrong=6
  from public.exam_attempts ea
  where ea.id=ab.attempt_id and ea.session_id=v_sess and ab.block_id=v_esp;

  update public.study_sessions
  set notes = replace(replace(replace(notes,
        'RESULTADO: 32/40 = 80,0%. Ponderado 64/80',
        'RESULTADO: 31/40 = 77,5%. Ponderado 62/80'),
        'Especificas 25/30.','Especificas 24/30.'),
        'PENDENCIA Q34: informada como erro mas "C" e o gabarito (NBR 10004, inflamavel = D001).
Registrada como acerto. Se foi erro: 31/40 = 62 pontos e Especificas 24/30.',
        '34 · C · A · NBR 10004: residuo inflamavel e D001; marcou D003
(a primeira informacao dizia "34-c"; corrigido pelo usuario para A — ver migration 0062)'),
      metadata = (metadata - 'pendencia')
        || jsonb_build_object('pontuacao_ponderada',62,
                              'erros', jsonb_build_array(4,6,7,17,27,29,31,32,34))
  where id=v_sess;
  raise notice 'simulado 4 corrigido para 31/40';
end $$;
