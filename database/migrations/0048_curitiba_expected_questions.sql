-- 0048 — expected_questions do concurso de Curitiba
--
-- POR QUE (21/10/2026):
-- Os 107 tópicos do edital estavam carregados, mas com expected_questions
-- nulo em 107 de 107. Sem isso o painel ordenava disciplinas por quanto o
-- candidato estudou, nunca por quanto elas valem na prova.
--
-- FONTE: Edital Normativo nº 5/2026 - PMC, Fundação FAFIPA, cargo Engenheiro
-- Civil. Tabela do item 10 e item 11.22. Prova de 06/12/2026, 4 horas,
-- 40 questões de 2,00 pontos = 80 pontos. Aprovação com 48 (item 11.25).
--
--   Língua Portuguesa .......  5 questões  10 pontos
--   Noções de Informática ...  5 questões  10 pontos
--   Conhecimentos Específicos  30 questões 60 pontos
--
-- ATENÇÃO — DADO DO EDITAL x ESTIMATIVA:
--
-- Português (5) e Informática (5) são FATO do edital: a tabela nomeia as duas
-- áreas e dá o número de questões de cada uma.
--
-- As 30 questões de Conhecimentos Específicos o edital NÃO distribui. Ele
-- lista 11 subáreas (2.1 a 2.11) sem dizer quanto cada uma vale. O rateio
-- abaixo é ESTIMATIVA, aprovada pelo usuário em 21/10/2026, e pressupõe que
-- cada um dos 81 itens de Específicas vale o mesmo — premissa que o edital
-- não autoriza e que pode estar errada.
--
--   Edificações ............. 21 itens -> 7,8 -> 8
--   Obras Hídricas .......... 17 itens -> 6,3 -> 6
--   Legislação Específica ... 13 itens -> 4,8 -> 5
--   Direito Administrativo .. 12 itens -> 4,4 -> 4
--   PNFL .................... 11 itens -> 4,1 -> 4
--   Obras Rodoviárias .......  7 itens -> 2,6 -> 3
--                                            ---
--                                             30
--
-- O arredondamento fecha exatamente em 30, sem sobra nem falta.
--
-- A marca da estimativa fica em exam_disciplines.metadata.fonte_expected, para
-- que ninguém leia estes números como se fossem do edital. Se a FAFIPA
-- divulgar a distribuição real, substituir e trocar a marca para 'edital'.

update public.exam_disciplines ed
set expected_questions = v.q,
    metadata = ed.metadata || jsonb_build_object(
      'fonte_expected', v.fonte,
      'expected_definido_em', '2026-10-21',
      'expected_referencia', 'Edital Normativo 5/2026-PMC, item 10 e 11.22'
    )
from (values
  ('Língua Portuguesa',       5, 'edital'),
  ('Informática',             5, 'edital'),
  ('Edificações',             8, 'estimativa_proporcional_aos_topicos'),
  ('Obras Hídricas',          6, 'estimativa_proporcional_aos_topicos'),
  ('Legislação Específica',   5, 'estimativa_proporcional_aos_topicos'),
  ('Direito Administrativo',  4, 'estimativa_proporcional_aos_topicos'),
  ('PNFL',                    4, 'estimativa_proporcional_aos_topicos'),
  ('Obras Rodoviárias',       3, 'estimativa_proporcional_aos_topicos')
) as v(nome, q, fonte)
join public.disciplines d on d.name = v.nome
where ed.exam_id = '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d'
  and ed.discipline_id = d.id;

do $$
declare total int;
begin
  select sum(expected_questions) into total
  from public.exam_disciplines
  where exam_id = '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  if total <> 40 then
    raise exception 'Soma de expected_questions deu %, esperado 40. Abortado.', total;
  end if;
  raise notice 'OK: 40 questoes distribuidas entre 8 disciplinas';
end $$;
