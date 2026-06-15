# Design Brief: Presença (hub, gestão de rascunhos e sugestões)

**Skill**: `/impeccable shape` | **Date**: 2026-06-15 | **Register**: product

**Status**: Planejamento — aguardando implementação. **Reusa** os componentes de geração definidos no
shape da 013 (`GenerateSheet`, `DraftCard`, `UsarButton`, `AdjustChips`, `VoiceCalibration`,
`PresencaCreate`).

**Fonte**: `docs/conteudo-plano-de-acao.md`, `spec.md`, shape da 013, `.impeccable/design.json`.

---

## 1. Feature Summary

A Presença é a **casa** do que a pessoa publica de si e a **central** onde ela gere isso. Se a 013 é o
ato de gerar, a 014 é o lugar de voltar, **cuidar** (editar, arquivar, excluir, reencontrar) e ser
lembrada (com parcimônia) de usar o que tem. O sentimento: "tem um lugar meu, organizado, onde minha
presença profissional toma forma e fica sob meu controle".

## 2. Primary User Action

**Voltar e gerir** (abrir `/presenca`, ver, retomar, editar, arquivar, excluir, filtrar) e **Usar** a
partir de novos pontos (projeto, nudge, sugestões). O hub é leitura que recompensa; o gesto de valor
continua sendo "Usar", agora com controle total do que já existe.

## 3. Design Direction

### Tom e cena
A pessoa abre Presença e vê, calma, a lista do que já gerou: "Post sobre o lançamento na X · copiado há 3
dias". Não é um feed ansioso de métricas; é um portfólio tranquilo e arrumável. Ela arquiva o que não quer
ver agora, exclui de vez o que não serve (com uma confirmação serena, não um alarme), e filtra quando
quer reencontrar. No topo, quando faz sentido, uma faixa discreta sugere o que poderia virar conteúdo.

### Estratégia cromática (tokens, sem hex cru)
- **Hub**: superfície calma, creme (`background`); cada rascunho num card de corner levemente arredondado,
  sem card dentro de card. Status em pílula discreta (rascunho · editado · copiado · arquivado).
- **Ações de gestão**: discretas, reveladas por item (menu "···" ou linha de ações no rodapé do card).
  Arquivar e excluir convivem sem competir com "Usar".
