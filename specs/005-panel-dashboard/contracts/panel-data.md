# Contract: Dados do Painel + Job de Insight

**Feature**: `005-panel-dashboard`

O painel não expõe rotas novas de leitura (lê via Supabase no RSC). Reusa `/api/capture` e
`/api/entries/:id/enrich` (003). Esta feature adiciona o job `triggerProactiveInsight`.

## Leitura (Server Component `/painel/page.tsx`)

- **Entrada**: `userId` da sessão (auth no topo; middleware do 002).
- **Saída** (props para os componentes): `{ entryCount, recentEntries[≤3], mirror?, insight? }`.
- **Derivados**: `daysSince`, `composerPlaceholder = getCapturePrompt(daysSince, themes)`,
  `status = getMirrorStatus(entryCount)`.
- **Garantia**: todas as queries filtram `user_id`; nada de outro usuário.

## Consumo de rotas existentes (003)

- `CaptureConversation` → `POST /api/capture` (texto/arquivo) → ao resolver, `router.refresh()`.
- Movimento "pergunta" → `PATCH /api/entries/:id/enrich`.

## Job: `triggerProactiveInsight(userId)`

Preenche o stub no-op de 003 (`src/lib/ai/extraction/jobs.ts`).

- **Disparo**: fire-and-forget no `/api/capture` (já existente), com log no catch.
- **Comportamento**: lê entradas recentes do usuário (`service_role`, filtro `user_id`), chama Haiku
  para detectar 1 insight (`type ∈ {invisible_skill, emerging_pattern, connection, evidence_gap}`),
  valida (Zod), insere em `proactive_insights` com `seen=false`.
- **Idempotência/ruído**: no MVP, pode gerar no máximo 1 insight não visto por vez (checar se já há
  um `seen=false` antes de gerar, para não acumular).
- **Falha**: logada (sem dados do usuário); não afeta a captura.

## Marcação de "visto"

- Ao exibir o `ProactiveInsightCard`, marcar `seen=true` (server action ou PATCH leve) para não repetir.

## Garantias de segurança

- Job background com `service_role` filtrando `user_id`; nunca exposto ao client.
- Saída do Haiku validada antes de persistir.
