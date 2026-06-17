---
description: "Task list — Autoavaliação de Desempenho (019)"
---

# Tasks: Autoavaliação de Desempenho

**Input**: Design documents from `/specs/019-autoavaliacao/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: incluídos — TDD é obrigatório (constituição VI, RED→GREEN, cobertura ≥ 80%).

**Organização**: por user story. US1 (P1) é o MVP e entrega valor sozinha. US2 (P2) depende da
Foundational + reusa a superfície da 016 (já em `main`). US3 (P2) é reuso quase total da 013.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- Caminhos exatos no texto de cada task

## Path Conventions

Web app Next.js full-stack — `src/` na raiz (motor em `src/lib/ai/content`, painel em `src/lib/panel`,
rota em `src/app/api/content`, UI em `src/components/features` + `src/app`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: nada de scaffolding novo — projeto já existe. Só preparar o que toda a feature usa.

- [ ] T001 Estender os tipos do domínio em `src/types/content.ts`: `DraftFormat` += `'self_assessment'`; `SeedType` += `'period'`
- [ ] T002 [P] Adicionar as chaves de UI da feature em `src/messages/pt-BR.json` e espelhar em `src/messages/en.json` (tela de autoavaliação, presets de período, seções, convite do gatilho, estados de erro/base limitada) — zero string hardcoded

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema e contrato base que US1 e US2 dependem.

**⚠️ CRITICAL**: nenhuma US começa antes desta fase.

- [ ] T003 Criar `supabase/migrations/012_self_assessment_and_review_cycle.sql`: drop+recriar `drafts_format_check` incluindo `'self_assessment'` (padrão do `010`); estender o CHECK de `seed_type` para `'period'` se existir (verificar na `009`); `alter table profiles add column if not exists review_cycle_months smallint, review_cycle_anchor date` (aditivo, nullable)
- [ ] T004 Aplicar a migration 012 **no projeto dev** do Supabase e confirmar (não tocar prod ainda — seguir a ordem dos elos)
- [ ] T005 Estender os enums de validação da rota em `src/app/api/content/generate/route.ts`: `format` += `'self_assessment'`, `seedType` += `'period'` no `generateRequestSchema`

**Checkpoint**: schema e contrato aceitam o novo formato e o seed por período.

---

## Phase 3: User Story 1 — Gerar a autoavaliação do período (Priority: P1) 🎯 MVP

**Goal**: a pessoa escolhe um período e recebe 2 autoavaliações estruturadas por seções, ancoradas em
evidência real, sem inventar número, com pontos a desenvolver ancorados.

**Independent Test**: conta QA com entradas no tempo → escolher período → 2 autoavaliações que agregam
o intervalo, ancoradas, sem número inventado, passando no anti-IA; período vazio → base limitada, sem
fabricar.

### Tests for User Story 1 (RED primeiro)

- [ ] T006 [P] [US1] Teste de `parsePeriodSeedRef` + presets em `src/lib/content/__tests__/period.test.ts`: serializa/parseia `period:::<from>:::<to>`, rejeita range inválido (`from > to`, datas não-parseáveis), resolve presets `este_ano`/`ultimo_ciclo` para range
- [ ] T007 [P] [US1] Teste de `loadPeriodSeed` em `src/lib/ai/content/__tests__/loadSeed.test.ts`: filtra `entries` por intervalo (escopado por `user_id`), aplica limite seguro, intervalo vazio → `evidence: []` (não fabrica)
- [ ] T008 [P] [US1] Teste do formato `self_assessment` em `src/lib/ai/content/__tests__/generateDraft.test.ts` e `schemas.test.ts`: `promptFor('self_assessment')` usa o prompt próprio; saída tem as 4 seções no `body`; passa no ruleset; pontos a desenvolver ancorados; valida via o mesmo caminho (SC-003)
- [ ] T009 [P] [US1] Teste de rota em `src/app/api/content/generate/__tests__/route.test.ts`: `format=self_assessment` + `seedType=period` → 200 com 2 variações; `seedRef` de período malformado → 400; período sem evidência do usuário → 404; auth-first (401 sem sessão)

### Implementation for User Story 1

- [ ] T010 [US1] Criar `src/lib/content/period.ts`: presets (`este_ano`, `ultimo_ciclo`) → `{ from, to }`; `serializePeriodSeedRef`/`parsePeriodSeedRef` (`period:::<from>:::<to>`) com validação de datas e ordem (espelha `parseProjectSeedRef`)
- [ ] T011 [US1] Adicionar `loadPeriodSeed` em `src/lib/ai/content/loadSeed.ts` e ligá-lo no `loadSeedEvidence` para `seedType === 'period'`: filtra `entries` por `entry_date`/`created_at` no intervalo, escopado por `user_id`, com `MAX_PERIOD_EVIDENCE` (constante nomeada) priorizando recentes/relevantes
- [ ] T012 [P] [US1] Criar `src/lib/ai/content/prompts/selfAssessment.ts`: `SELF_ASSESSMENT_SYSTEM_PROMPT` (herda `ANTI_AI_DISCIPLINE` + `OUTPUT_CONTRACT`) ensinando as 4 seções (Entregas / Impacto / Evolução / Pontos a desenvolver) no `body`, com pontos a desenvolver ancorados em sinal honesto/intenção informada (proíbe fraqueza inventada); `buildSelfAssessmentUserPrompt`
- [ ] T013 [US1] Adicionar `selfAssessmentDraftSchema` em `src/lib/ai/content/schemas.ts` e registrar no `SCHEMA_BY_FORMAT` (mesma forma de 2 variantes; nomeado à parte p/ poder divergir)
- [ ] T014 [US1] Adicionar o ramo `'self_assessment'` no `promptFor` de `src/lib/ai/content/generateDraft.ts` (system + buildUser do novo prompt)
- [ ] T015 [US1] Criar a rota dedicada `src/app/[locale]/(app)/autoavaliacao/page.tsx` (RSC) com headline (assinatura Fraunces bold+itálico) + `PeriodPicker` client em `src/components/features/autoavaliacao/PeriodPicker.tsx`: presets como chips (este ano · último ciclo, "este ano" pré-selecionado) + range personalizado com dois `<input type="date">` revelados inline; mobile-first, alvos ≥48px, labels acessíveis. "Gerar autoavaliação" dispara `openPresenca` com `seedType:'period'` e o `seedRef` serializado (reusa o `GenerateSheet` montado no AppShell)
- [ ] T016 [US1] Estender o `DraftCard` (`src/components/features/content/DraftCard.tsx`) para renderizar o `body` **por seções** quando `format === 'self_assessment'` (parser leve de cabeçalhos Entregas/Impacto/Evolução/Pontos a desenvolver → blocos com cabeçalho próprio, hierarquia de *product*); "Pontos a desenvolver" com o mesmo tratamento visual das outras (enquadrado como crescimento, sem cor de alerta). Os estados de base limitada e erro 422 já vêm do `GenerateSheet`
- [ ] T016b [US1] Registrar `self_assessment` em `FORMAT_LABEL_KEY` do `GenerateSheet.tsx` e garantir o header "Baseado em: <período>" usando o `seedSummary` do intervalo

**Checkpoint**: US1 funcional e testável sozinha — MVP. **PARAR e validar com a Ohana** (quickstart).

---

## Phase 4: User Story 2 — Gatilho de calendário no painel (Priority: P2)

**Goal**: o painel ressurge a autoavaliação no ritmo do ciclo (recorrência configurável), só painel,
sem e-mail; com poucos dados recentes, convida a registrar antes.

**Independent Test**: configurar recorrência + ciclo próximo → painel mostra o convite ancorado no
calendário; editar recorrência → gatilho muda; sem recorrência → nada forçado, US1 segue.

### Tests for User Story 2 (RED primeiro)

- [ ] T017 [P] [US2] Teste de `getReviewCycleSignal` em `src/lib/panel/__tests__/getReviewCycleSignal.test.ts`: sem `review_cycle_months`/anchor → `{type:'none'}`; ciclo próximo + dados → `approaching/generate`; ciclo próximo + poucos dados → `approaching/feed-first`; recorrência editada respeitada (`now` injetável)

### Implementation for User Story 2

- [ ] T018 [US2] Criar `src/lib/panel/getReviewCycleSignal.ts` puro (input: `reviewCycleMonths`, `reviewCycleAnchor`, `now`, `hasRecentEntries`; output: `none | approaching{generate|feed-first}`) com janela de proximidade como constante nomeada
- [ ] T019 [US2] Integrar o sinal no `src/lib/panel/getPanelData.ts`: ler `review_cycle_months`/`anchor` do `profiles`, computar `hasRecentEntries`, expor o convite ao painel (paralelo ao `getReturnSignal`, sem acoplar à lógica de delta da 016)
- [ ] T020 [P] [US2] Renderizar o convite no painel reusando a superfície de ressurgimento (link para a tela da autoavaliação; copy sem cobrança; "registre antes" quando `feed-first`) — `src/components/features/painel/...`
- [ ] T021 [US2] Permitir editar a recorrência do ciclo nas configurações (`review_cycle_months`/`anchor`) reusando o fluxo de `/configuracoes`; persistir em `profiles` (RLS)

**Checkpoint**: US1 + US2 funcionam de forma independente; sem recorrência nada é forçado.

---

## Phase 5: User Story 3 — Ajustar, copiar e levar (Priority: P2)

**Goal**: editar, aplicar chips de ajuste e copiar a autoavaliação — reuso do fluxo da 013.

**Independent Test**: com uma autoavaliação gerada, editar (marca `edited`), aplicar "mais conciso"
(encurta mantendo evidência, passa anti-IA), copiar (marca `copied`).

### Tests for User Story 3 (RED primeiro)

- [ ] T022 [P] [US3] Teste de integração do lifecycle do `self_assessment` em `src/app/api/content/drafts/__tests__/route.test.ts`: persistir/editar/copiar/descartar um draft `format=self_assessment` (mesmo lifecycle e RLS dos demais)

### Implementation for User Story 3

- [ ] T023 [US3] Garantir que o `DraftCard` estendido (T016) preserva edição inline / cópia / persistência (`/api/content/drafts`) com o render por seções — editar não pode quebrar o parser de seções; copiar leva o texto completo das 4 seções
- [ ] T024 [US3] Conferir que os chips de ajuste (`mais_curto`/`menos_formal`/`tira_jargao`) regeram o `self_assessment` mantendo a evidência (reuso de `buildAdjustBlock`)

**Checkpoint**: as três stories independentemente funcionais.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T025 [P] `/impeccable audit` + `web-design-guidelines` na tela de autoavaliação (a11y, hierarquia de headings das seções, tokens, mobile-first)
- [ ] T026 [P] Rodar `npm run test` e confirmar cobertura ≥ 80% nos caminhos novos (period, loadPeriodSeed, prompt/schema, getReviewCycleSignal, lifecycle)
- [ ] T027 `/code-review high` no diff da feature; endereçar CRITICAL/HIGH
- [ ] T028 Rodar a validação manual do `quickstart.md` com a Ohana (SC-008) antes do PR
- [ ] T029 Atualizar `docs/aprendizados.md` se algo não-óbvio surgir (decisão da Ohana); aplicar migration 012 em **prod** só na hora do merge, respeitando a ordem dos elos
- [ ] T030 `/pr-review` (6 subagentes) antes de abrir/mergear o PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: imediato.
- **Foundational (Phase 2)**: depende do Setup — **BLOQUEIA** todas as US (migration + enums da rota).
- **US1 (Phase 3)**: depende da Foundational. É o MVP.
- **US2 (Phase 4)**: depende da Foundational (precisa das colunas de recorrência da migration 012). Independe da US1 em lógica, mas o convite **leva** à tela da US1.
- **US3 (Phase 5)**: depende da US1 existir (precisa de uma autoavaliação gerada para editar/copiar).
- **Polish (Phase 6)**: depende das US desejadas prontas.

### User Story Dependencies

- **US1 (P1)**: sem dependência de outra story.
- **US2 (P2)**: independe da US1 em lógica; usa as colunas da migration (Foundational) e a superfície da 016.
- **US3 (P2)**: reuso da 013; precisa de uma autoavaliação gerada (US1) para ter o que ajustar/copiar.

### Within Each User Story

- Testes (RED) antes da implementação.
- `period.ts` antes de `loadPeriodSeed`; prompt+schema antes do ramo no `generateDraft`; motor antes da UI.

### Parallel Opportunities

- T002 ‖ T001 (arquivos diferentes).
- Testes RED da US1 (T006–T009) em paralelo.
- T012 (prompt) ‖ T013 (schema) — arquivos diferentes; ambos antes de T014.
- US2 e US3 podem andar em paralelo após a Foundational + US1 (motor pronto), por pessoas diferentes.

---

## Parallel Example: User Story 1

```bash
# Testes RED da US1 juntos:
Task: "T006 period.test.ts"
Task: "T007 loadSeed.test.ts (loadPeriodSeed)"
Task: "T008 generateDraft/schemas test (self_assessment)"
Task: "T009 route.test.ts (period + self_assessment)"

# Prompt e schema em paralelo (antes do ramo no generateDraft):
Task: "T012 prompts/selfAssessment.ts"
Task: "T013 schemas.ts (selfAssessmentDraftSchema)"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational (migration + enums) → 3. Phase 3 US1 →
4. **PARAR e validar com a Ohana** → 5. demo/checkpoint.

### Incremental Delivery

Foundational → US1 (MVP, valida) → US2 (gatilho) → US3 (ajuste/cópia) → Polish → PR. Cada story
adiciona valor sem quebrar a anterior.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente.
- TDD: confirmar que o teste FALHA antes de implementar.
- Commit por task ou grupo lógico (convenção do projeto: review por fase, `/code-review` no fim de cada fase).
- Parar nos checkpoints para validar com a Ohana (constituição do colaborador).
- Migration em prod **só no merge**, respeitando a ordem dos elos paralelos.
