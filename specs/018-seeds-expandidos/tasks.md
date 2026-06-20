# Tasks: Seeds Expandidos de Post (018)

**Input**: Design documents em `specs/018-seeds-expandidos/`

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Contracts**: [contracts/generate-api.md](./contracts/generate-api.md)

**TDD obrigatório** (constituição VI): testes escritos PRIMEIRO, confirmados RED antes da implementação. Testes são gate de CI — o golden set JÁ É o gate de CI (padrão 015).

## Formato: `[ID] [P?] [Story] Descrição com caminho`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tasks incompletas)
- **[Story]**: user story de origem (US1, US2, US3)

---

## Phase 2: Fundação — US3 Disciplina Anti-Opinião-Vazia (P1, transversal)

**Propósito**: Gate de CI para todos os ângulos. Sem esta fase, o US1 e o US2 não têm cobertura.

**Goal**: `bannedTerms.ts` com assert 11; `validateRuleset.ts` cobrindo os novos termos; golden set com badCases dos 3 termos banidos; `AngleKind` tipado.

**Independent Test**: `npm run test src/lib/ai/content/__tests__/validateRuleset.test.ts` — 3 novos badCases passam no assert 11; asserts 1–10 sem regressão. `npm run test src/lib/ai/content/__tests__/goldenSet.test.ts` — badCases de assert 11 detectados.

> ⚠️ **TDD**: T001 e T002 PRIMEIRO (RED) — verificar que falham antes de T003 e T004.

- [ ] T001 [P] [US3] Escrever testes RED para assert 11 em `src/lib/ai/content/__tests__/validateRuleset.test.ts` — 3 casos: "hot take", "impopular mas", "ninguém fala sobre isso"; confirmar que falham antes de prosseguir
- [ ] T002 [P] [US3] Escrever badCases de assert 11 em `src/lib/ai/content/__tests__/fixtures/goldenSet.ts` e teste correspondente em `src/lib/ai/content/__tests__/goldenSet.test.ts`; confirmar RED
- [ ] T003 [US3] Adicionar `EMPTY_OPINION_TERMS` (3 patterns) em `src/lib/ai/content/bannedTerms.ts` — "hot take", "impopular mas", "ninguém fala sobre isso" (depende de T001 estar RED)
- [ ] T004 [US3] Adicionar assert 11 em `src/lib/ai/content/validateRuleset.ts` usando `EMPTY_OPINION_TERMS` (depende de T003); confirmar que T001 e T002 viram GREEN
- [ ] T005 [P] [US3] Adicionar tipo `AngleKind = 'study' | 'opinion'` em `src/types/content.ts`

**Checkpoint fase 2**: `npm run test` — assert 11 passa, zero regressão nos 10 asserts anteriores.

---

## Phase 3: US1 — Ângulo de Estudo (P1) 🎯 MVP

**Goal**: O motor gera 2 variantes "algo que estudei/aprendi" a partir de qualquer seed (entry/theme/project), ancorando na evidência real. Seletor de ângulo na UI (relato | estudo). Zero path novo de evidência — reusa `loadSeedEvidence`.

**Independent Test**: conta QA → escolher entrada → ângulo "Estudo" → 2 posts que conectam aprendizado à evidência real, passando no ruleset (sem jargão, evidence_refs não-vazio).

> ⚠️ **TDD**: T006 e T007 PRIMEIRO (RED).

### Testes RED para US1

- [ ] T006 [P] [US1] Escrever testes RED em `src/lib/ai/content/__tests__/generateDraft.test.ts` para ângulo 'study': mock do LLM retorna variantes; assertar que `buildPostUserPrompt` recebe `angleKind: 'study'` e que o output passa no ruleset; confirmar RED
- [ ] T007 [P] [US1] Escrever testes RED em `src/components/features/content/__tests__/AngleSelector.test.tsx` para o componente novo: renderiza chips "Relato" e "Estudo"; chip selecionado tem estado ativo; click chama `onSelect` com o ângulo certo; confirmar RED
- [ ] T008 [P] [US1] Escrever testes RED para a rota em `src/app/api/content/generate/__tests__/route.test.ts` — requisição com `angleKind: 'study'` passa pelo schema Zod e chega ao `generateDraft`; confirmar RED

