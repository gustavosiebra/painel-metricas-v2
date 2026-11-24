-- 0137 - Resultado oficial de Santos/IBAM (Engenheiro Civil) em cima da tentativa de 21/10 (migration 0050)
--
-- FONTE: Edital 171/2026-SEPLA-RH (notas da prova objetiva, 24/11/2026) e Edital 170/2026 (resultado dos recursos).
-- Somente agregados; nomes e numeros de inscricao NAO sao gravados. Detalhes em FAFIPA/_mapa/santos_ibam_eng_civil.json.
-- A tentativa continua sendo SIMULADO (resolvida fora do certame, 90 de 210 min, sem fiscalizacao); a migration so
-- acrescenta o contexto oficial. Nao altera acertos nem placar por bloco.
-- RESSALVA: nao verificado se o gabarito preliminar usado em 21/10 ja incluia as alteracoes do Edital 153/2026 (20/10).

do $$
declare
  v_sess uuid := 'c69afcb2-f7e8-4146-b40a-b27fd367a1c5';
  v_msg  text;
  n int;
begin
  v_msg := E'\n\nRESULTADO OFICIAL (Edital 171/2026, 24/11/2026; agregados, sem nomes): Engenheiro Civil, 1.459 inscritos, 448 ausentes (30,7%), 1.010 presentes com nota. Media 77,52; mediana 80,0; DP 12,32; max 98. Corte de 50%: 97,2% dos presentes passaram. Habilitados para titulos: 60 da lista geral (nota minima 93 com empatados) e 12 da lista de negros (nota minima 90). Sua nota simulada de 84 pontos ficaria entre a 342a e a 373a posicao dos 1.010 presentes (cerca do percentil 63), sem contar o efeito de ter feito fora do certame. Gabarito: o Edital 170/2026 nao defere recurso nem altera/anula questao de Engenheiro Civil; as notas oficiais usam as alteracoes do Edital 153/2026 (20/10), e nao foi verificado se o gabarito preliminar usado em 21/10 ja as incluia.';

  update public.exam_attempts set notes = coalesce(notes,'') || v_msg where session_id = v_sess;
  get diagnostics n = row_count;
  if n <> 1 then raise exception '0137: esperava 1 tentativa, atualizei %', n; end if;

  update public.study_sessions
     set metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
       'resultado_oficial', jsonb_build_object(
         'fonte','Edital 171/2026-SEPLA-RH, 24/11/2026',
         'presentes',1010,'inscritos',1459,'ausentes',448,
         'media',77.52,'mediana',80.0,'dp',12.32,
         'corte_titulos_lista_geral',93,'corte_titulos_lista_negros',90,
         'posicao_estimada_do_usuario','342 a 373 de 1010',
         'gabarito_eng_civil_alterado_no_edital_170',false,
         'ressalva_edital_153','nao verificado se o gabarito usado em 21/10 incluia as alteracoes do Edital 153'))
   where id = v_sess;
  get diagnostics n = row_count;
  if n <> 1 then raise exception '0137: esperava 1 sessao, atualizei %', n; end if;

  update public.exam_templates t
     set notes = coalesce(t.notes,'') || E'\nResultado oficial publicado em 24/11/2026 (Edital 171/2026): 6 vagas ampla + 1 negros + 1 PcD; 1.010 presentes, media 77,52, corte de titulos 93 (lista geral) e 90 (negros).'
   where t.id = (select template_id from public.exam_attempts where session_id = v_sess);
  get diagnostics n = row_count;
  if n <> 1 then raise exception '0137: esperava 1 template, atualizei %', n; end if;
  raise notice '0137: resultado oficial de Santos registrado';
end $$;
