-- 0075 — Confirma a data dos simulados 8 e 9 e registra o que o par mostra
--
-- O usuario confirmou: "fiz os dois simulados hoje". Os dois sao de 04/11.
-- Remove a pendencia de data gravada na 0073 e registra tres leituras que so
-- existem porque os dois foram no mesmo dia.
--
-- 1) NAO HA FADIGA MENSURAVEL EM 220 MINUTOS DE SIMULADO
--    #8 ... 120 min ... 28/40 ... 56 pontos
--    #9 ... 100 min ... 32/40 ... 64 pontos   (feito DEPOIS)
--    O segundo foi melhor E mais rapido. Em 220 minutos de prova no mesmo dia
--    o desempenho subiu 4 questoes. A prova de Curitiba tem 4 horas e 40
--    questoes; esse par e evidencia direta de que resistencia nao e o gargalo.
--    Com n = 1 nao da para afirmar efeito de aquecimento, mas da para
--    descartar queda por cansaco nessa faixa de duracao.
--
-- 2) O CONTRAEXEMPLO DA DOSE DA 0072 FICA MAIS FRACO
--    La eu registrei que 40 min de licitacao em 03/11 nao impediram 3/6 no #8.
--    No #9, no mesmo dia, licitacao foi 7/8. Mesma vespera de estudo, dois
--    resultados opostos com horas de diferenca. Isso aponta que o 3/6 do #8
--    foi mais variacao amostral do que falha da regra da dose. Mantenho o
--    contraexemplo registrado, mas rebaixado: n pequeno, nao refuta a regra.
--
-- 3) O ACHADO QUE INCOMODA: A CORRECAO ESCRITA NAO FIXOU A DEFINICAO
--    Sequencia dos fatos, toda no dia 04/11:
--      - ele faz o #8 e erra a Q18 (NBR 15575: "desempenho" — marcou a
--        definicao de DURABILIDADE)
--      - recebe a analise do #8, que traz essa correcao escrita e explicita
--      - faz o #9 e erra a Q25, que cobra A MESMA DEFINICAO
--    Ou seja: ler a correcao nao impediu o erro poucas horas depois.
--    Isso e coerente com a regra de dose ja medida na 0070 — abaixo de ~40
--    minutos por tema nao aparece efeito — e mostra que LER A CORRECAO E UMA
--    DOSE PEQUENA DEMAIS. Correcao ativa de 50 min funcionou antes; leitura
--    passiva de um paragrafo nao substitui.
--    RESSALVA: nao tenho como provar que ele leu aquele trecho especifico.
--    O que e verificavel e que a correcao foi entregue entre os dois simulados.
--    Registrado como observacao, nao como efeito medido.
--
-- A unidade 2.7 (Acessibilidade e Desempenho) segue em 4/10 = 40%, a pior do
-- edital, e agora com tres erros de NOMENCLATURA documentados, nao de cota.
-- A acao que cabe nao e reler a correcao: e uma sessao dedicada de 40+ min na
-- secao de termos e definicoes da NBR 15575 e da NBR 9050.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_s8 uuid; v_s9 uuid;
begin
  select id into v_s8 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 8 %';
  select id into v_s9 from public.study_sessions
   where user_id=v_user and study_type='simulado' and notes like 'Simulado FAFIPA no 9 %';
  if v_s8 is null or v_s9 is null then
    raise exception 'simulado 8 ou 9 nao encontrado';
  end if;

  -- limpa a pendencia de data e grava a confirmacao
  update public.study_sessions
     set metadata = (metadata - 'data_a_confirmar')
       || jsonb_build_object(
            'data_confirmada','usuario confirmou em 04/11: os simulados 8 e 9 foram feitos no mesmo dia',
            'par_mesmo_dia','#8 120 min 28/40 seguido de #9 100 min 32/40 — o segundo foi melhor e mais rapido; sem queda por fadiga em 220 min de simulado'),
         notes = replace(notes,
'DATA: registrado em 04/11, o mesmo dia do simulado 8, porque foi a data em que ele reportou os dois.
Sao 220 min de simulado no mesmo dia (120 + 100). Se um dos dois foi feito em outra data, corrigir por
migration — a data importa para a analise de dose e espacamento.',
'DATA CONFIRMADA pelo usuario: os simulados 8 e 9 foram feitos no MESMO DIA, 04/11, somando 220 min de
prova (120 + 100). O #9 veio depois do #8 e foi MELHOR e MAIS RAPIDO (32 contra 28, 100 min contra
120). Nao ha queda por fadiga nessa faixa de duracao — relevante porque a prova de Curitiba tem 4h.')
   where id = v_s9;

  update public.study_sessions
     set metadata = metadata || jsonb_build_object(
           'par_mesmo_dia','#8 e #9 foram feitos no mesmo dia 04/11; o #9, feito depois, deu 32/40 em 100 min contra 28/40 em 120 min do #8',
           'contraexemplo_dose_rebaixado','no #9, no mesmo dia e com a mesma vespera de estudo, licitacao foi 7/8. O 3/6 do #8 e mais variacao amostral que falha da regra da dose; contraexemplo mantido mas rebaixado',
           'correcao_lida_nao_fixou','a Q18 do #8 (NBR 15575, definicao de desempenho) foi corrigida por escrito entre os dois simulados e a MESMA definicao foi errada na Q25 do #9, horas depois. Observacao, nao efeito medido: nao da para provar que ele leu aquele trecho.')
   where id = v_s8;

  raise notice 'ok %, %', v_s8, v_s9;
end $$;
