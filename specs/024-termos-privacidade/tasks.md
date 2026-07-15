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

- [x] T001 Confirmar branch `024-termos-privacidade` e que `npm run test` / `npm run build` passam limpos antes de começar (baseline verde)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infra compartilhada por todas as user stories. NADA de US pode começar antes disto.

- [x] T002 [P] Criar migration aditiva `supabase/migrations/015_profiles_consent.sql` adicionando a `profiles`: `terms_accepted_at timestamptz`, `terms_version text`, `marketing_consent boolean not null default false` (usar `add column if not exists`; comentar que é aditiva/nullable-safe conforme data-model.md)
- [x] T003 Aplicar a migration `015` no ambiente **dev** (Supabase) e confirmar as colunas em `profiles`
- [x] T004 [P] Estender o tipo `Profile` em `src/types/profile.ts` com `terms_accepted_at: string | null`, `terms_version: string | null`, `marketing_consent: boolean`
- [x] T005 [P] Escrever teste (RED) para `src/lib/legal/policy.ts` em `src/lib/legal/__tests__/policy.test.ts`: `needsTermsAcceptance(null) === true`, `needsTermsAcceptance('versão-antiga') === true`, `needsTermsAcceptance(CURRENT_TERMS_VERSION) === false`; `LEGAL_ROUTES` aponta para `/termos-de-uso` e `/politica-de-privacidade`
- [x] T006 Implementar `src/lib/legal/policy.ts` (fonte única): `CURRENT_TERMS_VERSION`, `LEGAL_ROUTES`, `needsTermsAcceptance()` — fazer T005 passar (GREEN)
- [x] T007 [P] Criar namespace `legal` em `src/messages/pt-BR.json` (autoritativo) com as chaves de contracts/consent.md (`signInWrap`, `marketingOptIn`, `consentGate.*`, `settings.*`, `termsPage.*`, `privacyPage.*`)
- [x] T008 [P] Espelhar o namespace `legal` em `src/messages/en.json` (stub preenchido com fallback pt-BR, conforme padrão atual do projeto)
- [x] T009 [P] Criar conteúdo placeholder editável em `src/content/legal/termos-de-uso.ts` e `src/content/legal/politica-de-privacidade.ts` (estrutura tipada de seções `{ heading, body }[]`, texto placeholder — separado do layout, SC-006)
- [x] T010 [P] Escrever teste (RED) das server actions de consentimento em `src/lib/actions/__tests__/consent.test.ts`: `recordTermsAcceptance` grava `terms_version = CURRENT` + `terms_accepted_at`, é idempotente (não sobrescreve quando já na versão vigente), e exige auth; `setMarketingConsent(true/false)` persiste o booleano e exige auth
- [x] T011 Implementar `src/lib/actions/consent.ts` (server actions `recordTermsAcceptance`, `setMarketingConsent`) — verificam `auth.getUser()` antes de escrever, escrevem só a linha do próprio usuário, validam input (Zod), tratam erro explicitamente — fazer T010 passar (GREEN)

**Checkpoint**: migration aplicada, tipos/i18n/policy/actions prontos e testados. Base para todas as stories.

---

## Phase 3: User Story 1 — Páginas legais públicas e vínculos (Priority: P1) 🎯 MVP

**Goal**: Duas páginas legais públicas SSR em URLs dedicadas, alcançáveis pelo rodapé e configurações.

**Independent Test**: Acessar `/termos-de-uso` e `/politica-de-privacidade` sem login; chegar até elas
pelo Footer e por `/configuracoes`.

- [x] T012 [P] [US1] Escrever teste (RED) do componente `LegalPage` em `src/components/features/legal/__tests__/LegalPage.test.tsx`: renderiza título, versão vigente e as seções do conteúdo; hierarquia de headings correta
- [x] T013 [US1] Implementar `src/components/features/legal/LegalPage.tsx` (Server Component de layout compartilhado: título, versão vigente de `policy.ts`, seções do conteúdo, tokens de design; mobile-first) — GREEN
- [x] T014 [P] [US1] Criar `src/app/[locale]/termos-de-uso/page.tsx` (Server Component público, usa `LegalPage` + conteúdo de `content/legal/termos-de-uso.ts`, metadata SEO)
- [x] T015 [P] [US1] Criar `src/app/[locale]/politica-de-privacidade/page.tsx` (idem, conteúdo de privacidade)
- [x] T016 [US1] Editar `src/components/features/landing/Footer.tsx` para incluir links legais via `LEGAL_ROUTES` (i18n; sem hardcode de rota/texto)
- [x] T017 [US1] Editar `src/app/[locale]/(app)/configuracoes/page.tsx` adicionando seção com os links legais via `LEGAL_ROUTES`
- [x] T018 [US1] Verificar SSR/indexabilidade: conteúdo presente no HTML servido das duas rotas (sem exigir JS); revisão mobile 375px

