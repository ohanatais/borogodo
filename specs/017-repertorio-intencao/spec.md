# Feature Specification: Repertório — camada "Usar" organizada por intenção

**Feature Branch**: `017-repertorio-intencao`

**Created**: 2026-06-20

**Status**: Draft

**Input**: User description: "Pivô da camada Usar (Repertório): reorganizar /presenca por intenção em dois hubs (MOSTRAR/PREPARAR), com bifurcação pronto/conversar nos momentos de preparação; convite central no Painel; entrada de Bio no Espelho; rename Presença→Repertório; zero migration (o momento é um ângulo sobre o motor impact_summary existente). Momentos v1: entrevista, review, salário."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar o que fazer pela intenção, não pelo formato (Priority: P1)

A pessoa abre a seção "Repertório" (antes "Presença") e, em vez de uma lista plana de rascunhos
filtrável por formato técnico, encontra dois caminhos claros pela situação que está vivendo:
**Mostrar meu valor** (conteúdo público) e **Me preparar pra um momento** (preparação privada).
Cada caminho mostra exemplos concretos do que entrega. A lista de rascunhos antiga continua
acessível como "Meus rascunhos".

**Why this priority**: É o coração da pivotada. Sem a reorganização por intenção, nenhuma das
outras histórias existe. Sozinha já entrega valor: a pessoa traduz menos ("qual aba faz isso?") e
encontra a ação pela situação.

**Independent Test**: Abrir o Repertório e confirmar que aparecem os dois hubs com exemplos e que
"Meus rascunhos" preserva os rascunhos já criados; gerar um Post pelo hub Mostrar funciona como
antes.

**Acceptance Scenarios**:

1. **Given** uma pessoa com histórico e rascunhos antigos, **When** abre o Repertório, **Then** vê
   dois hubs ("Mostrar meu valor", "Me preparar pra um momento") com exemplos e, abaixo, "Meus
   rascunhos" com os rascunhos existentes intactos.
2. **Given** o hub Mostrar, **When** escolhe "Post", **Then** o fluxo de geração de post abre com a
   evidência carregada, idêntico ao comportamento anterior.
3. **Given** um bookmark antigo da rota de Presença, **When** acessa, **Then** a página abre normal
   (rota inalterada), agora rotulada "Repertório".

---

### User Story 2 - Preparar-se para um momento, pronto ou conversando (Priority: P1)

Dentro de "Me preparar pra um momento", a pessoa escolhe um momento (entrevista, conversa de
review, ou pedir aumento) e decide entre **"Quero algo pronto agora"** — recebe um resumo dos seus
feitos com o ângulo daquele momento — ou **"Quero treinar conversando"** — abre uma conversa já
enquadrada no momento, com sugestões de partida próprias. O caminho "pronto" nunca força conversa
antes de entregar valor.

**Why this priority**: É a metade "preparar" da pivotada e o que diferencia o produto de um simples
gerador de post. Entrega valor independentemente do hub Mostrar.

**Independent Test**: Em cada momento (entrevista/review/salário), acionar "Quero algo pronto"
gera um resumo de impacto com o ângulo do momento; "Quero treinar conversando" abre a conversa
enquadrada no momento com sugestões próprias.

**Acceptance Scenarios**:

1. **Given** o hub Preparar, **When** escolhe "Entrevista" e "Quero algo pronto agora", **Then**
   recebe um resumo dos próprios feitos ancorado num ângulo de entrevista.
2. **Given** o mesmo momento, **When** escolhe "Quero treinar conversando", **Then** a conversa
   abre já enquadrada na entrevista, com sugestões de partida específicas do momento.
3. **Given** um resumo de preparação gerado, **When** a pessoa o salva, **Then** o rascunho é
   guardado e fica rotulado internamente pelo momento que o originou.
4. **Given** os três momentos, **When** repete o fluxo para review e salário, **Then** cada um
   entrega ângulo e sugestões coerentes com aquele momento.

---

### User Story 3 - Ser convidado a usar o histórico a partir do Painel (Priority: P2)

