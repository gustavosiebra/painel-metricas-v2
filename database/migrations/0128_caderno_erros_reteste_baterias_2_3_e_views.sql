-- 0128 - Caderno de erros: baterias 2 e 3 do reteste (16/11/2026) + views de consulta
do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_fafipa uuid := 'e7e5c690-d2a7-4335-b55c-2bdfff4563db';
  v_multi uuid := '7f5d84db-b2c4-4548-be17-372fea7cb07a';
  v_s2 uuid; v_s3 uuid; n int;
begin
  if exists (select 1 from public.study_sessions where user_id=v_user and metadata->>'origem_dado'='quiz_erros_2026-11-16 (2).json') then
    raise notice '0128: ja existe'; return;
  end if;
  update public.study_sessions set occurred_at='2026-11-16T18:24:54.267000+00',
     metadata = metadata || '{"hora_estimada":false,"bateria":1,"hora_nota":"horario reconstruido: carimbo da 1a resposta menos o tempo dela"}'::jsonb
   where user_id=v_user and metadata->>'origem_dado'='quiz_erros_2026-11-16.json';
  get diagnostics n=row_count; if n<>1 then raise exception '0128: bateria 1 nao encontrada'; end if;

  insert into public.study_sessions(user_id,occurred_at,exam_id,discipline_id,question_set_id,study_type,duration_minutes,notes,metadata,board_id)
  values (v_user,'2026-11-16T21:36:52.298000+00',v_exam,null,null,'caderno_erros',34,$q$CADERNO DE ERROS - 1o RETESTE, BATERIA 2 (quiz em HTML, 16/11/2026). Composicao: SOMENTE questoes que errei antes, sem questao nova. Unidades 2.6, 2.7, 2.10 e 2.11. 63 respondidas em 34 min (33 s/questao).

PLACAR: 58 acertos / 5 erros = 92,1%. POR UNIDADE: 2.6 25/25 · 2.7 10/13 · 2.10 12/13 · 2.11 11/12.
REINCIDENCIA: 5 de 63 = 7,9%.
ERROS: S05 q39 e S09 q25 (NBR 15575: item que troca definicao; 'as built' e do FINAL da obra; metodo de avaliacao x especificacoes) · S10 q37 (NBR 9050:2020 3.1.25, linha-guia; tachou a correta) · S04 q27 (Res. CONFEA 1.002/2002: art. 10 e vedacao, sigilo e dever art. 9o III b; gabarito ajustado para A, banca publicou C preliminar) · S03 q28 (plano de contratacoes: questao 'NAO e objetivo').
RESSALVAS: 23 dos acertos levaram menos de 20 s (reconhecimento/memoria); acerto em 2.6 de 25/25 a 22 s/questao nao mede dominio. Detalhe por questao em metadata.resultados.$q$,$q${"origem_dado":"quiz_erros_2026-11-16 (2).json","ferramenta":"Quiz_Erros.html","rodada":1,"bateria":2,"ordem":"sequencia","hora_estimada":false,"colunas_resultados":["id","unidade","marcou","gabarito","1=acerto 0=erro -1=sem gabarito","segundos","n_alternativas_tachadas"],"resultados":[["C131","2.6","A","A",1,14,0],["C133","2.6","A","A",1,28,0],["C136","2.6","C","C",1,7,0],["C137","2.6","B","B",1,7,0],["C141","2.6","B","B",1,12,0],["C146","2.6","D","D",1,34,0],["C147","2.6","C","C",1,13,0],["C148","2.6","A","A",1,18,0],["C226","2.6","B","B",1,24,0],["C228","2.6","C","C",1,28,0],["C242","2.6","A","A",1,29,0],["S03Q26","2.6","A","A",1,10,0],["S03Q31","2.6","D","D",1,27,0],["S04Q32","2.6","B","B",1,17,0],["S04Q34","2.6","C","C",1,19,0],["S05Q22","2.6","D","D",1,42,0],["S06Q21","2.6","A","A",1,15,0],["S06Q26","2.6","A","A",1,12,0],["S06Q34","2.6","C","C",1,19,0],["S07Q17","2.6","B","B",1,40,0],["S07Q26","2.6","D","D",1,10,0],["S08Q11","2.6","C","C",1,36,0],["S11Q14","2.6","E","E",1,37,4],["S12Q32","2.6","A","A",1,28,0],["SE31","2.6","B","B",1,17,0],["S02Q12","2.7","C","C",1,55,0],["S03Q30","2.7","D","D",1,7,0],["S04Q29","2.7","E","E",1,8,0],["S05Q23","2.7","B","B",1,16,0],["S05Q28","2.7","B","B",1,6,0],["S05Q39","2.7","A","E",0,42,0],["S08Q18","2.7","D","D",1,14,0],["S09Q25","2.7","B","D",0,59,0],["S10Q14","2.7","C","C",1,25,0],["S10Q37","2.7","E","D",0,35,4],["S11Q11","2.7","D","D",1,49,3],["S11Q12","2.7","E","E",1,39,0],["S11Q25","2.7","D","D",1,49,2],["C069","2.10","B","B",1,20,0],["C070","2.10","A","A",1,80,0],["C194","2.10","D","D",1,10,0],["C197","2.10","B","B",1,45,0],["C198","2.10","B","B",1,14,0],["C238","2.10","B","B",1,27,0],["C248","2.10","D","D",1,26,0],["S02Q36","2.10","A","A",1,56,0],["S03Q19","2.10","E","E",1,20,0],["S04Q27","2.10","D","A",0,147,2],["S05Q27","2.10","A","A",1,67,0],["S06Q39","2.10","B","B",1,75,0],["S10Q28","2.10","A","A",1,29,0],["C214","2.11","B","B",1,19,0],["C216","2.11","D","D",1,5,0],["S03Q14","2.11","C","C",1,26,4],["S03Q28","2.11","C","A",0,80,0],["S07Q24","2.11","D","D",1,28,1],["S07Q38","2.11","E","E",1,50,3],["S08Q15","2.11","C","C",1,48,2],["S08Q25","2.11","C","C",1,75,0],["S08Q36","2.11","C","C",1,82,2],["S09Q35","2.11","C","C",1,24,2],["S11Q26","2.11","A","A",1,24,0],["S12Q13","2.11","D","D",1,27,3]]}$q$::jsonb,v_fafipa) returning id into v_s2;
  insert into public.session_results(user_id,session_id,questions_total,correct_total,wrong_total,new_questions,review_questions,score,score_is_estimate,metadata)
  values (v_user,v_s2,63,58,5,0,63,null,false,'{"bateria":2}'::jsonb);
  insert into public.study_session_boards(user_id,session_id,board_id) values (v_user,v_s2,v_fafipa),(v_user,v_s2,v_multi);

  insert into public.study_sessions(user_id,occurred_at,exam_id,discipline_id,question_set_id,study_type,duration_minutes,notes,metadata,board_id)
  values (v_user,'2026-11-16T22:30:09.843000+00',v_exam,null,null,'caderno_erros',61,$q$CADERNO DE ERROS - 1o RETESTE, BATERIA 3 (quiz em HTML, 16/11/2026). Composicao: SOMENTE questoes que errei antes, sem questao nova. Unidades 2.3, 2.4, 2.8, 2.9, Lingua Portuguesa, Informatica, IND (instalacoes eletricas) e FORA (3 de regime de pessoal). 67 respondidas em 61 min (55 s/questao; LP levou 161 s/questao).

PLACAR: 56 acertos / 11 erros = 83,6%. POR UNIDADE: 2.3 13/14 · 2.4 11/13 · 2.8 3/4 · 2.9 15/15 · LP 7/10 · INF 4/6 · IND 2/2 · FORA 1/3.
REINCIDENCIA: 11 de 67 = 16,4%.
ERROS: S10 q40 (madeira, incendio; tachou a correta) · S01 q26 e S09 q17 (NBR 6122:2022: bloco de coroamento transfere para fundacao PROFUNDA; forca resistente de calculo 3.26) · C168 (Mercedes) e C109/C110 (Douradina): lei de outro municipio/regime de pessoal, nao pesam em Curitiba · S03 q7 e S04 q6 (Informatica: colar especial; Sensor de Armazenamento do Windows 11) · S01 q4, S01 q5 e S06 q1 (Lingua Portuguesa: pontuacao, analise sintatica, ideia principal).
Fora desta bateria: S01 q9, C201 e C230 (FORA do edital) nao foram refeitas.
RESSALVAS: sao questoes ja vistas; 54 das 183 respostas do conjunto levaram menos de 20 s e so 1 errou, enquanto 25 de 129 respostas a partir de 20 s erraram; tachou a alternativa correta em S10 q40, S03 q7 e S01 q4. Detalhe por questao em metadata.resultados.$q$,$q${"origem_dado":"quiz_erros_2026-11-16 (2).json","ferramenta":"Quiz_Erros.html","rodada":1,"bateria":3,"ordem":"sequencia","hora_estimada":false,"colunas_resultados":["id","unidade","marcou","gabarito","1=acerto 0=erro -1=sem gabarito","segundos","n_alternativas_tachadas"],"resultados":[["C094","2.3","C","C",1,23,0],["C099","2.3","B","B",1,8,0],["S01Q37","2.3","A","A",1,14,0],["S02Q33","2.3","C","C",1,6,0],["S06Q17","2.3","E","E",1,6,0],["S08Q22","2.3","D","D",1,23,0],["S08Q27","2.3","B","B",1,76,0],["S08Q38","2.3","B","B",1,17,0],["S09Q30","2.3","A","A",1,90,0],["S10Q40","2.3","B","C",0,79,4],["S11Q23","2.3","D","D",1,15,0],["S11Q32","2.3","C","C",1,31,0],["S11Q34","2.3","E","E",1,21,0],["SE16","2.3","D","D",1,10,0],["C102","2.4","E","E",1,78,3],["C103","2.4","C","C",1,16,0],["C109","FORA","E","C",0,35,0],["C110","FORA","D","C",0,105,3],["C113","2.4","D","D",1,38,0],["C115","FORA","A","A",1,35,0],["S01Q26","2.4","B","A",0,50,0],["S06Q24","2.4","B","B",1,9,0],["S07Q19","2.4","D","D",1,19,0],["S07Q36","2.4","C","C",1,22,0],["S09Q17","2.4","B","D",0,92,3],["S09Q29","2.4","B","B",1,37,4],["S10Q20","2.4","C","C",1,26,1],["S10Q39","2.4","A","A",1,34,0],["S11Q40","2.4","D","D",1,53,0],["SE22","2.4","C","C",1,17,0],["C166","2.8","B","B",1,13,0],["C168","2.8","A","D",0,34,0],["S08Q31","2.8","D","D",1,28,0],["S11Q20","2.8","E","E",1,81,2],["C182","2.9","A","A",1,79,3],["C184","2.9","A","A",1,9,0],["C187","2.9","A","A",1,5,0],["S01Q34","2.9","A","A",1,46,3],["S02Q34","2.9","A","A",1,14,0],["S04Q17","2.9","D","D",1,8,0],["S06Q14","2.9","E","E",1,14,0],["S06Q37","2.9","C","C",1,34,0],["S07Q15","2.9","A","A",1,20,0],["S07Q37","2.9","A","A",1,42,0],["S08Q17","2.9","E","E",1,24,4],["S09Q18","2.9","D","D",1,25,4],["S09Q31","2.9","E","E",1,25,4],["S12Q15","2.9","B","B",1,152,0],["S08Q04","IND","C","C",1,81,0],["SE20","IND","C","C",1,12,0],["S02Q07","1.2.4","E","E",1,8,0],["S03Q07","1.2.4","A","D",0,47,4],["S04Q06","1.2.7","E","D",0,34,3],["S04Q07","1.2.9","C","C",1,105,4],["S07Q08","1.2.11","D","D",1,21,1],["S10Q08","1.2.6","D","D",1,18,0],["S01Q04","1.1.10","E","A",0,195,3],["S01Q05","1.1.8","C","D",0,285,2],["S04Q04","1.1.8","B","B",1,123,1],["S05Q04","1.1.3","B","B",1,21,3],["S05Q05","1.1.8","C","C",1,67,0],["S06Q01","1.1.1","B","A",0,139,2],["S06Q03","1.1.8","B","B",1,42,0],["S07Q05","1.1.12","B","B",1,358,0],["S11Q04","1.1.8","D","D",1,90,3],["S12Q04","1.1.8","A","A",1,290,2],["C178","2.9","A","A",1,8,0]]}$q$::jsonb,v_fafipa) returning id into v_s3;
  insert into public.session_results(user_id,session_id,questions_total,correct_total,wrong_total,new_questions,review_questions,score,score_is_estimate,metadata)
  values (v_user,v_s3,67,56,11,0,67,null,false,'{"bateria":3}'::jsonb);
  insert into public.study_session_boards(user_id,session_id,board_id) values (v_user,v_s3,v_fafipa),(v_user,v_s3,v_multi);
