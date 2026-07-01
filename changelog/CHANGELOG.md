# Changelog

## [Não lançado]

### Fase 0 — Preparação
- Repositório criado com estrutura de pastas (database, frontend, tests, scripts, changelog).
- Projeto Supabase provisionado (região us-east-2, PostgreSQL 17).
- Convenções de branch e commit adotadas: `main` (estável), `develop` (integração), `feature/*`, `fix/*`, `docs/*`.

### Fase 1 — Banco e Segurança
- Schema criado: 12 tabelas (profiles, exam_boards, disciplines, exams, exam_disciplines, question_sets, questions, study_sessions, session_results, question_attempts, user_parameters, risk_rules) + 7 enums.
- Separação Catálogo (user_id nullable) vs. Pessoal (user_id obrigatório) aplicada via RLS em duas famílias de política.
- Superusuário: `profiles.is_admin`, protegido contra auto-promoção via trigger `protect_is_admin`.
- Trigger de auto-criação de `profiles` no cadastro (`handle_new_user`).
- RLS habilitado e políticas aplicadas nas 12 tabelas.
- Security Advisor: 2 achados corrigidos (função com search_path mutável; funções de trigger expostas como RPC); restam 2 aceitos (função interna do Supabase fora de escopo; `is_admin()` executável por `authenticated`, intencional — necessário para as políticas de catálogo).
- Performance Advisor: corrigido índice ausente (`questions.user_id`) e recriadas todas as políticas RLS com `(select auth.uid())` / `(select public.is_admin())` para evitar reavaliação por linha.
- Teste de isolamento com 2 usuários reais (gustavosiebra@gmail.com e @hotmail.com): confirmado — cada conta só vê o próprio perfil; usuário comum bloqueado ao tentar criar registro global de catálogo (erro 42501 esperado); admin consegue criar registro global; usuário comum consegue criar registro pessoal. Nenhum dado de teste ficou no banco (transações revertidas).

### Fase 2 — Autenticação
- Frontend inicial: index.html, app.js, router.js (hash-based), auth.js (proteção de rota + checagem de is_admin), state.js.
- supabaseClient.js + authService.js (login, cadastro, logout, recuperação de senha).
- Tela de Login/Cadastro/Recuperação (loginPage.js) e placeholder de Dashboard (dashboardPage.js) para validar o fluxo ponta a ponta.
- 2 contas de teste criadas via Supabase Auth; trigger `handle_new_user` confirmado criando `profiles` automaticamente para ambas.
- gustavosiebra@gmail.com promovida a `is_admin = true` (superusuário do catálogo).
