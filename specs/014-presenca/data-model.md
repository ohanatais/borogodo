# Data Model: Presença — hub e costura (014)

**A 014 não altera schema.** Tudo aqui é leitura/reuso do que a 013 e features anteriores criaram. Esta
página existe para mapear o que é lido e o único valor novo de enum (em coluna de texto livre).

## Reuso — sem migration

### `drafts` (criada na 013)
Fonte da lista do hub. A 014 só **lê** (com um caminho de escrita de `status='discarded'` ao descartar,
já coberto pelo `PATCH /api/content/drafts/[id]` da 013).

Listagem (`listDrafts`): `select` escopado por `user_id`, ordenado por `created_at desc`, **paginado**
(limite + cursor/offset). RLS de `drafts` (013) cobre o acesso.

### `proactive_insights` (criada na 005)
Recebe o **novo valor de `type`**: `'content_opportunity'`. A coluna `type` é `text` livre (sem CHECK),
então **não há migration**. Campos reusados: `headline`, `body`, `entry_ids`, `seen`, `generated_at`.

| `type` (valores em uso) | Origem |
|---|---|
| `invisible_skill` / `emerging_pattern` / `connection` / `evidence_gap` | existentes (005) |
| `content_opportunity` | **novo (014)** — o nudge "isso daria um post" |

### `entries` agrupadas em projeto (via `getHistoricoData`)
O seed de "Usar projeto" (`seed_type='project'`) é a evidência agregada das entradas de um projeto.
Não é entidade nova; é a visão de projeto já montada pelo histórico. O `seed_ref` guarda a chave do
projeto (empresa/projeto) usada pelo `getHistoricoData`.

## Tipos de aplicação (`src/types/content.ts`, estendendo a 013)

- `DraftListItem` — projeção de leitura de `Draft` para a lista do hub: `id`, `format`, `status`,
  `seedType`, `seedLabel` (rótulo legível da evidência de origem), `createdAt`.
- `DraftListPage` — `{ items: DraftListItem[]; nextCursor: string | null }` (paginação).
- `ContentOpportunityInsight` — projeção de `ProactiveInsight` com `type='content_opportunity'`,
  carregando `entry_ids` para abrir a geração com a entrada como seed.

## Validação aplicada

- **Listagem**: paginação obrigatória (limite máximo de itens por página); nunca query ilimitada.
- **Nudge**: o disparo valida o sinal (impacto/métrica) antes de criar o insight; parcimônia por janela.
- **RLS**: herdada de `drafts` e `proactive_insights`; a 014 não relaxa nenhuma política.
