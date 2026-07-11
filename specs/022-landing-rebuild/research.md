# Phase 0 — Research: Rebuild da Landing Page

## 1. Garantir SSR / legibilidade por crawler e IA (FR-022, SC-002)

- **Decisão**: seções renderizadas como Server Components; interatividade isolada em ilhas
  client mínimas (`HeroDemo`, navbar sticky, accordion da FAQ se houver). Texto vem de
  `getTranslations` no server.
- **Rationale**: o App Router já faz SSR do HTML inicial mesmo de componentes `'use client'`,
  então o conteúdo apareceria no HTML de qualquer jeito. Mas tornar as seções Server Components
  reduz o JS de cliente (Princípio IV) e elimina qualquer risco de conteúdo que dependa de
  efeito client. Garante o conteúdo no HTML sem custo.
- **Alternativas**: manter tudo `'use client'` como hoje (mais JS, contra o Princípio IV);
  pré-render estático isolado (desnecessário, o SSR já entrega).

## 2. Dados estruturados JSON-LD (FR-019, FR-020, SC-003, SC-004)

- **Decisão**: um componente server `StructuredData` que injeta três blocos
  `<script type="application/ld+json">`: `SoftwareApplication`, `Organization`, `FAQPage`. O
  `FAQPage` é gerado a partir de `faqData.ts`, a mesma fonte que alimenta a `FaqSection`,
  garantindo correspondência 1:1 (SC-004).
- **Rationale**: fonte única evita divergência entre o visível e o estruturado. Server-injected
  garante presença no HTML.
- **Alternativas**: bibliotecas de schema (overkill); duplicar as perguntas (quebra SC-004).

## 3. llms.txt e robots (FR-021, FR-024, SC-009)

- **Decisão**: `public/llms.txt` (servido em `/llms.txt` na raiz) com definição, diferenciais,
  público, preço e links. `src/app/robots.ts` (Next Metadata Route) permitindo crawlers gerais
  e de IA (GPTBot, PerplexityBot, ChatGPT-User, Google-Extended) e apontando o sitemap.
- **Rationale**: `public/` é a forma idiomática de servir arquivo estático na raiz. `robots.ts`
  é tipado e versionado, melhor que `public/robots.txt` cru.
- **Alternativas**: `public/robots.txt` estático (menos flexível). Confirmar que não há bloqueio
  em camada de CDN/Cloudflare é ação de operação fora do código (anotada no quickstart).

## 4. OG image com placeholder (FR-026, SC-010)

- **Decisão**: `public/og/espelho-prova.png` como placeholder de qualidade (card de força com
  prova), referenciado em `openGraph.images` e `twitter`. Trocar pela arte real depois sem
  mudar código.
- **Rationale**: estático é o mais simples e estável; evita custo de geração dinâmica agora.
- **Alternativas**: `next/og` `ImageResponse` dinâmico (bom no futuro, desnecessário pro
  placeholder).

## 5. Metadata humana e locale-aware (FR-025)

- **Decisão**: `generateMetadata` em `src/app/[locale]/layout.tsx` usando `getTranslations`,
  lendo do namespace `metadata` do i18n. Title/description/OG humanos. O `layout.tsx` raiz
  mantém só um fallback enxuto.
- **Rationale**: metadata por locale é o padrão next-intl; mantém texto no i18n (Princípio IX).

## 6. Slot de mídia que aceita troca sem retrabalho (FR-014, FR-015, FR-017, SC-008)

- **Decisão**: componente `MediaSlot` com uma API de composição: recebe `kind` ('image' |
  'video' | 'placeholder'), `aspect` (proporção fixa reservada), e o conteúdo. Enquanto não há
  mídia real, renderiza o placeholder dentro do mesmo box de proporção fixa. Trocar para vídeo
  (com `poster` de fallback estático, FR-017) ou imagem não muda o layout ao redor, porque a
  caixa de proporção é a âncora.
- **Rationale**: fixar a proporção (aspect-ratio) é o que garante zero shift de layout na troca.
  Imagens via `next/image` (Princípio IV).
- **Alternativas**: trocar markup por completo no futuro (arrisca regressão de layout); sem
  proporção fixa (causa CLS na troca).

## 7. Voz e conteúdo (FR-027)

- **Decisão**: copy final mora no i18n, copiada do decision record
  `docs/decisions/001-landing-page-rebuild.md`, que já passou pela regra de voz (sem travessão,
  sem "não é X, é Y", sem lista de três, sem metáfora enfeitada).
- **Rationale**: o decision record é a fonte de verdade da copy; o gate de voz é revisão humana
  (Ohana) antes do merge.

## 8. Tokens vs oklch inline (Princípio VII)

- **Decisão**: preferir tokens de `globals.css`; onde uma cor de seção não tem token, manter
  `oklch(...)` inline com comentário, sem introduzir hex cru, preservando o visual exato.
- **Rationale**: a feature é rebuild de narrativa, não de identidade; reescrever a tokenização
  toda aumentaria o risco de regressão visual sem ganho de produto.
