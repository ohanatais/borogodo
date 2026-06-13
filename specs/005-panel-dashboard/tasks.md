---
description: "Task list for 005-panel-dashboard"
---

# Tasks: Painel Principal (Espelho Vivo + Composer)

**Input**: `/specs/005-panel-dashboard/` (plan.md, spec.md, data-model.md, contracts/, research.md, shape.md)

**Tests**: OBRIGATÓRIOS (TDD; cobertura ≥ 80%).

**Pré-requisito**: 003 e 004 mergeadas → `git rebase main`. Rodar `/impeccable shape` (já em `shape.md`) antes da UI; `/impeccable audit` antes do PR.

**Referência (layout/microcopy)**: `docs/mvp/002-panel-skeleton.md`.

## Format: `[ID] [P?] [Story] Description`

- US1 = capturar pelo composer; US2 = ler espelho+indicadores; US3 = insight+recentes.

---

## Phase 1: Setup

- [ ] T001 `git rebase main`; confirmar `/api/capture`, `/enrich`, `mirror_snapshots`, tipos disponíveis
- [ ] T002 [P] Garantir grupo de rota `(app)` protegido pelo middleware (002) cobrindo `/painel`
- [ ] T003 [P] Criar namespaces i18n em `src/messages/pt-BR.json` (+ stub `en.json`): `panel.*`, `capture.*`

---

## Phase 2: Foundational (bloqueia stories)

- [ ] T004 Migration `supabase/migrations/00X_proactive_insights.sql` (+ RLS + índice) — `data-model.md`
- [ ] T005 **Manual**: aplicar a migration no Supabase
- [ ] T006 [P] `src/types/insight.ts` (`ProactiveInsight`)
- [ ] T007 [P] Lógica pura `src/lib/panel/getMirrorStatus.ts` (+ `STATUS_CONFIG`) — escrever T008 antes
- [ ] T008 [P] `tests/unit/getMirrorStatus.test.ts` (building/emerging/active nos limiares) (FAIL primeiro)
- [ ] T009 [P] Lógica pura `src/lib/panel/getCapturePrompt.ts` — escrever T010 antes
- [ ] T010 [P] `tests/unit/getCapturePrompt.test.ts` (null/0/1/≤3/themes/7+) (FAIL primeiro)
- [ ] T011 [P] `src/components/layout/AppHeader.tsx` (marca + avatar/menu)

**Checkpoint**: schema, tipos e lógica derivada prontos.

---

## Phase 3: User Story 1 — Capturar pelo composer (P1) 🎯 MVP

**Goal**: composer ancorado → sheet de captura → reflexo → resolve pra cima (indicadores sobem).

**Independent Test**: digitar no composer abre o sheet, mostra reflexo de `/api/capture`, resolve e atualiza indicadores.

### Tests (FAIL primeiro)
- [ ] T012 [P] [US1] `tests/integration/capture-flow.test.tsx`: composer→sheet(reading→reflecting)→resolve chama `router.refresh`; estado de erro mostra retry (mock `/api/capture`)
- [ ] T013 [P] [US1] Teste: botões de áudio/imagem `disabled` com tooltip "em breve"

### Implementação (superfície canônica `capture/*`)
- [ ] T014 [P] [US1] `ReadingState.tsx` (animação "Lendo o que você me contou...")
- [ ] T015 [P] [US1] `ReflectionCard.tsx` (resumo + pílulas + movimento; botões "Responder"/"Salvar assim")
- [ ] T016 [P] [US1] `FileButton.tsx` (upload PDF, accept e validação client)
- [ ] T017 [P] [US1] `AudioButton.tsx` **desabilitado** (tooltip "em breve") — costura
- [ ] T018 [US1] `CaptureConversation.tsx` ("use client"): fases reading/reflecting/error; `POST /api/capture`; `router.refresh()`; enrich no movimento "pergunta"; Framer Motion na entrada
- [ ] T019 [US1] `CaptureComposer.tsx` ("use client"): textarea + botões; texto+arquivo ativos; abre `CaptureConversation`; recebe `placeholder` por prop (desacoplado p/ reuso em 006)
- [ ] T020 [US1] Acessibilidade do sheet: focus trap, ESC fecha, `aria`, toques ≥ 48px

