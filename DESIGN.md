---
name: Borogodó
description: Inteligência de carreira brasileira — o espelho que revela quem você é como profissional.
colors:
  roxo-jambo: "oklch(42% 0.19 320)"
  roxo-jambo-fg: "oklch(98% 0.01 320)"
  coral-faisca: "oklch(62% 0.22 28)"
  coral-faisca-fg: "oklch(98% 0.01 28)"
  mel: "oklch(74% 0.12 75)"
  verde-agua: "oklch(70% 0.10 190)"
  creme: "oklch(98% 0.008 90)"
  tinta: "oklch(18% 0.02 260)"
  lilas-nevoa: "oklch(95% 0.01 320)"
  cinza-mudo: "oklch(52% 0.02 260)"
  borda: "oklch(90% 0.01 260)"
  vermelho-alerta: "oklch(55% 0.22 25)"
typography:
  display:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  display-italic:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "clamp(2.25rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  btn: "8px"
  card: "12px"
  chip: "6px"
  modal: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  2xl: "64px"
  3xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.roxo-jambo}"
    textColor: "{colors.roxo-jambo-fg}"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "oklch(38% 0.19 320)"
    textColor: "{colors.roxo-jambo-fg}"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
    height: "40px"
  button-cta-lp:
    backgroundColor: "{colors.roxo-jambo}"
    textColor: "{colors.roxo-jambo-fg}"
    rounded: "{rounded.pill}"
    padding: "14px 32px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.lilas-nevoa}"
    textColor: "oklch(25% 0.05 320)"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.roxo-jambo}"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
    height: "40px"
---

# Design System: Borogodó

## 1. Overview

**Creative North Star: "O Espelho Brasileiro"**

Borogodó is a mirror, not a dashboard. Every screen is a moment of discovery — warm,
intimate, and honest. The design draws from the quality of late-afternoon light in Brazil:
color that shifts as you move through the page, surfaces that feel organic and inviting,
type that has a voice of its own rather than serving as neutral infrastructure.

