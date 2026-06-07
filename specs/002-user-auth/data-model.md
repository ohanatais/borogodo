# Data Model: Autenticação e Sessão

**Branch**: `002-user-auth` | **Date**: 2026-06-06

---

## Entidades gerenciadas pelo Supabase Auth (não modificar)

O Supabase Auth gerencia as tabelas `auth.users` e `auth.identities` nativamente. Não criamos nem alteramos essas tabelas — apenas lemos `auth.uid()` via RLS e `auth.users` via trigger.

| Campo em `auth.users` | Origem Google | Origem e-mail+senha |
|-----------------------|--------------|---------------------|
| `id` (uuid) | Gerado automaticamente | Gerado automaticamente |
| `email` | `email` do Google | Campo obrigatório |
| `raw_user_meta_data->>'full_name'` | Nome da conta Google | Preenchido no cadastro |
| `raw_user_meta_data->>'avatar_url'` | Foto do Google | `null` |

---

## Tabela: `public.profiles`

Extensão pública de `auth.users`. Criada via trigger no momento do cadastro.

```sql
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text,
  email            text not null,
  avatar_url       text,
  onboarding_completed boolean not null default false,
  created_at       timestamptz not null default now()
);
```

### Campos

| Campo | Tipo | Nulável | Descrição |
|-------|------|---------|-----------|
| `id` | `uuid` | NÃO | FK para `auth.users.id`; cascade delete |
| `name` | `text` | SIM | Nome do usuário; preenchido pelo Google ou formulário |
| `email` | `text` | NÃO | E-mail principal; espelho de `auth.users.email` |
| `avatar_url` | `text` | SIM | URL da foto; apenas via Google; `null` para e-mail+senha |
| `onboarding_completed` | `boolean` | NÃO | `false` no cadastro; `true` quando módulo 003 concluir o onboarding |
| `created_at` | `timestamptz` | NÃO | Timestamp do cadastro |

### Regras de negócio

- `name` é `null` apenas para usuários e-mail+senha que não preencheram (não ocorre neste módulo — o formulário exige nome). Mantido nulável para compatibilidade com cadastros Google sem `full_name`.
- `onboarding_completed` é lido pelo middleware/redirect de módulos futuros. Neste módulo, nunca é alterado.
- `email` é redundante com `auth.users.email` por conveniência de query — não é a fonte da verdade.

---

## Row Level Security

```sql
alter table public.profiles enable row level security;

-- Usuário lê apenas o próprio perfil
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

-- Usuário atualiza apenas o próprio perfil
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- INSERT é feito apenas pelo trigger (security definer) — nenhuma policy de insert para usuários
```

---

## Trigger: criação automática de perfil

Executado após insert em `auth.users`. Garante atomicidade — perfil e usuário criados juntos.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Notas de segurança

- `security definer` permite que o trigger acesse `public.profiles` sem depender da sessão do usuário que está se cadastrando.
- `set search_path = public` evita ataques de schema injection.
- O trigger não falha silenciosamente — se o INSERT em `profiles` falhar, o cadastro em `auth.users` também é revertido.

---

## Sessão

Gerenciada 100% pelo Supabase Auth. Duração: **30 dias** (configurado no dashboard Supabase em Authentication → Settings → JWT expiry).

Não há tabela de sessão no schema da aplicação.

---

## Índices adicionais (além do PK)

```sql
create index profiles_email_idx on public.profiles (email);
```

Justificativa: queries por e-mail na detecção de duplicatas ocorrem no fluxo de cadastro.
