# Phase 1 — Data Model: Rebuild da Landing Page

> Página pública sem persistência. Não há tabela, migration nem entidade de banco. As
> "entidades" abaixo são estruturas de conteúdo e de configuração, não dados de usuário.

## Entidade: Seção da LP (conceitual)

Cada seção é um componente com: papel na narrativa, namespace de i18n, tipo de render
(server/ilha client), e temperatura cromática. Ordem fixa na página:

| # | Seção | Componente | i18n namespace | Render |
|---|---|---|---|---|
| 0 | Navbar | `NavBar` | `landingNav` | ilha client (sticky) |
| 1 | Hero | `HeroSection` + `HeroDemo` | `hero` | server + ilha client (demo) |
| 2 | Dores | `PainPointsSection` | `painPoints` | server |
| 3 | 4 verbos | `JourneySection` | `journey` | server |
| 4 | Provas | `ProofSection` | `proof` | server (com MediaSlot) |
| 5 | Propriedade | `OwnershipSection` | `ownership` | server |
| 6 | Manifesto | `ManifestoSection` | `manifesto` | server |
| 7 | Prova social | `SocialProofSection` | `socialProof` | server |
| 8 | Perguntas | `FaqSection` | `faq` | server (accordion = ilha se interativo) |
| 9 | CTA final | `CtaSection` | `cta` | server |
| 10 | Rodapé | `Footer` | `support` (reuso 020) | server |

## Entidade: Slot de mídia

```
MediaSlot {
  aspect: string         // proporção fixa reservada, ex. "16/9" (hero), "4/3" (provas)
  kind: 'placeholder' | 'image' | 'video'
  // placeholder: render interno estilizado (estado atual)
  // image: next/image (mídia real futura)
  // video: <video> com poster de fallback estático (FR-017)
  label: string          // alt/aria descrevendo o que será mostrado
}
```

Usos: hero (`aspect 16/9`, vídeo do onboarding futuro) e Provas (`aspect 4/3`, screenshot do
card de força futuro). Hoje ambos em `kind: 'placeholder'`.

## Entidade: Pergunta (FAQ) — fonte única

```
FaqItem {
  id: string             // slug estável
  questionKey: string    // chave i18n da pergunta
  answerKey: string      // chave i18n da resposta
}
```

`faqData.ts` exporta a lista ordenada. A `FaqSection` renderiza a UI; o `StructuredData` mapeia
a mesma lista para `FAQPage`. Isto garante SC-004 (correspondência 1:1).

## Shape dos dados estruturados (JSON-LD)

**SoftwareApplication**
```
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Borogodó",
  "description": "<frase definitória autocontida>",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
  "inLanguage": "pt-BR"
}
```

**Organization**
```
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Borogodó",
  "url": "https://borogodo.ai"
}
```

**FAQPage** (gerado de `faqData.ts`)
```
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "<pergunta>",
      "acceptedAnswer": { "@type": "Answer", "text": "<resposta>" } }
  ]
}
```

## Configuração estática

- `public/llms.txt` — texto de definição para modelos de IA.
- `src/app/robots.ts` — regras de crawler (geral + IA) e sitemap.
- `public/og/espelho-prova.png` — placeholder da OG image.
