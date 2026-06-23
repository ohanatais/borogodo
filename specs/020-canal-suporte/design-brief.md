# Design Brief — Canal de contato/suporte

> Produzido por `/impeccable shape` (2026-06-22). Insumo para `/impeccable craft` / implementação.
> Probes visuais pulados: harness sem geração nativa de imagem + refinamento sobre sistema existente.

## 1. Feature Summary
Um bloco de contato (`ContactCard`) que aparece em dois lugares: o rodapé da landing page (registro
**marca**) e um card na Central de Configurações (registro **produto**). Mostra o e-mail de suporte
copiável, um link secundário de LinkedIn e uma microcopy de SLA. Para o profissional que travou ou
tem dúvida e precisa alcançar alguém, no pré-launch.

## 2. Primary User Action
**Copiar o e-mail de suporte** com um clique — sem ser jogado para um app de e-mail nativo.

## 3. Design Direction
- **Color strategy:** Restrained nos dois lugares. Um único accent (coral-faísca `--color-accent`)
  no gesto de copiar; resto em creme/roxo-jambo/tinta. O canal não compete por atenção.
- **Scene sentence (rodapé LP):** alguém que rolou a página inteira, considerando se entra — o
  rodapé é o aperto de mão final, calmo, em luz quente de fim de página, não um segundo CTA.
- **Scene sentence (card Config):** usuário logado, focado, procurando "como peço ajuda?" entre
  outras configurações — precisa achar rápido e confiar que é monitorado.
- **Registro:** rodapé = `brand` (override da LP, conforme PRODUCT.md); card = `product`.
- **Anchors:** o padrão de card já existente em `/configuracoes` (`IdentityCard`/`LinksCard`);
  rodapés ancorados sóbrios (Linear, Stripe) — presença sem peso; brasilidade pela copy, não pelo volume.
- **Tokens:** `--background` (creme), `--card`, `--foreground`, `--muted-foreground`,
  `--color-accent` / `--color-accent-text`, `--font-display` (Fraunces) para o heading. Sem cor nova.

## 4. Scope
Production-ready. Breadth: um componente reutilizável + um rodapé + integração em 2 surfaces.
Interatividade: shipped-quality (botão copiar com feedback). Time intent: polir até shippar.

## 5. Layout Strategy
- **`ContactCard` (núcleo reutilizável):** heading curto → e-mail em destaque (texto selecionável,
  fonte legível) lado a lado com o botão "copiar" → link de LinkedIn secundário (menor, com ícone
  `ExternalLink` do Lucide, como no `LinksCard`) → microcopy de SLA em `muted-foreground` por baixo.
  Hierarquia: e-mail+copiar é o herói; LinkedIn e SLA são satélites. Mobile-first: empilha vertical;
  e-mail e botão lado a lado em telas ≥sm.
- **Rodapé LP (`Footer`):** faixa discreta ancorada ao fim, depois do `CtaSection`. Fundo sóbrio
  (creme ou roxo-jambo suave — escolher o que separa do gradiente saturado do CTA logo acima, sem
  brigar). `ContactCard` + uma linha de créditos ("Borogodó · feito no Brasil" + ano). Não é um
  segundo CTA.
- **Card Config:** `ContactCard` dentro da grade existente (`lg:grid-cols-2`), mesmo tratamento
  visual de `IdentityCard`/`LinksCard` — não inventar um card destoante.

## 6. Key States
- **Default:** e-mail + botão "copiar" + LinkedIn + SLA visíveis.
- **Copiado (sucesso):** botão troca rótulo para "copiado!" + ícone de check por ~2s, anunciado via
  `aria-live="polite"`; volta ao normal sozinho.
- **Falha de cópia** (clipboard bloqueado/indisponível): mensagem curta "não consegui copiar, o
  e-mail está aí pra selecionar"; e-mail permanece como texto selecionável. Nunca trava.
- **LinkedIn ausente:** se a URL não estiver configurada, o link some (não renderiza link quebrado).
- **i18n:** todos os textos em pt-BR e en; pt-BR é fallback.

## 7. Interaction Model
- **Clique em "copiar":** `navigator.clipboard.writeText(SUPPORT_EMAIL)` → feedback de sucesso →
  reset após timeout. Operável por teclado (Enter/Espaço), foco visível (`--ring`).
- **Hover/focus do botão:** transição CSS sutil (opacity/bg), sem Framer Motion (micro-interação).
- **Clique no LinkedIn:** abre nova aba (`target="_blank"`, `rel="noopener noreferrer"`).
- **Nenhuma interação dispara app de e-mail nativo.**

## 8. Content Requirements (namespace i18n `support`)
- `heading` — pt: "Precisa de ajuda?" · en: "Need help?"
- `emailLabel` — pt: "Fala com a gente" · en: "Get in touch"
- `copyButton` — pt: "Copiar e-mail" · en: "Copy email"
- `copied` — pt: "Copiado!" · en: "Copied!"
- `copyFailed` — pt: "Não consegui copiar, o e-mail está aí pra selecionar." · en: "Couldn't copy, the email is right there to select."
- `linkedinLabel` / `linkedinCta` — pt: "Prefere conversar? Me chama no LinkedIn" · en: "Rather chat? Find me on LinkedIn"
- `sla` (voz calorosa/pessoal, confirmada) — pt: "Tem uma pessoa de verdade do outro lado, eu mesma. Respondo em até 2 dias úteis." · en: "There's a real person on the other side, me. I reply within 2 business days."
- Créditos do rodapé: "Borogodó · feito no Brasil · {ano}".
> Copy final ajustável na implementação; respeitar voz revelador/caloroso/espirituoso, sem em dash, sem buzzword.

## 9. Recommended References (na hora de implementar)
- `reference/product.md` — para o card em Configurações.
- `reference/brand.md` — para o rodapé da LP.
- `reference/interaction-design.md` — para o botão de copiar (estados, feedback, a11y).

## 10. Open Questions
Nenhuma bloqueante. Decisões fechadas: rodapé discreto/ancorado; SLA caloroso/pessoal; color
strategy Restrained; reuso do padrão de card existente. Cor exata do fundo do rodapé (creme vs
roxo-jambo suave) é decisão de implementação, resolvida no craft contra o gradiente do CtaSection.
