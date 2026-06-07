# Data Model: Pipeline de Captura

**Feature**: `003-capture-pipeline` | **Date**: 2026-06-07

## Tabela `entries` (nova — criada nesta feature)

Um momento de trabalho estruturado. Reusada por 004 (lê para o espelho), 005 (lê recentes),
006 (import LinkedIn).

```sql
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  what_i_did text not null,
  decision text,
  learning text,
  impact text,
  metric text,
  entry_date date,
  tags text[] default '{}',
  source text not null,         -- 'linkedin_pdf' | 'audio' | 'text' | 'chips' | 'image'
  raw_content text,
  company text,
  role_title text,
  role_start date,
  role_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.entries enable row level security;
create policy "own entries" on public.entries for all using (auth.uid() = user_id);
create index entries_user_created_idx on public.entries(user_id, created_at desc);
```

> **Migration**: arquivo em `supabase/migrations/00X_entries.sql`. Rodar no SQL editor do
> Supabase antes de testar a rota (ação manual — ver `quickstart.md`).

### Campos

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `id` | uuid | sim | PK |
| `user_id` | uuid | sim | FK `auth.users`; base da RLS |
| `what_i_did` | text | sim | **voz preservada** da pessoa; não reescrever |
| `decision` / `learning` / `impact` / `metric` | text | não | enriquecíveis via `/enrich` |
| `entry_date` | date | não | data do fato (não da captura) |
| `tags` | text[] | não | skills/temas concretos (= pills do reflexo) |
| `source` | text | sim | origem da entrada |
| `raw_content` | text | não | input bruto original |
| `company` / `role_title` / `role_start` / `role_end` | — | não | preenchidos no import LinkedIn |
| `created_at` / `updated_at` | timestamptz | sim | default `now()` |

### Regras de validação (Zod, antes de persistir)

- `what_i_did`: string não-vazia.
- `tags`: array de strings (default `[]`).
- `source`: um de `EntrySource`.
- Campos opcionais: `nullish`.
- O lote de uma captura: ≥ 1 entrada; falha de validação de qualquer item invalida o lote (MVP).

## Tipos TypeScript (compartilhados)

```typescript
// src/types/entry.ts
export type EntrySource = 'linkedin_pdf' | 'audio' | 'text' | 'chips' | 'image'

export interface ExtractedEntry {
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
  raw_content: string
  source: EntrySource
}

export interface Entry extends ExtractedEntry {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}
```

```typescript
// src/types/capture.ts
export type CaptureInput =
  | { kind: 'text'; content: string }
  | { kind: 'audio'; blob: Blob }     // costura (501 no MVP)
  | { kind: 'image'; file: File }     // costura (501 no MVP)
  | { kind: 'file'; file: File }

export type ReflectionMoveType = 'question' | 'affirmation' | 'suggestion'

export interface ReflectionMove {
  type: ReflectionMoveType
  text: string
  field?: 'metric' | 'impact' | 'decision' | 'learning'  // para 'question'
}

export interface Reflection {
  summary: string        // 1–2 frases na voz da pessoa ("Entendi: ...")
  pills: string[]        // 2–4 dimensões (= tags principais)
  move: ReflectionMove   // UM movimento só
}

export interface CaptureContext {
  strengthThemes: string[]   // do mirror_snapshot mais recente (até 6) — vazio até feature 004
  recentSummaries: string[]  // what_i_did das ~5 últimas entradas
  entryCount: number
}

export interface CaptureResult {
  entries: Entry[]
  reflection: Reflection
}
```

> Nota: `CaptureContext.strengthThemes` lê de `mirror_snapshots`, que só existe a partir da
> feature 004. Em 003, `buildCaptureContext` retorna `strengthThemes: []` se a tabela/registro
> não existir (consulta com `maybeSingle()` tolerante). Isso evita acoplamento prematuro.

## Transições de estado

`entries` não tem máquina de estados; é append + enrich pontual. `updated_at` muda no enrich.

## Relacionamentos

- `entries.user_id` → `auth.users.id` (cascade delete).
- `entries` é lida por `mirror_snapshots` generation (004) e pelo painel (005) — sem FK reversa.
