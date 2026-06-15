# Feature Specification: Presença (hub, gestão de rascunhos e sugestões)

**Feature Branch**: `014-presenca`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada / PR próprio)

**Input**: Segundo elo da cadeia de Geração de Conteúdo (epic plan
`docs/conteudo-plano-de-acao.md`). Tira a geração do silo e a costura no ecossistema. A Presença vira a
**casa** do conteúdo da pessoa: um hub (`/presenca` + item de nav) onde ela vê, retoma, **edita,
arquiva, exclui, restaura e organiza** os rascunhos que gerou, começa novos a partir de evidência sua,
usa um **projeto** inteiro da Linha do Tempo como seed, e recebe **sugestões de conteúdo** onde está
trabalhando (no Painel e na própria Presença). É a mecânica de retorno episódico e de gestão do bloco.

> **Depende da 013**: usa a tabela `drafts`, o motor `generateDraft` e os componentes de geração
> (`GenerateSheet`, `DraftCard`, `UsarButton`, `PresencaCreate`, `PresencaList`, etc.) definidos na 013.
> **Não começa antes de a fundação da 013 existir** (mesmo num batch/sequência de PRs, esta é a ordem).

## Clarifications

### Session 2026-06-15 (kickoff do bloco)

- Q: Label e rota do hub? → A: **"Presença"** em `/presenca`, novo item em `NAV_ITEMS` do
  `AppShellClient.tsx` (4º item, depois de painel, espelho, historico).
- Q: O hub precisa de tabela nova? → A: **Não.** Lê de `drafts` (013) e de `proactive_insights`
  (existente). `seed_type='project'` já está no CHECK de `drafts` (013), então "Usar no projeto" não
  exige migration. **014 não adiciona migration.**
- Q: O nudge "isso daria um post" é uma tabela nova? → A: **Não.** Reusa `proactive_insights`
  (`type` é texto livre) com um novo valor de `type` (`'content_opportunity'`); o disparo entra no
  `triggerProactiveInsight` que já existe como stub.
- Q: O nudge regera/gera o post sozinho? → A: **Não.** Ele só **sugere** ("isso daria um post") e leva
  ao fluxo de geração da 013 com a evidência carregada. Sem geração automática às costas do usuário.

### Session 2026-06-15 (expansão de escopo — gestão total + sugestões)

- Q: O que muda no escopo da 014? → A: A 014 deixa de ser só "ver e retomar" e passa a cobrir a
  **gestão total** dos rascunhos: editar, arquivar, excluir definitivamente, restaurar e organizar
  (filtrar). E as **sugestões de conteúdo** passam a viver tanto no Painel (nudge) quanto na própria
  Presença (faixa de sugestões). O **histórico completo de entradas** (ver todo input bruto, arquivo,
  imagem) sai do escopo da 014 e vira **feature futura própria**.
- Q: "Arquivar" e "Excluir" são a mesma coisa? → A: **Não, são ações distintas.** **Arquivar** é
  reversível (tira da lista ativa, mantém o registro, pode restaurar) e reusa `status='discarded'`.
  **Excluir** é definitivo (remove a linha de vez, com confirmação) e usa a política de `delete` da RLS
  que a migration 009 já criou. Dar as duas é o que torna a gestão "total" sem virar destruição
  acidental.
- Q: Isso exige migration? → A: **Não.** `status='discarded'` e a política RLS de `delete` já existem
  na 009. A 014 segue **zero migration**: adiciona um endpoint `DELETE`, um filtro de status na
  listagem e o conserto de um bug (a lista ativa hoje não exclui os arquivados).
- Q: De onde vêm as sugestões na Presença, sem custo de IA novo? → A: De dado que já existe —
  os `content_opportunity` pendentes (não-vistos) e pontos de partida determinísticos (temas do espelho
  e entradas fortes que ainda **não** viraram rascunho). Sem chamada de IA no caminho de leitura do hub.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Hub da Presença: ver, começar e retomar (Priority: P1)

