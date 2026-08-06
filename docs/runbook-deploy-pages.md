# Runbook — deploy travado no GitHub Pages

**Sintoma:** o `build` passa em ~12 s e gera o artefato, mas o job `deploy` fica
repetindo `Current status: deployment_queued` até morrer com
`Timeout reached, aborting!`. Acontece em todos os deploys seguintes, não só num.

**Resolução:** `bash scripts/destravar-pages.sh --cancelar`, depois
`gh workflow run deploy-pages.yml --ref main`.

---

## O que acontece

O GitHub Pages processa **uma publicação por vez** por repositório. Está na
documentação da API: *"Build requests are limited to one concurrent build per
repository... If you request a build while another is still in progress, the
second request will be queued until the first completes."*

Quando uma publicação trava, ela fica em `deployment_in_progress` e **nunca
termina sozinha**. Todas as seguintes entram na fila atrás dela e morrem no
timeout, uma a uma, indefinidamente.

**Por que a primeira trava, não sabemos.** Em 06/08/2026 chegamos a atribuir ao
cancelamento manual de um run, mas o usuário corrigiu: já havia deploys
falhando antes do primeiro cancelamento. Então o gatilho segue desconhecido —
possivelmente instabilidade do lado do GitHub. O que está estabelecido é só o
mecanismo (uma presa bloqueia a fila) e a correção (cancelar pela API).

Cancelar o run no Actions **não resolve** e provavelmente piora: deixa mais uma
publicação em estado indefinido. Se um deploy parecer travado, deixe morrer no
timeout.

## Por que é difícil de diagnosticar

Nada disso aparece na interface do GitHub:

- Em **Deployments**, os travados aparecem como "Failed to deploy", igual a
  qualquer outra falha.
- O **GitHub Status** segue verde — não é incidente, é estado do repositório.
- **Settings → Pages** parece normal.
- O log do Actions só mostra a espera, sem dizer por quê.

O único lugar que revela é a API:
`GET /repos/{owner}/{repo}/pages/deployments/{sha}` → `deployment_in_progress`.
E `GET /repos/{owner}/{repo}/pages` → `"status": null`.

## Diagnóstico e correção

```bash
bash scripts/destravar-pages.sh            # só mostra
bash scripts/destravar-pages.sh --cancelar # destrava
gh workflow run deploy-pages.yml --ref main
```

Manualmente, se preferir:

```bash
REPO=gustavosiebra/painel-metricas-v2
gh api "repos/$REPO/pages/deployments/SHA" --jq '.status'
gh api -X POST "repos/$REPO/pages/deployments/SHA/cancel" --include   # espera HTTP 204
```

O identificador da publicação **é o SHA do commit** — em Pages servido por
Actions não existe id separado.

Requer GitHub CLI autenticado (`winget install --id GitHub.cli`, depois
`gh auth login`). Escopos `repo` e `workflow` bastam.

## Regra prática

**Não cancele um run de deploy do Pages** — deixe morrer no timeout de 10
minutos. O `deploy-pages` tem teto rígido de 600000 ms e não aceita valor maior
(tentar 1800000 gera `timeout set to the maximum of 600000 milliseconds`), então
esperar mais não é opção. Cancelar não acelera nada e só acrescenta mais uma
publicação em estado indefinido à fila.

Ao ver a **primeira** falha por timeout, rode o script antes de tentar de novo.
Cada nova tentativa sobre a fila travada gasta 10 minutos e não sai do lugar —
foi assim que se acumularam cinco falhas em 06/08/2026.

## O que NÃO era (verificado em 06/08/2026, não repita)

| Hipótese | Verificação |
|---|---|
| Source do Pages errada | Estava em "GitHub Actions", correto |
| Regra de proteção do ambiente | Sem required reviewer, sem wait timer, `main` liberada |
| Actions em Node 20 forçadas p/ Node 24 | Atualizadas todas; continuou falhando |
| Timeout curto demais | Teto rígido de 10 min; ampliar é ignorado |
| Incidente no GitHub | Status "All Systems Operational", Pages incluído |
| Cache do navegador | O deploy não chegava a publicar |

Cinco deploys e várias horas foram gastos nessas hipóteses antes de consultar a
API. **Comece pela API.**

## Histórico

Ocorreu em 06/08/2026, dois dias depois de um deploy normal de 32 s (#87). Os
runs #88 a #93 falharam todos por timeout, presos em `deployment_queued`.
Quatro publicações (`dfaad49`, `9918579`, `515dc4d`, `026c046`) estavam em
`deployment_in_progress`. Cancelá-las pela API liberou a fila e o deploy
seguinte publicou normalmente.

O gatilho original nunca foi identificado. Descartados por verificação: Source
do Pages, regras do ambiente, versões das actions, runtime Node, timeout e
incidente declarado no GitHub Status.
