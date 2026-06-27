# Design Brief — Reforma de navegação 021 (3 superfícies)

**Status**: ✅ confirmado (shape, 2026-06-22) · Register: **product** · Cor: **Restrained** (tokens existentes)

Shape das três superfícies de UI nova/reorganizada. Reorganização, não reescrita — reusa
`HistoricoPageClient`, `MirrorContent`, `ChatSheet` e o pill-toggle existente.

## Decisões confirmadas

| Decisão | Confirmado |
|---|---|
| Landing "Usar" — nomes dos dois caminhos | **Conteúdo** (pra fora → `/presenca`) + **Preparo** (pra dentro → `/autoavaliacao`) |
| Espelho — troca de vista | **Segmented control** (mesmo padrão do pill `Registrar\|Perguntar`), rótulos **Forças** / **Trajetória** |
| Painel — porta de conversa | **Logo abaixo do hero** (BorogodoCard), faixa única convidativa, aditiva |

> Nota de marca registrada: "Conteúdo" foi escolhido cientemente apesar de ser mais literal/SaaS
> que "Repertório" — risco baixo por ser label de card dentro de "Usar", não porta de menu.

## 1. Landing "Usar" (`/usar`)

- **Layout**: dois caminhos **lado a lado** (empilha no mobile), peso visual igual — **não**
  card-grid repetido. Diferenciar as duas zonas por temperatura cromática (tokens): ex. Conteúdo
  num tom, Preparo noutro (lilas-névoa / mel ou teal), sem hex cru.
- **Conteúdo** → `/presenca`. Linha de "quando": "mostrar seu valor pra fora — post, bio."
- **Preparo** → `/autoavaliacao`. Linha de "quando": "chegar pronto num momento — review, entrevista."
- **Estados**: default; hover (elevação sutil); focus visível; alvo ≥48px. Sem empty/loading (RSC leve).
- **i18n** `usar.*`: título, 2 nomes (Conteúdo/Preparo), 2 linhas de "quando".

## 2. Espelho com 2 vistas (`/espelho?vista=`)

- **Controle**: segmented no topo (sob o título), **Forças** (default) ↔ **Trajetória**.
  `role="tablist"`/`tab`, foco por teclado, alvo ≥48px.
- **Forças** = `MirrorContent` atual. **Trajetória** = `HistoricoPageClient` inteiro (re-parent),
  com `ProjectDetailPanel` intacto.
- **Lazy**: só a vista ativa busca dados; Trajetória mostra **skeleton** ao carregar (não spinner).
- **Estados**: Forças default · Trajetória lazy/skeleton · vazios reusam os existentes de cada tela.
- **i18n** `espelho.views.*`: "Forças", "Trajetória".

## 3. Porta de conversa do Painel

- **Posição**: ReviewCycleInvite → **BorogodoCard (hero)** → **PainelChatDoor** → grid atual.
  O hero de identidade continua sendo a primeira coisa; a porta vem logo abaixo.
- **Forma**: faixa única, largura do conteúdo, claramente "abre conversa" (campo convidativo, não
  um card a mais). Aditiva — **não** remove nem reordena cards (FR-012).
- **Ação**: clicar/focar dispara `openChatSheet` (modo pergunta). Barra global `Registrar|Perguntar`
  **intacta** em todas as páginas. Transição 150–250ms; `prefers-reduced-motion` = crossfade/instant.
- **i18n** `painel.chatDoor.*`: placeholder convidativo (ex.: "Pergunte ao seu borogodó…").

## Princípios transversais (constituição)

- Tokens de cor (sem hex cru); Fraunces só em display, corpo em sans; **mobile-first 375px**;
  WCAG AA (foco visível, 48×48, hierarquia); **i18n sem string hardcoded**; RSC por padrão.
- Register product: consistência > surpresa; familiaridade é virtude; motion só comunica estado.

## Referências de implementação

`layout.md` (zonas do Usar sem card-grid), `adapt.md` (segmented + 375px), `clarify.md` (microcopy
Conteúdo/Preparo e linhas de "quando"), `animate.md` (troca de vista + hover, com reduced-motion).
