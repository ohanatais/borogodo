---
description: "Task list — Autoavaliação de Desempenho (019, modelo cockpit)"
---

# Tasks: Autoavaliação de Desempenho (modelo cockpit)

**Input**: Design documents from `/specs/019-autoavaliacao/`
**Prerequisites**: plan.md, spec.md (Clarifications 2026-06-19 + clarify pós-plan), research.md
(D1–D9), data-model.md, contracts/self-assessment.md, quickstart.md

**Tests**: TDD é **obrigatório** (constituição VI) — tasks de teste vêm primeiro (RED) em cada história.

**Organização**: por user story (US1 P1 → US2 P2 → US3 P2). Modelo cockpit: a pessoa **escreve**; a IA
**ancora**. `generateDraft` deixa de gerar a autoavaliação (research D1).

> **Gate antes de codar UI:** rodar `/impeccable shape` da cabine de escrita (período → recap → editor
> → passo-pra-frente). Ver T015 abaixo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1 / US2 / US3 nas fases de história

---

## Phase 1: Setup (infra compartilhada)

**Purpose**: tipos, migration e i18n que todas as histórias usam.

- [ ] T001 Estender `DraftStatus` para incluir `'draft'` e adicionar o tipo `ForwardStep` (kind, anchoredOn, actionPlan, generatedAt) em `src/types/content.ts` (data-model §Tipos)
- [ ] T002 Aplicar a migration `supabase/migrations/013_self_assessment_and_review_cycle.sql` no projeto **dev** do Supabase e confirmar os CHECKs de `format`/`seed_type`/`status` + colunas de recorrência (data-model §Migration 013)
- [ ] T003 [P] Criar o namespace `autoavaliacao` de strings do cockpit em `src/messages/pt-BR.json` (recap, seções, ajudas da IA, passo-pra-frente, base limitada) — fonte autoritativa (constituição IX)

**Checkpoint**: tipos + schema + i18n prontos.

---

## Phase 2: Foundational (pré-requisitos bloqueantes)

**Purpose**: remover o modelo de geração da autoavaliação **antes** de construir a cabine, para o
caminho ficar limpo (research D1). Bloqueia as histórias.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [ ] T004 Remover o ramo `'self_assessment'` do `promptFor` em `src/lib/ai/content/generateDraft.ts` e o import do prompt (volta ao estado pré-46 para este formato)
- [ ] T005 [P] Remover `src/lib/ai/content/prompts/selfAssessment.ts` (`SELF_ASSESSMENT_SYSTEM_PROMPT`/`buildSelfAssessmentUserPrompt`) e seus testes (era prompt de geração)
- [ ] T006 Remover `'self_assessment'` do enum `format` em `src/app/api/content/generate/route.ts` (a autoavaliação não passa mais por geração); reavaliar se `'period'` no `seedType` ainda tem uso fora da autoavaliação — se não, remover também — e ajustar os testes da rota
- [ ] T007 [P] Reverter a fiação da `src/components/features/content/GenerateSheet.tsx` para a autoavaliação (o modelo de post não é a superfície da autoavaliação) — remover o destino self_assessment do sheet
- [ ] T008 Confirmar que `loadPeriodSeed`/`period.ts`/`PeriodPicker` (PR 46) seguem intactos e cobertos — são a fundação do recap e da trilha (research D1; sem reescrita, só verificação + teste se faltar)

**Checkpoint**: modelo de geração da autoavaliação removido; fundação de período preservada.

---

## Phase 3: User Story 1 — Lembrar, refletir e escrever (Priority: P1) 🎯 MVP

**Goal**: a pessoa escolhe um período, vê o recap factual com fontes e **escreve** a própria
autoavaliação, com trilha de evidências e IA não-invasiva (reescrever / "não sei por onde começar" /
nudge STAR), nunca gerando
bloco nem dando nota. Salva como autoavaliação dela em `drafts`, isolada do espelho.

**Independent Test**: conta QA com entradas no tempo → período → recap factual com fonte (sem LLM) →
escrita nas seções com trilha ao lado → IA só assiste → salvar (`status='draft'`) → o texto **não**
aparece no espelho/`entries`.

