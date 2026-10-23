-- 0052 — Incidência histórica da FAFIPA nos tópicos de Português e Informática
--
-- FONTE (23/10/2026): levantamento do usuário no TEC Concursos, filtrando a
-- banca Fundação FAFIPA e agrupando por assunto. Três arquivos:
--   portugues_fafipa.txt .... 67 assuntos,  1.321 questões
--   informatica.txt ......... 59 assuntos,    486 questões
--   eng civil.txt ........... 62 assuntos,    179 questões
--
-- MÉTODO: cada assunto do TEC foi atribuído a exatamente um tópico do edital
-- de Curitiba; somadas as questões por tópico; a fração resultante multiplica
-- as 5 questões do bloco. As somas fecham: 1.321 em Português e 438 em
-- Informática (486 menos as 48 "Sem Classificação", que não dá para atribuir).
--
-- ENGENHARIA CIVIL FICA DE FORA, DE PROPÓSITO. Com n = 179, um assunto de 10
-- questões estima 1,16 +/- 0,70 questões — o intervalo é do tamanho da
-- estimativa, e a ordem abaixo do topo é ruído. Gravar número por tópico ali
-- daria aparência de medição a um chute. As Específicas continuam com a
-- estimativa proporcional da migration 0048, que ao menos se declara
-- estimativa.
--
-- LIMITES QUE FICAM REGISTRADOS:
--   1. É o histórico da FAFIPA inteira, todos os cargos e editais. Serve como
--      prior sobre o estilo da banca, não como previsão desta prova.
--   2. "Inteligência artificial e ferramentas generativas" (tópico 26) e
--      "Atalhos de teclado" (16) ficam com 0,00. ZERO AQUI É AUSÊNCIA DE
--      PRECEDENTE, NÃO PREVISÃO DE AUSÊNCIA — são itens do edital sem nenhuma
--      questão no histórico, o que tanto pode significar tema novo quanto
--      enchimento de conteúdo programático. Não tratar como dispensável.
--   3. O tópico 12 (Literatura Brasileira ... figuras de linguagem) recebe
--      0,17 que vem INTEIRAMENTE de "Figuras de Linguagem" (43 questões).
--      Literatura propriamente dita — prosa, poesia, autores e obras — tem
--      ZERO ocorrências em 1.321 questões.
--   4. Crase (33 questões, 2,50%) e Regência (5) entraram em "Funções
--      sintáticas" por falta de item próprio no edital. A FAFIPA cobra crase
--      com regularidade e o edital de Curitiba não a menciona.
--   5. Protocolos e conceitos de rede entraram em "Navegadores de Internet"
--      pelo mesmo motivo: o edital não tem item de redes.

update public.exam_topics t
set expected_questions = v.q
from (values
  -- Língua Portuguesa — 5 questões, base 1.321
  (1,  1.26),  -- Análise e interpretação de texto (332: interpretação 280 + mescladas 34 + reescrita 14 + outras 4)
  (2,  0.12),  -- Comunicação, linguagem e variações linguísticas (33)
  (3,  0.13),  -- Gêneros e tipologias textuais (35)
  (4,  0.12),  -- Elementos de coesão e coerência textual (32)
  (5,  0.59),  -- Ortografia oficial (155: fonética 83 + acentuação 47 + ortografia 16 + hífen 6 + homônimos 3)
  (6,  0.97),  -- Emprego das classes de palavras (256: conjunção 53 + verbo 44 + advérbio 22 + adjetivo 21 + pronomes 30 + outras 86)
  (7,  0.43),  -- Semântica (114: sinônimos 49 + significação 35 + conotação 21 + outras 9)
  (8,  0.85),  -- Funções sintáticas (225: sujeito 34 + acessórios 34 + crase 33 + transitividade 32 + orações 55 + outras 37)
  (9,  0.16),  -- Concordâncias nominal e verbal (42)
  (10, 0.14),  -- Pontuação (37)
  (11, 0.06),  -- Uso dos porquês (16)
  (12, 0.17),  -- Literatura Brasileira / figuras de linguagem (44 — todas de figuras; literatura = 0)
  -- Noções de Informática — 5 questões, base 438
  (13, 0.16),  -- Conceitos de informática (14)
  (14, 0.62),  -- Hardware de entrada e saída (54: memórias 22 + periféricos 15 + mescladas 8 + CPU 4 + barramentos 3 + transmissão 2)
  (15, 0.11),  -- Software (10: suítes e Workspace)
  (16, 0.00),  -- Atalhos de teclado — SEM PRECEDENTE
  (17, 0.32),  -- Gerenciamento de arquivos (28: extensões 12 + compactadores 9 + sistemas de arquivos 7)
  (18, 0.32),  -- Segurança de dados (28: procedimentos 9 + ameaças 5 + demais 14)
  (19, 0.87),  -- Ambientes operacionais (76: Win10 34 + Win11 31 + Linux 7 + Win7 4)
  (20, 0.70),  -- Processador de texto Word (61: 2016 53 + 2019 6 + outros 2)
  (21, 0.81),  -- Planilhas Excel (71: 2016 52 + 2019 19)
  (22, 0.72),  -- Navegadores de Internet (63: mescladas 22 + Chrome 17 + internet 11 + redes 8 + outros 5)
  (23, 0.11),  -- Armazenamento e nuvem (10)
  (24, 0.17),  -- E-mails (15)
  (25, 0.09),  -- Busca e pesquisa na Web (8)
  (26, 0.00)   -- IA e ferramentas generativas — SEM PRECEDENTE
) as v(pos, q)
where t.exam_id = '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d'
  and t."position" = v.pos;

do $$
declare
  som_pt numeric; som_inf numeric;
begin
  select sum(expected_questions) into som_pt from public.exam_topics
   where exam_id='8dfb6aba-99fa-4513-8e23-1fb3d60fe68d' and "position" between 1 and 12;
  select sum(expected_questions) into som_inf from public.exam_topics
   where exam_id='8dfb6aba-99fa-4513-8e23-1fb3d60fe68d' and "position" between 13 and 26;
  if abs(som_pt - 5) > 0.05 or abs(som_inf - 5) > 0.05 then
    raise exception 'Somas erradas: portugues=%, informatica=% (esperado 5,00 cada)', som_pt, som_inf;
  end if;
  raise notice 'OK: portugues=%, informatica=%', som_pt, som_inf;
end $$;
