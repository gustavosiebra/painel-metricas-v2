-- 0080 — Simulado FAFIPA no 10 (07/11/2026): 32/40, 64 pontos, 76 minutos
--
-- O usuario reportou: "fiz o simulado 10 em 1h16 / errei: 8-a 14-d 20-a 24-b
-- 28-d 37-e 39-d 40-e". Os oito erros foram conferidos um a um contra o
-- gabarito extraido do proprio Simulado_10.pdf. TODOS confirmados, sem nenhuma
-- divergencia de transcricao — a primeira vez na serie em que isso acontece
-- depois de seis divergencias (simulados 2, 3, 4, 6 e 9).
--
--   Q08 gab D marcou A | Q14 gab C marcou D | Q20 gab C marcou A
--   Q24 gab D marcou B | Q28 gab A marcou D | Q37 gab D marcou E
--   Q39 gab A marcou D | Q40 gab C marcou E
--
-- RESULTADO: LP 5/5 | INF 4/5 | CE 23/30 | TOTAL 32/40 = 64 pontos de 80.
-- Empata o melhor da serie (#5 e #9) e foi o mais rapido dos tres (76 min).
-- Serie completa de acertos: 30, 31, 31, 31, 32, 28, 28, 28, 32, 32.
-- Serie de CE:               23, 22, 22, 24, 24, 20, 20, 19, 22, 23.
--
-- ============================================================
-- 1) DEFEITO NO MATERIAL: O ROTULO "ASSUNTO" DO SIMULADO ESTA ERRADO
-- ============================================================
-- Antes de qualquer analise de conteudo: a coluna "Assunto" impressa na tabela
-- de origem do Simulado_10.pdf vem do meu classificador por palavra-chave e
-- esta ERRADA em pelo menos tres questoes e VAZIA em outras tres de CE:
--   Q24 (rota acessivel, piso polido) rotulada "Impermeabilizacao" — e 2.7
--   Q37 (linha guia)                  rotulada "Impermeabilizacao" — e 2.7
--   Q40 (estruturas de madeira)       rotulada "Estruturas de concreto" — e 2.3
--   Q14, Q31, Q32                     rotuladas "—" (sem assunto)
-- E o mesmo tipo de falha ja documentado nas migrations anteriores (o bucket
-- "Mecanica dos Solos" contaminado, o "eta\b" casando com "coleta", o
-- "cimento" casando com "fornecimento"). TODA a classificacao desta migration
-- foi feita A MAO, lendo o enunciado, contra o Anexo II do Edital 5/2026-PMC
-- (paginas 67 a 70), e NAO a partir do rotulo impresso.
-- PENDENCIA: os simulados 11 a 15 ainda nao resolvidos carregam o mesmo
-- defeito de rotulo. Nao alterei os arquivos — aguarda validacao do usuario.
--
-- ============================================================
-- 2) O ACHADO PRINCIPAL: O QUE ELE ESTUDOU, ACERTOU. O QUE NAO ESTUDOU, ERROU.
-- ============================================================
-- Isto nao e inferencia; e o cruzamento de duas tabelas do proprio painel.
--
-- O que ele estudou entre 04/11 e 07/11 (study_sessions):
--   Licitacao e Contratos ....... 101 min em 06/11 e 07/11 (4 sessoes)
--   Correcao ativa #7, #8, #9 ... 300 min em 05/11 e 06/11
--   ETP (Decreto 383) ...........  19 min em 06/11
--   NR-18 .......................  16 min em 06/11
--   Acessibilidade / NBR 9050 ...   0 min
--   NBR 15575 ...................   0 min
--
-- O que o simulado 10 devolveu, por unidade do edital:
--   2.11 Licitacoes e Contratos ....... 5/5  (100%)
--   2.9  Patologia, Qualidade, Seguranca 5/5  (100%)
--   2.8  Planejamento e Orcamento ..... 4/4  (100%)
--   2.6  Saneamento e Meio Ambiente ... 2/2  (100%)
--   2.1  Legislacao Municipal ......... 1/1  (100%)
--   2.3  Estruturas ................... 3/4  (75,0%)
--   2.4  Geologia e Geotecnia ......... 2/4  (50,0%)
--   2.10 Avaliacoes e Pericias ........ 0/1
--   2.7  Arquitetura e Acessibilidade . 1/4  (25,0%)
--   2.2 e 2.5 ......................... sem questoes neste simulado
--
-- As unidades que ele tocou nos tres dias anteriores fecharam 10/10 somando
-- 2.11 e 2.9. A UNICA unidade com volume no simulado que ele NAO tocou,
-- 2.7, produziu TRES dos oito erros (Q14, Q24, Q37). O quarto erro de 2.7 nao
-- existe porque so havia quatro questoes da unidade.
--
-- Mais grave: a migration 0075, escrita em 04/11, prescreveu textualmente
-- "uma sessao dedicada de 40+ min na secao de termos e definicoes da NBR
-- 15575 e da NBR 9050". Tres dias depois, zero minuto registrado nessas duas
-- normas, e os erros de 07/11 sao exatamente desse tipo:
--   Q14 — cotas de empunhadura: afastamento de corrimaos e barras de apoio
--   Q24 — requisitos de rota acessivel (piso, inclinacao, desnivel)
--   Q37 — DEFINICAO de "linha guia"; ele marcou a definicao de "rota acessivel"
-- A Q37 e o mesmo mecanismo da Q18 do #8 e da Q25 do #9: trocar uma definicao
-- da norma por outra definicao vizinha da MESMA norma. Quarta ocorrencia.
--
-- RESSALVA DE RASTREABILIDADE: o painel registra o que ele lancou. Ausencia de
-- registro nao prova ausencia de estudo. O que esta provado e a CORRELACAO
-- entre o registrado e o resultado, nao a causalidade.
--
-- ============================================================
-- 3) A REGRA DE ESPACAMENTO LEVA O SEGUNDO CONTRAEXEMPLO
-- ============================================================
-- A regra medida (migration 0070) diz: espacamento de 0 a 7 dias ~ sem ganho,
-- 8+ dias = +11 a +16 pp. O simulado 10 contraria isso nas duas pontas:
--   LICITACAO: estudada a 0 e 1 dia de distancia (06 e 07/11), ou seja dentro
--     da faixa "sem ganho" — e deu 5/5. Somando #9 e #10, 2.11 esta 12/13.
--   ACESSIBILIDADE: ultima dose real foi 81 min de revisao em 31/10, a 7 dias
--     do simulado, tambem na faixa "sem ganho", mais 8 min em 03/11 (abaixo do
--     limiar de dose de 40 min) — e deu 1/4.
-- Os dois casos estao na mesma faixa de espacamento e deram resultados
-- opostos. O que os separa e DOSE RECENTE (101 min nos dois ultimos dias
-- contra 8 min), nao espacamento.
-- CONCLUSAO QUE REGISTRO: a regra de espacamento esta sob tensao como preditor
-- de DESEMPENHO IMEDIATO. Ela pode continuar valida para RETENCAO de longo
-- prazo — os dados atuais nao separam as duas coisas. O modelo que melhor
-- ajusta os simulados 9 e 10 e "dose recente acumulada", nao espacamento.
-- O QUE TESTARIA ISSO: uma unidade estudada com dose alta (40+ min) e
-- espacamento de 8+ dias ate o simulado. Nao ha nenhum caso assim na serie.
-- Nao estou descartando a regra de espacamento; estou registrando que ela nao
-- explica os dois ultimos simulados e que falta o caso que a testaria.
--
-- ============================================================
-- 4) A QUEDA DE CE CONTINUA RECUANDO (terceira atenuacao)
-- ============================================================
-- A migration 0072 registrou uma queda de CE com z = -1,87, p = 0,062,
-- comparando os simulados 1-5 com 6-8. A 0073 recuou para p = 0,093 com o #9.
-- Com o #10: CE 1-5 = 115/150 (76,7%) contra CE 6-10 = 104/150 (69,3%).
--   pooled = 219/300 = 73,0% | se = 0,0513 | z = 1,43 | p = 0,152
-- Terceira atenuacao consecutiva: 0,062 -> 0,093 -> 0,152. A "queda de CE"
-- nao sobrevive ao acumulo de dados. Era variacao amostral, e os simulados
-- 6, 7 e 8 foram um vale, nao uma tendencia. Fica registrado como erro meu
-- de interpretacao precoce com n pequeno.
-- Na outra direcao, a "recuperacao" tambem nao e significativa:
--   CE 6-8 = 59/90 (65,6%) contra CE 9-10 = 45/60 (75,0%) -> z = 1,23, p = 0,219.
-- Nenhuma das duas narrativas passa. A leitura honesta e que CE oscila em
-- torno de ~73% e que 40 questoes por simulado nao resolvem 10 pp de ruido.
--
-- ============================================================
-- 5) ACUMULADO DA SERIE (10 simulados, 400 questoes)
-- ============================================================
--   LP    41/50  = 82,0%  (Wilson 95%: 69,2% a 90,2%)
--   INF   43/50  = 86,0%  (Wilson 95%: 73,8% a 93,0%)
--   CE   219/300 = 73,0%  (Wilson 95%: 67,8% a 77,7%)
--   TOTAL 303/400 = 75,8% (Wilson 95%: 71,3% a 79,7%)
--
-- Projecao direta sobre a estrutura do edital (LP 5x2 + INF 5x2 + CE 30x2):
--   0,820 x 10 + 0,860 x 10 + 0,730 x 60 = 8,2 + 8,6 + 43,8 = 60,6 de 80
-- Com os 10 pontos de titulos ja garantidos (mestrado + 2 especializacoes):
--   70,6 de 100. Corte da objetiva (item 11.25) = 48 de 80.
-- ATENCAO AO USAR ESSE NUMERO: e a projecao SO pelos simulados, que usam
-- questoes da propria banca mas montadas por mim, com reposicao limitada do
-- pool. NAO recalculei nesta migration o cenario hibrido D da 0079 (59,9/80),
-- porque ele depende de reagregar a base do TEC; a base do TEC nao mudou,
-- mas o peso relativo dos simulados mudou. Pendencia explicita.
--
-- ============================================================
-- 6) ACUMULADO POR UNIDADE DO EDITAL (simulados 1 a 10)
-- ============================================================
--   2.1  Legislacao Municipal, Urbanistica e de Edificacoes .. 18/21 = 85,7%
--   2.5  Hidrologia, Drenagem e Infraestrutura ...............  5/6  = 83,3% (n baixo)
--   2.8  Planejamento, Orcamento e Gerenciamento ............. 26/31 = 83,9%
--   2.11 Licitacoes e Contratos .............................. 32/39 = 82,1%
--   2.6  Saneamento e Meio Ambiente .......................... 32/44 = 72,7%
--   2.4  Geologia, Geotecnia e Mecanica dos Solos ............ 21/29 = 72,4%
--   2.2  Materiais e Tecnicas de Construcao .................. 28/39 = 71,8%
--   2.9  Patologia, Qualidade e Seguranca .................... 22/32 = 68,8%
--   2.10 Avaliacoes, Pericias e Documentacao Tecnica ......... 13/19 = 68,4%
--   2.3  Estruturas .......................................... 17/25 = 68,0%
--   2.7  Arquitetura, Urbanismo e Acessibilidade .............  5/14 = 35,7%
--
-- 2.7 e a pior unidade do edital por uma margem enorme — 32 pp abaixo da
-- penultima — e PIOROU com o #10 (era 4/10 = 40,0%, agora 5/14 = 35,7%).
-- E a unica unidade cuja taxa esta abaixo do que se obteria chutando entre
-- duas alternativas. Ela vale 2.7.1 arquitetura/urbanismo, 2.7.2 NBR 9050 e
-- 2.7.3 NBR 15575: tres subitens, e os dois ultimos sao normas fechadas e
-- decoraveis. E o unico lugar da serie onde ha ganho de dois digitos parado.
--
-- INCONSISTENCIA CONHECIDA: a soma dos denominadores por unidade da 299, nao
-- 300. Uma questao de CE da serie nao esta mapeada em nenhuma unidade. O erro
-- vem herdado da 0073 (que somava 269 contra 270) e NAO foi introduzido aqui.
-- Nao corrigi por chute. Localizar essa questao exige reclassificar as 300 a
-- mao; registro como pendencia em vez de esconder.
--
-- ============================================================
-- 7) OS OITO ERROS, UM A UM
-- ============================================================
-- Q08 | INF 1.2.6 Seguranca de dados | criptografia assimetrica
--   Gab D "chave publica do destinatario". Marcou A "hash da mensagem".
--   Trocou CONFIDENCIALIDADE por INTEGRIDADE. Hash garante integridade, nao
--   sigilo. Para confidencialidade cifra-se com a chave PUBLICA do destinatario
--   (so a privada dele decifra). Unico erro de INF; quebra a sequencia 5/5 do #9.
-- Q14 | CE 2.7.2 NBR 9050 | cotas de empunhadura
--   Gab C "40 mm, 30 mm, 45 mm". Marcou D "40 mm, 35 mm, 50 mm". Acertou a
--   primeira cota e errou as duas seguintes. Erro de COTA, nao de conceito.
-- Q20 | CE 2.4.2 comportamento dos solos | processos erosivos
--   Gab C "exposicao direta do solo ao sol e a chuva destroi os agregados".
--   Marcou A "aumento da permeabilidade e da infiltracao" — que e o oposto:
--   mais infiltracao reduz escoamento superficial e portanto reduz erosao.
--   RESSALVA DE CLASSIFICACAO: esta questao fica na fronteira entre 2.4.2
--   (comportamento dos solos) e 2.6.6 (impactos ambientais de obras). Alocada
--   em 2.4 porque o gabarito trata de agregados do solo. Decisao discutivel.
-- Q24 | CE 2.7.2 NBR 9050 | rota acessivel, julgamento de itens
--   Gab D "II, III e IV, apenas". Marcou B "I, II, III e IV, apenas", ou seja
--   incluiu o item I (piso polido, baixa rugosidade). Piso acessivel exige
--   superficie antiderrapante; estar em bom estado nao basta. Ele nao soube
--   DESCARTAR um item — mesma mecanica da Q35 do #9.
-- Q28 | CE 2.10.1 vistorias e inspecoes | vistoria de constatacao
--   Gab A "averiguacao de fatos com descricao minuciosa, SEM determinacao de
--   causas e responsabilidades". Marcou D, que descreve verificar atendimento
--   a projetos e normas comparando executado com planejado. Trocou
--   CONSTATACAO por CONFORMIDADE. Erro de nomenclatura tecnica.
-- Q37 | CE 2.7.2 NBR 9050 | definicao de linha guia
--   Gab D "elemento natural ou edificado usado como referencia de orientacao
--   direcional". Marcou E, que e a definicao literal de ROTA ACESSIVEL.
--   Trocou uma definicao da NBR 9050 por outra definicao da NBR 9050.
--   Quarta ocorrencia desse mecanismo na serie (Q18 #8, Q25 #9, Q37 #10).
-- Q39 | CE 2.4.3 investigacao geotecnica | metodos de prospeccao
--   Gab A "pocos exploratorios e trincheiras". Marcou D "sondagem a percussao
--   com medida de torque" (SPT-T). O enunciado pedia o metodo que permite
--   EXAME VISUAL DO PERFIL e extracao de BLOCOS INDEFORMADOS — so poco e
--   trincheira fazem isso; SPT-T traz amostra deformada.
--   Quarta questao de investigacao geotecnica errada na serie (Q19 e Q36 do
--   #7, Q29 do #9, Q39 do #10). 2.4 e o segundo foco, atras de 2.7.
-- Q40 | CE 2.3.4 estruturas de madeira | dimensionamento em incendio
--   Gab C "verificacao dos elementos e conexoes, com ou sem revestimento
--   contrafogo, quanto a capacidade resistente em temperatura elevada".
--   Marcou E, que fala de propriedades elasticas em temperatura AMBIENTE —
--   contradiz o proprio enunciado, que diz "condicoes excepcionais".
--   Erro de leitura do enunciado, nao de norma. Terceiro erro nao-recall da
--   serie (apos Q35 do #9 e o anterior registrado na 0073).
--
-- ============================================================
-- 8) O QUE OS ACERTOS DIZEM (e o que nao dizem)
-- ============================================================
-- 2.11 fechou 5/5 cobrindo ETP (Q22), alteracao de edital (Q26), Termo de
-- Referencia (Q29), regimes de execucao indireta (Q31) e diretrizes da
-- 14.133 (Q34). Com #9 somado, 2.11 esta 12/13. A unidade tem 12 subitens e
-- e a MAIOR do edital em peso de subitens depois de 2.1 e 2.5. Ja esta no
-- patamar em que a margem de ganho e pequena.
-- 2.9 fechou 5/5 incluindo NR-18 (Q19, Q23) e NR-35 (Q27) — as mesmas NRs que
-- produziram erros no #8 e no #9 (Q18 e Q31 do #9 eram NR-18). Aqui a correcao
-- ativa de 05 e 06/11 aparentemente pegou. Contraste direto com 2.7, onde
-- nao houve correcao dedicada e nao houve melhora.
-- O QUE ISSO NAO DIZ: tres questoes de NR em um simulado nao provam fixacao.
-- 2.9 segue em 68,8% no acumulado, abaixo da media de CE.

do $$
declare
  v_user  uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam  uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_tpl   uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';
  v_when  timestamptz := '2026-11-07 19:00:00-03';
  v_sess  uuid;
  v_att   uuid;
  v_b_lp  uuid;
  v_b_inf uuid;
  v_b_ce  uuid;
begin
  -- idempotencia
  if exists (select 1 from public.study_sessions
              where user_id=v_user and study_type='simulado'
                and notes like 'Simulado FAFIPA no 10 %') then
    raise notice 'simulado 10 ja registrado; nada a fazer';
    return;
  end if;

  select id into v_b_lp  from public.exam_template_blocks
   where template_id=v_tpl and name='Língua Portuguesa';
  select id into v_b_inf from public.exam_template_blocks
   where template_id=v_tpl and name='Noções de Informática';
  select id into v_b_ce  from public.exam_template_blocks
   where template_id=v_tpl and name='Conhecimentos Específicos';
  if v_b_lp is null or v_b_inf is null or v_b_ce is null then
    raise exception 'blocos do template nao encontrados';
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, exam_id, study_type, duration_minutes, notes, metadata)
  values (v_user, v_when, v_exam, 'simulado', 76,
'Simulado FAFIPA no 10 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 32/40 = 80,0%. Pontuacao ponderada 64 de 80. Tempo 76 min de 240 disponiveis.
LP 5/5 | INF 4/5 | CE 23/30. Empata o melhor da serie (#5 e #9) e foi o mais rapido dos tres.
Serie de acertos: 30, 31, 31, 31, 32, 28, 28, 28, 32, 32. Serie de CE: 23, 22, 22, 24, 24, 20, 20, 19, 22, 23.

ERROS (todos conferidos contra o gabarito do proprio PDF; ZERO divergencia de transcricao,
a primeira vez na serie apos seis divergencias nos simulados 2, 3, 4, 6 e 9):
  Q08 D/A  INF 1.2.6 seguranca de dados — trocou confidencialidade por integridade (hash x chave publica)
  Q14 C/D  CE 2.7.2 NBR 9050 — cotas de empunhadura; acertou a 1a cota, errou as outras duas
  Q24 D/B  CE 2.7.2 NBR 9050 — incluiu indevidamente o item do piso polido na rota acessivel
  Q37 D/E  CE 2.7.2 NBR 9050 — marcou a definicao de rota acessivel no lugar de linha guia
  Q20 C/A  CE 2.4.2 solos — marcou o oposto: mais infiltracao reduz erosao, nao intensifica
  Q39 A/D  CE 2.4.3 investigacao geotecnica — SPT-T no lugar de poco/trincheira (bloco indeformado)
  Q28 A/D  CE 2.10.1 vistorias — trocou vistoria de constatacao por vistoria de conformidade
  Q40 C/E  CE 2.3.4 madeira em incendio — marcou temperatura ambiente contra o proprio enunciado

CRUZAMENTO COM O QUE ELE ESTUDOU EM 04-07/11 (dados do proprio painel):
  licitacao 101 min + NR-18 16 min + ETP 19 min + 300 min de correcao ativa dos #7/#8/#9;
  ZERO minuto em NBR 9050 e NBR 15575 (ultimo registro: 8 min em 03/11 e 81 min em 31/10).
  Resultado: 2.11 deu 5/5, 2.9 deu 5/5, 2.8 deu 4/4 — e 2.7, a unidade nao estudada,
  deu 1/4 e concentrou TRES dos oito erros. A migration 0075 havia prescrito explicitamente
  40+ min nas definicoes da NBR 9050 e da NBR 15575 em 04/11. Nao foi feito.
  RESSALVA: ausencia de registro no painel nao prova ausencia de estudo; o que esta
  demonstrado e a correlacao entre o registrado e o resultado, nao causalidade.

ACUMULADO (10 simulados, 400 questoes): LP 41/50 = 82,0% | INF 43/50 = 86,0% |
CE 219/300 = 73,0% | TOTAL 303/400 = 75,8% (Wilson 95%: 71,3% a 79,7%).
Projecao direta pelos simulados: 60,6 de 80 na objetiva, 70,6 de 100 com os 10 de titulos.
Corte da objetiva = 48 de 80 (item 11.25).

PIOR UNIDADE DO EDITAL, COM FOLGA: 2.7 Arquitetura, Urbanismo e Acessibilidade, 5/14 = 35,7%,
32 pp abaixo da penultima (2.3, 68,0%) e PIOROU com este simulado (era 4/10 = 40,0%).
E a unica unidade abaixo do que se obteria chutando entre duas alternativas, e cobre apenas
tres subitens (2.7.1 arquitetura/urbanismo, 2.7.2 NBR 9050, 2.7.3 NBR 15575), dos quais dois
sao normas fechadas e decoraveis. Segundo foco: 2.4 Geologia e Geotecnia, 21/29 = 72,4%,
com quatro erros de investigacao geotecnica na serie (Q19 e Q36 do #7, Q29 do #9, Q39 do #10).

DEFEITO NO MATERIAL: a coluna "Assunto" impressa na tabela de origem do Simulado_10.pdf vem do
classificador por palavra-chave e esta errada em Q24, Q37 e Q40 e vazia em Q14, Q31 e Q32.
Toda a classificacao desta analise foi feita a mao contra o Anexo II do Edital 5/2026-PMC
(paginas 67 a 70), nao a partir do rotulo impresso. Os simulados 11 a 15 carregam o mesmo
defeito e nao foram alterados — aguarda validacao.',
  jsonb_build_object(
    'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
    'alternativas_por_questao','5 (A-E), conforme o item 11.22 do Edital 5/2026-PMC',
    'origem_caderno','simulado_proprio_de_provas_anteriores',
    'versao_gerador','v3',
    'tempo_oficial_min',240,
    'pontuacao_ponderada',64,
    'pontuacao_maxima',80,
    'corte',48,
    'erros', jsonb_build_array(8,14,20,24,28,37,39,40),
    'divergencia_transcricao','NENHUMA. Primeira vez na serie: os oito erros reportados conferem com o gabarito do PDF. Antes houve seis divergencias (simulados 2, 3, 4, 6 e 9).',
    'recorde','empata o melhor da serie (#5 e #9) e e o mais rapido dos tres, 76 min',
    'normas_dos_erros', jsonb_build_array(
      'Criptografia assimetrica (Q08)',
      'NBR 9050 (Q14, Q24, Q37)',
      'Mecanica dos solos / erosao (Q20)',
      'Investigacao geotecnica (Q39)',
      'Vistorias e pericias (Q28)',
      'NBR 7190 / estruturas de madeira em incendio (Q40)'),
    'por_unidade_edital', jsonb_build_object(
      '2.1','1/1','2.2','0/0','2.3','3/4','2.4','2/4','2.5','0/0','2.6','2/2',
      '2.7','1/4','2.8','4/4','2.9','5/5','2.10','0/1','2.11','5/5'),
    'acumulado_por_unidade', jsonb_build_object(
      '2.1','18/21','2.2','28/39','2.3','17/25','2.4','21/29','2.5','5/6','2.6','32/44',
      '2.7','5/14','2.8','26/31','2.9','22/32','2.10','13/19','2.11','32/39'),
    'acumulado_serie', jsonb_build_object(
      'simulados',10,'questoes',400,'acertos',303,'pct',75.8,
      'lp','41/50','inf','43/50','ce','219/300',
      'wilson95_total','71,3% a 79,7%'),
    'projecao_simulados_only', jsonb_build_object(
      'objetiva_de_80',60.6,'com_titulos_de_100',70.6,
      'formula','0,820 x 10 (LP) + 0,860 x 10 (INF) + 0,730 x 60 (CE)',
      'ressalva','cenario hibrido D da 0079 NAO foi recalculado; depende de reagregar a base do TEC'),
    'estudo_vespera', jsonb_build_object(
      'licitacao_min',101,'nr18_min',16,'etp_min',19,'correcao_ativa_min',300,
      'nbr9050_min',0,'nbr15575_min',0,
      'leitura','as unidades estudadas em 04-07/11 fecharam 2.11 5/5, 2.9 5/5 e 2.8 4/4; a unidade nao estudada, 2.7, deu 1/4 e concentrou tres dos oito erros',
      'ressalva','ausencia de registro no painel nao prova ausencia de estudo; o demonstrado e correlacao, nao causalidade'),
    'prescricao_0075_nao_cumprida','a 0075 prescreveu em 04/11 uma sessao de 40+ min nas definicoes da NBR 15575 e da NBR 9050. Tres dias depois: zero minuto registrado, e tres erros de 2.7 no simulado 10.',
    'definicao_trocada_quarta_vez','Q37 marcou a definicao de rota acessivel no lugar de linha guia. Mesmo mecanismo da Q18 do #8 (desempenho x durabilidade) e da Q25 do #9. Quarta ocorrencia.',
    'erro_de_comando','Q40: o enunciado diz "condicoes excepcionais" e a alternativa marcada fala de temperatura ambiente. Erro de leitura, nao de norma. Terceiro erro nao-recall da serie.',
    'retratacao_0072_terceira_atenuacao','a queda de CE recua de p = 0,062 (0072) para 0,093 (0073) e agora 0,152. CE 1-5 = 115/150 contra CE 6-10 = 104/150, z = 1,43. Nao era tendencia; era ruido. Erro meu de interpretacao precoce.',
    'recuperacao_tambem_nao_significativa','CE 6-8 = 59/90 (65,6%) contra CE 9-10 = 45/60 (75,0%): z = 1,23, p = 0,219. Nem a queda nem a recuperacao passam. CE oscila em torno de 73%.',
    'regra_espacamento_sob_tensao','licitacao estudada a 0-1 dia (faixa "sem ganho") deu 5/5; acessibilidade com 81 min a 7 dias (mesma faixa) deu 1/4. O que separa os dois e dose recente, nao espacamento. A regra pode valer para retencao longa, mas nao explica os simulados 9 e 10. Falta na serie o caso que a testaria: dose de 40+ min com espacamento de 8+ dias.',
    'defeito_rotulo_assunto','a coluna "Assunto" do Simulado_10.pdf vem do classificador por palavra-chave e esta errada em Q24 e Q37 (rotuladas Impermeabilizacao, sao 2.7) e Q40 (rotulada Estruturas de concreto, e 2.3), e vazia em Q14, Q31 e Q32. Classificacao desta analise feita a mao contra o Anexo II do edital, paginas 67 a 70. Simulados 11 a 15 tem o mesmo defeito e nao foram alterados.',
    'pendencia_denominador','a soma dos denominadores por unidade da 299 e nao 300: uma questao de CE da serie nao esta mapeada. Erro herdado da 0073 (269 contra 270), nao introduzido aqui. Nao corrigido por chute.'
  ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total,
     new_questions, review_questions, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 32, 8, 0, 0, 64.00, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, v_when, 'simulado', 76, v_sess,
          'Simulado FAFIPA no 10. 32/40 = 64 de 80 pontos em 76 min. LP 5/5, INF 4/5, CE 23/30.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong)
  values (v_user, v_att, v_b_lp,  5, 0),
         (v_user, v_att, v_b_inf, 4, 1),
         (v_user, v_att, v_b_ce, 23, 7);

  raise notice 'simulado 10: sessao % attempt %', v_sess, v_att;
end $$;