The system lives at the intersection of emotional warmth and structural clarity —
**Sofisticação Acolhedora**. Sophisticated enough to inspire professional trust; warm
enough to feel like a safe space to share career truths. Every design decision either
serves *revelation* (helping the user see something they couldn't see before) or
*belonging* (making them feel this product was built for them, not translated from
somewhere else).

The reference is Numera's evolved human-warm direction: bold headline typography that
mixes italic and weight variation within the same line, saturated section backgrounds
that shift chromatic tone as you scroll, human photography integrated naturally into
the layout, and copy that sounds genuinely Brazilian. The Borogodó palette is warmer
and more introspective than Numera's entrepreneurial energy — clarity and discovery
over action and speed — but the boldness, typographic expressiveness, and color rhythm
are the same inheritance.

This system explicitly rejects: dark SaaS backgrounds with neon or purple-blue gradient
overlays, floating abstract geometric shapes as decoration, hero-metric templates (big
number + small label + gradient accent), identical card grids, tiny all-caps tracked
eyebrows on every section, numbered section markers used decoratively, and any interface
that could belong to a generic AI product template.

**Key Characteristics:**
- Color shifts chromatic temperature across sections as the user scrolls
- Headlines mix Fraunces bold and italic within the same line — the primary typographic signature
- Surfaces are always warm-tinted; cold gray (`oklch(X% 0 0)`) is forbidden for backgrounds
- Components: 8px radius (buttons/inputs), 12px (cards), 9999px (LP CTA pill)
- Motion: Framer Motion for section entrances; CSS-only for all micro-interactions and hover states
- Depth: completely flat on the LP (tonal contrast only); subtle warm shadows in the app layer

## 2. Colors: A Tarde Brasileira

A palette drawn from the Brazilian afternoon: deep saturated anchor, warm coral spark,
honey warmth, calm teal, and a breathing creme base.

### Primary
- **Roxo Jambo** (`oklch(42% 0.19 320)`): Deep Brazilian purple — named after the jambo
  roxo fruit, dark and saturated with rich chroma. The dominant brand color: primary
  buttons, active states, section fill backgrounds, navigation indicators. Commands
  attention without aggression.
- **Roxo Jambo Foreground** (`oklch(98% 0.01 320)`): Near-white with a faint roxo-jambo
  cast. Text on all primary-colored surfaces.

### Secondary
- **Coral Faísca** (`oklch(62% 0.22 28)`): The spark. Warm coral-orange with high chroma.
  Used as punctuation and accent — emphasis within headlines, notification badges, small
  highlight elements. Never fills large surfaces.
- **Lilás Névoa** (`oklch(95% 0.01 320)`): Pale purple-tinted surface. Secondary button
  backgrounds, chip/tag surfaces, section alternates that need distinction without contrast.

### Tertiary
- **Mel** (`oklch(74% 0.12 75)`): Honey amber. Warm section backgrounds, callout surfaces,
  highlights that communicate warmth rather than urgency.
- **Verde-Água** (`oklch(70% 0.10 190)`): Calm teal. Success states, growth-related
  insight tags, calmer section backgrounds in the app layer.

### Neutral
- **Creme** (`oklch(98% 0.008 90)`): The base. A warm off-white tinted fractionally toward
  ochre — not cold, not cream-by-default. The page background. Used to breathe between
  colored sections.
- **Tinta** (`oklch(18% 0.02 260)`): Near-black with a faint cool-blue undertone. Primary
  text on all light surfaces. Never a flat black.
- **Cinza Mudo** (`oklch(52% 0.02 260)`): Secondary text, placeholders, metadata.
  Always verify contrast at 4.5:1 minimum against its background before shipping.
- **Borda** (`oklch(90% 0.01 260)`): Hairline borders, input strokes, dividers. One step
  above invisible.
- **Vermelho Alerta** (`oklch(55% 0.22 25)`): Destructive actions and form error states only.

**The Proprietary Palette Rule.** Every color is named and Brazilian. No `gray-200` or
`blue-500`. New colors get a Brazilian name and a documented role before they ship.

**The Coral Rule.** Coral Faísca is used as punctuation. If coral covers more than 10%
of any screen, it has lost its meaning. Its rarity is its power.

**The Warm Surface Rule.** No cold-gray surfaces (`oklch(X% 0 0)`). Every surface is
tinted: toward roxo-jambo (lilás névoa), toward mel (warm sections), or toward creme.
White (`oklch(100% 0 0)`) is permitted for card surfaces only when the card sits on
a warm-tinted base; everywhere else, tint toward the brand.

## 3. Typography: Fraunces + Geist

**Display Font:** Fraunces (Google Fonts), Georgia, serif
**Body Font:** Geist Sans (Vercel), system-ui, sans-serif
**Mono Font:** Geist Mono (Vercel)

**Character:** Fraunces's optical variability — the "wonky" axis that gives it organic
warmth — anchors authority without feeling corporate. Geist Sans keeps body copy sharp
and legible at any size. Together: a smart Brazilian friend who happens to be a brilliant
designer, not another tech company trying to seem human.

### Hierarchy
- **Display** (Fraunces 700 / italic 400, clamp 36–72px, lh 1.05, ls −0.02em): Hero
  headlines and major section titles only. Mixes bold and italic within the same line
  for emphasis — e.g., *"Seu trabalho tem mais valor do que* **parece**."
- **Headline** (Fraunces 600, clamp 24–40px, lh 1.2, ls −0.015em): Section subheadings,
  feature titles, large card headings.
- **Title** (Geist Sans 600, 18–20px, lh 1.35): Card titles, modal headings, nav labels.
  The bridge between display warmth and body clarity.
- **Body** (Geist Sans 400, 16px, lh 1.7, max 65ch): All prose. Line length capped at
  65–75ch for comfortable reading rhythm. Never tighter than 1.6 line-height.
- **Label** (Geist Sans 500, 14px, lh 1.4, ls 0.01em): Button text, input labels, tags,
  UI metadata. No ALL CAPS for anything longer than four words.

**The Mixed-Weight Headline Rule.** Fraunces display headlines mix `font-weight: 700`
(the anchor word) with `font-weight: 400; font-style: italic` (the emphasis word) inside
the same `<h1>` or `<h2>`. This is the primary typographic signature of Borogodó. Apply
only at display and headline sizes — never on body copy or labels.

**The Three-Font Ceiling.** Fraunces, Geist Sans, Geist Mono: the complete set. A fourth
family is never introduced. Distinctions are achieved through weight and style variation
within these three.

## 4. Elevation

**Context-sensitive flat.** The system is flat by default everywhere; shadows appear only
as a state response in the app layer.

**Landing Page (brand surface):** Completely flat. Depth is expressed entirely through
tonal contrast — each section shifts background color (creme → lilás névoa → mel-tinted
→ verde-água-tinted → creme). No shadow on the LP under any circumstance.

**App layer (product surfaces):** Flat at rest; elevated on state:
- Cards at rest: flat. On hover: `box-shadow: 0 4px 16px oklch(42% 0.19 320 / 0.10)`
- Modals and drawers: `box-shadow: 0 8px 40px oklch(18% 0.02 260 / 0.16)`
- Floating elements (popovers, tooltips): `box-shadow: 0 2px 8px oklch(18% 0.02 260 / 0.12)`

**The Flat-Until-Lifted Rule.** A surface earns its shadow by leaving the canvas: on
hover, on modal open, on popover trigger. At rest, all surfaces are flat. Shadow is a
state response, never decoration.

**The Warm Shadow Rule.** Shadows are never cold-black. They are always tinted with
roxo-jambo or tinta — `oklch(42% 0.19 320 / X)` or `oklch(18% 0.02 260 / X)`.
A cold black shadow breaks the warmth of every surface it touches.

## 5. Components

**Character:** Sofisticação Acolhedora. Clear visual hierarchy with generous whitespace
and assertive typography (confidence); tinted surfaces, rounded-but-not-bubbly edges,
smooth transitions (warmth). The radius grammar: 8px for interactive elements, 12px for
containers, 9999px for LP hero CTA pills only.

### Buttons

- **Shape:** 8px radius for all standard buttons; 9999px pill shape for LP CTA only
- **Primary:** roxo-jambo fill, roxo-jambo-fg text, 40px height (48px on mobile), 10px/24px
  padding. Hover: fill darkens to `oklch(38% 0.19 320)` with `transition: background-color
  180ms ease-out`. No scale transform — confidence doesn't flinch.
- **Primary Large (LP CTA):** Pill-shaped, 52px height, 14px/32px padding. Used only
  on LP hero and final CTA. The pill shape signals "begin" — a distinct moment.
- **Secondary:** Lilás névoa fill, `oklch(25% 0.05 320)` text. Hover: fill deepens to
  `oklch(92% 0.015 320)`. Used for "Entrar" / sign-in alongside a primary CTA.
- **Ghost:** Transparent bg, roxo-jambo text. Hover: lilás névoa fill. Used for tertiary
  actions, nav links, and in-content actions.
- **Focus ring:** 2px ring in roxo-jambo, 2px offset from the element. Always visible
  on keyboard navigation. Never hidden with `outline: none` without an equivalent.
- **Touch target:** All variants are minimum 48×48px on mobile (h-12 at max-md breakpoint).

### Inputs / Fields

- **Style:** 1px borda stroke, creme/white background, 8px radius, 40px height
- **Focus:** 2px roxo-jambo ring, `transition: box-shadow 150ms ease-out`. The border
  does not change color; the ring communicates the state.
- **Placeholder:** cinza-mudo text — must achieve 4.5:1 against the background before shipping
- **Error state:** Borda color shifts to vermelho-alerta; error message in vermelho-alerta
  at 14px below the field with a short description (never just "Invalid")
- **Disabled:** 50% opacity, pointer-events none

### Cards / Containers

- **Corner style:** 12px radius. 16px for modals and bottom sheets.
- **Background:** white on creme base (LP); lilás névoa or mel-tinted on colored sections (app)
- **Shadow:** flat at rest on the LP; hover-lift in the app layer only
- **Border:** 1px borda when the card sits on creme background; omit when on a colored section
- **Padding:** 24px standard; 16px compact for dense lists; 32px for hero feature cards

### Navigation

- **LP nav:** transparent at top; transitions to `creme + backdrop-blur(8px)` on scroll.
  Logo left, ghost links center, primary CTA pill right. Mobile: hamburger triggers a
  full-height drawer with the same links.
- **App nav:** persistent top bar or left sidebar. Background: white with a 1px borda-bottom.
  Active state: 3px roxo-jambo left indicator (sidebar) or 2px roxo-jambo underline (top bar).

### Signature: Mixed-Weight Display Block

The LP's headline treatment where an `<em>` tag switches one word or phrase within a
Fraunces display headline to italic weight (400) while the surrounding text stays bold
(700). The most recognizable visual signature of Borogodó. Never applied at body or
label scale.

```html
<h1>Seu trabalho tem mais valor do que <em>parece</em>.</h1>
```

The `em` renders in `font-weight: 400; font-style: italic` inside a parent that carries
`font-weight: 700; font-family: 'Fraunces'`. No additional CSS class required — the
contrast between bold and italic within the same family does the work.

## 6. Do's and Don'ts

### Do:
- **Do** mix Fraunces bold and italic within the same headline — this is the
  system's primary typographic signature and should appear in every major headline
- **Do** shift section background color as the user scrolls; every section earns its
  own chromatic temperature from the brand token set
- **Do** use 8px radius on buttons and inputs, 12px on cards — elegant, never bubbly
- **Do** verify contrast on every cinza-mudo text instance; 52% L on creme sits near
  the 4.5:1 minimum — increase lightness (toward tinta) until it passes
- **Do** reserve coral-faísca for sparks: maximum 10% of any screen's surface area;
  its rarity is what makes it work
- **Do** write all copy — including labels, error messages, and empty states — in
  português brasileiro coloquial; the copy is part of the design
- **Do** disable all Framer Motion entrance animations when `prefers-reduced-motion:
  reduce` is active; show content at full opacity immediately
- **Do** ensure all interactive elements reach 48×48px minimum touch target on mobile
- **Do** tint shadows toward roxo-jambo or tinta — warm shadows only

### Don't:
- **Don't** use a dark background with neon text or purple-to-blue gradient overlays;
  this is the 2022 generic AI SaaS tell and is explicitly forbidden in this system
- **Don't** use floating abstract geometric shapes (circles, blobs, grid lines) as
  decoration with no semantic purpose
- **Don't** apply the hero-metric template: big number + small label + gradient accent
  in a stats grid
- **Don't** put a tiny all-caps tracked eyebrow above every section ("SOBRE", "COMO
  FUNCIONA", "PARA QUEM") — one deliberate kicker as a brand system is voice;
  eyebrows on every section are AI grammar
- **Don't** use numbered section markers (01 / 02 / 03) decoratively when the content
  is not an actual ordered sequence
- **Don't** build identical card grids: same icon + heading + text repeated endlessly
  in a uniform symmetric layout
- **Don't** use cold-gray surfaces (`oklch(X% 0 0)` for backgrounds); every surface
  must be tinted toward the brand palette
- **Don't** use a fourth typeface; Fraunces, Geist Sans, and Geist Mono are the
  complete system — distinctions are achieved through weight and style variation
- **Don't** apply the italic-emphasis headline treatment at body or label scale; it
  belongs only at display and headline sizes
- **Don't** write copy that sounds translated from English — "potencialize suas
  conquistas", "maximize seu impacto", "transforme sua carreira" are forbidden;
  every word should sound like a Brazilian friend wrote it