**Checkpoint**: US1 entregue e testável de forma independente.

---

## Phase 4: User Story 2 — Aceite auditável no cadastro (Priority: P1)

**Goal**: Aviso sign-in-wrap no cadastro (sem checkbox de termos) + registro server-side do aceite para
novos usuários (Google e e-mail), carimbado ao concluir o onboarding.

**Independent Test**: Cadastrar por cada método, concluir onboarding, e verificar `terms_accepted_at` +
`terms_version` gravados; relogin não sobrescreve.

- [x] T019 [P] [US2] Escrever teste (RED) em `src/components/features/auth/__tests__/AuthForm.test.tsx`: modo signup exibe o aviso sign-in-wrap com links para `LEGAL_ROUTES` e **sem** checkbox de termos
- [x] T020 [US2] Editar `src/components/features/auth/AuthForm.tsx` (e/ou `AuthCard.tsx`) para renderizar o aviso sign-in-wrap (i18n `legal.signInWrap`, links via `LEGAL_ROUTES`) junto aos dois métodos de cadastro — GREEN
- [x] T021 [US2] No cadastro por e-mail/senha, passar `options.data.marketing_consent` (valor do checkbox — ver US4) no `supabase.auth.signUp()` em `AuthForm.tsx` (carrega o metadata; persistência ocorre no onboarding)
- [x] T022 [P] [US2] Escrever teste (RED) de integração do carimbo de aceite no fluxo de conclusão do onboarding (a ação que marca `onboarding_completed`): ao concluir, `recordTermsAcceptance` é chamada e grava a versão vigente
- [x] T023 [US2] Editar a ação de conclusão do onboarding (`src/components/features/onboarding/` + a server action que marca `onboarding_completed`) para chamar `recordTermsAcceptance` (carimbo silencioso — novos usuários já consentiram via sign-in-wrap) — GREEN
- [x] T024 [US2] Verificar idempotência: relogin/refresh não altera `terms_accepted_at` já gravado (cobre AS-4 da US2)

  > Coberto pelo teste "is idempotent when already on the current version (no overwrite)" em
  > `src/lib/actions/__tests__/consent.test.ts` (Foundational, T010) — `recordTermsAcceptance`
  > não sobrescreve `terms_accepted_at` quando `terms_version` já é a vigente, e é exatamente
  > essa mesma função chamada em todo login/refresh que atravessa `recordConsent()`.

**Checkpoint**: novos usuários saem do cadastro com aceite auditável, sem clique extra.

---

## Phase 5: User Story 3 — Gate de re-consentimento (Priority: P2)

**Goal**: Contas sem aceite da versão vigente (antigas ou após bump) passam por `/consentimento` antes de
usar o produto; após aceitar, seguem normalmente.

**Independent Test**: Zerar `terms_version` de uma conta → acessar área interna → ser levado a
`/consentimento` → aceitar → registro atualizado → não repete.

- [x] T025 [P] [US3] Escrever teste (RED) do gate em `src/app/[locale]/(app)/__tests__/layout.test.tsx` (ou teste da lógica de guarda extraída): usuário com `terms_version` != CURRENT é redirecionado para `/consentimento`; usuário em dia passa; ordem: auth → onboarding → termos
- [x] T026 [US3] Editar `src/app/[locale]/(app)/layout.tsx` adicionando o 3º gate: após onboarding, se `needsTermsAcceptance(profile.terms_version)` → `redirect('/consentimento')` (selecionar `terms_version` no query do perfil) — GREEN

  > Também adicionei `return null` após cada `redirect()` no gate — sem isso, o layout seguia
  > executando (e quebrava em `user.id`) sob teste, porque o mock de `redirect()` não lança como
  > o real do Next faz. Mais correto de qualquer forma: não depender do throw implícito.
