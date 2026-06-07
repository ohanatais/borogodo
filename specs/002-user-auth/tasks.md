# Tasks: Autenticação e Sessão

**Branch**: `002-user-auth` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Input**: Design documents de `specs/002-user-auth/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ui-contracts.md ✅

**Tests**: Incluídos — TDD é mandatório pela Constituição (Princípio VI). Escrever o teste → confirmar RED → implementar → confirmar GREEN.

**Organization**: Organizado por user story para entrega incremental independente.

## Formato: `[ID] [P?] [Story?] Descrição com caminho de arquivo`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: User story a que a tarefa pertence (US1–US6)

---

## Phase 1: Setup

**Purpose**: Instalar dependências e criar estrutura de pastas.

- [ ] T001 Instalar dependências Supabase: `npm install @supabase/supabase-js @supabase/ssr`
- [ ] T002 Criar estrutura de pastas: `src/lib/db/supabase/`, `src/lib/actions/`, `src/app/[locale]/login/`, `src/app/[locale]/painel/`, `src/app/auth/callback/`, `src/components/features/auth/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura base que bloqueia TODAS as user stories. Nenhuma story começa antes desta fase estar completa.

**⚠️ CRÍTICO**: Inclui escrita dos testes de middleware (TDD) antes da implementação.

### Banco de dados (Supabase Dashboard — SQL Editor)

- [ ] T003 Aplicar schema SQL completo no Supabase: tabela `public.profiles`, RLS policies, índice `profiles_email_idx`, função `handle_new_user()` e trigger `on_auth_user_created` — conforme `data-model.md`

### Clientes Supabase

- [ ] T004 [P] Criar `src/lib/db/supabase/client.ts` — exporta `createBrowserClient()` usando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] T005 [P] Criar `src/lib/db/supabase/server.ts` — exporta `createServerClient()` async usando `cookies()` do Next.js para RSC e Route Handlers
- [ ] T006 Criar `src/lib/db/supabase/middleware.ts` — exporta `updateSession(request)` que atualiza cookies de sessão para uso no middleware global

### Server Actions

- [ ] T007 Criar `src/lib/actions/auth.ts` — Server Action `signOut()`: chama `supabase.auth.signOut()` e faz `redirect('/login')`

### i18n

- [ ] T008 [P] Adicionar namespaces `auth` e `painel` a `src/messages/pt-BR.json` com todas as chaves do `contracts/ui-contracts.md` (microcopy completo)
- [ ] T009 [P] Adicionar stubs correspondentes de `auth` e `painel` a `src/messages/en.json` (mesmas chaves, valores em inglês aproximado)

### Middleware (TDD — escrever testes antes da implementação)

- [ ] T010 [US5] Escrever teste failing: acesso não autenticado a `/painel` redireciona para `/login` em `src/components/features/auth/__tests__/middleware.test.ts`
- [ ] T011 [US5] Escrever teste failing: usuário autenticado acessando `/login` redireciona para `/painel` em `src/components/features/auth/__tests__/middleware.test.ts`
- [ ] T012 [US5] Reescrever `src/middleware.ts` — compor: (1) `updateSession()` Supabase, (2) proteção de rotas (públicas: `/`, `/login`, `/auth/callback`), (3) `intlMiddleware(request)` next-intl — testes T010 e T011 devem passar (GREEN)

**Checkpoint**: Middleware funcional, testes de proteção de rotas passando.

---

## Phase 3: US1 — Cadastro via Google (Priority: P1) 🎯 MVP

**Goal**: Usuário cria conta com um clique no Google e chega ao `/painel`.

**Independent Test**: Criar conta Google nova → chegar a `/painel` com nome e avatar do Google.

### Testes (escrever antes da implementação)

- [ ] T013 [P] [US1] Escrever teste failing: `GoogleButton` renderiza com label correto e chama `signInWithOAuth` com `provider: 'google'` e `redirectTo: '/auth/callback'` em `src/components/features/auth/__tests__/GoogleButton.test.tsx`
- [ ] T014 [P] [US1] Escrever teste failing: `/auth/callback` route handler troca `code` por sessão e redireciona para `/painel` em `src/app/auth/callback/__tests__/route.test.ts`

