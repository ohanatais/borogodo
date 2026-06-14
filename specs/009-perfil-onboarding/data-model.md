# Data Model: 009 — Perfil do Usuário + Onboarding

**Feature Branch**: 009-perfil-onboarding
**Data**: 2026-06-14

---

## Mudanças no schema

### Tabela `public.profiles` — novos campos

```sql
-- supabase/migrations/005_profiles_links.sql

alter table public.profiles
  add column if not exists linkedin_url   text,
  add column if not exists github_url     text,
  add column if not exists current_title  text,
  add column if not exists area           text;
```

| Campo | Tipo | Nulável | Quem preenche | Descrição |
|-------|------|---------|--------------|-----------|
| `linkedin_url` | `text` | SIM | `/configuracoes` (usuário) | URL do perfil LinkedIn |
| `github_url` | `text` | SIM | `/configuracoes` (usuário) | URL do perfil GitHub |
| `current_title` | `text` | SIM | pipeline de captura (chat) | Cargo atual; atualizado quando usuário menciona mudança de cargo na captura |
| `area` | `text` | SIM | pipeline de captura (chat) | Área de atuação; inferida de entradas e espelho |

Nota: `current_title` e `area` **não aparecem em nenhum formulário de UI** nesta feature.
São reservados para uso futuro pelo pipeline de captura ("virei PM Sênior" → atualiza
`current_title`). Ficam no schema agora para não precisar de migration depois.

### Campos já existentes (referência)

```sql
-- Criados em 002-user-auth (trigger handle_new_user) e 003-profiles_onboarding_completed
id               uuid primary key references auth.users(id) on delete cascade
name             text
email            text not null
avatar_url       text            ← atualizado por uploadAvatarAction nesta feature
onboarding_completed boolean not null default false  ← setado por completeOnboardingAction
created_at       timestamptz not null default now()
```

### RLS existente — sem mudanças

```sql
-- Já aplicado em 002-user-auth
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);
```

As novas colunas são cobertas automaticamente pelas policies existentes.

---

## Supabase Storage — bucket `avatars`

### Criar manualmente no Supabase dashboard

**Antes de começar a implementação:**
1. Dashboard → Storage → New bucket
2. Nome: `avatars`
3. Public bucket: **sim** (URLs públicas sem token)
4. Aplicar policies via SQL editor (ver abaixo)

### Policies do Storage

```sql
-- Leitura pública (qualquer pessoa pode ver a foto pelo URL)
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Upload apenas para própria pasta ({userId}/avatar)
create policy "avatars own insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Atualização apenas da própria pasta
create policy "avatars own update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Estrutura de path

```
avatars/
  {userId}/avatar       ← arquivo único por usuário, sem extensão
```

`storage.foldername(name)` retorna array de segmentos do path. Com `{userId}/avatar`:
- `[1]` = `{userId}` ✓

Upload usa `upsert: true` — ao trocar foto, sobrescreve o mesmo path.
URL pública: `{SUPABASE_URL}/storage/v1/object/public/avatars/{userId}/avatar?t={timestamp}`
(query string `?t=` faz cache-bust quando a foto é trocada)

---

## Tipo TypeScript

```typescript
// src/types/profile.ts

export type ProfileArea =
  | 'tech'
  | 'vendas'
  | 'financas'
  | 'marketing'
  | 'rh'
  | 'administracao'
  | 'outro'

export type Profile = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  linkedin_url: string | null
  github_url: string | null
  current_title: string | null
  area: ProfileArea | null
  onboarding_completed: boolean
  created_at: string
}
```

---

## Nenhuma nova tabela

Esta feature não cria tabelas novas — apenas estende `profiles` e adiciona Storage.
