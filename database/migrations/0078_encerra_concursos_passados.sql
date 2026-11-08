-- 0078 — Marca como inativos os concursos que ja aconteceram
--
-- POR QUE: o usuario informou em 06/11 "tce-sp ja passou agora e curitiba".
-- O painel tinha CINCO concursos com status 'ativo', sendo que quatro ja
-- tiveram a prova aplicada. Isso contamina qualquer visao agregada.
--
-- EFEITO MEDIDO ANTES DA CORRECAO:
--   v_diagnostico_geral ... 4.368 questoes, Wilson 65,5%, classificacao "atencao"
--   so Prefeitura de Curitiba 2026 ... 1.609 questoes, 71,6%
-- Ou seja, o dashboard estava somando a preparacao do TCE (2.687 questoes,
-- encerrada em 09/10) com a de Curitiba e puxando o indicador para baixo.
--
-- SITUACAO DOS CINCO:
--   Prefeitura de Curitiba 2026 ... prova 06/12/2026 ... CONTINUA ATIVO
--   TCE 2026 .................... sem data, ultima sessao 09/10/2026 ... inativo
--   TCE SP ...................... prova 11/10/2026, ja aplicada ....... inativo
--   ALECE 2026 .................. prova 16/08/2026, ja aplicada ....... inativo
--   TJ-CE ....................... prova 09/08/2026, ja aplicada ....... inativo
--
-- NADA E APAGADO. O historico de sessoes, resultados e cadernos permanece
-- intacto e vinculado a cada concurso; so o status muda, e e reversivel.
-- O enum record_status so admite 'ativo' e 'inativo'.
--
-- PENDENCIA EM ABERTO, registrada: nao ficou claro se "ja passou" significa
-- que a prova do TCE-SP ocorreu ou que ele foi aprovado. Se houver aprovacao,
-- a leitura de risco de Curitiba muda — mirar o topo com uma aprovacao no
-- bolso e decisao diferente de mirar o topo sem rede.
-- (RESOLVIDO na 0079: ele informou que nao foi aprovado.)

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  n int;
begin
  update public.exams
     set status='inativo',
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
           'encerrado_em','2026-11-06',
           'motivo','prova ja aplicada; foco unico passa a ser Prefeitura de Curitiba 2026 (06/12/2026)')
   where user_id=v_user
     and name in ('TCE 2026','TCE SP','ALECE 2026','TJ-CE')
     and status='ativo';
  get diagnostics n = row_count;
  raise notice 'concursos encerrados: %', n;

  if not exists (select 1 from public.exams
                 where user_id=v_user and name='Prefeitura de Curitiba 2026' and status='ativo') then
    raise exception 'Curitiba deveria seguir ativo e nao esta';
  end if;
end $$;
