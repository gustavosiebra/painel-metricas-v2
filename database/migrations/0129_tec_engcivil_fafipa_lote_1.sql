-- 0129 - TEC Concursos, caderno Engenharia Civil FAFIPA (196): lote 1 (50 resolvidas), 17/11/2026
-- AUTORIZADO pelo usuario em 17/11/2026: "coloque no painel ... faca uma analise e preencha o mapa".
-- Cria a origem 'tec' nas views (sem isso as questoes cairiam em 'caderno', o erro da 0114/0115).
do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_fafipa uuid := 'e7e5c690-d2a7-4335-b55c-2bdfff4563db';
  v_multi uuid := '7f5d84db-b2c4-4548-be17-372fea7cb07a';
  v_disc uuid := '9c5b311e-c889-4442-bb0b-1a4a9689cccb';
  v_set uuid; v_sess uuid; v_q uuid; r record; n_tot int:=0; n_ok int:=0; n_new int:=0;
begin
  if exists (select 1 from public.study_sessions where user_id=v_user and metadata->>'origem_dado'='tec_lote_1_2026-11-17') then
    raise notice '0129: ja existe'; return;
  end if;
  select id into v_set from public.question_sets where user_id=v_user and name='TEC — Engenharia Civil FAFIPA (caderno de 196)';
  if v_set is null then
    insert into public.question_sets(user_id,discipline_id,exam_id,name,source,status,learning_level,metadata)
    values (v_user,v_disc,v_exam,'TEC — Engenharia Civil FAFIPA (caderno de 196)','TEC Concursos — https://www.tecconcursos.com.br/s/Q7MvjC','ativo','novo',
      jsonb_build_object('fonte','TEC','total_questoes',196,'arquivo','FAFIPA/questoesEngCivilTec.pdf','ordenacao','por materia e assunto','observacao','questoes de varias provas FAFIPA (2015-2026), 19 do primeiro lote sao Certo/Errado'))
    returning id into v_set;
  end if;
  insert into public.study_sessions(user_id,occurred_at,exam_id,discipline_id,question_set_id,study_type,duration_minutes,notes,status,metadata,board_id)
  values (v_user,'2026-11-17 11:30:00-03',v_exam,null,v_set,'questao',85.5,$q$TEC Concursos, caderno 'Engenharia Civil - FAFIPA' (196 questoes selecionadas pelo usuario, ordenadas por materia e assunto). PRIMEIRO LOTE: 50 de 196 resolvidas, 45 acertos, 5 erros = 90,0% (Wilson 95%: 78,6 a 95,7). Tempo total gasto no TEC: 01:25:30 (85,5 min; 1 min 42 s por questao). Desempenho dos demais usuarios nessas mesmas questoes: 71,6%. Dificuldade media do caderno segundo o TEC: 27%.

LOTE = 6 assuntos COMPLETOS do caderno: Analise de Tensoes e Deformacoes 6/7 · Execucao de Estruturas de Concreto 8/8 · Instalacoes Prediais - Esgoto 7/7 · Impermeabilizacao 7/8 · Patologia e Recuperacao de Edificacoes 9/10 · ETE (NBR 12209) 8/10. Por unidade do edital: 2.3 14/15 · 2.6 15/17 · 2.2 7/8 · 2.9 9/10.

ERROS (posicao no PDF do caderno; letra marcada / gabarito): 21 Campo Largo 2020, flexao (D/B) · 97 Toledo 2016, projeto basico de impermeabilizacao, EXCETO (E/D) · 112 Arapongas 2020, desagregacao do concreto (E/B) · 137 Toledo 2016 Tecnologo em Saneamento, desidratacao do lodo (B/A) · 138 idem, mecanismo fisico no corpo receptor (C/B).

COMPOSICAO, ressalvas importantes: (1) 19 das 50 sao Certo/Errado (Londrina 2015), onde o acaso acerta 50% e nao 20%; nas 31 de multipla escolha foram 26/31 = 83,9%. (2) 18 das 50 JA estavam na base do usuario (11 em simulados 1-12/caderno, 4 nos simulados 13-15, 3 so nas provas originais); 32 nao estavam em nada. Nas 32 inéditas: 29/32. (3) 6 sao de cargo que nao e engenheiro (Operario e Tecnologo em Saneamento), 2 dos 5 erros. (4) Tempo de sessao e horario sao do usuario/estimados: a hora do dia e arbitraria; o tempo e o cumulativo do TEC. (5) Letra marcada gravada so nos erros. (6) tec_id: 5 conferidos na tela; os demais lidos por OCR do PDF, 11 sem id.

GABARITO: o do PDF do TEC (ao fim do caderno), por posicao. Conferido contra a tela do TEC nos 5 erros (5/5 iguais). Nao e o gabarito definitivo da banca; o TEC pode refletir gabarito preliminar.

PROXIMOS LOTES: o TEC mostra tempo total CUMULATIVO; registrar o lote como a diferenca (tempo novo menos 01:25:30). Registrar cada lote em sessao propria com as posicoes resolvidas.$q$,'ativo',
    jsonb_build_object('origem_dado','tec_lote_1_2026-11-17','fonte','TEC','lote',1,'hora_estimada',true,'tempo_tec_cumulativo','01:25:30','seg_por_questao',102,
      'pct_demais_usuarios',71.6,'dificuldade_tec_pct',27,'resolvidas_acumulado',50,'total_caderno',196),v_fafipa)
  returning id into v_sess;
  for r in select (e->>0)::int pos, e->>1 u, e->>2 assunto, e->>3 prova, e->>4 ano, e->>5 gab, e->>6 base, e->>7 tec_id, e->>8 idfonte, e->>9 marc
             from jsonb_array_elements($j$[[20,"2.3","Analise de Tensoes e Deformacoes","PSP (SESA PR)/SESA PR/Engenheiro Civil/2026","2026","A","seen","3937703","ocr",null],[21,"2.3","Analise de Tensoes e Deformacoes","Eng (Pref Cpo Largo)/Pref Campo Largo/Civil/2020","2020","B","seen","2165674","tela","D"],[22,"2.3","Analise de Tensoes e Deformacoes","Eng (Pref Cpo Largo)/Pref Campo Largo/Civil/2020","2020","C","provas","2165675","ocr",null],[23,"2.3","Analise de Tensoes e Deformacoes","ECiv (Pref Tibagi)/Pref Tibagi/2019","2019","D","seen",null,null,null],[24,"2.3","Analise de Tensoes e Deformacoes","Eng (Pref Toledo (PR))/Pref Toledo (PR)/Engenheiro Civil/2016","2016","D","nova","924267","ocr",null],[25,"2.3","Analise de Tensoes e Deformacoes","Eng (Pref Toledo (PR))/Pref Toledo (PR)/Engenheiro Civil/2016","2016","A","nova","924268","ocr",null],[26,"2.3","Analise de Tensoes e Deformacoes","Eng (Pref Toledo (PR))/Pref Toledo (PR)/Engenheiro Civil/2016","2016","C","nova","924276","ocr",null],[31,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","AGP (Londrina)/Pref Londrina/Operario/2015","2015","Certo","nova","3080009","ocr",null],[32,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084020","ocr",null],[33,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084042","ocr",null],[34,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084043","ocr",null],[35,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova",null,null,null],[36,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084048","ocr",null],[37,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084049","ocr",null],[38,"2.3","Execucao de Estruturas de Concreto (Transporte, Lancamento, Adensamento, Cura)","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084050","ocr",null],[83,"2.6","Instalacoes Prediais - Esgoto","ECiv (Medianeira)/Pref Medianeira/2021","2021","D","seen","2164407","ocr",null],[84,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084078","ocr",null],[85,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084083","ocr",null],[86,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084085","ocr",null],[87,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084086","ocr",null],[88,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084088","ocr",null],[89,"2.6","Instalacoes Prediais - Esgoto","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084089","ocr",null],[95,"2.2","Impermeabilizacao","Eng Civ (Pref Marialva)/Pref Marialva/2026","2026","D","seen","4285228","ocr",null],[96,"2.2","Impermeabilizacao","Eng (Pref Toledo (PR))/Pref Toledo (PR)/Engenheiro Civil/2016","2016","A","nova","924278","ocr",null],[97,"2.2","Impermeabilizacao","Eng (Pref Toledo (PR))/Pref Toledo (PR)/Engenheiro Civil/2016","2016","D","nova","924279","tela","E"],[98,"2.2","Impermeabilizacao","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084093","ocr",null],[99,"2.2","Impermeabilizacao","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084095","ocr",null],[100,"2.2","Impermeabilizacao","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Certo","nova","3084098","ocr",null],[101,"2.2","Impermeabilizacao","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084101","ocr",null],[102,"2.2","Impermeabilizacao","GEA (Londrina)/Pref Londrina/Servicos de Engenharia Civil/2015","2015","Errado","nova","3084103","ocr",null],[106,"2.9","Patologia e Recuperacao de Edificacoes","ECiv (CM SJ Pinhais)/CM SJ dos Pinhais/2023","2023","B","nova","3680517","ocr",null],[107,"2.9","Patologia e Recuperacao de Edificacoes","ECiv (Medianeira)/Pref Medianeira/2021","2021","C","seen",null,null,null],[108,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","D","sched",null,null,null],[109,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","C","sched","1294983","ocr",null],[110,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","A","seen",null,null,null],[111,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","D","seen","1294988","ocr",null],[112,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","B","sched","1294989","tela","E"],[113,"2.9","Patologia e Recuperacao de Edificacoes","ECiv (Gdes Rios)/Pref Grandes Rios/2020","2020","A","seen",null,null,null],[114,"2.9","Patologia e Recuperacao de Edificacoes","ECiv (Gdes Rios)/Pref Grandes Rios/2020","2020","D","seen",null,null,null],[115,"2.9","Patologia e Recuperacao de Edificacoes","Eng (Pref Cpo Largo)/Pref Campo Largo/Civil/2020","2020","C","provas",null,null,null],[129,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","Eng Civ (Pref Marialva)/Pref Marialva/2026","2026","D","seen",null,null,null],[130,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","Eng Civ (CISPAR)/CISPAR/2024","2024","A","nova","3025586","ocr",null],[131,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","Eng Civ (CISPAR)/CISPAR/2024","2024","A","nova","3025589","ocr",null],[132,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","Eng (Pref Arapongas)/Pref Arapongas/Civil/2020","2020","D","sched",null,null,null],[133,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","Eng (Pref Cpo Largo)/Pref Campo Largo/Civil/2020","2020","D","provas",null,null,null],[134,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","TSan (Pref Toledo (PR))/Pref Toledo (PR)/2016","2016","C","nova","924918","ocr",null],[135,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","TSan (Pref Toledo (PR))/Pref Toledo (PR)/2016","2016","E","nova","924920","ocr",null],[136,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","TSan (Pref Toledo (PR))/Pref Toledo (PR)/2016","2016","C","nova","924921","ocr",null],[137,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","TSan (Pref Toledo (PR))/Pref Toledo (PR)/2016","2016","A","nova","924922","tela","B"],[138,"2.6","Estacao de Tratamento de Esgoto - ETE (NBR 12209)","TSan (Pref Toledo (PR))/Pref Toledo (PR)/2016","2016","B","nova","924923","tela","C"]]$j$::jsonb) e order by 1
  loop
    insert into public.questions(user_id,question_set_id,external_id,year,tags)
    values (v_user,v_set,'TEC196-'||lpad(r.pos::text,3,'0'),nullif(r.ano,'')::int,
      jsonb_strip_nulls(jsonb_build_object('fonte','TEC','banca','FAFIPA','unidade',r.u,'assunto_tec',r.assunto,'questao_tec',r.pos,
        'tec_id',r.tec_id,'tec_id_fonte',r.idfonte,'prova_origem',r.prova,'gabarito',r.gab,
        'gabarito_fonte','TEC: gabarito do PDF do caderno (por posicao), conferido na tela do TEC nos 5 erros (5/5); nao e o definitivo da banca',
        'na_base',r.base,'formato',case when r.gab in ('Certo','Errado') then 'certo_errado' else 'multipla_escolha' end,
        'cargo_nao_engenheiro',(r.prova ~ 'TSan|AGP|Apont|Ag End|FOP|ADC') or null,'marcada',r.marc)))
    returning id into v_q;
    insert into public.question_attempts(user_id,question_id,session_id,attempted_at,is_correct,contact_type)
    values (v_user,v_q,v_sess,'2026-11-17 11:30:00-03',(r.marc is null),'primeira_tentativa');
    n_tot:=n_tot+1; if r.marc is null then n_ok:=n_ok+1; end if; if r.base<>'seen' then n_new:=n_new+1; end if;
  end loop;
  if n_tot<>50 or n_ok<>45 then raise exception '0129: esperava 50/45, obtive %/%',n_tot,n_ok; end if;
  insert into public.session_results(user_id,session_id,questions_total,correct_total,wrong_total,new_questions,review_questions,score,score_is_estimate,metadata)
  values (v_user,v_sess,50,45,5,n_new,50-n_new,null,false,
    jsonb_build_object('por_assunto',jsonb_build_object('Analise de Tensoes e Deformacoes','6/7','Execucao de Estruturas de Concreto','8/8','Instalacoes Prediais - Esgoto','7/7','Impermeabilizacao','7/8','Patologia e Recuperacao de Edificacoes','9/10','ETE (NBR 12209)','8/10'),
      'new_questions_criterio','nao estava nos simulados 1-12 nem no caderno (seen); 4 estao nos simulados 13-15 e 3 so nas provas originais, contam como novas'));
  insert into public.study_session_boards(user_id,session_id,board_id) values (v_user,v_sess,v_fafipa),(v_user,v_sess,v_multi);
  raise notice '0129: sessao %, 50 questoes, 45 acertos, % novas',v_sess,n_new;
