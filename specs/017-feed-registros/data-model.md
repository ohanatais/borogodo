# Data Model: 017 Feed de Registros

## Mudanças no Schema

### `entries` (alteração)

```sql
-- Migration 01X_entry_title.sql
ALTER TABLE entries ADD COLUMN IF NOT EXISTS title TEXT;
CREATE INDEX IF NOT EXISTS entries_user_entry_date_idx
  ON entries (user_id, entry_date DESC NULLS LAST);
```

| Campo       | Tipo        | Nullable | Default | Notas                                         |
|-------------|-------------|----------|---------|-----------------------------------------------|
| `title`     | TEXT        | sim      | NULL    | Gerado na extração; NULL em registros antigos |

Índices novos:
- `entries_user_entry_date_idx` — suporta o eixo "quando aconteceu" (FR-006)

Índices existentes relevantes:
- `entries_user_id_created_at_idx` (ou equivalente) — suporta o eixo "quando anotei"
- `entries_embedding_hnsw_idx` — não afetado por esta feature

RLS existente: `auth.uid() = user_id` cobre todos os acessos.

---

## Tipos TypeScript

### `ExtractedEntry` (alterado, `src/types/entry.ts`)

```typescript
export interface ExtractedEntry {
  // existentes
  what_i_did: string
  decision?: string | null
  learning?: string | null
  impact?: string | null
  metric?: string | null
  entry_date?: string | null
  tags: string[]
  company?: string | null
  role_title?: string | null
  role_start?: string | null
  role_end?: string | null
  project_name?: string | null
  raw_content: string
  source: EntrySource
  // NOVO
  title?: string | null
}
```

### `FeedItem` (novo, `src/lib/feed/types.ts`)

Projeção de `Entry` para o feed — campo por campo o que o `<EntryCard>` precisa.

```typescript
export interface FeedItem {
  id: string
  title: string           // IA ou fallback determinístico — nunca vazio
  what_i_did: string
  source: EntrySource
  created_at: string
  entry_date: string | null
  company: string | null
  role_title: string | null
  metric: string | null
  tags: string[]
  thumbnail: string | null  // primeira evidence.value onde type === 'image'
  impact: string | null
  decision: string | null
  learning: string | null
}
```

### `FeedQuery` (novo, `src/lib/feed/types.ts`)

Estado dos filtros, serializável na URL.

```typescript
export type FeedAxis = 'created_at' | 'entry_date'

export interface FeedQuery {
  axis: FeedAxis          // default: 'created_at'
  q?: string              // busca textual
  from?: string           // ISO date
  to?: string             // ISO date
  company?: string
  tags?: string[]
  metricOnly?: boolean
  source?: EntrySource
  cursor?: string         // base64(date|id)
}
```

### `ActivityCell` (novo, `src/lib/feed/types.ts`)

```typescript
export interface ActivityCell {
  date: string    // YYYY-MM-DD
  count: number
}
```

### `FeedPage` (novo, `src/lib/feed/types.ts`)

```typescript
export interface FeedPage {
  items: FeedItem[]
  nextCursor: string | null   // null = sem próxima página
  total: number | null        // contagem aproximada para exibição
}
```

---

## Funções de Dados

### `getFeedData(supabase, userId, query)` — novo em `src/lib/feed/getFeedData.ts`

Espelha o padrão de `getHistoricoData.ts`. Recebe `FeedQuery`, retorna `FeedPage`.

Lógica:
1. Decodifica cursor → `(cursorDate, cursorId)` se presente.
2. Aplica filtros: axis sort, `q` (ilike), `from`/`to`, `company`, `tags`, `metric`, `source`.
3. Retorna `FEED_PAGE_SIZE + 1` itens; se count = page+1 → há próxima página, corta o extra e
   encoda o cursor do último item.
4. Aplica fallback de `title`: `item.title ?? item.what_i_did.slice(0, 60).trim()`.
5. Extrai `thumbnail` de `evidences` JSONB.

### `getActivityData(supabase, userId, windowDays)` — novo em `src/lib/feed/getActivityData.ts`

Retorna `ActivityCell[]` para os últimos `windowDays` dias (default 365).

