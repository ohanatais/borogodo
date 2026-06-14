# Agent Orchestration

## Agentes registrados neste projeto

- **`pr-review-subagent`** (`.claude/agents/pr-review-subagent.md`) — agente restrito
  (Read/Grep/Glob, sem shell). Dispatched apenas pelo orquestrador da skill
  `/pr-review` — nunca invocar diretamente.

## Sem agentes customizados globais

Este ambiente **não** tem agentes customizados em `~/.claude/agents/` (ex.: `planner`,
`code-reviewer`, `security-reviewer`, `tdd-guide`, `architect`, `build-error-resolver`
não existem — eram referências de um template genérico). Para as mesmas
necessidades, usar:

| Necessidade | Onde usar |
|---|---|
| Planejamento de feature | `/speckit-plan` + `/speckit-tasks` |
| Pesquisa/exploração no código | agente `Explore` (via Task/Agent tool) |
| Revisão de código pontual durante implementação | `/code-review <low\|medium\|high>` (built-in) |
| Revisão multi-perspectiva antes do PR | `/pr-review` (6 subagentes: segurança, qualidade, arquitetura, performance, requisitos, regressão) |
| Revisão de segurança dedicada | `/security-review` (built-in) |
| Shape/audit de UX e UI | `/impeccable shape` e `/impeccable audit` + `web-design-guidelines` |
| Performance/composição React/Next | `vercel-react-best-practices`, `vercel-composition-patterns` |
| RLS, queries, migrations Supabase | `supabase`, `supabase-postgres-best-practices` |
| Tarefa de múltiplas etapas, geral | agente `general-purpose` (via Task/Agent tool) |
| Planejamento arquitetural mais profundo | agente `Plan` (via Task/Agent tool) |

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch agents in parallel for independent research/exploration:
1. Agent 1: Explore auth module structure
2. Agent 2: Explore caching layer
3. Agent 3: Explore utility type definitions

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

Para revisão multi-perspectiva de um PR ou branch, usar `/pr-review` — ele já
dispatcha os seis subagentes especializados (segurança, qualidade, arquitetura,
performance, requisitos, regressão) em paralelo e consolida o resultado.
