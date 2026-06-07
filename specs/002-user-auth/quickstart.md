# Quickstart: Autenticação e Sessão

**Branch**: `002-user-auth` | **Date**: 2026-06-06

---

## Pré-requisitos

1. **Projeto Supabase criado** em [supabase.com](https://supabase.com)
2. **Google OAuth configurado** no Supabase Dashboard:
   - Authentication → Providers → Google → Enable
   - Adicionar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (do Google Cloud Console)
3. **Redirect URLs configurados** no Supabase Dashboard:
   - Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. **Variáveis de ambiente** criadas em `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. **Sessão configurada** no Supabase Dashboard:
   - Authentication → Settings → JWT expiry: `2592000` (30 dias em segundos)

---

## Setup do banco

Executar no SQL Editor do Supabase (em ordem):

```sql
-- 1. Criar tabela de perfis
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text,
  email            text not null,
  avatar_url       text,
  onboarding_completed boolean not null default false,
  created_at       timestamptz not null default now()
);

-- 2. Habilitar RLS
alter table public.profiles enable row level security;

-- 3. Policies
create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);

-- 4. Índice de email
create index profiles_email_idx on public.profiles (email);

-- 5. Trigger de criação de perfil
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
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

---

## Instalação de dependências

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Rodando o projeto

```bash
npm run dev
# http://localhost:3000
```

---

## Cenários de validação end-to-end

### Cenário 1 — Cadastro via Google

1. Acessar `http://localhost:3000`
2. Clicar em "Criar conta" na NavBar ou Hero
3. **Verificar**: chegou em `/login?mode=signup`
4. Clicar em "Entrar com Google"
5. Autorizar no popup do Google
6. **Verificar**: redirecionado para `/painel`
7. **Verificar**: nome do usuário aparece no header do painel
8. **Verificar**: no Supabase Dashboard → Authentication → Users, novo usuário criado
9. **Verificar**: no Supabase Dashboard → Table Editor → profiles, perfil criado com nome e avatar

---

### Cenário 2 — Cadastro por e-mail e senha

1. Acessar `/login?mode=signup`
2. Preencher: Nome "Teste Silva", E-mail (real ou Mailinator), Senha "Senha123!"
3. Clicar em "Criar conta"
4. **Verificar**: tela de confirmação aparece ("Confira sua caixa de entrada")
5. Abrir e-mail de confirmação → clicar no link
6. **Verificar**: redirecionado para `/painel`
7. **Verificar**: nome "Teste Silva" no header

---

### Cenário 3 — Login em conta existente

1. Acessar `/login` (sem mode param)
2. Inserir credenciais de conta existente
3. Clicar em "Entrar"
4. **Verificar**: redirecionado para `/painel`

---

### Cenário 4 — Logout

1. Estando no `/painel`
2. Clicar em "Sair"
3. **Verificar**: redirecionado para `/login`
4. Tentar acessar `/painel` diretamente no browser
5. **Verificar**: redirecionado para `/login` (sessão encerrada)

---

### Cenário 5 — Proteção de rota

1. Sem sessão ativa, acessar `http://localhost:3000/painel`
2. **Verificar**: redirecionado para `/login`

---

### Cenário 6 — Usuário logado tenta acessar /login

1. Com sessão ativa, acessar `http://localhost:3000/login`
2. **Verificar**: redirecionado para `/painel`

---

### Cenário 7 — CTAs da LP

1. Acessar `http://localhost:3000` (landing page)
2. Clicar em "Criar conta" (NavBar)
3. **Verificar**: chegou em `/login?mode=signup` com modo cadastro ativo
4. Clicar em "Já tenho conta" (Hero)
5. **Verificar**: chegou em `/login` com modo login ativo

---

### Cenário 8 — Erro: e-mail já cadastrado

1. Tentar cadastrar com e-mail já existente
2. **Verificar**: erro inline "Esse e-mail já tem uma conta. Quer entrar?"
3. **Verificar**: nenhuma conta duplicada criada

---

### Cenário 9 — Erro: senha incorreta

1. Tentar login com senha errada
2. **Verificar**: erro inline "Senha incorreta"

---

## Checklist de testes automatizados

Os testes devem cobrir (mínimo 80%):

- [ ] `GoogleButton` — renderiza e chama signInWithOAuth com params corretos
- [ ] `AuthForm` (modo signup) — validação de campos, submit, sucesso, erros inline
- [ ] `AuthForm` (modo login) — submit, sucesso, erros inline
- [ ] `LogoutButton` — chama Server Action de signOut
- [ ] Middleware — redireciona rota protegida sem sessão, redireciona /login com sessão
- [ ] `/auth/callback` route handler — troca code por sessão, redireciona corretamente
- [ ] Trigger `handle_new_user` — perfil criado com dados corretos para Google e e-mail

---

## Referências

- [Supabase + Next.js App Router guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [next-intl middleware composition](https://next-intl.dev/docs/routing/middleware)
- [data-model.md](./data-model.md)
- [contracts/ui-contracts.md](./contracts/ui-contracts.md)