### Tests for User Story 1 (RED primeiro) ⚠️

- [ ] T009 [P] [US1] Teste do recap determinístico (cada item com fonte, zero adjetivo, base limitada → convida a registrar) em `src/lib/autoavaliacao/__tests__/periodRecap.test.ts`
- [ ] T010 [P] [US1] Teste dos sentence-stems ancorados no seed do período em `src/lib/autoavaliacao/__tests__/sentenceStems.test.ts`
- [ ] T011 [P] [US1] Teste do `assist` nos 3 modos: `rephrase` (só reformula o texto), `unblock` (1 pergunta), `star_nudge` (heurística, nunca propõe número) — nenhum retorna fato novo — em `src/lib/ai/content/__tests__/assist.test.ts`
- [ ] T012 [P] [US1] Teste de contrato da rota `POST /api/autoavaliacao/assist` (auth-first, validação Zod, degrada para "sem sugestão" em falha) em `src/app/api/autoavaliacao/assist/__tests__/route.test.ts`
- [ ] T013 [P] [US1] Teste de isolamento: autoavaliação salva (`format='self_assessment'`, `status='draft'`) **não** aparece como evidência no espelho/`entries` em `src/lib/autoavaliacao/__tests__/isolation.test.ts`

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implementar `loadPeriodRecap` (determinístico, sobre `loadPeriodSeed`, item+fonte, flag `isLimited`) em `src/lib/autoavaliacao/periodRecap.ts` (research D2; contracts §1)
- [ ] T015 [US1] **Gate de UX**: rodar `/impeccable shape` da cabine (período → recap → editor por seções com trilha → ajudas da IA) antes dos componentes; registrar o brief em `specs/019-autoavaliacao/design-brief.md`
- [ ] T016 [P] [US1] Implementar `buildSentenceStems` (moldes ancorados nos itens do seed) em `src/lib/autoavaliacao/sentenceStems.ts` (research D6)
- [ ] T017 [P] [US1] Implementar `assist` — `rephrase`/`unblock` via `claude-sonnet-4-6`; `star_nudge` heurístico (detecção determinística de ausência de número/resultado) — em `src/lib/ai/content/assist.ts` (research D3)
- [ ] T018 [US1] Implementar a rota `POST /api/autoavaliacao/assist` (auth-first, Zod, sanitização antes do LLM, sem dado de outro usuário) em `src/app/api/autoavaliacao/assist/route.ts` (contracts §2) — depende de T017
- [ ] T019 [P] [US1] Componente `YearInFactsRecap` (lista factual + chips de fonte clicáveis + estado base limitada) em `src/components/features/autoavaliacao/YearInFactsRecap.tsx` — depende de T014
- [ ] T020 [US1] Componente `AssessmentEditor` (escrita por seções como **andaime opcional**, trilha de evidências ao lado/colapsável no mobile, botões de ajuda da IA com aceitar/rejeitar/editar, nudge STAR) em `src/components/features/autoavaliacao/AssessmentEditor.tsx` — depende de T016, T018, T019
- [ ] T021 [US1] Fiação da `src/app/[locale]/(app)/autoavaliacao/page.tsx`: período (`PeriodPicker`) → recap → editor; salvar via `POST /api/content/drafts` com `status='draft'` (reuso) — depende de T020
- [ ] T022 [US1] Validação/erro/empty/loading na cabine (base limitada convida a registrar; falha do assist degrada sem bloquear a escrita) e strings em `pt-BR.json`

**Checkpoint**: US1 funcional e testável — a pessoa escreve a autoavaliação dela, a IA só ancora.

---

## Phase 4: User Story 2 — Um passo à frente, sem ser invasivo (Priority: P2)

**Goal**: após escrever, **uma** oferta opcional ancorada nas palavras da pessoa: plano de ação
(GROW Will + 70-20-10, uma ação de experiência). Recusar segue sem nag; aceitar + definir data grava a
recorrência (gatilho ético). Painel ressurge a autoavaliação na recorrência (reusa 016).

