
-- Peso aleatório (pedido explícito do usuário) só para disciplinas que já
-- têm sessão de estudo registrada mas nunca receberam Peso: AFO, Direito
-- Constitucional, Obras Hídricas. Mantido binário (baixo/alto) — decisão
-- de manter o enum como está, "médio vira baixo" (ver pergunta anterior).
-- Sem critério analítico aqui: é aleatório mesmo, como pedido. Revise depois
-- pelo atalho em Nova Sessão quando quiser um valor real.
insert into public.exam_disciplines (user_id, exam_id, discipline_id, weight)
select 'b0d56062-0a37-48de-ae34-5aa79be0aa2a', '8efa35c0-43bd-4106-991b-cc28f7f430bf', d.id,
  (case when random() < 0.5 then 'baixo' else 'alto' end)::weight_level
from public.disciplines d
where d.id in (
  '330621d4-0fc0-4de9-865a-7b681d34970c', -- AFO
  '2a70ceba-8d02-4c5f-93fb-4eed8dfa932f', -- Direito Constitucional
  '910b8aaf-105a-4a84-9835-59c27ff21c6b'  -- Obras Hídricas
)
on conflict (user_id, exam_id, discipline_id) do nothing;
;
