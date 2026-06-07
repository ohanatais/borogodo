# Data Model: Geração do Espelho

**Feature**: `004-mirror-generation` | **Date**: 2026-06-07

## Tabela `mirror_snapshots` (nova)

```sql
create table public.mirror_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mirror jsonb not null,
  primary_strength jsonb,
  strength_themes text[] default '{}',
  entry_count int not null,
  generated_at timestamptz default now(),
  resonated boolean,
  feedback_text text
);

alter table public.mirror_snapshots enable row level security;
create policy "own mirror" on public.mirror_snapshots for all using (auth.uid() = user_id);
create index mirror_snapshots_user_idx on public.mirror_snapshots(user_id, generated_at desc);
```

> A coluna `strength_themes` (mencionada no doc 002) entra junto com a tabela aqui.

### Campos

| Campo | Tipo | Notas |
|---|---|---|
| `mirror` | jsonb | estrutura `Mirror` completa (validada por Zod) |
| `primary_strength` | jsonb | atalho para a UI ler a força principal sem desserializar tudo |
| `strength_themes` | text[] | 3–6 temas; alimentam indicadores (005) e contexto de captura (003/004) |
| `entry_count` | int | nº de entradas consideradas — base do limiar de regeneração |
| `resonated` | boolean | feedback "faz sentido / nem tanto" (UI em 006) |
| `feedback_text` | text | texto livre quando "nem tanto" |

## Coluna em `profiles` (verificar/adicionar)

```sql
-- Se ainda não existir (confirmar no schema do 002):
alter table public.profiles add column if not exists onboarding_completed boolean default false;
```

`/api/mirror/generate` marca `onboarding_completed = true` ao concluir a primeira geração.

## Tipos TypeScript

```typescript
// src/types/mirror.ts
export interface MirrorSection { headline: string; evidence: string }

export interface Mirror {
  intro: string
  primary_strength: MirrorSection
  invisible_skill: MirrorSection
  context_pattern: MirrorSection
  closing_question: string
  strength_themes: string[]
}
```

## Validação (Zod, antes de persistir)

- `intro`: string não-vazia.
- `primary_strength`/`invisible_skill`/`context_pattern`: `{ headline, evidence }` não-vazios.
- `closing_question`: string terminando idealmente com "?".
- `strength_themes`: array de 3–6 strings.

## Constante de limiar

```typescript
const REGEN_EVERY = 3   // regenera a cada 3 novas entradas desde o último snapshot
```

## Relacionamentos

- `mirror_snapshots.user_id` → `auth.users.id` (cascade).
- Lê de `entries` (003) para montar o prompt; `entry_count` referencia a contagem usada.
- `strength_themes` é lido por `buildCaptureContext` (003) e pelos indicadores do painel (005).
