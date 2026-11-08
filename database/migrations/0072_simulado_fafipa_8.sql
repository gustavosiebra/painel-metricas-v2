-- 0072 — Simulado FAFIPA nº 8, 04/11/2026
--
-- RESULTADO: 28/40 = 70,0%. Ponderado 56 de 80 pontos.
-- TEMPO: 120 min de 240. O DOBRO da media dos sete anteriores (65,6 min).
-- BLOCOS (como montados): Portugues 4/5 · Informatica 5/5 · Especificas 19/30.
--
-- SEM PENDENCIA DE TRANSCRICAO: as 12 letras informadas divergem todas do
-- gabarito. Segunda vez seguida.
--
-- SERIE DOS OITO:
--   #1  26/10   55 min  30/40  60 pts
--   #2  27/10   70 min  31/40  62 pts
--   #3  28/10   75 min  31/40  62 pts
--   #4  29/10   66 min  31/40  62 pts
--   #5  30/10   60 min  32/40  64 pts
--   #6  31/10   65 min  28/40  56 pts
--   #7  01/11   68 min  28/40  56 pts
--   #8  04/11  120 min  28/40  56 pts
--
-- ACUMULADO: LP 31/40 (77,5%) · INF 34/40 (85,0%) · CE 174/240 (72,5%)
--            TOTAL 239/320 = 74,7%
--
-- ============================================================
-- DEFEITO DE MONTAGEM ENCONTRADO NESTE SIMULADO — registrar
-- ============================================================
-- O usuario apontou: "em informatica vc errou e colocou duas questoes de
-- licitacoes". CONFERIDO E PROCEDE.
--   Q06 = PARANA EDUCACAO Q18 — fases de licitacao, Lei 14.133
--   Q10 = PARANA EDUCACAO Q20 — Decreto 11.878/2024, credenciamento, SICAF
-- Ambas foram ACERTADAS, entao nao mudam a nota, mas poluem a medicao do
-- bloco de Informatica.
--
-- CAUSA RAIZ: a prova do PARANAEDUCACAO tem um cabecalho de secao que o
-- parser nao conhecia — "Regulamento de Licitacoes e Contratos do
-- Paranaeducacao" — imediatamente antes da Q17. Sem esse marcador, a secao
-- de Informatica (Q13 a Q16) foi lida como indo ate a Q20.
--
-- VARREDURA DOS 75 SLOTS DE INFORMATICA DOS 15 SIMULADOS: 5 contaminacoes.
--   SIM 3  Q07  CAMPO LARGO Q27          legislacao  (JA FEITO — e ele ERROU)
--   SIM 8  Q06  PARANA EDUCACAO Q18      licitacao   (acertou)
--   SIM 8  Q10  PARANA EDUCACAO Q20      licitacao   (acertou)
--   SIM 9  Q06  PARANA EDUCACAO Q17      CF/1988     (ainda nao feito)
--   SIM 11 Q07  PARANA EDUCACAO Q19      licitacao   (ainda nao feito)
--
-- INFORMATICA CORRIGIDA (descontados os 3 slots contaminados dos simulados
-- ja resolvidos): 32/37 = 86,5%, e nao 34/40 = 85,0%. Um dos 6 erros de
-- Informatica da serie — a Q07 do simulado 3 — nao era de Informatica.
-- Mantenho 34/40 nos campos numericos porque e o que o caderno aplicado
-- continha; a correcao fica aqui e nos metadados.
--
-- LIMITE DE ACERVO DESCOBERTO NA MESMA VARREDURA: as 36 provas tem apenas
-- 61 questoes de Informatica unicas (so 12 provas tem secao de Informatica,
-- e a prova "Tres Barras" esta duplicada sob duas grafias). 55 ja foram
-- usadas. Sobra UMA. Nao ha como montar novos blocos de Informatica ineditos.
--
-- ============================================================
-- A QUEDA EM ESPECIFICAS SAIU DA FAIXA DE RUIDO
-- ============================================================
--   primeiros 5 simulados ... 115/150 = 76,7%
--   ultimos   3 simulados ...  59/90  = 65,6%
--   delta -11,1 pp ... z = -1,87 ... p = 0,062
-- Ainda nao cruza 0,05, mas e o sinal mais forte da serie e ja nao cabe
-- chamar de oscilacao: tres resultados seguidos em 20, 20 e 19.
-- LP (77,5%) e Informatica (85,0%) seguem estaveis — a queda e SO de CE.
--
-- TEMPO: 120 min contra 55-75 nos sete anteriores, e o mesmo 28. Isso
-- DESCARTA pressa como causa. Mais tempo nao recupera o que falta.
--
-- ERROS (questao · gabarito · marcou · conteudo · item do edital):
-- 04 · C · B · Classes de palavras: substantivo proprio, numeral cardinal,
--              artigo indefinido em trechos destacados            · 1.1.6
-- 11 · C · B · Instalacao predial hidrossanitaria: valvula de descarga exige
--              coluna EXCLUSIVA saindo do reservatorio       · FORA DO EDITAL
-- 15 · C · B · Contratacao direta: os autos sao instruidos com parecer
--              juridico e pareceres tecnicos                      · 2.11.3
-- 17 · E · C · NR-35: inspecao periodica do cinturao no minimo a cada DOZE
--              meses. Com 10 meses esta VALIDA.                   · 2.9.5
-- 18 · D · E · NBR 15575: DESEMPENHO e "comportamento em uso". Ele marcou a
--              definicao de DURABILIDADE.                         · 2.7.3
-- 22 · D · E · Elementos LINEARES: vigas, pilares, tirantes e arcos. Placas e
--              chapas sao elementos de superficie.                · 2.3.2
-- 25 · C · E · Lei 14.133: hipoteses de extincao do contrato      · 2.11.11
-- 27 · B · E · NBR 6118 ancoragem: gancho apenas em barras TRACIONADAS, barra
--              transversal soldada e chapa soldada na ponta       · 2.3.2
-- 31 · D · B · BDI: os tributos de natureza DIRETA e personalistica NAO
--              integram a composicao                              · 2.8.2
-- 33 · C · A · Coeficiente de aproveitamento: terracos DESCOBERTOS nao sao
--              computaveis, salvo pergula ou cobertura            · 2.1
-- 36 · C · B · Objetivo da licitacao: resultado mais vantajoso considerado
--              TODO O CICLO DE VIDA do objeto                     · 2.11.2
-- 38 · B · C · Junta de dilatacao: reduz tensoes internas por RETRACAO ou
--              ABAIXAMENTO de temperatura; 25%                    · 2.3
--
-- ZERO ERROS DE RACIOCINIO PELO OITAVO SIMULADO SEGUIDO. Sao 320 questoes e
-- 89 erros, todos de recall — norma, definicao, nomenclatura ou cota. O unico
-- erro de interpretacao da serie inteira segue sendo a Q01 do #6.
-- E por isso que os 120 minutos nao ajudaram.
--
-- DESEMPENHO POR UNIDADE DO EDITAL NESTE SIMULADO:
--   2.1  Legislacao Municipal ...... 0/1
--   2.2  Materiais e Tecnicas ...... 3/3
--   2.3  Estruturas ................ 2/5   <-- Q22, Q27, Q38
--   2.4  Geotecnia e Fundacoes ..... 5/5   <-- melhor unidade
--   2.5  Hidrologia e Drenagem ..... 0/0   <-- ZERO questoes, 8a vez
--   2.6  Saneamento ................ 1/1
--   2.7  Acessibilidade e Desempenho 1/2
--   2.8  Planejamento e Orcamento .. 2/3
--   2.9  Patologia e Seguranca ..... 1/2
--   2.10 Avaliacoes e Pericias ..... 1/1
--   2.11 Licitacoes e Contratos .... 3/6   <-- QUEDA, ver abaixo
--   fora do edital ................. 0/1   (Q11)
--
-- ============================================================
-- PRIMEIRO CONTRAEXEMPLO DA REGRA DA DOSE — registrar sem suavizar
-- ============================================================
-- Em 03/11, vespera do simulado, ele fez 40 minutos no caderno "Licitacao e
-- Contratos Administrativos" (30 min + 10 min, study_type = questao).
-- No dia seguinte caiu SEIS questoes de licitacao e ele acertou TRES.
-- Acumulado de 2.11 cai de 17/20 (85,0%) para 20/26 (76,9%).
--
-- A regra que venho usando — "cerca de 40 min por tema produz efeito" —
-- previa melhora. Nao houve. Esse e o PRIMEIRO caso claro contra a regra em
-- oito simulados, e fica registrado como tal.
--
-- HIPOTESE, NAO CONCLUSAO: os casos em que a dose funcionou foram LEITURA ou
-- REVISAO da fonte primaria (Lei 6.766 41 min, Lei 11.095 44 min, NBR 9050
-- 81 min, NBR 14653 29 min). Este foi RESOLUCAO DE QUESTOES. Pode ser que
-- resolver questoes nao substitua ler a norma para conteudo de rol e
-- principio. NAO esta testado — e uma hipotese com n = 1 e precisa de mais
-- observacoes antes de virar regra.
--
-- OS TRES ERROS DE LICITACAO SAO DO MESMO TIPO: rol e principio da Lei
-- 14.133 (documentos da contratacao direta, hipoteses de extincao, objetivo
-- da licitacao). Nenhum e de execucao ou fiscalizacao contratual. E decoreba
-- de lista.
--
-- PADRAO REPETIDO DO SIMULADO 7 — disciplina certa, sub-topico errado:
--   estudou NR-18 por 36 min em 03/11 ... errou a Q17, que e NR-35
--   estudou NBR 9050 por  8 min em 03/11 ... errou a Q18, que e NBR 15575
-- Segunda ocorrencia consecutiva do mesmo padrao.
--
-- ABERTURA DE DUAS FRENTES NOVAS EM 03/11, ambas abaixo da dose:
--   Lei 1.656/1958 Estatuto dos Funcionarios de Curitiba .. 16 min (item 2.1.2,
--      que estava com ZERO minuto no historico)
--   Drenagem Urbana (macro e microdrenagem) ............... 20 min (primeiro
--      caderno da unidade 2.5, que vale 16% da prova)
-- As duas sao as maiores lacunas do plano. Comecaram. Abaixo de 40 min.
--
-- COMPOSICAO DO SIMULADO CONTRA O PESO DO EDITAL — defeito meu, nao dele:
--   2.5  no simulado  0,0%  no edital 16,0%  delta -16,0
--   2.1  no simulado  3,3%  no edital 16,0%  delta -12,7
--   2.3  no simulado 16,7%  no edital  6,2%  delta +10,5
--   2.4  no simulado 16,7%  no edital  6,2%  delta +10,5
-- As duas maiores unidades do edital somaram UMA questao de 30.
--
-- ESTUDO DA VESPERA (03/11, 237 min): NR-18 36, licitacao 40, LP 51,
-- Informatica 29, drenagem urbana 20, Lei 1.656 16, Lei 7.671 19,
-- NBR 9050 8, flashcards 18.
--
-- Atualizacao por id da sessao, nunca por data.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_tpl  uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';
  v_board uuid; v_sess uuid; v_att uuid;
