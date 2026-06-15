# Data Model: Presença — hub, gestão e sugestões (014)

**A 014 não altera schema.** Tudo aqui é leitura/escrita/reuso do que a 013 e features anteriores
criaram — incluindo a coluna `status` (com `'discarded'`) e a política RLS de `delete` de `drafts`, que a
013 já entregou. Esta página mapeia o que é lido/escrito e o único valor novo de enum (em coluna de texto
livre).

## Reuso — sem migration

### `drafts` (criada na 013)
Fonte da lista do hub e objeto da **gestão total**. A 014 usa:

- **Leitura (`listDrafts`)**: `select` escopado por `user_id`, ordenado por `created_at desc`,
  **paginado** (limite + cursor) e **filtrado por status**. A lista ativa **exclui `status='discarded'`
  por padrão** (conserto de comportamento); o filtro "Arquivados" pede explicitamente os `discarded`.
- **Editar / arquivar / restaurar (`PATCH /api/content/drafts/[id]`, da 013)**: `body` (+`status='edited'`)
  ao editar; `status='discarded'` ao arquivar; `status='edited'` ao restaurar. Já coberto pelo PATCH da
  013, escopado por `user_id` E `id`.
- **Excluir definitivamente (`deleteDraft` + `DELETE /api/content/drafts/[id]`, novo na 014)**: remove a
  linha. Usa a política RLS **`delete`** que a migration 009 já criou (`for delete using (auth.uid() =
  user_id)`). Filtra por `id` E `user_id`; id alheio não apaga nada (rota mapeia 404).

RLS de `drafts` (013) cobre todo acesso — select, update e delete por comando, com `with check` no
insert/update. **A 014 não relaxa nenhuma política nem adiciona coluna.**

### `proactive_insights` (criada na 005)
Recebe o **novo valor de `type`**: `'content_opportunity'`. A coluna `type` é `text` livre (sem CHECK),
então **não há migration**. Campos reusados: `headline`, `body`, `entry_ids`, `seen`, `generated_at`.

| `type` (valores em uso) | Origem |
|---|---|
| `invisible_skill` / `emerging_pattern` / `connection` / `evidence_gap` | existentes (005) |
| `content_opportunity` | **novo (014)** — o nudge "isso daria um post" |

### `entries` agrupadas em projeto (via `getHistoricoData`)
O seed de "Usar projeto" (`seed_type='project'`) é a evidência agregada das entradas de um projeto. Não é
entidade nova; é a visão de projeto já montada pelo histórico. O `seed_ref` guarda a chave do projeto
(empresa/projeto) usada pelo `getHistoricoData`.

### Pontos de partida das sugestões (leitura de dado existente)
A faixa "Sugestões pra você" na Presença cruza dado que já existe, **sem IA no caminho de leitura**:
- `mirror_snapshots.strength_themes` (temas do espelho) e `entries` com sinal de impacto forte, **filtrando
  os que ainda não têm rascunho** (sem `draft` com aquele `seed_ref`);
- os `proactive_insights` de `type='content_opportunity'` ainda **não-vistos** (`seen=false`).

## Tipos de aplicação (`src/types/content.ts`, estendendo a 013)

- `DraftStatusFilter` — `'ativos' | 'copiados' | 'arquivados'` (mapeado para o filtro de status na query;
  "ativos" exclui `discarded`).
- `DraftListPage` — `{ items: Draft[]; nextCursor: string | null }` (paginação).
- `ContentSuggestion` — projeção **não persistida** de um item da faixa de sugestões: une um nudge
  pendente (`content_opportunity`) ou um ponto de partida determinístico (tema/entrada) numa forma que
  abre a geração (`seedType`, `seedRef`, `seedSummary`, `formats`).
- `ContentOpportunityInsight` — projeção de `ProactiveInsight` com `type='content_opportunity'`,
  carregando `entry_ids` para abrir a geração com a entrada como seed.

## Validação aplicada

- **Listagem**: paginação obrigatória (teto por página); nunca query ilimitada; filtro de status no
  servidor.
- **Exclusão definitiva**: irreversível, exige confirmação na UI (a confirmação é UX; a barreira real é a
  RLS de `delete` + o escopo `id`+`user_id`).
- **Arquivar/restaurar**: reversível, sem confirmação; só troca `status`.
- **Nudge**: o disparo valida o sinal (impacto/métrica) antes de criar o insight; parcimônia por janela.
- **Sugestões da Presença**: derivadas de dado existente; somem quando não há material (sem placeholder).
- **RLS**: herdada de `drafts` (select/update/**delete**) e `proactive_insights`; a 014 não relaxa nada.