**Checkpoint**: gesto central de captura funcional na casa dele.

---

## Phase 4: User Story 2 — Ler espelho + indicadores (P1)

**Goal**: valor acima da dobra ao chegar; indicadores que provam o trabalho.

**Independent Test**: `/painel` mostra headline (ou fallback) + indicadores + pill de status correta.

### Tests (FAIL primeiro)
- [ ] T021 [P] [US2] Teste de render: `MirrorHeadline` com/sem snapshot; `IndicatorStrip` com variações de tempo

### Implementação
- [ ] T022 [US2] `src/app/(app)/painel/page.tsx` (RSC): auth + `Promise.all` das 4 leituras; deriva `daysSince`, placeholder, status
- [ ] T023 [P] [US2] `MirrorHeadline.tsx` (headline + pill cromática + link `/espelho`; fallback "se formando")
- [ ] T024 [P] [US2] `IndicatorStrip.tsx` (N entradas · X meses · Y forças · há Z dias, microcopy sem culpa)
- [ ] T025 [P] [US2] `src/app/(app)/painel/loading.tsx` (skeleton)
- [ ] T026 [US2] Montar a página: header + headline + indicadores + composer (placeholder contextual)

**Checkpoint**: "o painel é o espelho" — valor visível em 1s.

---

## Phase 5: User Story 3 — Insight proativo + recentes (P2)

**Goal**: surfar 1 insight não visto (ou nada); 3 entradas recentes com ícone por fonte.

**Independent Test**: card aparece só com insight não visto; some sem; recentes renderizam.

### Tests (FAIL primeiro)
- [ ] T027 [P] [US3] `tests/unit/ProactiveInsightCard.test.tsx`: não renderiza sem insight; renderiza e marca `seen` ao exibir

### Implementação
- [ ] T028 [P] [US3] `ProactiveInsightCard.tsx` (render condicional; marca `seen`)
- [ ] T029 [P] [US3] `RecentEntries.tsx` + `EntryItem.tsx` (máx 3, ícone por `source`, expansão in-place)
- [ ] T030 [US3] `src/lib/ai/insights/triggerProactiveInsight.ts` (Haiku; valida Zod; insere `proactive_insights`; evita acumular > 1 não visto)
- [ ] T031 [US3] **Ligar o stub de 003**: `jobs.ts#triggerProactiveInsight` delega ao corpo real (chamada em `/api/capture` intacta)
- [ ] T032 [US3] Inserir card + recentes na página

**Checkpoint**: inteligência proativa visível; painel completo.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T033 i18n: garantir zero string hardcoded; `en.json` espelha `pt-BR.json`
- [ ] T034 Acessibilidade: headings em ordem, contraste AA, foco visível, toques 48px
- [ ] T035 **`/impeccable audit`** (Princípios V, VII, VIII, IX) — revisar a 375px
- [ ] T036 Segurança: auth no topo; RLS; job de insight com `service_role` filtrando `user_id`; zero dado em log
- [ ] T037 `test:coverage` ≥ 80%

---

## Dependencies & Execution Order

- Setup → Foundational bloqueia stories.
- US1 e US2 são P1 (MVP). US1 entrega a superfície de captura (reusada por 006) — priorizar para destravar 006.
- US3 (P2) depois.
- Dentro de cada story: testes (FAIL) → componentes → integração.
- T031 (ligar stub) após 003 mergeada.

## Parallel Opportunities
- T006–T011 em grande parte paralelos.
- Componentes de `capture/*` (T014–T017) em paralelo.
- Componentes de leitura (T023–T025) em paralelo.

## Notes
- Commit após cada task/grupo. Testes FALHANDO antes de implementar.
- `capture/*` deve ficar desacoplado do painel (props + callbacks) para reuso intacto em 006.
- Não remover `AudioButton`/ramos de áudio — costuras para o futuro.
