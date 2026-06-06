# 001 — Auth

## O que é

Autenticação e sessão do usuário. Ponto de entrada do produto.
Email + senha como base; Google OAuth como caminho preferencial (menos atrito).

---

## Decisões de produto

| Decisão | Escolha | Motivo |
|---|---|---|
| Provedor principal | Google OAuth | Um clique, sem digitar senha, conversão maior |
| Provedor secundário | Email + senha | Fallback necessário; alguns usuários evitam login social |
| Campos no cadastro | Só e-mail (Google traz nome) | Mínimo absoluto — sem "confirmar senha" |
| Confirmação de e-mail | Sim, obrigatória | Evita contas fantasmas |
| Duração da sessão | 30 dias | Padrão confortável para app de hábito |
| Multi-conta (futuro) | Suportado via Supabase nativo | Não construir UI agora, mas arquitetura não bloqueia |

---

## Fluxo UX

### Sign Up
```
/signup
  → Google [botão principal, grande]
  → ou continue com e-mail [link secundário, menor]
    → campo e-mail + senha (8+ chars)
    → [Criar conta]
  → "Verifique seu e-mail" → link de confirmação
  → redirect para /onboarding
```

### Login
```
/login
  → Google [botão principal]
  → ou e-mail + senha
  → [Entrar]
  → redirect:
      - tem entradas? → /painel
      - não tem entradas? → /onboarding
```

### Estados de erro visíveis
- E-mail já cadastrado (signup)
- Senha incorreta (login)
- E-mail não confirmado
- Erro de rede (genérico, com retry)

---

## Sobre multi-conta e MCP corporativo (decisão futura)

O Supabase Auth armazena múltiplos providers por usuário em `auth.identities`. Quando chegar a hora de vincular conta Google Workspace, Microsoft Azure AD, etc., é uma chamada de `linkIdentity()` — sem retrabalho no schema.

**Separação de conceitos importante:**
- `auth.identities` = como o usuário **entra** no produto
- `user_connections` (tabela futura) = ferramentas externas que o usuário **conecta** para MCP (Jira, Slack, Linear etc.) — tokens OAuth distintos, não são login

**Compliance de dados corporativos (fora do MVP):**
- No MVP: ToS cobre. O usuário é responsável pelo que captura.
- No futuro (MCP corporativo): workspace/org concept com controle de admin. Não impacta a arquitetura de auth — impacta a camada de data governance.
- Supabase RLS já isola dados por `user_id` desde o início. Quando vier o conceito de org, adiciona-se `org_id` nas tabelas relevantes.

---

## Schema

```sql
-- Supabase Auth gerencia auth.users e auth.identities nativamente.
-- Só precisamos da tabela pública de perfil.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text not null,
  avatar_url  text,
  onboarding_completed boolean default false,
  created_at  timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Usuário vê só o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza só o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: criar perfil ao registrar usuário
create or replace function public.handle_new_user()
returns trigger as $$
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
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Estrutura de arquivos

```
src/
  app/
    (auth)/
      login/
        page.tsx          ← LoginPage (server component)
      signup/
        page.tsx          ← SignUpPage (server component)
      auth/
        callback/
          route.ts        ← OAuth callback handler
  components/
    features/
      auth/
        LoginForm.tsx      ← form controlado, validação client-side
        SignUpForm.tsx
        GoogleButton.tsx   ← botão OAuth reutilizável
        AuthDivider.tsx    ← "ou continue com e-mail"
  lib/
    db/
      supabase/
        client.ts         ← createBrowserClient()
        server.ts         ← createServerClient()
        middleware.ts     ← updateSession()
  middleware.ts            ← proteção de rotas
```

---

## Middleware de proteção de rotas

```typescript
// middleware.ts (raiz do projeto)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/callback']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ... */)

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_ROUTES.some(r => request.nextUrl.pathname.startsWith(r))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuário logado tentando acessar login/signup → redireciona
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## API Routes

```typescript
// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerClient(/* ... */)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verifica se onboarding foi completado
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .single()

      const redirect = profile?.onboarding_completed ? '/painel' : '/onboarding'
      return NextResponse.redirect(new URL(redirect, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
```

---

## Componentes principais

### GoogleButton
```typescript
// src/components/features/auth/GoogleButton.tsx
'use client'
import { createBrowserClient } from '@/lib/db/supabase/client'

export function GoogleButton() {
  const supabase = createBrowserClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <button onClick={handleGoogleLogin} className="...">
      <GoogleIcon />
      Entrar com Google
    </button>
  )
}
```

### LoginForm
```typescript
// src/components/features/auth/LoginForm.tsx
'use client'
// Campos: email, senha
// Submit → supabase.auth.signInWithPassword()
// Em caso de erro → mensagem inline (não toast)
// Em caso de sucesso → router.push baseado em onboarding_completed
```

---

## UX — tom e microcopy

| Elemento | Texto |
|---|---|
| Headline signup | "Seu borogodó começa aqui" |
| Subheadline | "Crie sua conta para descobrir onde você manda bem" |
| Botão Google | "Entrar com Google" |
| Separador | "ou" |
| Label e-mail | "E-mail" |
| Label senha | "Senha" |
| CTA signup | "Criar conta" |
| Link para login | "Já tem conta? Entre" |
| E-mail enviado | "Confira sua caixa de entrada — o link chega em segundos" |
| Erro e-mail usado | "Esse e-mail já tem uma conta. Quer entrar?" |

---

## Fora do escopo neste bloco

- Recuperação de senha (implementar depois — Supabase tem built-in)
- Vinculação de múltiplos providers (UI)
- Microsoft / corporate OAuth
- Tabela `user_connections` (MCP futuro)
- Perfil editável (nome, avatar) — vem no painel