**Independent Test**: autoavaliação escrita → oferta única citando o que ela escreveu → plano ancorado,
nada inventado → recusar = sem nag → aceitar + data grava `review_cycle_*` → painel convida na
recorrência; sem recorrência, nada forçado.

### Tests for User Story 2 (RED primeiro) ⚠️

- [ ] T023 [P] [US2] Teste do `forwardStep`: conteúdo deriva **só** do `body`; anti-invenção bloqueante (inventou área/inflou caso → falha + 1 retry → erro honesto) em `src/lib/ai/content/__tests__/forwardStep.test.ts`
- [ ] T024 [P] [US2] Teste de contrato da rota `POST /api/autoavaliacao/forward-step` (auth, draft do usuário, persiste em `drafts.qa.forwardStep`) em `src/app/api/autoavaliacao/forward-step/__tests__/route.test.ts`
- [ ] T025 [P] [US2] Teste do `getReviewCycleSignal` (none / approaching+write / approaching+feed-first; `now` injetável; sem recorrência → none) em `src/lib/panel/__tests__/getReviewCycleSignal.test.ts`

### Implementation for User Story 2

- [ ] T026 [P] [US2] Implementar `forwardStep` (plano GROW+70-20-10, `claude-sonnet-4-6`, insumo só o `body`, ruleset anti-IA + checagem anti-invenção antes de persistir) em `src/lib/ai/content/forwardStep.ts` (research D5)
- [ ] T027 [US2] Rota `POST /api/autoavaliacao/forward-step` (auth-first, lê o draft escopado por `user_id`, grava `qa.forwardStep`) em `src/app/api/autoavaliacao/forward-step/route.ts` (contracts §3) — depende de T026
- [ ] T028 [P] [US2] Implementar `getReviewCycleSignal` (paralelo ao `getReturnSignal` da 016; lê `review_cycle_months`/`anchor`) em `src/lib/panel/getReviewCycleSignal.ts` (research D7; contracts §6)
- [ ] T029 [US2] Integrar o sinal de ciclo ao painel em `src/lib/panel/getPanelData.ts` (convite "escrever"/"registrar antes"; sem e-mail) — depende de T028
- [ ] T030 [US2] Componente `ForwardStepOffer` (oferta única, opcional, cita o que a pessoa escreveu; recusar = sem nag; aceitar abre data de revisão) em `src/components/features/autoavaliacao/ForwardStepOffer.tsx` — depende de T027
- [ ] T031 [US2] Persistir a data de revisão em `profiles.review_cycle_months`(default 3)/`review_cycle_anchor` ao aceitar (rota de perfil/transação) e fiar `ForwardStepOffer` no fim da `page.tsx` — depende de T030
- [ ] T032 [US2] Strings do passo-pra-frente e do convite de painel em `pt-BR.json`

**Checkpoint**: US1 + US2 funcionam; o passo-pra-frente nunca inventa; o gatilho é ético.

---

## Phase 5: User Story 3 — Histórico de autoavaliações (Priority: P2)

**Goal**: a pessoa acessa as autoavaliações que escreveu (período + data), reabre e edita; separado do
feed e do espelho (vive em `drafts`).

**Independent Test**: abrir `/autoavaliacao` → lista das anteriores → reabrir/editar; `entries`/espelho
não mostram as autoavaliações.

### Tests for User Story 3 (RED primeiro) ⚠️

- [ ] T033 [P] [US3] Atualizar `src/components/features/autoavaliacao/__tests__/SelfAssessmentHistory.test.tsx` para o cockpit (drafts `status='draft'`/`copied`, sem variações geradas; reabrir/editar)

### Implementation for User Story 3

- [ ] T034 [US3] Adaptar `src/components/features/autoavaliacao/SelfAssessmentHistory.tsx` ao cockpit (lista por período+data, reabre o `body` escrito na cabine para edição) — depende de T021
- [ ] T035 [US3] Fiar o histórico na `page.tsx` (entrada quando não há período em edição) e garantir o isolamento (não aparece no feed/espelho) — depende de T034

**Checkpoint**: as três histórias funcionam de forma independente.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: limpeza, espelho de i18n, design e validação final.

