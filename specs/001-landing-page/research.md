# Research: Landing Page Borogodó

**Phase 0 output** | Branch: `001-landing-page` | Date: 2026-06-06

## 1. next-intl Routing Strategy

**Decision**: Use next-intl with `localePrefix: 'never'` — no locale segment in URLs.

**Rationale**: The product launches in Brazil (pt-BR only). English is a structural stub, not
a live locale. Path-based routing (`/pt-br/`, `/en/`) adds URL noise without user benefit.
With `localePrefix: 'never'`, the LP lives at `/`, sign-up at `/sign-up`, etc. When English
is actually translated, the config can switch to `localePrefix: 'as-needed'` without changing
component code.

**Setup pattern** (next-intl v3+ App Router):
```
src/middleware.ts          ← createMiddleware({ locales, defaultLocale, localePrefix })
src/i18n/routing.ts        ← defineRouting({ locales: ['pt-BR', 'en'], defaultLocale: 'pt-BR', localePrefix: 'never' })
src/i18n/request.ts        ← getRequestConfig — loads messages from src/messages/{locale}.json
src/app/layout.tsx         ← root shell, no i18n logic
src/app/[locale]/layout.tsx ← NextIntlClientProvider (only needed if client components use translations)
```

In Server Components: `const t = await getTranslations('namespace')`.
In Client Components: `const t = useTranslations('namespace')`.

**Alternatives considered**:
- `localePrefix: 'always'` — rejected: ugly `/pt-BR/` URL for Brazilian users
- `localePrefix: 'as-needed'` — rejected: adds hidden redirect logic before we have a second real locale
- Single locale without next-intl — rejected: violates Constitution IX; would require retroactive i18n retrofit

---

## 2. Fraunces Font Loading

**Decision**: Load via `next/font/google` with `variable` option; combine with existing Geist Sans.

**Rationale**: `next/font` provides automatic subsetting, preloading, and zero layout shift.
Fraunces is a variable font with optical size and weight axes — loading it as a CSS variable
lets Tailwind and global CSS both access it without redundant `font-family` declarations.

**Pattern**:
```tsx
// src/app/layout.tsx
import { Fraunces, Geist } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz'],   // optical size axis for heading vs display variants
  display: 'swap',
})
```

The CSS variable `--font-display` is already defined in `globals.css` — this just wires it
to the actual font. `display: 'swap'` prevents invisible text during load.

**Alternatives considered**:
- CSS `@import` from Google Fonts — rejected: no subsetting, flash of unstyled text, blocks rendering
- Self-hosting with `@font-face` — viable but unnecessary overhead when `next/font` achieves the same result with less config

---

## 3. Framer Motion Entrance Animations + prefers-reduced-motion

**Decision**: Create a single `AnimatedSection` client component that reads `useReducedMotion()`
from Framer Motion and conditionally applies `initial`/`animate` variants.

**Rationale**: Centralises the reduced-motion logic in one place. Section components remain
Server Components and simply wrap their content in `<AnimatedSection>`. When
`prefers-reduced-motion: reduce` is active, `useReducedMotion()` returns `true` and the
component skips motion props entirely — content appears without transition (FR-021).

**Pattern**:
```tsx
// src/components/ui/AnimatedSection.tsx
'use client'
import { motion, useReducedMotion } from 'framer-motion'

const variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function AnimatedSection({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  if (reduced) return <>{children}</>
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
```

`viewport={{ once: true }}` prevents re-triggering on scroll-back, avoiding jank.

**Alternatives considered**:
- CSS `@media (prefers-reduced-motion)` only — rejected: Framer Motion's JS animations bypass CSS media queries
- Per-component `useReducedMotion()` calls — rejected: duplicates logic across every animated section

---

## 4. Vitest + Testing Library Setup for Next.js App Router

**Decision**: Use Vitest with `@vitejs/plugin-react` and jsdom environment; mock next-intl
and Next.js navigation in test setup.

**Rationale**: Vitest integrates naturally with the project's build setup. Testing Library
`render` + `screen` + `userEvent` covers component-level assertions. Server Components are
tested as plain async functions (Vitest supports `async` test components natively since
Testing Library 15+).

**Required packages**:
```
vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
@testing-library/jest-dom jsdom
```

**Config** (`vitest.config.ts`):
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

**Setup file** (`src/test/setup.ts`):
```ts
import '@testing-library/jest-dom'
// Mock next-intl useTranslations to return key as value
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))
// Mock Next.js Link
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))
```

**Alternatives considered**:
- Jest — rejected: requires additional transform config for App Router; Vitest aligns better with the Vite-based toolchain
- No unit tests on server components — rejected: violates Constitution VI

---

## 5. Static Mockup Strategy

**Decision**: All visual mockups (Espelho, Mapa de carreira, post comparison) are pure JSX
components with fixture data defined as constants in their respective component files.
No props drilling from the page — the mockup *is* the static content.

**Rationale**: The spec explicitly states "conteúdo estático e fictício, mas verossímil".
Keeping fixture data inside the component file makes it easy to update copy without touching
the page assembly. The data is not i18n-translated because it is representative UI content,
not product copy — this is consistent with the spec assumption about mockup content.

**Exception**: Any text that appears as a label, heading, or body copy *outside* the mockup
frame must be in pt-BR.json. The mockup *content inside the frame* may contain hardcoded
Portuguese since it represents fake product data, not product UI strings.

**Alternatives considered**:
- Props from page → i18n keys for mockup content — rejected: over-engineering for static illustrative content
- SVG illustrations — rejected: harder to update, loses the "product preview" feel the spec requires