end $$;

create or replace view public.v_caderno_de_erros as
select q.user_id,
       case when q.tags->>'banca'='SENSEI' then 'sensei'
            when q.tags->>'fonte'='TEC' then 'tec'
            when q.tags ? 'simulado' then 'simulado' else 'caderno' end as origem,
       (q.tags->>'simulado')::int as simulado,
       (q.tags->>'questao_caderno')::int as questao_caderno,
       (q.tags->>'questao_sensei')::int as questao_sensei,
       coalesce((q.tags->>'questao')::int,(q.tags->>'questao_caderno')::int,(q.tags->>'questao_sensei')::int,(q.tags->>'questao_tec')::int) as questao,
       q.tags->>'unidade' as unidade, q.tags->>'prova_origem' as prova_origem, q.tags->>'questao_origem' as questao_na_prova,
       coalesce(q.tags->>'gabarito',q.tags->>'gabarito_determinado') as gabarito,
       q.tags->>'marcada' as marcou, (q.tags ? 'marcada') as tem_letra_marcada,
       (q.tags->>'legislacao_de_curitiba')::boolean as vale_para_curitiba, q.tags->>'gabarito_fonte' as gabarito_fonte,
       qa.attempted_at::date as feito_em, q.id as question_id, qa.session_id,
       (q.tags->>'questao_tec')::int as questao_tec, q.tags->>'na_base' as na_base
  from public.questions q join public.question_attempts qa on qa.question_id=q.id
 where not qa.is_correct and q.tags->>'unidade'<>'ANULADA' and coalesce((q.tags->>'anulada')::boolean,false)=false;

