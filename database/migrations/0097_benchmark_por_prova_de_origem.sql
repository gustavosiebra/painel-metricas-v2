-- 0097 — Benchmark por PROVA DE ORIGEM e correcao de um erro meu de leitura
--
-- AUTORIZADO pelo usuario em 11/11/2026.
--
-- ============================================================
-- ERRO MEU, CORRIGIDO
-- ============================================================
-- Ele perguntou se dava para pegar as questoes de cada prova FAFIPA e comparar
-- so com os candidatos daquela prova. Eu respondi que NAO DAVA, alegando que
-- os simulados sao mistura de varias provas.
-- Eu respondi a pergunta errada. Ele perguntou por PROVA DE ORIGEM, nao por
-- simulado. O mapeamento questao -> prova de origem esta impresso no rodape de
-- cada simulado desde que o gerador existe. Ele estava certo, e eu neguei sem
-- verificar.
-- Fica registrado junto aos outros erros de metodo desta preparacao:
--   0076/0077 — retratacao indevida com base em metadado de arquivo
--   0082      — taxa de recurso superestimada a partir de n=1, duas vezes
--   0084      — regra de dose e espacamento refutada pelos proprios dados
--   0087      — ressalva registrada sem perguntar, repetindo o erro da 0076
--
-- ============================================================
-- O RESULTADO
-- ============================================================
-- 130 questoes de Conhecimentos Especificos vindas de 10 provas FAFIPA que tem
-- classificacao publicada, contra a mediana de CE dos candidatos reais dessas
-- mesmas provas (509 candidatos ao todo).
--
--   AGREGADO: ele 73,8% (96 de 130) x mediana ponderada 67,8%
--   delta +6,0 pontos percentuais | z = 1,48 | p = 0,140
--   NAO E ESTATISTICAMENTE DISTINGUIVEL DE ZERO.
--
-- Resposta honesta a pergunta dele ("estou indo bem, razoavel ou ruim nessa
-- banca?"): RAZOAVEL. Esta dentro do ruido. Ele NAO e demonstravelmente melhor
-- que o candidato mediano da FAFIPA.
--
-- E o recorte que mais importa e o pior de todos: nas 19 questoes da
-- PARANAEDUCACAO — mesma banca, mesma cidade, mesmo cargo, mesmo ano, 174
-- concorrentes — ele fez 68,4% contra 70,0% da mediana deles. ABAIXO da
-- mediana do grupo que mais se parece com quem ele enfrenta em 06/12.
--
-- TABELA COMPLETA (ordenada pelo desempenho dele):
--   Jaboti ................ 14/15  93,3%  x  85,0% (n=21)   empate
--   Japura ................  8/9   88,9%  x  60,0% (n=51)   amostra pequena
--   Planalto ..............  7/8   87,5%  x  66,7% (n=76)   amostra pequena
--   Lidianopolis ..........  9/11  81,8%  x  80,0% (n=30)   amostra pequena
--   Nova Santa Rita - RS .. 10/10 100,0%  x 100,0% (n=10)   amostra pequena
--   Rio Branco do Sul .....  7/10  70,0%  x  42,5% (n=18)   amostra pequena
--   PARANAEDUCACAO ........ 13/19  68,4%  x  70,0% (n=174)  empate, abaixo
--   Goioere ...............  9/15  60,0%  x  52,5% (n=16)   empate
--   Tres Barras - SC ...... 12/20  60,0%  x  65,0% (n=75)   empate
--   Cruz Machado ..........  7/13  53,8%  x  57,5% (n=18)   empate
--
-- RESSALVAS QUE ENFRAQUECEM A TABELA, declaradas:
--   1. as questoes de cada prova sao um SUBCONJUNTO filtrado para o edital de
--      Curitiba pelo gerador de simulados, nao o bloco inteiro que os
--      candidatos enfrentaram. E amostra enviesada contra populacao.
--   2. 7 das 10 provas tem n < 12; o IC95 e largo demais para concluir
--      qualquer coisa sobre uma prova isolada.
--   3. 230 das 360 questoes de CE vieram de 17 provas SEM classificacao
--      publicada (SESA PR 25, Campo Largo 21, Marialva 18, Douradina 18,
--      Miguelopolis 16, Matinhos 16, 20H Campo do Tenente 16, Uniflor 15,
--      Ouro Verde do Oeste 15, 40H Campo do Tenente 14, entre outras).
--      Falta benchmark para 64% do material.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
begin
  delete from public.user_parameters
   where user_id = v_user and key = 'benchmark_por_prova_de_origem';

  insert into public.user_parameters(user_id, key, value)
  values (v_user, 'benchmark_por_prova_de_origem', jsonb_build_object(
    'coletado_em','2026-11-11',
    'fonte','Anexos de Resultado Final e Classificacao publicados pela Fundacao FAFIPA (ver migration 0083); mapeamento questao -> prova de origem impresso no rodape dos simulados',
    'metodo','questoes de CE de cada prova FAFIPA presentes nos simulados 1 a 12, contra a mediana de CE dos candidatos daquela prova',
    'agregado', jsonb_build_object(
      'questoes',130,'acertos',96,'pct_usuario',73.8,
      'mediana_ponderada_candidatos',67.8,'delta_pp',6.0,'z',1.48,'p',0.140,
      'veredito','RAZOAVEL: +6,0 pp sobre a mediana, mas p=0,140 — nao distinguivel de zero'),
    'provas', jsonb_build_array(
      jsonb_build_object('prova','Jaboti','ano',2026,'n_dele',15,'acertos',14,'pct',93.3,'n_cands',21,'mediana',85.0,'veredito','empate estatistico'),
      jsonb_build_object('prova','Japura','ano',2026,'n_dele',9,'acertos',8,'pct',88.9,'n_cands',51,'mediana',60.0,'veredito','amostra pequena'),
      jsonb_build_object('prova','Planalto','ano',2026,'n_dele',8,'acertos',7,'pct',87.5,'n_cands',76,'mediana',66.7,'veredito','amostra pequena'),
      jsonb_build_object('prova','Lidianopolis','ano',2026,'n_dele',11,'acertos',9,'pct',81.8,'n_cands',30,'mediana',80.0,'veredito','amostra pequena'),
      jsonb_build_object('prova','Nova Santa Rita - RS','ano',2026,'n_dele',10,'acertos',10,'pct',100.0,'n_cands',10,'mediana',100.0,'veredito','amostra pequena'),
      jsonb_build_object('prova','Rio Branco do Sul','ano',2026,'n_dele',10,'acertos',7,'pct',70.0,'n_cands',18,'mediana',42.5,'veredito','amostra pequena'),
      jsonb_build_object('prova','PARANAEDUCACAO (Eng. Civil Curitiba)','ano',2026,'n_dele',19,'acertos',13,'pct',68.4,'n_cands',174,'mediana',70.0,'veredito','empate estatistico; ABAIXO da mediana do grupo mais parecido com os concorrentes de 06/12'),
      jsonb_build_object('prova','Goioere','ano',2026,'n_dele',15,'acertos',9,'pct',60.0,'n_cands',16,'mediana',52.5,'veredito','empate estatistico'),
      jsonb_build_object('prova','Tres Barras - SC','ano',2026,'n_dele',20,'acertos',12,'pct',60.0,'n_cands',75,'mediana',65.0,'veredito','empate estatistico'),
      jsonb_build_object('prova','Cruz Machado','ano',2025,'n_dele',13,'acertos',7,'pct',53.8,'n_cands',18,'mediana',57.5,'veredito','empate estatistico')),
    'ressalvas', jsonb_build_array(
      'as questoes de cada prova sao um subconjunto filtrado para o edital de Curitiba, nao o bloco inteiro que os candidatos fizeram',
      '7 das 10 provas tem n menor que 12; IC95 largo demais para conclusao individual',
      '230 das 360 questoes de CE vieram de 17 provas sem classificacao publicada — falta benchmark para 64% do material'),
    'erro_meu_corrigido','eu disse ao usuario que a comparacao por prova de origem NAO era possivel. Era. Respondi a pergunta errada e neguei sem verificar o rodape dos simulados.'));

  raise notice '0097: benchmark por prova de origem gravado';
end $$;
