---
description: "Task list — 023 Freio de custo de IA"
---

# Tasks: Freio de custo de IA

**Input**: Design documents from `specs/023-freio-de-custo/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/ai-guard.md](./contracts/ai-guard.md),
[quickstart.md](./quickstart.md)

**Tests**: INCLUÍDOS — a constituição exige TDD (Princípio VI). Testes do guard e do cálculo de
custo são escritos e confirmados **falhando** (RED) antes da implementação.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: US1 (limite/hora + mensagem honesta) ou US2 (trava diária + e-mails)

---

## Phase 1: Setup

- [x] T001 Adicionar a dependência `resend` ao `package.json` (e lockfile) e registrar as envs
  novas (`AI_RATE_LIMIT_PER_HOUR`, `AI_DAILY_CAP_USD`, `AI_DAILY_WARN_RATIO`, `OPS_ALERT_EMAIL`,
  `RESEND_API_KEY`) no `.env.example` com valores-default/placeholder. **Não** commitar segredos.
- [ ] T002 [P] Documentar no topo de `specs/023-freio-de-custo/quickstart.md` os valores baixos de
  env para teste local (já descritos) e confirmar que o `.env.local` de dev tem as chaves (sem
  versionar).

---

## Phase 2: Foundational (BLOQUEIA US1 e US2)

> O coração do freio. Sem isto, nenhuma história funciona. Faz o chokepoint existir de verdade,
> medir custo e registrar uso.

### Migration & dados

- [x] T003 Criar `supabase/migrations/014_ai_usage_events.sql`: tabelas `ai_usage_events` e
  `ai_daily_alert_state` conforme [data-model.md](./data-model.md) — colunas, CHECKs, índices
  (`(user_id, created_at)`, `(created_at)`, `(action, created_at)`), RLS habilitada **server-only**
  (sem policy para anon/authenticated). Cabeçalho explicando a renumeração para 014.
- [x] T004 Aplicar a migration `014` em **dev** (Supabase) e confirmar via `list_migrations`.
  (Prod fica para a fase de validação/PR.)

### Provider devolve uso de tokens

- [x] T005 [P] Testes (RED) em `src/lib/ai/__tests__/cost.test.ts` para o cálculo de custo:
  Haiku (1/5) e Sonnet (3/15), tokens → `cost_usd` exato.
- [x] T006 Adicionar mapa de preço por token e helper `costUsd(model, inputTokens, outputTokens)`
  em `src/lib/ai/models.ts` (ou `src/lib/ai/cost/cost.ts`) — fazer T005 passar (GREEN).
- [x] T007 Alterar o contrato do provider em `src/lib/ai/provider.ts`: `LLMRequest` ganha
  `userId: string` e `action: AIAction`; `LLMProvider.complete` passa a devolver
  `{ text, usage: { inputTokens, outputTokens } }`. Atualizar o type `AIAction`.
- [x] T008 [P] Atualizar `src/lib/ai/providers/anthropic.ts` para ler `message.usage` e devolver
  `{ text, usage }`.
- [x] T009 [P] Atualizar `src/lib/ai/providers/deepseek.ts` para devolver `{ text, usage }`
  (usage do SDK ou estimativa documentada — não é o caminho do beta).

### Queries de uso

- [x] T010 [P] Criar `src/lib/db/aiUsage.ts` com: `insertUsageEvent(...)`,
  `countGenerationsLastHour(userId)`, `sumDailyCostUsd()`, `dailyConsumersRanking()`,
  `activeUsersToday()`, `blockedUsersToday()` — conforme [data-model.md](./data-model.md).
  Nenhuma query expõe dado de outro usuário a um cliente (uso server-only).

### Config & erros

- [x] T011 [P] Criar `src/lib/ai/cost/limits.ts`: lê as envs com defaults (10 / 10 / 0.7) e
  validação de número; expõe `getLimits()`.
- [x] T012 [P] Adicionar `RateLimitedError` (com `retryAfterSeconds`, `action`) e
  `DailyCapReachedError` (com `action`) em `src/lib/errors.ts`, no padrão dos erros existentes.

### O guard único

- [x] T013 Testes (RED) em `src/lib/ai/cost/__tests__/guard.test.ts` cobrindo os contratos de
  [contracts/ai-guard.md](./contracts/ai-guard.md): abaixo do limite passa e registra 1 evento;
  N+1ª geração lança `RateLimitedError` sem chamar o provider; captura com usuário no limite
  **passa** mas é contabilizada; gasto ≥ teto lança `DailyCapReachedError` para geração e captura
  ainda passa. Mockar provider e `aiUsage`.
- [x] T014 Reescrever `src/lib/ai/client.ts` como o **guard**: `complete(request)` faz
  pré-checagem (só ações de geração) → `getProvider().complete()` → calcula custo e
  `insertUsageEvent` → dispara a avaliação de alerta (stub até US2) → devolve `text`. Quebrar em
  helpers <40 linhas. Fazer T013 passar (GREEN).
- [x] T015 Religar os call sites diretos ao guard (eliminar `getProvider().complete()` espalhado),
  passando `userId` + `action`:
  `src/lib/ai/extraction/extractEntries.ts` e `captureAndReflect.ts` (`action:'capture'`),
  `src/lib/ai/mirror/generateMirror.ts` (`action:'mirror'`),
  `src/lib/ai/mirror/evaluateSufficiency.ts` (parte do fluxo do espelho),
  `src/lib/ai/insights/triggerProactiveInsight.ts` (`action:'insight'`).
  Ajustar assinaturas para receber/repassar `userId`.
- [x] T016 Religar os call sites que já usam o wrapper `complete()` para passar `userId`+`action`:
  `src/lib/ai/content/generateDraft.ts`, `forwardStep.ts`, `assist.ts`, `recalibrateVoice.ts`,
  `buildVoiceProfile.ts` (mapear cada um para a `action` correta).

**Checkpoint:** toda chamada paga passa pelo guard, registra custo e respeita o limite/hora;
nenhuma fura o chokepoint (validável pelo Cenário 6 do quickstart).

---

## Phase 3: User Story 1 — Teto por hora + saída honesta (P1) 🎯 MVP

> **Goal:** quem (ou o que) martela geração é barrado com mensagem gentil; humano normal nunca
> encosta; captura nunca bloqueia.
> **Independent test:** Cenários 1, 2 e 3 do [quickstart.md](./quickstart.md).

- [x] T017 [P] [US1] Testes (RED) de rota em
  `src/app/api/content/generate/__tests__/route.test.ts` (e equivalente p/ chat): com o guard
  lançando `RateLimitedError`, a rota responde **429** com `{ code: 'ai_rate_limited',
  retryAfterSeconds }` e header `Retry-After`.
- [x] T018 [US1] Mapear `RateLimitedError` → 429 nas rotas de geração:
  `src/app/api/content/generate/route.ts`, `src/app/api/chat/route.ts`,
  `src/app/api/mirror/generate/route.ts`, `src/app/api/autoavaliacao/assist/route.ts`,
  `src/app/api/autoavaliacao/review-cycle/route.ts` — passando `userId`+`action` ao guard e
  traduzindo o erro no padrão `jsonError`. Fazer T017 passar.
- [x] T019 [P] [US1] Adicionar chaves i18n `errors.aiRateLimited` (e `errors.aiOverloaded` p/ US2)
  em `src/messages/pt-BR.json` e `src/messages/en.json` — texto provisório no tom da marca
  (refino final no `/impeccable shape`).
- [x] T020 [US1] Tratar o 429 no cliente das superfícies de geração: ler `code`, exibir a mensagem
  i18n gentil (não erro cru, não tela vazia) e respeitar `Retry-After` quando houver. Localizar os
  componentes/handlers que chamam essas rotas e padronizar o tratamento.

**Checkpoint:** US1 entregue e testável de ponta a ponta — é o MVP do freio.

---

## Phase 4: User Story 2 — Trava diária + alertas operacionais (P2)

> **Goal:** ao cruzar o limiar, e-mail preventivo; ao atingir US$10, segura geração + e-mail de
> teto; ambos com retrato do dia; idempotente; captura sempre passa.
> **Independent test:** Cenários 4 e 5 do [quickstart.md](./quickstart.md).

- [x] T021 [P] [US2] Testes (RED) em `src/lib/ai/cost/__tests__/alert.test.ts`: cruzar o limiar
  envia preventivo **uma vez** (2ª chamada no mesmo dia não reenvia); atingir o teto envia
  cap **uma vez**; falha de envio não propaga (best-effort). Mockar Resend e `ai_daily_alert_state`.
- [x] T022 [P] [US2] Criar `src/lib/ai/cost/alert.ts`: monta o conteúdo (gasto, ativos, ranking,
  travados via `aiUsage`) e envia via Resend para `OPS_ALERT_EMAIL`. Dois tipos: `preventive` e
  `cap_reached`. Conteúdo conforme [contracts/ai-guard.md](./contracts/ai-guard.md). Envio
  best-effort: erro logado (sem dado de usuário) e engolido. Fazer T021 passar.
- [x] T023 [US2] Implementar a idempotência em `src/lib/db/aiUsage.ts`: upsert em
  `ai_daily_alert_state` com `on conflict (day)` setando `warned_at`/`capped_at` só se ainda null
  (evita e-mail duplicado sob concorrência).
- [x] T024 [US2] Ligar a avaliação de alerta no guard (`src/lib/ai/client.ts`, substituindo o stub
  do T014): após registrar o evento, ler o gasto diário e disparar `preventive`/`cap_reached`
  conforme limiar/teto e o estado do dia.
- [x] T025 [US2] Implementar o **bloqueio** da trava diária no guard: quando gasto diário ≥ teto,
  lançar `DailyCapReachedError` **apenas para ações de geração** (captura/insight passam). Mapear
  esse erro → 429 `{ code: 'ai_overloaded' }` nas mesmas rotas do T018 (usuário vê a mesma
  mensagem honesta de sobrecarga).

**Checkpoint:** US2 entregue — rede de segurança ativa, operação avisada antes e ao estourar.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T026 [P] Rodar o [quickstart.md](./quickstart.md) inteiro em dev (Cenários 1–6) e anotar
  resultados; corrigir o que aparecer.
- [x] T027 [P] `/impeccable shape` da mensagem de limite (copy + estado acessível no tom da marca)
  e aplicar o texto final nas chaves i18n do T019.
- [ ] T028 [P] Verificar cobertura ≥80% em `src/lib/ai/cost/` e `src/lib/db/aiUsage.ts`; `tsc` e
  lint limpos; funções <40 linhas; nenhum dado de usuário no `logger`.
- [ ] T029 `/security-review` focado: auth-first nas rotas, RLS de `ai_usage_events`, input→LLM
  inalterado, e o e-mail operacional com identificador de usuário (Constitution I) — sem achados
  CRITICAL/HIGH.
- [x] T030 Aplicar a migration `014` em **prod** (após aprovação do PR) e confirmar via
  `list_migrations`. Anotar no `CLAUDE.md` a aplicação (dev+prod) na ordem.

---

## Dependencies & Execution Order

- **Setup (T001–T002)** → primeiro.
- **Foundational (T003–T016)** → BLOQUEIA tudo. Dentro dela: migration (T003–T004) e
  provider/custo (T005–T009) e queries/config/erros (T010–T012) podem andar em paralelo; o guard
  (T013–T016) depende desses.
- **US1 (T017–T020)** → depende da Foundational. É o **MVP** — pode ser entregue/validada sozinha.
- **US2 (T021–T025)** → depende da Foundational; independente da US1 (substitui o stub de alerta
  do T014). Pode começar em paralelo à US1 após o checkpoint da Foundational.
- **Polish (T026–T030)** → por último.

### Paralelizáveis (exemplos)

- Foundational: T005+T008+T009 (custo/providers), T010+T011+T012 (queries/config/erros) em paralelo.
- US1: T017 e T019 em paralelo enquanto T018 avança.
- US2: T021 e T022 em paralelo.

## Implementation Strategy

1. **MVP = Setup + Foundational + US1.** Já entrega o freio real (limite/hora + custo medido +
   mensagem honesta), que é a proteção mais provável contra abuso.
2. **US2 em seguida** adiciona a rede de segurança e a visibilidade operacional por e-mail.
3. Cada história tem checkpoint testável via quickstart; não emendar a próxima sem validar a atual.

## Total: 30 tasks

- Setup: 2 · Foundational: 14 · US1: 4 · US2: 5 · Polish: 5
