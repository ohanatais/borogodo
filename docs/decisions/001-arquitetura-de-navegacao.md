# 001 — Arquitetura de navegação: o menu expressa a espinha (6 → 4 portas)

- **Data:** 2026-06-22
- **Status:** decidido
- **Feature:** `021-navegacao-espinha`
- **Objetivo core que isso serve:** **retenção + valor percebido.** O menu cresceu feature a
  feature e virou 6 portas paralelas que misturam camadas — a pessoa não sente a espinha do
  produto e adivinha onde clicar. Navegação ilegível corrói retenção (a pessoa não acha o
  valor) e dilui o wedge (o payoff episódico fica enterrado). Uma IA que expressa a espinha
  torna o valor óbvio e dá ao Painel o papel de motor de retorno.

## Contexto

A camada "Usar" ia ser re-arquitetada (Repertório vs. Preparar), mas a investigação contra a
`main` real revelou um problema maior: o app tem **6 portas** (Painel, Espelho, Registros,
Linha do Tempo, Repertório, Autoavaliação) + Configurações, que misturam input (Registros),
revelação (Espelho), mapa (Linha do Tempo) e output (Repertório, Autoavaliação). "Registros" e
"Linha do Tempo" soam iguais pro usuário. O produto **declara** uma espinha em
`product-context.md` — Descobrir → Entender → Provar → Usar — mas o menu não a expressa.

