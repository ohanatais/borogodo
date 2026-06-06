# Product

## Register

product

> **LP exception**: the landing page (`/`) is a **brand** surface — design IS the product
> there. Override to `brand` for any LP task. All other surfaces (app shell, dashboard,
> capture flow, mirror, content generation) are `product`.

## Users

Four personas, all Brazilian white-collar professionals. United by a shared failure mode:
they are competent, they deliver, but they can't see or articulate their own value.

**Ana — Product Manager, tech/AI-native (6 years)**
Context: in communities, uses AI tools daily, reviews performance every cycle.
Job to be done: prove her seniority, build presence without sounding generic, understand
where she actually specializes after years of "doing everything."

**Bruno — Sales executive**
Context: result-driven, changes companies often, career tracked by numbers.
Job to be done: document victories before he forgets them, see the competence behind the
quota, build presence that attracts inbound opportunities.

**Clara — Finance/admin analyst or coordinator**
Context: operationally invisible, thinking about moving to leadership or a new area.
Job to be done: translate invisible work into visible impact, build confidence to position
herself, go from "I consume content" to "I publish."

**Rafael — Senior tech/product professional (7+ years)**
Context: has delivered across startups, scale-ups, different contexts. Very skilled.
Never could see his own professional map: what he specializes in, what pattern defines
his career, whether he's a generalist or a very specific kind of specialist.
Job to be done: finally see the shape of who he is professionally — the skills clustering,
the trajectory arc, the professional profile by specialization.

## Product Purpose

Borogodó is a career memory and intelligence layer for the Brazilian white-collar worker.

The user feeds it their real work — writing, speaking, uploading files. Borogodó structures
it, finds patterns, and returns two things of equal weight:

1. **Espelho (mirror)**: a clear, honest portrait of where the person excels and where they
   can grow — drawn from real evidence, not self-evaluation or generic skills lists.
   Also delivers a visual career map: skill clustering, trajectory patterns, professional
   profile by specialization. Answers "who am I as a professional?"

2. **Presença (presence)**: when ready, that same structured history becomes content —
   post, bio, impact summary, interview narrative — in the user's own voice. Good because
   it starts from the real history, not a blank prompt.

The product's moat is brasilidade: language, humor, cultural references, pricing in BRL,
presence in local communities. No gringo product does this.

**North Star**: value actions per active user per month — consulting a career insight OR
publishing content from their own history.

## Brand Personality

**Three words**: revelador, caloroso, espirituoso.

**Tone**: Brazilian, witty, and warm — with "molho." Never corporate, never a generic AI
tool. Speaks in Portuguese that sounds like a smart friend who happens to know a lot,
not a translated SaaS. Uses humor lightly. Feels like it's on your side.

**Emotional goal for the user**: the moment of clarity — "I didn't know I was this good
at this" or "now I can see the shape of my career." The product should feel like a mirror
being held up for the first time, not an analytics dashboard.

**Brand name origin**: "borogodó" = that indefinable Brazilian charm, the "certain je ne
sais quoi." The product reveals your professional borogodó — where you shine without even
knowing how to name it.

## Visual Reference

**Numera** (numera.com.br) — the evolved, human-warm direction specifically:
- Bold headline typography that mixes italic and weight variation *within the same line*
  for emphasis ("mas *muito* mais leve" — not uniform weight throughout)
- Saturated section backgrounds that shift chromatic tone as you scroll — each section
  has its own temperature; the page feels like it breathes
- Human photography integrated naturally into the layout (real people, real moments —
  not stock smiles at laptops)
- Copy that is genuinely Brazilian: colloquial, energetic, never "tradutês"
- Layout with asymmetric energy — not a rigid uniform grid

**What we take from Numera**: the boldness, the typographic expressiveness, the color
rhythm, the human photography, the Brazilian authenticity.

**What we adapt for Borogodó**: Numera's energy is entrepreneurial/hustle; ours is warmer
and more introspective — clarity and discovery, not action and speed. The palette is
different: creme base + roxo-jambo + coral-faísca + mel + verde-água instead of dark green.

## Anti-references

- Generic dark SaaS with neon text and floating abstract shapes (the 2022 playbook)
- Purple-blue gradient background (the AI product tell)
- Cream/sand background used lazily as the "warm neutral default" — we use creme
  intentionally with rich accents; it must feel chosen, not defaulted to
- Hero-metric template: big number, small label, gradient accent
- Identical card grids: same icon + heading + text repeated endlessly
- Tiny all-caps tracked eyebrow above every single section ("ABOUT", "PROCESS", etc.)
- Numbered section markers as decoration (01 / 02 / 03) when the content isn't actually
  a sequence
- Any layout or copy that could be from a US SaaS tool translated to Portuguese

## Design Principles

1. **Revelar, não mostrar**: the design holds a mirror, not a dashboard. Insights should
   feel like discoveries, not reports. Hierarchy and emphasis serve revelation.

2. **Brasilidade como decisão, não enfeite**: language, tone, and warmth are design
   choices that go all the way down — in labels, error states, empty states, loading
   copy. Never an afterthought or a style layer on top of a generic UI.

3. **Evidência, não adivinhação**: every claim in the UI should be backed by something
   real. The design must communicate trust — the user is sharing sensitive professional
   data; it must feel like a safe, honest, private space.

4. **Captura invisível**: the act of adding information must feel effortless. The UI
   never makes the user work harder than talking to a friend. If it requires effort, it
   fails.

5. **Voz da pessoa, não da IA**: content surfaces (generated posts, bios, summaries)
   must feel personal and specific. The design distinguishes Borogodó sharply from
   generic AI output — through specificity, examples, and framing.

## Accessibility & Inclusion

- WCAG AA minimum — all text contrast, interactive element labels, focus states
- All interactive elements: 48×48 px minimum touch target on mobile
- `prefers-reduced-motion` respected on all animations — content visible without motion
- Portuguese Brazilian as the base locale; i18n structure ready for future expansion
- Semantic heading hierarchy; no skipped levels
