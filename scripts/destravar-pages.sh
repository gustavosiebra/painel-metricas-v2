#!/usr/bin/env bash
# destravar-pages.sh — libera a fila do GitHub Pages quando os deploys param
# de sair e morrem com "Timeout reached, aborting!".
#
# Contexto (06/08/2026): o GitHub Pages processa UMA publicação por vez neste
# repositório. Quando uma publicação trava, ela fica em "deployment_in_progress"
# e NUNCA termina sozinha — todas as seguintes entram na fila atrás dela e
# morrem no timeout de 10 minutos, uma após a outra.
#
# O que faz a primeira travar é DESCONHECIDO. Rode este script na PRIMEIRA
# falha por timeout: insistir sem destravar só queima 10 min por tentativa.
#
# O estado preso não aparece em lugar nenhum da interface do GitHub: os
# Deployments mostram só "Failed to deploy", e o Status do GitHub segue verde.
# Só a API revela.
#
# Uso:
#   bash scripts/destravar-pages.sh           # só diagnostica
#   bash scripts/destravar-pages.sh --cancelar # diagnostica e destrava
#
# Requer o GitHub CLI autenticado (gh auth login). Ver docs/runbook-deploy-pages.md.

set -uo pipefail

REPO="${REPO:-gustavosiebra/painel-metricas-v2}"
CANCELAR=false
[ "${1:-}" = "--cancelar" ] && CANCELAR=true

command -v gh >/dev/null || { echo "GitHub CLI (gh) nao encontrado. Instale com: winget install --id GitHub.cli"; exit 1; }

echo "=== Situacao do site ==="
gh api "repos/$REPO/pages" --jq '{status, build_type, html_url}' 2>&1
echo
echo "    status: 'built' = normal | null = provavelmente travado"
echo

# Olha os 10 commits mais recentes da main. Em Pages servido por Actions o
# identificador da publicacao E o SHA do commit — foi assim que descobrimos
# quais estavam presos.
SHAS=$(git log --format=%H -10 origin/main 2>/dev/null || git log --format=%H -10)

echo "=== Publicacoes recentes ==="
PRESOS=()
for sha in $SHAS; do
  estado=$(gh api "repos/$REPO/pages/deployments/$sha" --jq '.status' 2>/dev/null || echo "-")
  [ "$estado" = "-" ] && continue          # nunca foi publicado, ignora
  printf "  %-8s %-28s %s\n" "${sha:0:7}" "$estado" "$(git log -1 --format=%s "$sha" 2>/dev/null | cut -c1-40)"
  case "$estado" in
    deployment_in_progress|queued|in_progress|deploying) PRESOS+=("$sha") ;;
  esac
done

echo
if [ ${#PRESOS[@]} -eq 0 ]; then
  echo "Nenhuma publicacao presa. Se o deploy ainda falha, a causa e outra —"
  echo "veja docs/runbook-deploy-pages.md para o que ja foi descartado."
  exit 0
fi

echo "!! ${#PRESOS[@]} publicacao(oes) presa(s). Enquanto existirem, NENHUM deploy novo sai."

if [ "$CANCELAR" != true ]; then
  echo
  echo "Para destravar:  bash scripts/destravar-pages.sh --cancelar"
  exit 0
fi

echo
echo "=== Cancelando ==="
for sha in "${PRESOS[@]}"; do
  printf "  %-8s -> " "${sha:0:7}"
  gh api -X POST "repos/$REPO/pages/deployments/$sha/cancel" --include 2>&1 | head -1
done

echo
echo "=== Conferindo ==="
for sha in "${PRESOS[@]}"; do
  printf "  %-8s -> " "${sha:0:7}"
  gh api "repos/$REPO/pages/deployments/$sha" --jq '.status' 2>&1 | head -1
done

echo
echo "Se sairam de deployment_in_progress, dispare um deploy novo:"
echo "  gh workflow run deploy-pages.yml --ref main"
echo
echo "Nao cancele o run: nao acelera nada e ainda deixa mais uma publicacao"
echo "em estado indefinido na fila. Se travar, deixe morrer no timeout."
