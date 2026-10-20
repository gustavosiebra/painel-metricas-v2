
-- Corrige lacuna: minha checagem anterior (migration 0043) usava
-- "join question_sets" pra achar disciplinas com sessão, o que descarta
-- sessões com question_set_id nulo (caderno não específico, só disciplina).
-- Auditoria Governamental e Língua Portuguesa têm sessão real (1 cada, sem
-- caderno específico) e ficaram de fora por isso. Mesmo critério de antes:
-- peso aleatório (baixo/alto), só pra não ficar vazio.
insert into public.exam_disciplines (user_id, exam_id, discipline_id, weight)
select 'b0d56062-0a37-48de-ae34-5aa79be0aa2a', '8efa35c0-43bd-4106-991b-cc28f7f430bf', d.id,
  (case when random() < 0.5 then 'baixo' else 'alto' end)::weight_level
from public.disciplines d
where d.id in (
  '04324d90-d6fc-4af7-9321-efcf131280f7', -- Auditoria Governamental
  '5ad4e965-0224-4d28-b7da-9612e65eeb72'  -- Língua Portuguesa
)
on conflict (user_id, exam_id, discipline_id) do nothing;
;