- [x] T027 [P] [US3] Escrever teste (RED) da UI `ConsentGate` em `src/components/features/legal/__tests__/ConsentGate.test.tsx`: mostra resumo + links legais + botão "Aceito"; ao submeter chama `recordTermsAcceptance`
- [x] T028 [US3] Implementar `src/components/features/legal/ConsentGate.tsx` (UI da tela; i18n `legal.consentGate.*`; tokens; toque ≥ 48px) — GREEN
- [x] T029 [US3] Criar `src/app/[locale]/consentimento/page.tsx` (auth obrigatória, **fora** do grupo `(app)` para não recursar no gate; usa `ConsentGate`; após aceite, redireciona para `/painel`)
- [x] T030 [US3] Validar bump de versão: alterar `CURRENT_TERMS_VERSION` reprograma o gate para todos com versão anterior (cobre AS-4 da US3); revisão mobile 375px

  > Coberto estruturalmente: o gate (`needsTermsAcceptance`) e o `ConsentGate` (`hasAcceptedBefore`)
  > não hardcodam a versão — leem sempre `CURRENT_TERMS_VERSION` de `policy.ts`. Testado em
  > `policy.test.ts` (Foundational). Revisão mobile: mesma análise de CSS mobile-first do T018
  > (coluna única, `px-6`, sem larguras fixas) — sem Playwright disponível nesta worktree para
  > screenshot real em 375px.

**Checkpoint**: base existente e mudanças de versão cobertas pelo gate.

---

## Phase 6: User Story 4 — Consentimento de marketing separado (Priority: P3)

**Goal**: Opt-in de marketing desligado por padrão; checkbox no cadastro por e-mail, pergunta no
onboarding para Google, toggle editável em configurações.

**Independent Test**: Marketing começa `false` em qualquer caminho; opt-in aparece desmarcado; toggle em
configurações persiste liga/desliga; nunca empacotado com o aceite dos termos.

- [x] T031 [P] [US4] Escrever teste (RED) em `AuthForm.test.tsx`: modo signup **e-mail/senha** exibe checkbox de marketing **desmarcado** e separado do aviso de termos; modo Google não exibe checkbox
- [x] T032 [US4] Editar `src/components/features/auth/AuthForm.tsx` para adicionar o checkbox de marketing (desmarcado, i18n `legal.marketingOptIn`) só no cadastro por e-mail/senha, alimentando `options.data.marketing_consent` (T021) — GREEN

  > T019–T021 e T031–T032 foram implementadas juntas em `AuthForm.tsx` (mesmo componente,
  > mesma sessão de TDD): checkbox de marketing + aviso sign-in-wrap, com os 5 casos cobertos em
  > `AuthForm.test.tsx` (describe "AuthForm — legal consent (024)"). O modo Google não passa
  > por `AuthForm` (é `GoogleButton`, sem formulário), então não há checkbox nele por construção.
- [x] T033 [P] [US4] Escrever teste (RED) da persistência silenciosa do metadata de marketing do e-mail: ao concluir o onboarding, o valor de `user_metadata.marketing_consent` (do signup por e-mail) é gravado em `profiles` via `setMarketingConsent`, **sem** exibir UI de marketing no onboarding
- [x] T034 [US4] Editar a conclusão do onboarding (`src/components/features/onboarding/` + a ação que marca `onboarding_completed`) para persistir silenciosamente `user_metadata.marketing_consent` (chamar `setMarketingConsent`) — **sem** pergunta/checkbox de marketing no fluxo (decisão: onboarding livre de consentimento de marketing) — GREEN

  > Nota de implementação: a ação que marca `onboarding_completed` vive em
  > `src/app/api/mirror/generate/route.ts` (não em `src/components/features/onboarding/`) — é o
  > handler que o fluxo de onboarding chama ao gerar o primeiro espelho. T022–T023 e T033–T034
  > foram implementadas juntas ali (`recordConsent()`), com os 3 casos cobertos em
  > `src/app/api/mirror/generate/__tests__/route.test.ts`.
- [x] T035 [P] [US4] Escrever teste (RED) do `MarketingToggle` em `src/components/features/legal/__tests__/MarketingToggle.test.tsx`: reflete valor atual; alternar chama `setMarketingConsent`
- [x] T036 [US4] Implementar `src/components/features/legal/MarketingToggle.tsx` (client, toque ≥ 48px, i18n) — GREEN
- [x] T037 [US4] Editar `src/app/[locale]/(app)/configuracoes/page.tsx` para incluir o `MarketingToggle` + a linha "Você aceitou os termos (vX) em DD/MM/AAAA" (a partir do perfil + `policy.ts`)

  > `MarketingToggle` e a linha "acceptedOn" entraram dentro de `LegalLinksCard` (mesmo card de
  > "Privacidade e consentimento" do US1), não como blocos soltos na página — reaproveita o
  > cabeçalho e os links já existentes. `configuracoes/page.tsx` só passa os 3 campos do perfil.

**Checkpoint**: marketing capturado de forma conforme, desligado por padrão, editável.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Fechamento de qualidade, acessibilidade e design.

