# Feature Specification: Navegação que expressa a espinha (6 → 4 destinos)

**Feature Branch**: `021-navegacao-espinha`

**Created**: 2026-06-22

**Status**: Draft

**Input**: Decisão consolidada em `docs/decisions/001-arquitetura-de-navegacao.md`. Reforma da
arquitetura de navegação para que o menu reflita a espinha do produto (Descobrir → Entender →
Provar → Usar), colapsando de 6 destinos para 4, em fases independentes e testáveis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Menu enxuto de 4 destinos com uma casa clara pra "usar" (Priority: P1)

A pessoa abre o app e encontra **quatro destinos óbvios** em vez de seis caixas paralelas que
se confundem. Cada destino corresponde a um movimento do produto: a Home (Painel), me entender
(Espelho), meus registros (Registros) e usar o que tenho (Usar). Ao escolher "Usar", ela cai
numa página que pergunta a intenção — mostrar pra fora (gerar conteúdo) ou se preparar pra um
momento — e a leva pro lugar certo. Links e atalhos antigos continuam funcionando.

**Why this priority**: É o coração da reforma e entrega o maior ganho de legibilidade sozinho.
Reduz a confusão de "onde eu clico?" sem depender de nenhuma outra fase. É um MVP viável: mesmo
que nada mais seja feito, o menu já fica claro.

**Independent Test**: Abrir o app e confirmar que o menu mostra exatamente quatro destinos +
Configurações; clicar em "Usar" e confirmar que a página oferece os dois caminhos (mostrar /
preparar) e roteia corretamente; acessar uma URL antiga (ex.: a da Linha do Tempo) e confirmar
que ela leva a um lugar válido, sem erro.

**Acceptance Scenarios**:

1. **Given** a pessoa autenticada em qualquer página, **When** olha o menu, **Then** vê quatro
   destinos — Painel, Espelho, Registros, Usar — mais Configurações, e não vê mais "Linha do
   Tempo", "Repertório" e "Autoavaliação" como itens separados de topo.
2. **Given** a pessoa no menu, **When** abre "Usar", **Then** vê uma página que distingue
   "mostrar pra fora" (gerar conteúdo) de "me preparar" e a conduz ao destino escolhido.
3. **Given** a pessoa com um link/atalho antigo de uma seção que deixou de ser destino de topo,
   **When** acessa esse link, **Then** chega a um destino válido equivalente, sem ver erro de
   página inexistente.
4. **Given** a pessoa navegando, **When** está numa página ou sub-vista, **Then** o destino
   correspondente aparece destacado como ativo no menu.

---

### User Story 2 - "Me entender" num lugar só: forças e trajetória juntas (Priority: P2)

A pessoa quer entender quem é profissionalmente. Em vez de adivinhar entre duas portas que
soavam iguais, ela entra no **Espelho** e encontra duas vistas no mesmo lugar: **Forças** (a
revelação atual) e **Trajetória** (o mapa da carreira por empresa/cargo/projeto, com o detalhe
de cada projeto). Trocar de vista é imediato, e abrir o detalhe de um projeto funciona como
antes.

**Why this priority**: Resolve diretamente o "duas portas que soam iguais" e completa o
desaparecimento da Linha do Tempo do meno de topo (US1). Alto valor, mas depende de US1 já ter
reorganizado o menu.

**Independent Test**: Entrar no Espelho, alternar entre Forças e Trajetória, abrir o detalhe de
um projeto na vista de Trajetória e confirmar que tudo que existia na antiga Linha do Tempo
continua acessível e funcional.

**Acceptance Scenarios**:

1. **Given** a pessoa com espelho e histórico gerados, **When** abre o Espelho, **Then** vê a
   vista de Forças por padrão e um jeito claro de alternar para a vista de Trajetória.
2. **Given** a pessoa na vista de Trajetória, **When** seleciona um projeto, **Then** o detalhe
   do projeto abre exatamente como abria na antiga Linha do Tempo.
3. **Given** a pessoa abrindo o Espelho, **When** a página carrega, **Then** a vista de
   Trajetória só é buscada quando ela efetivamente abre essa vista (a entrada não espera pelos
   dois conjuntos de dados).
4. **Given** a pessoa com um link antigo da Linha do Tempo, **When** acessa, **Then** cai
   diretamente na vista de Trajetória do Espelho.

---

### User Story 3 - O Painel como casa que chama de volta (Priority: P3)

Ao entrar, a pessoa encontra o **Painel** como centro de gravidade: o que ela acumulou, o
insight proativo, o lembrete de um momento de carreira chegando, e uma **porta de conversa** no
topo ("fala com o seu borogodó") que abre o chat já enquadrado. A Home mostra o essencial
curado — não tudo —, e o chat continua disponível em todo o app como ferramenta, sem nunca virar
a tela principal.

