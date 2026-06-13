# Research: Painel Principal

**Feature**: `005-panel-dashboard` | **Date**: 2026-06-07

## Decisões técnicas

### D1 — Página como Server Component com Promise.all
**Decisão**: `/painel/page.tsx` é RSC e faz 4 leituras em paralelo (contagem, recentes, mirror, insight).
**Racional**: render perto do dado, mínimo JS no client, valor acima da dobra ≤ 1 s (Princípio IV).
**Alternativas rejeitadas**: client-side fetching — mais JS, mais lento, pior LCP.

### D2 — Captura resolve "pra cima" via router.refresh()
**Decisão**: a `CaptureConversation` (client) chama `/api/capture`, e ao resolver faz `router.refresh()`,
revalidando o RSC do painel — indicadores sobem sem virar log de chat.
**Racional**: o princípio de fluxo do produto (composer escreve, espelho lê). Doc 002.
**Alternativas rejeitadas**: estado client acumulando bolhas — vira log, contraria o produto.

### D3 — Superfície de captura desacoplada (reuso por 006)
**Decisão**: `capture/*` recebe `placeholder` + callbacks; sem lógica do painel embutida.
**Racional**: o onboarding (006) reusa a mesma superfície; acoplar quebraria o reuso.

### D4 — Áudio/imagem desabilitados, não removidos
**Decisão**: `AudioButton` e o botão de imagem ficam no JSX, `disabled`, com tooltip "em breve".
**Racional**: ativar depois é trocar `disabled` + preencher o ramo da rota (003). Decisão de escopo MVP.

### D5 — `triggerProactiveInsight` com Haiku (preenche stub de 003)
**Decisão**: o job usa Haiku (estruturação leve) para detectar skill invisível/padrão/conexão/gap a
partir de entradas recentes, valida (Zod) e insere em `proactive_insights`. Mesma assinatura do stub.
**Racional**: insight proativo é estruturação, não síntese profunda (Sonnet fica no espelho).
**Constituição III**: Haiku para extração/estruturação; saída validada antes de persistir.

### D6 — Card de insight nunca vazio
**Decisão**: `ProactiveInsightCard` retorna `null` quando não há insight não visto.
**Racional**: "nunca renderiza vazio" (doc 002); evita ruído visual.

### D7 — Framer Motion só na entrada do sheet
**Decisão**: entrada da `CaptureConversation` e revelação do reflexo com Framer Motion; hover/focus em CSS.
**Racional**: Princípio IV/VIII — micro-interações em CSS; Motion só para entrada/transições complexas.

### D8 — i18n desde a fundação
**Decisão**: todas as strings (placeholders, status, microcopy do reflexo) em `pt-BR.json` antes de codar UI.
**Racional**: Princípio IX — i18n na fase Foundational, nunca retrofitada.

## Riscos / atenção

- **Dependência de 003/004**: rebase em `main` antes de implementar; `/api/capture` e `mirror_snapshots` precisam existir.
- **`service_role` no job de insight**: filtrar `user_id` sempre; nunca no client.
- **Mobile 375px**: o composer sticky + sheet em tela precisam de teste real no viewport pequeno.
- **Acessibilidade do sheet**: foco preso (focus trap), `aria` adequado, ESC fecha.
