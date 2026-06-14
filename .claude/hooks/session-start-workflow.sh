#!/usr/bin/env bash
# SessionStart hook — injeta o workflow obrigatório do speckit no contexto.
# Sobrevive a /clear e a chat novo: todo início de sessão relembra as regras.

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

read -r -d '' CONTEXT <<EOF
## Workflow obrigatório (Borogodó) — imposto por hooks

Branch atual: ${branch}

REGRAS NÃO-OPCIONAIS:
1. Toda feature segue o speckit ANTES de codar: /speckit-specify → /speckit-clarify →
   /speckit-plan → /speckit-tasks → /impeccable shape → /speckit-implement.
2. Não se escreve código em src/ numa branch de feature (NNN-*) sem specs/NNN-*/ existir.
   Um hook PreToolUse BLOQUEIA isso. Se for bloqueado, rode o speckit primeiro.
3. Ao implementar, MARQUE o progresso em specs/NNN-*/tasks.md ([x]) conforme conclui
   cada task. Um hook Stop TRAVA a sessão se src/ mudou e tasks.md não foi atualizado.
4. O estado durável da feature mora em disco (spec/plan/tasks), não na janela de
   contexto. Ao retomar em chat novo, leia tasks.md e continue da próxima task não-marcada.
EOF

jq -n --arg ctx "$CONTEXT" \
  '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
