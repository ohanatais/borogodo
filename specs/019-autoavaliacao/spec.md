# Feature Specification: Autoavaliação de Desempenho

**Feature Branch**: `019-autoavaliacao`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada)

**Input**: Quarto e último elo da aposta de retenção, conforme o discovery
`docs/discovery-retencao-e-conteudo.md` (seção 6). **Segundo payoff episódico**, ancorado em
**calendário** (ciclo de avaliação recorrente = gatilho forte, alta ansiedade). É **primo do
`impact_summary`** que a 013 já entrega — **um motor, vários destinos**, não um motor novo. Força a
alimentação a ficar fresca: não se enche autoavaliação na véspera, **colhe-se o ano**.

> **Por que isto retém**: a avaliação de desempenho é um momento recorrente e ansioso na carreira —
> exatamente o tipo de gatilho episódico que traz a pessoa de volta. Quem alimentou o Borogodó ao longo
> do ano chega no ciclo com o material pronto (e fiel), em vez de tentar lembrar tudo na véspera. O
> valor episódico puxa a alimentação contínua: o produto se torna o lugar onde "colher o ano" só
> funciona se você foi semeando.

> **Estado atual do código (a 019 estende o motor da 013, não cria um novo).** Audit feito no kickoff:
> - **`generateDraft` já orquestra por formato** (`promptFor(format)`): hoje `post`, `impact_summary`,
>   `mini_bio`. A autoavaliação entra como **novo formato** com seu prompt — mesmo motor, mesma
>   validação anti-IA, 2 variações.
> - **`impact_summary` é resumo curto de UMA entrada** ("serve para review de desempenho, entrevista
>   ou promoção"). A autoavaliação é diferente: **agrega o período inteiro** (muitas entradas), com
>   estrutura própria. → precisa de um **seed por período** (novo loader, espelhando `loadProjectSeed`,
>   mas por intervalo de datas) e de **estender o CHECK de `drafts.format`** (migration pequena).
> - **O nudge da 016** (ressurgimento ancorado em rotina) é a base do gatilho de calendário desta
>   feature — por isso a 016 é specada antes (dependência: 013 → 016 → 019).
> - **O espelho é focado em forças** (`strength_themes`, `categories`) — não há "pontos a desenvolver"
>   hoje; se a autoavaliação incluir isso, é território novo (ver Clarifications).

## Clarifications

### Session 2026-06-15 (kickoff da 019, antes da implementação)

- Q: É um motor novo? → A: **Não.** Reusa `generateDraft` + a disciplina anti-IA; a autoavaliação é um
  **novo formato/destino** do mesmo motor (constituição III). (Discovery §6.)
- Q: A evidência é de uma entrada? → A: **Não — do período.** "Colhe-se o ano": agrega todas as
  entradas de um intervalo (novo seed por período), não uma só.
- Q: De que feature vem o gatilho de calendário? → A: **Do nudge da 016** (ressurgimento ancorado em
  rotina). A 019 depende da 016 estar construída para o disparo proativo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar minha autoavaliação a partir do ano (Priority: P1)

Chega o ciclo de avaliação. Em vez de encarar uma página em branco tentando lembrar o que fez nos
últimos meses, a pessoa escolhe um **período** (ex.: o último ciclo / o ano) e o motor **colhe todas as
entradas daquele intervalo** e gera uma **autoavaliação estruturada** — suas entregas, o impacto, a
evolução — em 2 variações, cada afirmação ancorada em evidência real, sem inventar número. Ela sai com
o material pronto para preencher o formulário de avaliação, falar na conversa com o gestor, ou
fundamentar um pedido de promoção.

**Why this priority**: É o coração da feature e o segundo payoff episódico do produto. Entrega valor
sozinho (gerar a autoavaliação do período) mesmo sem o disparo proativo de calendário.

**Independent Test**: Com a conta QA (com entradas distribuídas no tempo), escolher um período → ver 2
autoavaliações estruturadas que agregam as entradas daquele intervalo, cada ponto ancorado em evidência
real, sem número inventado, passando nas regras anti-IA.

**Acceptance Scenarios**:

1. **Given** um usuário com entradas num período, **When** ele gera a autoavaliação daquele período,
   **Then** vê 2 versões estruturadas que agregam as entradas do intervalo, ancoradas em evidência real,
   sem inventar métrica ausente.
2. **Given** o mesmo motor (`generateDraft`), **When** o formato é "autoavaliação", **Then** o schema e
   o prompt próprios do formato são aplicados e a saída passa pela mesma validação anti-IA dos demais.
3. **Given** um período com poucas (ou nenhuma) entradas, **When** o usuário gera, **Then** o sistema
   reconhece a base limitada (não inventa para preencher) e sugere registrar mais — nunca uma
   autoavaliação fabricada.

### User Story 2 — O produto me lembra antes do ciclo (gatilho de calendário) (Priority: P2)

Ancorado no nudge da 016, o produto **ressurge a autoavaliação no momento certo** — quando o ciclo de
avaliação se aproxima — com um convite do tipo "seu ciclo está chegando; seu ano já está aqui". O
gatilho é de **rotina/calendário** (não "faz X dias que você sumiu"), e empurra a alimentação **antes**
da véspera, para o material chegar fresco. Sem o ciclo configurado, a autoavaliação continua disponível
sob demanda (US1).

**Why this priority**: É o que transforma a autoavaliação de "ferramenta que a pessoa lembra de usar"
em "gatilho que traz a pessoa de volta" — o valor de retenção. Mas depende da 016 (nudge) estar
construída, e a US1 já entrega o valor sob demanda. Por isso P2.

**Independent Test**: Com um ciclo de avaliação configurado/próximo, confirmar que o ressurgimento da
016 exibe o convite à autoavaliação ancorado no calendário; sem ciclo definido, confirmar que nada é
forçado e a geração sob demanda segue funcionando.

**Acceptance Scenarios**:

1. **Given** um ciclo de avaliação próximo, **When** a pessoa abre o app, **Then** o ressurgimento
   (016) inclui um convite à autoavaliação ancorado no calendário, sem linguagem de cobrança.
2. **Given** nenhum ciclo definido, **When** a pessoa usa o app, **Then** nada é forçado; a
   autoavaliação permanece acessível sob demanda.
3. **Given** o ciclo se aproximando com poucos dados recentes, **When** o nudge aparece, **Then** ele
   convida a **registrar antes** (alimentar), não a gerar uma autoavaliação magra na véspera.

### User Story 3 — Ajustar, copiar e levar a autoavaliação (Priority: P2)

Depois de ver as 2 versões, a pessoa **edita** o texto, aplica **chips de ajuste** ("mais conciso",
"mais formal", "foca em impacto") e **copia** o resultado para colar no formulário/documento de
avaliação — reusando o fluxo de edição/cópia que a 013 já entrega.

**Why this priority**: Fecha o ciclo do valor (sair com o material pronto), mas a geração já entrega
valor sem isto. Reuso direto da 013, por isso P2.

**Independent Test**: Com uma autoavaliação gerada, editar inline, aplicar "mais conciso" e ver o texto
encurtar mantendo a evidência; copiar e confirmar que foi para a área de transferência.

**Acceptance Scenarios**:

1. **Given** 2 versões geradas, **When** o usuário edita uma, **Then** a edição é refletida e marcada
   como `edited` (mesmo lifecycle dos demais drafts).
2. **Given** uma versão selecionada, **When** o usuário aplica um chip de ajuste, **Then** o texto é
   regerado com o ajuste, mantendo a evidência e passando nas regras anti-IA.
3. **Given** uma versão pronta, **When** o usuário copia, **Then** o texto vai para a área de
   transferência e o draft é marcado como `copied`.

### Edge Cases

- **Período sem entradas / muito curto**: reconhece a base limitada, não fabrica; convida a registrar.
- **Período enorme (anos)**: agrega com limite seguro de evidência (sem estourar contexto), priorizando
  as entradas mais relevantes/recentes do intervalo.
- **Número inexistente**: métrica é convite, nunca invenção — sem número na evidência, afirma pela
  evidência qualitativa (igual ao espelho/013).
- **Saída viola anti-IA**: passa pelo ruleset antes de exibir; regenera uma vez; persistindo, estado de
  erro honesto.
- **Ciclo de calendário não configurado**: o gatilho proativo simplesmente não dispara; a geração sob
  demanda nunca é bloqueada (nunca página em branco).
- **016 ainda não construída**: a US1 (sob demanda) funciona de forma independente; só o gatilho
  proativo (US2) espera a 016.

## Requirements *(mandatory)*

### Functional Requirements

#### Geração da autoavaliação (US1)
- **FR-001**: O sistema MUST gerar uma **autoavaliação estruturada** a partir de um **período** escolhido
  pelo usuário, agregando as entradas daquele intervalo como evidência.
- **FR-002**: A autoavaliação MUST ser um **novo formato** do motor existente (`generateDraft`), com seu
  prompt e schema próprios, **2 variações**, reusando a validação anti-IA — sem motor paralelo.
- **FR-003**: O sistema MUST carregar a evidência por **período** (novo seed por intervalo de datas,
  espelhando `loadProjectSeed`), escopada ao usuário (RLS), com **limite seguro** de evidência para não
  estourar o contexto do LLM.
- **FR-004**: Cada afirmação da autoavaliação MUST ser ancorada em evidência real; número só quando
  existe na evidência; **nunca** inventar métrica ou entrega ausente.
- **FR-005**: Com período sem evidência suficiente, o sistema MUST reconhecer a base limitada e
  convidar a registrar, **sem** fabricar uma autoavaliação.

#### Gatilho de calendário (US2 — depende da 016)
- **FR-006**: O sistema MUST poder ressurgir a autoavaliação no momento do ciclo de avaliação,
  **reusando o nudge da 016** (ancorado em rotina/calendário), sem linguagem de cobrança.
- **FR-007**: Quando o ciclo se aproxima com poucos dados recentes, o nudge MUST convidar a **registrar
  antes** (alimentar), não a gerar uma autoavaliação magra na véspera.
- **FR-008**: Sem ciclo configurado, o gatilho proativo MUST NOT disparar; a geração sob demanda (US1)
  MUST permanecer sempre disponível.

#### Ajuste, cópia e persistência (US3 — reuso 013)
- **FR-009**: O usuário MUST conseguir editar o texto, aplicar chips de ajuste e copiar, reusando o
  fluxo da 013; o draft MUST persistir com o lifecycle existente (`generated`/`edited`/`copied`/
  `discarded`) e RLS.

#### Plataforma e dados (constituição)
- **FR-010**: O novo formato MUST estender o CHECK de `drafts.format` (migration pequena); o número MUST
  ser o próximo livre confirmado na implementação (**não** `010`, já em `main` pela 015), respeitando a
  ordem de merge dos elos paralelos.
- **FR-011**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando.
  Zero string hardcoded.
- **FR-012**: Toda entrada do usuário MUST ser validada/sanitizada antes do LLM; o contexto de IA MUST
  NUNCA incluir dado de outro usuário; RLS de `drafts` e `entries` preservada.

### Key Entities *(include if feature involves data)*

- **Draft** (`drafts`, evolução): reusa a tabela; **novo `format='self_assessment'`** (nome final a
  confirmar) no CHECK. Lifecycle e RLS reusados.
- **PeriodSeed** (conceitual / novo loader): um intervalo de datas como fonte de evidência; agrega as
  `entries` do período (escopadas ao usuário), com limite seguro.
- **SeedEvidence** (reuso): a evidência agregada que ancora a autoavaliação — a prova do moat.
- **ReviewCycle** (conceitual): a referência de calendário que o gatilho da 016 usa para ressurgir a
  autoavaliação (como o usuário informa o ciclo é decisão de Clarifications).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de um período com N entradas, o usuário sai com 2 autoavaliações estruturadas que
  agregam aquelas entradas, ancoradas em evidência real, sem número inventado — verificável em teste.
- **SC-002**: 100% das autoavaliações exibidas passam pelo ruleset anti-IA (após no máximo uma
  regeneração) — verificável em teste.
- **SC-003**: O mesmo `generateDraft` atende a autoavaliação trocando só prompt + schema (sem caminho
  paralelo) — verificável em teste de que o formato compartilha o caminho de validação.
- **SC-004**: Período sem evidência suficiente nunca produz autoavaliação fabricada — verificável em
  teste do estado honesto.
- **SC-005**: O gatilho de calendário (quando a 016 existe e o ciclo está definido) ressurge a
  autoavaliação ancorada em rotina; sem ciclo, nada é forçado — verificável em teste dos dois ramos.
- **SC-006**: Cobertura de teste ≥ 80% nos caminhos novos (seed por período, prompt/schema da
  autoavaliação, gatilho de calendário).
- **SC-007**: Validação manual da Ohana: a autoavaliação gerada do ano real é material que ela
  **levaria com confiança** para um ciclo de avaliação — fiel, sem floreio.

## Assumptions

- Reusa o motor da 013 (`generateDraft`, validação anti-IA, edição/cópia) e o `drafts` (009/010). A 015
  já está em `main`.
- A autoavaliação é um **novo formato** (não um `impact_summary` mais longo): estrutura própria,
  evidência **agregada por período**.
- O gatilho de calendário **reusa o nudge da 016**; a 019 depende da 016 estar construída para o disparo
  proativo (a US1, sob demanda, é independente).
- A migration é só estender o CHECK de `format`; o número é confirmado na implementação (≠ `010`).
- Personas-guia: todas, no momento episódico do ciclo de avaliação — `docs/discovery-retencao-e-conteudo.md`.

## Out of Scope

- **Motor de geração novo** — reusa `generateDraft` (constituição III).
- **Integração com ferramentas de RH / formulários de avaliação** (preencher o sistema da empresa
  automaticamente) — o v1 entrega o texto pronto para copiar.
- **Lembrete por e-mail/push do ciclo** — o gatilho é in-app (reusa o nudge da 016); e-mail é evolução
  condicional (regras anti-lixo do discovery).
- **Os outros elos** — captura/nudge (016), feed (017), seeds de post (018).
