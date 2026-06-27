# Implementation Plan: Rebuild da Landing Page

**Branch**: `022-landing-rebuild` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-landing-rebuild/spec.md`

## Summary

Reconstruir a landing page pública para contar a espinha dos 4 verbos (Descobrir, Entender,
Provar, Usar) com o pilar Provas e a seção de propriedade do dado, liderando pela dor, com CTA
único de signup e camada de SEO/GEO completa. Os mockups desenhados à mão (`MirrorMockup`,
`CareerMapMockup`, `ContentGenSection`) são substituídos por slots de mídia preparados para
mídia real, com placeholder de qualidade por enquanto. Abordagem técnica: seções como Server
Components (SSR garante conteúdo no HTML para crawlers e IA), interatividade isolada em ilhas
client mínimas, todo texto via `next-intl`, dados estruturados em JSON-LD, `llms.txt` e
`robots` liberando crawlers de IA, e metadata/OG humanas e locale-aware.

## Technical Context

**Language/Version**: TypeScript estrito, Next.js 15 (App Router)

**Primary Dependencies**: next-intl, Framer Motion (só entrada), Lucide React, Tailwind +
tokens de `globals.css`

**Storage**: N/A (página pública sem persistência; sem Supabase, sem migration)

**Testing**: Vitest + Testing Library; render/asserção de conteúdo, hierarquia de headings,
presença de JSON-LD e metadata

**Target Platform**: Web (mobile-first, a partir de 360–375px)

**Project Type**: Web application (Next.js App Router, rota pública `[locale]/page.tsx`)

**Performance Goals**: conteúdo presente no HTML servido (SSR), JS de cliente mínimo (só ilhas
interativas), animações de entrada que não bloqueiam a main thread

**Constraints**: sem chamada de LLM, sem dado de usuário, sem migration; preservar o craft
visual atual (oklch, Fraunces/Geist, temperatura por seção); respeitar movimento reduzido

**Scale/Scope**: ~11 seções; ~9 componentes novos/reescritos; 2 slots de mídia; 1 namespace de
i18n por seção; 3 blocos de JSON-LD; 1 `llms.txt`; metadata + OG

## Constitution Check

*GATE: Must pass before Phase 0. Re-check after Phase 1.*

- **I. Security First**: sem dado de usuário, sem endpoint, sem segredo. Sem violação. ✅
- **II. TS strict & qualidade**: um componente por arquivo, funções <40 linhas, arquivos <800,
  identificadores em inglês, strings via i18n. ✅
- **III. AI-First**: não se aplica (sem LLM nesta feature). ✅
- **IV. Server-First & Performance**: seções viram Server Components; `'use client'` só nas
  ilhas com interação/animação (demo do hero, navbar sticky, FAQ accordion se houver). Imagens
  com `next/image`. Micro-interações em CSS; Framer só na entrada. ✅
- **V. Acessibilidade & WCAG AA**: H1 único (headline da dor), hierarquia h1→h2→h3 sem pulo,
  foco visível, alvo de toque ≥48px, contraste AA. Atende FR-018 e SC-005. ✅
- **VI. TDD**: testes escritos antes (RED) por seção e para JSON-LD/metadata; cobertura ≥80%. ✅
- **VII. Design Identity**: preserva tokens, Fraunces/Geist, temperatura por seção; sem
  anti-padrões. `/impeccable shape` antes de codar, `/impeccable audit` antes do PR.
  ⚠️ Nota: os componentes atuais usam `oklch(...)` inline em vez de tokens. O rebuild move
  para tokens onde possível sem alterar o resultado visual; cores sem token ficam inline com
  comentário, sem introduzir hex cru. ✅ (com nota)
- **VIII. Mobile-First**: corrige o `hidden md:flex` da demo do hero (FR-011); estilos
  mobile-first; revisão em 375px. ✅
- **IX. i18n**: todo texto novo em `src/messages/pt-BR.json` + espelho stub em `en.json`;
  chaves camelCase por seção; `useTranslations` em client, `getTranslations` em server. ✅

Sem violação que exija justificativa. Gate aprovado.

## Project Structure

### Documentation (this feature)

```text
specs/022-landing-rebuild/
├── plan.md              # este arquivo
├── research.md          # Phase 0 — decisões técnicas (SSR, JSON-LD, llms.txt, OG, mídia)
├── data-model.md        # Phase 1 — entidades de conteúdo/i18n e shape do JSON-LD
├── quickstart.md        # Phase 1 — como validar a feature ponta a ponta
├── contracts/
│   └── landing.md       # contrato das seções, slots de mídia e dados estruturados
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                      # metadata base enxuta
│   ├── robots.ts                       # NOVO/ajuste: libera crawlers de busca e IA
│   └── [locale]/
│       ├── layout.tsx                  # generateMetadata locale-aware (humano)
│       └── page.tsx                    # composição das seções + <StructuredData/>
├── components/features/landing/
│   ├── NavBar.tsx                      # reescrita: âncoras + "Entrar" discreto
│   ├── HeroSection.tsx                 # reescrita: eyebrow + headline da dor + CTA único
│   ├── HeroDemo.tsx                    # NOVO: ilha client da demo (usa MediaSlot)
│   ├── PainPointsSection.tsx           # reescrita: 4 dores na voz nova
│   ├── JourneySection.tsx              # NOVO: os 4 verbos como jornada (substitui HowItWorks)
│   ├── ProofSection.tsx                # NOVO: pilar Provas + MediaSlot (card real)
│   ├── OwnershipSection.tsx            # NOVO: "seu, não da sua empresa" + privacidade
│   ├── ManifestoSection.tsx            # NOVO: manifesto brasileiro
│   ├── SocialProofSection.tsx          # NOVO: build-in-public (sem depoimento fake)
│   ├── FaqSection.tsx                  # NOVO: perguntas (fonte do FAQPage)
│   ├── CtaSection.tsx                  # reescrita: CTA único final
│   ├── Footer.tsx                      # mantém ContactCard da 020 + "feito no Brasil"
│   ├── MediaSlot.tsx                   # NOVO: slot reutilizável (placeholder→mídia real)
│   ├── StructuredData.tsx              # NOVO: injeta JSON-LD (Software+Org+FAQ)
│   └── faqData.ts                      # NOVO: fonte única das perguntas (UI + schema)
├── messages/
│   ├── pt-BR.json                      # namespaces novos/atualizados por seção
│   └── en.json                         # stub espelhado
public/
├── llms.txt                            # NOVO: definição para modelos de IA
└── og/
    └── espelho-prova.png               # placeholder da OG image (troca depois)