- **Excluir (confirmação)**: tom sóbrio, não vermelho-pânico; o destaque é a clareza ("isso não tem
  volta"), não o medo.
- **Caminhos de entrada (sem rascunho)**: acento roxo-jambo nos CTAs "Usar"; nunca cinza-vazio.
- **Sugestões / nudge**: mesmo tratamento de insight proativo já existente (acento coral-faísca "✦"),
  coerente com os outros insights, nunca banner gritante.

### O hub
Lista vertical (mobile-first), paginada e filtrável. Cada `DraftListItem`: formato + ângulo (Fraunces
curto), trecho do `body`, status, data, e "Baseado em: {origem}". Ações por item: **Retomar · Copiar ·
Arquivar · Excluir** (e **Restaurar** quando arquivado). "Gerar conteúdo" sempre acessível no topo
(reusa `PresencaCreate`). Acima da lista, um `StatusFilter` discreto (Ativos · Copiados · Arquivados) e,
quando útil, formato (Post · Resumo).

### Confirmação de exclusão (`DeleteConfirm`)
Radix Dialog pequeno e centrado: "Excluir este rascunho? Isso não tem volta." + **Excluir
definitivamente** / **Cancelar**. Foco preso, ESC cancela. Só a exclusão definitiva passa por aqui;
arquivar é silencioso e reversível.

### Faixa de sugestões (`SuggestionsStrip`)
No topo do hub, "Sugestões pra você": 1 a 3 cartões discretos (nudge pendente ou ponto de partida
"tema/entrada que ainda não virou post"). Cada um abre a geração com a evidência carregada. **Some quando
não há material** — nunca um bloco de sugestões vazio.

### Usar projeto (no /historico)
No `ProjectDetailPanel`, um `UsarButton` (reuso) ao lado do projeto. Abre o `GenerateSheet` da 013 com
"Baseado em: projeto {nome} ({n} entradas)".

### Referências nomeadas
Notion (home calma e arrumável com o que é seu), Linear (listas densas mas serenas, ações por item
reveladas no hover), o próprio painel do Borogodó (insight proativo já estabelecido).

## 4. Anti-padrões a evitar (constituição VII)
Feed de métricas de vaidade (likes/views); hub vazio sem caminhos; bloco de sugestões vazio; confirmação
de exclusão em tom de alarme vermelho; arquivar pedindo confirmação (atrito desnecessário, é reversível);
excluir sem confirmação (perda acidental); card dentro de card na lista; "engaje sua audiência" e afins;
nudge a cada captura (ruído); reescrever a UI de geração em vez de reusar a da 013.

## 5. Hierarquia visual (hub `/presenca`)
1. **Título + "Gerar conteúdo"** (a ação) e, quando há material, **"Sugestões pra você"**.
2. **Filtro** discreto (status/formato) quando a lista cresce.
3. **Lista de rascunhos** (o que é seu) — ou os **caminhos de entrada** quando vazia.
4. Status/data e ações de gestão como apoio, nunca o protagonista.

## 6. Motion
- Entrada do hub, faixa de sugestões e `GenerateSheet`: Framer Motion (entrada).
- Hover/focus de itens e ações: CSS puro.
- Arquivar/excluir: transição suave de saída do item (CSS), sem layout-shift brusco; remoção otimista com
  rollback discreto em erro.
- `DeleteConfirm`: fade/scale curto na entrada (Radix + Framer leve).

## 7. Acessibilidade
Lista e ações navegáveis por teclado; menu de ações por item com labels; `DeleteConfirm` com foco preso,
ESC cancela, botão de exclusão claramente rotulado; filtro como grupo de toggles acessível; faixa de
sugestões navegável; nudge dismissível por teclado; contraste AA; toques ≥ 48px; item de nav "Presença"
com estado ativo acessível.

## 8. i18n
`presenca.*` em `pt-BR.json` (hub, ações de gestão, filtros, confirmação, sugestões, nudge), `en.json`
espelha. Zero hardcoded.

## 9. Microcopy-chave (pt-BR)
| Contexto | Texto |
|---|---|
| Nav | "Presença" |
| Título do hub | "Presença" |
| Gerar | "Gerar conteúdo" |
| Item — origem | "Baseado em: {origem}" |
| Status | "Rascunho" · "Editado" · "Copiado" · "Arquivado" |
| Ações | "Retomar" · "Copiar" · "Arquivar" · "Excluir" · "Restaurar" |
| Filtro | "Ativos" · "Copiados" · "Arquivados" · "Post" · "Resumo" |
| Confirmar exclusão | "Excluir este rascunho? Isso não tem volta." · "Excluir definitivamente" · "Cancelar" |
| Sugestões | "Sugestões pra você" |
| Vazio — convite | "Comece por um tema do seu espelho" · "Use um projeto da sua linha do tempo" |
| Usar projeto | "Usar este projeto" |
| Nudge | "✦ Isso daria um bom post" + "Usar" |

## 10. Checklist de saída (a validar no `/impeccable audit`)
- [ ] Hub nunca vazio sem caminhos de entrada (sempre com evidência).
- [ ] Lista paginada e filtrável; arquivados nunca aparecem na lista ativa; sem layout-shift ao arquivar/excluir.
- [ ] Arquivar é reversível e silencioso; excluir é definitivo e sempre confirmado.
- [ ] Faixa de sugestões aparece com material e some sem material; nunca gera sozinha.
- [ ] Nudge coerente com os insights existentes; parcimonioso; dismissível; nunca gera sozinho.
- [ ] "Usar" funciona em tema, entrada e projeto, reusando o `GenerateSheet` da 013.
- [ ] Item de nav "Presença" coerente em mobile e desktop, sem brigar com a barra da 012-chat.
- [ ] 375px; toques 48px; foco visível (incl. `DeleteConfirm`); contraste AA; tokens (sem hex); zero string hardcoded.
