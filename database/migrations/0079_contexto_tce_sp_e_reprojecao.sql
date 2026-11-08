-- 0079 — Fecha o contexto do TCE-SP e reprojeta a nota com a base limpa
--
-- INFORMADO PELO USUARIO em 06/11: "nao fui aprovado, ja fiz a prova e ao
-- fazer o foco muda imediatamente". Resolve a pendencia aberta na 0078.
--
-- CONSEQUENCIA ESTRATEGICA: nao ha rede. Curitiba e alvo unico, ele mira o
-- topo, e nao existe aprovacao de reserva. O calculo de risco nao muda de
-- direcao, mas perde qualquer margem de conforto.
--
-- COMPORTAMENTO CONFIRMADO PELO PROPRIO PAINEL: prova do TCE-SP em 11/10;
-- primeira sessao vinculada a Prefeitura de Curitiba em 13/10. Dois dias.
-- A troca de foco que ele descreve e verificavel, nao autorrelato.
--
-- ============================================================
-- REPROJECAO: a base limpa derruba a nota esperada
-- ============================================================
-- Ate aqui a projecao usava SO os 9 simulados (360 questoes). Com os
-- concursos antigos separados, ficou possivel medir por unidade com as
-- questoes de caderno tambem — 2.278 questoes de conteudo relevante.
-- Quatro cenarios, todos calculados, nenhum escolhido por conveniencia:
--
--   A. so simulados (360 q, mesma banca, formato de prova) .... 62,5 de 80
--   B. so TEC relevante (2.278 q, varias bancas) .............. 53,0 de 80
--   C. combinado (2.638 q) .................................... 54,6 de 80
--   D. hibrido: simulado onde n >= 20, TEC onde o simulado
--      nao mediu o suficiente ................................. 59,9 de 80
--
-- QUAL VALE: o cenario A e o melhor preditor de uma prova FAFIPA porque e a
-- mesma banca, no mesmo formato, e recente. O cenario B e piso: mistura
-- bancas, cobre o periodo em que ele sabia menos, e os cadernos do TEC sao
-- escolhidos por ele justamente sobre o que esta estudando — ou seja, sobre
-- o que erra. Vies de selecao para baixo.
-- ADOTO O CENARIO D como projecao de trabalho: usa a banca certa onde ha
-- amostra suficiente e so recorre ao TEC onde o simulado nao mediu.
--
-- O QUE O CENARIO D CORRIGE, e e o ponto principal desta migration:
--   2.5 Hidrologia e Drenagem ... simulado 7 q (85,7%) -> TEC 168 q (61,9%)
--       vale 16,0% da prova. Eu vinha tratando como "nao medido" e, pior,
--       o numero do simulado sugeria forca onde ha fraqueza.
--   2.8 Planejamento e Orcamento  simulado 18 q (83,3%) -> TEC 245 q (71,4%)
--   2.10 Avaliacoes e Pericias .. simulado 16 q (75,0%) -> TEC  40 q (75,0%)
--   2.7 Acessibilidade .......... simulado 16 q (50,0%) -> TEC  48 q (54,2%)
--
-- PROJECAO DE TRABALHO (cenario D): 59,9 de 80 na objetiva, 69,9 de 100 com
-- os 10 pontos de titulos. Contra 73,8 que eu vinha usando. Corte em 48.
--
-- RANKING DE PONTOS RECUPERAVEIS COM A BASE COMBINADA (CE, 60 pontos):
--   2.5  Hidrologia e Drenagem ..... 175 q ... 62,9% ... 3,58 pontos
--   2.11 Licitacoes e Contratos .... 193 q ... 64,2% ... 3,18
--   2.1  Legislacao Municipal ....... 52 q ... 73,1% ... 2,59
--   2.2  Materiais e Tecnicas ...... 340 q ... 68,5% ... 1,86
--   2.6  Saneamento ................ 335 q ... 68,1% ... 1,42
--   2.4  Geotecnia e Fundacoes ..... 179 q ... 64,2% ... 1,32
--   2.3  Estruturas ................ 139 q ... 66,9% ... 1,23
--   2.9  Patologia e Seguranca ...... 66 q ... 68,2% ... 1,18
--   2.10 Avaliacoes e Pericias ...... 56 q ... 75,0% ... 1,11
--   2.7  Acessibilidade ............. 64 q ... 53,1% ... 1,04
--   2.8  Planejamento e Orcamento .. 263 q ... 72,2% ... 1,03
--
-- MUDANCA DE PRIORIDADE: 2.5 e 2.11 passam ao topo e juntas valem 6,76 dos
-- 19,5 pontos recuperaveis — 35%. As duas somam 30,8% do edital. Nenhuma das
-- duas tinha medicao confiavel antes desta limpeza.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid;
begin
  select id into v_exam from public.exams
   where user_id=v_user and name='Prefeitura de Curitiba 2026';
  if v_exam is null then raise exception 'concurso de Curitiba nao encontrado'; end if;

  update public.exams
     set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
       'contexto_tce_sp','prova aplicada em 11/10/2026, SEM aprovacao; foco migrou para Curitiba em 13/10 (dois dias), confirmado pelas sessoes do painel',
       'alvo','topo da classificacao, sem concurso reserva',
       'projecao_cenarios', jsonb_build_object(
          'A_so_simulados_360q','62,5 de 80',
          'B_so_tec_relevante_2278q','53,0 de 80',
          'C_combinado_2638q','54,6 de 80',
          'D_hibrido_adotado','59,9 de 80'),
       'projecao_de_trabalho','59,9 de 80 na objetiva e 69,9 de 100 com titulos (cenario D)',
       'projecao_anterior','73,8 de 100, calculada so com os 9 simulados',
       'unidades_reavaliadas','2.5 Hidrologia caiu de 85,7% (7 q de simulado) para 61,9% (168 q de caderno); 2.8 de 83,3% para 71,4%',
       'prioridade_atualizada','2.5 Hidrologia (3,58 pts) e 2.11 Licitacoes (3,18 pts) lideram os recuperaveis e somam 30,8% do edital',
       'atualizado_em','2026-11-06')
   where id=v_exam;
  raise notice 'contexto e reprojecao gravados em %', v_exam;
end $$;
