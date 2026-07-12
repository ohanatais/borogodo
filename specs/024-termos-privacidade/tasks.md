---
description: "Task list — 024 Termos, Privacidade e Consentimento"
---

# Tasks: Termos, Privacidade e Consentimento

**Input**: Design documents from `/specs/024-termos-privacidade/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/consent.md, quickstart.md

**Tests**: Incluídos — a constituição do projeto exige TDD (Princípio VI, RED antes da implementação,
cobertura ≥ 80%).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US4 (mapeia as user stories da spec)
- Caminhos de arquivo exatos nas descrições

## Convenções de path

Web app (Next.js App Router): `src/app`, `src/components/features`, `src/lib`, `src/content`,
`src/messages`, `src/types`, `supabase/migrations`. Testes em `__tests__/` co-locados (padrão do projeto).

---

## Phase 1: Setup

**Purpose**: Nada de scaffolding novo — o projeto já existe. Só a confirmação de ponto de partida.

- [ ] T001 Confirmar branch `024-termos-privacidade` e que `npm run test` / `npm run build` passam limpos antes de começar (baseline verde)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infra compartilhada por todas as user stories. NADA de US pode começar antes disto.

- [ ] T002 [P] Criar migration aditiva `supabase/migrations/015_profiles_consent.sql` adicionando a `profiles`: `terms_accepted_at timestamptz`, `terms_version text`, `marketing_consent boolean not null default false` (usar `add column if not exists`; comentar que é aditiva/nullable-safe conforme data-model.md)
- [ ] T003 Aplicar a migration `015` no ambiente **dev** (Supabase) e confirmar as colunas em `profiles`
- [ ] T004 [P] Estender o tipo `Profile` em `src/types/profile.ts` com `terms_accepted_at: string | null`, `terms_version: string | null`, `marketing_consent: boolean`
- [ ] T005 [P] Escrever teste (RED) para `src/lib/legal/policy.ts` em `src/lib/legal/__tests__/policy.test.ts`: `needsTermsAcceptance(null) === true`, `needsTermsAcceptance('versão-antiga') === true`, `needsTermsAcceptance(CURRENT_TERMS_VERSION) === false`; `LEGAL_ROUTES` aponta para `/termos-de-uso` e `/politica-de-privacidade`
- [ ] T006 Implementar `src/lib/legal/policy.ts` (fonte única): `CURRENT_TERMS_VERSION`, `LEGAL_ROUTES`, `needsTermsAcceptance()` — fazer T005 passar (GREEN)
- [ ] T007 [P] Criar namespace `legal` em `src/messages/pt-BR.json` (autoritativo) com as chaves de contracts/consent.md (`signInWrap`, `marketingOptIn`, `consentGate.*`, `settings.*`, `termsPage.*`, `privacyPage.*`)
- [ ] T008 [P] Espelhar o namespace `legal` em `src/messages/en.json` (stub preenchido com fallback pt-BR, conforme padrão atual do projeto)
- [ ] T009 [P] Criar conteúdo placeholder editável em `src/content/legal/termos-de-uso.ts` e `src/content/legal/politica-de-privacidade.ts` (estrutura tipada de seções `{ heading, body }[]`, texto placeholder — separado do layout, SC-006)
- [ ] T010 [P] Escrever teste (RED) das server actions de consentimento em `src/lib/actions/__tests__/consent.test.ts`: `recordTermsAcceptance` grava `terms_version = CURRENT` + `terms_accepted_at`, é idempotente (não sobrescreve quando já na versão vigente), e exige auth; `setMarketingConsent(true/false)` persiste o booleano e exige auth
- [ ] T011 Implementar `src/lib/actions/consent.ts` (server actions `recordTermsAcceptance`, `setMarketingConsent`) — verificam `auth.getUser()` antes de escrever, escrevem só a linha do próprio usuário, validam input (Zod), tratam erro explicitamente — fazer T010 passar (GREEN)

**Checkpoint**: migration aplicada, tipos/i18n/policy/actions prontos e testados. Base para todas as stories.

---

## Phase 3: User Story 1 — Páginas legais públicas e vínculos (Priority: P1) 🎯 MVP

**Goal**: Duas páginas legais públicas SSR em URLs dedicadas, alcançáveis pelo rodapé e configurações.

**Independent Test**: Acessar `/termos-de-uso` e `/politica-de-privacidade` sem login; chegar até elas
pelo Footer e por `/configuracoes`.

- [ ] T012 [P] [US1] Escrever teste (RED) do componente `LegalPage` em `src/components/features/legal/__tests__/LegalPage.test.tsx`: renderiza título, versão vigente e as seções do conteúdo; hierarquia de headings correta
- [ ] T013 [US1] Implementar `src/components/features/legal/LegalPage.tsx` (Server Component de layout compartilhado: título, versão vigente de `policy.ts`, seções do conteúdo, tokens de design; mobile-first) — GREEN
- [ ] T014 [P] [US1] Criar `src/app/[locale]/termos-de-uso/page.tsx` (Server Component público, usa `LegalPage` + conteúdo de `content/legal/termos-de-uso.ts`, metadata SEO)
- [ ] T015 [P] [US1] Criar `src/app/[locale]/politica-de-privacidade/page.tsx` (idem, conteúdo de privacidade)
- [ ] T016 [US1] Editar `src/components/features/landing/Footer.tsx` para incluir links legais via `LEGAL_ROUTES` (i18n; sem hardcode de rota/texto)
- [ ] T017 [US1] Editar `src/app/[locale]/(app)/configuracoes/page.tsx` adicionando seção com os links legais via `LEGAL_ROUTES`
- [ ] T018 [US1] Verificar SSR/indexabilidade: conteúdo presente no HTML servido das duas rotas (sem exigir JS); revisão mobile 375px

**Checkpoint**: US1 entregue e testável de forma independente.

---

## Phase 4: User Story 2 — Aceite auditável no cadastro (Priority: P1)

**Goal**: Aviso sign-in-wrap no cadastro (sem checkbox de termos) + registro server-side do aceite para
novos usuários (Google e e-mail), carimbado ao concluir o onboarding.

**Independent Test**: Cadastrar por cada método, concluir onboarding, e verificar `terms_accepted_at` +
`terms_version` gravados; relogin não sobrescreve.

- [ ] T019 [P] [US2] Escrever teste (RED) em `src/components/features/auth/__tests__/AuthForm.test.tsx`: modo signup exibe o aviso sign-in-wrap com links para `LEGAL_ROUTES` e **sem** checkbox de termos
- [ ] T020 [US2] Editar `src/components/features/auth/AuthForm.tsx` (e/ou `AuthCard.tsx`) para renderizar o aviso sign-in-wrap (i18n `legal.signInWrap`, links via `LEGAL_ROUTES`) junto aos dois métodos de cadastro — GREEN
- [ ] T021 [US2] No cadastro por e-mail/senha, passar `options.data.marketing_consent` (valor do checkbox — ver US4) no `supabase.auth.signUp()` em `AuthForm.tsx` (carrega o metadata; persistência ocorre no onboarding)
- [ ] T022 [P] [US2] Escrever teste (RED) de integração do carimbo de aceite no fluxo de conclusão do onboarding (a ação que marca `onboarding_completed`): ao concluir, `recordTermsAcceptance` é chamada e grava a versão vigente
- [ ] T023 [US2] Editar a ação de conclusão do onboarding (`src/components/features/onboarding/` + a server action que marca `onboarding_completed`) para chamar `recordTermsAcceptance` (carimbo silencioso — novos usuários já consentiram via sign-in-wrap) — GREEN
- [ ] T024 [US2] Verificar idempotência: relogin/refresh não altera `terms_accepted_at` já gravado (cobre AS-4 da US2)

**Checkpoint**: novos usuários saem do cadastro com aceite auditável, sem clique extra.

---

## Phase 5: User Story 3 — Gate de re-consentimento (Priority: P2)

**Goal**: Contas sem aceite da versão vigente (antigas ou após bump) passam por `/consentimento` antes de
usar o produto; após aceitar, seguem normalmente.

**Independent Test**: Zerar `terms_version` de uma conta → acessar área interna → ser levado a
`/consentimento` → aceitar → registro atualizado → não repete.

- [ ] T025 [P] [US3] Escrever teste (RED) do gate em `src/app/[locale]/(app)/__tests__/layout.test.tsx` (ou teste da lógica de guarda extraída): usuário com `terms_version` != CURRENT é redirecionado para `/consentimento`; usuário em dia passa; ordem: auth → onboarding → termos
- [ ] T026 [US3] Editar `src/app/[locale]/(app)/layout.tsx` adicionando o 3º gate: após onboarding, se `needsTermsAcceptance(profile.terms_version)` → `redirect('/consentimento')` (selecionar `terms_version` no query do perfil) — GREEN
- [ ] T027 [P] [US3] Escrever teste (RED) da UI `ConsentGate` em `src/components/features/legal/__tests__/ConsentGate.test.tsx`: mostra resumo + links legais + botão "Aceito"; ao submeter chama `recordTermsAcceptance`
- [ ] T028 [US3] Implementar `src/components/features/legal/ConsentGate.tsx` (UI da tela; i18n `legal.consentGate.*`; tokens; toque ≥ 48px) — GREEN
- [ ] T029 [US3] Criar `src/app/[locale]/consentimento/page.tsx` (auth obrigatória, **fora** do grupo `(app)` para não recursar no gate; usa `ConsentGate`; após aceite, redireciona para `/painel`)
- [ ] T030 [US3] Validar bump de versão: alterar `CURRENT_TERMS_VERSION` reprograma o gate para todos com versão anterior (cobre AS-4 da US3); revisão mobile 375px

**Checkpoint**: base existente e mudanças de versão cobertas pelo gate.

---

## Phase 6: User Story 4 — Consentimento de marketing separado (Priority: P3)

**Goal**: Opt-in de marketing desligado por padrão; checkbox no cadastro por e-mail, pergunta no
onboarding para Google, toggle editável em configurações.

**Independent Test**: Marketing começa `false` em qualquer caminho; opt-in aparece desmarcado; toggle em
configurações persiste liga/desliga; nunca empacotado com o aceite dos termos.

- [ ] T031 [P] [US4] Escrever teste (RED) em `AuthForm.test.tsx`: modo signup **e-mail/senha** exibe checkbox de marketing **desmarcado** e separado do aviso de termos; modo Google não exibe checkbox
- [ ] T032 [US4] Editar `src/components/features/auth/AuthForm.tsx` para adicionar o checkbox de marketing (desmarcado, i18n `legal.marketingOptIn`) só no cadastro por e-mail/senha, alimentando `options.data.marketing_consent` (T021) — GREEN
- [ ] T033 [P] [US4] Escrever teste (RED) da persistência silenciosa do metadata de marketing do e-mail: ao concluir o onboarding, o valor de `user_metadata.marketing_consent` (do signup por e-mail) é gravado em `profiles` via `setMarketingConsent`, **sem** exibir UI de marketing no onboarding
- [ ] T034 [US4] Editar a conclusão do onboarding (`src/components/features/onboarding/` + a ação que marca `onboarding_completed`) para persistir silenciosamente `user_metadata.marketing_consent` (chamar `setMarketingConsent`) — **sem** pergunta/checkbox de marketing no fluxo (decisão: onboarding livre de consentimento de marketing) — GREEN
- [ ] T035 [P] [US4] Escrever teste (RED) do `MarketingToggle` em `src/components/features/legal/__tests__/MarketingToggle.test.tsx`: reflete valor atual; alternar chama `setMarketingConsent`
- [ ] T036 [US4] Implementar `src/components/features/legal/MarketingToggle.tsx` (client, toque ≥ 48px, i18n) — GREEN
- [ ] T037 [US4] Editar `src/app/[locale]/(app)/configuracoes/page.tsx` para incluir o `MarketingToggle` + a linha "Você aceitou os termos (vX) em DD/MM/AAAA" (a partir do perfil + `policy.ts`)

**Checkpoint**: marketing capturado de forma conforme, desligado por padrão, editável.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Fechamento de qualidade, acessibilidade e design.

- [ ] T038 [P] Rodar `npm run test` e confirmar cobertura ≥ 80% nos módulos novos (policy, actions, gate, páginas, componentes)
- [ ] T039 [P] Rodar `npm run lint` e `npm run build` — zero erro de tipo (strict, sem `any`); nenhum `console.log`
- [ ] T040 Revisão de acessibilidade WCAG AA das telas novas/alteradas (labels, foco visível, contraste via tokens, headings) + revisão mobile-first em 375px de todas as superfícies
- [ ] T041 Executar o roteiro de `quickstart.md` ponta-a-ponta (4 cenários) no ambiente dev
- [ ] T042 `/impeccable audit` nas telas novas (páginas legais, `/consentimento`, ajustes de cadastro/onboarding/configurações) antes do PR

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** bloqueiam tudo.
- **US1 (Phase 3)** depende só de Foundational — pode ser o **MVP** isolado.
- **US2 (Phase 4)** depende de Foundational (policy, actions). Independente de US1 (mas os links do
  sign-in-wrap apontam para as páginas de US1 — entregar US1 antes dá links reais).
- **US3 (Phase 5)** depende de Foundational (gate usa `recordTermsAcceptance` e `needsTermsAcceptance`).
- **US4 (Phase 6)** depende de Foundational; toca `AuthForm` (coordenar com US2) e onboarding.
- **Polish (Phase 7)** por último.

**Ordem recomendada**: Foundational → US1 → US2 → US3 → US4 → Polish.

## Parallel Opportunities

- Foundational: T002/T004/T005/T007/T008/T009/T010 em paralelo (arquivos distintos); T006 depois de T005; T011 depois de T010.
- US1: T012, T014, T015 em paralelo; T013 depois de T012.
- US4: T031, T033, T035 (testes) em paralelo antes das implementações correspondentes.
- Coordenar T020/T032 (ambas tocam `AuthForm.tsx`) — não paralelizar entre si.

## Implementation Strategy

- **MVP**: Foundational + US1 (páginas públicas + vínculos) — já entrega valor de launch por si só.
- **Núcleo legal**: + US2 (aceite auditável) + US3 (gate) — fecha a conformidade de consentimento.
- **Completar**: + US4 (marketing) — a camada opt-in separada.
- Cada story é um incremento testável de forma independente; marcar `[x]` em cada task ao concluir
  (hook Stop do projeto exige tasks.md atualizado quando `src/` muda).