begin
  select id into v_board from public.exam_boards where name = 'Fundação FAFIPA';
  if exists (select 1 from public.study_sessions
             where user_id=v_user and study_type='simulado'
               and (occurred_at at time zone 'America/Fortaleza')::date='2026-11-04') then
    raise notice 'simulado de 04/11 ja existe'; return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-11-04 16:00:00-03', 'simulado', 120, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 8 — provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 28/40 = 70,0%. Ponderado 56/80 (corte 48). Tempo: 120 de 240 min — o DOBRO da media
dos sete anteriores (65,6 min), com o MESMO resultado. Pressa esta descartada como causa dos erros.
BLOCOS (como montados): Portugues 4/5 · Informatica 5/5 · Especificas 19/30.
SERIE: #1 30 · #2 31 · #3 31 · #4 31 · #5 32 · #6 28 · #7 28 · #8 28.
ACUMULADO: LP 31/40 (77,5%) · INF 34/40 (85,0%) · CE 174/240 (72,5%) · TOTAL 239/320 (74,7%).
SEM PENDENCIA DE TRANSCRICAO — as 12 letras divergem todas do gabarito.

DEFEITO DE MONTAGEM, APONTADO PELO USUARIO E CONFIRMADO: as questoes 06 e 10 do bloco de
Informatica sao de LICITACAO (PARANA EDUCACAO Q18 e Q20 — fases de licitacao da Lei 14.133 e
Decreto 11.878/2024 sobre credenciamento). Ambas acertadas, entao a nota nao muda, mas a medicao
do bloco fica poluida. CAUSA: a prova do PARANAEDUCACAO tem o cabecalho "Regulamento de Licitacoes
e Contratos do Paranaeducacao" antes da Q17, que o parser nao reconhecia.
VARREDURA DOS 75 SLOTS DE INFORMATICA DOS 15 SIMULADOS: 5 contaminacoes — SIM 3 Q07 (ja feito,
e ele ERROU), SIM 8 Q06 e Q10 (acertou), SIM 9 Q06 e SIM 11 Q07 (ainda nao feitos).
INFORMATICA CORRIGIDA: 32/37 = 86,5%, descontados os 3 slots contaminados dos simulados ja
resolvidos. Um dos 6 erros de Informatica da serie nao era de Informatica.
LIMITE DE ACERVO: as 36 provas tem so 61 questoes de Informatica unicas e 55 ja foram usadas.
Sobra UMA. Nao ha como montar blocos de Informatica ineditos nos simulados 9 a 15.