### Implementação

- [ ] T015 [P] [US1] Criar `src/app/[locale]/login/page.tsx` — `LoginPage` RSC: lê `searchParams.mode`, passa `initialMode` para `AuthCard`
- [ ] T016 [P] [US1] Criar `src/components/features/auth/AuthCard.tsx` — container visual: logo, slot do `GoogleButton`, `AuthDivider`, slot do `AuthForm`
- [ ] T017 [US1] Criar `src/components/features/auth/AuthDivider.tsx` — RSC, renderiza separador "— ou —" com i18n `auth.divider`
- [ ] T018 [US1] Criar `src/components/features/auth/GoogleButton.tsx` — `'use client'`: chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback', queryParams: { access_type: 'offline', prompt: 'consent' } } })`, touch target ≥48px, loading state, label via `t('auth.google')`
- [ ] T019 [US1] Criar `src/app/auth/callback/route.ts` — GET handler: troca `code` por sessão via `supabase.auth.exchangeCodeForSession(code)`, redireciona para `/painel` em sucesso, `/login?error=auth` em erro
- [ ] T020 [US1] Executar `/impeccable shape` na tela `/login` — validar hierarquia visual, mobile-first 375px, tokens de cor, Fraunces no headline, touch targets
- [ ] T021 [US1] Aplicar feedback do impeccable shape em `AuthCard.tsx` e `GoogleButton.tsx` (spacing, cores, tipografia)

**Checkpoint**: Google OAuth funcional. `/login` → Google → `/auth/callback` → `/painel`. Testes T013 e T014 GREEN.

---

## Phase 4: US4 — Painel vazio e logout (Priority: P1)

**Goal**: Após qualquer auth, usuário chega ao `/painel` com botão de logout funcional.

**Independent Test**: Autenticar → `/painel` exibe nome do usuário + botão "Sair" → clicar "Sair" → `/login`.

### Testes (escrever antes da implementação)

- [ ] T022 [P] [US4] Escrever teste failing: `PainelPage` renderiza saudação com nome do usuário e `LogoutButton` em `src/app/[locale]/painel/__tests__/page.test.tsx`
- [ ] T023 [P] [US4] Escrever teste failing: `LogoutButton` chama Server Action `signOut` ao clicar em `src/components/features/auth/__tests__/LogoutButton.test.tsx`

### Implementação

- [ ] T024 [US4] Criar `src/app/[locale]/painel/page.tsx` — `PainelPage` RSC: lê perfil do usuário via `createServerClient()`, exibe `t('painel.greeting', { name })`, texto placeholder via `t('painel.placeholder')` e `LogoutButton`
- [ ] T025 [US4] Criar `src/components/features/auth/LogoutButton.tsx` — `'use client'`: renderiza botão que chama Server Action `signOut` de `src/lib/actions/auth.ts`, label via `t('painel.logout')`, `aria-label` via `t('painel.logoutAriaLabel')`
- [ ] T026 [US4] Executar `/impeccable shape` na tela `/painel` — validar layout mínimo, posição do botão logout, legibilidade mobile

**Checkpoint**: Loop completo funcional: `/login` → auth → `/painel` → logout → `/login`. Testes T022 e T023 GREEN.

---

## Phase 5: US6 — Sincronização com CTAs da landing page (Priority: P1)

**Goal**: Todos os botões de auth da LP direcionam para `/login` (com mode correto).

**Independent Test**: Clicar em "Criar conta" na NavBar → chegar em `/login?mode=signup`.

### Testes (atualizar testes existentes)

