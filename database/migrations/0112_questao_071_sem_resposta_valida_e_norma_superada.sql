-- 0112 — Questao 071 sem resposta valida sob norma vigente, e marcacao de
--        questoes do caderno baseadas em norma superada
--
-- AUTORIZADO pelo usuario em 12/11/2026 ("sim" as duas propostas: excluir a 071
-- do denominador registrando a base normativa, e varrer o caderno atras de
-- outras questoes baseadas em norma revogada).
--
-- ============================================================
-- 1. A QUESTAO 071 — ACHADO DO USUARIO
-- ============================================================
-- Ele disse: "verifique a questao 71, verifiquei a norma atualizada e nao
-- condiz." Estava certo.
--
-- A questao pede o diametro a partir do qual a tubulacao principal exige
-- tubulacao secundaria de distribuicao. O gabarito da banca e C (300 mm), valor
-- que vem da ABNT NBR 12218:1994.
--
-- A NBR 12218:2017, item 5.5.2, vigente desde 2017, diz:
--   "Ao longo das tubulacoes principais, INDEPENDENTEMENTE DOS SEUS DIAMETROS,
--    devem ser previstas tubulacoes secundarias de distribuicao..."
--
-- A norma vigente eliminou o limiar de diametro. Nenhuma das cinco alternativas
-- e correta sob a NBR 12218:2017. A prova de origem e de 2022, quando a edicao
-- de 2017 ja estava em vigor: o erro e da banca, nao do candidato.
--
-- EFEITO: a 071 sai do placar (tags.anulada = true, com motivo registrado).
-- O registro do que ele marcou (D) permanece, so deixa de contar.
--   unidade 2.2 caderno: 12/21 = 57,1%  ->  12/20 = 60,0%
--   total do caderno:    denominador -1, erros -1
--
-- Foi preciso ajustar v_questoes_por_unidade: ela nao filtrava tags.anulada.
-- Nao havia sintoma ate agora porque as 3 anuladas anteriores nao tinham
-- tentativa registrada. A 071 tem. Sem o filtro, marcar a questao como anulada
-- nao a tiraria do denominador — a exclusao seria so decorativa.
-- v_caderno_de_erros ja filtrava corretamente desde a 0108.
--
-- ============================================================
-- 2. A VARREDURA — RESULTADO E LIMITE DECLARADO
-- ============================================================
-- Varri as 250 questoes de Conhecimentos Especificos do Caderno_Questoes_FAFIPA
-- atras de citacao de norma (NBR / NR / Resolucao / Lei) no texto do enunciado.
--
-- LIMITE QUE INVALIDA QUALQUER LEITURA DE "ESTA LIMPO": a varredura so acha
-- questao que cita a norma POR NUMERO no enunciado. A propria 071 nao cita
-- numero nenhum e NAO teria sido pega por ela. O resultado abaixo e piso, nao
-- teto. Detectar o resto exige conferir valor a valor contra a norma vigente,
-- questao a questao — trabalho que nao foi feito.
--
-- CONFERIDO CONTRA O TEXTO VIGENTE (PDFs da pasta NBRs do usuario):
--
--   073, 187 — NR-18 areas de vivencia. Item 18.5.1 vigente lista instalacao
--     sanitaria, vestiario, local para refeicao e alojamento. "Area de lazer"
--     nao esta na lista. Gabarito segue valido. SEM PROBLEMA.
--   173 — NR-18 carpintaria. Item 18.7.3.1, alineas a e b: piso resistente,
--     nivelado e antiderrapante; cobertura contra intemperies e queda de
--     materiais. Texto literal confere. SEM PROBLEMA.
--   188 — NR-18 escavacao. Item 18.7.2.8: escavacoes acima de 1,25 m devem
--     dispor de escadas ou rampas para saida rapida. Confere. SEM PROBLEMA.
--   176 — NR-35 escada portatil. A alternativa falsa (extremidade superior
--     rente a borda) continua falsa: a escada deve ultrapassar o piso superior
--     em pelo menos 1 m (NR-18, 18.8.6.13, b). RESSALVA: o Anexo III da NR-35
--     (Escadas) ficou REVOGADO entre a Portaria MTE 3.903/2023 e a 1.680/2025,
--     e foi alterado de novo pela 1.259/2026. O enunciado atribui a NR-35 um
--     requisito que, durante parte desse periodo, ela nao estabelecia. O
--     gabarito sobrevive, a fundamentacao do enunciado nao.
--   202, 203 — ABNT NBR 13752:2024. Edicao vigente. SEM PROBLEMA.
--   151 — enunciado cita "NBR 9050:2021". Essa edicao NAO EXISTE: a vigente e
--     a NBR 9050:2015 com a Emenda 1:2020. Erro de citacao da banca. O conteudo
--     cobrado (corrimao nos dois lados) nao mudou entre as edicoes, entao o
--     gabarito E segue valido. Ele acertou. Risco baixo, fica so registrado.
--
-- NORMA SUPERADA CONFIRMADA (marcadas, mas MANTIDAS no denominador):
--
--   069, 070 — Resolucao CONFEA 1.025/2009, REVOGADA pela Resolucao CONFEA
--     1.137/2023. Diferenca em relacao a 071: aqui a questao continua tendo UMA
--     resposta determinavel (a que a banca quis), entao ela nao e anulavel —
--     ele errou as duas e o erro conta. O que muda e o VALOR DE ESTUDO: nao
--     adianta decorar os artigos da 1.025/2009. Se a FAFIPA cobrar ART em
--     06/12, a regra aplicavel e a 1.137/2023.
--
-- EM ABERTO, NAO RESOLVIDO:
--
--   192, 197 — Resolucao CONFEA 345/1990 (engenharia de avaliacoes e pericias).
--     NAO consegui determinar se esta vigente. A Resolucao CONFEA 1.146/2025
--     revogou um bloco de atos de 1990, e os trechos que consegui ler citam a
--     Resolucao 343/1990 e a Decisao Normativa 034/1990 — esta ultima com
--     ementa quase identica a da 345/1990. A lista completa do artigo revogador
--     nao abriu (legisweb retornou 429, a outra fonte veio vazia).
--     FICA COMO PENDENCIA: conferir no acervo normativo do Confea.
--     Ate la, 192 e 197 nao foram marcadas nem excluidas.
--
-- ============================================================
-- 3. QUESTAO 240 — GABARITO DETERMINADO
-- ============================================================
-- Estava "aberta" porque 'principal', 'tronco' e 'mestra' sao sinonimos na
-- bibliografia e a prova oferecia as tres. A NBR 12218:2017, lida por
-- renderizacao de pagina (o PDF e digitalizado, sem camada de texto), usa
-- "tubulacao principal" e "tubulacao secundaria" como o par normativo nos itens
-- 5.3.2 e 5.5.2. A terminologia da norma desempata: 240 -> A (Principal).
-- Confianca: media. A 240 ainda nao foi resolvida por ele; o registro vai para
-- gabaritos_determinados.json, nao para o painel.

