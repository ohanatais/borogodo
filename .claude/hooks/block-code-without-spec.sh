#!/usr/bin/env bash
# PreToolUse (Write|Edit) — bloqueia escrita em src/ quando a branch é de feature
# (NNN-*) e ainda não existe specs/NNN-*/. Força o speckit antes de codar.
# Libera: branches não-feature (main/fix/docs/chore), arquivos fora de src/.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""')

# Só nos importam escritas em src/
case "$file_path" in
  */src/*|src/*) ;;
  *) exit 0 ;;
esac

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

# Só travamos em branch de feature: prefixo NNN- (três dígitos e hífen)
if [[ ! "$branch" =~ ^[0-9]{3}- ]]; then
  exit 0
fi

nnn="${branch:0:3}"

# Se já existe specs/NNN-*/, libera
if compgen -G "specs/${nnn}-*" > /dev/null; then
  exit 0
fi

reason="Branch de feature '${branch}' não tem specs/${nnn}-*/. Pelo workflow do Borogodó, rode o speckit (/speckit-specify → /speckit-plan → /speckit-tasks) antes de escrever código em src/. Crie a spec da feature primeiro."

jq -n --arg r "$reason" \
  '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $r}}'
