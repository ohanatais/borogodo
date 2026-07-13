# Implementation Plan: Termos, Privacidade e Consentimento

**Branch**: `024-termos-privacidade` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-termos-privacidade/spec.md`

## Summary

Entregar (a) duas páginas legais públicas em URLs dedicadas e legíveis (`/termos-de-uso`,
`/politica-de-privacidade`), renderizadas no servidor, com conteúdo placeholder editável; (b) o aceite
dos Termos no cadastro via **sign-in-wrap** (aviso + links, sem checkbox), com **registro auditável
server-side** (data + versão) por conta; (c) um **gate de re-consentimento** que cobre contas atuais e
mudanças de versão dos termos; e (d) um **consentimento de marketing separado, desligado por padrão**
(checkbox no cadastro por e-mail, pergunta no onboarding para Google, toggle nas configurações).

**Abordagem técnica** (reaproveita a infraestrutura existente, zero fundação nova):
- Fonte única de verdade em `src/lib/legal/policy.ts` (versão vigente + rotas), espelhando o padrão de
  `src/lib/support/channels.ts`.
- Migration aditiva `015_profiles_consent.sql`: 3 colunas em `profiles` (`terms_accepted_at`,
  `terms_version`, `marketing_consent`). Nullable/default seguro para linhas existentes.
- **O registro do aceite acontece no ponto de render autenticado**, não no callback OAuth — o que trata
  Google e e-mail de forma idêntica e testável, e evita duplicar lógica na rota `/auth/callback`
  (fora do grupo `[locale]`). Novos usuários são carimbados silenciosamente ao concluir o onboarding
  (eles já consentiram via aviso sign-in-wrap); usuários existentes e bumps de versão passam por uma
  tela explícita de aceite via o **gate já existente** em `(app)/layout.tsx`.
- URLs sem prefixo de locale (o projeto usa `localePrefix: 'never'`), então `/politica-de-privacidade`
  resolve direto.

## Technical Context

**Language/Version**: TypeScript strict (sem `any`), Next.js 15 (App Router, Server Components por padrão)

**Primary Dependencies**: next-intl (i18n), Supabase (`@supabase/ssr`), Tailwind + shadcn/ui, Zod
(validação de boundary), Vitest + Testing Library

**Storage**: Supabase PostgreSQL. Tabela `profiles` (com RLS existente: usuário lê/atualiza a própria
linha via `auth.uid() = id`). Migration aditiva; nenhuma tabela nova.

**Testing**: Vitest + Testing Library (unit/integration); TDD obrigatório (RED antes da implementação),
cobertura ≥ 80%.

**Target Platform**: Web (mobile-first; revisão em viewport 375 px obrigatória)

**Project Type**: Web application (Next.js App Router monolítico)

**Performance Goals**: Páginas legais SSR e indexáveis; sem JS de bloqueio; micro-interações em CSS.

**Constraints**: RLS em toda query; nenhuma string de UI hardcoded (i18n desde a fase Foundational);
tokens de design do `globals.css` (sem hex cru); WCAG AA; toque ≥ 48×48 px.

**Scale/Scope**: Pré-launch (poucos/nenhum usuário real além de contas de teste). ~2 páginas novas,
1 migration, 1 gate, 1 tela de re-consentimento, ajustes em auth/onboarding/footer/configurações,
1 namespace i18n.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Aplicação nesta feature | Status |
|---|---|---|
| I. Security First (RLS, sem log de dado de usuário) | Colunas de consentimento em `profiles` sob RLS existente (`auth.uid() = id`); server actions verificam auth antes de escrever; nenhum dado sensível logado; consentimento não é dado de terceiros. | ✅ |
| II. TypeScript Strict & Code Quality | Sem `any`; funções < 40 linhas; 1 componente por arquivo; erros tratados explicitamente; SSR por padrão. | ✅ |
| III. AI-First | Feature não toca a camada de IA. | ✅ N/A |
| IV. Server-First & Performance | Páginas legais e gate são Server Components; sign-in-wrap é markup estático; micro-interações em CSS. | ✅ |
| V. Accessibility WCAG AA | Checkbox/links com label acessível; foco visível; contraste via tokens; hierarquia de headings nas páginas legais. | ✅ |
| VI. TDD (≥80%) | Testes primeiro para: `policy.ts`, gate de consentimento, server actions, presença de chaves i18n, default de marketing = false. | ✅ |
| VII. Design Identity | Páginas legais e telas usam tokens + Fraunces/Inter; `/impeccable shape` antes de implementar as telas; `/impeccable audit` antes do PR. | ✅ (shape/audit no fluxo) |
| VIII. Mobile-First | Estilo mobile-first; toque ≥ 48px no checkbox/toggle/botões; revisão em 375px. | ✅ |
| IX. i18n Architecture | Novo namespace `legal` em `pt-BR.json` (autoritativo) + `en.json` (stub/fallback); chaves camelCase; estabelecido na fase Foundational. | ✅ |

**Sem violações.** Complexity Tracking não se aplica.

## Project Structure

### Documentation (this feature)

```text
specs/024-termos-privacidade/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões de arquitetura de consentimento
├── data-model.md        # Phase 1 — colunas de profiles + entidades
├── quickstart.md        # Phase 1 — roteiro de validação manual
├── contracts/
│   └── consent.md       # Phase 1 — contratos das server actions + rotas + gate
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── [locale]/
│   │   ├── termos-de-uso/page.tsx              # NOVO — página pública SSR
│   │   ├── politica-de-privacidade/page.tsx    # NOVO — página pública SSR
│   │   ├── consentimento/page.tsx              # NOVO — tela de re-consentimento (auth, fora de (app))
│   │   └── (app)/
│   │       ├── layout.tsx                       # EDIT — adiciona 3º gate: terms_version != CURRENT → /consentimento
│   │       └── configuracoes/page.tsx           # EDIT — seção legal + toggle de marketing + "aceitou vX em DD/MM"
│   └── auth/callback/route.ts                    # (sem mudança — decisão em research.md)
├── components/
│   └── features/
│       ├── legal/
│       │   ├── LegalPage.tsx                     # NOVO — layout compartilhado das páginas legais
│       │   ├── ConsentGate.tsx                   # NOVO — UI da tela de re-consentimento
│       │   └── MarketingToggle.tsx              # NOVO — toggle de marketing (config)
│       ├── auth/
│       │   ├── AuthForm.tsx                      # EDIT — aviso sign-in-wrap + checkbox marketing (só e-mail/senha)
│       │   └── AuthCard.tsx                      # (aviso pode viver aqui ou em AuthForm)
│       ├── onboarding/
│       │   └── ... (WelcomeStep/OnboardingShell) # EDIT — carimbo de aceite ao concluir + persistência silenciosa do marketing do metadata (SEM UI de marketing)
│       └── landing/
│           └── Footer.tsx                        # EDIT — links /termos-de-uso e /politica-de-privacidade
├── content/
│   └── legal/
│       ├── termos-de-uso.ts                      # NOVO — conteúdo placeholder editável (estrutura de seções)
│       └── politica-de-privacidade.ts            # NOVO — idem
├── lib/
│   ├── legal/
│   │   └── policy.ts                             # NOVO — CURRENT_TERMS_VERSION + rotas (fonte única)
│   └── actions/
│       └── consent.ts                            # NOVO — server actions: recordTermsAcceptance, setMarketingConsent
├── messages/
│   ├── pt-BR.json                                # EDIT — namespace "legal" (autoritativo)
│   └── en.json                                   # EDIT — namespace "legal" (stub/fallback pt-BR)
└── types/
    └── profile.ts                                # EDIT — Profile ganha terms_accepted_at, terms_version, marketing_consent

supabase/migrations/
└── 015_profiles_consent.sql                      # NOVO — colunas de consentimento (aditiva)
```

**Structure Decision**: Web application (Next.js App Router). Segue as convenções do projeto:
`app/[locale]` para páginas, `components/features/<domínio>` para UI, `lib/legal` como fonte única (padrão
`lib/support/channels.ts`), `lib/actions` para server actions, `content/legal` para o texto editável
separado do layout, e `messages/` para i18n. Nenhuma estrutura nova de projeto.

## Complexity Tracking

> Sem violações constitucionais — seção não aplicável.