### Implementação US1 — Motor

- [ ] T009 [P] [US1] Estender `ContentPromptInput` com `angleKind?: AngleKind | null` e `thesis?: string | null`; adicionar `buildAngleBlock(input: ContentPromptInput): string` em `src/lib/ai/content/prompts/discipline.ts` (depende de T005; T009 e T010 são paralelos)
- [ ] T010 [US1] Incorporar `buildAngleBlock()` em `buildPostUserPrompt` em `src/lib/ai/content/prompts/post.ts` (depende de T009)
- [ ] T011 [US1] Estender `GenerateDraftInput` (herda de `ContentPromptInput`) em `src/lib/ai/content/generateDraft.ts` para passar `angleKind` e `thesis` ao builder de prompt (depende de T009); confirmar T006 GREEN
- [ ] T012 [P] [US1] Adicionar goodCases de estudo em `src/lib/ai/content/__tests__/fixtures/goldenSet.ts`: 2 variantes com evidence_refs não-vazio, sem assert 11 (depende de T011)

### Implementação US1 — Rota

- [ ] T013 [US1] Estender Zod schema em `src/app/api/content/generate/route.ts` para aceitar `angleKind: z.enum(['study', 'opinion']).nullish()` e `thesis: z.string().max(500).nullish()`; passar `angleKind` e `thesis` para `generateDraft` (depende de T011); confirmar T008 GREEN

### Implementação US1 — UI

- [ ] T014 [P] [US1] Adicionar keys de i18n em `src/messages/pt-BR.json` (`presenca.angles.relato`, `presenca.angles.study`, `presenca.angles.label`) e stub em `src/messages/en.json`
- [ ] T015 [US1] Criar `src/components/features/content/AngleSelector.tsx`: chips "Relato" | "Estudo" com `role="group"`, `aria-label`, touch target ≥ 48px, tokens de cor; usa keys de T014; confirmar T007 GREEN (depende de T014)
- [ ] T016 [US1] Adicionar estado `'angle-select'` no início do fluxo em `src/components/features/content/GenerateSheet.tsx`: sheet abre mostrando seletor de ângulo em vez de gerar imediatamente; clique em "Relato" ou "Estudo" → transição para `'generating'` (depende de T015)

**Checkpoint US1**: teste manual (quickstart US1) + `npm run test` — goodCases de estudo passam no golden set.

---

## Phase 4: US2 — Ângulo de Opinião com Lastro (P2)

**Goal**: O motor gera 2 variantes de "opinião/tese com lastro" (entrada registrada ou vivência dita na hora). Guardrail: `evidence_refs` não-vazio é pré-condição. Chip "Opinião" no seletor. Painel de thesis + lastro. Capture offer quando a vivência é nova. Sem lastro nenhum → erro honesto.

**Independent Test**: conta QA → tese + entrada registrada → 2 posts defendendo a tese com lastro; tese + vivência na hora → posts + `CaptureOffer`; sem lastro → mensagem de erro `opinion_needs_lastro`.

> ⚠️ **TDD**: T017–T020 PRIMEIRO (RED).

### Testes RED para US2

