# Tasks: Landing Page Borogodó

**Input**: Design documents from `specs/001-landing-page/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ui-contracts.md ✅ · quickstart.md ✅

**Tests**: Included — Constitution Principle VI mandates TDD. Tests are written before implementation and must FAIL before the corresponding component is built.

**Code review**: `/code-review low` at the end of each user story phase (small diff, high-confidence findings only); `/code-review high` once in Phase 7 before the PR (full diff, thorough pass). No `ultra` — a v1 LP has no auth, no AI, no DB.

**Organization**: Tasks grouped by user story to enable independent implementation and delivery of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task serves (US1–US4 from spec.md)

---

## Phase 1: Setup

**Purpose**: Install missing packages and configure test infrastructure. No component work begins here.

- [ ] T001 Install next-intl, vitest, @vitejs/plugin-react, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, @playwright/test via npm
- [ ] T002 Update `next.config.ts` to wrap config with `createNextIntlPlugin()` from next-intl
- [ ] T003 [P] Create `vitest.config.ts` at repo root (jsdom environment, globals: true, setupFiles pointing to src/test/setup.ts)
- [ ] T004 [P] Create `src/test/setup.ts` (import @testing-library/jest-dom; mock `next-intl` useTranslations to return key as value; mock `next/link`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: i18n infrastructure, type definitions, and the single client-boundary component. Nothing in Phase 3+ can be built without these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create `src/i18n/routing.ts` (defineRouting: locales ['pt-BR', 'en'], defaultLocale 'pt-BR', localePrefix 'never')
- [ ] T006 Create `src/i18n/request.ts` (getRequestConfig: loads messages from `src/messages/{locale}.json`)
- [ ] T007 Create `src/middleware.ts` (createMiddleware from next-intl with routing from T005; export config matcher)
- [ ] T008 Create `src/messages/pt-BR.json` with all keys from data-model.md (hero, painPoints, howItWorks, mirror, careerMap, contentGen, cta, metadata namespaces — placeholder "TODO" values for copy-heavy keys, CTAs and aria labels filled now)
- [ ] T009 [P] Create `src/messages/en.json` mirroring pt-BR.json structure with empty-string values for all keys
- [ ] T010 Update `src/app/layout.tsx`: add Fraunces via `next/font/google` (variable: '--font-display', axes: ['opsz'], display: 'swap'); add Geist Sans + Geist Mono; set `lang` to defaultLocale; inject font CSS variables on `<html>`
- [ ] T011 Create `src/app/[locale]/layout.tsx` (NextIntlClientProvider with locale and messages from next-intl/server; page metadata using `metadata.title` and `metadata.description` from pt-BR.json)
- [ ] T012 [P] Create `src/types/landing.ts` with all interfaces from data-model.md (PainPoint, HowItWorksStep, MirrorInsightFixture, CareerSkillCluster, CareerMapFixture, PostComparisonFixture)
- [ ] T013 Create `src/components/ui/AnimatedSection.tsx` ("use client"; Framer Motion `motion.div` with `whileInView` + `viewport={{ once: true }}`; `useReducedMotion()` check returns children unwrapped when true)

**Checkpoint**: `npm run dev` starts without errors; `http://localhost:3000` responds; `npx vitest run` exits 0.

---

## Phase 3: User Story 1 — Ana, a PM com revisão de desempenho em dois meses (Priority: P1) 🎯 MVP

**Goal**: Ana arrives via organic search, the hero headline stops her, she recognises her situation in the pain points section, and clicks "Criar conta" with zero friction.

**Independent Test**: Open LP at 375px viewport — headline visible above fold; 4 pain point items visible on scroll; clicking "Criar conta" navigates to `/sign-up`; clicking "Já tenho conta" navigates to `/sign-in`.

### Tests — write first, verify they FAIL before T019–T022

- [ ] T014 [P] [US1] Write `src/components/features/landing/__tests__/HeroSection.test.tsx`: asserts headline text renders; "Criar conta" button has `href="/sign-up"`; "Já tenho conta" link has `href="/sign-in"`; both interactive elements have accessible label
- [ ] T015 [P] [US1] Write `src/components/features/landing/__tests__/PainPointsSection.test.tsx`: asserts exactly 4 pain point items render; no `<ul>/<li>` bullet structure
- [ ] T016 [P] [US1] Write `src/components/features/landing/__tests__/CtaSection.test.tsx`: "Criar conta" `href="/sign-up"`; "Já tenho conta" `href="/sign-in"`; no `<input>` or `<form>` elements in the section