A pessoa abre **Presença** na navegação e encontra um lugar só dela: os rascunhos que já gerou (post e
resumo de impacto), com formato, status, data e a evidência que os originou. Dali ela pode **começar um
novo** rascunho a partir de uma evidência sua (tema do espelho, entrada ou projeto) e **retomar** um
rascunho existente, reabrindo-o no fluxo de edição da 013 com o corpo e o ângulo preservados. O hub
nunca está vazio de propósito: sem rascunho, mostra os caminhos de entrada com evidência, nunca uma
página em branco.

**Why this priority**: Sem um lugar de retorno, a geração da 013 é um ato isolado que a pessoa esquece.
O hub transforma "gerei um post uma vez" em "este é o lugar onde eu cuido da minha presença".

**Independent Test**: Com a conta QA que já gerou rascunhos na 013, abrir `/presenca` → ver a lista
persistida; começar um novo a partir de um tema/entrada; retomar um existente e confirmar que reabre
com o corpo preservado.

**Acceptance Scenarios**:

1. **Given** um usuário com rascunhos em `drafts`, **When** abre `/presenca`, **Then** vê a lista
   ordenada por mais recente, cada item com formato, status, data e a evidência de origem.
2. **Given** o hub aberto, **When** o usuário aciona "Gerar conteúdo", **Then** escolhe uma evidência
   sua (tema/entrada/projeto) e o fluxo de geração da 013 abre com a evidência carregada.
3. **Given** o hub aberto, **When** o usuário retoma um rascunho, **Then** reabre no fluxo de edição da
   013 com o `body` e o ângulo preservados (sem regerar sozinho).
4. **Given** um usuário sem nenhum rascunho ativo, **When** abre `/presenca`, **Then** vê os caminhos de
   entrada com evidência (tema/entrada/projeto), nunca uma página/prompt em branco.

### User Story 2 — Gestão total do rascunho: editar, arquivar, excluir, restaurar, organizar (Priority: P1)

A pessoa cuida do que é dela como cuidaria de um portfólio. No hub, em cada rascunho ela pode:
**editar** (reabrir e ajustar o texto, salvando a nova versão), **copiar**, **arquivar** (tirar da
lista ativa sem perder o registro), **excluir definitivamente** (remover de vez, com confirmação), e
**restaurar** um arquivado de volta para a lista ativa. Quando a lista cresce, ela pode **organizar** por
status (ativos, copiados, arquivados) e por formato (post, resumo de impacto). Arquivar e excluir são
ações distintas e claras: arquivar é reversível, excluir é definitivo e pede confirmação.

**Why this priority**: "Gerei vários rascunhos" sem gestão vira bagunça e ansiedade. Controle total
(editar, descartar com segurança, apagar de vez, reencontrar) é o que faz a Presença ser confiável como
casa do conteúdo, não um depósito. É o coração desta expansão.

**Independent Test**: Com a conta QA, no hub: editar um rascunho e ver a versão salva; arquivar um e
confirmar que sai da lista ativa e aparece no filtro "Arquivados"; restaurar; excluir definitivamente
(com confirmação) e confirmar que some de vez; filtrar por status e por formato.

**Acceptance Scenarios**:

1. **Given** um rascunho no hub, **When** o usuário edita o corpo e salva, **Then** a nova versão
   persiste (`status='edited'`) e aparece atualizada na lista.
2. **Given** um rascunho ativo, **When** o usuário **arquiva**, **Then** ele some da lista ativa
   (`status='discarded'`), continua acessível no filtro "Arquivados" e pode ser **restaurado**.
3. **Given** a lista ativa, **When** ela é carregada, **Then** rascunhos arquivados **não** aparecem por
   padrão (conserto do comportamento atual de listagem).
4. **Given** um rascunho (ativo ou arquivado), **When** o usuário **exclui definitivamente** e
   **confirma**, **Then** a linha é removida de `drafts` de vez e não pode ser restaurada.
5. **Given** uma exclusão definitiva, **When** o usuário **não** confirma, **Then** nada é removido.
6. **Given** muitos rascunhos, **When** o usuário filtra por status e/ou formato, **Then** a lista
   reflete o filtro, sempre escopada ao próprio usuário.
7. **Given** um rascunho de outro usuário, **When** qualquer operação (ler, editar, arquivar, excluir) é
   tentada com aquele id, **Then** a RLS de `drafts` impede o acesso (resposta indistinguível de
   inexistente).