- [ ] T017 [P] [US2] Escrever testes RED em `src/lib/ai/content/__tests__/generateDraft.test.ts` para guardrail de opinião: quando `angleKind: 'opinion'` e TODOS os variants têm `evidence_refs = []` → lança `GenerationFailedError`; confirmar RED
- [ ] T018 [P] [US2] Escrever testes RED na rota em `src/app/api/content/generate/__tests__/route.test.ts` para: `opinion_needs_lastro` (opinion + evidence vazia + sem lastroText → 400); injeção de `lastroText` como `{ label: 'Lastro' }` no array de evidência antes do LLM; confirmar RED
- [ ] T019 [P] [US2] Escrever testes RED para `OpinionPanel` em `src/components/features/content/__tests__/OpinionPanel.test.tsx`: renderiza textarea de thesis; renderiza seletor de lastro (entrada registrada | escrever agora); "escrever agora" exibe textarea de vivência; confirmar RED
- [ ] T020 [P] [US2] Escrever testes RED para `CaptureOffer` em `src/components/features/content/__tests__/CaptureOffer.test.tsx`: renderiza CTA; aceitar chama `onAccept`; recusar chama `onDismiss`; confirmar RED

### Implementação US2 — Motor

- [ ] T021 [US2] Adicionar path de opinião em `buildAngleBlock()` de `src/lib/ai/content/prompts/discipline.ts`: quando `angleKind === 'opinion'`, injeta tese + instrução de ancoragem no lastro (depende de T009)
- [ ] T022 [US2] Adicionar post-gen guardrail de opinião em `src/lib/ai/content/generateDraft.ts`: após tentativas, se `angleKind === 'opinion'` e todos os variants têm `evidence_refs.length === 0` → `GenerationFailedError`; confirmar T017 GREEN (depende de T011)
- [ ] T023 [P] [US2] Adicionar goodCases de opinião e badCase de opinião-sem-anchor em `src/lib/ai/content/__tests__/fixtures/goldenSet.ts` (depende de T021)

### Implementação US2 — Rota

- [ ] T024 [US2] Estender rota em `src/app/api/content/generate/route.ts`: adicionar `lastroText: z.string().max(2000).nullish()` ao schema; pré-check `opinion_needs_lastro` (evidence vazia + sem lastroText + angleKind opinion → 400); injetar `lastroText` como `{ label: 'Lastro', text }` prepended à evidence antes de passar ao `generateDraft`; confirmar T018 GREEN (depende de T013)

### Implementação US2 — UI

- [ ] T025 [P] [US2] Adicionar keys de i18n em `src/messages/pt-BR.json` (`presenca.angles.opinion`, `presenca.opinion.*`, `presenca.captureOffer.*`) e stub em `src/messages/en.json`
- [ ] T026 [US2] Criar `src/components/features/content/OpinionPanel.tsx`: textarea thesis (max 500 chars); seção lastro com 2 opções ("Usar entrada registrada" lista seeds disponíveis | "Escrever agora" exibe textarea de vivência max 2000); usa keys de T025; confirmar T019 GREEN (depende de T025)
- [ ] T027 [US2] Estender `AngleSelector.tsx` para incluir chip "Opinião" e emitir `onSelect('opinion')` em `src/components/features/content/AngleSelector.tsx` (depende de T015)
- [ ] T028 [US2] Criar `src/components/features/content/CaptureOffer.tsx`: card com CTA "Salvar esta vivência como entrada?"; botão aceitar + botão recusar; aceitar → `POST /api/capture` com `content = lastroText`; usa keys de T025; confirmar T020 GREEN (depende de T025)
- [ ] T029 [US2] Integrar `OpinionPanel` e `CaptureOffer` em `src/components/features/content/GenerateSheet.tsx`: quando ângulo = opinion, mostrar `OpinionPanel` no estado `'angle-select'` antes de gerar; após geração bem-sucedida com `lastroText`, exibir `CaptureOffer` abaixo dos cards; mapear erro `opinion_needs_lastro` para mensagem de "falta lastro" (depende de T026, T027, T028)

**Checkpoint US2**: teste manual (quickstart US2a + US2b + US2c) + `npm run test` — goodCases de opinião e badCase de guardrail passam.

---

## Phase 5: Polish & Cross-Cutting

**Propósito**: cobertura de regressão, limpeza e validação final.

