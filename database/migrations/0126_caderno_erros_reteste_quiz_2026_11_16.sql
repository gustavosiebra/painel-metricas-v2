-- 0126 - Caderno de erros: 1o reteste pelo quiz HTML (16/11/2026)
do $$
declare
  v_user uuid := 'b0d56062-0a37-48de-ae34-5aa79be0aa2a';
  v_exam uuid := '8dfb6aba-99fa-4513-8e23-1fb3d60fe68d';
  v_fafipa uuid := 'e7e5c690-d2a7-4335-b55c-2bdfff4563db';
  v_multi uuid := '7f5d84db-b2c4-4548-be17-372fea7cb07a';
  v_sess uuid;
begin
  if exists (select 1 from public.study_sessions where user_id=v_user and metadata->>'origem_dado'='quiz_erros_2026-11-16.json') then
    raise notice '0126: ja existe'; return;
  end if;
  insert into public.study_sessions(user_id,occurred_at,exam_id,discipline_id,question_set_id,study_type,duration_minutes,notes,metadata,board_id)
  values (v_user,'2026-11-16 15:00:00+00',v_exam,null,null,'caderno_erros',41,$q$CADERNO DE ERROS - 1o RETESTE (quiz em HTML, 16/11/2026). Composicao: SOMENTE questoes que errei antes (caderno FAFIPA, simulados 1-12 e Sensei 01), sem questao nova. Unidades 2.1, 2.2 e 2.5. 53 respondidas em 41 min (2.456 s ate a confirmacao; 46 s/questao).

PLACAR: 43 acertos / 9 erros em 52 questoes pontuaveis = 82,7%. A C013 (caderno q.13, Grandes Rios, Alvara de Aprovacao) ficou FORA do placar: o gabarito A foi determinado por mim (confianca media), a banca nao publicou e a Lei 1.206/2021 de Grandes Rios nao usa essa expressao. Se contasse como erro: 43/53 = 81,1%. Gabarito do Sensei validado pelo usuario (24 = D, 27 = C inferidos da resposta de hoje, que o usuario confirmou como acerto).

REINCIDENCIA (errou de novo): 9 de 52 = 17,3%. Referencia: 17 de 113 = 15,0% no caderno de 20/10 (composicao e conteudo diferentes, nao comparavel como tendencia; n pequeno).

POR UNIDADE: 2.1 Legislacao municipal/urbanistica 20/28 (71,4%) · 2.2 Materiais e tecnicas 20/21 (95,2%) · 2.5 Hidrologia/drenagem 3/3.
POR ORIGEM: caderno 21/27 · simulados 18/21 · Sensei 4/4.

ERROS: C039 (Maria Helena, estatuto), C054 e C055 (Cruz Machado, LOM e estatuto), C218 (Mercedes, codigo de obras) = lei de OUTRO municipio, nao pesam em Curitiba. Uteis: S01 q16 (Lei 6.766 art. 3o p.u. III, declividade >= 30%: parcelamento condicionado a exigencias especificas das autoridades, nao vedacao absoluta), C093 (vermiculita expandida reduz condutividade termica), C156 (conclusao/vistoria/entrega de obra), S01 q39 e S08 q33 (conferir na legislacao urbanistica de Curitiba; nao verificado). C156 e C218 repetiram a mesma letra errada da prova.

RESSALVAS: (1) sao questoes ja vistas: 9 acertos em menos de 20 s indicam reconhecimento/memoria, nao necessariamente dominio; em 34 acertos a letra marcada na prova era outra (houve revisao real da resposta; nos demais a letra da prova nao esta registrada). (2) tempo mede ate a confirmacao; revisao posterior nao entra. (3) alternativas tachadas em 8 respostas; nenhuma tachou a correta (sem erro de eliminacao). (4) nao gravado em question_attempts de proposito: duplicaria as contagens por unidade e o caderno de erros; o detalhe por questao esta em metadata.resultados.

PROXIMOS RETESTES SUGERIDOS: 19/11, 25/11 e 02/12 (prova 06/12/2026). Hora do registro estimada.$q$,$q${"origem_dado":"quiz_erros_2026-11-16.json","ferramenta":"Quiz_Erros.html","rodada":1,"ordem":"sequencia","hora_estimada":true,"colunas_resultados":["id","unidade","marcou","gabarito","1=acerto 0=erro -1=sem gabarito","segundos","n_alternativas_tachadas"],"resultados":[["C002","2.1","D","D",1,50,0],["C006","2.1","B","B",1,32,0],["C007","2.1","B","B",1,134,0],["C013","2.1","C","A",0,15,0],["C016","2.1","B","B",1,35,0],["C031","2.1","A","A",1,63,0],["C032","2.1","A","A",1,51,0],["C033","2.1","D","D",1,81,0],["C039","2.1","E","D",0,56,0],["C047","2.1","A","A",1,39,0],["C054","2.1","A","C",0,61,0],["C055","2.1","D","C",0,78,0],["C060","2.1","C","C",1,57,0],["C061","2.1","D","D",1,56,0],["C077","2.1","C","C",1,16,0],["C152","2.1","C","C",1,22,0],["C156","2.1","A","B",0,131,0],["C218","2.1","A","C",0,67,0],["C234","2.1","B","B",1,15,0],["S01Q16","2.1","C","A",0,25,0],["S01Q29","2.1","C","C",1,36,0],["S01Q39","2.1","B","A",0,24,0],["S02Q19","2.1","D","D",1,96,0],["S07Q23","2.1","C","C",1,41,0],["S08Q33","2.1","E","C",0,94,0],["S12Q21","2.1","B","B",1,172,2],["S12Q39","2.1","A","A",1,37,0],["SE24","2.1","D","D",1,52,0],["SE27","2.1","C","C",1,27,0],["S01Q27","2.5","B","B",1,42,0],["SE32","2.5","C","C",1,30,4],["SE33","2.5","C","C",1,71,4],["C062","2.2","A","A",1,22,0],["C063","2.2","B","B",1,51,1],["C064","2.2","C","C",1,16,0],["C072","2.2","D","D",1,15,0],["C073","2.2","C","C",1,38,0],["C078","2.2","E","E",1,14,0],["C083","2.2","A","A",1,46,3],["C087","2.2","C","C",1,45,0],["C093","2.2","A","E",0,34,0],["S02Q16","2.2","C","C",1,24,0],["S02Q23","2.2","A","A",1,9,0],["S02Q29","2.2","D","D",1,51,3],["S03Q16","2.2","B","B",1,18,0],["S03Q24","2.2","D","D",1,10,0],["S04Q31","2.2","A","A",1,30,0],["S05Q38","2.2","B","B",1,27,0],["S06Q23","2.2","D","D",1,13,0],["S07Q29","2.2","D","D",1,52,3],["S09Q40","2.2","E","E",1,61,0],["S11Q28","2.2","C","C",1,34,0],["S12Q27","2.2","B","B",1,40,4]]}$q$::jsonb,v_fafipa)
  returning id into v_sess;
  insert into public.session_results(user_id,session_id,questions_total,correct_total,wrong_total,new_questions,review_questions,score,score_is_estimate,metadata)
  values (v_user,v_sess,52,43,9,0,52,null,false,'{"fora_do_placar":["C013"],"respondidas":53}'::jsonb);
  insert into public.study_session_boards(user_id,session_id,board_id) values (v_user,v_sess,v_fafipa),(v_user,v_sess,v_multi);
  raise notice '0126: sessao %', v_sess;
end $$;
