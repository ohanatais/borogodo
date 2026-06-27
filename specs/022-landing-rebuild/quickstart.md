# Quickstart — Validar o Rebuild da Landing Page

## Pré-requisitos
- Dependências instaladas (`npm install`).
- Rodar em `borogodo-022` (ou na branch `022-landing-rebuild`).

## Subir e ver
```bash
npm run dev
# abrir http://localhost:3000/  (redireciona para /pt-BR)
```

## Validação automatizada
```bash
npm run test         # suíte Vitest (seções, JSON-LD, metadata, faqData)
npm run lint
npx tsc --noEmit     # type-check estrito
```

## Roteiro manual (mapeia os Success Criteria)

1. **Primeira dobra / 5 segundos (SC-001)**: abrir sem sessão. A headline da dor, o significado
   de "borogodó", a demo e o CTA único aparecem. Microcopy de gratuidade visível.
2. **Mobile (SC-005, FR-011)**: DevTools em 375px (e 360px). A demo do hero aparece (não
   escondida). Tudo legível, alvos de toque ≥48px.
3. **CTA único (FR-009)**: só um botão de signup no hero e no fim; "Entrar" é link discreto na
   navbar. Clicar no CTA leva a `/login?mode=signup`.
4. **Conteúdo no HTML / SSR (SC-002)**:
   ```bash
   curl -s http://localhost:3000/pt-BR | grep -i "Falar do seu trabalho"   # headline
   curl -s http://localhost:3000/pt-BR | grep -i "seu, não da sua empresa" # ownership
   ```
   Todo texto de seção deve aparecer sem executar JS.
5. **JSON-LD (SC-003)**: ver fonte da página, achar 3 blocos `application/ld+json`
   (SoftwareApplication, Organization, FAQPage). Colar no Rich Results Test / validador de
   schema; zero erro.
6. **FAQ 1:1 (SC-004)**: contar perguntas na seção e comparar com `mainEntity` do FAQPage.
7. **llms.txt (FR-021)**: `curl -s http://localhost:3000/llms.txt` retorna a definição.
8. **robots (FR-024, SC-009)**: `curl -s http://localhost:3000/robots.txt` mostra crawlers de
   IA permitidos e o sitemap. (Confirmar que CDN/Cloudflare não bloqueia é passo de operação.)
9. **OG/meta (FR-025, SC-010)**: ver `<title>`, `<meta name="description">`, `og:title`,
   `og:description`, `og:image`. Texto humano; imagem placeholder carrega.
10. **Slot de mídia (SC-008)**: trocar temporariamente o placeholder por uma imagem de exemplo
    no `MediaSlot`; confirmar que o layout ao redor não muda.
11. **Voz (SC-007)**: ler toda a copy; zero travessão, zero "não é X, é Y", zero lista de três.
12. **Sem promessa fora do v1 (SC-006)**: buscar "currículo" e "portfólio"; não aparecem.
13. **Movimento reduzido (FR-029)**: ativar "reduzir movimento" no SO; animações de entrada não
    disparam movimento involuntário.
14. **Mockups removidos**: `MirrorMockup`, `CareerMapMockup`, `ContentGenSection` não existem
    mais; mapa de carreira fora.

## Gate humano
- Revisão da Ohana: voz, primeira dobra, e a decisão de quando produzir a mídia real (depende
  do output real do onboarding estar digno de palco).