- [ ] T027 [US6] Atualizar teste de `NavBar`: `href` do CTA deve ser `/login?mode=signup` em `src/components/features/landing/__tests__/NavBar.test.tsx`
- [ ] T028 [P] [US6] Atualizar teste de `HeroSection`: CTA primário `href="/login?mode=signup"`, secundário `href="/login"` em `src/components/features/landing/__tests__/HeroSection.test.tsx`
- [ ] T029 [P] [US6] Atualizar teste de `CtaSection`: hrefs corretos em `src/components/features/landing/__tests__/CtaSection.test.tsx`

### Implementação

- [ ] T030 [US6] Atualizar `src/components/features/landing/NavBar.tsx` — `href="/sign-up"` → `href="/login?mode=signup"`
- [ ] T031 [P] [US6] Atualizar `src/components/features/landing/HeroSection.tsx` — `href="/sign-up"` → `href="/login?mode=signup"`; `href="/sign-in"` → `href="/login"`
- [ ] T032 [P] [US6] Atualizar `src/components/features/landing/CtaSection.tsx` — `href="/sign-up"` → `href="/login?mode=signup"`; `href="/sign-in"` → `href="/login"`

**Checkpoint**: Todos os CTAs da LP direcionam corretamente. Testes T027, T028, T029 GREEN.

---

## Phase 6: US2 — Cadastro por e-mail e senha (Priority: P2)

**Goal**: Usuário cria conta com nome, e-mail e senha, confirma o e-mail e chega ao `/painel`.

**Independent Test**: Formulário signup → recebe e-mail de confirmação → confirma → `/painel`.

### Testes (escrever antes da implementação)

- [ ] T033 [US2] Escrever teste failing: `AuthForm` no modo signup exibe campos Nome, E-mail e Senha e valida cada um inline em `src/components/features/auth/__tests__/AuthForm.test.tsx`
- [ ] T034 [P] [US2] Escrever teste failing: `AuthForm` modo signup mostra erro `auth.error.emailTaken` quando e-mail já existe em `src/components/features/auth/__tests__/AuthForm.test.tsx`
- [ ] T035 [P] [US2] Escrever teste failing: `AuthForm` modo signup mostra tela de confirmação após submit bem-sucedido em `src/components/features/auth/__tests__/AuthForm.test.tsx`

### Implementação

- [ ] T036 [US2] Criar `src/components/features/auth/AuthForm.tsx` — `'use client'`: recebe `initialMode: 'login' | 'signup'`, controla modo via estado + `router.replace`, campos signup: Nome + E-mail + Senha
- [ ] T037 [US2] Adicionar handler de signup em `AuthForm.tsx` — `supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })`, exibe tela de confirmação em sucesso (não redireciona)
- [ ] T038 [US2] Adicionar validação client-side completa em `AuthForm.tsx` — nome obrigatório, e-mail formato válido, senha ≥8 chars; exibir erros inline sob cada campo antes de qualquer request

**Checkpoint**: Cadastro por e-mail funcional. Tela de confirmação exibida. Erros inline corretos. Testes T033–T035 GREEN.

---

## Phase 7: US3 — Login em conta existente (Priority: P2)

**Goal**: Usuário retornante entra com e-mail+senha e chega ao `/painel`.

**Independent Test**: Login com conta confirmada → `/painel`. Senha errada → erro inline.

### Testes (escrever antes da implementação)

- [ ] T039 [US3] Escrever teste failing: `AuthForm` modo login submits com sucesso e faz `router.push('/painel')` em `src/components/features/auth/__tests__/AuthForm.test.tsx`
- [ ] T040 [P] [US3] Escrever teste failing: `AuthForm` modo login exibe `auth.error.wrongPassword` e `auth.error.emailNotConfirmed` nos estados de erro correspondentes em `src/components/features/auth/__tests__/AuthForm.test.tsx`

### Implementação

- [ ] T041 [US3] Adicionar handler de login em `AuthForm.tsx` — `supabase.auth.signInWithPassword({ email, password })`, `router.push('/painel')` em sucesso
- [ ] T042 [US3] Adicionar tratamento de erros de login em `AuthForm.tsx` — `wrongPassword`, `emailNotConfirmed` com botão de reenvio inline; erro de rede com retry

