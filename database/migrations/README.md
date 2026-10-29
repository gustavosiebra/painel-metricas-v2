# Migrations

## Duas convenções de nome, uma ordem só

Este diretório tem arquivos em dois formatos, por motivo histórico:

- `NNNN_nome.sql` — numeração manual, usada no desenvolvimento inicial e
  retomada a partir de 15/10/2026.
- `AAAAMMDDHHMMSS_nome.sql` — carimbo de versão do Supabase, nos arquivos
  recuperados em 20/10/2026.

**A ordem de aplicação é sempre a do carimbo em
`supabase_migrations.schema_migrations`, não a do nome do arquivo.** Os
arquivos `NNNN_` foram aplicados entre 01 e 03/07/2026 e em outubro; os
`AAAAMMDDHHMMSS_` preenchem o que foi aplicado direto no Supabase sem gerar
arquivo.

Atenção à numeração: existem **`0040`, `0041` e `0042` duas vezes**, com
conteúdos diferentes — os de 03/07/2026 (matriz de risco, arquivos com
carimbo) e os de 15 a 20/10/2026 (desempenho relativo e grants, arquivos
`NNNN_`). O nome do arquivo não desempata; o carimbo sim.

## O que aconteceu em 20/10/2026

Auditoria encontrou **43 arquivos no repositório contra 99 migrations
aplicadas no banco**. Cerca de 57 tinham sido aplicadas direto via MCP ou
pelo painel do Supabase, sem gerar arquivo.

Na prática, o repositório não reconstruía o banco: faltavam
`historical_question_stats`, `error_records`, `exam_templates`,
`exam_attempts`, `exam_topics`, as views de fila de revisão e cobertura de
edital, e os tipos de estudo `caderno_erros` e `correcao_ativa`, entre
outros.

O SQL foi recuperado de `supabase_migrations.schema_migrations`, que guarda o
texto exato aplicado. O export bruto está em
`../_migrations_export_20261020.csv` (99 linhas, 591 KB) e serve de
conferência: é a fonte, os arquivos são a cópia.

Arquivos já existentes **não** foram sobrescritos — vários trazem cabeçalho
explicando a decisão por trás da mudança, que o banco não guarda.

### Pendência resolvida

`20260913231219_scoring_mode_ponderado_normalizado.sql` era **duplicata** de
`0039_scoring_mode_ponderado_normalizado.sql`. Mesmo SQL; o arquivo `0039` tem
o cabeçalho explicativo e é o que vale. A duplicata foi apagada (verificado em
29/10/2026); a migration segue registrada no banco pelo carimbo
`20260913231219`.

## Regras a partir daqui

As quatro regras abaixo nasceram de erros reais. Cada uma custou uma correção.

### 1. Migration aplicada gera arquivo no mesmo passo

Sem exceção — foi justamente pular isso que produziu a divergência de 43
arquivos contra 99 migrations descrita acima.

### 2. Migration que cria tabela inclui os GRANTs

Desde 30/10/2026 o Supabase não concede mais acesso automático à Data API para
tabelas novas em `public`. Sem o GRANT na própria migration, uma reconstrução
(`supabase db reset`, branch de preview, projeto novo) recria a tabela sem
permissão e a API devolve "permission denied" em tudo.

Ver `0042_grants_explicitos_tabelas.sql`.

### 3. Toda view carrega `security_invoker` explicitamente

```sql
create or replace view public.minha_view
with (security_invoker = true) as
  select ...;
```

**`CREATE OR REPLACE VIEW` sem a cláusula `WITH` zera as reloptions da view**,
e com elas o `security_invoker`. Preserva dependências, GRANTs e COMMENTs —
mas não as reloptions.

Sem `security_invoker`, a view é avaliada com os privilégios do dono e as
policies de RLS deixam de ser aplicadas a quem consulta: a view devolve as
linhas de todos os usuários.

Aconteceu em 21/10/2026. A migration `0046` substituiu 15 views sem o `WITH` e
derrubou o RLS de todas. O sintoma foi o dashboard quebrar com
`PGRST116 — JSON object requested, multiple (or no) rows returned`, porque
`getKpis()` consulta `v_diagnostico_geral` com `.maybeSingle()` e a view, que
agrupa por `user_id`, passou de 1 linha para 3. Corrigido em
`0047_restaura_security_invoker_views.sql`.

A mesma investigação revelou que `v_desempenho_relativo`, `_semana` e
`_disciplina` nunca tiveram `security_invoker` — foram criadas sem a cláusula
nas migrations `0040` (15/10) e `0041` (20/10), e ficaram seis dias assim. A
`0047` corrigiu as três junto.

Verificação rápida de que nenhuma view está descoberta:

```sql
select relname from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
  and coalesce(array_to_string(c.reloptions, ','), '') not like '%security_invoker=true%';
```

O resultado esperado é vazio.

### 4. Valor novo de enum: varrer views **e funções**

Quando entra um valor novo em `study_type` — ou em qualquer enum usado como
filtro —, a varredura tem de cobrir as duas coisas. Procurar só em `pg_class`
deixa metade de fora.

```sql
-- views e matviews que citam o enum
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
  and pg_get_viewdef(c.oid) like '%study_type%';

-- funções e procedures que citam o enum
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc like '%study_type%';
```

Aconteceu em 21/10/2026. A `0045` reclassificou três sessões de `simulado`
para `prova_oficial`; a `0046` acrescentou o valor novo ao filtro de **15
views** — e só delas. As funções `media_movel_semanal` e `eficiencia_caderno`
ficaram para trás por **oito dias**.

O sintoma visível foi a barra da semana de 10 a 16/08 desaparecer da Tendência
Semanal: a RPC enxergava 38 questões em vez de 108 e caía abaixo do piso de 50
do parâmetro `tendencia_semanal_min_questoes`. O sintoma invisível era pior —
as semanas que ficaram acima do piso exibiam percentual mais alto que o real,
porque as provas oficiais, as medições mais verdadeiras da série, estavam
fora. Na semana de 03 a 09/08: 69,59% exibido contra 65,87% real.

Corrigido em `0064_funcoes_incluem_prova_oficial.sql`.
