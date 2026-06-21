# Research: 017 Feed de Registros

## 1. Cursor Pagination

**Decision**: Cursor baseado em `(created_at, id)` — o campo de sort é passado como query
param opaco na URL; cada página retorna um `nextCursor` que o cliente inclui na
próxima requisição.

**Rationale**: `LIMIT/OFFSET` degrada com tabelas grandes (Postgres varre as linhas
descartadas). O cursor por `(created_at, id)` é estável mesmo com inserções
concorrentes e é indexável. Supabase não tem cursor nativo, mas
`.lt('created_at', cursorDate).or('and(created_at.eq.' + cursorDate + ',id.lt.' + cursorId + ')')` 
reusa os índices existentes.

**Alternatives considered**:
- Offset paginação: descartada — degrada com muitos registros e perde posição em
  inserções concorrentes.
- Supabase Range: `.range(from, to)` — internamente usa OFFSET, mesmo problema.

**Implementation notes**:
- Cursor serializado como base64(`${created_at}|${id}`) para opacidade na URL.
- Para o eixo `entry_date`, cursor é `(entry_date, id)` com `NULLS LAST` (entradas
  sem data ficam ao final).
- Tamanho de página: 20 itens (ajustável via constante `FEED_PAGE_SIZE`).

---

## 2. Activity Grid — Aggregação de Dados

**Decision**: Query de agregação server-side com `date_trunc('day', created_at)` via
Supabase `.select()` com `.gte`/`.lte` de janela de 52 semanas. Retorna array de
`{ date: string, count: number }` — o componente renderiza a grade no cliente.

**Rationale**: Carregar todas as entradas para agrupar no cliente viola a performance
com usuários com centenas de registros. A agregação no banco é O(1) com índice em
`(user_id, created_at)`. Não exige RPC/função SQL customizada — `.select('created_at')`
+ `.gte`/`.lte` num endpoint dedicado é suficiente para o MVP (sem granularidade
de semana, que é decisão do `/impeccable shape`).

**Alternatives considered**:
- RPC function: mais expressiva, mas exige migration SQL extra apenas para agregação
  — overkill para MVP.
- Aggregação client-side de todas as entradas: descartada — potencial de 500+ itens.

**Implementation notes**:
- Endpoint: `GET /api/feed/activity?window=52w` retorna `ActivityCell[]`.
- A célula é `day` ou `week` — **decisão diferida para `/impeccable shape`**. A API
  retorna granularidade por dia; o componente pode agregar por semana se necessário.
- Threshold de "massa crítica" para exibir a grade: ≥ 5 registros em dias distintos
  nos últimos 90 dias (constante, ajustável).

---

## 3. Geração de Título na Extração

**Decision**: Adicionar campo `title` ao prompt de extração Haiku existente (em
`DOCUMENT_EXTRACTION_SYSTEM_PROMPT` / `buildDocumentExtractionPrompt`) e ao schema
Zod. Sem chamada de IA extra — o campo `title` nasce no mesmo turno que os demais
campos.

**Rationale**: O Haiku já está ativo na extração; adicionar um campo ao JSON de saída
não aumenta custo relevante e não adiciona latência de chamada extra.

**Alternatives considered**:
- Chamada separada de geração de título: descartada — latência extra e custo desnecessário.
- Gerar título client-side (primeiro N chars): viável como fallback, mas não é o
  título curto e semântico que o feed precisa para ser legível.

**Implementation notes**:
- `title`: string, máx 80 chars, obrigatório no schema de extração (Zod `.max(80)`).
- Fallback determinístico: `what_i_did.slice(0, 60).trim()` — usado no feed para
  registros antigos (sem `title` persistido) ou em caso de falha de validação.
- `title` é adicionado ao `ExtractedEntry` como `title?: string | null` e ao `Entry`
  por extensão. A coluna DB é `TEXT DEFAULT NULL` — retrocompatível com registros
  antigos.

---

## 4. `EntryCard` Unificado

