# Design Brief: Presença (hub e costura)

**Skill**: `/impeccable shape` | **Date**: 2026-06-15 | **Register**: product

**Status**: Planejamento — aguardando implementação. **Reusa** os componentes de geração definidos no
shape da 013 (`GenerateSheet`, `DraftCard`, `UsarButton`, `AdjustChips`, `VoiceCalibration`).

**Fonte**: `docs/conteudo-plano-de-acao.md`, `spec.md`, shape da 013, `.impeccable/design.json`.

---

## 1. Feature Summary

A Presença é a **casa** do que a pessoa publica de si. Se a 013 é o ato de gerar, a 014 é o lugar de
**voltar**: ver o que já criou, retomar, e ser lembrada (com parcimônia) de usar o que acabou de
registrar. O sentimento: "tem um lugar meu onde minha presença profissional vai tomando forma".

## 2. Primary User Action

**Voltar e retomar** (abrir `/presenca`, ver rascunhos, retomar/copiar) e **Usar** a partir de novos
pontos (projeto, nudge). O hub é leitura que recompensa; o gesto de valor continua sendo "Usar".

## 3. Design Direction

### Tom e cena
A pessoa abre Presença e vê, calma, a lista do que já gerou: "Post sobre o lançamento na X — copiado
há 3 dias". Não é um feed ansioso de métricas; é um portfólio tranquilo do que ela está construindo.
Quando ainda não há nada, em vez de vazio, vê convites com evidência: "Comece por um tema do seu
espelho" / "Use um projeto da sua linha do tempo".

### Estratégia cromática (tokens, sem hex cru)
- **Hub**: superfície calma, creme (`background`); cada item de rascunho num card com corner
  levemente arredondado, sem card dentro de card. Status em pílula discreta (rascunho/copiado).
- **Caminhos de entrada (estado sem rascunho)**: acento roxo-jambo nos CTAs "Usar"; nunca cinza-vazio.
- **Nudge no painel**: usa o mesmo tratamento de insight proativo já existente (acento coral-faísca
  "✦"), coerente com os outros insights — não um banner novo gritante.

### O hub
Lista vertical (mobile-first), paginada. Cada `DraftListItem`: formato + ângulo (Fraunces curto),
trecho do `body`, status, data, e "Baseado em: {origem}". Ações por item: retomar, copiar, descartar.
"Gerar novo" sempre acessível no topo, levando aos caminhos de entrada (com evidência).

### Usar projeto (no /historico)
No `ProjectDetailPanel`, um `UsarButton` (reuso) ao lado do projeto. Abre o `GenerateSheet` da 013 com
"Baseado em: projeto {nome} ({n} entradas)". Deixa claro que a evidência é o projeto inteiro.

### Nudge
Card de insight no painel (mesma linguagem dos insights existentes): "✦ Isso daria um bom post" +
1 linha do porquê + CTA "Usar". Discreto, parcimonioso, dismissível (marca `seen`). Nunca gera sozinho.

### Referências nomeadas
Notion (home calma com o que é seu), o próprio painel do Borogodó (insight proativo já estabelecido),
Linear (listas densas mas serenas).

## 4. Anti-padrões a evitar (constituição VII)
Feed de métricas de vaidade (likes/views); hub vazio sem caminhos; banner de nudge gritante destoando
dos insights; card dentro de card na lista; "engaje sua audiência" e afins; nudge a cada captura
(ruído); reescrever a UI de geração em vez de reusar a da 013.

## 5. Hierarquia visual (hub `/presenca`)
1. **Título + "Gerar novo"** (a ação).
2. **Lista de rascunhos** (o que é seu) — ou os **caminhos de entrada** quando vazia.
3. Status/data como apoio, nunca o protagonista.

## 6. Motion
- Entrada do hub e do `GenerateSheet`: Framer Motion (entrada).
- Hover/focus de itens e ações: CSS puro.
- Descartar: transição suave de saída do item (CSS), sem layout-shift brusco.

## 7. Acessibilidade
Lista navegável por teclado; cada ação (retomar/copiar/descartar) com label; foco visível; nudge
dismissível por teclado; contraste AA; toques ≥ 48px; item de nav "Presença" com estado ativo acessível.

## 8. i18n
`presenca.*` em `pt-BR.json` (hub, ações, estados vazios, nudge), `en.json` espelha. Zero hardcoded.

## 9. Microcopy-chave (pt-BR)
| Contexto | Texto |
|---|---|
| Nav | "Presença" |
| Título do hub | "Sua presença" |
| Gerar novo | "Gerar novo" |
| Item — origem | "Baseado em: {origem}" |
| Status | "Rascunho" · "Copiado" |
| Ações | "Retomar" · "Copiar" · "Descartar" |
| Vazio — convite | "Comece por um tema do seu espelho" · "Use um projeto da sua linha do tempo" |
| Usar projeto | "Usar este projeto" |
| Nudge | "✦ Isso daria um bom post" + "Usar" |

## 10. Checklist de saída (a validar no `/impeccable audit`)
- [ ] Hub nunca vazio sem caminhos de entrada (sempre com evidência).
- [ ] Lista paginada; sem query ilimitada; sem layout-shift ao descartar.
- [ ] Nudge coerente com os insights existentes; parcimonioso; dismissível; nunca gera sozinho.
- [ ] "Usar" funciona em tema, entrada e projeto, reusando o `GenerateSheet` da 013.
- [ ] Item de nav "Presença" coerente em mobile e desktop, sem brigar com a barra da 012-chat.
- [ ] 375px; toques 48px; foco visível; contraste AA; tokens (sem hex); zero string hardcoded.
