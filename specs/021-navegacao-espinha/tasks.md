---

description: "Task list — Navegação que expressa a espinha (6 → 4 destinos)"
---

# Tasks: Navegação que expressa a espinha (6 → 4 destinos)

**Input**: Design documents from `specs/021-navegacao-espinha/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/routes.md ✅,
quickstart.md ✅

**Tests**: INCLUÍDOS — a constituição VI (TDD) é não-negociável. Cada história escreve o teste
(RED) antes da implementação (GREEN). Cobertura mínima 80%.

**Organization**: tarefas agrupadas por user story; cada uma é entregável e testável de forma
independente (4 fases da reforma).

## Status da execução

- **Passo atual**: `/impeccable shape` ✅ **confirmado** — design brief em
  [design-brief.md](./design-brief.md). **Implementação NÃO iniciada**: 0/29 tarefas concluídas.
- **Decisões de design (confirmadas)**: landing Usar = **Conteúdo** (→`/presenca`) + **Preparo**
  (→`/autoavaliacao`); Espelho = segmented **Forças/Trajetória**; porta do Painel = **abaixo do hero**.
- **Próximo**: `/speckit-implement` (T001→T029) — T002 (gate de shape) já satisfeito.
- **Nota**: o arquivo não-rastreado `src/components/features/painel/__tests__/IndicatorStrip.test.tsx`
  já existia antes desta feature e **não pertence à 021** — não incorporar nos commits da reforma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: a qual user story pertence (US1–US4)
- Caminho de arquivo exato em cada tarefa

## Convenções de path

App Next.js (App Router), monorepo único: rotas em `src/app/[locale]/(app)/`, componentes em
`src/components/`, i18n em `src/messages/`, testes em `__tests__/` ao lado do alvo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: baseline verde e gate de UX antes de qualquer mudança.

- [ ] T001 Confirmar baseline: `npm test` e `npm run build` verdes na branch `021-navegacao-espinha` antes de tocar código
- [ ] T002 **Gate de UX (constituição VII)**: rodar `/impeccable shape` das superfícies de UI nova — landing `Usar`, tabs do Espelho (Forças/Trajetória) e porta de conversa do Painel — ANTES de implementar as tarefas de UI dessas histórias. Resolve também o naming "Usar" vs. "Repertório" e os rótulos das vistas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: o modelo de navegação compartilhado (usado pelo menu e pelo estado-ativo das sub-rotas).

**⚠️ CRITICAL**: nenhuma user story de menu/ativo começa antes disto.

- [ ] T003 [P] Teste (RED) do helper de navegação em `src/components/layout/__tests__/navModel.test.ts`: 4 destinos; `isActive` agrupa Usar (`/usar`, `/presenca`, `/autoavaliacao`); Espelho ativo em `/espelho` (o `?vista` não muda o pathname)
- [ ] T004 Implementar (GREEN) tipo `NavDestino` + `isActive(destino, pathname)` com `activePrefixes` em `src/components/layout/navModel.ts` (per data-model.md)
- [ ] T005 [P] Adicionar namespace `appNav` (labels dos 4 destinos) em `src/messages/pt-BR.json` e stub espelhado em `src/messages/en.json` (constituição IX — quita a dívida de label hardcoded)

**Checkpoint**: modelo de navegação pronto e testado — as histórias podem começar.

---

## Phase 3: User Story 1 - Menu enxuto de 4 destinos + landing Usar (Priority: P1) 🎯 MVP

**Goal**: o menu mostra 4 destinos óbvios; "Usar" é uma landing que distingue mostrar/preparar; links antigos não quebram.

**Independent Test**: abrir o app (desktop e 375px) → ver Painel/Espelho/Registros/Usar + Configurações; "Usar" oferece os dois caminhos; `/presenca` e `/autoavaliacao` acendem "Usar".

### Tests for User Story 1 ⚠️ (RED primeiro)

- [ ] T006 [P] [US1] Teste (RED): `AppShellClient` mostra 4 destinos + Configurações e NÃO mostra Linha do Tempo/Repertório/Autoavaliação no topo — `src/components/layout/__tests__/AppShellClient.test.tsx`
- [ ] T007 [P] [US1] Teste (RED): landing `/usar` renderiza dois caminhos e aponta para `/presenca` e `/autoavaliacao` — `src/app/[locale]/(app)/usar/__tests__/page.test.tsx`

### Implementation for User Story 1

- [ ] T008 [US1] Reescrever `NAV_ITEMS` para os 4 destinos usando `navModel` + labels `appNav`, e trocar `isActive` pelo helper, em `src/components/layout/AppShellClient.tsx` (GREEN) — vale desktop e barra inferior mobile
- [ ] T009 [US1] Criar landing `src/app/[locale]/(app)/usar/page.tsx` (RSC): duas zonas lado a lado (empilha no mobile, sem card-grid) — **"Conteúdo"** → `/presenca`, **"Preparo"** → `/autoavaliacao`; cada uma com 1 linha de "quando"; textos via i18n
- [ ] T010 [P] [US1] Adicionar chaves `usar.*` (título, Conteúdo/Preparo, 2 linhas de "quando") em `src/messages/pt-BR.json` + stub `en.json`
- [ ] T011 [US1] Revisar menu e landing em 375px (mobile-first, constituição VIII) e a11y (labels, foco visível, alvos 48×48 — constituição V)

**Checkpoint**: menu 4 destinos + landing funcionando e testados. **MVP entregável.**

---

## Phase 4: User Story 2 - Espelho com Forças + Trajetória (Priority: P2)

**Goal**: "me entender" num lugar só — Espelho com 2 vistas; Trajetória lazy; drill-down de projeto intacto; `/historico` redireciona.

**Independent Test**: abrir Espelho (Forças por padrão) → alternar para Trajetória → abrir um projeto (igual à antiga Linha do Tempo); em Forças, a query da Trajetória não é feita; `/historico` cai na Trajetória.

### Tests for User Story 2 ⚠️ (RED primeiro)

- [ ] T012 [P] [US2] Teste (RED): `espelho/page` com `?vista=forcas` renderiza Forças e NÃO busca `getHistoricoData`; com `?vista=trajetoria` renderiza Trajetória — `src/app/[locale]/(app)/espelho/__tests__/page.test.tsx`
- [ ] T013 [P] [US2] Teste (RED): `/historico` redireciona para `/espelho?vista=trajetoria` — `src/app/[locale]/(app)/historico/__tests__/redirect.test.ts`

### Implementation for User Story 2

- [ ] T014 [US2] Criar `EspelhoViews` (client mínimo: tabs Forças/Trajetória ligando `?vista`) em `src/components/features/espelho/EspelhoViews.tsx`; chaves `espelho.views.*` em pt-BR/en
- [ ] T015 [US2] Reescrever `src/app/[locale]/(app)/espelho/page.tsx`: ler `searchParams.vista`, **fetch condicional** (`getLatestSnapshot` OU `getHistoricoData`), montar `MirrorContent` ou **re-parentar `HistoricoPageClient` inteiro** (sem reescrever a timeline) — GREEN para T012
- [ ] T016 [US2] Converter `src/app/[locale]/(app)/historico/page.tsx` em `redirect('/espelho?vista=trajetoria')` (depende de T015) — GREEN para T013
- [ ] T017 [US2] Rodar a suíte da Trajetória (`historico/__tests__/ProjectDetailPanel|HistoricoTimeline|CompanyTimelineItem`) e confirmar verde após o re-parent (gate de não-regressão, SC-006)
- [ ] T018 [US2] Revisar tabs em 375px; a11y (`role="tablist"`/`tab`, foco, alvos 48×48)

**Checkpoint**: Espelho com 2 vistas; Linha do Tempo absorvida sem perder função.

---

## Phase 5: User Story 3 - Painel como Home: porta de conversa (Priority: P3)

**Goal**: porta de conversa aditiva no topo do Painel; cards atuais intactos; barra global de chat intacta.

**Independent Test**: abrir Painel → porta de conversa no topo abre o chat (modo pergunta); cards atuais seguem presentes; em outra página a barra global continua.

### Tests for User Story 3 ⚠️ (RED primeiro)

- [ ] T019 [P] [US3] Teste (RED): `PainelChatDoor` dispara `openChatSheet` (modo pergunta) ao acionar — `src/components/features/painel/__tests__/PainelChatDoor.test.tsx`

### Implementation for User Story 3

- [ ] T020 [US3] Criar `src/components/features/painel/PainelChatDoor.tsx` (client) que dispara `openChatSheet` (reuso do chat existente); chaves `painel.chatDoor.*` em pt-BR/en
- [ ] T021 [US3] Montar `PainelChatDoor` no topo de `src/app/[locale]/(app)/painel/page.tsx` — **aditivo**: não remover nem reordenar os cards atuais (clarify, FR-012)
- [ ] T022 [US3] Revisar em 375px; a11y; confirmar `painel/__tests__/page.test.tsx` verde

**Checkpoint**: Painel com porta conversacional, sem regressão dos cards.

---

## Phase 6: User Story 4 - `impact_summary` fora das listas (Priority: P3)

**Goal**: "resumo de impacto" some das opções de formato; motor e dados intactos.

**Independent Test**: abrir geração a partir de entrada e do insight proativo → "resumo de impacto" não aparece; gerar um post funciona.

### Tests for User Story 4 ⚠️ (RED primeiro)

- [ ] T023 [P] [US4] Teste (RED): `ENTRY_FORMATS` e `NUDGE_FORMATS` não contêm `'impact_summary'`; `DraftFormat`/enum permanece — `src/components/features/content/__tests__/formats.test.ts`

### Implementation for User Story 4

- [ ] T024 [P] [US4] Remover `'impact_summary'` de `ENTRY_FORMATS` em `src/components/features/content/PresencaCreate.tsx`
- [ ] T025 [P] [US4] Remover `'impact_summary'` de `NUDGE_FORMATS` em `src/components/features/painel/ProactiveInsightCard.tsx` — **NÃO** tocar `DraftFormat`/enum/banco (FR-015)

**Checkpoint**: listas limpas, motor `generateDraft` intacto.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T026 Rodar `quickstart.md` (validação manual fase a fase) — gate de cada fase
- [ ] T027 `npm test` (cobertura ≥80%, constituição VI) + `npm run build` verdes; nenhuma rota antiga 404
- [ ] T028 `/impeccable audit` + `web-design-guidelines` antes de abrir o PR (constituição VII, Workflow passo 7)
- [ ] T029 [P] Propor entrada em `docs/aprendizados.md` se algo não-óbvio surgiu (decisão final da Ohana)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências; T002 (shape) é gate de UX antes das tasks de UI nova.
- **Foundational (Fase 2)**: depende do Setup; bloqueia US1 (e o estado-ativo de US2/US3).
- **User Stories (Fases 3–6)**: dependem da Foundational. Depois disso, **independentes entre si**
  (podem ir em qualquer ordem). Ordem recomendada por valor: US1 → US2 → US3/US4.
- **Polish (Fase 7)**: depois das histórias desejadas.

### Dependências internas relevantes

- **US2**: T016 (redirect) depende de T015 (a vista de Trajetória existir). Até US2, `/historico`
  segue acessível (sem estado quebrado).
- **US1** entrega valor sozinha (MVP). US3 e US4 não dependem de US1/US2.
- Cada história: **teste (RED) antes da implementação (GREEN)**; revisão mobile/a11y fecha a história.

### Parallel Opportunities

- T003 ∥ T005 (foundational, arquivos diferentes).
- Dentro de cada história, os testes marcados [P] rodam juntos; T024 ∥ T025 (US4, arquivos diferentes).
- Com a Foundational pronta, US1/US2/US3/US4 podem ser tocadas em paralelo se houver capacidade
  (mas o run único da Ohana fará em sequência).

---

## Implementation Strategy

### MVP primeiro (US1)

1. Fase 1 (Setup) → 2. Fase 2 (Foundational) → 3. Fase 3 (US1) → **PARAR e VALIDAR** (quickstart Fase 1) → demo do menu novo.

### Entrega incremental

US1 (menu+landing) → US2 (Espelho 2 vistas) → US3 (porta do Painel) → US4 (limpeza de formato).
Cada uma testada e commitada antes da próxima. Commit ao fim de cada fase (estado durável,
resumível — os hooks já forçam atualizar este `tasks.md`).

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente.
- **Sem migration**; `impact_summary` permanece no enum/banco.
- "Reorganização, não reescrita": Trajetória reusa `HistoricoPageClient`; chat reusa `openChatSheet`.
- Gate de UX (T002) e gate de design (T028) são da constituição VII — não pular.
- **Me preparar** (generalizar a Autoavaliação) é feature futura separada — fora deste tasks.