**Why this priority**: Fortalece o motor de retorno, mas o ganho de legibilidade já vem das
fases anteriores; pode ser incremental e vir por último.

**Independent Test**: Abrir o Painel e confirmar que existe um campo de conversa no topo que
abre o chat; confirmar que a Home apresenta um conjunto curado (não uma lista exaustiva) e que o
chat segue acessível nas outras páginas como antes.

**Acceptance Scenarios**:

1. **Given** a pessoa autenticada, **When** abre o Painel, **Then** vê uma porta de conversa no
   topo que, ao ser acionada, abre o chat já no modo de pergunta.
2. **Given** a pessoa no Painel, **When** olha a página, **Then** encontra o acúmulo, o insight
   proativo e o lembrete de ciclo de review de forma curada, sem virar uma lista sem fim.
3. **Given** a pessoa em qualquer outra página, **When** usa o chat, **Then** ele funciona como
   ferramenta onipresente, sem substituir o conteúdo da página por uma tela de conversa.

---

### User Story 4 - Só os formatos que fazem sentido oferecer (Priority: P3)

Quando a pessoa vai gerar conteúdo, ela só vê as opções de formato que fazem sentido escolher —
o "resumo de impacto" deixa de ser oferecido como um formato avulso, porque confundia mais do
que ajudava. O motor por baixo continua existindo e funcionando.

**Why this priority**: Higiene de produto independente, de baixo risco; melhora a clareza da
geração de conteúdo sem depender das outras fases.

**Independent Test**: Abrir os pontos onde se escolhe formato (a partir de uma entrada e a
partir do insight proativo) e confirmar que "resumo de impacto" não aparece como opção, e que
gerar os formatos restantes segue funcionando.

**Acceptance Scenarios**:

1. **Given** a pessoa escolhendo formato a partir de uma entrada, **When** vê as opções, **Then**
   "resumo de impacto" não está entre elas.
2. **Given** a pessoa acionando a geração a partir do insight proativo, **When** vê as opções,
   **Then** "resumo de impacto" não está entre elas.
3. **Given** o sistema existente, **When** gera qualquer conteúdo, **Then** nada quebra por conta
   da remoção da opção (o motor e os dados seguem intactos).

---

### Edge Cases

- **Conta nova / sem dados**: o Espelho sem histórico mostra o estado vazio existente em ambas as
  vistas; "Usar" sem rascunhos mostra os caminhos de entrada; o Painel sem entradas mostra o
  estado vazio atual. Nenhuma página fica em branco.
- **Vista de Trajetória sem histórico estruturado**: ao abrir a vista, mostra o vazio
  equivalente ao da antiga Linha do Tempo, não um erro.
- **Link antigo profundo** (ex.: deep link com um projeto selecionado): cai na vista de
  Trajetória; se o estado profundo não puder ser reconstruído, abre a vista no estado base.
- **Acesso direto a `Usar` sem intenção definida**: a página mostra a escolha mostrar/preparar,
  nunca redireciona arbitrariamente.
- **Navegação no mobile**: a barra inferior reflete os mesmos quatro destinos; o realce de ativo
  funciona inclusive nas sub-vistas do Espelho.

## Requirements *(mandatory)*

### Functional Requirements

**Estrutura do menu (US1)**

- **FR-001**: O menu principal MUST apresentar exatamente quatro destinos de topo — Painel,
  Espelho, Registros, Usar — além de Configurações, em desktop e mobile.
- **FR-002**: "Linha do Tempo", "Repertório" e "Autoavaliação" MUST deixar de ser itens de topo
  do menu, sem que suas funções deixem de existir no produto.
- **FR-003**: O realce de destino ativo MUST refletir corretamente a localização da pessoa,
  inclusive quando ela está numa sub-vista de um destino (ex.: a vista de Trajetória dentro do
  Espelho destaca "Espelho").

**Casa "Usar" (US1)**

- **FR-004**: O destino "Usar" MUST levar a uma página que distingue duas intenções — mostrar
  pra fora (gerar conteúdo) e me preparar — e conduz a pessoa ao destino correspondente.
- **FR-005**: Na entrega desta feature, "me preparar" MUST levar à Autoavaliação como ela existe
  hoje (a generalização para novos momentos está fora de escopo).

**Continuidade de rotas (US1/US2)**

- **FR-006**: Qualquer endereço antigo de uma seção que deixou de ser destino de topo MUST
  continuar levando a pessoa a um destino válido equivalente, sem erro de página inexistente.