create or replace view public.v_questoes_por_unidade as
with pesos(unidade,nome,subitens) as (values
 ('2.1','Legislacao Municipal, Urbanistica e de Edificacoes',13),('2.2','Materiais e Tecnicas de Construcao',8),('2.3','Estruturas',5),
 ('2.4','Geologia, Geotecnia e Mecanica dos Solos',5),('2.5','Hidrologia, Drenagem e Obras de Infraestrutura',13),('2.6','Saneamento e Meio Ambiente',6),
 ('2.7','Arquitetura, Urbanismo e Acessibilidade',3),('2.8','Planejamento, Orcamento e Gerenciamento de Obras',5),('2.9','Patologia, Qualidade e Seguranca das Obras',5),
 ('2.10','Avaliacoes, Pericias e Documentacao Tecnica',6),('2.11','Licitacoes e Contratos de Obras e Servicos de Engenharia',12)),
tot as (select sum(subitens)::numeric s from pesos),
base as (
 select q.user_id,q.tags->>'unidade' as unidade,
        case when q.tags->>'banca'='SENSEI' then 'sensei' when q.tags->>'fonte'='TEC' then 'tec' when q.tags ? 'simulado' then 'simulado' else 'caderno' end as origem,
        (q.tags->>'legislacao_de_curitiba')::boolean as de_curitiba,
        count(*)::int as questoes, count(*) filter (where qa.is_correct)::int as acertos
   from public.questions q join public.question_attempts qa on qa.question_id=q.id
  where q.tags->>'unidade'<>'ANULADA' and coalesce((q.tags->>'anulada')::boolean,false)=false
  group by 1,2,3,4)
