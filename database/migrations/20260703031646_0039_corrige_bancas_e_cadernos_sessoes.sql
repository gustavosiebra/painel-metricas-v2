
-- Correção de dados solicitada pelo usuário em 2026-07-03:
-- 1) Sessões que tinham a entrada de catálogo "Multibanca" salva como se fosse
--    uma banca real (resíduo de versão anterior da UI) passam a ter as 4
--    bancas reais selecionadas: Cebraspe, FCC, FGV, Vunesp.
-- 2) Cadernos "ad-hoc" (criados digitando um nome livre em Nova Sessão, que
--    por o usuário ser admin viraram entradas de catálogo global com
--    source IS NULL) são repontados para o caderno TEC Concursos
--    correspondente, quando existe correspondência clara 1:1. A entrada
--    ad-hoc antiga é marcada status='inativo' (não apagada, para rastreabilidade).
--    Exceção: "Licitação e Contratos Administrativos" NÃO foi repontado —
--    o catálogo TEC não tem um caderno genérico equivalente (só ~50 tópicos
--    granulares por artigo de lei), decisão pendente de confirmação do usuário.

-- 1) Bancas: 10 sessões com "Multibanca" salva como banca única
delete from public.study_session_boards
where board_id = '7f5d84db-b2c4-4548-be17-372fea7cb07a'
  and session_id in (
    '75e3ace0-ca91-400a-a02b-5329b3540d4e','0ab1e0df-4a0a-4a10-8e02-577c42d117b1',
    '64391219-29d8-49dc-8718-e3010d121481','69155a32-3e7f-45b8-9394-63581d7910bd',
    '33606eb6-7e99-4cd3-a559-fd814cb29064','11b7e56d-968f-48e4-ada3-b1d471743c95',
    '8e29f2bb-b158-4d30-8c12-9952a4185347','6352ffd1-aaa7-4fb6-a189-58010cfcbbc1',
    'e9eb46a5-38f1-4a05-98fc-c47c7dee5cc0','72a83d81-a748-4928-8ceb-d2aed5fd7b54'
  );

insert into public.study_session_boards (session_id, board_id, user_id)
select ss.id, b.board_id, ss.user_id
from public.study_sessions ss
cross join (values
  ('3c75d5c7-f6fe-4c10-81e3-1cadc7a85679'::uuid), -- Cebraspe
  ('2d9df3ec-014c-4b2b-b0e5-e420d8088eb1'::uuid), -- FCC
  ('d31b6398-3b78-4085-aaa4-467f54305823'::uuid), -- FGV
  ('5b1f4eaf-27f2-40a7-b8fc-5c76da38e353'::uuid)  -- Vunesp
) as b(board_id)
where ss.id in (
  '75e3ace0-ca91-400a-a02b-5329b3540d4e','0ab1e0df-4a0a-4a10-8e02-577c42d117b1',
  '64391219-29d8-49dc-8718-e3010d121481','69155a32-3e7f-45b8-9394-63581d7910bd',
  '33606eb6-7e99-4cd3-a559-fd814cb29064','11b7e56d-968f-48e4-ada3-b1d471743c95',
  '8e29f2bb-b158-4d30-8c12-9952a4185347','6352ffd1-aaa7-4fb6-a189-58010cfcbbc1',
  'e9eb46a5-38f1-4a05-98fc-c47c7dee5cc0','72a83d81-a748-4928-8ceb-d2aed5fd7b54'
)
on conflict (session_id, board_id) do nothing;

update public.study_sessions
set board_id = null
where id in (
  '75e3ace0-ca91-400a-a02b-5329b3540d4e','0ab1e0df-4a0a-4a10-8e02-577c42d117b1',
  '64391219-29d8-49dc-8718-e3010d121481','69155a32-3e7f-45b8-9394-63581d7910bd',
  '33606eb6-7e99-4cd3-a559-fd814cb29064','11b7e56d-968f-48e4-ada3-b1d471743c95',
  '8e29f2bb-b158-4d30-8c12-9952a4185347','6352ffd1-aaa7-4fb6-a189-58010cfcbbc1',
  'e9eb46a5-38f1-4a05-98fc-c47c7dee5cc0','72a83d81-a748-4928-8ceb-d2aed5fd7b54'
);

