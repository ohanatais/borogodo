# Tasks: Espelho Honesto

**Feature**: 006-espelho-honesto | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

> **Regularização retroativa (PR #13)**: todas as tasks abaixo já estão **concluídas** — o
> código, os testes, as fixtures e a UI existem e passam. Marcadas `[X]` por refletirem
> trabalho entregue, não pendente. Este arquivo é a referência de progresso da feature
> (usada pelo hook de Stop).

## Phase 1: Setup

- [X] T001 Reusar a infra de IA existente sob `src/lib/ai/mirror/` (Sonnet, `generateMirror`, `mirror_snapshots`) como base da feature

## Phase 2: Foundational (tipos e schema — bloqueia todo o resto)

- [X] T002 Atualizar o tipo `Mirror` substituindo `closing_question` por `closing` em `src/types/mirror.ts`
- [X] T003 Atualizar a validação de forma (Zod) da saída do espelho em `src/lib/ai/mirror/schemas.ts`
- [X] T004 [P] Cobrir o schema com testes em `tests/unit/mirror-schemas.test.ts`

---

## Phase 3: User Story 3 — Garantia automática de qualidade (Priority: P1)

**Goal**: tornar "honesto" uma propriedade verificável, sem custo de IA.
**Independent Test**: `validateMirrorRuleset` retorna `[]` para fixtures boas e as violações esperadas para fixtures ruins.

- [X] T005 [US3] Implementar o validador determinístico `validateMirrorRuleset` com os 9 asserts em `src/lib/ai/mirror/validateRuleset.ts`
- [X] T006 [US3] Definir as listas pt-BR de buzzwords, gírias de elogio e padrões de antítese banidos em `src/lib/ai/mirror/validateRuleset.ts`
- [X] T007 [US3] Tornar o validador resiliente a saída malformada (campos ausentes → string vazia, sem exceção) em `src/lib/ai/mirror/validateRuleset.ts`
- [X] T008 [P] [US3] Criar fixtures de qualidade (4 perfis de PM, boas e ruins) em `tests/fixtures/mirror/`
- [X] T009 [US3] Cobrir os 9 asserts com testes unitários em `tests/unit/mirror-ruleset.test.ts`

---

## Phase 4: User Story 1 — Ler o próprio espelho honesto (Priority: P1)

**Goal**: a pessoa lê em `/espelho` uma síntese específica, com evidência real e sem clichê.
**Independent Test**: abrir `/espelho` com um usuário com entradas → quatro blocos com evidência citada, fechamento sem "?".

- [X] T010 [US1] Reescrever o prompt do espelho com princípios anti-bajulação em `src/lib/ai/mirror/prompts/firstMirror.ts`
- [X] T011 [US1] Integrar geração + validação (forma + ruleset) antes de persistir em `src/lib/ai/mirror/generateMirror.ts`
- [X] T012 [US1] Expor status do espelho para o painel em `src/lib/panel/getMirrorStatus.ts`
- [X] T013 [US1] Criar a página de leitura `/espelho` (Server Component) em `src/app/[locale]/espelho/page.tsx`
- [X] T014 [US1] Renderizar intro + 3 cards (headline+evidence) + closing em `src/components/features/espelho/MirrorContent.tsx`
- [X] T015 [P] [US1] Testar o render dos blocos em `src/components/features/espelho/__tests__/MirrorContent.test.tsx`

---

## Phase 5: User Story 2 — Reagir ao espelho (feedback) (Priority: P2)

**Goal**: registrar ressonância sem regenerar no v1.
**Independent Test**: clicar "Sim, faz sentido"/"Nem tanto" → feedback persistido, espelho não regenerado.

- [X] T016 [US2] Implementar a Server Action de feedback em `src/app/[locale]/espelho/actions.ts`
- [X] T017 [US2] Criar os botões "Sim, faz sentido" / "Nem tanto" em `src/components/features/espelho/MirrorFeedback.tsx`
- [X] T018 [P] [US2] Testar o componente de feedback em `src/components/features/espelho/__tests__/MirrorFeedback.test.tsx`

---

## Phase 6: Polish & Cross-Cutting

- [X] T019 [P] Atualizar testes de geração em `tests/unit/generate-mirror.test.ts`
- [X] T020 [P] Atualizar o teste de integração da rota em `tests/integration/mirror-generate-route.test.ts`
- [X] T021 [P] Atualizar o smoke test em `tests/smoke/mirror-generation.smoke.test.ts`

---

## Dependencies

- Phase 2 (tipos/schema) bloqueia todas as user stories.
- US3 (validador) e US1 (leitura) são ambas P1; US1 usa o validador de US3 em `generateMirror`.
- US2 (feedback) depende da página de US1.
- Polish ao final.

## Parallel Opportunities

- T004, T008, T015, T018, T019–T021 são `[P]` (arquivos independentes).

## Implementation Strategy

MVP = Phase 2 + US3 + US1 (gerar, validar e ler um espelho honesto). US2 (feedback) é incremento seguinte.

## Status

**21/21 tasks concluídas** — feature entregue no PR #13. Regularizada via speckit em 2026-06-14.