### Implementation

- [ ] T017 [US1] Fill `src/messages/pt-BR.json` hero.* and painPoints.* keys with real Portuguese copy (headline attacks the pain, not the product; 4 concrete recognisable situations in colloquial language)
- [ ] T018 [US1] Fill `src/messages/pt-BR.json` cta.* keys with real Portuguese copy ("Criar conta" primary, "Já tenho conta" secondary, aria labels)
- [ ] T019 [US1] Create `src/components/features/landing/HeroSection.tsx` (Server Component; Fraunces h1 headline; subheadline in Geist Sans; "Criar conta" as primary `<Link>` + "Já tenho conta" as secondary `<Link>`; both with min 48px touch target; mobile-first layout)
- [ ] T020 [US1] Create `src/components/features/landing/PainPointsSection.tsx` (Server Component; 4 pain point items from i18n; card-style layout, no bullet points; each card has headline + description; chromatic bg token distinct from hero)
- [ ] T021 [US1] Create `src/components/features/landing/CtaSection.tsx` (Server Component; "Criar conta" as prominent `<Link>` to `/sign-up`; "Já tenho conta" as lighter `<Link>` to `/sign-in`; no inputs or forms; bg token distinct from adjacent section)
- [ ] T022 [US1] Create `src/app/[locale]/page.tsx` composing HeroSection + `<AnimatedSection><PainPointsSection /></AnimatedSection>` + CtaSection

**Checkpoint**: US1 flow works end-to-end at 375px. `npx vitest run` → T014–T016 pass.

- [ ] T023 [US1] Run `/code-review low` on the Phase 3 diff — fix all CRITICAL and HIGH findings in HeroSection.tsx, PainPointsSection.tsx, CtaSection.tsx, page.tsx before proceeding

---

## Phase 4: User Story 2 — Bruno, o gerente de vendas que quer postar mas trava (Priority: P2)

**Goal**: Bruno lands on the content generation section, instantly understands the difference between a post from his real history vs a generic AI post, and finds the CTA within two screen-heights.

**Independent Test**: ContentGenSection renders two distinct text blocks; "real" post reads like a first-person story with numbers; "generic" post reads like AI filler; section labels present; CTA reachable without excessive scroll.

### Tests — write first, verify they FAIL before T025

- [ ] T024 [P] [US2] Write `src/components/features/landing/__tests__/ContentGenSection.test.tsx`: asserts both label strings render (`contentGen.realLabel`, `contentGen.genericLabel`); asserts fixture `real` text renders; asserts fixture `generic` text renders; no `<img>` or stock image elements

### Implementation

- [ ] T025 [US2] Create `src/components/features/landing/ContentGenSection.tsx` (Server Component; side-by-side comparison using PostComparisonFixture; section labels from i18n; slightly asymmetric layout — real post card more prominent; distinct bg token)
- [ ] T026 [US2] Update `src/app/[locale]/page.tsx` to insert `<AnimatedSection><ContentGenSection /></AnimatedSection>` before CtaSection

**Checkpoint**: Bruno's section renders. Real post clearly distinct from generic without needing to read the label.

- [ ] T027 [US2] Run `/code-review low` on the Phase 4 diff — fix all CRITICAL and HIGH findings in ContentGenSection.tsx before proceeding

---

## Phase 5: User Story 4 — Rafael, o engenheiro de produto sem clareza da própria identidade (Priority: P2)

**Goal**: Rafael sees "Como funciona" (3 user-focused steps), then the Espelho mockup (evidence-based insight), then the career map (skill clusters + profile label that feels revelatory).

**Independent Test**: HowItWorksSection — exactly 3 steps, user-as-subject language; MirrorMockup — insight card with pattern, evidence list, insight sentence; CareerMapMockup — profile label, skill clusters, timeline visible.

### Tests — write first, verify they FAIL before T031–T033

