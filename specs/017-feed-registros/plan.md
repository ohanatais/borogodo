# Implementation Plan: Feed de Registros (+ Grade-Faísca)

**Branch**: `017-feed-registros` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feed cru de registros + grade de atividade + título na extração. Segundo
elo da aposta de retenção (ver [spec.md](spec.md) e `docs/discovery-retencao-e-conteudo.md`).

## Summary

A 017 entrega `/registros` — o feed cronológico de tudo que foi capturado, com cards
colapsáveis, dois eixos de tempo (anotei / aconteceu), busca textual, filtros
combináveis, exclusão de registro e grade de atividade estilo GitHub. O painel passa a
apontar para o feed via "Ver tudo →". A extração ganha o campo `title` gerado junto
(sem chamada extra de IA). Nenhuma greenfield — tudo evolui código existente.

## Technical Context

**Language/Version**: TypeScript 5 (strict) · Next.js 15 App Router

**Primary Dependencies**: Supabase (PostgreSQL + Auth + RLS), Anthropic Haiku
(extração — title via schema extension), shadcn/ui (AlertDialog para confirmação de exclusão), next-intl, Framer Motion (entrada de cards), Lucide React

**Storage**: PostgreSQL via Supabase — nova coluna `title TEXT NULL` em `entries`
(migration `01X`), novo índice `(user_id, entry_date DESC NULLS LAST)`

**Testing**: Vitest + Testing Library (unit + integration)

**Target Platform**: Next.js 15 (web, mobile-first)

**Performance Goals**: Primeira página do feed < 500ms (Server Component + Supabase
edge). Grade-faísca < 200ms (query de agregação indexada).

**Constraints**: Paginação cursor-based (`FEED_PAGE_SIZE = 20`), sem carregar all entries
em memória. Grade-faísca agrega no servidor.

**Scale/Scope**: 1 rota nova, 2 endpoints de API, ~8 componentes novos/alterados,
1 migration, 1 função de dados nova.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Security First | ✅ | RLS em todos os queries; DELETE existente já filtra `user_id`; busca parametrizada |
| II. TypeScript Strict | ✅ | Sem `any`; tipos explícitos em `FeedItem`, `FeedQuery`, `ActivityCell` |
| III. AI-First | ✅ | Haiku para geração de `title` na extração; sem model mix-up |
| IV. Server-First | ✅ | `/registros` é Server Component; cliente só para interatividade de filtros/cards |
| V. Accessibility | ✅ | `aria-expanded` em cards (já no `EntryItem`); 48px touch targets; focus indicators |
| VI. TDD | ✅ | Tests antes de implementação; ≥80% cobertura em `getFeedData`, `getActivityData`, `<EntryCard>` |
| VII. Design Identity | ✅ | `/impeccable shape` antes de implementar a tela; tokens do sistema; sem hex hardcoded |
| VIII. Mobile-First | ✅ | Base (unprefixed) mobile; `md:` só para expansão; 48px targets |
| IX. i18n | ✅ | Todas as strings em `pt-BR.json` (namespace `feed`); `en.json` espelhado |

**Violações**: Nenhuma.

## Project Structure

### Documentation (this feature)

```text
specs/017-feed-registros/
├── plan.md              ← este arquivo
├── spec.md
├── research.md          ← Phase 0 ✅
├── data-model.md        ← Phase 1 ✅
├── quickstart.md        ← Phase 1 ✅
├── shape.md             ← /impeccable shape ✅
├── contracts/
│   └── api-feed.md      ← Phase 1 ✅
└── tasks.md             ← /speckit-tasks ✅
```

### Source Code

```text
src/
  types/
    entry.ts                       ← add title?: string | null to ExtractedEntry

  lib/
    ai/
      extraction/
        schemas.ts                 ← add title to Zod schema + prompt
        extractEntries.ts          ← prompt update (ou prompts/linkedin.ts)
    db/
      entries.ts                   ← saveEntries picks up title naturally
    feed/                          ← NOVO
      types.ts                     ← FeedItem, FeedQuery, ActivityCell, FeedPage
      getFeedData.ts               ← server-side data fetcher (mirrors getHistoricoData)
      getActivityData.ts           ← aggregation for grade-faísca
    panel/
      getPanelData.ts              ← remove highlights query, add title to recentEntries select

  components/
    features/
      feed/                        ← NOVO
        EntryCard.tsx              ← unified card (variant: 'feed' | 'panel')
        FeedFilters.tsx            ← client: axis toggle, search, dropdowns
        ActivityGrid.tsx           ← client: grade-faísca
        FeedPage.tsx               ← client: orquestra feed + paginação + filtros
        EmptyFeed.tsx              ← estado de boas-vindas
      painel/
        EntryItem.tsx              ← wrapper → <EntryCard variant="panel">
        RecentEntries.tsx          ← 5 entries + "Ver tudo →" link
        TrajectoryHighlights.tsx   ← REMOVIDO (ou mantido como dead code até cleanup)

  app/
    [locale]/
      (app)/
        registros/
          page.tsx                 ← Server Component (lê search params, 1ª página)
          loading.tsx              ← Suspense skeleton
        painel/
          page.tsx                 ← remove TrajectoryHighlights, wire RecentEntries v2

  app/api/
    feed/
      route.ts                     ← GET /api/feed
      activity/
        route.ts                   ← GET /api/feed/activity

  messages/
    pt-BR.json                     ← add feed.* namespace
    en.json                        ← mirror stub

supabase/
  migrations/
    01X_entry_title.sql            ← title column + entry_date index
```

## Complexity Tracking

Nenhuma violação da constituição exige justificativa.

---

## Decisões-chave

### Cursor Pagination
Cursor `base64(created_at|id)` — estável mesmo com inserções concorrentes.
Detalhe completo: [research.md](research.md#1-cursor-pagination).

### Title na Extração
Campo adicionado ao schema Zod e ao prompt Haiku existente — sem chamada extra.
Fallback: `what_i_did.slice(0, 60)`.
Detalhe completo: [research.md](research.md#3-geração-de-título-na-extração).

### EntryCard Unificado
`variant: 'feed' | 'panel'` substitui `EntryItem` e `TrajectoryHighlights`.
Detalhe completo: [research.md](research.md#4-entrycard-unificado).

### Estado na URL
`useSearchParams` + `router.replace` — sem biblioteca extra.
Detalhe completo: [research.md](research.md#5-estado-de-filtros-na-url).

### Migration Number
**Confirmar no kickoff de implementação**: `010` é da 015 (mergeada); provável
`011` se 016 não adicionar migration. Ver [spec.md](spec.md#assumptions).

### Grade-Faísca: Granularidade
**Diferida para `/impeccable shape`**: dia vs semana depende da frequência real
das personas. A API retorna granularidade por dia; o componente pode agregar.
