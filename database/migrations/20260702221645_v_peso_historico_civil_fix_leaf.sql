drop view public.v_peso_historico_civil;

create view public.v_peso_historico_civil
with (security_invoker = true) as
select
  d.id as discipline_id,
  d.name as discipline_name,
  b.id as board_id,
  b.name as board_name,
  count(*) as cadernos,
  sum(hqs.quantidade) as quantidade_total,
  round(
    100.0 * sum(hqs.quantidade)
    / nullif(sum(sum(hqs.quantidade)) over (partition by b.id), 0),
    2
  ) as percentual_dentro_da_banca
from public.historical_question_stats hqs
join public.question_sets qs on qs.id = hqs.question_set_id
join public.disciplines d on d.id = qs.discipline_id
join public.exam_boards b on b.id = hqs.board_id
where hqs.is_leaf
group by d.id, d.name, b.id, b.name;
;
