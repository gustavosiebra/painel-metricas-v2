-- 0049 — Vincula o caderno da Lei 11.095/2004 ao tópico do edital
--
-- POR QUE (21/10/2026):
-- Legislação Específica aparecia com 13 tópicos e ZERO cadernos em
-- v_edital_cobertura, embora o usuário tivesse estudado: leitura em 17 e
-- 18/10 e 10 questões em 21/10, no caderno "LEI MUNICIPAL Nº 11.095/2004".
--
-- O caderno existe; faltava a linha em exam_topic_question_sets. Como a view
-- navega tópico -> caderno -> sessão, o estudo de legislação municipal era
-- invisível para a cobertura do edital.
--
-- VINCULADO AQUI: apenas o tópico 32, "Lei Municipal nº 11.095/2004 -
-- aprovação de projetos, licenciamento, execução e conservação de obras".
-- O nome do caderno é idêntico ao do tópico; não há ambiguidade.
--
-- NÃO VINCULADO: o tópico 34, "Processos de aprovação e licenciamento de
-- projetos e obras". A lei cobre o assunto, mas o tópico é genérico e o
-- usuário ainda não confirmou. Vincular por semelhança temática seria supor.
--
-- PERMANECEM SEM CADERNO (11 de Legislação Específica + 1 de Obras Hídricas):
--   27 Lei Orgânica do Município de Curitiba (1990)
--   28 Lei Municipal 1.656/1958 - Estatuto dos Funcionários
--   29 Lei Municipal 7.671/1991 - organização do Executivo
--   30 Lei Municipal 15.511/2019 - zoneamento, uso e ocupação do solo
--   31 Decreto Municipal 2.397/2023 - regulamentação das edificações
--   33 Normas e posturas municipais; fiscalização e infrações
--   34 Processos de aprovação e licenciamento de projetos e obras
--   35 Desmembramentos e loteamentos
--   36 Abertura e implantação de ruas
--   37 Decreto Municipal 700/2023
--   38 Decreto Municipal 1.206/2023 - licitações de obras
--   39 Decreto Municipal 383/2023 - ETP
--   77 Softwares de simulação hidrológica e hidráulica (HEC-RAS e SWMM)
--
-- Pela estimativa da 0048, Legislação Específica vale ~5 questões = 10 pontos
-- de 80. Em 21/10 tinha 0,8h de estudo de um total de 26,3h.

insert into public.exam_topic_question_sets (user_id, topic_id, question_set_id)
select 'b0d56062-0a37-48de-ae34-5aa79be0aa2a',
       'b40e53ca-06c6-486a-b654-6d9b8ae6fc33',
       '7cda8d90-3daa-46a6-bff5-c7824149887d'
where not exists (
  select 1 from public.exam_topic_question_sets
  where topic_id = 'b40e53ca-06c6-486a-b654-6d9b8ae6fc33'
    and question_set_id = '7cda8d90-3daa-46a6-bff5-c7824149887d'
);
