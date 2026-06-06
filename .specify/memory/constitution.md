<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
  - IV. Server-First Performance → added CSS-first animation rule
  - VII. Borogodó Design Identity → expanded with creative direction doctrine
Added sections:
  - VIII. Mobile-First Architecture (new principle)
  - IX. Internationalisation (i18n) Architecture (new principle)
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (Constitution Check section present; content aligned)
  - .specify/templates/spec-template.md ✅ (aligned with new mobile-first and i18n requirements)
  - .specify/templates/tasks-template.md ✅ (aligned with phased delivery; i18n setup belongs in Phase 1 Foundational)
Deferred items: None.
-->

# Borogodó Constitution

## Core Principles

### I. Security First (NON-NEGOTIABLE)

Every feature, endpoint, and data access path MUST enforce security at all layers:

- Secrets MUST never appear in source code and MUST never use the `NEXT_PUBLIC_` prefix
- User data (career entries, history, generated content) MUST NOT be logged at any level
- Internal database IDs MUST NOT be exposed in API responses
- All user inputs MUST be validated and sanitized before any LLM call
- Every Supabase query MUST filter by `user_id = auth.uid()` via Row Level Security
- Authentication MUST be verified before any other logic in every API endpoint
- AI context windows MUST NEVER include data belonging to other users

### II. TypeScript Strict & Code Quality

All code in this repository MUST meet these non-negotiable standards:

- TypeScript strict mode is mandatory; `any` is forbidden without documented exception
- Code identifiers MUST use English; all UI-facing strings MUST use Portuguese (via i18n keys)
- One React component per file, named identically to the file
- Functions MUST NOT exceed 40 lines; extract helpers when they grow
- Errors MUST be handled explicitly; empty `.catch(() => {})` blocks are forbidden
- React Server Components are the default; `"use client"` is used only when unavoidable
- Files MUST NOT exceed 800 lines; extract modules when they grow

### III. AI-First Architecture

The AI layer is the product core and MUST be treated with dedicated discipline:

- `claude-haiku-4-5` MUST be used for all extraction and structuring operations
- `claude-sonnet-4-6` MUST be used for mirror (espelho) and content generation
- All LLM output MUST be validated before being persisted to the database
- Structuring results MUST be cached to avoid redundant, billable LLM calls
- AI context windows MUST NEVER include data belonging to other users
- All Anthropic API wrappers MUST live under `src/lib/ai/`

### IV. Server-First & Performance

Render as close to the data as possible; ship the minimum JavaScript to the client:

- React Server Components MUST be the default for all new components
- `"use client"` is permitted only when browser APIs or interactivity are strictly required
- Heavy components MUST be lazy-loaded using `React.lazy` / `next/dynamic`
- All images MUST use `next/image`; bare `<img>` tags are forbidden
- Micro-interactions and hover states MUST use CSS transitions/animations;
  Framer Motion is reserved for entrance animations and transitions that CSS cannot achieve
- No JavaScript animation MUST block the main thread on mid-range devices

### V. Accessibility & WCAG AA Compliance

Borogodó serves real professionals. Inaccessible features are incomplete features:

- Every interactive element MUST have an accessible label
- Heading hierarchy MUST be semantically correct (h1 → h2 → h3, in order, no skips)
- Color contrast MUST meet WCAG AA minimum ratios at all times
- All interactive elements MUST display a visible focus indicator
- All interactive elements MUST have a touch target of at least 48×48 px on mobile

### VI. Test-First Development (TDD)

Tests are written before implementation — this is not negotiable:

- Tests MUST be authored and confirmed to FAIL before any implementation begins
- Unit, integration, and critical E2E tests are all required for every feature
- Minimum test coverage is 80%; no PR falls below this threshold
- Tests target observable behavior, never internal implementation details
- Test tooling: Vitest + Testing Library

### VII. Borogodó Design Identity

The product is Brazilian, spirited, and warm. It MUST NEVER feel corporate or like a
generic AI SaaS product:

- The design token system in `src/app/globals.css` MUST be used for all colors;
  raw hex codes in component files are forbidden
- Tokens: `--color-primary` (roxo-jambo), `--color-accent` (coral-faísca),
  `--color-warm` (mel), `--color-teal` (verde-água), `background` (creme)
- **Typography**: Fraunces (display serif) for headings — with deliberate use of italics
  and weight variation for emphasis; Inter or Geist Sans for body copy.
  A single typeface across the entire product is forbidden.
- **Visual rhythm**: pages change chromatic tone as the user scrolls; each section has its
  own temperature using the token system. White space is a design element, not absence.
- **Visual language**: clean asymmetric grids, slightly rounded corners on product mockups,
  a tech-forward but humanly sensitive aesthetic. Perfect symmetry and rigid alignment are
  to be avoided.
- Forbidden anti-patterns: generic purple-blue gradients, Inter as the only typeface,
  nested cards, dark backgrounds with neon text, any layout that resembles a 2022 SaaS template
