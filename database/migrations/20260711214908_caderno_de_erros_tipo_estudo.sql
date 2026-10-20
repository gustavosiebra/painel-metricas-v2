
-- Caderno de Erros (08/07/2026, pedido do usuário) — revisão semanal de
-- questões erradas ao longo da semana, cruzando várias disciplinas. Precisa
-- de resultado mensurável (questões/acertos/erros), mas fica de fora do
-- Diagnóstico Wilson/Retenção/Eficiência de propósito (essas views já
-- filtram study_type in ('questao','simulado','discursiva') — não precisam
-- de nenhuma mudança). discipline_id vira opcional só pra este uso: quem quiser
-- vincular a uma disciplina específica continua podendo (RLS e demais tipos
-- de estudo continuam exigindo disciplina normalmente — isso é regra de
-- formulário em studyFormPage.js, não muda aqui).
alter table public.study_sessions alter column discipline_id drop not null;

alter type public.study_type add value 'caderno_erros';
;