do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_071  uuid;
  n int;
begin
  -- ---- 071: sem resposta valida sob a norma vigente ----
  select id into v_071 from public.questions
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int = 71;
  if v_071 is null then
    raise exception '0112: questao 071 do caderno nao encontrada';
  end if;

  update public.questions
     set tags = tags
       || jsonb_build_object(
            'anulada', true,
            'anulada_motivo', 'sem resposta valida sob a NBR 12218:2017. O gabarito C (300 mm) vem da NBR 12218:1994. O item 5.5.2 da edicao de 2017 exige tubulacao secundaria INDEPENDENTEMENTE do diametro da principal, o que elimina o limiar e invalida as cinco alternativas. Prova de origem de 2022, com a edicao de 2017 ja vigente.',
            'norma_superada', 'ABNT NBR 12218:1994, substituida pela NBR 12218:2017',
            'achado_por', 'usuario, 12/11/2026')
   where id = v_071;

  -- ---- 069 e 070: norma revogada, mas resposta determinavel: ficam no placar ----
  update public.questions
     set tags = tags
       || jsonb_build_object(
            'norma_superada', 'Resolucao CONFEA 1.025/2009, revogada pela Resolucao CONFEA 1.137/2023',
            'norma_superada_efeito', 'questao continua com resposta determinavel e PERMANECE no denominador. O que perde valor e o conteudo: para a prova de 06/12/2026 a regra de ART aplicavel e a 1.137/2023.')
   where user_id = v_user and tags ? 'questao_caderno'
     and (tags->>'questao_caderno')::int in (69,70);
  get diagnostics n = row_count;
  if n <> 2 then
    raise exception '0112: esperava marcar 2 questoes (069,070), marquei %', n;
  end if;

  -- ---- registro da varredura, com o limite declarado ----
  delete from public.user_parameters
   where user_id = v_user and key = 'varredura_norma_superada';

  insert into public.user_parameters(user_id, key, value)
  values (v_user, 'varredura_norma_superada', jsonb_build_object(
    'feita_em','2026-11-12',
    'escopo','250 questoes de Conhecimentos Especificos do Caderno_Questoes_FAFIPA.pdf',
    'metodo','busca por citacao de norma (NBR / NR / Resolucao / Lei) no texto do enunciado, com conferencia manual contra o texto vigente nos PDFs da pasta NBRs',
    'limite_declarado','so detecta questao que cita a norma POR NUMERO no enunciado. A propria 071 nao cita numero e nao seria encontrada por este metodo. O resultado e PISO, nao teto.',
    'sem_resposta_valida', jsonb_build_array(
      jsonb_build_object('q',71,'norma','ABNT NBR 12218:2017, item 5.5.2','efeito','excluida do placar','achado_por','usuario')),
    'norma_superada_mantidas', jsonb_build_array(
      jsonb_build_object('q',69,'norma','Res. CONFEA 1.025/2009 revogada pela 1.137/2023'),
      jsonb_build_object('q',70,'norma','Res. CONFEA 1.025/2009 revogada pela 1.137/2023')),
    'conferidas_sem_problema', jsonb_build_array(
      jsonb_build_object('q',173,'base','NR-18, 18.7.3.1 a e b'),
      jsonb_build_object('q',187,'base','NR-18, 18.5.1'),
      jsonb_build_object('q',188,'base','NR-18, 18.7.2.8'),
      jsonb_build_object('q',202,'base','NBR 13752:2024, edicao vigente'),
      jsonb_build_object('q',203,'base','NBR 13752:2024, edicao vigente')),
    'ressalvas', jsonb_build_array(
      jsonb_build_object('q',176,'nota','gabarito valido, mas o Anexo III da NR-35 (Escadas) ficou revogado entre a Portaria MTE 3.903/2023 e a 1.680/2025 e foi alterado pela 1.259/2026; o requisito sobrevive via NR-18, 18.8.6.13 b'),
      jsonb_build_object('q',151,'nota','enunciado cita NBR 9050:2021, edicao inexistente; a vigente e a 9050:2015 com Emenda 1:2020. Erro de citacao da banca, conteudo inalterado, gabarito valido')),
    'em_aberto', jsonb_build_array(
      jsonb_build_object('q',192,'duvida','Res. CONFEA 345/1990 pode ter sido revogada pela Res. 1.146/2025; lista completa do artigo revogador nao acessivel (legisweb 429)'),
      jsonb_build_object('q',197,'duvida','mesma duvida da 192'))));

  raise notice '0112: 071 anulada, 069/070 marcadas, varredura registrada';
