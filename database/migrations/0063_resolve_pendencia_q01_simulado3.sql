-- 0063 — Resolve a pendência da Q01 do simulado 3
--
-- O usuário confirmou em 28/10: "vc tava certo, o gabarito da questao 1 é b e
-- nao tinha percebido". A Q01 foi ACERTO. O resultado 31/40 registrado na 0060
-- estava correto desde o início; só a anotação de dúvida ficou para trás.

update public.study_sessions
set metadata = (metadata - 'pendencia'),
    notes = replace(notes,
'PENDENCIA Q01: informada como erro mas "B" e o gabarito. Registrada como acerto, nao arbitrada.
Se a Q01 foi erro: 30/40 = 60 pontos e Portugues 4/5.',
'Q01: informada como erro por engano de transcricao; o usuario confirmou em 28/10 que B e o
gabarito e que foi ACERTO. Resultado 31/40 confirmado.')
where user_id='b0d56062-0a37-48de-ae34-5aa79be0aa2a' and study_type='simulado'
  and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-28';
