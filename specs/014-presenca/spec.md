# Feature Specification: Presença (hub e costura)

**Feature Branch**: `014-presenca`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada / batch)

**Input**: Segundo elo da cadeia de Geração de Conteúdo (epic plan
`docs/conteudo-plano-de-acao.md`). Tira a geração do silo e a costura no ecossistema: cria a rota
`/presenca` (hub com os rascunhos persistidos), adiciona o item de nav, estende o ponto de entrada
"Usar" para o **projeto** da Linha do Tempo, e liga o **nudge proativo** "isso daria um post"
(reusando `proactive_insights`). É a mecânica de retorno episódico do bloco.

> **Depende da 013**: usa a tabela `drafts`, o motor `generateDraft` e os componentes de geração
> (`GenerateSheet`, `DraftCard`, `UsarButton`, etc.) definidos no shape da 013. **Não começa antes de
> a fundação da 013 existir** (mesmo num batch, esta é a ordem).

## Clarifications

### Session 2026-06-15 (kickoff do bloco)

- Q: Label e rota do hub? → A: **"Presença"** em `/presenca`, novo item em `NAV_ITEMS` do
  `AppShellClient.tsx` (hoje: painel, espelho, historico — 4º item).
- Q: O hub precisa de tabela nova? → A: **Não.** Lê de `drafts` (013) e de `proactive_insights`
  (existente). `seed_type='project'` já está no CHECK de `drafts` (013), então "Usar no projeto" não
  exige migration. **014 não adiciona migration.**
- Q: O nudge "isso daria um post" é uma tabela nova? → A: **Não.** Reusa `proactive_insights`
  (`type` é texto livre) com um novo valor de `type` (ex: `'content_opportunity'`); o disparo entra no
  `triggerProactiveInsight` que já existe como stub.
