---
description: "Task list for 003-capture-pipeline"
---

# Tasks: Pipeline de Captura (Extração + Reflexo)

**Input**: `/specs/003-capture-pipeline/` (plan.md, spec.md, data-model.md, contracts/, research.md)

**Tests**: OBRIGATÓRIOS (constituição — TDD; cobertura ≥ 80%). Escrever testes antes da implementação.

**Referência de código/prompts**: `docs/mvp/004-extraction-pipeline.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência)
- **[Story]**: US1 (captura texto), US2 (import arquivo), US3 (enrich)

---

## Phase 1: Setup

- [ ] T001 Instalar deps: `npm install @anthropic-ai/sdk zod pdf-parse` + `npm install -D @types/pdf-parse`
- [ ] T002 [P] Garantir config Vitest + Testing Library (reusar do 002) e script `test:coverage`
- [ ] T003 [P] Criar `src/lib/log.ts` (logger que NUNCA registra dados de usuário) se não existir

---

## Phase 2: Foundational (bloqueia todas as stories)

**⚠️ Nenhuma story começa antes desta fase.**

- [ ] T004 Criar migration `supabase/migrations/00X_entries.sql` (tabela `entries` + RLS + índice) conforme `data-model.md`
- [ ] T005 **Manual**: aplicar a migration no SQL editor do Supabase
- [ ] T006 [P] Criar tipos `src/types/entry.ts` (`EntrySource`, `ExtractedEntry`, `Entry`)
- [ ] T007 [P] Criar tipos `src/types/capture.ts` (`CaptureInput` com 4 ramos, `Reflection*`, `CaptureContext`, `CaptureResult`)
- [ ] T008 [P] Criar `src/lib/ai/client.ts` (instância Anthropic compartilhada, lê `ANTHROPIC_API_KEY`)
- [ ] T009 Criar `src/lib/ai/extraction/schemas.ts` com Zod (`validateCaptureResult`, `validateEntries`) — **escrever T010 antes**
- [ ] T010 [P] Teste `tests/unit/schemas.test.ts`: valida reflexo (1–4 pills, 1 move, field em question), rejeita JSON malformado (FAIL primeiro)
- [ ] T011 Criar `src/lib/db/entries.ts` (`saveEntries`, `getRecentEntries`, `enrichEntryField`) usando server client autenticado (RLS)
- [ ] T012 [P] Criar `src/lib/ai/extraction/jobs.ts`: `triggerProactiveInsight` e `maybeRegenerateMirror` como **stubs no-op documentados** (costuras p/ 005 e 004)
- [ ] T013 [P] Criar `src/lib/ai/transcribe.ts` como **stub documentado** (áudio futuro — lança "não implementado")
- [ ] T014 [P] Criar `src/lib/pdf/extractText.ts` (wrapper `pdf-parse`)

**Checkpoint**: schema, tipos, validação, persistência e costuras prontos.

---

## Phase 3: User Story 1 — Captura de texto (P1) 🎯 MVP

**Goal**: texto livre → entrada estruturada + reflexo, salvo sem fricção.

**Independent Test**: `POST /api/capture` (kind=text) salva entrada e retorna reflexo válido.

### Tests (FAIL primeiro)
- [ ] T015 [P] [US1] `tests/unit/prompts.test.ts`: `buildCaptureUserPrompt` injeta contexto sem vazar p/ outro usuário; system estável
- [ ] T016 [P] [US1] `tests/unit/context.test.ts`: `buildCaptureContext` retorna `strengthThemes:[]` quando não há mirror (tolerante)
- [ ] T017 [P] [US1] `tests/integration/capture-route.test.ts`: 200 salva entrada; 400 texto<3; 401 sem sessão; 500 se Zod falha (nada persistido)

### Implementação
- [ ] T018 [US1] `src/lib/ai/extraction/prompts/capture.ts`: `CAPTURE_SYSTEM_PROMPT` + `buildCaptureUserPrompt` (doc 004)
- [ ] T019 [US1] `src/lib/ai/extraction/context.ts`: `buildCaptureContext` (mirror tolerante, recent ~5, count)
- [ ] T020 [US1] `src/lib/ai/extraction/captureAndReflect.ts`: chamada Haiku `claude-haiku-4-5`, parse do bloco JSON, `validateCaptureResult`
- [ ] T021 [US1] `src/app/api/capture/route.ts`: auth no topo → validação de borda → normaliza (text) → contexto → `captureAndReflect` → `saveEntries` → dispara jobs (log no catch) → 200. Ramos `audio`/`image` → 501; `file` delega à US2.
- [ ] T022 [US1] Garantir cobertura e refino (funções ≤ 40 linhas, sem `any`, sem catch vazio)

**Checkpoint**: captura de texto funcional e testada isolada.

---

## Phase 4: User Story 2 — Import de arquivo / LinkedIn (P2)

**Goal**: PDF → texto → entradas estruturadas (extração pura). Motor reusado por 006.

**Independent Test**: `extractFromLinkedIn(pdfText)` retorna entradas válidas; rota aceita `kind=file`.

### Tests (FAIL primeiro)
- [ ] T023 [P] [US2] `tests/integration/extract-linkedin.test.ts`: extrai 1..N entradas válidas; respeita `maxEntries`
- [ ] T024 [P] [US2] Estender `capture-route.test.ts`: `kind=file` válido salva entradas; não-PDF → 400; >10MB → 400

### Implementação
- [ ] T025 [US2] `src/lib/ai/extraction/prompts/linkedin.ts`: `LINKEDIN_SYSTEM_PROMPT` + `buildLinkedInUserPrompt`
- [ ] T026 [US2] `src/lib/ai/extraction/extractEntries.ts`: base de extração pura (Haiku, validação Zod, `maxEntries`)
- [ ] T027 [US2] `src/lib/ai/extraction/extractFromLinkedIn.ts`: wrapper sobre `extractEntries` (source `linkedin_pdf`, máx 20)
- [ ] T028 [US2] Ramo `file` em `/api/capture`: `extractTextFromPDF` → extração → `saveEntries` (validação de borda PDF/10MB)

**Checkpoint**: import de arquivo funcional; `extractFromLinkedIn` pronto para 006.

---

## Phase 5: User Story 3 — Enriquecimento sem IA (P3)

**Goal**: resposta do usuário vira valor de campo, sem LLM, respeitando RLS.

**Independent Test**: `PATCH /api/entries/:id/enrich` atualiza campo do próprio usuário; bloqueia de outros.

### Tests (FAIL primeiro)
- [ ] T029 [P] [US3] `tests/integration/enrich-route.test.ts`: 200 atualiza campo; 400 field inválido; entrada de outro usuário não é alterada (RLS)

### Implementação
- [ ] T030 [US3] `src/app/api/entries/[id]/enrich/route.ts`: auth → valida `field` (conjunto fechado) + `answer` → `enrichEntryField` (sem IA) → 200

**Checkpoint**: enrich funcional e seguro.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T031 [P] Revisar mensagens de erro (constantes pt-BR) e alinhar microcopy ao doc 004
- [ ] T032 Auditoria de segurança: auth no topo de todas as rotas; RLS; zero dado em log; sem segredo no client
- [ ] T033 Rodar `test:coverage` e confirmar ≥ 80% nos módulos de extração/validação/rota
- [ ] T034 Atualizar `quickstart.md` se algo divergiu; deixar costuras (jobs, audio/image) claramente marcadas para 004/005

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** bloqueia tudo.
- **US1 (P3 fase)** é o MVP; **US2** e **US3** dependem só da Foundational e podem seguir em paralelo após US1.
- Dentro de cada story: testes (FAIL) → implementação → refino.
- Costuras `jobs.ts` (T012) e ramos 501 (T021) não devem ser removidas — são preenchidas por 004/005.

## Parallel Opportunities

- T006, T007, T008 em paralelo (arquivos distintos).
- Testes marcados [P] de stories diferentes em paralelo.
- T013 (transcribe stub) e T014 (pdf) independentes.

## Notes

- Commit após cada task ou grupo lógico.
- Verificar que cada teste FALHA antes de implementar.
- `maybeRegenerateMirror` será ligado de verdade na feature 004; `triggerProactiveInsight` na 005.
