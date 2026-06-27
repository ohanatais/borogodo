---
description: "Task list — Rebuild da Landing Page (022)"
---

# Tasks: Rebuild da Landing Page

**Input**: Design documents from `/specs/022-landing-rebuild/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/landing.md, quickstart.md

**Tests**: incluídos (Constituição VI exige TDD; cobertura ≥80%).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: a qual user story pertence

## Path Conventions

Web app Next.js App Router: `src/app/`, `src/components/features/landing/`, `src/messages/`,
`public/`. Testes em `src/components/features/landing/__tests__/`.

---

## Phase 1: Setup (infra compartilhada)

- [ ] T001 Remover os mockups fake: deletar `src/components/features/landing/MirrorMockup.tsx`,
  `CareerMapMockup.tsx`, `ContentGenSection.tsx` e seus imports/usos em `src/app/[locale]/page.tsx`.
- [ ] T002 [P] Criar `src/components/features/landing/faqData.ts` com a lista ordenada de
  `FaqItem` (id, questionKey, answerKey) conforme data-model.md.
- [ ] T003 [P] Criar `public/og/espelho-prova.png` (placeholder de qualidade do card de força
  com prova) e `public/llms.txt` (definição conforme decision record).

---

## Phase 2: Foundational (pré-requisito de todas as stories)

**⚠️ Bloqueia as user stories.**

- [ ] T004 Adicionar todos os namespaces de i18n em `src/messages/pt-BR.json` (landingNav, hero,
  painPoints, journey, proof, ownership, manifesto, socialProof, faq, cta, metadata) com a copy
  final do decision record (regra de voz: sem travessão, sem "não é X, é Y", sem lista de três).
- [ ] T005 Espelhar a mesma estrutura de chaves em `src/messages/en.json` (stub; pode repetir
  pt-BR como placeholder de tradução).
- [ ] T006 [P] Teste (RED) `__tests__/MediaSlot.test.tsx`: proporção fixa preservada; troca de
  `kind` placeholder→image→video não altera a caixa; `video` exige `poster`.
- [ ] T007 Implementar `src/components/features/landing/MediaSlot.tsx` (GREEN): caixa de
  proporção fixa (`aspect`), `kind` ('placeholder'|'image'|'video'), `next/image` para image,
  `<video>` com poster para video, `label` acessível. Server Component.

---

## Phase 3: User Story 1 — Visitante frio entende e cria conta (P1) 🎯 MVP

**Goal**: primeira dobra comunica a dor, mostra demo (no mobile), deixa claro que é grátis, CTA
único de signup. **Independent test**: abrir sem sessão no mobile e desktop, validar dobra + CTA.

- [ ] T008 [P] [US1] Teste (RED) `__tests__/HeroSection.test.tsx`: existe um único `<h1>` com a
  headline da dor; eyebrow com significado de "borogodó"; subheadline com frase definitória; um
  CTA primário para `/login?mode=signup`; microcopy de gratuidade + ~5min.
- [ ] T009 [P] [US1] Teste (RED) `__tests__/NavBar.test.tsx`: âncoras presentes; link "Entrar"
  para `/login`; sem CTA de signup concorrente.
- [ ] T010 [P] [US1] Teste (RED) `__tests__/CtaSection.test.tsx`: CTA único final para signup.
- [ ] T011 [US1] Reescrever `HeroSection.tsx` (GREEN): eyebrow + h1 da dor + subheadline + CTA
  único + microcopy + micro-trust. Server Component; passa `t` via `getTranslations`.
- [ ] T012 [US1] Criar `HeroDemo.tsx` (ilha client): demo com `MediaSlot` (aspect 16/9),
  **visível no mobile** (remover `hidden md:flex`), mostrando força com evidência citada;
  respeita movimento reduzido.
- [ ] T013 [P] [US1] Reescrever `NavBar.tsx` (GREEN): logo, âncoras, "Entrar" discreto.
- [ ] T014 [P] [US1] Reescrever `CtaSection.tsx` (GREEN): título/sub + CTA único.
- [ ] T015 [US1] Recompôr `src/app/[locale]/page.tsx` com a ordem nova de seções (parcial até
  US1; demais entram nas fases seguintes).

**Checkpoint**: hero + navbar + CTA final funcionam e convertem; demo visível no mobile.

---

## Phase 4: User Story 2 — Buscador e IA encontram e citam (P1)

**Goal**: SEO/GEO 100%. **Independent test**: H1 único, 3 JSON-LD válidos, llms.txt, SSR,
crawlers liberados, meta/OG humanas.

- [ ] T016 [P] [US2] Teste (RED) `__tests__/StructuredData.test.tsx`: renderiza 3 blocos
  `application/ld+json` (SoftwareApplication, Organization, FAQPage); FAQPage tem o mesmo nº de
  itens que `faqData.ts`.
- [ ] T017 [US2] Implementar `StructuredData.tsx` (GREEN): injeta os 3 blocos; FAQPage derivado
  de `faqData.ts` + i18n.
- [ ] T018 [US2] `generateMetadata` locale-aware em `src/app/[locale]/layout.tsx` (title,
  description, openGraph, twitter, locale pt_BR) lendo do namespace `metadata`; enxugar
  `src/app/layout.tsx`.
- [ ] T019 [P] [US2] Criar `src/app/robots.ts` liberando crawlers gerais e de IA (GPTBot,
  PerplexityBot, ChatGPT-User, Google-Extended) e apontando sitemap.
- [ ] T020 [US2] Incluir `<StructuredData/>` em `src/app/[locale]/page.tsx`; garantir que todas
  as seções são Server Components (SSR) e a frase definitória está nos primeiros parágrafos.
- [ ] T021 [P] [US2] Teste (RED→GREEN) `__tests__/metadata.test.ts`: title/description humanos
  (não "Borogodó" isolado); openGraph com image placeholder.

**Checkpoint**: `curl` da página traz todo o texto; JSON-LD válido; llms.txt e robots servidos.

---

## Phase 5: User Story 3 — Cético confia (P2)

**Goal**: Provas, propriedade do dado, manifesto, prova social honesta, FAQ.

- [ ] T022 [P] [US3] Teste (RED) `__tests__/ProofSection.test.tsx`: nomeia Provas; tem MediaSlot
  (aspect 4/3); fala de evidência e de "pergunta quando falta prova".
- [ ] T023 [P] [US3] Teste (RED) `__tests__/OwnershipSection.test.tsx`: "seu, não da sua
  empresa" + 4 sinais de privacidade.
- [ ] T024 [P] [US3] Teste (RED) `__tests__/FaqSection.test.tsx`: renderiza todas as perguntas
  de `faqData.ts`.
- [ ] T025 [US3] Implementar `ProofSection.tsx` (GREEN) com `MediaSlot` 4/3.
- [ ] T026 [P] [US3] Implementar `OwnershipSection.tsx` (GREEN) com sinais de privacidade.
- [ ] T027 [P] [US3] Implementar `ManifestoSection.tsx` (GREEN).
- [ ] T028 [P] [US3] Implementar `SocialProofSection.tsx` (GREEN) com link "ver os bastidores".
- [ ] T029 [US3] Implementar `FaqSection.tsx` (GREEN) a partir de `faqData.ts`.
- [ ] T030 [US3] Inserir as seções 4–8 em `src/app/[locale]/page.tsx` na ordem correta.

**Checkpoint**: página responde as objeções; FAQ visível bate com o FAQPage.

---

## Phase 6: User Story 4 — Narrativa dos 4 verbos (P2)

**Goal**: jornada Descobrir→Entender→Provar→Usar, sem promessa fora do v1.

- [ ] T031 [P] [US4] Teste (RED) `__tests__/JourneySection.test.tsx`: 4 verbos na ordem; sem
  "currículo"/"portfólio".
- [ ] T032 [P] [US4] Teste (RED) `__tests__/PainPointsSection.test.tsx`: 4 dores na voz nova.
- [ ] T033 [US4] Implementar `JourneySection.tsx` (GREEN) como jornada (não grid genérico).
- [ ] T034 [P] [US4] Reescrever `PainPointsSection.tsx` (GREEN) com as 4 dores.
- [ ] T035 [US4] Inserir `JourneySection` e `PainPointsSection` na composição da página.

**Checkpoint**: narrativa completa dos 4 verbos presente.

---

## Phase 7: User Story 5 — Slots de mídia real com placeholder (P3)

**Goal**: garantir os 2 slots (hero, Provas) trocáveis sem retrabalho; mapa de carreira fora.

- [ ] T036 [P] [US5] Teste (RED→GREEN) garantir que `HeroDemo` e `ProofSection` usam `MediaSlot`
  em `kind: 'placeholder'` e que trocar para um arquivo de exemplo não muda o layout (SC-008).
- [ ] T037 [US5] Confirmar remoção do mapa de carreira e ausência de qualquer mockup fake
  remanescente; placeholders de qualidade nos dois slots (fallback estático no hero).

---

## Phase 8: Polish & cross-cutting

- [ ] T038 [P] Acessibilidade: hierarquia h1→h2→h3 sem pulo, foco visível, alvos ≥48px,
  contraste AA em todas as seções.
- [ ] T039 [P] Revisão mobile em 375px e 360px (demo visível, sem overflow).
- [ ] T040 [P] Revisão de voz (SC-007): zero travessão, zero "não é X, é Y", zero lista de três;
  sem promessa fora do v1 (SC-006).
- [ ] T041 Cobertura ≥80% (`npm run test`), `npm run lint`, `npx tsc --noEmit` limpos.
- [ ] T042 `/impeccable audit` + `web-design-guidelines` antes do PR.

---

## Dependencies & ordem

- Phase 1 → Phase 2 (foundational) → US1 (MVP) → US2 → US3 → US4 → US5 → Polish.
- US1 e US2 são P1: o lançamento mínimo precisa das duas.
- MediaSlot (T007) bloqueia T012 (hero demo) e T025 (Provas).
- `faqData.ts` (T002) bloqueia T017 (StructuredData) e T029 (FaqSection).
- i18n (T004/T005) bloqueia todas as seções.

## Paralelização (exemplos)

- T002 e T003 em paralelo (arquivos distintos).
- Os testes RED de cada fase ([P]) em paralelo.
- Na US3, T026/T027/T028 em paralelo (componentes distintos).

## MVP

US1 + US2 (P1). Entrega uma LP que converte e é descoberta por busca/IA, mesmo antes das
seções de confiança e da narrativa completa.
