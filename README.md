# Painel de Métricas dos Estudos — V2

Aplicação web pessoal para acompanhar estudos de concurso público: registro de sessões de estudo, indicadores de desempenho por disciplina e caderno, diagnóstico estatístico (índice Wilson), risco/prioridade e dashboard de decisão.

## Stack

- Banco de dados: PostgreSQL via Supabase
- Autenticação: Supabase Auth
- Frontend: HTML + CSS + JavaScript puro (sem framework)
- Gráficos: Chart.js

## Documentação de referência

A documentação completa do produto (modelo de dados, regras de negócio, catálogo de métricas, arquitetura, roadmap) está no `Documento_Unico_Referencia_V2` mantido na pasta de documentação do projeto — este repositório contém apenas código e migrações.

## Estrutura

```
database/       Migrações SQL, políticas RLS, views, funções, seeds do catálogo
frontend/       HTML, CSS, JS (services, components, pages)
tests/          Testes manuais e automatizados
scripts/        Scripts utilitários
changelog/      Histórico de versões
```

## Modelo de dados — visão rápida

Duas naturezas de tabela:

- **Catálogo** (`exam_boards`, `exams`, `disciplines`, `question_sets`, `questions`, `risk_rules`): dado de referência compartilhado. `user_id` nulo = registro global (mantido pelo superusuário via `profiles.is_admin`); `user_id` preenchido = registro pessoal.
- **Pessoal** (`exam_disciplines`, `study_sessions`, `session_results`, `question_attempts`, `user_parameters`): dado privado, sempre isolado por `user_id` via RLS.

## Status

Fase 1 em andamento — schema, constraints, índices e RLS.