- [x] T038 [P] Rodar `npm run test` e confirmar cobertura ≥ 80% nos módulos novos (policy, actions, gate, páginas, componentes)

  > 933 testes passando. `src/components/features/legal` (LegalPage, ConsentGate,
  > MarketingToggle, LegalLinksCard): 100% stmts/funcs/lines, 92.85% branch — os 3 componentes
  > com 100% em tudo somem da tabela por padrão do istanbul (só lista arquivos com alguma
  > lacuna). `src/lib/actions/consent.ts`: 89.28% stmts. `src/lib/legal/policy.ts`: coberto
  > pelo Foundational (T005). Todos acima do piso de 80%.
- [x] T039 [P] Rodar `npm run lint` e `npm run build` — zero erro de tipo (strict, sem `any`); nenhum `console.log`

  > Build e lint limpos (só os 15 warnings pré-existentes, nenhum novo). Nenhum `console.log`
  > nos arquivos novos/alterados desta feature.
- [x] T040 Revisão de acessibilidade WCAG AA das telas novas/alteradas (labels, foco visível, contraste via tokens, headings) + revisão mobile-first em 375px de todas as superfícies

  > Revisão de código (sem Playwright disponível nesta worktree para screenshot real em 375px —
  > mesma limitação do T018/T030). Checado por leitura: `LegalPage` tem hierarquia de heading
  > correta (1× h1, 1× h2 por seção, testado em T012); todo `<input type="checkbox">` novo
  > (marketing no cadastro, `MarketingToggle`) tem `aria-label` explícito e wrapper `min-h-12`
  > (toque ≥ 48px); botões de submit (`ConsentGate`, cadastro) já usavam `min-h-12`; cores só via
  > tokens `var(--...)`, nenhum hex cru introduzido; foco visível herda o `:focus-visible` global
  > já existente. Layouts são coluna única com `px-6`/`max-w-[68ch]`, mobile-first por
  > construção — sem breakpoints que quebrem em 375px.
- [x] T041 Executar o roteiro de `quickstart.md` ponta-a-ponta (4 cenários) no ambiente dev

  > **Validação ao vivo (sem navegador) com a conta de QA reutilizável** (Mailinator descartável,
  > sessão via `POST /auth/v1/token`, cookie `sb-...-auth-token` — mesma receita já documentada em
  > memória de sessões anteriores), com autorização explícita da Ohana pra cada escrita:
  > - **Cenário 1**: já validado no T018 (curl sem login, HTML com conteúdo).
  > - **Cenário 3 (gate)**: a conta de QA já estava com `terms_version = null` (uma conta "antiga"
  >   real, pré-feature) — acessar `/painel` com a sessão dela redirecionou pra `/consentimento`
  >   (307), a tela carregou (200) com o título certo pra conta antiga ("Falta só um passo") e os
  >   links legais. Simulei o resultado do clique em "Aceito" via SQL (`UPDATE profiles SET
  >   terms_version = '2026-07', terms_accepted_at = now()`, autorizado explicitamente) e
  >   confirmei que `/painel` parou de redirecionar (200) e que `/configuracoes` passou a mostrar
  >   "Você aceitou os Termos (v2026-07) em 12/07/2026" com a data/versão certas.
  > - **Cenário 2 (aviso sign-in-wrap)**: confirmado no HTML de `/login?mode=signup` — o aviso
  >   "Ao continuar, você concorda..." e o checkbox "Quero receber novidades..." estão presentes.
  > - **O que ficou de fora**: reproduzir o clique real em "Aceito"/"Salvar" (Server Actions do
  >   Next.js, protocolo interno frágil de simular via curl) e um cadastro de ponta a ponta
  >   (e-mail + Google, que dispararia e-mail de confirmação real e custo de IA ao gerar o
  >   primeiro espelho) — para essas partes, a decisão de negócio (idempotência, auth
  >   obrigatória, gravação correta) já tem cobertura de teste automatizado dedicada
  >   (`consent.test.ts`, `route.test.ts`, `ConsentGate.test.tsx`, `AuthForm.test.tsx`); o que a
  >   checagem ao vivo acima cobre é exatamente a integração que os testes unitários não veem — a
  >   fiação real entre middleware, gate e banco.
- [ ] T042 `/impeccable audit` nas telas novas (páginas legais, `/consentimento`, ajustes de cadastro/onboarding/configurações) antes do PR

  > **Não disponível nesta sessão** — a skill `/impeccable` não está entre as skills carregadas
  > neste ambiente autônomo. Precisa rodar numa sessão interativa onde ela esteja disponível,
  > antes do PR.

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
