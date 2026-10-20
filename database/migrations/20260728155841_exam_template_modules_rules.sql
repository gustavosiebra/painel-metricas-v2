
-- Módulos + critérios de habilitação acumuláveis (27/07/2026).
-- Pesquisa em editais reais: TCE-SP/Vunesp exige mínimo ABSOLUTO de questões
-- por módulo (12 Gerais / 36 Específicas); FGV usa mínimo % por módulo e/ou
-- "zero em qualquer disciplina elimina"; Cebraspe usa mínimo de PONTOS
-- líquidos; e há combinados (50% em cada módulo E 60% no total). Modelo:
-- cada bloco pertence a um módulo (texto), e o modelo tem N critérios que
-- TODOS precisam passar (AND). Nota de corte (classificatória, emergente)
-- continua à parte em exam_templates.cutoff_score.
alter table public.exam_template_blocks add column module text;

create table public.exam_template_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.exam_templates(id) on delete cascade,
  -- total = prova inteira; modulo = agregado dos blocos daquele module_name;
  -- cada_bloco = o critério vale pra todo bloco individualmente (ex.: FGV
  -- "eliminado quem zerar qualquer disciplina" = cada_bloco/questoes/1).
  scope text not null check (scope in ('total', 'modulo', 'cada_bloco')),
  module_name text,
  -- questoes = nº absoluto de acertos; pct = % da pontuação; pontos = nota
  -- ponderada (cobre o mínimo de pontos líquidos do Cebraspe).
  kind text not null check (kind in ('questoes', 'pct', 'pontos')),
  value numeric not null,
  created_at timestamptz not null default now()
);

alter table public.exam_template_rules enable row level security;
create policy exam_template_rules_all on public.exam_template_rules
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index exam_template_rules_tpl_idx on public.exam_template_rules (template_id);
;
