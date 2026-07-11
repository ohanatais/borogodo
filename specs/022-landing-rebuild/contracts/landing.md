# Contract — Landing Page (componentes, slots, dados estruturados)

> Contrato de UI: o que cada peça expõe e garante. Não é API HTTP (a página é pública e
> estática quanto a dados). A única ação externa é o link de signup.

## Rota

- `GET /[locale]` → renderiza a LP completa (SSR). `pt-BR` é o fallback.
- CTA de conversão aponta para `/login?mode=signup`. "Entrar" aponta para `/login`.

## Contrato por seção

Cada componente de seção MUST:
- expor um `id` de âncora estável (ex.: `#como-funciona`, `#provas`, `#privacidade`,
  `#perguntas`) quando referenciado pela navbar (FR-013);
- usar exatamente um `<h2>` como título da seção (o `<h1>` único é do hero — FR-018);
- ler todo texto do seu namespace i18n (Princípio IX);
- ser mobile-first e respeitar movimento reduzido (FR-029).

### NavBar (`landingNav`)
- Logo + âncoras (Como funciona, Provas, Privacidade, Perguntas) + link "Entrar".
- MUST NOT conter CTA de signup concorrente (FR-009).

### HeroSection (`hero`) + HeroDemo
- `<h1>` único = headline da dor (FR-008).
- Eyebrow estilo dicionário com o significado de "borogodó" (FR-008).
- Subheadline com frase definitória autocontida (FR-023).
- CTA único primário "Ver o meu borogodó" → signup (FR-009). Microcopy de gratuidade + ~5min
  (FR-010). Linha de micro-trust.
- `HeroDemo` é ilha client; usa `MediaSlot` (aspect 16/9). MUST ser visível no mobile (FR-011).
  Mostra força com evidência citada (FR-012). Estado de fallback estático (FR-017).

### PainPointsSection (`painPoints`)
- 4 dores na voz nova (FR-027), cada uma título curto + corpo.

### JourneySection (`journey`)
- 4 verbos em ordem Descobrir→Entender→Provar→Usar como jornada (FR-001).
- MUST NOT mencionar currículo/portfólio (FR-007).

### ProofSection (`proof`)
- Pilar Provas nomeado (FR-002). `MediaSlot` (aspect 4/3) para o card real (FR-014).

### OwnershipSection (`ownership`)
- "Seu, não da sua empresa" + 4 sinais de privacidade (FR-003).

### ManifestoSection (`manifesto`)
- Manifesto brasileiro (FR-004).

### SocialProofSection (`socialProof`)
- Build-in-public, sem depoimento/numero fake (FR-005). Link "ver os bastidores".

### FaqSection (`faq`)
- Renderiza `faqData.ts` (FR-006). Fonte única do `FAQPage` (FR-020).

### CtaSection (`cta`)
- CTA único final → signup (FR-009).

### Footer (`support`)
- Reusa `ContactCard` (020). Linha "Borogodó · feito no Brasil · 2026".

## Contrato `MediaSlot`
- Props: `aspect`, `kind`, `label`, conteúdo.
- Garante caixa de proporção fixa; troca de `kind` não altera layout ao redor (SC-008).
- `kind: 'image'` usa `next/image`; `kind: 'video'` exige `poster` (FR-017).

## Contrato `StructuredData`
- Server Component; injeta 3 blocos JSON-LD válidos (FR-019).
- `FAQPage` derivado de `faqData.ts` (SC-004).

## Contrato de metadata / arquivos
- `generateMetadata` (locale) → title/description/OG humanos (FR-025), OG image placeholder
  (FR-026).
- `public/llms.txt` acessível em `/llms.txt` (FR-021).
- `robots.ts` libera crawlers gerais e de IA (FR-024).

## Critérios verificáveis (mapeiam Success Criteria)
- SC-002: `curl` da página (sem JS) contém o texto de todas as seções.
- SC-003: 3 blocos JSON-LD passam em validador.
- SC-004: nº de perguntas na UI == nº de `Question` no FAQPage.
- SC-005: demo visível em viewport 360–375px.
- SC-008: trocar placeholder por arquivo de exemplo não muda o layout.
