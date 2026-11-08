-- 0074 — Guarda o benchmark de Cruz Machado para comparacao posterior
--
-- POR QUE: ele pediu "guarde esse resultado de cruz machado para ser comparado
-- depois que fizer as questoes dele". As 18 notas de Engenheiro Civil ficam
-- aqui para que, quando ele resolver a prova de Cruz Machado inteira, de para
-- comparar questao a questao contra candidatos reais.
--
-- FONTE: Anexo III do Edital 08.004/2025 (resultado preliminar da prova
-- objetiva) e Edital de Abertura 01.004/2025, Tabela 10.6, ambos baixados do
-- site da FAFIPA em 04/11/2026.
--
-- ESTRUTURA DA PROVA (Tabela 10.6, nivel superior, demais cargos):
--   LP 5 x 2,00 = 10 | Mat/RL 5 x 2,00 = 10 | Informatica 3 x 2,00 = 6
--   Legislacao 7 x 2,00 = 14 | Especificas 20 x 3,00 = 60
--   TOTAL 40 questoes, 100 pontos. Titulos valem mais 10 (de 110).
--
-- ATENCAO AO COMPARAR: a estrutura NAO e a de Curitiba (5 LP + 5 INF + 30 CE,
-- 80 pontos). Cruz Machado tem Matematica e Legislacao como blocos proprios e
-- so 20 questoes de Especificas com peso 3. A comparacao valida e por
-- PERCENTUAL dentro de cada bloco, nunca por pontos absolutos.