- [ ] T028 [P] [US4] Write `src/components/features/landing/__tests__/HowItWorksSection.test.tsx`: asserts exactly 3 step items render; step language uses "você" not "o sistema" or "a IA"
- [ ] T029 [P] [US4] Write `src/components/features/landing/__tests__/MirrorMockup.test.tsx`: fixture `pattern` text renders; at least 2 evidence items render; `insight` sentence renders
- [ ] T030 [P] [US4] Write `src/components/features/landing/__tests__/CareerMapMockup.test.tsx`: profile label renders; at least 2 skill clusters render; each cluster has a label; timeline renders at least 2 entries

### Implementation

- [ ] T031 [P] [US4] Fill `src/messages/pt-BR.json` howItWorks.*, mirror.*, careerMap.* keys with real copy (3 steps in second-person; section subtitles)
- [ ] T032 [P] [US4] Create `src/components/features/landing/HowItWorksSection.tsx` (Server Component; 3 steps from i18n; step numbers as visual element; user-focused verbs — "Você registra", "Você recebe", "Você usa"; distinct bg token)
- [ ] T033 [P] [US4] Create `src/components/features/landing/MirrorMockup.tsx` (Server Component; insight card using MirrorInsightFixture constant defined in file; asymmetric rounded card; design token colors only; tech-forward but humanly sensitive aesthetic)
- [ ] T034 [US4] Create `src/components/features/landing/CareerMapMockup.tsx` (Server Component; CareerMapFixture constant in file; profile label chip; skill clusters as slightly irregular grid; timeline; no rigid symmetric layout)
- [ ] T035 [US4] Update `src/app/[locale]/page.tsx` with full section order: HeroSection → PainPointsSection → HowItWorksSection → MirrorMockup → CareerMapMockup → ContentGenSection → CtaSection; all mid-sections in AnimatedSection

**Checkpoint**: Rafael's sections render. Career map feels revelatory. Full 7-section page assembled in correct scroll order.

- [ ] T036 [US4] Run `/code-review low` on the Phase 5 diff — fix all CRITICAL and HIGH findings in HowItWorksSection.tsx, MirrorMockup.tsx, CareerMapMockup.tsx before proceeding

---

## Phase 6: User Story 3 — Clara, a profissional competente mas invisível (Priority: P3)

**Goal**: Complete LP works as a coherent whole; Clara scrolls everything, no urgency, and still converts. Page performance meets the <3 s 4G target (SC-003).

**Independent Test**: Full 375px scroll — all 7 sections visible in order; chromatic rhythm changes between sections; Lighthouse mobile LCP < 3 s; no horizontal overflow; `prefers-reduced-motion: reduce` → all sections appear immediately.

- [ ] T037 [US3] Verify section order in `src/app/[locale]/page.tsx` matches spec exactly (Hero → PainPoints → HowItWorks → Mirror → CareerMap → ContentGen → CTA); fix if out of order
- [ ] T038 [US3] Audit background tokens across all 7 section files — no two adjacent sections share the same bg token; apply `--color-warm`, `--color-teal`, `--color-primary` (at low opacity), and `--background` (creme) in alternating rhythm
- [ ] T039 [US3] Write and pass `src/components/ui/__tests__/AnimatedSection.test.tsx`: when `useReducedMotion` returns true, children render without motion wrapper; when false, motion.div is present
- [ ] T040 [US3] Verify all 7 sections render without horizontal overflow at 375px — fix any overflow in the relevant section component files

**Checkpoint**: Clara's complete flow works. LP cohesive on first scroll. Lighthouse mobile ≥ 85. Reduced motion immediate.

