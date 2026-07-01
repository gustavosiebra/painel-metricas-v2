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
- Teste de isolamento com 2 usuários reais (@gmail.com e @hotmail.com): confirmado — cada conta só vê o próprio perfil; usuário comum bloqueado ao tentar criar registro global de catálogo (erro 42501 esperado); admin consegue criar registro global; usuário comum consegue criar registro pessoal. Nenhum dado de teste ficou no banco (transações revertidas).

### Fase 2 — Autenticação
- Frontend inicial: index.html, app.js, router.js (hash-based), auth.js (proteção de rota + checagem de is_admin), state.js.
- supabaseClient.js + authService.js (login, cadastro, logout, recuperação de senha).
- Tela de Login/Cadastro/Recuperação (loginPage.js) e placeholder de Dashboard (dashboardPage.js) para validar o fluxo ponta a ponta.
- 2 contas de teste criadas via Supabase Auth; trigger `handle_new_user` confirmado criando `profiles` automaticamente para ambas.
- fulanodetal@gmail.com promovida a `is_admin = true` (superusuário do catálogo).

### Fase 3 — Cadastros base
- Catálogo inicial aplicado (`database/seeds/0001_catalogo_inicial.sql`): 10 bancas, 12 disciplinas, 5 concursos (só nome do órgão — banca/ano/cargo a completar depois).
- Situação, Peso, Risco e Confiança da planilha V1 não foram migrados — eram legenda de valores possíveis, não dado por disciplina; Situação vive no Caderno (ainda não criado) e Peso vive em exam_disciplines (edital × disciplina), a preencher quando houver vínculo real.
- Tela de consulta do Catálogo (catalogPage.js) + navbar compartilhada entre telas autenticadas.

### Fase 4 — Registro de Estudos (em andamento)
- Decisão de 01/07/2026: registro agregado por caderno (não questão por questão). session_results só é criado para study_type com resultado mensurável (questao/simulado/discursiva); question_attempts fica sem uso por ora, sem quebrar o schema.
- studyService.js (createStudySession, hasMeasurableResult) e catalogService.createQuestionSet (caderno criado sob demanda: global se admin, pessoal se usuário comum).
- Tela "Nova Sessão" (studyFormPage.js) com campos condicionais por tipo de estudo, Erros calculado automaticamente (Questões − Acertos), e correção de fuso horário no campo Data (meio-dia local evita virar o dia anterior em UTC).
- Ajuste: `study_sessions.board_id` adicionado (migration 0021) — Banca selecionável na sessão independente de Concurso, para treinar no estilo de uma banca sem mirar edital específico.
- Ajuste: `study_sessions.status` adicionado (migration 0022) — faltava coluna para exclusão lógica (Doc. 16 exige "nunca apagar, só arquivar"; RN-009).
- router.js passou a suportar querystring simples (`#/sessoes/nova?id=...`), necessário para reaproveitar o formulário em modo edição.
- studyService.js expandido: listSessions (filtro por disciplina/status), getSessionById, updateStudySession (ajusta session_results conforme o tipo muda), setSessionStatus (arquivar/reativar).
- Tela "Sessões" (sessionsPage.js): lista com filtro por disciplina e status (ativas/arquivadas/todas), editar (reabre o formulário preenchido) e arquivar/reativar — sem exclusão física em nenhum momento.
- Decisão confirmada em 01/07/2026: status de `study_sessions` (ativo/inativo) é independente do status de `question_sets` (o caderno). Arquivar uma sessão não altera o caderno — status do caderno é decisão própria, feita na tela de Catálogo (ação ainda não construída).
- Decisão confirmada em 01/07/2026, vale para a Fase 5: toda view/função de métrica filtra `study_sessions.status = 'ativo'` — sessão arquivada nunca entra em Diagnóstico, Eficiência, Estabilidade ou qualquer outra métrica.

### Fase 5 — Camada Analítica (em andamento)
- `get_user_param(user_id, key, default)`: parametrização centralizada (NEG-005) sem pré-popular `user_parameters` — cai no default embutido no código se o usuário não tiver sobrescrito nada.
- `wilson_lower_bound(correct, total)`: limite inferior de Wilson, z≈1,2816 fixo (80% de confiança bilateral, NEG-002). Validado com casos conhecidos (N=30/90% bruto → 80,78%, cruzando o corte 80% como o Doc. Único previa).
- `v_diagnostico_caderno` / `v_diagnostico_disciplina`: Wilson por caderno e soma bruta por disciplina, classificação preliminar/crítico/atenção/consolidado. Validado com dado real e isolamento RLS (0 linhas para o outro usuário).
- `v_janela_tendencia`: últimas 100/300 questões por disciplina, acumulando sessões inteiras (aproximação — Fase 4 é registro agregado, sem corte exato por questão).
- `media_movel_semanal(discipline_id)`: média móvel de 7 dias corridos do % de acerto diário, pulando dias sem estudo (não conta como 0%).
- `v_retencao_caderno` **(PROXY, decisão de 01/07/2026)**: a Retenção original do catálogo (3.2) exige `question_attempts` por questão individual — tabela com 0 linhas, não usada desde a Fase 4 (registro agregado). Reconstruir isso é inviável. Em vez de descartar a métrica, foi modelado um proxy real no nível do caderno: acerto médio por faixa de dias desde o último toque (qualquer tipo de estudo) naquele mesmo caderno. Documentado explicitamente como proxy, não como a métrica original.
- `eficiencia_caderno(dias)`: Eficiência Estrita (acertos/hora mensurável), Eficiência Global (acertos/hora total, inclui revisão/flashcard/leitura/videoaula) e Produtividade (questões/hora), por caderno. **[PENDENTE]** o limiar do que conta como "baixa" Eficiência Global (para o alerta condicionado a Situação Consolidando/Dominado) não está definido no catálogo original — não foi inventado um número; fica para a Fase 6 quando o dashboard precisar de fato exibir o alerta.
- `v_estabilidade_caderno`: desvio padrão / coeficiente de variação do % de acerto entre sessões, com gate de amostra (N≥30 sessões, parametrizável).
- `v_alerta_sessao`: última sessão mensurável de cada caderno vs. média das sessões anteriores (exclui a própria última sessão do cálculo da média).
- `v_calibracao_confianca`: confiança autodeclarada (sessão mais recente do caderno) vs. classificação Wilson real — regra literal do catálogo (excesso = "alta" + "crítico"/"atenção").
- `v_prioridade`: Peso (por edital) ao lado do Diagnóstico Wilson da disciplina (NEG-007). **[PENDENTE]** o catálogo não define uma fórmula única de combinação peso×Wilson em score de ranking — a view expõe os dois valores lado a lado, sem inventar essa fórmula.
- Tela **Peso** (`/pesos`, `weightService.js`) — antecipada da Fase 7 por decisão do usuário: sem peso real, a métrica Prioridade ficaria sem dado até a Fase 7 ter uma tela completa de parâmetros. Define `weight`/meta de acerto/questões esperadas por disciplina × concurso (`exam_disciplines`).
- Hardening: todas as views com `security_invoker = true`; todas as funções `SECURITY INVOKER` (nenhuma `SECURITY DEFINER` nova); `EXECUTE`/`SELECT` revogados de `anon`/`public`, concedidos só a `authenticated`. Validado com Security e Performance Advisors (nenhum achado novo) e com isolamento RLS real nas 10 views/funções novas (0 linhas para o segundo usuário de teste em todas elas).
- Migrations 0023 a 0030 (0027 é correção de ordenação da 0026, não uma métrica nova).
