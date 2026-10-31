-- 0065 — Corrige erro de contagem meu na nota do simulado 4
--
-- A nota gravada pela 0061 diz "Informatica erra em todos (13/20 acumulado)".
-- Errado. Conferido em exam_attempt_blocks, os quatro simulados dao:
--
--   #1  4/5 · #2  4/5 · #3  4/5 · #4  3/5  =  15/20 = 75,0%
--
-- Erro de soma meu, nao de registro: os blocos sempre estiveram certos no
-- banco. So a nota em texto estava errada, e ela aparece no painel.
--
-- Acumulados corretos dos quatro simulados, para referencia:
--   Lingua Portuguesa     3+5+5+4 = 17/20 = 85,0%
--   Nocoes de Informatica 4+4+4+3 = 15/20 = 75,0%
--   Conhecimentos Espec. 23+22+22+24 = 91/120 = 75,8%
--   TOTAL                            123/160 = 76,9%
--
-- Atualizacao por id da sessao.

do $$
declare
  v_sess uuid := '3524bd29-8549-4d4d-bc02-1211a4146713';
  v_antes text;
begin
  select notes into v_antes from public.study_sessions where id = v_sess;
  if v_antes is null then raise exception 'sessao do simulado 4 nao encontrada'; end if;
  if position('13/20 acumulado' in v_antes) = 0 then
    raise notice 'texto "13/20 acumulado" nao encontrado — nada a corrigir'; return;
  end if;

  update public.study_sessions
  set notes = replace(notes, '13/20 acumulado', '15/20 acumulado')
  where id = v_sess;

  raise notice 'nota do simulado 4 corrigida: 13/20 -> 15/20';
end $$;