```sql
SELECT DATE(created_at) as date, COUNT(*) as count
FROM entries
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '$2 days'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

---

## Componentes

### `<EntryCard>` (novo, `src/components/features/feed/EntryCard.tsx`)

```typescript
interface EntryCardProps {
  item: FeedItem
  variant: 'feed' | 'panel'
  onDelete?: (id: string) => void  // undefined no variant 'panel'
}
```

Substitui `EntryItem` (painel) e serve o feed. `EntryItem` passa a ser
`<EntryCard variant="panel">` com wrapper mínimo.

### `<ActivityGrid>` (novo, `src/components/features/feed/ActivityGrid.tsx`)

```typescript
interface ActivityGridProps {
  cells: ActivityCell[]
  onCellClick: (date: string) => void
}
```

**Decisões cravadas no `/impeccable shape`** (ver [shape.md](shape.md) §8):
- Símbolo: ✦ (U+2726 — Black Four Pointed Star). Semântico com "faísca"; evita copiar GitHub.
- Granularidade: **dia** (célula = 1 dia, linha = 1 semana, 7 colunas Seg–Dom).
- Intensidade por tamanho + cor simultâneos:
  - `0` → 8px, roxo-jambo muito claro, opacidade 0.3
  - `1` → 9px, roxo-jambo claro, opacidade 0.85
  - `2–3` → 11px, roxo-jambo médio, opacidade 1.0
  - `4+` → 13px, roxo-jambo pleno, opacidade 1.0
- Layout **desktop** (≥768px): faixa vertical sticky à direita, 52 semanas, mais recente no topo, label de mês à esquerda.
- Layout **mobile** (<768px): faixa horizontal compacta, 13 semanas, scroll suave sem scrollbar.
- **Threshold**: `GRID_MIN_DISTINCT_DAYS = 5` dias distintos nos últimos 90 dias. Abaixo do threshold a grade não aparece.
- Hover: scale 1.4, CSS transition 150ms ease-out (sem Framer Motion).

### `<FeedFilters>` (novo, `src/components/features/feed/FeedFilters.tsx`)

Client component — gerencia toggle de eixo, busca textual, dropdowns de filtro.
Serializa estado em URL via `router.replace`.

---

## Endpoints de API

### `GET /api/feed`

Query params: todos os campos de `FeedQuery` serializados.

Resposta: `FeedPage` (JSON).

Auth: `createServerClient()` + `getUser()` — 401 se não autenticado.
RLS: filtra por `user_id = auth.uid()` (dupla garantia: query + RLS).

### `GET /api/feed/activity`

Query params: `window` (número de dias, default 365, max 730).

Resposta: `ActivityCell[]` (JSON).

Auth: idem.

---

## Páginas

### `/registros` — `src/app/[locale]/(app)/registros/page.tsx`

Server Component. Lê search params iniciais, faz fetch server-side da primeira página
via `getFeedData`, passa dados ao `<FeedPageClient>` (Client Component). A navegação
de filtros subsequente é client-side via `router.replace` + fetch do `/api/feed`.

### Painel — `src/app/[locale]/(app)/painel/page.tsx` (alterado)

Remove `<TrajectoryHighlights>`. Adiciona `<RecentEntries count={5}>` + link "Ver tudo →"
para `/registros`. Mantém `<MiniTimeline>`.

`getPanelData` retorna `recentEntries` com `title` incluído (já no select existente
após migration).

---

## i18n Keys Novas (`src/messages/pt-BR.json`)

Namespace `feed`:
```json
{
  "feed": {
    "title": "Seus registros",
    "empty": {
      "heading": "Nenhum registro ainda",
      "cta": "Fazer minha primeira captura"
    },
    "axis": {
      "created_at": "Quando anotei",
      "entry_date": "Quando aconteceu"
    },
    "filters": {
      "search": "Buscar registros…",
      "period": "Período",
      "company": "Empresa",
      "tags": "Tags",
      "metricOnly": "Com métrica",
      "source": "Origem",
      "clear": "Limpar filtros"
    },
    "card": {
      "expand": "Ver detalhes",
      "collapse": "Recolher",
      "usar": "Usar",
      "delete": "Excluir",
      "deleteConfirm": {
        "title": "Excluir este registro?",
        "description": "Esta ação é definitiva. Rascunhos gerados a partir dele não são apagados.",
        "cancel": "Cancelar",
        "confirm": "Excluir"
      }
    },
    "pagination": {
      "loadMore": "Carregar mais"
    },
    "noDate": "Sem data",
    "viewAll": "Ver tudo →"
  }
}
```