- **FR-007**: O endereço antigo da Linha do Tempo MUST levar à vista de Trajetória dentro do
  Espelho.

**Espelho com duas vistas (US2)**

- **FR-008**: O Espelho MUST oferecer duas vistas no mesmo destino — Forças e Trajetória — com
  troca imediata entre elas, exibindo Forças por padrão.
- **FR-009**: A vista de Trajetória MUST preservar integralmente o comportamento atual da Linha
  do Tempo, incluindo a abertura do detalhe de um projeto.
- **FR-010**: O Espelho MUST carregar apenas a vista inicial na entrada e buscar os dados da
  Trajetória somente quando essa vista for aberta.

**Painel como Home (US3)**

- **FR-011**: O Painel MUST apresentar uma porta de conversa no topo que abre o chat já
  enquadrado no modo de pergunta.
- **FR-012**: O Painel MUST apresentar um conjunto curado (acúmulo, insight proativo, lembrete de
  ciclo de review), sem se tornar uma lista exaustiva.
- **FR-013**: O chat MUST permanecer disponível como ferramenta onipresente nas demais páginas e
  MUST NOT substituir o conteúdo de uma página por uma tela de conversa.

**Higiene de formatos (US4)**

- **FR-014**: O "resumo de impacto" MUST NOT ser oferecido como formato selecionável nos pontos
  de geração de conteúdo (a partir de uma entrada e a partir do insight proativo).
- **FR-015**: A remoção da opção MUST NOT afetar o funcionamento do motor de geração nem os dados
  existentes.

**Restrições transversais**

- **FR-016**: A feature MUST NOT exigir mudança no banco de dados.
- **FR-017**: A feature MUST preservar as funções existentes onde uma porta deixa de existir
  (reorganização, não remoção de capacidade).

### Key Entities

- **Destino de navegação**: um item de topo do menu (Painel, Espelho, Registros, Usar) que
  corresponde a um movimento da espinha do produto; tem rótulo, ícone e estado ativo/inativo.
- **Vista do Espelho**: uma das duas perspectivas dentro do destino Espelho — Forças (revelação)
  ou Trajetória (mapa de carreira) — com a Trajetória carregada sob demanda.
- **Intenção de uso**: a bifurcação dentro de "Usar" entre mostrar pra fora e me preparar, que
  determina o destino seguinte.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O menu principal apresenta no máximo quatro destinos de topo (mais Configurações),
  reduzido dos seis atuais.
- **SC-002**: 100% dos endereços antigos das seções reorganizadas levam a um destino válido (zero
  páginas inexistentes a partir de links/atalhos anteriores).
- **SC-003**: Toda função que existia antes da reforma continua acessível em até dois cliques a
  partir do menu (nenhuma capacidade perdida).
- **SC-004**: Na primeira tentativa, a pessoa encontra "onde mostrar/usar o que tem" sem abrir a
  porta errada e voltar (medido por teste de usabilidade ou pela queda de idas-e-voltas entre
  destinos numa mesma sessão).
- **SC-005**: A entrada no Espelho não espera pelo carregamento da vista de Trajetória quando a
  pessoa permanece em Forças (a segunda vista só é buscada quando aberta).
- **SC-006**: O detalhe de projeto e o estado vazio que existiam na Linha do Tempo permanecem
  funcionais após a fusão (zero regressão de comportamento).

## Assumptions

- A geração de conteúdo continua vivendo no destino atual (Repertório) e a Autoavaliação no seu
  destino atual; "Usar" é uma camada de entrada que roteia para eles, não uma reescrita dessas
  páginas.
- Os rótulos provisórios "Forças" e "Trajetória" para as vistas do Espelho, e a relação de nomes
  "Usar" vs. "Repertório", serão refinados no passo de UX (`/impeccable shape`) e não bloqueiam a
  spec.
- A porta de conversa do Painel reutiliza o chat existente (modo pergunta); não há novo motor de
  chat nem persistência de histórico nesta feature.
- "Me preparar" aponta para a Autoavaliação como ela é hoje; a generalização para novos momentos
  (entrevista, 1:1) é trabalho futuro separado, fora desta feature.
- As quatro fases são independentes e podem ser entregues e validadas em sequência; a vista de
  Trajetória do Espelho (US2) é o destino do redirecionamento da Linha do Tempo e, até US2
  existir, o acesso à trajetória permanece pela rota atual sem quebra.
- Nenhuma mudança de banco é necessária; todo o trabalho é de navegação, composição de telas
  existentes e ajuste das listas de formato oferecidas.