- [ ] T030 [P] Verificar cobertura ≥ 80% nos caminhos novos via `npm run test -- --coverage`; adicionar testes de unidade para caminhos descobertos
- [ ] T031 [P] Teste de regressão manual: ângulo "Relato" (comportamento pré-018) continua funcionando; formato "Resumo de impacto" e "Mini-bio" continuam sem seletor de ângulo
- [ ] T032 Rodar quickstart completo (todos os cenários US1, US2a, US2b, US2c, US3 do `quickstart.md`) e confirmar todos os critérios de sucesso SC-001 a SC-007
- [ ] T033 [P] Rodar `/code-review medium` nos arquivos modificados e endereçar issues CRITICAL e HIGH

---

## Dependências & Ordem de Execução

### Dependências entre fases

- **Phase 2 (US3)**: sem dependências — começa imediatamente
- **Phase 3 (US1)**: depende de T005 (AngleKind) da Phase 2
- **Phase 4 (US2)**: depende de T009 (ContentPromptInput estendido), T011 (generateDraft), T013 (rota), T015 (AngleSelector) da Phase 3
- **Phase 5 (Polish)**: depende da conclusão de US1 + US2

### Dependências dentro de cada fase

**US3**:
T001 e T002 em paralelo (RED) → T003 → T004 (GREEN) → T005 (paralelo, sem dep)

**US1**:
T006, T007, T008 em paralelo (RED, sem deps)
T009 (dep T005) e T014 (sem dep) em paralelo
T010 (dep T009) e T015 (dep T014) em paralelo
T011 (dep T009), T012 (dep T011), T013 (dep T011), T016 (dep T015) sequenciais por dep

**US2**:
T017, T018, T019, T020 em paralelo (RED)
T021 (dep T009), T025 (sem dep) em paralelo
T022 (dep T011), T023 (dep T021), T026 (dep T025), T027 (dep T015) em paralelo
T024 (dep T013, T022), T028 (dep T025) em paralelo
T029 (dep T026, T027, T028) último

---

## Oportunidades de Paralelismo

```bash
# Phase 2 — RED em paralelo:
T001: validateRuleset.test.ts — assert 11 badCases RED
T002: goldenSet.ts + goldenSet.test.ts — assert 11 badCases RED

# Phase 3 — RED em paralelo:
T006: generateDraft.test.ts — study angle RED
T007: AngleSelector.test.tsx — componente RED
T008: route.test.ts — angleKind schema RED

# Phase 3 — implementação paralela (arquivos diferentes):
T009: discipline.ts (ContentPromptInput + buildAngleBlock)
T014: pt-BR.json + en.json (i18n)

# Phase 4 — RED em paralelo:
T017: generateDraft.test.ts — opinion guardrail RED
T018: route.test.ts — opinion pre-check + lastroText RED
T019: OpinionPanel.test.tsx — componente RED
T020: CaptureOffer.test.tsx — componente RED
```

---

## Estratégia de Implementação

### MVP — US3 + US1

1. Completar Phase 2 (US3): assert 11 + AngleKind → CI gate estável
2. Completar Phase 3 (US1): ângulo estudo completo ponta-a-ponta
3. **PARAR e VALIDAR**: quickstart US1 + `npm run test` — golden set passa com casos de estudo
4. Entregar US1 se o checkpoint der certo

### Entrega incremental

1. Phase 2 → US3 pronto (CI gate)
2. Phase 3 → US1 pronto (estudo ponta-a-ponta)
3. Phase 4 → US2 pronto (opinião com lastro + capture offer)
4. Phase 5 → polish final + PR review

---

## Notas

- `[P]` = arquivos diferentes, sem dependência de task incompleta na mesma fase
- Cada fase é um incremento independentemente testável
- Testes RED antes da implementação (constituição VI — inegociável)
- `npm run test` deve passar 100% ao final de cada fase antes de avançar
- Commit após cada task ou grupo lógico (`/speckit-git-commit`)
- Antes da UI de US1 e US2: `/impeccable shape` (constituição VII)
- Antes do PR: `/pr-review` (segurança, qualidade, arquitetura, performance, requisitos, regressão)