**Decision**: Criar `src/components/features/feed/EntryCard.tsx` com prop `variant:
'feed' | 'panel'`. O `EntryItem` atual (painel) passa a ser wrapper de `<EntryCard
variant="panel">`. `TrajectoryHighlights` é removido do painel e substituído pelo
novo bloco "Seus registros" (5 recentes + "Ver tudo →").

**Rationale**: O spec (FR-016) exige consolidação das três representações divergentes.
O `variant` isola diferenças de UI sem duplicar lógica de "Usar" e expansão. Manter
`EntryItem` como wrapper evita quebrar o painel de imediato — a remoção acontece
naturalmente na fase de implementação do painel.

**Alternatives considered**:
- Manter `EntryItem` e criar `FeedCard` separado: descartada — perpetua a divergência.
- Prop booleana `isPanel`: descartada — anti-pattern de composição (ver
  `vercel-composition-patterns`).

---

## 5. Estado de Filtros na URL

**Decision**: Usar `useSearchParams` / `next/navigation` para ler e escrever filtros
na URL. Parâmetros: `axis` (`created_at`|`entry_date`), `q` (busca textual), `from`
/ `to` (período ISO), `company`, `tags` (pipe-separated), `metric` (`true`),
`source`, `cursor`.

**Rationale**: O spec exige URL linkável (FR-005, FR-012). O App Router do Next.js 15
tem suporte nativo a `useSearchParams` com Suspense — sem biblioteca extra.

**Alternatives considered**:
- Estado local (useState): descartada — quebra a linkabilidade.
- Zustand/Jotai: descartada — overkill para filtros de URL.

**Implementation notes**:
- A página `/registros` é um Server Component que lê os search params iniciais e
  passa ao `FeedPage` (Client Component). Navegação de filtros acontece no cliente
  com `router.replace`.
- O cursor de paginação também vai na URL para que o botão "carregar mais" funcione
  com link direto.

---

## 6. Confirmação de Exclusão

**Decision**: Dialog de confirmação nativo via `<dialog>` / shadcn `<AlertDialog>` ao
clicar em "Excluir" no card. A exclusão chama `DELETE /api/entries/[id]` existente e
otimisticamente remove o item do estado local.

**Rationale**: O endpoint já existe e está correto (RLS, `eq('user_id', user.id)`).
Apenas a UI faltava. A remoção otimista dá feedback imediato; em caso de erro, o
item é restaurado e um toast de erro é exibido.

**Alternatives considered**:
- Server Action: poderia eliminar o endpoint REST, mas a consistência com o restante
  do projeto (que usa API routes para captura/enriquecimento) favorece manter o
  padrão.

---

## 7. Migration

**Decision**: `01X_entry_title.sql` — número confirmado na implementação conforme
ordem de merge (015 → 016 → 017). Provável `011` se 016 não adicionar migration.

**Conteúdo**:
```sql
ALTER TABLE entries ADD COLUMN IF NOT EXISTS title TEXT;
CREATE INDEX IF NOT EXISTS entries_user_entry_date_idx
  ON entries (user_id, entry_date DESC NULLS LAST);
```

**Rationale**: `title` é retrocompatível (`DEFAULT NULL`). O índice em `entry_date`
é necessário para o eixo "quando aconteceu" (FR-006) sem degradar queries com
`entry_date IS NULL`.

---

## 8. Busca Textual

**Decision**: `ilike('%' || :query || '%')` nos campos `what_i_did`, `tags` (array
contains com `@>`) e `title`. Validado/sanitizado server-side antes de qualquer
query — sem interpolação direta de string SQL.

**Rationale**: MVP textual é suficiente. O `ilike` do Postgres é case-insensitive e
não exige extensão. A busca semântica (reusando `embedding` + HNSW) fica como
evolução explicitamente fora de escopo no v1.

**Implementation notes**:
- Supabase client: `.ilike('what_i_did', `%${q}%`)` com `.or()` para title.
- Tags: `.contains('tags', [tag])` para cada tag selecionada.
- Proteção contra injeção: Supabase parameteriza todas as queries; não há interpolação
  manual de SQL.