- Q: O nudge regera/gera o post sozinho? → A: **Não.** Ele só **sugere** ("isso daria um post") e
  leva ao fluxo de geração da 013 com a evidência carregada. Sem geração automática às costas do
  usuário (controle e custo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Hub da Presença: ver e retomar meus rascunhos (Priority: P1)

A pessoa abre **Presença** na navegação e encontra um lugar só dela: os rascunhos que já gerou
(post e resumo de impacto), com status (rascunho, copiado), data e a evidência que os originou. Ela
pode **retomar** um rascunho (reabrir no fluxo de edição da 013), **copiar** de novo, **descartar**, ou
**gerar um novo** a partir dali. O hub nunca está vazio de propósito: quando ainda não há rascunho,
mostra os caminhos de entrada (um tema do espelho, uma entrada, um projeto) com evidência — nunca uma
página em branco.

**Why this priority**: Sem um lugar de retorno, a geração da 013 é um ato isolado que a pessoa esquece.
O hub transforma "gerei um post uma vez" em "este é o lugar onde eu cuido da minha presença". É a
mecânica de retenção do bloco.

**Independent Test**: Com a conta QA que já gerou rascunhos na 013, abrir `/presenca` → ver a lista
persistida com status e evidência; retomar um, copiar, descartar; confirmar que o estado reflete na UI.

**Acceptance Scenarios**:

1. **Given** um usuário com rascunhos em `drafts`, **When** abre `/presenca`, **Then** vê a lista
   ordenada por mais recente, cada item com formato, status, data e a evidência de origem.
2. **Given** o hub aberto, **When** o usuário retoma um rascunho, **Then** reabre no fluxo de edição da
   013 com o `body` e o ângulo preservados.
3. **Given** um usuário sem nenhum rascunho ainda, **When** abre `/presenca`, **Then** vê os caminhos
   de entrada com evidência (tema/entrada/projeto), nunca uma página/prompt em branco.
4. **Given** um rascunho de outro usuário, **When** uma query é feita, **Then** a RLS de `drafts`
   impede o acesso.

### User Story 2 — Usar um projeto inteiro da Linha do Tempo (Priority: P1)

Na Linha do Tempo (`/historico`), ao abrir um **projeto** (que agrupa várias entradas de uma empresa),
a pessoa vê um botão **"Usar"**. O motor da 013 gera conteúdo a partir do **projeto como seed**
(`seed_type='project'`), reunindo a evidência de todas as entradas daquele projeto — um material mais
rico que uma entrada só. Isso amplia os pontos de entrada sem mudar o motor.

**Why this priority**: O projeto é a unidade de orgulho natural ("o lançamento que eu liderei"). Gerar
a partir dele dá o melhor input de evidência e cobre o caso de uso mais forte de post/resumo. É a
costura entre o histórico (Provar) e a presença (Usar).

**Independent Test**: Abrir um projeto com 2+ entradas no `/historico`, clicar "Usar" → o fluxo da 013
abre com a evidência agregada do projeto; gerar post e resumo de impacto válidos citando entradas do
projeto.

**Acceptance Scenarios**:

1. **Given** um projeto com múltiplas entradas, **When** o usuário clica "Usar" no projeto, **Then** o
   `GenerateSheet` abre com `seed_type='project'` e a evidência agregada das entradas daquele projeto.
2. **Given** a geração a partir de um projeto, **When** o post é gerado, **Then** as afirmações citam
   evidência de entradas reais do projeto (sem misturar entradas de outro projeto/empresa).

### User Story 3 — Nudge proativo "isso daria um post" (Priority: P2)

Quando a pessoa captura uma entrada forte (alto sinal de impacto), o produto, de forma proativa e
discreta, sugere: **"isso daria um post"** — um insight no painel (reusando `proactive_insights`) que
leva ao fluxo de geração com aquela entrada já carregada. A sugestão nunca gera nada sozinha; ela
convida. Aparece com parcimônia (não a cada captura), para não virar ruído.

**Why this priority**: Fecha o loop de retorno episódico: o produto lembra a pessoa de usar o que ela
acabou de registrar, no momento de maior orgulho. Mas o valor central (hub + usar projeto) existe sem
ele; por isso P2.

**Independent Test**: Capturar uma entrada forte com a conta QA → confirmar que um insight
`content_opportunity` é gerado e aparece no painel com CTA que abre a geração com a entrada carregada;
capturar entradas fracas → confirmar que o nudge **não** dispara toda hora.

**Acceptance Scenarios**:

1. **Given** uma captura com sinal de impacto alto, **When** o pipeline de insights roda, **Then** um
   `proactive_insight` do tipo `content_opportunity` é criado para aquela entrada.
2. **Given** o nudge exibido no painel, **When** o usuário clica nele, **Then** abre o fluxo de geração
   da 013 com a entrada carregada como seed.
3. **Given** capturas de baixo sinal, **When** o pipeline roda, **Then** o nudge não é disparado
   (parcimônia: limite por janela de tempo / por sinal).

### Edge Cases

- **Hub com muitos rascunhos**: lista paginada/limitada (não query ilimitada — performance).
- **Rascunho cuja entrada/tema de origem foi apagado**: o hub ainda mostra o `body` salvo; a evidência
  de origem degrada com elegância ("origem indisponível"), sem quebrar.
- **Projeto com 1 entrada só**: "Usar" no projeto se comporta como "Usar" na entrada (mesmo motor).
- **Nudge repetido**: no máximo 1 nudge de conteúdo por janela (ex: por dia ou por captura forte), e
  marca `seen` ao ser interagido, como os outros insights.
- **Conflito de superfície com a 012-chat**: a barra de captura tem o toggle registrar/perguntar; o
  item de nav "Presença" entra sem brigar com isso (revalidar na implementação).

## Requirements *(mandatory)*

### Functional Requirements

#### Hub e navegação
- **FR-001**: O sistema MUST adicionar a rota `/presenca` e um item **"Presença"** em `NAV_ITEMS` do
  `AppShellClient.tsx`, mantendo a navegação coerente em mobile e desktop.
- **FR-002**: O hub MUST listar os rascunhos do usuário (de `drafts`), ordenados por mais recente, com
  formato, status, data e a evidência de origem; a query MUST ser paginada/limitada e escopada por
  `user_id` (RLS).
- **FR-003**: Os usuários MUST conseguir, no hub, **retomar** (reabrir no fluxo de edição da 013),
  **copiar** e **descartar** (`status='discarded'`) um rascunho.
- **FR-004**: O hub MUST nunca apresentar uma página/prompt em branco: sem rascunhos, oferece os
  caminhos de entrada (tema, entrada, projeto) com evidência.

#### Usar projeto
- **FR-005**: A Linha do Tempo (`/historico`) MUST expor um botão **"Usar"** no nível de **projeto**,
  abrindo o fluxo da 013 com `seed_type='project'` e a evidência agregada das entradas do projeto.
- **FR-006**: A geração a partir de projeto MUST usar apenas entradas daquele projeto/empresa (sem
  vazar evidência de outro projeto).

#### Nudge proativo
- **FR-007**: O sistema MUST gerar um `proactive_insight` do tipo `content_opportunity` quando uma
  captura tem sinal de impacto alto, reusando o pipeline `triggerProactiveInsight`.
- **FR-008**: O nudge MUST apenas sugerir (levar ao fluxo de geração com a evidência carregada), nunca
  gerar conteúdo automaticamente.
- **FR-009**: O nudge MUST respeitar parcimônia (no máximo 1 por janela de tempo / por sinal forte) e
  marcar `seen` ao ser interagido.

#### Plataforma (constituição)
- **FR-010**: Toda string de UI MUST viver em `pt-BR.json` (`presenca.*`), `en.json` espelhando. Zero
  string hardcoded.
- **FR-011**: Toda query MUST filtrar por `auth.uid() = user_id`; IDs internos MUST NOT vazar.
- **FR-012**: O hub e o nudge MUST reusar os componentes de geração da 013, sem duplicar o motor.

### Key Entities *(include if feature involves data)*

- **Draft** (de 013, `drafts`): a fonte da lista do hub. Sem alteração de schema.
- **ProactiveInsight** (`proactive_insights`, existente): ganha o valor de `type`
  `'content_opportunity'`. Sem migration (type é texto livre).
- **Project** (derivado de `entries` agrupadas, via `getHistoricoData`): o seed agregado de "Usar
  projeto". Não é tabela nova; é a visão de projeto já existente no histórico.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa encontra todos os rascunhos que gerou em `/presenca`, com status e evidência,
  sem nenhum item de outro usuário (RLS testada com 2 contas).
- **SC-002**: "Usar" funciona nos três seeds (tema, entrada, projeto) com o mesmo motor da 013.
- **SC-003**: O nudge `content_opportunity` dispara para captura forte e **não** dispara para captura
  fraca (precisão testável por fixture de sinal).
- **SC-004**: Nenhuma superfície da Presença mostra página/prompt em branco.
- **SC-005**: Cobertura ≥ 80% nas queries/listagem e no disparo do nudge.

## Assumptions

- A fundação da 013 (`drafts`, `generateDraft`, componentes de geração) existe antes da 014 (ordem da
  cadeia, mesmo num batch).
- `proactive_insights` e `triggerProactiveInsight` (stub) são a infra do nudge; o sinal de "captura
  forte" reusa o que a extração/insights já calculam (impacto/métrica).
- `getHistoricoData` já fornece a estrutura de projeto agrupado por empresa; "Usar projeto" lê dali.
- A 014 não adiciona migration (confirmado no kickoff).

## Out of Scope

- Loop de refino de voz e mini-bio (→ 015).
- Evals de golden set no CI (→ 015).
- Publicação direta no LinkedIn / agendamento.
- Geração automática pelo nudge (ele só sugere).
- Edição da lógica do motor da 013 (a 014 só costura e reusa).
