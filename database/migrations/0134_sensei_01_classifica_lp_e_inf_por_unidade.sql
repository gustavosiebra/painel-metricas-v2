-- 0134 - Sensei 01: classifica por unidade do edital as 10 questoes de LP e INF
--
-- AUTORIZADO pelo usuario em 22/11/2026 ("reconstrua o mapa e corrija os erros",
-- apos eu explicar que 1.1.LP e 1.2.INF eram linhas que eu mesmo criei).
--
-- O ERRO: na 0114 gravei as 5 questoes de Portugues e as 5 de Informatica do
-- Sensei 01 com unidade '1.1.LP' e '1.2.INF' (o bloco inteiro) em vez de
-- classificar cada uma. Esses codigos nao existem no edital; o Mapa os mostrava
-- como "unidades" com 5/5 e inflava os totais de LP e INF.
--
-- CLASSIFICACAO (lida no PDF FAFIPA/SIMULADOS/simuladoSensei.pdf, pag. 2-5):
--   01 regencia verbal (assistir a, preferir a)     -> 1.1.8  (sem unidade propria
--                                                     para regencia no edital; sintaxe)
--   02 sujeito, predicado, adjunto adverbial        -> 1.1.8
--   03 interpretacao do texto sobre atividade fisica-> 1.1.1
--   04 concordancia nominal                         -> 1.1.9
--   05 tonicidade e acentuacao (responsavel, ...)   -> 1.1.5
--   06 nome invalido de arquivo no Windows 10       -> 1.2.5  (gerenciamento de arquivos)
--   07 placa de video                               -> 1.2.2  (hardware; mais proximo)
--   08 tela inicial do Windows 10                   -> 1.2.7
--   09 ransomware e spyware                         -> 1.2.6
--   10 formatacao logica de unidade de armazenamento-> 1.2.5
-- Escolhas de fronteira: 01 (regencia), 07 (hardware fora de E/S) e 10.
-- Todas as 10 foram acertos (LP 5/5 e INF 5/5), entao nenhum placar muda; so a
-- distribuicao por assunto.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  r record; n int := 0;
begin
  if exists (select 1 from public.questions
              where user_id=v_user and tags->>'banca'='SENSEI' and tags->>'sensei'='1'
                and tags->>'unidade' in ('1.1.LP','1.2.INF')) is false then
    raise notice '0134: nada a reclassificar'; return;
  end if;

  for r in select * from (values
      (1,'1.1.8'),(2,'1.1.8'),(3,'1.1.1'),(4,'1.1.9'),(5,'1.1.5'),
      (6,'1.2.5'),(7,'1.2.2'),(8,'1.2.7'),(9,'1.2.6'),(10,'1.2.5')) as t(q,u)
  loop
    update public.questions
       set tags = tags || jsonb_build_object('unidade', r.u,
             'unidade_anterior', tags->>'unidade',
             'unidade_motivo','0134: reclassificado lendo o enunciado no PDF')
     where user_id=v_user and tags->>'banca'='SENSEI' and tags->>'sensei'='1'
       and (tags->>'questao_sensei')::int = r.q
       and tags->>'unidade' in ('1.1.LP','1.2.INF');
    n := n + 1;
  end loop;

  if (select count(*) from public.questions where user_id=v_user and tags->>'banca'='SENSEI'
        and tags->>'unidade' in ('1.1.LP','1.2.INF')) <> 0 then
    raise exception '0134: ainda restam questoes em 1.1.LP/1.2.INF';
  end if;
  raise notice '0134: 10 questoes do Sensei 01 reclassificadas';
end $$;
