#!/usr/bin/env bash
# Cria uma nova worktree e linka o .env.local automaticamente.
# Uso: ./scripts/worktree-add.sh <branch> [base-branch]
# Exemplo: ./scripts/worktree-add.sh 020-nova-feature main

set -euo pipefail

BRANCH="${1:-}"
BASE="${2:-main}"

if [ -z "$BRANCH" ]; then
  echo "Uso: ./scripts/worktree-add.sh <branch> [base-branch]"
  echo "Exemplo: ./scripts/worktree-add.sh 020-nova-feature main"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
PARENT_DIR="$(dirname "$REPO_ROOT")"

# Extrai prefixo numérico do branch para nomear o diretório (ex: 020 de 020-nova-feature)
PREFIX="$(echo "$BRANCH" | grep -oE '^[0-9]+' || echo "$BRANCH")"
WORKTREE_DIR="$PARENT_DIR/$REPO_NAME-$PREFIX"

echo "→ Criando worktree: $WORKTREE_DIR (branch: $BRANCH, base: $BASE)"

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git worktree add "$WORKTREE_DIR" "$BRANCH"
else
  git worktree add -b "$BRANCH" "$WORKTREE_DIR" "$BASE"
fi

# Linka .env.local se existir no repositório principal
if [ -f "$REPO_ROOT/.env.local" ]; then
  ln -sf "$REPO_ROOT/.env.local" "$WORKTREE_DIR/.env.local"
  echo "→ .env.local linkado de $REPO_ROOT"
else
  echo "⚠ $REPO_ROOT/.env.local não encontrado — crie antes de rodar localmente"
fi

echo ""
echo "✓ Pronto. Para trabalhar na worktree:"
echo "  cd $WORKTREE_DIR"
echo "  claude  # abre Claude Code nessa feature, isolada"
