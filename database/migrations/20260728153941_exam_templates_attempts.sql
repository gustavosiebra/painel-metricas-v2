
-- Modelos de Prova + tentativas (27/07/2026). Racional: todo edital de
-- objetiva se reduz a "lista de blocos, cada um com nº de questões, peso por
-- questão e mínimo habilitatório opcional" (validado contra TCE-SC/FGV 2026,
-- padrão TJ Gerais×1/Específicos×3, Campina Grande peso por disciplina, e
-- Cebraspe com correção líquida acertos−erros). Modelo é reutilizável:
-- tentativas do MESMO modelo são comparáveis entre si (evolução), e o campo
-- origem separa treino (simulado) de realidade (prova_oficial).

create table public.exam_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  board_id uuid references public.exam_boards(id) on delete set null,
  -- bruto: nota = acertos × peso. liquido (Cebraspe): nota = (acertos −
  -- erros) × peso; branco é neutro, por isso tentativas guardam acertos E
  -- erros separados (brancos = questões − acertos − erros).
  scoring_mode text not null default 'bruto' check (scoring_mode in ('bruto', 'liquido')),
  -- Mínimo % do total pra habilitação (opcional) e nota de corte estimada/
  -- real (opcional, editável quando o resultado sair).
  min_total_pct numeric,
  cutoff_score numeric,
  notes text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

create table public.exam_template_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.exam_templates(id) on delete cascade,
  position int not null default 0,
  name text not null,
  -- Vínculo opcional com o catálogo — é o que habilita cruzar simulado ×
  -- prática (Wilson) da mesma disciplina.
  discipline_id uuid references public.disciplines(id) on delete set null,
  questions int not null check (questions > 0),
  weight numeric not null default 1 check (weight > 0),
  -- Mínimo % do bloco pra habilitação (opcional; ex.: "40% em Gerais",
  -- "não zerar" = qualquer valor > 0).
  min_pct numeric
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.exam_templates(id) on delete cascade,
  occurred_at timestamptz not null,
  origem text not null default 'simulado' check (origem in ('simulado', 'prova_oficial')),
  duration_minutes numeric,
  -- Sessão de estudo gerada automaticamente junto (tipo simulado) pra manter
  -- horas/questões semanais consistentes no dashboard sem digitação dupla.
  session_id uuid references public.study_sessions(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.exam_attempt_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  block_id uuid not null references public.exam_template_blocks(id) on delete cascade,
  correct int not null default 0 check (correct >= 0),
  -- Só usado no modo líquido (Cebraspe); no bruto fica 0 e os "erros" são
  -- questões − acertos, sem distinção de branco.
  wrong int not null default 0 check (wrong >= 0)
);

alter table public.exam_templates enable row level security;
alter table public.exam_template_blocks enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_attempt_blocks enable row level security;

create policy exam_templates_all on public.exam_templates
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy exam_template_blocks_all on public.exam_template_blocks
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy exam_attempts_all on public.exam_attempts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy exam_attempt_blocks_all on public.exam_attempt_blocks
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index exam_template_blocks_tpl_idx on public.exam_template_blocks (template_id, position);
create index exam_attempts_user_tpl_idx on public.exam_attempts (user_id, template_id, occurred_at desc);
create index exam_attempt_blocks_att_idx on public.exam_attempt_blocks (attempt_id);
;
