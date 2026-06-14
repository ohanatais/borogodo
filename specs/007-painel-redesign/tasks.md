# Tasks: Painel Redesign (007)

**Feature**: 007-painel-redesign | **Spec**: [spec.md](./spec.md)

## Phase 1: Data layer

- [X] T001 Atualizar `getPanelData` para incluir `timelineEntries` (role_title, company, entry_date) e `highlights` (what_i_did, impact, metric)
- [X] T002 [P] Adicionar tipos `TimelineEntry` e `HighlightEntry` a `getPanelData.ts`

## Phase 2: Componentes (US1 + US2 + US3)

- [X] T003 Criar `BorogodoCard` (avatar + nome + especialidades chips + skills pílulas + padrão + link espelho + empty state) em `src/components/features/painel/BorogodoCard.tsx`
- [X] T004 Criar `TrajectoryHighlights` (até 3 itens resultado-primeiro) em `src/components/features/painel/TrajectoryHighlights.tsx`
- [X] T005 Criar `MiniTimeline` (3 papéis recentes, colapsa no mobile) em `src/components/features/painel/MiniTimeline.tsx`

## Phase 3: Integração

- [X] T006 Atualizar `painel/page.tsx`: substituir `MirrorHeadline` por `BorogodoCard`; adicionar `TrajectoryHighlights` e `MiniTimeline`; layout grid desktop 2 colunas
- [X] T007 Adicionar strings i18n ao `pt-BR.json`: `panel.borogodoCard.*`, `panel.highlights.*`, `panel.timeline.*`

## Phase 4: Testes

- [X] T008 [P] Testar `BorogodoCard`: render com mirror (chips visíveis), empty state
- [X] T009 [P] Testar `MiniTimeline`: com entradas, lista vazia (hidden)
- [X] T010 [P] Testar `TrajectoryHighlights`: com highlights, lista vazia (hidden)
