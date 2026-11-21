-- 0125 - Correcao do gabarito da questao 210 do caderno FAFIPA (D -> B)
-- Causa: meu leitor varreu o PDF inteiro e pegou a matriz da q515 (pag 229, "210 5 60 D C D C").
-- Correto: B (pag 326; Decreto 10.947/2022 art. 2o V, "consolida"). O usuario marcou B: acerto.
-- Efeito: bloco 189-250 46/61 -> 47/61 (75,4 -> 77,0); erros 187 -> 186; 2.11 caderno 13/16 -> 14/16.
-- Unica divergencia entre 193 gabaritos do caderno reconferidos so nas paginas de gabarito.
-- Aplicada via apply_migration com guardas (1 questao, 1 tentativa, 1 session_results).
update public.questions set tags = tags || jsonb_build_object('gabarito','B','gabarito_corrigido_por','migration 0125')
 where (tags->>'questao_caderno')='210' and tags->>'gabarito'='D' and tags->>'marcada'='B';
update public.question_attempts qa set is_correct=true from public.questions q
 where q.id=qa.question_id and (q.tags->>'questao_caderno')='210' and qa.is_correct=false;
update public.session_results set correct_total=47, wrong_total=14, score=77.00
 where id='1b3eb2e6-db95-4fcf-9c84-704c64ee67f5' and correct_total=46 and wrong_total=15;
