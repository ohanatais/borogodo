---
description: "Task list — 014 Presença (hub, gestão de rascunhos e sugestões)"
---

# Tasks: Presença (hub, gestão de rascunhos e sugestões)

**Input**: Design documents from `/specs/014-presenca/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, shape.md, **e a fundação da
013 (drafts, generateDraft, componentes de geração; hub básico `PresencaList`/`PresencaCreate` + rotas
`POST /api/content/drafts` e `PATCH .../[id]`)**.

**Tests**: Incluídos (TDD, Princípio VI). Cobertura ≥ 80% na listagem, na gestão e no disparo do nudge.

**Organization**: agrupado por user story.

> **Ordem**: a 014 só roda depois da fundação da 013 estar pronta. Na divisão de PRs, o hub básico já
> construído no working tree da 013 (`PresencaList`, `PresencaCreate`, `/presenca`, rotas de drafts) é
> **dobrado para dentro do PR da 014** (decisão de Ohana). As tasks abaixo assumem esse ponto de partida
> e focam no que falta: gestão total, filtro, exclusão, sugestões e costura.

---

## Phase 1: Setup
- [ ] T001 [SETUP] i18n `presenca.*` em `pt-BR.json` (hub, ações de gestão, filtros, confirmação de
  exclusão, sugestões, nudge) + espelho em `en.json`.
- [ ] T002 [P] [SETUP] Tipos em `src/types/content.ts`: `DraftListPage` (paginação), `DraftStatusFilter`,
  `ContentSuggestion` (projeção da faixa de sugestões), `ContentOpportunityInsight`.

## Phase 2: Foundational (Blocking)
- [ ] T003 [FND] Teste de `listDrafts` (`src/lib/db/__tests__/drafts.test.ts`): paginação, ordenação por
  mais recente, escopo por `user_id`, **filtro de status e exclusão de arquivados por padrão**. **Deve
  falhar.**
- [ ] T004 [FND] Estender `listDrafts(userId, { cursor, limit, status? })` em `src/lib/db/drafts.ts` —
  paginado, teto de limite, **exclui `discarded` quando o filtro não pede arquivados** — até T003 passar.
- [ ] T005 [FND] Teste de `deleteDraft` (escopo por `user_id` E `id`; id alheio não apaga nada). **Deve
  falhar.**
- [ ] T006 [FND] Implementar `deleteDraft(userId, id)` em `src/lib/db/drafts.ts` (`.eq('id').eq('user_id')`,
  RLS de `delete` da 013) até T005 passar.
- [ ] T007 [FND] `GET /api/content/drafts` (auth-first, RLS, `limit ≤ 20`, cursor, `?status=`) e
  `DELETE /api/content/drafts/[id]` (auth-first, 404 p/ id alheio/inexistente) — contrato
  `presenca-api.md`. Teste de rota junto.
- [ ] T008 [FND] Consolidar item **"Presença"** em `NAV_ITEMS` do `AppShellClient.tsx` (já presente no
  working tree da 013), conferindo coerência mobile/desktop e sem conflito com a barra da 012.

**Checkpoint**: listagem paginada/filtrada, exclusão servida, nav navegável.

## Phase 3: User Story 1 — Hub `/presenca`: ver, começar, retomar (P1) 🎯 MVP
- [ ] T009 [US1] `src/app/[locale]/(app)/presenca/page.tsx` (RSC) — busca a 1ª página de `listDrafts`
  (ativos) + dados de sugestão; renderiza o hub. (Consolida a página já existente da 013.)
- [ ] T010 [US1] `PresencaHub.tsx` — lista + estado "sem rascunho" com `EntryPaths` (reusa
  `PresencaCreate`); "Gerar conteúdo" sempre acessível no topo.
- [ ] T011 [P] [US1] `DraftListItem.tsx` (formato, ângulo, trecho, status, data, "Baseado em:") com slot
  de ações.
- [ ] T012 [US1] **Retomar**: reabrir um rascunho salvo no `GenerateSheet`/`DraftCard` da 013 em modo
  "retomar" (carrega `body`/ângulo, **sem** regerar). Extensão do `GenerateSheet` para abrir a partir de
  um draft existente (não só de um seed).
- [ ] T013 [US1] Testes: lista renderiza só rascunhos ativos do usuário; estado vazio mostra caminhos;
  retomar reabre com o corpo preservado.

**Checkpoint**: hub funcional, com começar/retomar e nunca vazio.

## Phase 4: User Story 2 — Gestão total do rascunho (P1)
- [ ] T014 [US2] Teste de gestão (componente + rota): arquivar tira da lista ativa; restaurar devolve;
  excluir (confirmado) remove; excluir sem confirmar não remove; filtro reflete status/formato. **Deve
  falhar.**
- [ ] T015 [US2] `PresencaHubClient.tsx` — controles client: copiar, **arquivar** (`PATCH → discarded`),
  **restaurar** (`PATCH → edited`), **editar** (via retomar → salvar), paginação ("carregar mais").
- [ ] T016 [US2] `DeleteConfirm.tsx` — confirmação de **exclusão definitiva** (Radix Dialog, foco preso,
  ESC), chamando `DELETE /api/content/drafts/[id]`; remoção otimista com rollback em erro.
- [ ] T017 [P] [US2] `StatusFilter.tsx` — filtro por status (ativos/copiados/arquivados) e formato
  (post/resumo); aciona refetch server-side com `?status=`.
- [ ] T018 [US2] Saída do item (arquivar/excluir) com transição suave (CSS), sem layout-shift brusco.
- [ ] T019 [US2] Testes finais da gestão até T014 passar; cobertura ≥ 80% nas ações.

**Checkpoint**: editar, arquivar, restaurar, excluir (com confirmação) e filtrar — tudo escopado ao
usuário; arquivados nunca poluem a lista ativa.

## Phase 5: User Story 3 — Usar projeto no /historico (P1)
- [ ] T020 [US3] Resolver o seed de projeto no servidor: `seed_type='project'` agrega a evidência das
  entradas do projeto (via `getHistoricoData`), com isolamento por projeto/empresa.
- [ ] T021 [US3] Integrar `UsarButton` (reuso da 013) no `ProjectDetailPanel` do `/historico`, abrindo
  `GenerateSheet` com "Baseado em: projeto {nome} ({n} entradas)".
- [ ] T022 [US3] Testes: geração a partir de projeto cita só entradas daquele projeto; 1-entrada se
  comporta como "Usar" na entrada.

**Checkpoint**: "Usar" cobre tema, entrada e projeto com o mesmo motor.

## Phase 6: User Story 4 — Sugestões de conteúdo: Painel + Presença (P2)
- [ ] T023 [US4] Teste de precisão do nudge (`triggerProactiveInsight`): captura forte cria 1
  `content_opportunity`; fraca não cria; parcimônia (sem duplicar não-visto recente). **Deve falhar.**
- [ ] T024 [US4] Implementar o disparo `content_opportunity` em `triggerProactiveInsight.ts` + prompt do
  nudge, até T023 passar.
- [ ] T025 [US4] Card do nudge no Painel (linguagem dos insights existentes) com CTA "Usar" que abre a
  geração com a entrada como seed e marca `seen`.
- [ ] T026 [US4] `src/lib/presenca/getSuggestions.ts` — pontos de partida determinísticos (temas do
  espelho + entradas fortes **sem** rascunho ainda), unindo com os `content_opportunity` pendentes. Sem
  IA no caminho de leitura. Teste de unidade.
- [ ] T027 [US4] `SuggestionsStrip.tsx` na Presença — faixa "Sugestões pra você"; some quando não há
  material; cada sugestão abre a geração (reusa `openPresenca`).
- [ ] T028 [P] [US4] Testes de componente: card do nudge aparece p/ `content_opportunity` e abre a
  geração; faixa de sugestões aparece com material e some sem material.

**Checkpoint**: sugestões nos dois lugares, com parcimônia, sem gerar sozinhas.

## Phase 7: Polish & Cross-Cutting
- [ ] T029 [P] [POLISH] a11y do hub, itens, menu de ações, confirmação de exclusão, filtro e sugestões
  (labels, foco, teclado, 48px, 375px).
- [ ] T030 [P] [POLISH] Zero string hardcoded (`presenca.*`); `en.json` espelha.
- [ ] T031 [POLISH] Revalidar nav + barra de captura vs. 012-chat (sem conflito de superfície).
- [ ] T032 [POLISH] `/impeccable audit` + `web-design-guidelines`; corrigir achados.
- [ ] T033 [POLISH] `/code-review high` + **`/security-review`** (nova escrita: DELETE/PATCH) +
  `/pr-review` antes do PR; cobertura ≥ 80%; CI verde.
- [ ] T034 [POLISH] Atualizar marcadores SPECKIT do `CLAUDE.md`; `docs/aprendizados.md` se houver algo
  não-óbvio (decisão de Ohana).

---

## Dependencies & Execution Order
- **013 (fundação) → 014**. Dentro da 014: Setup → Foundational (listagem/filtro/delete + nav) → US1
  (hub) → US2 (gestão) → US3 (projeto) → US4 (sugestões) → Polish.
- US2 depende da listagem com filtro e do `deleteDraft` (Fase 2). US3 depende do motor da 013. US4
  depende do pipeline de insights e de `getSuggestions`.
- Code review por fase (`/code-review low`); `/code-review high` + `/security-review` + `/pr-review`
  antes do PR.

## Notes
- ~34 tasks. **Zero migration** (usa `status='discarded'` e a RLS de `delete` da 013). Reuso pesado da
  013 — não duplicar motor nem UI de geração.