**Checkpoint**: Login por e-mail funcional. Erros inline corretos. Testes T039 e T040 GREEN.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Rodar `npm run build` — verificar zero erros TypeScript strict em todo o módulo
- [ ] T044 [P] Rodar `npm test` — verificar cobertura ≥80% para todos os componentes do módulo auth
- [ ] T045 Executar `/impeccable audit` — design review completo das telas `/login` e `/painel` antes do PR
- [ ] T046 Aplicar feedback do impeccable audit nos componentes afetados
- [ ] T047 Validar manualmente todos os 9 cenários de `quickstart.md` no browser (localhost:3000)

---

## Dependências & Ordem de Execução

### Dependências entre fases

- **Phase 1 (Setup)**: Sem dependências — começa imediatamente
- **Phase 2 (Foundational)**: Depende da Phase 1 — **bloqueia todas as stories**
- **Phase 3 (US1)**: Depende da Phase 2 completa
- **Phase 4 (US4)**: Depende da Phase 3 (precisa de `/painel` route e LogoutButton no contexto de auth funcional)
- **Phase 5 (US6)**: Depende da Phase 3 (CTAs precisam ter destino funcional para testar e2e)
- **Phase 6 (US2)**: Depende da Phase 3 (estende `AuthForm.tsx` criada na Phase 3)
- **Phase 7 (US3)**: Depende da Phase 6 (estende `AuthForm.tsx` com handler de login)
- **Phase 8 (Polish)**: Depende de todas as stories completadas

### Dependências dentro de cada fase

- T004, T005 rodam em paralelo (arquivos diferentes)
- T006 depende de T005 (usa padrão do server client)
- T008, T009 rodam em paralelo (arquivos diferentes)
- T010, T011 rodam em paralelo (mesmo arquivo de teste, mas testes independentes)
- T012 depende de T010 e T011 (implementação deve fazer os testes passarem)
- Na Phase 3: T013, T014, T015, T016 rodam em paralelo; T017, T018 dependem de T016; T019 é independente; T020, T021 após implementação

### Parallelism por story

```bash
# Phase 2 — clientes Supabase em paralelo:
Task T004: src/lib/db/supabase/client.ts
Task T005: src/lib/db/supabase/server.ts
Task T008: src/messages/pt-BR.json (auth + painel)
Task T009: src/messages/en.json (auth + painel)

# Phase 3 — US1, testes em paralelo:
Task T013: GoogleButton.test.tsx
Task T014: route.test.ts (callback)
Task T015: login/page.tsx
Task T016: AuthCard.tsx

# Phase 5 — US6, updates da LP em paralelo:
Task T031: HeroSection.tsx
Task T032: CtaSection.tsx
```

---

## Implementation Strategy

### MVP Scope (stories P1 — Phases 1–5)

1. Phase 1: Setup
2. Phase 2: Foundational + middleware
3. Phase 3: US1 — Google OAuth (loop completo até /painel) ← **Demo possível aqui**
4. Phase 4: US4 — Painel + Logout
5. Phase 5: US6 — LP CTAs sync

**STOP e VALIDAR**: loop auth completo + LP funcionando → PR de MVP.

### Incremento seguinte (stories P2 — Phases 6–7)

6. Phase 6: US2 — Cadastro e-mail+senha
7. Phase 7: US3 — Login e-mail+senha

### Entrega final

8. Phase 8: Polish + audit + validação manual

---

## Notes

- `[P]` = arquivos diferentes, sem dependências pendentes, podem rodar em paralelo
- `[Story]` = rastreabilidade com user story em `spec.md`
- TDD mandatório: escrever teste → confirmar RED → implementar → confirmar GREEN
- Executar `/impeccable shape` (T020, T026) ANTES de finalizar qualquer tela de UI
- Executar `/impeccable audit` (T045) ANTES de abrir o PR
- Usar tokens de `globals.css` — zero hex codes em componentes
- Zero strings hardcoded — tudo via `useTranslations()` / `await getTranslations()`