# REMOVIDOS
src/components/features/landing/MirrorMockup.tsx
src/components/features/landing/CareerMapMockup.tsx
src/components/features/landing/ContentGenSection.tsx
```

**Estrutura**: web app Next.js App Router. Decisão de SSR registrada em research.md.

## Phase 0 — Research

Ver [research.md](./research.md). Resolve: como garantir SSR/GEO, formato do JSON-LD, entrega
do `llms.txt` e `robots`, estratégia de OG image com placeholder, e o desenho do slot de mídia
que aceita troca sem retrabalho.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md): entidades de conteúdo (Seção, Slot de mídia, Pergunta) e o
  shape dos três blocos de dados estruturados.
- [contracts/landing.md](./contracts/landing.md): contrato de cada seção (papel, headings,
  i18n namespace, ilha client ou server), do `MediaSlot` e do `StructuredData`.
- [quickstart.md](./quickstart.md): roteiro de validação manual + automatizada.
- Agent context: atualizar o bloco SPECKIT do `CLAUDE.md` apontando para este plano.

## Notas de execução

- **Sem migration, sem mudança de schema, sem rota nova de API.** Risco técnico baixo; risco de
  conteúdo/voz é o que importa (gate de revisão da Ohana).
- A mídia real é trabalho posterior; esta feature entrega `MediaSlot` com placeholder e os dois
  pontos de uso (hero, Provas).
- Ordem de implementação segue as prioridades da spec: US1 (hero+conversão) e US2 (SEO/GEO)
  primeiro, depois US3/US4 (confiança+narrativa), US5 (slots) por último.