A QUEDA EM ESPECIFICAS SAIU DO RUIDO: primeiros 5 = 115/150 (76,7%), ultimos 3 = 59/90 (65,6%),
delta -11,1 pp, z = -1,87, p = 0,062. Nao cruza 0,05, mas sao tres resultados seguidos em 20, 20
e 19 e ja nao cabe chamar de oscilacao. LP e Informatica seguem estaveis: a queda e so de CE.

ERROS (questao · gabarito · marcou · conteudo · item do edital):
04 · C · B · Classes de palavras: substantivo proprio, numeral cardinal, artigo indefinido · 1.1.6
11 · C · B · Instalacao predial hidrossanitaria: valvula de descarga exige coluna EXCLUSIVA saindo
             do reservatorio · FORA DO EDITAL (sem unidade propria em Curitiba)
15 · C · B · Contratacao direta: os autos levam parecer juridico e pareceres tecnicos · 2.11.3
17 · E · C · NR-35: inspecao periodica do cinturao no minimo a cada DOZE meses — com 10 meses
             esta VALIDA · 2.9.5
18 · D · E · NBR 15575: DESEMPENHO e comportamento em uso. Marcou a definicao de DURABILIDADE · 2.7.3
22 · D · E · Elementos LINEARES sao vigas, pilares, tirantes e arcos; placas e chapas sao de
             superficie · 2.3.2
