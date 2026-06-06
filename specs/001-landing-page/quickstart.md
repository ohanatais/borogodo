# Quickstart: Landing Page Borogodó

**Phase 1 output** | Branch: `001-landing-page` | Date: 2026-06-06

Validation guide for the landing page feature. Proves the feature works end-to-end without
duplicating implementation details (see `tasks.md` for those).

---

## Prerequisites

1. Node.js 20+ installed
2. Branch `001-landing-page` checked out
3. All dependencies installed (see Setup below)

---

## Setup

```bash
cd /Users/ohanatais/Documents/borogodo

# Install new dependencies (next-intl + test tooling)
npm install next-intl
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/user-event @testing-library/jest-dom jsdom \
  @playwright/test
```

Verify the install:
```bash
npx next --version      # should show 16.x
npx vitest --version    # should show 3.x+
```

---

## Running the Dev Server

```bash
npm run dev
# → http://localhost:3000
```

---

## Section-by-Section Validation

Open `http://localhost:3000` and visually confirm each section in order:

| # | Section | What to verify |
|---|---------|----------------|
| 1 | Hero | Headline visible above the fold on 375px viewport; "Criar conta" button present |
| 2 | As quatro dores | 4 pain point cards; no bullet points; colloquial Portuguese |
| 3 | Como funciona | Exactly 3 steps, user-focused language (not "the AI does X") |
| 4 | O espelho | Mockup card shows pattern + evidence + insight (not a generic skills list) |
| 5 | Mapa de carreira | Asymmetric grid with skill clusters; profile label visible |
| 6 | Geração de conteúdo | Side-by-side comparison; real post visibly different from generic |
| 7 | CTA final | "Criar conta" primary; "Já tenho conta" link; no form fields |

---

## CTA Navigation Validation

1. Click "Criar conta" → browser navigates to `/sign-up` (404 expected until auth feature lands)
2. Click "Já tenho conta" → browser navigates to `/sign-in` (404 expected)
3. Confirm no intermediate redirect or modal appears

---

## Mobile Validation

In Chrome DevTools, set viewport to **375×812** (iPhone SE):

- [ ] All 8 sections render without horizontal overflow
- [ ] CTA buttons have visible tap area (≥ 48px height)
- [ ] Fraunces headings render (no missing font fallback)
- [ ] No text truncation in persona cards
- [ ] Hero CTA is visible without scrolling

---

## Reduced Motion Validation

In Chrome DevTools → Rendering → Emulate CSS media feature → `prefers-reduced-motion: reduce`:

- [ ] Page loads with all sections fully visible (no fade-in animations)
- [ ] Scrolling the page produces no motion effects
- [ ] Content is immediately readable without waiting for animations

---

## Running Unit Tests

```bash
npm run test
# or
npx vitest run
```

Expected: all component tests pass (see `src/components/features/landing/__tests__/`).

Key assertions per component:
- **HeroSection**: renders headline, renders both CTA buttons with correct `href`
- **PainPointsSection**: renders exactly 4 pain point items
- **HowItWorksSection**: renders exactly 3 steps
- **CtaSection**: "Criar conta" links to `/sign-up`; "Já tenho conta" links to `/sign-in`

Coverage check:
```bash
npx vitest run --coverage
# Target: ≥ 80% for files under src/components/features/landing/
```

---

## Running E2E Tests

```bash
npx playwright test e2e/landing.spec.ts
```

Expected scenarios:
1. LP loads at `/` and shows hero
2. Scrolling to bottom reveals CTA section
3. Clicking "Criar conta" navigates to `/sign-up`

---

## Performance Check

In Chrome DevTools → Lighthouse → Mobile, run against `http://localhost:3000`:

- [ ] LCP < 3 s (SC-003)
- [ ] No layout shift from fonts (Fraunces loaded via `next/font`)
- [ ] Performance score ≥ 85 on mobile preset

---

## i18n Structural Validation

Verify no hardcoded Portuguese strings exist in component files:
```bash
# Should return 0 results (fixture data in MirrorMockup, CareerMapMockup,
# ContentGenSection is the only allowed exception — check those manually)
grep -rn '"[A-ZÀ-Ü]' src/components/features/landing/ \
  --include="*.tsx" \
  | grep -v "fixture\|Fixture\|__tests__"
```

Verify `en.json` mirrors `pt-BR.json` structure:
```bash
node -e "
  const ptBR = require('./src/messages/pt-BR.json')
  const en = require('./src/messages/en.json')
  const keys = (obj, prefix='') => Object.entries(obj).flatMap(([k,v]) =>
    typeof v === 'object' ? keys(v, prefix+k+'.') : [prefix+k])
  const missing = keys(ptBR).filter(k => !keys(en).includes(k))
  if (missing.length) { console.error('Missing en.json keys:', missing); process.exit(1) }
  else console.log('en.json structure OK')
"
```
