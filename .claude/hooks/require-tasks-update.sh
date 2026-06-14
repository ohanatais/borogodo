#!/usr/bin/env bash
# Stop hook — trava a sessão se houve mudança não-commitada em src/ mas o
# tasks.md da feature não foi tocado. Força marcar o progresso antes de parar.
# Escape: commitar (working tree limpo não bloqueia) ou desativar via /hooks.

# Evita loop infinito: se já estamos respondendo a este mesmo hook, não rebloqueia.
stop_active=$(cat | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
if [[ "$stop_active" == "true" ]]; then
  exit 0
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
  exit 0
fi

nnn="${branch:0:3}"
specs_dir=$(compgen -G "specs/${nnn}-*" | head -n1)
# Sem spec dir não há tasks.md pra exigir
[[ -z "$specs_dir" ]] && exit 0
tasks_file="${specs_dir}/tasks.md"
[[ ! -f "$tasks_file" ]] && exit 0

# src/ tem mudança não-commitada?
src_dirty=$(git status --porcelain -- src/ 2>/dev/null)
[[ -z "$src_dirty" ]] && exit 0

# tasks.md tem mudança não-commitada?
tasks_dirty=$(git status --porcelain -- "$tasks_file" 2>/dev/null)
if [[ -n "$tasks_dirty" ]]; then
  exit 0
fi

reason="Você mexeu em src/ mas não atualizou ${tasks_file}. Antes de encerrar: marque [x] as tasks concluídas (ou ajuste o que mudou de escopo) em ${tasks_file}. Depois pode parar. Se não houver task correspondente, registre-a."

jq -n --arg r "$reason" '{decision: "block", reason: $r}'