25 · C · E · Lei 14.133: hipoteses de extincao do contrato · 2.11.11
27 · B · E · NBR 6118 ancoragem: gancho apenas em barras TRACIONADAS, barra transversal soldada e
             chapa soldada na ponta · 2.3.2
31 · D · B · BDI: tributos de natureza DIRETA e personalistica NAO integram a composicao · 2.8.2
33 · C · A · Coeficiente de aproveitamento: terracos DESCOBERTOS nao sao computaveis · 2.1
36 · C · B · Objetivo da licitacao: resultado mais vantajoso considerado TODO O CICLO DE VIDA · 2.11.2
38 · B · C · Junta de dilatacao: reduz tensoes por RETRACAO ou ABAIXAMENTO de temperatura; 25% · 2.3

ZERO ERROS DE RACIOCINIO PELO OITAVO SIMULADO SEGUIDO. 320 questoes, 89 erros, todos de recall.
E por isso que os 120 minutos nao mudaram o resultado.

POR UNIDADE DO EDITAL: 2.1 0/1 · 2.2 3/3 · 2.3 2/5 · 2.4 5/5 · 2.5 0/0 · 2.6 1/1 · 2.7 1/2 ·
2.8 2/3 · 2.9 1/2 · 2.10 1/1 · 2.11 3/6 · fora do edital 0/1.

