# Data Model: Landing Page Borogodó

**Phase 1 output** | Branch: `001-landing-page` | Date: 2026-06-06

The landing page is purely static — no database, no API calls. The "data model" here defines
the TypeScript types for component props and the i18n message key structure that both the
implementation and the translation files must follow.

---

## TypeScript Types (`src/types/landing.ts`)

```typescript
export interface PainPoint {
  id: string           // e.g. "promotion", "visibility", "content", "identity"
  headlineKey: string
  descriptionKey: string
}

export interface HowItWorksStep {
  step: 1 | 2 | 3
  titleKey: string
  descriptionKey: string
}

// Mockup fixture types — not i18n translated (static representative data)
export interface MirrorInsightFixture {
  pattern: string      // e.g. "Você liderou 4 projetos sob pressão..."
  evidence: string[]   // supporting data points
  insight: string      // the mirror's statement
}

export interface CareerSkillCluster {
  label: string
  skills: string[]
  intensity: 'high' | 'medium' | 'low'
}

export interface CareerMapFixture {
  profile: string      // e.g. "AI-native · 0→1 · SaaS"
  clusters: CareerSkillCluster[]
  timeline: Array<{ period: string; role: string; company: string }>
}

export interface PostComparisonFixture {
  label: { real: string; generic: string }
  real: string
  generic: string
}
```

---

## i18n Message Key Structure

**Authoritative source**: `src/messages/pt-BR.json`
**Stub**: `src/messages/en.json` (same key structure, all values empty strings `""`)

```json
{
  "hero": {
    "headline": "",
    "subheadline": "",
    "ctaPrimary": "Criar conta",
    "ctaSecondary": "Já tenho conta",
    "ariaCtaPrimary": "Criar conta no Borogodó",
    "ariaCtaSecondary": "Entrar na conta existente"
  },
  "painPoints": {
    "sectionTitle": "",
    "items": {
      "promotion": {
        "headline": "",
        "description": ""
      },
      "visibility": {
        "headline": "",
        "description": ""
      },
      "content": {
        "headline": "",
        "description": ""
      },
      "identity": {
        "headline": "",
        "description": ""
      }
    }
  },
  "howItWorks": {
    "sectionTitle": "",
    "steps": {
      "one": { "title": "", "description": "" },
      "two": { "title": "", "description": "" },
      "three": { "title": "", "description": "" }
    }
  },
  "mirror": {
    "sectionTitle": "",
    "sectionSubtitle": ""
  },
  "careerMap": {
    "sectionTitle": "",
    "sectionSubtitle": ""
  },
  "contentGen": {
    "sectionTitle": "",
    "sectionSubtitle": "",
    "realLabel": "Do seu histórico real",
    "genericLabel": "IA genérica"
  },
  "cta": {
    "headline": "",
    "subheadline": "",
    "ctaPrimary": "Criar conta",
    "ctaSecondary": "Já tenho conta",
    "ariaCtaPrimary": "Criar conta no Borogodó",
    "ariaCtaSecondary": "Entrar na conta existente"
  },
  "metadata": {
    "title": "Borogodó — descubra e mostre seu valor profissional",
    "description": ""
  }
}
```

### Key naming conventions

- All keys in English camelCase
- Namespaced by section (`hero.*`, `painPoints.*`, etc.)
- Aria labels get their own keys (`ariaCtaPrimary`) — never reuse visible-text keys for
  `aria-label` attributes, as they may diverge
- Mockup fixture content (inside the visual UI mockups) is NOT in the message files — it
  is hardcoded Portuguese representative data defined as constants in component files

---

## Static Fixture Data (defined in component files, not i18n)

### MirrorMockup fixture

```typescript
// src/components/features/landing/MirrorMockup.tsx
const fixture: MirrorInsightFixture = {
  pattern: 'Entrega sob pressão',
  evidence: [
    'Liderou 4 projetos com deadline apertado',
    'Taxa de entrega no prazo: 100%',
    'Todas as entregas acima da expectativa inicial',
  ],
  insight:
    'Você liderou 4 projetos sob pressão e entregou os quatro no prazo. ' +
    'Esse é um padrão seu — não sorte.',
}
```

### CareerMapMockup fixture

```typescript
// src/components/features/landing/CareerMapMockup.tsx
const fixture: CareerMapFixture = {
  profile: 'AI-native · 0→1 · Adaptação rápida',
  clusters: [
    { label: 'Produto', skills: ['Discovery', 'Roadmap', 'OKRs', 'GTM'], intensity: 'high' },
    { label: 'IA & Dados', skills: ['Prompting', 'RAG', 'Análise'], intensity: 'high' },
    { label: 'Liderança', skills: ['Mentoria', 'Stakeholders', 'Alinhamento'], intensity: 'medium' },
    { label: 'Entrega', skills: ['Scrum', 'Kanban', 'Priorização'], intensity: 'medium' },
  ],
  timeline: [
    { period: '2021–2024', role: 'Senior PM', company: 'Scale-up SaaS' },
    { period: '2019–2021', role: 'PM', company: 'Startup 0→1' },
    { period: '2017–2019', role: 'Product Analyst', company: 'Consultoria' },
  ],
}
```

### ContentGenSection fixture

```typescript
// src/components/features/landing/ContentGenSection.tsx
const fixture: PostComparisonFixture = {
  label: { real: 'Do seu histórico real', generic: 'IA genérica' },
  real:
    'Bati meta pelo segundo trimestre seguido — e dessa vez entendendo exatamente o que mudou. ' +
    'No Q2 eu abandonei o script e parei de empurrar. Comecei a ouvir onde o cliente travava ' +
    'de verdade. Resultado: ciclo de venda 30% mais curto, ticket médio 18% maior. ' +
    'Não foi sorte. Foi processo.',
  generic:
    'Orgulhoso de anunciar que bati minha meta de vendas pelo segundo trimestre consecutivo! ' +
    'Com muito esforço, dedicação e foco no cliente, consegui superar os objetivos estabelecidos. ' +
    'Grato à minha equipe e à empresa pela oportunidade. #vendas #resultados #crescimento',
}
```
