# UI Contracts: Autenticação e Sessão

**Branch**: `002-user-auth` | **Date**: 2026-06-06

---

## Rotas

| Rota | Tipo | Proteção | Descrição |
|------|------|----------|-----------|
| `/login` | Page (RSC) | Pública | Tela unificada de autenticação |
| `/login?mode=signup` | Page (RSC) | Pública | Mesma tela, modo cadastro pré-selecionado |
| `/painel` | Page (RSC) | Protegida | Placeholder do dashboard com logout |
| `/auth/callback` | Route Handler | Pública | Callback OAuth do Supabase |

### Redirecionamentos do middleware

| Condição | Origem | Destino |
|----------|--------|---------|
| Sem sessão, rota protegida | qualquer rota protegida | `/login` |
| Com sessão, rota de auth | `/login` | `/painel` |
| Auth bem-sucedida (qualquer método) | `/auth/callback` | `/painel` |
| Logout | `/painel` (ação) | `/login` |

---

## Página: `/login`

### Props (Server Component)

```ts
type LoginPageProps = {
  searchParams: Promise<{ mode?: 'login' | 'signup' }>
}
```

### Layout

```
┌─────────────────────────────────┐
│         Logo Borogodó           │
│                                 │
│   [Criar conta] [Entrar]        │  ← tab/toggle de modo
│                                 │
│   ┌─────────────────────────┐   │
│   │   Entrar com Google     │   │  ← GoogleButton (P1, destaque)
│   └─────────────────────────┘   │
│                                 │
│            — ou —               │  ← AuthDivider
│                                 │
│   [formulário modo ativo]       │  ← AuthForm
│                                 │
└─────────────────────────────────┘
```

### Comportamento

- `mode=signup` → formulário mostra campos: **Nome**, E-mail, Senha
- `mode=login` (default) → formulário mostra campos: E-mail, Senha
- Toggle entre modos: troca `mode` no URL via `router.replace` (sem scroll)
- Erros: inline sob o campo relevante, nunca toast
- Google button funciona igual nos dois modos (cria conta se não existe, loga se existe)

### Microcopy i18n (chaves em `auth.*`)

| Chave | Valor pt-BR |
|-------|------------|
| `auth.headline.signup` | "Seu borogodó começa aqui" |
| `auth.headline.login` | "Bem-vindo de volta" |
| `auth.subheadline.signup` | "Crie sua conta para descobrir onde você manda bem" |
| `auth.tab.signup` | "Criar conta" |
| `auth.tab.login` | "Entrar" |
| `auth.google` | "Entrar com Google" |
| `auth.divider` | "ou" |
| `auth.field.name` | "Nome" |
| `auth.field.email` | "E-mail" |
| `auth.field.password` | "Senha" |
| `auth.submit.signup` | "Criar conta" |
| `auth.submit.login` | "Entrar" |
| `auth.confirm.title` | "Confira sua caixa de entrada" |
| `auth.confirm.body` | "o link chega em segundos" |
| `auth.error.emailTaken` | "Esse e-mail já tem uma conta. Quer entrar?" |
| `auth.error.wrongPassword` | "Senha incorreta" |
| `auth.error.emailNotConfirmed` | "Confirme seu e-mail antes de entrar" |
| `auth.error.nameRequired` | "Nome é obrigatório" |
| `auth.error.passwordTooShort` | "A senha precisa ter pelo menos 8 caracteres" |
| `auth.error.network` | "Erro de conexão. Tente novamente" |
| `auth.resend` | "Reenviar e-mail de confirmação" |

---

## Componente: `GoogleButton`

```ts
// src/components/features/auth/GoogleButton.tsx
// 'use client'

type GoogleButtonProps = {
  label?: string  // default: t('auth.google')
}
```

- Chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`
- `access_type: 'offline'`, `prompt: 'consent'` nos queryParams
- Touch target: mínimo 48px altura
- Loading state: spinner inline, botão desabilitado

---

## Componente: `AuthForm`

```ts
// src/components/features/auth/AuthForm.tsx
// 'use client'

type AuthFormProps = {
  initialMode: 'login' | 'signup'
}
```

**Modo signup** — campos: Nome (obrigatório), E-mail (obrigatório), Senha (obrigatório, mín. 8)
- Submit → `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`
- Sucesso → mostrar tela de confirmação (não redirecionar ainda)

**Modo login** — campos: E-mail (obrigatório), Senha (obrigatório)
- Submit → `supabase.auth.signInWithPassword({ email, password })`
- Sucesso → `router.push('/painel')`

Validação client-side antes de qualquer request ao Supabase.

---

## Componente: `AuthDivider`

```ts
// src/components/features/auth/AuthDivider.tsx
// RSC (sem interatividade)
// Renderiza o separador "— ou —" entre Google e formulário
```

---

## Página: `/painel`

### Layout

```
┌─────────────────────────────────┐
│  Olá, [nome]        [Sair →]   │  ← header mínimo
│                                 │
│   (placeholder — em breve)     │
│                                 │
└─────────────────────────────────┘
```

### Props (Server Component)

```ts
// Lê o perfil do usuário autenticado via Supabase server client
// Passa nome para o header
```

### Microcopy i18n (chaves em `painel.*`)

| Chave | Valor pt-BR |
|-------|------------|
| `painel.greeting` | "Olá, {name}" |
| `painel.placeholder` | "Seu painel está chegando. Por enquanto, tudo certo." |
| `painel.logout` | "Sair" |
| `painel.logoutAriaLabel` | "Encerrar sessão" |

---

## Componente: `LogoutButton`

```ts
// src/components/features/auth/LogoutButton.tsx
// 'use client' — usa Server Action

// Server Action (em src/lib/db/supabase/actions.ts):
// async function signOut() {
//   'use server'
//   const supabase = await createServerClient()
//   await supabase.auth.signOut()
//   redirect('/login')
// }
```

---

## Route Handler: `/auth/callback`

```ts
// src/app/auth/callback/route.ts
// GET handler — troca code por sessão
// Em caso de sucesso → redirect('/painel')
// Em caso de erro → redirect('/login?error=auth')
```

**Não está sob `[locale]`** — URL fixa necessária para o redirect URI do OAuth.

---

## Middleware: composição Supabase + next-intl

```ts
// src/middleware.ts
// Ordem de execução:
// 1. Supabase createServerClient + getUser() [atualiza cookies de sessão]
// 2. Verificação de rota protegida → redirect se necessário
// 3. intlMiddleware(request) [processa locale]
// 4. Transfere cookies Supabase para o response do intl

// Matcher: /((?!api|_next|_vercel|.*\..*).*) [preservar matcher atual]
// Rotas públicas: /, /login, /auth/callback
```

---

## LP: atualização de CTAs

| Arquivo | Href atual | Href novo |
|---------|-----------|-----------|
| `NavBar.tsx` | `/sign-up` | `/login?mode=signup` |
| `HeroSection.tsx` (Criar conta) | `/sign-up` | `/login?mode=signup` |
| `HeroSection.tsx` (Já tenho conta) | `/sign-in` | `/login` |
| `CtaSection.tsx` (Criar conta) | `/sign-up` | `/login?mode=signup` |
| `CtaSection.tsx` (Entrar) | `/sign-in` | `/login` |
