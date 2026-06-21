# Data Model: Repertório (017)

**Sem mudança de schema.** A feature reusa as estruturas existentes. Este documento mapeia as
entidades conceituais aos dados já existentes.

## Entidades

### Hub (intenção) — dado de UI, não persistido
- `type Hub = 'mostrar' | 'preparar'`
- Agrupador de alto nível do que a pessoa quer fazer. Vive só na interface (`intentions.ts`).

### PrepMoment (momento de preparação) — dado de UI + rótulo no rascunho
- `type PrepMoment = 'entrevista' | 'review' | 'salario'`
- Mapeado em `PREP_MOMENTS: Record<PrepMoment, { angleHint: string; labelKey: string; starters: string[] }>`.
- `angleHint` → enviado como `angle` para `/api/content/generate`.
- Persistido como **rótulo livre** em `drafts.qa.moment` (jsonb) quando um rascunho nasce de um
  momento. Não é coluna, não é formato, não volta ao cliente (DRAFT_COLUMNS não expõe `qa`).

### Draft (rascunho) — entidade existente, sem campos novos
- Tabela `drafts` já tem: `format`, `seed_type`, `seed_ref`, `angle` (text), `body`, `status`,
  `voice_feedback`, `qa` (jsonb), `created_at`, `updated_at`, `user_id`.
- A novidade é apenas o conteúdo de `qa`: passa a poder conter `{ angle, evidenceRefs, moment }`
  (antes `{ angle, evidenceRefs }`).

## Contratos afetados (sem rota nova)

### `POST /api/chat` — extensão do `context`
- Antes: `context: { type: 'espelho'|'historico'|'empresa'|'entry', entityId? }`
- Depois: `type` ganha `'preparacao'`; novo campo `moment?: 'entrevista'|'review'|'salario'`.
- Retrocompatível: `context` e `moment` são opcionais; payloads antigos seguem válidos.

### `POST /api/content/generate` — sem mudança
- Já aceita `angle?` (hoje subutilizado). Passa a receber o `angleHint` do momento.

### `POST /api/content/drafts` — sem mudança
- Já aceita `qa: z.record(z.string(), z.unknown())`. Passa a receber `qa.moment`.

## Invariantes

- Escopo por `user_id` reforçado por RLS em todas as leituras/escritas (inalterado).
- `seedRef` validado como do usuário antes de qualquer chamada ao LLM (via `loadSeedEvidence`).
- Nenhuma migração; footprint de schema = 0.
