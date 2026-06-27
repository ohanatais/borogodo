# Implementation Plan: Navegação que expressa a espinha (6 → 4 destinos)

**Branch**: `021-navegacao-espinha` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-navegacao-espinha/spec.md` · Decisão:
`docs/decisions/001-arquitetura-de-navegacao.md`

## Summary

Reorganizar a navegação para que o menu expresse a espinha do produto, colapsando de 6 para 4
destinos (Painel, Espelho, Registros, Usar). É **reorganização, não reescrita**: as telas
existentes são re-parentadas/re-roteadas, não refeitas. Quatro fases independentes e testáveis,
sem mudança de banco. Abordagem técnica central: rotas + searchParams para vistas, fetch
condicional no servidor (lazy real), redirects de rota, e reuso de componentes existentes
(`HistoricoPageClient`, `MirrorContent`, chat por evento).

## Technical Context

**Language/Version**: TypeScript strict (sem `any`), Next.js 15 (App Router, RSC por padrão)

**Primary Dependencies**: next-intl (`localePrefix: 'never'`), Tailwind + shadcn/ui, Lucide,
Framer Motion (só entrada), Supabase (sem mudança de schema nesta feature)

**Storage**: N/A — **nenhuma migration**. Nenhuma tabela nova; nenhum campo novo. `impact_summary`
permanece no enum/banco (motor), só sai das listas oferecidas.

**Testing**: Vitest + Testing Library (TDD obrigatório — constituição VI). 90 suites hoje,
incluindo `historico/__tests__/*` (ProjectDetailPanel, HistoricoTimeline, CompanyTimelineItem) e
`painel/__tests__/page.test.tsx` — todas devem continuar verdes (gate de não-regressão).

**Target Platform**: Web, **mobile-first** (constituição VIII; revisar em 375px), desktop em
`lg:`.

**Project Type**: Web app (Next.js App Router, monorepo único `src/`).

**Performance Goals**: A entrada do Espelho não busca a vista de Trajetória quando a pessoa fica
em Forças (fetch condicional por searchParam). Sem JS de animação bloqueando a main thread.

**Constraints**: Rotas antigas nunca 404 (redirects). Design tokens (sem hex cru). i18n: zero
string hardcoded — labels de nav e textos da landing "Usar" vão pra `pt-BR.json`/`en.json`.

**Scale/Scope**: ~6 superfícies tocadas (menu, landing nova, espelho, painel, 2 listas de
formato). Nenhuma é reescrita; o maior toque é a casca de 2 vistas do Espelho.

## Constitution Check

*GATE: deve passar antes da Fase 0. Reavaliar após Fase 1.*

| Princípio | Status | Nota |
|---|---|---|
| I. Security First (RLS, sem vazar id, sem logar conteúdo) | ✅ Preservado | Feature de navegação; nenhuma query nova de usuário além das existentes (já filtram por `user_id`). `getHistoricoData`/`getLatestSnapshot` reusados como são. |
| II. TS strict, ≤40 linhas/fn, ≤800 linhas/arquivo, 1 componente/arquivo, RSC default | ✅ Gate | A casca do Espelho e a landing Usar são componentes novos pequenos; extrair se crescerem. |
| III. AI-First | ✅ N/A | Nenhuma chamada LLM nova. `impact_summary` continua como motor. |
| IV. Server-First & Performance (RSC, lazy-load, next/image, CSS para micro-interação) | ✅ Gate | Vista de Trajetória carregada sob demanda (searchParam → fetch condicional no servidor). Toggle de vista = navegação, sem JS pesado. |
| V. Acessibilidade WCAG AA (label, foco, hierarquia, 48×48) | ✅ Gate | Tabs do Espelho e landing Usar precisam de labels, foco visível, alvos 48px. Validar no audit. |
| VI. TDD (teste antes, 80%+) | ✅ Gate | Cada fase: teste RED → impl GREEN. Testes da Linha do Tempo migram com o componente e seguem verdes. |
| VII. Design Identity (tokens, Fraunces, ritmo) | ⚠️ Requer `/impeccable shape` | Landing Usar e tabs do Espelho são UI nova → `shape` antes de codar a UI (constituição VII e Workflow passo 5). Naming "Usar"/"Repertório" e rótulos de vista resolvem no shape. |
| VIII. Mobile-First | ✅ Gate | Menu (barra inferior), landing e tabs revisados em 375px. |
| IX. i18n (sem string hardcoded) | ⚠️ Ação | Hoje os labels de `NAV_ITEMS` são strings cruas (dívida pré-existente). Ao tocar o menu, mover pra `appNav`; landing Usar e porta do Painel usam chaves novas em `pt-BR.json` + stub `en.json`. |

**Sem violações que exijam justificativa** (Complexity Tracking vazio). Duas ações de
conformidade (i18n dos labels; `/impeccable shape` antes da UI nova) ficam registradas como
tarefas, não como exceções.

## Project Structure

### Documentation (this feature)

```text
specs/021-navegacao-espinha/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md        # Fase 1 — modelo de estado de navegação (sem persistência nova)
├── quickstart.md        # Fase 1 — roteiro de validação manual por fase
├── contracts/
│   └── routes.md        # Fase 1 — contrato de rotas/redirects e roteamento da landing Usar
├── checklists/
│   └── requirements.md  # da /speckit-specify
└── tasks.md             # Fase 2 — /speckit-tasks (NÃO criado aqui)
```

### Source Code (repository root) — superfícies tocadas

```text
src/
├── components/layout/AppShellClient.tsx          # Fase 1: NAV_ITEMS 6→4; isActive (Usar agrupa /usar,/presenca,/autoavaliacao); labels via i18n
├── app/[locale]/(app)/
│   ├── usar/page.tsx                              # Fase 1: NOVA landing (RSC) → roteia mostrar/preparar
│   ├── historico/page.tsx                         # Fase 3: vira redirect → /espelho?vista=trajetoria
│   ├── espelho/page.tsx                           # Fase 3: casca 2 vistas; fetch condicional por ?vista
│   └── painel/page.tsx                            # Fase 4: monta a porta de conversa no topo
├── components/features/
│   ├── espelho/EspelhoViews.tsx                   # Fase 3: NOVO — tabs Forças/Trajetória (client mínimo)
│   ├── painel/PainelChatDoor.tsx                  # Fase 4: NOVO — porta que dispara openChatSheet
│   ├── content/PresencaCreate.tsx                 # Fase 2: ENTRY_FORMATS sem impact_summary
│   └── painel/ProactiveInsightCard.tsx            # Fase 2: NUDGE_FORMATS sem impact_summary
├── messages/pt-BR.json + en.json                  # Fases 1/4: appNav, usar.*, painel.chatDoor.*
└── (testes em __tests__/ ao lado de cada alvo)
```

**Structure Decision**: monorepo único `src/` (Opção 1). A Linha do Tempo **não muda de pasta** —
`historico/` e seus componentes ficam onde estão; o Espelho os **importa** na vista de Trajetória
(re-parentar por import, sem mover/reescrever).

## Complexity Tracking

> Sem violações de constituição a justificar — seção vazia.

## Phase 0 — Research (`research.md`)

Resolve as decisões técnicas não óbvias: estratégia de lazy-load da Trajetória (searchParam +
fetch condicional no servidor vs. client dynamic import), mecânica de redirect com
`localePrefix:'never'`, agrupamento do `isActive` para "Usar", e como a porta do Painel reusa o
chat por evento sem duplicar lógica. Saída em `research.md`.

## Phase 1 — Design & Contracts

- `data-model.md`: modelo de **estado de navegação** (destinos, vistas do Espelho, intenção de
  Usar). Sem entidade persistida nova.
- `contracts/routes.md`: contrato de rotas/redirects (URL → comportamento) e o roteamento da
  landing Usar.
- `quickstart.md`: roteiro de validação manual fase a fase (o gate de cada fase da spec).
- Atualizar marcadores `<!-- SPECKIT START/END -->` no `CLAUDE.md` apontando para este plano.