### User Story 3 — Usar um projeto inteiro da Linha do Tempo (Priority: P1)

Na Linha do Tempo (`/historico`), ao abrir um **projeto** (que agrupa várias entradas de uma empresa),
a pessoa vê um botão **"Usar"**. O motor da 013 gera conteúdo a partir do **projeto como seed**
(`seed_type='project'`), reunindo a evidência de todas as entradas daquele projeto — um material mais
rico que uma entrada só. Isso amplia os pontos de entrada sem mudar o motor.

**Why this priority**: O projeto é a unidade de orgulho natural ("o lançamento que eu liderei"). Gerar a
partir dele dá o melhor input de evidência. É a costura entre o histórico (Provar) e a presença (Usar).

**Independent Test**: Abrir um projeto com 2+ entradas no `/historico`, clicar "Usar" → o fluxo da 013
abre com a evidência agregada do projeto; gerar post e resumo de impacto válidos citando entradas do
projeto.

**Acceptance Scenarios**:

1. **Given** um projeto com múltiplas entradas, **When** o usuário clica "Usar" no projeto, **Then** o
   `GenerateSheet` abre com `seed_type='project'` e a evidência agregada das entradas daquele projeto.
2. **Given** a geração a partir de um projeto, **When** o post é gerado, **Then** as afirmações citam
   evidência de entradas reais do projeto (sem misturar entradas de outro projeto/empresa).

### User Story 4 — Sugestões de conteúdo onde a pessoa está (Painel + Presença) (Priority: P2)

O produto sugere conteúdo de forma proativa e discreta, em dois lugares. No **Painel**, quando a pessoa
captura uma entrada forte, aparece o nudge **"isso daria um post"** (um `proactive_insight` do tipo
`content_opportunity`) que leva ao fluxo de geração com a entrada carregada. Na **Presença**, o hub
mostra uma faixa **"Sugestões pra você"**: os nudges pendentes mais pontos de partida determinísticos
(temas do espelho e entradas fortes que ainda não viraram rascunho). Toda sugestão apenas convida; nunca
gera nada sozinha, e aparece com parcimônia para não virar ruído.

**Why this priority**: Fecha o loop de retorno: o produto lembra a pessoa de usar o que ela tem, no
momento de maior orgulho e no lugar onde ela cuida da presença. Mas o valor central (hub + gestão +
usar projeto) existe sem isso; por isso P2. A pessoa pediu sugestões nos dois lugares.

**Independent Test**: Capturar uma entrada forte → confirmar o nudge no Painel; abrir `/presenca` →
confirmar a faixa "Sugestões pra você" com nudges pendentes e pontos de partida; capturar entradas
fracas → confirmar que o nudge **não** dispara toda hora.

**Acceptance Scenarios**:

1. **Given** uma captura com sinal de impacto alto, **When** o pipeline de insights roda, **Then** um
   `proactive_insight` do tipo `content_opportunity` é criado para aquela entrada.
2. **Given** o nudge exibido no Painel, **When** o usuário clica nele, **Then** abre o fluxo de geração
   da 013 com a entrada carregada como seed e o insight marca `seen`.
3. **Given** capturas de baixo sinal, **When** o pipeline roda, **Then** o nudge não é disparado
   (parcimônia: limite por janela de tempo / por sinal).
4. **Given** o hub aberto, **When** há nudges pendentes ou pontos de partida, **Then** a Presença mostra
   a faixa "Sugestões pra você"; cada sugestão leva à geração com a evidência carregada, sem gerar
   sozinha. Sem sugestão disponível, a faixa some (não inventa nem mostra placeholder vazio).

### Edge Cases

- **Hub com muitos rascunhos**: lista paginada/limitada (não query ilimitada — performance) e filtros
  por status/formato para reencontrar.
- **Rascunho cuja entrada/tema de origem foi apagado**: o hub ainda mostra o `body` salvo; a evidência
  de origem degrada com elegância ("origem indisponível"), sem quebrar.
- **Excluir vs arquivar**: excluir é a única ação irreversível e por isso pede confirmação explícita;
  arquivar nunca pede confirmação (é reversível).