select b.user_id,b.unidade,p.nome,b.origem,b.de_curitiba,b.questoes,b.acertos,(b.questoes-b.acertos) as erros,
       round(100.0*b.acertos/b.questoes,1) as pct_acerto,round(100.0*p.subitens/t.s,1) as pct_edital,round(30.0*p.subitens/t.s,1) as questoes_esperadas_prova
  from base b cross join tot t left join pesos p on p.unidade=b.unidade;

create or replace view public.v_tec_questoes as
select q.user_id,qa.session_id,s.occurred_at,(q.tags->>'questao_tec')::int as posicao,q.tags->>'tec_id' as tec_id,q.tags->>'tec_id_fonte' as tec_id_fonte,
       q.tags->>'unidade' as unidade,q.tags->>'assunto_tec' as assunto,q.tags->>'prova_origem' as prova,q.year as ano,
       q.tags->>'formato' as formato,q.tags->>'na_base' as na_base,(q.tags ? 'cargo_nao_engenheiro') as cargo_nao_engenheiro,
       q.tags->>'gabarito' as gabarito,q.tags->>'marcada' as marcou,qa.is_correct as acertou
  from public.questions q join public.question_attempts qa on qa.question_id=q.id join public.study_sessions s on s.id=qa.session_id
 where q.tags->>'fonte'='TEC';

create or replace view public.v_tec_resumo as
select user_id,unidade,assunto,count(*) as questoes,count(*) filter (where acertou) as acertos,round(100.0*count(*) filter (where acertou)/count(*),1) as pct_acerto,
       count(*) filter (where na_base='seen') as ja_vistas,count(*) filter (where formato='certo_errado') as certo_errado
  from public.v_tec_questoes group by user_id,unidade,assunto;
