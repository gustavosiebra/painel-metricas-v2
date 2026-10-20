alter table public.exams
  add column if not exists registration_date date,
  add column if not exists fee_amount numeric(10,2);

comment on column public.exams.registration_date is 'Prazo final de inscrição (aba Planejamento, 13/07/2026) — usado pro contador de dias, não é histórico de quando a pessoa se inscreveu.';
comment on column public.exams.fee_amount is 'Valor da taxa de inscrição em reais (aba Planejamento, 13/07/2026).';;