end $$;

create or replace view public.v_reteste_questoes as
select s.user_id, s.id as session_id, s.occurred_at, (s.metadata->>'bateria')::int as bateria,
       r.value->>0 as questao, r.value->>1 as unidade,
       case when r.value->>1 in ('2.1','2.11') then 'legislacao'
            when r.value->>1 like '1.1%' then 'lingua_portuguesa'
            when r.value->>1 like '1.2%' then 'informatica'
            when r.value->>1 = 'FORA' then 'fora_do_edital'
            else 'tecnica' end as natureza,
       r.value->>2 as marcou, r.value->>3 as gabarito,
       (r.value->>4)::int = 1 as acertou, (r.value->>5)::int as segundos, (r.value->>6)::int as n_tachadas,
       coalesce((res.metadata->'fora_do_placar') @> to_jsonb(r.value->>0), false) as fora_do_placar
  from public.study_sessions s
  join public.session_results res on res.session_id = s.id
  cross join lateral jsonb_array_elements(s.metadata->'resultados') as r(value)
 where s.metadata->>'origem_dado' like 'quiz_erros%';
comment on view public.v_reteste_questoes is
'Uma linha por questao refeita no quiz de erros. natureza: legislacao = unidades 2.1 e 2.11; 2.10 conta como tecnica (mistura etica/pericia). Regra editavel aqui.';

create or replace view public.v_reteste_resumo as
select user_id, natureza, unidade, count(*) as questoes, count(*) filter (where acertou) as acertos,
       round(100.0*count(*) filter (where acertou)/count(*),1) as pct_acerto, round(avg(segundos)) as seg_medio
  from public.v_reteste_questoes where not fora_do_placar group by user_id, natureza, unidade;
