# Data Model: Painel Principal

**Feature**: `005-panel-dashboard` | **Date**: 2026-06-07

## Tabela `proactive_insights` (nova)

```sql
create table public.proactive_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,         -- 'invisible_skill' | 'emerging_pattern' | 'connection' | 'evidence_gap'
  headline text not null,
  body text not null,
  entry_ids uuid[] default '{}',
  seen boolean default false,
  generated_at timestamptz default now()
);

alter table public.proactive_insights enable row level security;
create policy "own insights" on public.proactive_insights for all using (auth.uid() = user_id);
create index proactive_insights_user_unseen_idx
  on public.proactive_insights(user_id, seen, generated_at desc);
```

## Leituras do painel (Server Component, em paralelo)

```typescript
const [countRes, entriesRes, mirrorRes, insightRes] = await Promise.all([
  supabase.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  supabase.from('entries').select('id, what_i_did, source, entry_date, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
  supabase.from('mirror_snapshots').select('primary_strength, strength_themes, generated_at')
    .eq('user_id', userId).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  supabase.from('proactive_insights').select('*')
    .eq('user_id', userId).eq('seen', false).order('generated_at', { ascending: false })
    .limit(1).maybeSingle(),
])
```

## Lógica derivada (pura, testável)

```typescript
// src/lib/panel/getMirrorStatus.ts
function getMirrorStatus(entryCount: number): 'building' | 'emerging' | 'active' {
  if (entryCount < 4)  return 'building'
  if (entryCount < 10) return 'emerging'
  return 'active'
}
const STATUS_CONFIG = {
  building: { dot: 'bg-orange-500', label: 'Em construção' },
  emerging: { dot: 'bg-amber-500',  label: 'Tomando forma' },
  active:   { dot: 'bg-green-500',  label: 'Ativo' },
} as const

// src/lib/panel/getCapturePrompt.ts
function getCapturePrompt(days: number | null, themes?: string[]): string {
  if (days === null) return 'Conta uma coisa que você fez no trabalho.'
  if (days === 0) return 'Boa. Tem mais alguma coisa do dia?'
  if (days === 1) return 'O que aconteceu no trabalho ontem?'
  if (days <= 3) return `Faz ${days} dias. O que rolou no trabalho?`
  if (themes?.length) return `Sua força em "${themes[0]}" pede mais evidência. Tem algo recente?`
  return 'Uma semana é muito tempo. Conta o que você fez.'
}
```

> **i18n**: os textos acima vivem em `pt-BR.json` (chaves `capture.prompt.*`, `panel.status.*`);
> as funções recebem/retornam chaves ou usam `getTranslations`. Nada hardcoded em componente.

## Indicadores (IndicatorStrip)

| Indicador | Fonte | Mostra quando |
|---|---|---|
| N entradas | `count(entries)` | sempre |
| X meses | `max(entry_date) - min(entry_date)` | ≥ 2 entradas datadas |
| Y forças | `count(mirror.strength_themes)` | há `mirror_snapshot` |
| Há Z dias | `now() - max(created_at)` | sempre (variações sem culpa) |

## Tipos consumidos (de 003/004)

- `Entry` (003), `Reflection`/`CaptureInput` (003), `Mirror`/`MirrorSection` (004).
- Novo: `ProactiveInsight` em `src/types/insight.ts`.

## Relacionamentos

- `proactive_insights.user_id` → `auth.users.id` (cascade).
- Lê `entries`/`mirror_snapshots`; `entry_ids[]` referencia entradas que embasam o insight.
