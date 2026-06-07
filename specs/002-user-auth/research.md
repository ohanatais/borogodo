# Research: Autenticação e Sessão

**Branch**: `002-user-auth` | **Date**: 2026-06-06

---

## 1. Instalação de dependências Supabase

**Decision**: Instalar `@supabase/supabase-js` e `@supabase/ssr`.

**Rationale**: O projeto ainda não tem Supabase instalado. `@supabase/ssr` é o pacote oficial para uso com Next.js App Router, suportando Server Components, Server Actions e Middleware com gerenciamento correto de cookies.

**Alternatives considered**:
- `@supabase/auth-helpers-nextjs` (deprecated em favor de `@supabase/ssr`)

---

## 2. Variáveis de ambiente públicas (exceção justificada à Constituição)

**Decision**: Usar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para o cliente browser.

**Rationale**: A `anon key` do Supabase é projetada para ser pública — ela não é um segredo. A proteção de dados ocorre via RLS no banco, não via ocultação da chave. Expô-la via `NEXT_PUBLIC_` é o comportamento padrão e esperado pelo Supabase. A regra da Constituição sobre `NEXT_PUBLIC_` aplica-se a segredos reais (service role key, API keys de terceiros). A service role key NUNCA deve ter prefixo `NEXT_PUBLIC_`.

**Variables needed**:
- `NEXT_PUBLIC_SUPABASE_URL` — URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chave pública anon
- `SUPABASE_SERVICE_ROLE_KEY` — (sem NEXT_PUBLIC_) apenas para uso server-side futuro

---

## 3. Composição de middleware: Supabase SSR + next-intl

**Decision**: Middleware híbrido — Supabase `updateSession()` executa primeiro (gerencia cookies de sessão), depois next-intl processa i18n e roteamento de locale.

**Rationale**: O Supabase SSR exige que `updateSession()` seja chamado em todo request para manter a sessão válida (refresh de tokens). O next-intl precisa processar headers de locale. A composição correta é: Supabase cria o response com cookies, next-intl processa a rota, os cookies Supabase são transferidos para o response final do next-intl.

**Pattern**:
```
middleware request
  → supabase.auth.getUser() [atualiza cookies de sessão]
  → verificar rota protegida → redirecionar se necessário
  → intlMiddleware(request) [processa locale]
  → transferir cookies Supabase para response do intl
```

**Alternatives considered**:
- Next-intl como wrapper externo (não funciona bem com mutation de cookies)
- Middleware separado em arquivos distintos (Next.js não suporta múltiplos middleware)

---

## 4. Tela unificada `/login` com modo URL param

**Decision**: `/login` exibe ambos os modos. O modo inicial é controlado por `?mode=signup` (cadastro) ou ausência do param (login, padrão).

**Rationale**: Permite que a LP direcione CTAs de "Criar conta" para `/login?mode=signup` (iniciando no modo correto) e CTAs de "Entrar" para `/login`. O modo é lido como Server Component prop (searchParams), passado para o componente cliente como `initialMode`.

**Alternatives considered**:
- Estado React puro sem URL param (não permite deep link via LP)
- Rotas separadas `/login` e `/signup` (rejeitado na clarificação)

---

## 5. Trigger de criação de perfil (banco vs aplicação)

**Decision**: Trigger PostgreSQL `handle_new_user()` na tabela `auth.users`.

**Rationale**: Garante atomicidade — o perfil é criado na mesma transação do registro do usuário. Elimina race conditions e falhas parciais que ocorreriam se a criação de perfil fosse responsabilidade da aplicação. Supabase suporta e recomenda triggers para este caso de uso.

**Alternatives considered**:
- Edge Function em `auth.user.created` webhook (mais latência, possível falha de entrega)
- Criação de perfil na aplicação após o cadastro (sujeita a falha parcial)

---

## 6. Logout via Server Action

**Decision**: Logout implementado como Server Action com `supabase.auth.signOut()`.

**Rationale**: Next.js 16 + React 19 suportam Server Actions de forma estável. Evita expor lógica de autenticação ao client bundle. O Server Action invalida a sessão no servidor e retorna redirect para `/login`.

**Alternatives considered**:
- Client-side signOut via browser client (funciona mas menos seguro — depende do client)
- API Route handler (desnecessário com Server Actions disponíveis)

---

## 7. LP CTAs — atualização de rotas

**Decision**: Atualizar `HeroSection.tsx`, `CtaSection.tsx`, `NavBar.tsx`:
- "Criar conta" / "Entrar na lista" → `/login?mode=signup`
- "Entrar" / "Já tenho conta" → `/login`

**Current state**: LP usa `/sign-up` e `/sign-in` — rotas que não existirão. Precisam ser corrigidas antes do módulo ir a ar.

---

## 8. Proteção de rotas: lista de rotas públicas

**Decision**:
```
Públicas: /, /login, /auth/callback
Protegidas: tudo o mais (incluindo /painel)
```

**Rationale**: `/auth/callback` deve ser público para receber o redirect do OAuth sem sessão ativa. `/painel` é protegida mesmo sendo um placeholder vazio.