Na primeira visão (Painel), quando já há histórico registrado, a pessoa vê um convite central para
o Repertório, com os dois gatilhos descritos em frase de ação + exemplos concretos ("Mostrar meu
valor — post pro LinkedIn, bio profissional"; "Me preparar pra um momento — entrevista, conversa de
review, pedir aumento"). Clicar leva ao Repertório.

**Why this priority**: Resolve a descoberta — o nome no menu sozinho não comunica "o quê mostrar /
o quê preparar". O convite dá contexto no lugar onde a pessoa começa. Depende das histórias P1
existirem como destino.

**Independent Test**: Com histórico, o Painel mostra o convite com os dois gatilhos e exemplos, e o
clique leva ao Repertório; sem histórico, o convite não aparece.

**Acceptance Scenarios**:

1. **Given** uma pessoa com pelo menos uma entrada, **When** abre o Painel, **Then** vê o convite
   central com os dois gatilhos (frase + exemplos) abaixo do cartão de destaque.
2. **Given** uma conta nova sem entradas, **When** abre o Painel, **Then** o convite não é exibido
   (não há o que usar ainda).
3. **Given** o convite, **When** clica num dos gatilhos, **Then** chega ao Repertório na seção
   correspondente.

---

### User Story 4 - Criar a bio a partir do Espelho (Priority: P3)

No Espelho, perto do resumo da trajetória, a pessoa encontra uma entrada "Criar minha bio" que gera
uma mini-bio a partir da sua trajetória. O Espelho é onde ela contempla quem é profissionalmente —
é o lugar conceitualmente certo para virar isso numa bio.

**Why this priority**: Reforço de ponto de entrada de baixo custo; agrega mas não é pré-requisito
da pivotada. Reusa o motor de bio existente.

**Independent Test**: No Espelho com temas de força, o botão "Criar minha bio" abre a geração de
bio a partir da trajetória; sem temas, o botão não aparece.

**Acceptance Scenarios**:

1. **Given** um Espelho com temas de força, **When** aciona "Criar minha bio", **Then** a geração
   de mini-bio abre a partir da trajetória.
2. **Given** um Espelho ainda sem temas de força, **When** visualiza a página, **Then** a entrada
   de bio não é oferecida.

### Edge Cases

- **Sem evidência para um hub**: pessoa sem temas/entradas que clica num card de Mostrar/Preparar
  vê o seletor de evidência existente em vez de uma tela em branco ou erro.
- **Momento sobre trajetória ampla demais**: o resumo de preparação a partir da trajetória pode
  soar genérico; aceitar na v1, com possibilidade de ancorar num projeto/entrada se a qualidade
  for fraca (validação manual).
- **Salário como momento**: é o encaixe menos direto do motor de resumo; aceitar como v1 (sem
  tratamento dedicado de negociação).
- **Excesso de opções**: teto de 3–4 cards por hub e apenas dois hubs, para não recriar a paralisia
  que a lista plana causava.
- **Falha ao salvar rascunho de preparação**: o texto permanece visível na tela e a falha é
  sinalizada discretamente, sem perder o conteúdo (comportamento atual preservado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A seção hoje chamada "Presença" MUST ser renomeada para "Repertório" na navegação e
  no cabeçalho da página, mantendo a mesma rota (nenhum link/bookmark existente quebra).
- **FR-002**: O Repertório MUST apresentar dois hubs por intenção — "Mostrar meu valor" (público) e
  "Me preparar pra um momento" (privado) — cada um com título em frase de ação e exemplos concretos.
- **FR-003**: O hub Mostrar MUST oferecer os caminhos Post e Bio, reusando o fluxo de geração atual.
- **FR-004**: O hub Preparar MUST oferecer os momentos entrevista, review e salário.
- **FR-005**: Ao escolher um momento, o sistema MUST oferecer dois caminhos — "Quero algo pronto
  agora" e "Quero treinar conversando" — com o caminho "pronto" em destaque por padrão.
- **FR-006**: "Quero algo pronto agora" MUST gerar um resumo dos feitos da pessoa orientado pelo
  ângulo do momento escolhido, sem exigir conversa antes de entregar o resultado.
- **FR-007**: "Quero treinar conversando" MUST abrir a conversa já enquadrada no momento escolhido,
  com sugestões de partida específicas daquele momento.
- **FR-008**: Um rascunho gerado num fluxo de preparação MUST, ao ser salvo, reter de forma durável
  o momento que o originou (rótulo interno), sem exigir mudança de esquema de dados.
- **FR-009**: A lista de rascunhos existente MUST continuar disponível e funcional como sub-seção
  "Meus rascunhos" dentro do Repertório, sem regressão (retomar, copiar, arquivar, excluir).
- **FR-010**: O Painel MUST exibir um convite central ao Repertório quando houver histórico, com os
  dois gatilhos descritos em frase de ação + exemplos, levando ao Repertório.
- **FR-011**: O convite do Painel MUST NOT aparecer quando a pessoa ainda não tem histórico.
- **FR-012**: O Espelho MUST oferecer uma entrada "Criar minha bio" que gera uma mini-bio a partir
  da trajetória, exibida apenas quando há temas de força.
- **FR-013**: A reorganização MUST reusar os motores de geração e de conversa existentes (post,
  resumo de impacto, mini-bio, chat) — sem criar novo formato de conteúdo nem novo motor.
- **FR-014**: A feature MUST NOT exigir migração de banco de dados.
- **FR-015**: Cada hub MUST limitar-se a no máximo 3–4 opções visíveis, e a seção a dois hubs.

### Key Entities *(include if feature involves data)*

- **Intenção (Hub)**: agrupador de alto nível do que a pessoa quer fazer — "mostrar" (público) ou
  "preparar" (privado). Dado de interface, não persistido.
- **Momento de preparação**: situação de carreira dentro do hub Preparar — entrevista, review ou
  salário. Define o ângulo da geração e o enquadramento da conversa; quando um rascunho nasce de um
  momento, esse rótulo é preservado junto ao rascunho.
- **Rascunho**: artefato de conteúdo já existente (post, resumo de impacto, mini-bio), agora capaz
  de carregar o rótulo do momento que o originou, sem novos campos estruturais.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir do Painel, uma pessoa com histórico alcança um conteúdo pronto (post, bio ou
  resumo de preparação) em no máximo 3 cliques.
- **SC-002**: Para cada um dos três momentos (entrevista, review, salário), ambos os caminhos
  ("pronto" e "conversar") produzem um resultado coerente com o momento em 100% das tentativas de
  verificação manual.
- **SC-003**: Nenhum link ou bookmark existente da seção quebra após o rename (a rota responde
  igual).
- **SC-004**: 100% dos rascunhos pré-existentes continuam visíveis e operáveis em "Meus rascunhos"
  após a reorganização (zero regressão de gestão de rascunho).
- **SC-005**: A entrega não inclui nenhuma migração de banco de dados (footprint de schema = 0).
- **SC-006**: Cada hub exibe no máximo 4 opções e a seção exibe exatamente dois hubs.

## Assumptions

- Os motores de geração (post, resumo de impacto, mini-bio) e de conversa já existem e atendem a
  qualidade necessária; esta feature reorganiza pontos de entrada e contexto de IA, não cria motor.
- O "momento" é tratado como um ângulo/contexto sobre o motor de resumo de impacto existente e como
  rótulo livre junto ao rascunho — nunca como novo formato ou nova coluna.
- Os três momentos da v1 (entrevista, review, salário) cobrem as situações mais comuns; outros
  momentos ficam para iterações futuras.
- O nome "Repertório" não conflita com "Linha do Tempo" na navegação (rótulos distintos).
- Itens de refinamento (bio multi-tamanho, detector de tom, checklist por momento, countdown,
  roleplay dedicado, teste A/B de IA, badge de momento no histórico) estão fora do escopo da v1.
- O convite do Painel leva ao Repertório (launchpad) e a escolha do gatilho específico acontece lá;
  não há duplicação da lógica de bifurcação no Painel.
