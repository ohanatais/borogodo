# Phase 0 — Research: Navegação que expressa a espinha

Decisões técnicas não óbvias da reforma. Cada uma: decisão, razão, alternativas descartadas.

## R1 — Lazy-load da vista de Trajetória no Espelho

- **Decisão**: O Espelho lê `?vista=forcas|trajetoria` (default `forcas`). O **server component
  busca só os dados da vista ativa**: `getLatestSnapshot` em Forças, `getHistoricoData` em
  Trajetória. Trocar de vista = navegar para `?vista=...` (re-render no servidor). Uma casca
  client mínima (`EspelhoViews`) só controla os tabs/links e a aparência ativa.
- **Razão**: É lazy de verdade (FR-010) — quem fica em Forças nunca paga a query da Trajetória —
  e permanece RSC (constituição IV), sem fetch no cliente nem duplicar dados no bundle. Deep
  links (`?vista=trajetoria`) e o redirect da Linha do Tempo caem direto na vista certa.
- **Alternativas**: (a) Carregar as duas queries em paralelo na entrada e alternar no cliente —
  rejeitada: paga a query à toa, fere FR-010. (b) Tabs client com `next/dynamic` + route handler
  pra buscar a Trajetória sob clique — rejeitada: mais JS e uma rota de API nova sem necessidade;
  o searchParam já dá lazy server-side com menos peça.

## R2 — Redirect das rotas antigas (`localePrefix: 'never'`)

- **Decisão**: Como o i18n não prefixa locale na URL, as rotas são planas (`/historico`,
  `/espelho`). Na Fase 3, `historico/page.tsx` passa a só chamar `redirect('/espelho?vista=trajetoria')`
  (redirect do servidor do Next). Os **componentes** da Linha do Tempo continuam em `historico/`
  e passam a ser importados pela vista de Trajetória do Espelho.
- **Razão**: Redirect de servidor é o caminho nativo, 1 linha, sem 404 (FR-006/007). Preserva
  bookmarks. Reusar os componentes via import = "re-parentar sem reescrever".
- **Alternativas**: (a) `next.config` redirects — rejeitada: mais distante do código e some o
  contexto. (b) Apagar `historico/` e mover componentes pra `espelho/` — rejeitada: move arquivos
  à toa, quebra os testes existentes de path e contraria "reorganização ≠ reescrita".
- **Sequência**: o redirect entra na **Fase 3** (quando a vista de Trajetória existe). Na Fase 1,
  a Linha do Tempo só sai do menu; `/historico` segue acessível até a Fase 3 (evita estado quebrado).

## R3 — `isActive` e agrupamento de "Usar"

- **Decisão**: `isActive` segue por `pathname`. "Espelho" acende em `/espelho` (o `?vista` não
  muda o pathname, então Trajetória já acende Espelho). "Usar" acende em `/usar`, `/presenca` e
  `/autoavaliacao` (lista de prefixos do destino). Extrair um mapa `destino → prefixos` em vez de
  `includes` solto.
- **Razão**: A pessoa em Repertório ou Autoavaliação deve sentir que está em "Usar" (FR-003). Mapa
  explícito é testável e evita falsos positivos do `includes`.
- **Alternativas**: `pathname.includes(path)` cru (atual) — frágil pra agrupar 3 rotas sob 1
  destino; mantém-se a ideia mas com mapa explícito.

## R4 — Landing "Usar" (RSC leve)

- **Decisão**: `usar/page.tsx` é server component sem busca pesada: dois caminhos —
  "mostrar pra fora" → `/presenca`, "me preparar" → `/autoavaliacao` (como está hoje). Textos via
  i18n `usar.*`. Layout/identidade decididos no `/impeccable shape`.
- **Razão**: É uma bifurcação de intenção, não uma tela de dados; barata e clara (FR-004/005).
- **Alternativas**: rotear direto sem página intermediária (ex.: "Usar" abre um menu) — rejeitada:
  a spec pede uma página que distingue as duas intenções; um chooser explícito é mais legível.

## R5 — Porta de conversa do Painel (reuso do chat)

- **Decisão**: `PainelChatDoor` (client mínimo) dispara `openChatSheet({ ... mode pergunta })` —
  o mesmo evento que a barra global já usa. Fica **no topo do Painel**, somada aos cards (não
  remove nada). Sem novo motor de chat, sem persistência.
- **Razão**: Reusa o chat existente (clarify: aditiva; barra global intacta). Zero duplicação
  (constituição: DRY). Sem schema novo.
- **Alternativas**: novo componente de chat embutido no Painel — rejeitada: duplica o ChatSheet e
  contraria "chat é ferramenta onipresente, uma só".

## R6 — `impact_summary` fora das listas, intacto no motor

- **Decisão**: Remover `'impact_summary'` só de `ENTRY_FORMATS` (`PresencaCreate`) e
  `NUDGE_FORMATS` (`ProactiveInsightCard`). **Não** tocar no tipo `DraftFormat`, no enum, nem no
  banco. Rascunhos `impact_summary` já existentes continuam listando/abrindo normalmente.
- **Razão**: É o motor de `generateDraft` e de dados históricos (FR-014/015; constituição II/III).
  Cortar do tipo quebraria a geração.
- **Alternativas**: remover o formato do enum — rejeitada: quebra motor e dados; explicitamente fora.

## R7 — i18n dos labels de navegação

- **Decisão**: Ao reescrever `NAV_ITEMS`, mover os labels (hoje strings cruas) para o namespace
  `appNav` em `pt-BR.json`, com stub espelhado em `en.json`. Novos textos: `usar.*`,
  `painel.chatDoor.*`, e os rótulos das vistas do Espelho (`espelho.views.*`).
- **Razão**: Constituição IX proíbe string hardcoded; estamos tocando o menu de qualquer forma —
  é o momento de quitar a dívida sem retrofit posterior.
- **Alternativas**: manter labels hardcoded "porque já estavam" — rejeitada: viola a constituição
  e perpetua a dívida num arquivo que estamos editando.

## Conclusão

Nenhum NEEDS CLARIFICATION remanescente. Sem mudança de banco, sem nova chamada LLM, sem mover
arquivos da Linha do Tempo. Todo o risco está em (a) preservar o comportamento da Trajetória ao
re-parentar e (b) o lazy por searchParam — ambos cobertos por testes de não-regressão.
