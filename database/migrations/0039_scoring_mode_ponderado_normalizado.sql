-- 0039 — Terceiro modo de pontuação: média ponderada de notas normalizadas
-- por módulo. Aplicada no Supabase em 13/09/2026 sob o nome
-- `scoring_mode_ponderado_normalizado`.
--
-- MOTIVO
-- A leitura dos editais reais de três concursos do usuário (13/09/2026)
-- mostrou que cada banca pontua de um jeito e que os dois modos existentes
-- não davam conta:
--
--   TCE-SP (Vunesp, Edital 001/2026, itens 9.6.2 e 9.16)
--     1 ponto por questão, SEM peso. Habilitação por CONTAGEM DE ACERTOS por
--     módulo: mínimo 12 em Conhecimentos Gerais E 36 em Específicos.
--     -> modo `bruto` com peso 1 já representa. Nada a mudar.
--
--   ALECE (IDECAN, Edital 01/2026, itens 11.1.1, 11.2.1 e 11.3)
--     Peso 1 nas disciplinas de Gerais e peso 2 em Específicos; máximo 120.
--     Aprovação cumulativa: 50% do total E >= 1,00 ponto em CADA DISCIPLINA
--     de Gerais E >= 2,00 pontos em Específicos.
--     -> modo `bruto` representa a nota, mas o critério "cada disciplina de
--        uma área" não era expressável: `scope=cada_bloco` existia e valia
--        para a prova inteira, sem como restringir a um módulo.
--
--   TJ-CE (FCC, itens 11.1 a 11.4.1)
--     Cada prova (Gerais e Específicos) é avaliada na escala 0 a 10
--     SEPARADAMENTE e só então entra na média aritmética ponderada (peso 1 e
--     peso 3). Corte 6,00 na ampla concorrência e 4,80 para quem concorre às
--     vagas reservadas (Resolução CNJ 516/2023).
--     -> nenhum modo existente representava. É esta migração.
--
-- A diferença não é arredondamento. Caso real do usuário (prova de
-- 09/08/2026, 7/20 em Gerais e 27/40 em Específicos):
--     modo bruto      (7*1 + 27*3) / (20*1 + 40*3) = 88/140 = 62,86%
--     regra do edital (3,50*1 + 6,75*3) / 4        = 5,9375 = 59,38%
-- O painel mostrava 62,86% e dava impressão de folga; o edital dava 0,0625 de
-- diferença para o corte da ampla. Conferido contra o resultado publicado.
--
-- COMO FUNCIONA
--   nota de cada MÓDULO = (acertos / questões) * 10
--   nota final = soma(nota_módulo * peso_módulo) / soma(peso_módulo)
--   máximo sempre 10
-- O peso vem dos blocos do módulo e precisa ser uniforme dentro dele — a tela
-- avisa se não for, em vez de escolher um em silêncio.
--
-- A unidade de normalização é o MÓDULO e não o bloco porque é o que o edital
-- chama de "prova". A quebra em blocos abaixo do módulo (PNFL, Edificações,
-- Obras Rodoviárias…) não existe em edital nenhum: é diagnóstica, montada pelo
-- usuário para saber onde estudar. São dois eixos diferentes convivendo na
-- mesma tabela, e confundi-los foi o que levou a tela a mostrar número errado.
--
-- ADITIVO: nenhum modelo existente muda de comportamento.
--
-- Os dados dos modelos do usuário (ALECE reestruturada em 4 blocos, TJ-CE
-- migrado para este modo, notas de rodapé dos três com os itens do edital)
-- foram ajustados à parte — são dados, não esquema.

alter table public.exam_templates
  drop constraint if exists exam_templates_scoring_mode_check;

alter table public.exam_templates
  add constraint exam_templates_scoring_mode_check
  check (scoring_mode = any (array['bruto'::text, 'liquido'::text, 'ponderado_normalizado'::text]));

comment on column public.exam_templates.scoring_mode is
  'bruto: nota = acertos x peso. liquido (Cebraspe): (acertos - erros) x peso. ponderado_normalizado (FCC/TJ-CE): cada modulo vai para escala 0-10 e so entao entra na media ponderada pelos pesos.';

-- `scope=cada_bloco` já existia no CHECK de exam_template_rules; o que muda é
-- que module_name deixa de ser exclusivo de `scope=modulo` e passa a
-- restringir a regra aos blocos de um módulo. Só comentário — nenhuma
-- constraint precisava mudar.
comment on column public.exam_template_rules.module_name is
  'Nome do modulo alvo. Obrigatorio em scope=modulo. Em scope=cada_bloco e OPCIONAL: preenchido, restringe a regra aos blocos daquele modulo (ex.: ALECE 11.3.b, "no minimo 1,00 ponto em cada disciplina integrante da area de Conhecimentos Gerais"); nulo, a regra vale para todos os blocos do modelo.';
