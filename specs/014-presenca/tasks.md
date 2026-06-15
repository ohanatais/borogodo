---
description: "Task list — 014 Presença (hub e costura)"
---

# Tasks: Presença (hub e costura)

**Input**: Design documents from `/specs/014-presenca/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, shape.md, **e a fundação
da 013 (drafts, generateDraft, componentes de geração)**.

**Tests**: Incluídos (TDD, Princípio VI). Cobertura ≥ 80% na listagem e no disparo do nudge.

**Organization**: agrupado por user story.

> **Ordem de batch**: a 014 só roda depois da Fase 2 (Foundational) da 013 estar pronta. Num batch,
> implementar 013 inteira antes de começar a 014.

---

## Phase 1: Setup
- [ ] T001 [SETUP] i18n `presenca.*` em `pt-BR.json` (hub, ações, estados vazios, nudge) + espelho em
  `en.json`.
- [ ] T002 [P] [SETUP] Tipos de listagem em `src/types/content.ts` (`DraftListItem`, `DraftListPage`,
  `ContentOpportunityInsight`).

## Phase 2: Foundational (Blocking)
- [ ] T003 [FND] Escrever teste de `listDrafts` (`src/lib/db/__tests__/drafts.test.ts`): paginação,
  ordenação por mais recente, escopo por `user_id` (RLS). **Deve falhar.**
- [ ] T004 [FND] Implementar `listDrafts(userId, { cursor, limit })` em `src/lib/db/drafts.ts`
  (paginado, limite com teto) até T003 passar.
- [ ] T005 [FND] `GET /api/content/drafts` em `src/app/api/content/drafts/route.ts` (auth-first, RLS,
  `limit ≤ 20`, cursor) — contrato `presenca-api.md`.
- [ ] T006 [FND] Adicionar item **"Presença"** em `NAV_ITEMS` do `AppShellClient.tsx` (rota
  `/presenca`, ícone Lucide), conferindo coerência mobile/desktop e sem conflito com a barra da 012.

**Checkpoint**: listagem servida e nav navegável.

## Phase 3: User Story 1 — Hub `/presenca` (P1) 🎯 MVP
- [ ] T007 [US1] `src/app/[locale]/(app)/presenca/page.tsx` (RSC) — busca a 1ª página de `listDrafts` e
  renderiza o hub.
- [ ] T008 [US1] `src/components/features/presenca/PresencaHub.tsx` — lista + estado "sem rascunho"
  com `EntryPaths` (nunca vazio).
- [ ] T009 [P] [US1] `DraftListItem.tsx` (formato, ângulo, trecho, status, data, "Baseado em:") com
  ações retomar/copiar/descartar.
- [ ] T010 [P] [US1] `EntryPaths.tsx` — caminhos de entrada (tema/entrada/projeto) com evidência.
- [ ] T011 [US1] `PresencaHubClient.tsx` — controles client: retomar (reabre `GenerateSheet` da 013),
  copiar, descartar (`PATCH .../[id]` → `discarded`), paginação ("carregar mais").
- [ ] T012 [US1] Testes: lista renderiza só rascunhos do usuário; estado vazio mostra caminhos;
  descartar remove o item sem layout-shift brusco.

**Checkpoint**: hub funcional, com retomar/copiar/descartar e nunca vazio.

## Phase 4: User Story 2 — Usar projeto no /historico (P1)
- [ ] T013 [US2] Resolver o seed de projeto no servidor: `seed_type='project'` agrega a evidência das
  entradas do projeto (via `getHistoricoData`), garantindo isolamento por projeto/empresa.
- [ ] T014 [US2] Integrar `UsarButton` (reuso da 013) no `ProjectDetailPanel` do `/historico`, abrindo
  `GenerateSheet` com "Baseado em: projeto {nome} ({n} entradas)".
- [ ] T015 [US2] Testes: geração a partir de projeto cita só entradas daquele projeto; 1-entrada se
  comporta como "Usar" na entrada.

**Checkpoint**: "Usar" cobre tema, entrada e projeto com o mesmo motor.

## Phase 5: User Story 3 — Nudge proativo (P2)
- [ ] T016 [US3] Escrever teste de precisão do nudge (`triggerProactiveInsight`): captura forte cria 1
  `content_opportunity`; fraca não cria; parcimônia (sem duplicar não-visto recente). **Deve falhar.**
- [ ] T017 [US3] Implementar o disparo `content_opportunity` em
  `src/lib/ai/insights/triggerProactiveInsight.ts` + prompt do nudge, até T016 passar.
- [ ] T018 [US3] Card do nudge no painel (linguagem dos insights existentes) com CTA "Usar" que abre a
  geração com a entrada como seed e marca `seen`.
- [ ] T019 [P] [US3] Teste de componente: card aparece para insight `content_opportunity`; CTA abre a
  geração; dismiss marca `seen`.

**Checkpoint**: nudge fecha o loop de retorno episódico, com parcimônia.

## Phase 6: Polish & Cross-Cutting
- [ ] T020 [P] [POLISH] a11y do hub, itens, ações e nudge (labels, foco, teclado, 48px, 375px).
- [ ] T021 [P] [POLISH] Zero string hardcoded (`presenca.*`); `en.json` espelha.
- [ ] T022 [POLISH] Revalidar nav + barra de captura vs. 012-chat (sem conflito de superfície).
- [ ] T023 [POLISH] `/impeccable audit` + `web-design-guidelines`; corrigir achados.
- [ ] T024 [POLISH] `/code-review high` + `/pr-review` antes do PR; cobertura ≥ 80%; CI verde.
- [ ] T025 [POLISH] Atualizar marcadores SPECKIT do `CLAUDE.md`; `docs/aprendizados.md` se houver algo
  não-óbvio (decisão de Ohana).

---

## Dependencies & Execution Order
- **013 (fundação) → 014**. Dentro da 014: Setup → Foundational (listagem + nav) → US1 (hub) → US2
  (projeto) → US3 (nudge) → Polish.
- US1 depende da listagem (Fase 2). US2 depende do motor da 013. US3 depende do pipeline de insights.
- Code review por fase (`/code-review low`); `/code-review high` + `/pr-review` antes do PR.

## Notes
- ~25 tasks. Zero migration. Reuso pesado da 013 — não duplicar motor nem UI de geração.