- [ ] T041 [US3] Run `/code-review low` on the Phase 6 diff — fix all CRITICAL and HIGH findings in section files and AnimatedSection.tsx before proceeding

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T042 [P] Fill `src/messages/pt-BR.json` metadata.title and metadata.description with final SEO copy; verify `src/app/[locale]/layout.tsx` exports them as Next.js metadata
- [ ] T043 [P] Verify `src/app/layout.tsx` sets `lang` attribute dynamically from locale param (not hardcoded "en")
- [ ] T044 [P] Audit WCAG AA contrast for all text/bg token combinations across section files — fix any failing combinations in `src/app/globals.css`
- [ ] T045 [P] Add visible `:focus-visible` ring to CTA buttons in `src/components/features/landing/HeroSection.tsx` and `src/components/features/landing/CtaSection.tsx` (ring uses `--ring` token)
- [ ] T046 Run i18n key parity check (node script from quickstart.md): every key in pt-BR.json exists in en.json; fix any missing keys in `src/messages/en.json`
- [ ] T047 Create `e2e/landing.spec.ts` (Playwright): LP loads at `/`; "Criar conta" navigates to `/sign-up`; scroll to bottom reveals CtaSection; all 7 section landmarks present
- [ ] T048 Run `npx playwright test e2e/landing.spec.ts` and fix any failures
- [ ] T049 [P] Run hardcoded-string grep from quickstart.md — verify no Portuguese copy in component files (approved exceptions: fixture constants in MirrorMockup.tsx, CareerMapMockup.tsx, ContentGenSection.tsx)
- [ ] T050 [P] Run `npm run lint` and `npx tsc --noEmit`; fix any TypeScript errors or lint violations across all new files
- [ ] T051 Run `/code-review high` on the full feature diff — fix all CRITICAL and HIGH findings before opening the PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **User Stories (Phases 3–6)**: All require Phase 2 complete
  - Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US4) → Phase 6 (US3) sequentially (single developer)
  - OR: Phase 3 alone is the full MVP
- **Polish (Phase 7)**: Requires Phases 3–6 complete

### User Story Dependencies

| Story | Depends on | Can start after |
|-------|-----------|-----------------|
| US1 (P1) | Phase 2 complete | T013 |
| US2 (P2) | US1 complete (shares page.tsx) | T023 |
| US4 (P2) | Phase 2 complete | T013 (parallel with US2 if desired) |
| US3 (P3) | US1 + US2 + US4 all complete | T036 |

> US2 and US4 are independent of each other — they can be built in parallel. Both must be merged before US3 begins.

### Within Each Phase

1. Tests written → verify FAIL → implement → verify PASS → code review → fix
2. Component created → page.tsx updated → visual verification
3. pt-BR.json copy → component uses keys → verify text renders

---

## Parallel Execution Examples

### Phase 2 Parallel Group

```
Parallel:
  T005 → T006 → T007 (sequential: routing → request → middleware)
  T009 (en.json — no dependencies)
  T012 (types — no dependencies)
Depends on Phase 1:
  T008 (pt-BR.json structure)
  T010 (layout.tsx font update)
  T011 (locale layout)
  T013 (AnimatedSection — needs framer-motion from T001)
```

### Phase 3 Parallel Group (after T013)

```
Parallel (test writing):
  T014 HeroSection.test.tsx
  T015 PainPointsSection.test.tsx
  T016 CtaSection.test.tsx

Sequential (implementation):
  T017 + T018 (fill pt-BR.json copy)
  → T019 HeroSection.tsx
  → T020 PainPointsSection.tsx
  → T021 CtaSection.tsx
  → T022 page.tsx assembly
  → T023 /code-review low → fix
```

### Phase 5 Parallel Group (after Phase 2, parallel with Phase 4)

```
Parallel:
  T028 + T029 + T030 (test writing)
  T031 pt-BR.json copy for howItWorks.*, mirror.*, careerMap.*

Sequential:
  T032 HowItWorksSection.tsx
  T033 MirrorMockup.tsx
  T034 CareerMapMockup.tsx
  T035 page.tsx full assembly
  T036 /code-review low → fix
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1 — Hero + PainPoints + CTA + code review
4. **STOP**: Validate Ana's flow at 375px; CTA navigates to `/sign-up`
5. LP is shippable as a minimal-but-complete entry point

### Full Feature Delivery

1. Setup + Foundational → infrastructure ready
2. US1 (Phase 3) → MVP shippable
3. US2 (Phase 4) → adds content gen section
4. US4 (Phase 5) → adds mirror + career map + how it works
5. US3 (Phase 6) → full assembly, performance, reduced motion
6. Polish (Phase 7) → SEO, a11y, E2E, lint, final high-effort code review → PR

---

## Notes

- `[P]` tasks touch different files with no shared dependency — safe to run simultaneously
- TDD is non-negotiable (Constitution VI): test file written and confirmed FAILING before the component is written
- Code review cadence: `low` per phase (cheap, early catch) + `high` once before PR (thorough, full picture)
- All component copy lives in `src/messages/pt-BR.json`; fixture data lives as constants inside component files
- `src/app/[locale]/page.tsx` is the assembly point — updated incrementally across US1, US2, US4
- Stop at each phase checkpoint to verify the story independently before proceeding
