# UI Contracts: Landing Page Borogodó

**Phase 1 output** | Branch: `001-landing-page` | Date: 2026-06-06

The landing page has no external API. Its contracts are: the route it occupies, the
navigation targets it references, and the i18n key namespaces it owns.

---

## 1. Route Contract

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `src/app/[locale]/page.tsx` | Landing page — all 8 sections |

With `localePrefix: 'never'`, the `[locale]` segment is handled transparently by
next-intl middleware. Users always see `/`, never `/pt-BR/`.

---

## 2. Navigation Contract (outbound links)

The landing page links to two routes that **do not exist yet** and will be implemented
in subsequent features. These are treated as forward declarations.

| CTA | `href` | Description |
|-----|--------|-------------|
| "Criar conta" (primary) | `/sign-up` | Sign-up flow — future feature |
| "Já tenho conta" (secondary) | `/sign-in` | Sign-in flow — future feature |

**Constraint**: Both routes must render a valid page eventually. Until they exist,
clicking the CTA will produce a Next.js 404. This is acceptable for the LP milestone.

**Session redirect contract** (from spec Assumptions): If the user already has an active
session, the CTA should redirect to `/app` (the authenticated dashboard). This logic belongs
in the parent layout (`[locale]/layout.tsx`) via a server-side auth check — not in the
landing page component itself. The LP renders the CTA buttons unconditionally; redirect
behaviour is injected by the layout.

---

## 3. i18n Namespace Contract

The landing page **owns** the following top-level namespaces in the message files.
No other feature may reuse these namespaces; shared strings must be factored into a
`common.*` namespace.

| Namespace | Owner component | Notes |
|-----------|----------------|-------|
| `hero` | `HeroSection` | Headline, subheadline, CTAs |
| `painPoints` | `PainPointsSection` | Section title + 4 items |
| `howItWorks` | `HowItWorksSection` | Section title + 3 steps |
| `mirror` | `MirrorMockup` | Section labels only (fixture content not translated) |
| `careerMap` | `CareerMapMockup` | Section labels only (fixture content not translated) |
| `contentGen` | `ContentGenSection` | Section labels + post comparison labels |
| `cta` | `CtaSection` | Final CTA section |
| `metadata` | `[locale]/layout.tsx` | Page `<title>` and meta description |

**Key format**: `namespace.camelCaseKey` — e.g. `hero.ctaPrimary`, `personas.ana.role`.

---

## 4. Component Interface Contract

Each section component follows this interface contract:

```typescript
// Server Components — receive no props; read translations internally
async function HeroSection(): Promise<JSX.Element>
async function PainPointsSection(): Promise<JSX.Element>
async function HowItWorksSection(): Promise<JSX.Element>
async function MirrorMockup(): Promise<JSX.Element>
async function CareerMapMockup(): Promise<JSX.Element>
async function ContentGenSection(): Promise<JSX.Element>
async function CtaSection(): Promise<JSX.Element>

// Client Component — wraps any section in a Framer Motion viewport animation
function AnimatedSection({ children }: { children: React.ReactNode }): JSX.Element
```

**Constraint**: No section component accepts data props from the page. Each component
owns its own i18n calls and its own fixture data. The page (`page.tsx`) only composes them:

```tsx
// src/app/[locale]/page.tsx — shape only
export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <AnimatedSection><PainPointsSection /></AnimatedSection>
      <AnimatedSection><HowItWorksSection /></AnimatedSection>
      <AnimatedSection><MirrorMockup /></AnimatedSection>
      <AnimatedSection><CareerMapMockup /></AnimatedSection>
      <AnimatedSection><ContentGenSection /></AnimatedSection>
      <CtaSection />
    </main>
  )
}
```

`HeroSection` and `CtaSection` are not wrapped in `AnimatedSection` — the hero is
above the fold (no entrance animation needed), and the CTA final requires immediate
visibility without delay.
