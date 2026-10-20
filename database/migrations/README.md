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

### Pendência

`20260913231219_scoring_mode_ponderado_normalizado.sql` é **duplicata** de
`0039_scoring_mode_ponderado_normalizado.sql`. Mesmo SQL; o arquivo `0039`
tem o cabeçalho explicativo e é o que vale. A duplicata deve ser apagada —
a tentativa automática foi barrada pela sincronização do Dropbox.

## Regra a partir daqui

Toda migration aplicada gera o arquivo no mesmo passo. Sem exceção — foi
justamente pular isso que produziu a divergência.

E, desde 30/10/2026, o Supabase não concede mais acesso automático à Data API
para tabelas novas em `public`. **Toda migration que criar tabela inclui os
GRANTs na mesma migration** (ver `0042_grants_explicitos_tabelas.sql`).