end $$;

-- ---- v_questoes_por_unidade passa a respeitar tags.anulada ----
-- Sem isto, marcar a 071 como anulada nao a tiraria do denominador.
create or replace view public.v_questoes_por_unidade as
with pesos(unidade, nome, subitens) as (values
  ('2.1','Legislacao Municipal, Urbanistica e de Edificacoes',13),
  ('2.2','Materiais e Tecnicas de Construcao',8),
  ('2.3','Estruturas',5),
  ('2.4','Geologia, Geotecnia e Mecanica dos Solos',5),
  ('2.5','Hidrologia, Drenagem e Obras de Infraestrutura',13),
  ('2.6','Saneamento e Meio Ambiente',6),
  ('2.7','Arquitetura, Urbanismo e Acessibilidade',3),
  ('2.8','Planejamento, Orcamento e Gerenciamento de Obras',5),
  ('2.9','Patologia, Qualidade e Seguranca das Obras',5),
  ('2.10','Avaliacoes, Pericias e Documentacao Tecnica',6),
  ('2.11','Licitacoes e Contratos de Obras e Servicos de Engenharia',12)
),
tot as (select sum(subitens)::numeric s from pesos),
base as (
  select q.user_id,
         q.tags->>'unidade' as unidade,
         case when q.tags ? 'simulado' then 'simulado' else 'caderno' end as origem,
         (q.tags->>'legislacao_de_curitiba')::boolean as de_curitiba,
         count(*)::int as questoes,
         count(*) filter (where qa.is_correct)::int as acertos
    from public.questions q
    join public.question_attempts qa on qa.question_id = q.id
   where q.tags->>'unidade' <> 'ANULADA'
     and coalesce((q.tags->>'anulada')::boolean, false) = false
   group by 1,2,3,4
)
select b.user_id, b.unidade, p.nome, b.origem, b.de_curitiba,
       b.questoes, b.acertos, (b.questoes - b.acertos) as erros,
       round(100.0*b.acertos/b.questoes, 1) as pct_acerto,
       round(100.0*p.subitens/t.s, 1)       as pct_edital,
       round(30.0*p.subitens/t.s, 1)        as questoes_esperadas_prova
  from base b
  cross join tot t
  left join pesos p on p.unidade = b.unidade;

comment on view public.v_questoes_por_unidade is
'Desempenho por unidade do edital, simulado e caderno separados.
Exclui questoes anuladas pela banca (tags.anulada) e sem resposta valida sob norma
vigente (071, ver migration 0112). Antes da 0112 esta view nao filtrava anuladas.';
