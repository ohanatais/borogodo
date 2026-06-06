# Implementation Plan: Landing Page Borogodó

**Branch**: `001-landing-page` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-landing-page/spec.md`

## Summary

Static marketing landing page with 8 scroll sections (Hero → CTA final), built entirely on
Next.js App Router Server Components. No backend logic — the two CTA buttons are `<Link>`
components to `/sign-up` and `/sign-in` (future features). The foundational i18n layer
(next-intl) and test tooling (Vitest + Testing Library) must be bootstrapped as part of this
feature before any component with visible text is written.

## Technical Context

**Language/Version**: TypeScript 5 strict / Next.js 16.2.7 (App Router)

**Primary Dependencies**:
- React 19, Tailwind CSS v4 (installed)
- Framer Motion 12.40 — entrance animations only (installed)
- Lucide React 1.17 — icons (installed)
- shadcn/ui radix primitives (installed)
- **next-intl** — i18n (NOT YET INSTALLED — foundational dependency)
- **Vitest + @testing-library/react + jsdom** — unit tests (NOT YET INSTALLED)
- **Playwright** — E2E critical flows (NOT YET INSTALLED)

**Storage**: N/A — purely static page; no database interaction

**Testing**: Vitest + Testing Library (unit/integration); Playwright (E2E)

**Target Platform**: Web — mobile-first at 375px minimum viewport

**Project Type**: Web application — Next.js marketing landing page

**Performance Goals**: LCP < 3 s on 4G mobile (SC-003); no JS animation jank on mid-range devices

**Constraints**:
- Zero hardcoded UI strings (all via next-intl keys)
- No stock imagery — illustrations, mockups, or typographic compositions only
- CSS-only micro-interactions; Framer Motion reserved for section entrance animations
- `prefers-reduced-motion` must disable all Framer Motion animations (FR-021)
- 48×48 px minimum touch targets on all interactive elements (FR-014)
- Mobile-first Tailwind: base utilities for 375px; `md:` and `lg:` for expansion only

**Scale/Scope**: 8 page sections, ~18 UI components, 1 route (`/`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ PASS | No user data, no secrets, no auth logic. CTAs are `<Link>` to future routes. |
| II. TypeScript Strict | ✅ PASS | Strict mode already configured in tsconfig. 40-line limit and one component per file enforced in implementation. |
| III. AI-First Architecture | ✅ N/A | No LLM calls in this feature. |
| IV. Server-First & Performance | ✅ PASS | All sections are RSCs. Only `AnimatedSection` wrapper uses `"use client"` for viewport detection — minimum necessary. CSS for all hover/micro-interactions. |
| V. Accessibility | ✅ PASS | Heading hierarchy h1→h2→h3 enforced. WCAG AA via design tokens. 48px touch targets required. |
| VI. TDD | ✅ PASS | Tests written before implementation. Unit tests for all section components; E2E for CTA navigation flow. |
| VII. Design Identity | ✅ PASS | Fraunces (display) + Geist Sans (body), design tokens only, no dark backgrounds, no SaaS template patterns. |
| VIII. Mobile-First | ✅ PASS | All Tailwind base utilities target 375px; breakpoints expand upward. |
| IX. i18n Architecture | ⚠️ CONDITIONAL | next-intl not yet installed. **Must be bootstrapped in the Foundational phase before any component with visible text.** `src/messages/pt-BR.json` + `src/messages/en.json` (stub) must exist before components are written. |

**Gate result**: PASS WITH CONDITION — next-intl, Vitest, and Playwright must be installed
and configured before landing page components are written. This is captured as the Foundational
phase in tasks.md.

*Post-Phase-1 re-check*: All gates still pass. The `[locale]` routing structure cleanly
isolates the i18n concern without adding complexity to the page components.

## Project Structure

### Documentation (this feature)

```text
specs/001-landing-page/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-contracts.md  ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── middleware.ts                          ← next-intl routing middleware
├── i18n/
│   ├── routing.ts                         ← locale definitions (pt-BR default, en stub)
│   └── request.ts                         ← server-side getRequestConfig
├── messages/
│   ├── pt-BR.json                         ← authoritative translations (all LP keys)
│   └── en.json                            ← structural stub (empty string values)
├── app/
│   ├── layout.tsx                         ← root HTML shell (lang attr + font CSS vars)
│   └── [locale]/
│       ├── layout.tsx                     ← NextIntlClientProvider + page metadata
│       └── page.tsx                       ← Landing page — composes all 8 sections
├── components/
│   ├── ui/
│   │   └── AnimatedSection.tsx            ← "use client" Framer Motion viewport wrapper
│   └── features/
│       └── landing/
│           ├── HeroSection.tsx
│           ├── PainPointsSection.tsx
│           ├── HowItWorksSection.tsx
│           ├── MirrorMockup.tsx
│           ├── CareerMapMockup.tsx
│           ├── ContentGenSection.tsx
│           └── CtaSection.tsx
└── types/
    └── landing.ts                         ← TypeScript interfaces for component props

Tests co-located with components:
src/components/features/landing/__tests__/
├── HeroSection.test.tsx
├── PainPointsSection.test.tsx
├── HowItWorksSection.test.tsx
└── CtaSection.test.tsx

e2e/
└── landing.spec.ts                        ← Playwright — CTA navigation + scroll flow
```

**Structure Decision**: Single Next.js App Router project using the `[locale]` dynamic segment
pattern for next-intl (locale prefix is suppressed in URLs via `localePrefix: 'never'`).
The root `layout.tsx` stays minimal (HTML lang attribute + font CSS variables); the
`[locale]/layout.tsx` handles the i18n provider and page metadata. All section components
are Server Components; `AnimatedSection` is the only `"use client"` component, wrapping
sections that need viewport-triggered Framer Motion entrance animations.

## Complexity Tracking

> No constitution violations requiring justification. The single `"use client"` boundary
> for `AnimatedSection` is the minimum required by spec FR-015 and Constitution IV
> (entrance animations need browser IntersectionObserver). No over-engineering present.