PRIMEIRO CONTRAEXEMPLO DA REGRA DA DOSE: em 03/11 ele fez 40 min no caderno "Licitacao e Contratos
Administrativos" (resolucao de questoes). No dia seguinte cairam SEIS de licitacao e acertou TRES.
Licitacoes cai de 17/20 (85,0%) para 20/26 (76,9%) e passa a liderar os pontos recuperaveis.
A regra previa melhora e nao houve. HIPOTESE, nao conclusao: os casos em que a dose funcionou
foram LEITURA ou REVISAO da fonte primaria; este foi RESOLUCAO DE QUESTOES. Pode ser que resolver
questoes nao substitua ler a norma quando o conteudo e rol e principio. n = 1, nao testado.
Os tres erros sao do mesmo tipo — rol e principio da 14.133, nenhum de execucao contratual.

PADRAO REPETIDO DO #7, disciplina certa e sub-topico errado: estudou NR-18 36 min em 03/11 e errou
a Q17, que e NR-35; estudou NBR 9050 8 min e errou a Q18, que e NBR 15575. Segunda vez seguida.

DUAS FRENTES NOVAS ABERTAS EM 03/11, ambas abaixo da dose: Lei 1.656/1958 (Estatuto de Curitiba,
item 2.1.2, que estava com zero minuto) por 16 min, e Drenagem Urbana por 20 min — primeiro caderno
da unidade 2.5, que vale 16% da prova. Sao as duas maiores lacunas do plano.

COMPOSICAO DO SIMULADO CONTRA O EDITAL, defeito meu: 2.5 com 0,0% contra 16,0% do edital e 2.1 com
3,3% contra 16,0%. As duas maiores unidades somaram UMA questao de 30. Ja 2.3 e 2.4, que valem
6,2% cada, levaram 10 das 30.

ESTUDO DA VESPERA (03/11, 237 min): NR-18 36, licitacao 40, LP 51, Informatica 29, drenagem
urbana 20, Lei 1.656 16, Lei 7.671 19, NBR 9050 8, flashcards 18.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,'pontuacao_ponderada',56,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','5 (A-E), conforme o item 11.22 do Edital 5/2026-PMC',
      'erros', jsonb_build_array(4,11,15,17,18,22,25,27,31,33,36,38),
      'estudo_vespera_min', 237,
      'defeito_montagem', 'Q06 e Q10 do bloco de Informatica sao de licitacao (PARANA EDUCACAO Q18 e Q20); ambas acertadas',
      'informatica_corrigida', '32/37 = 86,5% descontados os slots contaminados dos simulados ja resolvidos',
      'queda_ce', 'primeiros 5 = 76,7%, ultimos 3 = 65,6%, delta -11,1 pp, z = -1,87, p = 0,062',
      'por_unidade_edital', jsonb_build_object(
        '2.1','0/1','2.2','3/3','2.3','2/5','2.4','5/5','2.5','0/0','2.6','1/1',
        '2.7','1/2','2.8','2/3','2.9','1/2','2.10','1/1','2.11','3/6','fora','0/1'),
      'contraexemplo_dose', '40 min de licitacao em 03/11 (resolucao de questoes) e 3/6 no dia seguinte; primeiro caso contra a regra em 8 simulados',
      'normas_dos_erros', jsonb_build_array(
        'NR-35 (Q17)','NBR 15575 (Q18)','NBR 6118 (Q22, Q27)','Lei 14.133 (Q15, Q25, Q36)',
        'BDI / composicao de custos (Q31)','Coeficiente de aproveitamento (Q33)','Junta de dilatacao (Q38)')
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 28, 12, 56, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-11-04 16:00:00-03', 'simulado', 120, v_sess,
          'Simulado FAFIPA no 8.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 4, 1),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 5, 0),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 19, 11);
  raise notice 'ok % %', v_sess, v_att;
end $$;
