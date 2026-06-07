# Implementation Plan: Autenticação e Sessão

**Branch**: `002-user-auth` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

---

## Summary

Implementar o módulo de autenticação do Borogodó: tela unificada `/login` com Google OAuth (P1) e e-mail+senha (P2), middleware de proteção de rotas, placeholder `/painel` com logout, e sincronização dos CTAs da landing page. Tecnicamente: instalar Supabase SSR, compor middleware Supabase + next-intl, criar tabela `public.profiles` com trigger e RLS.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16.2.7, React 19.2.4

**Primary Dependencies a instalar**: `@supabase/supabase-js`, `@supabase/ssr`

**Já instaladas**: Tailwind CSS v4, shadcn/ui (Radix), Framer Motion, Lucide React, next-intl 4.13.0, Vitest + Testing Library

**Storage**: Supabase PostgreSQL — tabela `public.profiles` + RLS + trigger (ver [data-model.md](./data-model.md))

**Testing**: Vitest + Testing Library (unit + integration); mínimo 80% de cobertura

**Target Platform**: Web — mobile-first, Next.js App Router com SSR

**Constraints**: Sessão de 30 dias; erros inline em <1s; zero contas duplicadas; touch targets ≥48px

---

## Constitution Check

| Princípio | Status | Notas |
|-----------|--------|-------|
| I. Security First | ✅ | RLS em `profiles`; `auth.uid()` em todas as policies; trigger `security definer`; service role key sem NEXT_PUBLIC_ |
| II. TypeScript Strict | ✅ | `any` proibido; um componente por arquivo; funções ≤40 linhas |
| III. AI-First | N/A | Não há chamadas AI neste módulo |
| IV. Server-First | ✅ | RSC por padrão; `use client` apenas em GoogleButton, AuthForm, LogoutButton |
| V. Accessibility | ✅ | Labels acessíveis; focus indicators; touch targets ≥48px |
| VI. TDD | ✅ | Testes escritos antes da implementação; 80%+ cobertura |
| VII. Design Identity | ✅ | Tokens de globals.css; Fraunces para headline; `/impeccable shape` antes da UI |
| VIII. Mobile-First | ✅ | Base CSS = mobile; breakpoints expandem para desktop |
| IX. i18n | ✅ | Todas as strings em `src/messages/pt-BR.json` namespace `auth.*` e `painel.*`; zero strings hardcoded |

**EXCEÇÃO JUSTIFICADA**: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` usam prefixo `NEXT_PUBLIC_` por necessidade técnica (client-side OAuth). A `anon key` é projetada para ser pública; a proteção é via RLS. Ver [research.md](./research.md).

---

## Project Structure

### Documentação (esta feature)

```
specs/002-user-auth/
├── plan.md              ← este arquivo
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contracts.md
├── checklists/
│   └── requirements.md
└── tasks.md             ← gerado por /speckit-tasks
```

### Código-fonte (adições deste módulo)

```
src/
  app/
    [locale]/
      login/
        page.tsx              ← LoginPage (RSC) — recebe searchParams.mode
      painel/
        page.tsx              ← PainelPage (RSC) — placeholder + logout
    auth/
      callback/
        route.ts              ← OAuth callback handler (fora do [locale])
  components/
    features/
      auth/
        AuthCard.tsx          ← container visual da tela de login
        GoogleButton.tsx      ← 'use client' — OAuth button
        AuthForm.tsx          ← 'use client' — formulário login/signup com toggle
        AuthDivider.tsx       ← RSC — separador "ou"
        LogoutButton.tsx      ← 'use client' — executa Server Action de signOut
  lib/
    db/
      supabase/
        client.ts             ← createBrowserClient()
        server.ts             ← createServerClient() para RSC e Route Handlers
        middleware.ts         ← updateSession() helper para middleware.ts
    actions/
      auth.ts                 ← Server Actions: signOut()
  middleware.ts               ← substituir implementação atual (Supabase + next-intl)
  messages/
    pt-BR.json                ← adicionar namespaces auth.* e painel.*
    en.json                   ← adicionar stubs correspondentes
```

### Modificações em arquivos existentes

| Arquivo | Mudança |
|---------|---------|
| `src/middleware.ts` | Reescrever — compor Supabase session update + next-intl |
| `src/messages/pt-BR.json` | Adicionar `auth.*` e `painel.*` |
| `src/messages/en.json` | Adicionar stubs de `auth.*` e `painel.*` |
| `src/components/features/landing/NavBar.tsx` | `/sign-up` → `/login?mode=signup` |
| `src/components/features/landing/HeroSection.tsx` | `/sign-up` → `/login?mode=signup`; `/sign-in` → `/login` |
| `src/components/features/landing/CtaSection.tsx` | `/sign-up` → `/login?mode=signup`; `/sign-in` → `/login` |

---

## Ordem de implementação recomendada

1. **Infra**: instalar Supabase, criar clientes SSR, schema SQL, reescrever middleware, Server Actions
2. **i18n**: adicionar namespaces `auth.*` e `painel.*`
3. **UI `/login`**: AuthCard + GoogleButton + AuthForm + AuthDivider (após `/impeccable shape`)
4. **UI `/painel`**: PainelPage + LogoutButton
5. **Route handler**: `/auth/callback`
6. **LP sync**: atualizar CTAs em NavBar, HeroSection, CtaSection
7. **Testes**: em paralelo com cada bloco acima

A ordem exata com dependências está em [tasks.md](./tasks.md).

---

## Artefatos relacionados

- [spec.md](./spec.md) — requisitos e cenários
- [research.md](./research.md) — decisões técnicas e justificativas
- [data-model.md](./data-model.md) — schema SQL completo
- [contracts/ui-contracts.md](./contracts/ui-contracts.md) — props, rotas, microcopy
- [quickstart.md](./quickstart.md) — setup e cenários de validação