-- 2) Cadernos: repontar sessões para o equivalente TEC (mapeamento validado
-- por nome exato/near-exato dentro da mesma disciplina, ver comentário acima)
update public.study_sessions set question_set_id = 'a609f6a4-4263-4175-b717-6d4415d425d6' where question_set_id = 'bcd65bbf-9716-4358-b23d-311dad385460'; -- LDO
update public.study_sessions set question_set_id = '34798dbe-acd1-4d5a-89d5-5d1a8fc587ee' where question_set_id = 'c4b05ec7-f42d-4d40-8209-3de6399fba8e'; -- Administração Direta
update public.study_sessions set question_set_id = '541de6a1-ac45-4fa1-a1f4-079aa684785d' where question_set_id = '61c5570f-2540-4001-a750-a6e36b6bfba7'; -- Organização Administrativa da União
update public.study_sessions set question_set_id = 'f74efa60-57d9-48d9-b7fe-ca9c8c076343' where question_set_id = 'fd2b5f4f-b4de-4d0f-a88d-0a4bbd37d6a2'; -- Princípios Fundamentais da Constituição
update public.study_sessions set question_set_id = 'acb54a8b-50cd-41ac-9d8c-767a56b08c9f' where question_set_id = '2be5b636-8799-44ed-bee6-619b7781029b'; -- Concreto Armado
update public.study_sessions set question_set_id = '01a9dea2-8fbf-44a6-a042-7bf34f342adf' where question_set_id = '73bffcea-f21a-4978-9f40-ab1fa04bd482'; -- Estrtura de Concreto (typo)
update public.study_sessions set question_set_id = '484f1507-e800-40b7-b50d-4b3f555a6339' where question_set_id = '85ddff59-9814-44de-9295-7cf10c182c34'; -- Condutos Forçados
update public.study_sessions set question_set_id = '49ef22c3-2cc1-4b3b-a3bc-e951afed4998' where question_set_id = '373ab281-55c0-490a-8dd8-be1b653b9608'; -- Irrigação
update public.study_sessions set question_set_id = '70e7b291-d87e-4efe-86f8-7f39ca6e9ae3' where question_set_id = '1ea8baaa-7ebc-4f9b-b1f1-5adbad17ce40'; -- Turbinas
update public.study_sessions set question_set_id = '6535819e-42d6-42b3-8650-c5586acae0d1' where question_set_id = '468df7ae-7de0-4155-bc8a-c2cbb08e3d96'; -- Especificações de Materiais
update public.study_sessions set question_set_id = '397b3dd0-f00c-4cff-adcf-f3b2fd5f1e39' where question_set_id = '3844e746-b0a5-4d03-9d2e-053d55342ad3'; -- Pavimentação (dup)
update public.study_sessions set question_set_id = '770771f0-b850-4641-a119-45c8ecd16bcd' where question_set_id = 'cc62f4b9-7351-48fe-ab8e-af0938cb8024'; -- Planejamento e Controle de Obras (dup)

-- Desativa as entradas ad-hoc duplicadas (mantidas para rastreabilidade, não apagadas)
update public.question_sets set status = 'inativo'
where id in (
  'bcd65bbf-9716-4358-b23d-311dad385460','c4b05ec7-f42d-4d40-8209-3de6399fba8e',
  '61c5570f-2540-4001-a750-a6e36b6bfba7','fd2b5f4f-b4de-4d0f-a88d-0a4bbd37d6a2',
  '2be5b636-8799-44ed-bee6-619b7781029b','73bffcea-f21a-4978-9f40-ab1fa04bd482',
  '85ddff59-9814-44de-9295-7cf10c182c34','373ab281-55c0-490a-8dd8-be1b653b9608',
  '1ea8baaa-7ebc-4f9b-b1f1-5adbad17ce40','468df7ae-7de0-4155-bc8a-c2cbb08e3d96',
  '3844e746-b0a5-4d03-9d2e-053d55342ad3','cc62f4b9-7351-48fe-ab8e-af0938cb8024'
);
;
