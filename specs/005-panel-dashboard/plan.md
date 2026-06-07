# Implementation Plan: Painel Principal (Espelho Vivo + Composer)

**Branch**: `005-panel-dashboard` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: `/specs/005-panel-dashboard/spec.md`

**Fonte de referência (layout + componentes + microcopy)**: `docs/mvp/002-panel-skeleton.md`.

**Pré-requisito**: features **003** e **004** mergeadas (`git rebase main`).

## Summary

Construir o painel (`/(app)/painel`) como Server Component que lê em paralelo entradas, espelho e
insight, e renderiza headline + indicadores + insight proativo + entradas recentes. Definir a
**superfície de captura canônica** (`CaptureComposer`, `CaptureConversation`, `ReflectionCard`,
`ReadingState`, `FileButton`; `AudioButton` desabilitado) em `components/features/capture/`,
reusada por 006. Criar `proactive_insights` e implementar `triggerProactiveInsight` (preenche o
stub de 003). UI mobile-first, i18n, identidade Borogodó; `/impeccable shape` em `shape.md`.

## Technical Context

**Language/Version**: TypeScript estrito, Next.js 15 App Router (RSC por padrão)

**Primary Dependencies**: React 19/Next 15, Tailwind + shadcn/ui, Framer Motion (entrada do sheet), Lucide, next-intl, Supabase server client (003/002)

**Storage**: Supabase; lê `entries`/`mirror_snapshots`; cria `proactive_insights`

**Testing**: Vitest + Testing Library (componentes, lógica de status/placeholder, render condicional do insight)

**Target Platform**: Web (mobile-first, validado a 375px)

**Project Type**: Web app full-stack — feature de **UI** + um job de IA (`triggerProactiveInsight`)

**Performance Goals**: valor acima da dobra ≤ 1 s; indicadores sobem ≤ 1 s após captura; mínimo JS no client

**Constraints**: RSC por padrão, `"use client"` só no composer/sheet/itens interativos; micro-interações CSS; toques ≥ 48px; zero string hardcoded; tokens de cor (sem hex cru)

**Scale/Scope**: ~12 componentes, 1 página server, 1 loading skeleton, 1 migration, 1 job de IA

## Constitution Check

- **I. Security First**: ✅ auth via middleware + checagem na página; RLS por `user_id`; `triggerProactiveInsight` (background) usa `service_role` filtrando `user_id`; sem dados em log.
- **II. TS Strict & Quality**: ✅ sem `any`; um componente por arquivo nomeado igual ao arquivo; funções ≤ 40 linhas; arquivos ≤ 800; sem catch vazio.
- **III. AI-First**: ✅ `triggerProactiveInsight` usa Haiku (insight é estruturação leve); wrappers em `src/lib/ai/`; saída validada antes de persistir; contexto por usuário.
- **IV. Server-First & Performance**: ✅ página é RSC; `"use client"` só onde há interação; `next/image` se houver imagem; Framer Motion só na entrada do sheet; hover/focus em CSS.
- **V. Accessibility**: ✅ labels acessíveis, hierarquia de headings, contraste AA, foco visível, toques ≥ 48px.
- **VI. TDD**: ✅ testes antes; ≥ 80%.
- **VII. Design Identity**: ✅ tokens de cor; Fraunces nos títulos; `/impeccable shape` antes de codar, `audit` antes do PR; sem anti-padrões (gradiente roxo-azul, cards aninhados, etc.).
- **VIII. Mobile-First**: ✅ Tailwind base→`md:`; composer ancorado usável a 375px; toques 48px.
- **IX. i18n**: ✅ strings em `pt-BR.json` (+ stub `en.json`); chaves camelCase namespaced (`panel.*`, `capture.*`); `getTranslations` em RSC, `useTranslations` em client.

**Resultado**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/005-panel-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── shape.md                 # /impeccable shape (design brief)
├── contracts/
│   └── panel-data.md        # contrato de leitura do server component + insight job
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/(app)/painel/
│   ├── page.tsx                       # Server Component (Promise.all das 4 leituras)
│   └── loading.tsx                    # skeleton
├── components/features/
│   ├── capture/                       # SUPERFÍCIE CANÔNICA (reusada por 006)
│   │   ├── CaptureComposer.tsx        # "use client" — barra multimodal (texto+arquivo ativos)
│   │   ├── CaptureConversation.tsx    # "use client" — sheet: reading→reflecting→resolve/error
│   │   ├── ReflectionCard.tsx         # resumo + pílulas + movimento
│   │   ├── ReadingState.tsx           # animação "lendo..."
│   │   ├── FileButton.tsx             # upload genérico (PDF)
│   │   └── AudioButton.tsx            # DESABILITADO no MVP (tooltip "em breve") — costura
│   └── painel/
│       ├── MirrorHeadline.tsx
│       ├── IndicatorStrip.tsx
│       ├── ProactiveInsightCard.tsx   # render condicional (nunca vazio)
│       ├── RecentEntries.tsx
│       └── EntryItem.tsx
├── components/layout/AppHeader.tsx
├── lib/
│   ├── ai/insights/triggerProactiveInsight.ts   # Haiku; preenche stub de 003
│   ├── panel/getCapturePrompt.ts                 # placeholder contextual
│   └── panel/getMirrorStatus.ts                  # building/emerging/active + STATUS_CONFIG
└── messages/pt-BR.json (+ en.json)               # chaves panel.* / capture.*

supabase/migrations/
└── 00X_proactive_insights.sql

tests/
├── unit/
│   ├── getMirrorStatus.test.ts
│   ├── getCapturePrompt.test.ts
│   └── ProactiveInsightCard.test.tsx   # não renderiza sem insight
└── integration/
    └── capture-flow.test.tsx           # composer → sheet → refresh (mock /api/capture)
```

**Structure Decision**: UI full-stack. A pasta `capture/` é a superfície canônica e **não deve
ter lógica de negócio acoplada ao painel** — ela recebe `placeholder` e callbacks, para ser reusada
intacta pelo onboarding (006). `triggerProactiveInsight` preenche o stub de 003 (mesma assinatura).

## Complexity Tracking

> Sem violações. Nota: `AudioButton` entra desabilitado (não removido) para acomodar áudio futuro
> sem refatorar o composer — costura intencional alinhada à decisão de escopo do MVP.