**Estudado na `main` (verificado, jun/2026):**
- `AppShellClient.tsx` — `NAV_ITEMS` = 6 portas; `/presenca` já rotulado "Repertório";
  Autoavaliação já é porta própria (019/PR #46, mergeada); `isActive` usa `pathname.includes`;
  a barra `Registrar | Perguntar` (chat) é global, escondida só em `/autoavaliacao`.
- `getHistoricoData.ts` + `historico/` — Linha do Tempo = mapa estruturado empresa→cargo→projeto
  com bullets; a "visão de projetos" é o `ProjectDetailPanel`, dirigido por estado interno do
  `HistoricoPageClient` (`activeProject`). É **interpretação**, não log.
- `feed/` + `registros` — Registros = feed cru buscável (fonte/empresa/tag/data). É **input**.
- `ChatSheet.tsx` — chat já é global, modos Registrar/Perguntar (consulta o espelho com
  citações/sugestões, pode virar correção/marco), **efêmero** (sem tabela de histórico).
- `content.ts` — `impact_summary` é valor de enum (motor); oferecido pelado em
  `PresencaCreate.tsx` (`ENTRY_FORMATS`) e `ProactiveInsightCard.tsx` (`NUDGE_FORMATS`).
- `017-repertorio-intencao` — spec **nunca mergeada** (morta). Esta decisão a supersede.

## Decisão

**Colapsar o menu de 6 → 4 destinos, cada um = um movimento da espinha:**

1. **Painel** — a Home / centro de gravidade (estruturada e proativa).
2. **Espelho** — "me entender": absorve a **Linha do Tempo** como segunda vista (forças +
   trajetória). A Linha do Tempo deixa de ser porta própria.
3. **Registros** — o log cru de input / buscar uma captura.
4. **Usar** — output: reúne **Repertório** (pra fora: post/bio) + **Me preparar**
   (Autoavaliação generalizada, pra dentro). \+ Configurações no rodapé.

### Princípios que a reforma fixa (valem pra toda feature futura)

- **A Home é estruturada e proativa.** O **chat é ferramenta onipresente, nunca a Home.** Uma
  porta conversacional ("fala com o seu borogodó") vive no **topo do Painel** e abre o chat já
  enquadrado — dá o feeling conversacional sem esconder o acúmulo. Nada de modal de chat central
  que toma a tela (padrão Gemini/Claude). **Por quê:** o valor do Borogodó é o artefato durável
  (espelho, mapa, repertório, evidência), não a conversa; chat-first esconderia o moat e mataria
  o motor de retorno proativo.
- **O menu nasce da espinha, não da ordem das features.**
- **Reorganização ≠ reescrita.** Onde uma porta some, a *função* sobrevive (re-parentar
  componentes existentes), não se reescreve a tela.

## Escopo de execução (como isso vira trabalho)

A reforma é **uma única feature faseada** — `021-navegacao-espinha` — rodada num `implement`
só. As fases são fronteiras testáveis e commitáveis, em ordem de dependência:

| Fase | O quê | Critério de pronto (gate) |
|---|---|---|
| **1 — Menu 6→4 + landing Usar** | `NAV_ITEMS` = Painel/Espelho/Registros/Usar. Nova rota `/usar` (server component leve) que roteia pra Repertório (pra fora) ou Me preparar/Autoavaliação (pra dentro). Linha do Tempo sai do menu. `isActive` ajustado. Redirects de `/historico` (→ `/espelho?vista=trajetoria`) — rotas antigas nunca 404. | rotas antigas redirecionam; nav destaca o destino certo (inclusive em sub-vistas); landing Usar roteia pros dois lados |
| **2 — Cortar `impact_summary` pelado** | Remover de `ENTRY_FORMATS` e `NUDGE_FORMATS`. **Mantém o enum/tipo/banco** (motor por baixo intacto). | listas não oferecem `impact_summary`; `generateDraft` e o banco seguem funcionando |
| **3 — Espelho absorve Trajetória** | `/espelho` vira casca com 2 vistas: "Forças" (`MirrorContent`, atual) ↔ "Trajetória" (re-parenta `HistoricoPageClient` **inteiro**, sem reescrever). Lazy-load: só "Forças" na entrada; trajetória busca `getHistoricoData` sob demanda ao abrir a aba. | as 2 vistas funcionam; `ProjectDetailPanel` (drill-down de projeto) abre intacto; entrada não paga as 2 queries |
| **4 — Painel como Home** | Porta conversacional no topo (abre o chat enquadrado); curar o que a Home mostra (insight proativo, "review chegando", acúmulo). Chat segue ferramenta, nunca vira a Home. | Home cura o que mostra (não vira gaveta); campo conversacional abre o chat; chat global intacto |

**Fora deste run — feature futura separada:** **Me preparar** (generalizar a Autoavaliação de
"só review" pra momentos: review + entrevista + 1:1 + pleitear aumento; fluxo momento→chat
enquadrado; instrumentação `qa.moment`; reusa o playbook de porta-fria — recap + check-in +
nudge). **Por quê separar:** é a única peça **produto-novo** (não mecânica) e é o **wedge** —
misturá-la no run mecânico dilui justo o que mais importa e força validar produto-novo no meio
de um refactor. Merece seu próprio ciclo (provavelmente `/product-north` antes da spec). Na
Fase 1 a landing Usar aponta pra Autoavaliação **como ela é hoje**; a generalização vem depois.

## Otimizações necessárias (a lista real — sem migration, sem reescrita de página)

1. **Lazy-load da 2ª vista do Espelho** — não carregar `getLatestSnapshot` + `getHistoricoData`
   juntos na entrada; trajetória busca sob demanda. (lente: vercel-react-best-practices.)
2. **Redirects** das rotas antigas (`/historico`; reavaliar `/presenca`) — não quebrar bookmarks.
3. **`isActive`** — Linha do Tempo deixa de ser rota; o highlight de "Espelho" precisa acender
   também em `?vista=trajetoria`.
4. **Segurança do enum** — cortar `impact_summary` só das listas oferecidas, **nunca** do tipo
   nem do banco (quebraria `generateDraft`).

## Alternativas consideradas

- **Não fazer / mínimo** — só organizar o Repertório por intenção, manter 6 portas. Rejeitada:
  não resolve a ilegibilidade nem o "soam iguais"; o wedge segue sem casa nomeada.
- **Opção A — Linha do Tempo dentro do Espelho** ✅ **escolhida.** A trajetória é interpretação
  (pilar "Entender") → mora junto da revelação; Registros fica como input puro.
- **Opção B — Histórico unificado (Registros + Linha do Tempo)** — fundir os dois "olhar meu
  passado". Defensável (instinto inicial), mas mistura input cru com narrativa interpretada.
- **Duas portas novas (Conteúdo + Preparar)** — rejeitada: 7–8 portas (Hick); "Conteúdo" é nome
  genérico de SaaS (marca proíbe); regrediria a separação que a `main` já tem.
- **Chat-first (caixa de conversa como Home)** — rejeitada: esconde o moat → "wrapper de GPT"
  (falha de marca); cold-start a cada abertura mata o retorno proativo; exigiria persistir o chat
  (hoje efêmero) = semanas + decisão de privacidade dura.
- **Trocar de framework SDD (ex.: tech-leads-club / PBB)** — rejeitada: conceitualmente igual ao
  speckit (specify→plano→tasks→implement); o speckit é load-bearing nos hooks/CLAUDE.md/19
  features; o diferencial "memória persistente" já é resolvido por `tasks.md` + hooks. Switch =
  custo alto, benefício ~zero pra este trabalho.

## Por que esta (e o steelman do oposto)

O menu deveria nascer da espinha do produto. A Linha do Tempo é interpretação da carreira
(empresa→cargo→projeto com destaques), então pertence ao lado de "me ver" (Espelho), não ao log
cru. Juntar revelação + trajetória cria um mundo coerente de autoconhecimento e deixa Registros
sendo o que de fato é: a camada de input/busca.

**Steelman do B (revisável depois):** pro usuário leigo, "Espelho" pode não ser o lugar óbvio
pra *procurar* "o que fiz na empresa X". Se as pessoas vão à Linha do Tempo **procurando coisa**
(e não contemplando trajetória), ela pertence a Registros e A enterra a função. O teste é o
verbo: "me entender" (→ A) ou "achar um registro" (→ B). A aposta é A; se o uso mostrar gente
caçando registro lá, reavaliar pra B.

## Riscos e o que os mitiga

1. **Espelho fica denso** (revelação + mapa). Mitiga: as 2 vistas já existem; viram toggle/seções,
   não amontoado. Validar legibilidade no `/impeccable shape`.
2. **Big-bang trava.** Mitiga: fases testáveis + commit por fase + `tasks.md` resumível (os hooks
   já forçam estado durável). A Fase 1 entrega melhora sentida sem reescrever página.
3. **Perder a função ao fundir** (trajetória sumir dentro do Espelho). Mitiga: a porta some, a
   função não — Forças **e** Trajetória sobrevivem como vistas; `ProjectDetailPanel` intacto.
4. **Painel virar gaveta** ao ser "fortalecido". Mitiga: fortalecer = curar o que aparece, não
   empilhar (a Home do LinkedIn é forte por fazer uma coisa bem).

## Pontas soltas (resolver no `/impeccable shape`, não bloqueiam a spec)

- **Naming "Usar" vs. "Repertório":** o menu diz "Usar" e a sub-seção diz "Repertório" — uma
  palavra a mais. Ou "Repertório" nomeia o mundo pra-fora dentro de Usar, ou se aposenta.
- **Rótulos das vistas do Espelho** ("Forças"/"Trajetória" são provisórios).

## Como saber se acertamos

- **Legibilidade:** queda em "abrir a porta errada e voltar" (idas e voltas entre
  Espelho/Registros na mesma sessão).
- **Retorno:** Painel como ponto de entrada das sessões + cliques saindo dele pras outras portas.
- **Uso da trajetória:** a vista de Trajetória dentro do Espelho continua sendo aberta (se cair a
  zero, B estava certo — reavaliar).
- Reavaliar depois da Fase 3, com uso real de algumas semanas.

## Próximo passo

Handoff pro speckit (em andamento). Reforma = **uma feature faseada** (`021-navegacao-espinha`);
Me preparar é feature futura separada. Spec em `specs/021-navegacao-espinha/spec.md`.