- **Restaurar um arquivado cuja origem sumiu**: restaura o `body`; a origem degrada com elegância.
- **Projeto com 1 entrada só**: "Usar" no projeto se comporta como "Usar" na entrada (mesmo motor).
- **Nudge repetido**: no máximo 1 nudge de conteúdo por janela e marca `seen` ao ser interagido.
- **Sugestões na Presença sem material**: a faixa some; o hub nunca mostra uma seção de sugestões vazia.
- **Conflito de superfície com a 012-chat**: a barra de captura tem o toggle registrar/perguntar; o item
  de nav "Presença" entra sem brigar com isso (revalidar na implementação).

## Requirements *(mandatory)*

### Functional Requirements

#### Hub e navegação
- **FR-001**: O sistema MUST ter a rota `/presenca` e um item **"Presença"** em `NAV_ITEMS` do
  `AppShellClient.tsx`, coerente em mobile e desktop.
- **FR-002**: O hub MUST listar os rascunhos **ativos** do usuário (de `drafts`), ordenados por mais
  recente, com formato, status, data e a evidência de origem; a query MUST ser paginada/limitada e
  escopada por `user_id` (RLS).
- **FR-003**: O hub MUST ter um ponto de geração próprio: começar um novo rascunho a partir de uma
  evidência do usuário (tema, entrada ou projeto), reusando o fluxo da 013, sem nunca apresentar uma
  página/prompt em branco.

#### Gestão total do rascunho
- **FR-004**: Os usuários MUST conseguir **retomar** um rascunho — reabri-lo no fluxo de edição da 013
  com `body` e ângulo preservados — para editar/ajustar/regerar e salvar a nova versão
  (`status='edited'`), sem regeração automática às costas do usuário.
- **FR-005**: Os usuários MUST conseguir **copiar** um rascunho do hub (reusa o comportamento da 013;
  marca `status='copied'`).
- **FR-006**: Os usuários MUST conseguir **arquivar** um rascunho (`status='discarded'`), o que o remove
  da lista ativa preservando o registro, e **restaurar** um arquivado de volta para a lista ativa.
- **FR-007**: A listagem ativa MUST excluir rascunhos arquivados (`status='discarded'`) por padrão
  (conserto do comportamento atual, em que arquivados ainda apareceriam).
- **FR-008**: Os usuários MUST conseguir **excluir definitivamente** um rascunho (remoção da linha em
  `drafts`), e essa ação MUST exigir confirmação explícita por ser irreversível.
- **FR-009**: Os usuários MUST conseguir **organizar** a lista filtrando por status (ativos, copiados,
  arquivados) e por formato (post, resumo de impacto), sempre escopado por `user_id`.
- **FR-010**: Toda operação de gestão (ler, editar, arquivar, restaurar, excluir) MUST ser escopada ao
  próprio usuário; um id de outro usuário MUST resultar em resposta indistinguível de inexistente (RLS é
  a barreira real; rotas mapeiam 404, não 403).

#### Usar projeto
- **FR-011**: A Linha do Tempo (`/historico`) MUST expor um botão **"Usar"** no nível de **projeto**,
  abrindo o fluxo da 013 com `seed_type='project'` e a evidência agregada das entradas do projeto.
- **FR-012**: A geração a partir de projeto MUST usar apenas entradas daquele projeto/empresa (sem vazar
  evidência de outro projeto).

#### Sugestões de conteúdo (Painel + Presença)
- **FR-013**: O sistema MUST gerar um `proactive_insight` do tipo `content_opportunity` quando uma
  captura tem sinal de impacto alto, reusando o pipeline `triggerProactiveInsight`.
- **FR-014**: O nudge no Painel e as sugestões na Presença MUST apenas sugerir (levar ao fluxo de
  geração com a evidência carregada), nunca gerar conteúdo automaticamente.
- **FR-015**: O nudge MUST respeitar parcimônia (no máximo 1 por janela de tempo / por sinal forte) e
  marcar `seen` ao ser interagido.