insert into public.user_parameters (user_id, key, value, scope)
values ('b0d56062-0a37-48de-ae34-5aa79be0aa2a','benchmark_fafipa_cruz_machado_2025',
jsonb_build_object(
  'fonte','Anexo III do Edital 08.004/2025 (resultado preliminar da prova objetiva), Fundacao FAFIPA',
  'url_resultado','https://anexos-r2.selecao.net.br/uploads/281/concursos/4173/anexos/c20f4b35-5170-43c7-9b6d-c02c1b0cddd6.pdf',
  'url_edital','https://anexos-r2.selecao.net.br/uploads/281/concursos/4173/anexos/7d344afc-2e6d-489b-bc3f-d9bfacdba383.pdf',
  'coletado_em','2026-11-04',
  'cargo','Engenheiro Civil - Cruz Machado - PR',
  'n_candidatos',18,
  'estrutura', jsonb_build_object(
    'lp', jsonb_build_object('questoes',5,'peso',2,'max',10),
    'mat_rl', jsonb_build_object('questoes',5,'peso',2,'max',10),
    'informatica', jsonb_build_object('questoes',3,'peso',2,'max',6),
    'legislacao', jsonb_build_object('questoes',7,'peso',2,'max',14),
    'especificas', jsonb_build_object('questoes',20,'peso',3,'max',60),
    'total_questoes',40,'total_pontos',100,'titulos',10),
  'resumo', jsonb_build_object(
    'pontos_topo',66,'pontos_mediana',58.0,'pontos_media',58.3,'pontos_ultimo',50,
    'acertos_topo',26,'acertos_mediana',23.5,'acertos_ultimo',20,
    'pct_acertos_topo',65.0,'pct_acertos_mediana',58.8,'pct_acertos_ultimo',50.0,
    'ce_topo',42,'ce_mediana',34.5,'ce_ultimo',24,
    'pct_ce_topo',70.0,'pct_ce_mediana',57.5,'pct_ce_ultimo',40.0,
    'amplitude_1o_ao_ultimo',16),
  'observacoes', jsonb_build_array(
    'O 1o colocado acertou 26 de 40 questoes (65,0%). Ninguem chega perto de gabaritar.',
    'O melhor desempenho em Especificas foi 14 de 20 questoes (70,0%).',
    'MATHEUS PARANHOS fez 10/10 em Portugues e 10/10 em Matematica, os unicos gabaritos perfeitos da lista, e ficou em 12o por causa de 24/60 em Especificas. Os blocos basicos nao classificam.',
    'ALECSANDRO BOIKO ficou em 1o com 2/10 em Matematica, carregado por 42/60 em Especificas.',
    'A lista inteira cabe em 16 pontos: 18 candidatos entre 50 e 66. Em Curitiba, com muito mais inscritos, cada questao separa dezenas de posicoes.',
    'Titulos valiam 10 de 110 (9%) aqui; em Curitiba valem 20 de 100 (20%), mais que o dobro do peso relativo.'),
  'candidatos', jsonb_build_array(
    jsonb_build_object('nome','ALECSANDRO BOIKO','lp',6,'mat_rl',2,'inf',6,'leg',10,'ce',42,'pontos',66),
    jsonb_build_object('nome','LUIZ FELIPE DE LIMA RAMOS','lp',10,'mat_rl',4,'inf',6,'leg',6,'ce',39,'pontos',65),
    jsonb_build_object('nome','ADRIANO BODNAR','lp',6,'mat_rl',6,'inf',6,'leg',8,'ce',39,'pontos',65),
    jsonb_build_object('nome','DALTON GIORDANO ZABANDZALA','lp',4,'mat_rl',4,'inf',6,'leg',8,'ce',42,'pontos',64),
    jsonb_build_object('nome','BRUNO DIDUR VEIGA','lp',8,'mat_rl',6,'inf',4,'leg',6,'ce',39,'pontos',63),
    jsonb_build_object('nome','JOSCLEY RODRIGO WASELKIU','lp',6,'mat_rl',4,'inf',6,'leg',6,'ce',39,'pontos',61),
    jsonb_build_object('nome','MARCELA DOS SANTOS GUIMARAES','lp',8,'mat_rl',2,'inf',4,'leg',12,'ce',33,'pontos',59),
    jsonb_build_object('nome','FABIO DA SILVA','lp',6,'mat_rl',6,'inf',6,'leg',4,'ce',36,'pontos',58),
    jsonb_build_object('nome','GUILHERME LINDOLFO SCHEID','lp',6,'mat_rl',6,'inf',4,'leg',6,'ce',36,'pontos',58),
    jsonb_build_object('nome','MIRIAN KOSTIUK DE SANTANA','lp',8,'mat_rl',4,'inf',6,'leg',10,'ce',30,'pontos',58),
    jsonb_build_object('nome','VAGNER NEDOCHETKO','lp',6,'mat_rl',6,'inf',4,'leg',6,'ce',36,'pontos',58),
    jsonb_build_object('nome','MATHEUS HENRIQUE DE ASSIS PARANHOS','lp',10,'mat_rl',10,'inf',4,'leg',8,'ce',24,'pontos',56),
    jsonb_build_object('nome','PATRICIA LOPES KOTECKI','lp',8,'mat_rl',8,'inf',4,'leg',6,'ce',30,'pontos',56),
    jsonb_build_object('nome','WAGNER SERRER','lp',8,'mat_rl',4,'inf',6,'leg',8,'ce',30,'pontos',56),
    jsonb_build_object('nome','CAIO ROBERTO PANACIONI','lp',6,'mat_rl',8,'inf',6,'leg',8,'ce',27,'pontos',55),
    jsonb_build_object('nome','AMANDA MATZENBACHER TREVISOL','lp',8,'mat_rl',6,'inf',6,'leg',4,'ce',27,'pontos',51),
    jsonb_build_object('nome','JOSIANI FERNANDA DOS SANTOS','lp',6,'mat_rl',2,'inf',4,'leg',6,'ce',33,'pontos',51),
    jsonb_build_object('nome','KETLYN XAVIEL DA SILVA','lp',6,'mat_rl',2,'inf',4,'leg',8,'ce',30,'pontos',50)),
  'como_comparar','Comparar SEMPRE por percentual dentro do bloco, nunca por pontos absolutos: a estrutura de Cruz Machado (40q/100pts, CE com 20 questoes peso 3) difere da de Curitiba (40q/80pts, CE com 30 questoes peso 2).'
),'benchmark')
on conflict do nothing;
