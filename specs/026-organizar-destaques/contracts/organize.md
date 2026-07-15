# Contract: Organizar (manual e assíncrono)

## `POST /api/entries/[id]/organize`

Disparado pelo botão "Organizar" (US1) — síncrono do ponto de vista do cliente (a pessoa espera o
resultado, SC-001: <15s).

**Auth**: mesma convenção de toda rota de `entries` — 401 se `!user`, e toda query subsequente
filtra por `user_id = user.id` (constituição I).

**Request**: sem body — a fonte já existe (`id` no path).

**Comportamento**:
1. Carrega a fonte (`entries`) por `id` + `user_id` — 404 se não encontrada/não pertence ao user.
2. Guarda de concorrência (FR-031): se `organizing_started_at` já setado e recente (< 60s),
   responde `200 { status: 'already_organizing' }` sem disparar nova chamada de IA.
3. Seta `organizing_started_at = now()`.
4. Chama `organizeEntry()` (Haiku, `claude-haiku-4-5`) com: `raw_content`, contexto já resolvido
   (`company`/`is_personal_project`/`entry_date` — omitidos do prompt se já preenchidos, FR-004/
   FR-006), vocabulário de tags da pessoa (Story 6), destaques/campos já preenchidos manualmente
   (para o prompt não tentar repeti-los — reforça FR-002 na origem).
5. Valida o resultado (Zod, `organizeResultSchema`).
6. Persiste, em uma transação lógica (múltiplas queries, todas por `user_id`):
   - Insere um `entry_highlights` por destaque identificado (nunca sobrescreve destaques já
     existentes — só adiciona; um destaque já existente com campos preenchidos manualmente segue
     as regras de FR-002 fora deste fluxo, via `PATCH /api/entries/[id]/highlights/[highlightId]`).
   - Atualiza `entries.company`/`entries.entry_date` SE ainda vazios (nunca sobrescreve).
   - Recalcula o rollup `entries.tags` (união de todas as tags dos destaques da fonte).
   - Seta `entries.organized_at = now()`, `entries.organizing_started_at = null`.
7. Falha em qualquer passo de IA (timeout, erro de API, resultado inválido): não lança erro para
   o cliente como bloqueio de dado — limpa `organizing_started_at = null` (permite nova tentativa,
   FR-030), responde `200 { status: 'failed' }` (fonte segue salva e visível, nada é perdido).

**Response** (sucesso): `200 { status: 'organized', highlights: EntryHighlight[], company:
string | null, is_personal_project: boolean, entry_date: string | null }`

**Response** (já em andamento): `200 { status: 'already_organizing' }`

**Response** (falha de IA): `200 { status: 'failed' }` — nunca 5xx só por falha da chamada de IA
(FR-030); 5xx reservado a erro de banco/infra real.

## Disparo assíncrono (fire-and-forget, FR-009)

Não é uma rota HTTP separada — reusa `organizeEntry()` (mesma função do passo 4-6 acima) chamada
de dentro de `dispatchAsyncJobs()` em `src/app/api/capture/route.ts`, via o `fireAndForget()` já
existente em `src/lib/ai/extraction/jobs.ts`:

```ts
function dispatchAsyncJobs(userId: string, entryId: string): void {
  fireAndForget('triggerProactiveInsight', triggerProactiveInsight(userId))
  fireAndForget('maybeRegenerateMirror', maybeRegenerateMirror(userId))
  fireAndForget('triggerEnrichmentNudge', triggerEnrichmentNudge(userId))
  fireAndForget('triggerOrganizeEntry', triggerOrganizeEntry(userId, entryId))
}
```

Chamado a partir de **todos** os caminhos de captura que hoje já chamam `dispatchAsyncJobs`
(`handleMarcoCapture`, `handleTextCapture`, `handleFileCapture`) **e** do caminho `deposito`
(`handleDepositoCapture`), que hoje não chama `dispatchAsyncJobs` — esta é uma correção necessária
para FR-009 (todo registro salvo, incluindo o do drawer 025, deve disparar organização).

`triggerOrganizeEntry(userId, entryId)` é uma função fina que só chama `organizeEntry()` com o
mesmo guard de concorrência do passo 2-3 acima (evita corrida entre um clique manual e o disparo
assíncrono acontecendo quase ao mesmo tempo).

## `PATCH /api/entries/[id]/highlights/[highlightId]`

Edição manual de um destaque (título, métrica, impacto, tags) — reusa o padrão já existente de
`PATCH /api/entries/[id]` (schema Zod, filtro por `user_id`, 404 se não encontrado).

**Request body** (todos opcionais, ao menos um obrigatório): `{ title?, metric?, impact?, tags?
}`.

**Comportamento**: atualiza a linha de `entry_highlights` (checando `entry_id`/`user_id` via join
implícito na query). Se `tags` mudou, recalcula o rollup `entries.tags` da fonte pai.

## `POST /api/entries/[id]/highlights`

Adicionar manualmente um novo destaque em branco (FR-016, "+ adicionar destaque").

**Request body**: `{}` (sem campos obrigatórios — cria um destaque vazio, `position` = último + 1).

**Response**: `201 { highlight: EntryHighlight }`.

## `DELETE /api/entries/[id]/highlights/[highlightId]`

Remove um destaque (FR-015) — afeta só aquele destaque; a fonte e os demais destaques permanecem
intactos. Recalcula o rollup `entries.tags` após a remoção.

## `PATCH /api/entries/[id]` (rota já existente — extensão de campos aceitos)

Adiciona `company` (já aceito? conferir — hoje aceita `company` mas não `is_personal_project`) e
`is_personal_project` ao `updateEntrySchema` já existente em `src/app/api/entries/[id]/route.ts`
— é o endpoint usado pela seleção de pílula de contexto (Story 2): selecionar uma pílula é um
`PATCH` direto, sem chamada de IA (FR-003, "custo zero").