- **FR-016**: A Presença MUST mostrar uma faixa **"Sugestões pra você"** quando houver material (nudges
  `content_opportunity` pendentes e/ou pontos de partida determinísticos: temas do espelho e entradas
  fortes sem rascunho ainda). Sem material, a faixa MUST sumir (sem placeholder vazio). As sugestões da
  Presença MUST NOT exigir chamada de IA no caminho de leitura do hub.

#### Plataforma (constituição)
- **FR-017**: Toda string de UI MUST viver em `pt-BR.json` (`presenca.*`), `en.json` espelhando. Zero
  string hardcoded.
- **FR-018**: Toda query MUST filtrar por `auth.uid() = user_id`; IDs internos MUST NOT vazar além do
  `id` operável do próprio recurso.
- **FR-019**: O hub, a gestão e as sugestões MUST reusar os componentes de geração da 013, sem duplicar
  o motor.
- **FR-020**: A 014 MUST NOT adicionar migration (o schema da 013 já cobre `status='discarded'` e a
  política RLS de `delete`).

### Key Entities *(include if feature involves data)*

- **Draft** (de 013, `drafts`): a fonte da lista do hub e o objeto da gestão. **Sem alteração de
  schema** — a 014 usa colunas e políticas RLS já existentes (incluindo `delete`).
- **ProactiveInsight** (`proactive_insights`, existente): ganha o valor de `type`
  `'content_opportunity'`. Sem migration (type é texto livre).
- **Project** (derivado de `entries` agrupadas, via `getHistoricoData`): o seed agregado de "Usar
  projeto". Não é tabela nova.
- **ContentSuggestion** (projeção de leitura, não persistida): item da faixa "Sugestões pra você" —
  unifica um nudge pendente ou um ponto de partida determinístico numa forma que abre a geração.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa encontra todos os rascunhos ativos que gerou em `/presenca`, com status e
  evidência, sem nenhum item de outro usuário (RLS testada com 2 contas).
- **SC-002**: A pessoa consegue editar, arquivar, restaurar e excluir definitivamente um rascunho, e o
  estado reflete corretamente (arquivado some da lista ativa; excluído não volta).
- **SC-003**: A lista ativa nunca mostra rascunhos arquivados; o filtro "Arquivados" os mostra com
  restaurar/excluir.
- **SC-004**: "Usar" funciona nos três seeds (tema, entrada, projeto) com o mesmo motor da 013.
- **SC-005**: O nudge `content_opportunity` dispara para captura forte e **não** dispara para captura
  fraca (precisão testável por fixture de sinal); a faixa de sugestões da Presença aparece com material e
  some sem material.
- **SC-006**: Nenhuma superfície da Presença mostra página/prompt em branco nem seção de sugestões vazia.
- **SC-007**: Cobertura ≥ 80% nas queries/listagem, na gestão (arquivar/excluir/filtrar) e no disparo do
  nudge.

## Assumptions

- A fundação da 013 (`drafts`, `generateDraft`, e os componentes de geração — incluindo o hub básico
  `PresencaList`, o ponto de geração `PresencaCreate` e as rotas `POST /api/content/drafts` e
  `PATCH .../[id]`) existe antes da 014. Parte desse hub básico já foi construída no working tree da 013
  e deve ser **dobrada para dentro do PR da 014** na divisão de PRs (decisão de Ohana).
- `status='discarded'` e a política RLS de `delete` de `drafts` já existem na migration 009; a 014 não
  precisa de migration.
- `proactive_insights` e `triggerProactiveInsight` (stub) são a infra do nudge; o sinal de "captura
  forte" reusa o que a extração/insights já calculam (impacto/métrica).
- `getHistoricoData` já fornece a estrutura de projeto agrupado por empresa; "Usar projeto" lê dali.

## Out of Scope

- **Histórico completo de entradas** (ver todo input bruto, com texto/arquivo/imagem original, e gerar
  dali) — **feature futura própria**, fora da 014.
- Loop de refino de voz e mini-bio (→ 015).
- Evals de golden set no CI (→ 015).
- Publicação direta no LinkedIn / agendamento.
- Geração automática pelo nudge ou pelas sugestões (eles só sugerem).
- Edição da lógica do motor da 013 (a 014 só costura, gere e reusa).