- `/impeccable shape` MUST run before implementing any new screen or component
- `/impeccable audit` MUST run before any frontend PR is opened

### VIII. Mobile-First Architecture (NON-NEGOTIABLE)

The majority of Borogodó's traffic arrives on mobile. The interface is designed from mobile
outward — not adapted downward from desktop:

- All Tailwind CSS styling MUST be written mobile-first: base (unprefixed) utilities apply to
  mobile; `md:` and `lg:` breakpoints are used ONLY to expand or adjust for larger screens.
  This order MUST NEVER be inverted.
- Every interactive element (button, link, input, icon-button) MUST have a touch target of
  at least 48×48 px on mobile — enforced at the component level, not just visually.
- Micro-interactions MUST use CSS transitions; Framer Motion is permitted only for entrance
  animations or genuinely complex sequence-based transitions. See Principle IV.
- All new components MUST be reviewed on a 375 px viewport before being considered complete.

### IX. Internationalisation (i18n) Architecture

The product launches in Brazil but MUST be structurally ready for global expansion:

- Hardcoded UI strings inside React components are STRICTLY FORBIDDEN — with no exceptions.
- The i18n library is `next-intl`, configured for Next.js App Router with native Server
  Component support.
- All UI text MUST live in `src/messages/pt-BR.json` (the authoritative source).
  `src/messages/en.json` MUST exist as a stub, structurally mirroring pt-BR, ready to be
  translated.
- `pt-BR` is the global fallback locale; it is configured in `src/i18n/routing.ts`.
- Translation keys MUST be in English camelCase, namespaced by feature/section
  (e.g., `hero.headline`, `waitlist.cta`, `personas.ana.tagline`).
- In Client Components: `useTranslations('namespace')` hook.
  In Server Components: `await getTranslations('namespace')` function.
- The i18n infrastructure MUST be established in the Foundational phase of any feature
  that introduces new UI text — never retrofitted after implementation.

## Technology Stack & Architecture

**Runtime**: Next.js 15 with App Router; Server Components by default

**Language**: TypeScript (strict mode)

**Styling**: Tailwind CSS + shadcn/ui; design tokens from `src/app/globals.css`

**Database**: Supabase — PostgreSQL with Row Level Security, Auth, and Storage

**Product core** (three pillars):
- **Espelho** — finds patterns in what the user did; reveals strengths and gaps with evidence
- **Career map** — visual career history, skills clustering, professional profile by specialisation
- **Content generation** — turns that history into content (posts, bio, narratives) in the user's voice

**AI**: Anthropic API — `claude-haiku-4-5` for extraction/structuring,
`claude-sonnet-4-6` for mirror, career-map analysis, and content generation

**i18n**: `next-intl` — locale files in `src/messages/`, routing in `src/i18n/`

**Animations**: Framer Motion (entrance/complex only); CSS transitions for micro-interactions

**Icons**: Lucide React

**Testing**: Vitest + Testing Library

**Folder conventions**:

```
src/
  app/              ← Next.js App Router pages and layouts
  components/
    ui/             ← base components (no business logic)
    features/       ← feature-scoped components
  i18n/             ← next-intl config (routing.ts, request.ts)
  messages/         ← translation files (pt-BR.json, en.json stub)
  lib/
    ai/             ← Anthropic API wrappers
    db/             ← Supabase client and typed queries
    utils.ts        ← cn() and shared utilities
  hooks/            ← custom React hooks
  types/            ← global TypeScript types
```

## Feature Development Workflow

Every feature MUST follow this ordered process before any code is committed:

1. `/speckit-specify` — describe the what and why in plain language
2. `/speckit-clarify` — close all ambiguities in the spec
3. `/speckit-plan` — produce the technical architecture and data model
4. `/speckit-tasks` — break work down into dependency-ordered tasks
5. `/impeccable shape` — plan the UX before a single line of UI is written
6. `/speckit-implement` — execute the task list
7. `/impeccable audit` — design review before the PR is opened

No step may be skipped. Skipping requires explicit justification documented
inside the feature spec.

## Governance

This constitution supersedes all other guidelines, READMEs, and verbal agreements.

Amendments MUST update the version field according to semantic versioning:

- **MAJOR**: Backward-incompatible removal or redefinition of an existing principle
- **MINOR**: New principle or section added, or materially expanded guidance
- **PATCH**: Clarifications, wording refinements, or typo fixes

All PRs that touch security, AI integration, or data access paths MUST verify
compliance with Principles I, III, and IV before merge.

All PRs that introduce new UI components MUST verify compliance with Principles
V, VII, VIII, and IX before merge.

The `CLAUDE.md` file is the authoritative runtime guidance for the AI coding agent
and MUST remain consistent with this constitution. Where they diverge, this
constitution takes precedence.

**Version**: 1.1.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-06
