---
description: "Task list for 004-mirror-generation"
---

# Tasks: Geração do Espelho

**Input**: `/specs/004-mirror-generation/` (plan.md, spec.md, data-model.md, contracts/, research.md)

**Tests**: OBRIGATÓRIOS (TDD; cobertura ≥ 80%).

**Pré-requisito**: 003 mergeada → `git rebase main` antes de começar.

**Referência de código/prompts**: `docs/mvp/005-first-mirror.md`.

## Format: `[ID] [P?] [Story] Description`

- US1 = primeira geração; US2 = atualização viva (limiar).

---

## Phase 1: Setup

- [ ] T001 `git rebase main` (puxar pipeline de 003); confirmar `entries`/tipos disponíveis
- [ ] T002 [P] Confirmar `SUPABASE_SERVICE_ROLE_KEY` em `.env.local`

---

## Phase 2: Foundational (bloqueia stories)

- [ ] T003 Migration `supabase/migrations/00X_mirror_snapshots.sql` (tabela + RLS + índice + `strength_themes`) — `data-model.md`
- [ ] T004 Migration/verificação: `profiles.onboarding_completed boolean default false` (add if not exists)
- [ ] T005 **Manual**: aplicar migrations no Supabase (nesta ordem)
- [ ] T006 [P] Tipos `src/types/mirror.ts` (`Mirror`, `MirrorSection`)
- [ ] T007 [P] `src/lib/db/supabaseAdmin.ts` (client `service_role`; usado só server-side, filtra `user_id`) — se ainda não existir
- [ ] T008 `src/lib/ai/mirror/schemas.ts` (`validateMirror`) — **escrever T009 antes**
- [ ] T009 [P] `tests/unit/mirror-schemas.test.ts`: valida estrutura completa; rejeita `strength_themes` fora de 3–6; rejeita seções vazias (FAIL primeiro)
- [ ] T010 [P] `src/lib/db/mirror.ts` (`insertMirrorSnapshot`, `getLatestSnapshot`, `saveMirrorFeedback`)

**Checkpoint**: schema, tipos, validação e persistência prontos.

---

## Phase 3: User Story 1 — Primeira geração (P1) 🎯 MVP

**Goal**: gerar, validar e persistir o primeiro espelho; marcar onboarding concluído.

**Independent Test**: `/api/mirror/generate` com ≥ 1 entrada cria snapshot e marca onboarding.

### Tests (FAIL primeiro)
- [ ] T011 [P] [US1] `tests/integration/mirror-generate-route.test.ts`: 200 cria snapshot + `onboarding_completed=true`; 400 sem entradas; 401 sem sessão; 500 se Zod falha (nada persistido)
- [ ] T012 [P] [US1] Teste de isolamento: contexto do Sonnet só inclui entradas do próprio usuário

### Implementação
- [ ] T013 [US1] `src/lib/ai/mirror/prompts/firstMirror.ts`: `MIRROR_SYSTEM_PROMPT` + `buildMirrorUserPrompt(entries, userName)` (doc 005)
- [ ] T014 [US1] `src/lib/ai/mirror/generateMirror.ts`: `generateAndSaveMirror(userId)` — lê ≤20 entradas, chama `getProvider().complete({ role: 'synthesis', system, user, maxTokens })` (default = Sonnet `claude-sonnet-4-6`, costura de 003), parse JSON, `validateMirror`, insere snapshot
- [ ] T015 [US1] `src/app/api/mirror/generate/route.ts`: auth → checa entradas → `generateAndSaveMirror` → marca `onboarding_completed` → 200
- [ ] T016 [US1] Refino: funções ≤ 40 linhas, sem `any`, mensagens de erro pt-BR

**Checkpoint**: primeira geração funcional e testada.

---

## Phase 4: User Story 2 — Atualização viva por limiar (P2)

**Goal**: regenerar a cada 3 entradas em background; alimentar `strength_themes` de volta na captura.

**Independent Test**: limiar dispara/não dispara conforme `newTotal - lastCount`.

### Tests (FAIL primeiro)
- [ ] T017 [P] [US2] `tests/unit/maybe-regenerate.test.ts`: dispara em `≥3`; no-op em `<3`; falha de geração loga e preserva snapshot anterior (mock)

### Implementação
- [ ] T018 [US2] `src/lib/ai/mirror/maybeRegenerate.ts`: `maybeRegenerateMirror(userId, newTotal)` com `REGEN_EVERY=3`, client `service_role`, try/catch com log
- [ ] T019 [US2] **Ligar o stub de 003**: `src/lib/ai/extraction/jobs.ts#maybeRegenerateMirror` passa a delegar para o corpo real (sem alterar a chamada em `/api/capture`)
- [ ] T020 [US2] `saveMirrorFeedback` exposto (operação de update `resonated`/`feedback_text`) — UI fica em 006

**Checkpoint**: loop captura↔espelho fechado; regeneração viva ativa.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T021 Auditoria de segurança: auth no topo; `service_role` só server-side com filtro `user_id`; zero dado em log
- [ ] T022 [P] Validar custo/latência aproximados (smoke manual com entradas reais)
- [ ] T023 `test:coverage` ≥ 80%; revisar microcopy de erro
- [ ] T024 Atualizar `quickstart.md`/roadmap se a integração com 003 divergiu

---

## Dependencies & Execution Order

- Setup → Foundational bloqueia stories.
- US1 (MVP) antes de US2 (US2 reusa `generateAndSaveMirror`).
- Dentro de cada story: testes (FAIL) → implementação.
- T019 (ligar stub) só após 003 mergeada e rebase feito.

## Parallel Opportunities
- T006, T007, T010 em paralelo.
- Testes [P] de stories distintas em paralelo.

## Notes
- Commit após cada task/grupo. Verificar testes FALHANDO antes de implementar.
- A UI de revelação (`MirrorReveal`, `/onboarding/espelho`) é da feature 006.