- [ ] T036 [P] Espelhar todas as chaves novas em `src/messages/en.json` (stub estrutural, constituição IX)
- [ ] T037 [P] Remover código morto do modelo antigo da autoavaliação (referências a `DraftCard`/`GenerateSheet`/variações na `page.tsx` e imports órfãos)
- [ ] T038 Rodar `/impeccable audit` + `web-design-guidelines` na cabine (a11y: labels nos chips/seções, hierarquia de headings, alvos ≥ 48px no mobile, trilha colapsável) antes do PR
- [ ] T039 Verificar cobertura ≥ 80% nos caminhos novos (recap, assist, forwardStep, sinal de ciclo) — SC-007
- [ ] T040 Rodar a validação do `quickstart.md` (US1/US2/US3) na conta QA e parar no **checkpoint de validação manual** com a Ohana (SC-008) antes de abrir o PR
- [ ] T041 `/code-review medium` no diff e `/security-review` nas rotas novas (auth, input, RLS) antes do `/pr-review`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)**: sem dependências — começa já.
- **Foundational (P2)**: depende do Setup — **bloqueia** todas as histórias (remove o modelo de geração).
- **US1 (P3)**: depende do Foundational. É o MVP.
- **US2 (P4)**: depende do Foundational; integra com US1 (precisa do `body` escrito), mas o sinal de
  painel (T028/T029) é independente da US1 e pode ir em paralelo.
- **US3 (P5)**: depende do Foundational; T034/T035 dependem da persistência da US1 (T021).
- **Polish (P6)**: depois das histórias desejadas.

### Within Each User Story
- Testes (RED) **antes** da implementação; loaders/helpers antes de rotas; rotas antes de componentes;
  componentes antes da fiação da `page.tsx`.

### Parallel Opportunities
- Setup: T003 ‖ (T001→T002 em sequência leve).
- Foundational: T005 ‖ T007 (arquivos distintos); T004/T006 tocam caminhos do motor/rota.
- US1 testes: T009 ‖ T010 ‖ T011 ‖ T012 ‖ T013.
- US1 impl: T014 ‖ T016 ‖ T017 (depois T018→T019→T020→T021).
- US2 testes: T023 ‖ T024 ‖ T025. US2 impl: T026 ‖ T028 (caminhos distintos).
- Polish: T036 ‖ T037.

---

## Parallel Example: User Story 1 (testes RED juntos)

```bash
Task: "Teste do recap determinístico em src/lib/autoavaliacao/__tests__/periodRecap.test.ts"
Task: "Teste dos sentence-stems em src/lib/autoavaliacao/__tests__/sentenceStems.test.ts"
Task: "Teste do assist (3 modos) em src/lib/ai/content/__tests__/assist.test.ts"
Task: "Teste de contrato da rota assist em src/app/api/autoavaliacao/assist/__tests__/route.test.ts"
Task: "Teste de isolamento em src/lib/autoavaliacao/__tests__/isolation.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)
1. Setup (T001–T003) → 2. Foundational (T004–T008, remove o modelo de geração) → 3. US1 (T009–T022) →
4. **PARAR e VALIDAR** US1 com a Ohana (a autoavaliação é **dela**, a IA só ancora?) → demo.

### Incremental
US1 (MVP) → US2 (passo-pra-frente + gatilho) → US3 (histórico). Cada história entrega valor sem quebrar
a anterior. O prep de 1:1 e o draft-irmão do passo-pra-frente são **fast-follow** (out of scope v1).

---

## Notes
- A autoavaliação (`body`) é **texto humano** → **não** passa pelo ruleset anti-IA (vale só p/ saída de
  modelo: `assist` e `forwardStep`).
- A única IA geradora é o `forwardStep`, com anti-invenção **bloqueante** (só usa o que a pessoa
  escreveu).
- Recap e `star_nudge` são **determinísticos** (sem LLM) — anti-invenção por construção.
- Migration **013** (012 ocupado pela 017). Aplicar no dev antes de testar; prod fica para o merge.
- Verificar os testes falharem antes de implementar (constituição VI). Commit por task ou grupo lógico.
