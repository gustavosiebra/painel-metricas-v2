-- 0070 — Corrige conclusao errada que gravei na nota do simulado 6
--
-- O QUE EU ESCREVI NA 0068, e esta ERRADO:
--   "NR-18 errada DUAS VEZES, ambas cota numerica (0,40 m e 0,80 m), depois de
--    ele ter lido a norma em 30/10. Leitura de norma de novo nao fixou numero."
--
-- A frase generaliza a partir de um caso e ignora o caso oposto que estava no
-- MESMO simulado. Em 31/10, antes do simulado, ele revisou a NBR 9050 por
-- 81 minutos — a sessao isolada mais longa da semana. Resultado:
--
--   NBR 9050 nos seis simulados:  #1 ok · #2 ERRO · #3 ERRO · #4 ERRO ·
--                                 #5 ERRO · #6 OK
--
-- Quatro erros seguidos, e a sequencia quebrou exatamente no simulado feito no
-- dia da revisao. Nao e "leitura nao fixa numero".
--
-- A DIFERENCA REAL ESTA NA DOSE, e os dados dele mostram isso:
--   funcionou  — Lei 6.766 (41 min), Lei 11.095 (44 min), NBR 9050 (81 min)
--   nao pegou  — NR-18 (20 min), Lei 10.098 (10 min, e era a LEI quando a
--                questao pedia a COTA da NBR 9050)
-- Abaixo de ~40 minutos nao aparece efeito mensuravel na serie.
--
-- MEDICAO QUE SUSTENTA A CORRECAO (240 questoes dos seis simulados):
-- Para os 10 temas que receberam sessao dedicada entre 25 e 31/10, comparando
-- a taxa de erro ANTES e DEPOIS da sessao:
--
--   antes  da sessao ... 23 questoes ...  9 erros ... 39,1%
--   depois da sessao ... 57 questoes ...  8 erros ... 14,0%
--   delta -25,1 pp ... z = -2,25 ... p = 0,024   SIGNIFICATIVO
--
-- Casos que uma simples regressao a media nao explica:
--   Legislacao urbanistica ... 0/1 antes  ->  6/6 depois, em 4 simulados
--   Licitacoes (ETP)       ... 5/6 antes  ->  6/6 depois
--   NBR 9050               ... quebrou sequencia de QUATRO erros
--
-- CONTROLE NEGATIVO: Saneamento nao teve NENHUMA sessao em sete dias.
--   18 questoes, 8 erros = 44,4% contra 22,1% de todo o resto. z = 1,86.
--   E a pior disciplina da serie e a unica grande nunca tocada.
--
-- CONFUNDIDOR QUE PERMANECE: ele estuda o que erra, entao parte da queda e
-- regressao a media. Registrado, nao resolvido — so uma medicao prospectiva
-- resolveria.
--
-- EFEITO DEFASADO, observado mas nao explicado: em 29/10 ele fez 108 questoes
-- de Informatica as 12h e as 16h do mesmo dia ainda errou duas (3/5). Nos dois
-- simulados seguintes: 5/5 e 5/5. Ja a NBR 9050 pegou no mesmo dia. Com seis
-- simulados nao da para dizer qual dos dois e a regra.
--
-- Atualizacao por id da sessao.

do $$
declare
  v_sess uuid;
begin
  select id into v_sess from public.study_sessions
  where user_id='b0d56062-0a37-48de-ae34-5aa79be0aa2a' and study_type='simulado'
    and (occurred_at at time zone 'America/Fortaleza')::date='2026-10-31';
  if v_sess is null then raise exception 'sessao do simulado 6 nao encontrada'; end if;

  update public.study_sessions
  set notes = replace(notes,
'NR-18 errada DUAS VEZES, ambas cota numerica (0,40 m e 0,80 m), depois de ele ter lido a norma em
30/10. Leitura de novo nao fixou numero.',
'ESTUDO DO DIA (3h38, o mais pesado da semana): revisao NBR 9050 81 min, correcao ativa 55 min,
flashcards 17 min, simulado 65 min.
EFEITO MEDIDO: a NBR 9050 vinha errada em #2, #3, #4 e #5 — quatro seguidas — e saiu CERTA no #6,
no dia dos 81 min de revisao. Nos 10 temas que receberam sessao dedicada entre 25 e 31/10, a taxa de
erro cai de 39,1% (23 questoes) antes da sessao para 14,0% (57 questoes) depois: -25,1 pp, z = -2,25,
p = 0,024. Confundidor registrado: ele estuda o que erra, entao parte disso e regressao a media —
mas sequencias como Legislacao urbanistica 0/1 -> 6/6 e Licitacoes 5/6 -> 6/6 nao se explicam so por isso.
A DOSE E QUE DECIDE, nao o formato: funcionou com 41, 44 e 81 min (Lei 6.766, Lei 11.095, NBR 9050);
nao pegou com 20 min (NR-18, errada duas vezes no dia seguinte) nem com 10 min (Lei 10.098, e era a
LEI quando a questao pedia a COTA da norma). Abaixo de ~40 min nao aparece efeito na serie.
CONTROLE NEGATIVO: Saneamento, sem nenhuma sessao em sete dias, tem 8 erros em 18 questoes (44,4%)
contra 22,1% de todo o resto — a pior disciplina da serie e a unica grande nunca tocada.'),
      metadata = metadata || jsonb_build_object(
        'estudo_do_dia_min', 153,
        'efeito_estudo_medido', 'temas com sessao dedicada: 39,1% de erro antes contra 14,0% depois; z = -2,25; p = 0,024',
        'dose_minima_observada', 'cerca de 40 min por norma; 20 min e 10 min nao produziram efeito')
  where id=v_sess;
  raise notice 'nota do simulado 6 corrigida';
end $$;
