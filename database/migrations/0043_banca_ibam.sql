-- 0043 — Banca IBAM no catálogo de exam_boards
--
-- POR QUE (21/10/2026):
-- IBAM (Instituto Brasileiro de Administração Municipal) é a banca da
-- Prefeitura de Santos, Edital nº 74/2026-SEPLA-RH, prova aplicada em
-- 18/10/2026. Gustavo resolveu o caderno fora do certame e a sessão precisa
-- de banca para alimentar v_comparativo_banca.
--
-- user_id = null segue a convenção das 10 bancas de catálogo (Vunesp,
-- Cebraspe, FCC, FGV, Cesgranrio, AOCP, IBFC, IDECAN, FUNDATEC, Multibanca).
-- A FAFIPA foi gravada com user_id preenchido, pela interface — divergência
-- conhecida, não corrigida aqui para não mexer em sessões já vinculadas.

insert into public.exam_boards (name, user_id, metadata)
select 'IBAM', null, '{"nome_completo": "Instituto Brasileiro de Administração Municipal"}'::jsonb
where not exists (select 1 from public.exam_boards where name = 'IBAM');
