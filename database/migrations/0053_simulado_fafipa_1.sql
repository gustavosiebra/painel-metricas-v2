-- 0053 — Simulado FAFIPA nº 1, 26/10/2026
--
-- Primeiro simulado montado a partir de provas anteriores da Fundação FAFIPA
-- (21 PDFs da pasta Dropbox\Concursos\Prefeitura de Curitiba\FAFIPA; 15 delas
-- em formato ProSeleta com gabarito oficial embutido, 560 questões extraídas).
-- Formato do Edital Normativo 5/2026-PMC: 5 Português + 5 Informática +
-- 30 Específicas, 2,00 pontos por questão, aprovação com 48 de 80.
--
-- É O PRIMEIRO DADO DO USUÁRIO CONTRA A BANCA DE CURITIBA. Até aqui o acervo
-- só tinha Vunesp, Cebraspe, FCC, IDECAN e IBAM.
--
-- RESULTADO: 30/40 brutos = 75,0%. Ponderado: 60 de 80 pontos, contra corte
-- de 48 — passaria com 12 pontos de margem.
--
-- TEMPO: 55 min de 240 permitidos (23%). 1,4 min por questão. Na prova real
-- terá 6 min por questão; em Santos usou 2,25.
--
-- RESSALVA: a maioria das questões tem 5 alternativas (A-E) e a prova de
-- Curitiba terá 4 — chute cego vale 20% aqui e 25% lá. Em compensação, as
-- provas de origem são de municípios pequenos, não de capital. Os dois
-- efeitos puxam em direções opostas e não dá para saber qual domina.
--
-- Registrado com exam_attempt desde o início, usando o template PMC Curitiba
-- que já existia — a lição da migration 0050, quando a sessão de Santos foi
-- inserida sem tentativa e a tela ofereceu arquivá-la.
--
-- VERIFICADO: sessão com 1 tentativa e 3 blocos; zero sessões de simulado
-- órfãs no banco.
--
-- NOTA DE PROCESSO: a primeira tentativa de aplicar esta migration caiu por
-- queda do conector. Conferido depois que NADA havia sido gravado — nem a
-- sessão, nem a linha em schema_migrations. O bloco abaixo é idempotente por
-- data para que uma repetição não duplique a sessão.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_tpl  uuid := '59e345e4-02cd-4edb-8987-a566eb20d3c2';
  v_board uuid;
  v_sess uuid; v_att uuid;
begin
  select id into v_board from public.exam_boards where name = 'Fundação FAFIPA';
  if v_board is null then raise exception 'banca FAFIPA nao encontrada'; end if;

  if exists (select 1 from public.study_sessions
             where user_id = v_user and study_type = 'simulado'
               and (occurred_at at time zone 'America/Fortaleza')::date = '2026-10-26') then
    raise notice 'simulado de 26/10 ja existe; nada a fazer';
    return;
  end if;

  insert into public.study_sessions
    (user_id, occurred_at, study_type, duration_minutes, exam_id, board_id, status, notes, metadata)
  values (v_user, timestamptz '2026-10-26 15:00:00-03', 'simulado', 55, v_exam, v_board, 'ativo',
'Simulado FAFIPA no 1 — montado de provas anteriores da banca, formato do Edital 5/2026-PMC.
RESULTADO: 30/40 = 75,0%. Ponderado 60/80 (corte 48). Tempo: 55 de 240 min.
BLOCOS: Portugues 3/5 · Informatica 4/5 · Especificas 23/30.
ERROS (questao · gabarito · marcou · o que falhou):
04 · A · E · Pontuacao — nao isolou "ainda" e pos virgula antes de "e" com mesmo sujeito
05 · D · C · Sintaxe — classificou "para mofar da agulha" como adjetiva; e adverbial final
09 · E · C · Redes — funcao do DHCP e atribuir IP; marcou "proteger comunicacao"
16 · A · D · Lei 6.766 — declividade >= 30%: parcelamento CONDICIONADO a exigencias das autoridades
26 · A · B · NBR 6122 — bloco de coroamento transfere carga para fundacao PROFUNDA, nao rasa
27 · B · D · DNIT — superelevacao varia de 2% a 10%
29 · C · E · Lei 6.766 — em ZHIS ficam de fora iluminacao publica e energia eletrica PUBLICA
34 · A · B · NR-18 — marcou a definicao de andaime no lugar de ancoragem
37 · A · B · NBR 6118 — espessura minima de laje macica de piso: 7 cm
39 · A · B · Habitacao unifamiliar EM SERIE, nao coletiva
PADRAO: 7 dos 10 erros sao lei ou norma com numero/definicao decorada. ZERO erros de raciocinio ou calculo.
LEI 6.766: errada 2x aqui (Q16 e Q29) e 1x na prova de Santos (Q23, excecao de ZHIS) — 3 de 3.
A Q29 e o MESMO tema da Q23 de Santos, errado de novo 8 dias depois.
VELOCIDADE: das 10, no maximo 3 (Q04, Q05, Q26) sao recuperaveis com releitura. As outras 7 sao
lacuna de norma e nao se resolvem com tempo. A pressa custou ate 3 questoes; a lacuna custou 7.
Q09 pode ser ignorada: protocolos de rede nao constam do item 1.2 do edital de Curitiba.',
    jsonb_build_object(
      'origem_caderno','simulado_proprio_de_provas_anteriores',
      'fonte','21 provas FAFIPA, 15 com gabarito oficial, 560 questoes extraidas',
      'formato','Edital 5/2026-PMC: 5 LP + 5 Inf + 30 CE',
      'tempo_oficial_min',240,
      'pontuacao_ponderada',60,'pontuacao_maxima',80,'corte',48,
      'alternativas_por_questao','maioria 5 (A-E); a prova de Curitiba tera 4',
      'erros', jsonb_build_array(4,5,9,16,26,27,29,34,37,39)
    ))
  returning id into v_sess;

  insert into public.session_results
    (user_id, session_id, questions_total, correct_total, wrong_total, score, score_is_estimate, metadata)
  values (v_user, v_sess, 40, 30, 10, 60, false,
          jsonb_build_object('escala_score','pontos ponderados pelo edital, maximo 80'));

  insert into public.study_session_boards (user_id, session_id, board_id)
  values (v_user, v_sess, v_board);

  insert into public.exam_attempts
    (user_id, template_id, occurred_at, origem, duration_minutes, session_id, notes)
  values (v_user, v_tpl, timestamptz '2026-10-26 15:00:00-03', 'simulado', 55, v_sess,
          'Simulado FAFIPA no 1, montado de provas anteriores da banca.')
  returning id into v_att;

  insert into public.exam_attempt_blocks (user_id, attempt_id, block_id, correct, wrong) values
    (v_user, v_att, '9f08a4f7-cbfe-4229-ab16-f8ee2bd6d74f', 3, 2),
    (v_user, v_att, 'ae44d810-271a-4e27-858f-520cbb7cd67b', 4, 1),
    (v_user, v_att, '199a8c4c-7df7-4bfa-a77c-859f5b296b1f', 23, 7);

  raise notice 'sessao % / tentativa % criadas', v_sess, v_att;
end $$;
