# Feature Specification: Autoavaliação de Desempenho

**Feature Branch**: `019-autoavaliacao`

**Created**: 2026-06-15

**Status**: Draft — **REDESENHADA em 2026-06-19** (modelo "cockpit"). A implementação parcial da PR 46
(US1 reusando o fluxo de post) foi descartada como modelo de interação; a **fundação** é reaproveitada.

> ⚠️ **REDESIGN (2026-06-19) — leia antes de implementar.** O modelo abaixo descrito nas seções
> originais ("AI gera 2 variações → você edita/copia", herdado do motor de post) **foi substituído**
> pelo modelo **cockpit: lembrar → refletir → planejar**, onde **o usuário escreve a própria
> autoavaliação** e a IA apenas ancora em fato e oferece um passo-pra-frente não-invasivo. Direção
> completa e fundamentada (com pesquisa de mercado) em **`docs/estrategia-autoavaliacao-cockpit.md`**;
> dados/posicionamento em `docs/mercado.md`. As Clarifications de **2026-06-19** abaixo são as que
> valem; onde as user stories originais conflitarem, o modelo cockpit vence.

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

### Session 2026-06-15 (clarify)

- Q: Formato do artefato? → A: **Estruturada por seções** (entregas / impacto / evolução / pontos a
  desenvolver), pronta para um formulário de avaliação — não um texto corrido.
- Q: Como escolher o período? → A: **Presets ("este ano", "último ciclo") + range personalizado.**
- Q: Inclui "pontos a desenvolver"? → A: **Sim, mas ancorados em evidência honesta** — uma força ainda
  "Emergente" (não consolidada), um tema com pouca evidência, ou uma intenção de crescimento que a
  pessoa informa. **Nunca fraqueza inventada** (preserva a disciplina anti-invenção).
- Q: Gatilho de calendário no v1? → A: **Sim, mas só nudge no painel** (reusa a 016); **e-mail fica
  como fast-follow** (não reabrir a infra de e-mail antes de o in-app provar valor — decisão do
  discovery §8; e-mail por relógio fixo viraria lixo).
- Q: Recorrência do gatilho? → A: **Default trimestral/semestral, editável pela pessoa.** O nudge
  **mensal leve** de "manter o dado fresco" **NÃO** é desta feature — é o ressurgimento da 016. Aqui é o
  payoff **pesado e episódico**, ancorado no ritmo real de avaliação; não vira nag mensal.

### Session 2026-06-19 (redesign — modelo cockpit)

Substitui o modelo de interação das clarificações anteriores. Fundamentação e fontes em
`docs/estrategia-autoavaliacao-cockpit.md`.

- Q: A IA escreve a autoavaliação? → A: **Não.** A autoavaliação é superfície **"pra dentro"**: **o
  usuário escreve** (primeira pessoa, "como eu me vejo"); a IA é **âncora de evidência e assistente
  não-invasiva**, nunca ghostwriter. Ghostwriting é o que produz o "não é meu".
- Q: Como se evita a página em branco sem a IA escrever? → A: **Recap "o seu ano, em fatos"** (enxuto,
  cada item com a fonte do registro, zero adjetivo) **antes** de escrever, como auxílio de memória; e
  **sentence-stems ancorados em fato** na superfície de escrita. Nunca texto pré-pronto.
- Q: Qual o papel da IA durante a escrita? → A: **Microssugestão + "reescreve com minhas palavras"**
  (nunca gera bloco; nunca insere/sobrescreve — a pessoa aceita/rejeita/edita); **nudge de STAR/
  impacto** ("qual foi o resultado/número?"); **trilha de evidências** ao lado (chips clicáveis pra
  citar, nunca auto-inseridos). A IA **nunca dá nota** nem "melhora" a autoavaliação (anti-IA-juiz).
- Q: O que vem depois de escrever? → A: **Um passo-pra-frente**, oferta **única, in-flow, opcional,
  ancorada nas palavras da pessoa**: virar "pontos a desenvolver" em **plano de ação** (GROW Will +
  70-20-10, ação de experiência) e/ou **prep de conversa com o gestor**. Re-entrada ética (data que a
  pessoa define; sem streak/gamificação; silêncio se recusar).
- Q: A escrita da pessoa alimenta o espelho? → A: **Não.** Autoavaliação é interpretação, não
  evidência; vive em `drafts`, separada de `entries`. O espelho continua só com fato registrado.
- Q: "Um motor, vários destinos" ainda vale? → A: Vale como **dois modos**: superfícies "pra fora"
  (post/bio) seguem IA-assistida; superfícies "pra dentro" (autoavaliação, e futuramente o espelho)
  são escritas pela pessoa e ancoradas pela IA. O motor da 013 deixa de ser o destino da autoavaliação.

### Session 2026-06-19 (clarify — pós-plan cockpit)

Fecha as decisões abertas que o plano levantou (research D1–D9). Reconcilia os FR/SC, que ainda
estavam no vocabulário do modelo de geração.

- Q: A autoavaliação escrita pela pessoa passa pelo ruleset anti-IA? → A: **Não.** O `body` é texto
  **humano**; o ruleset anti-IA vale só para **saída de modelo** (a reescrita do `assist` e o
  passo-pra-frente). Geração de variações deixa de existir (`generateDraft` perde o destino
  `self_assessment`).
- Q: Onde persiste o passo-pra-frente gerado pela IA no v1? → A: **`drafts.qa.forwardStep`** (jsonb),
  atado ao draft da autoavaliação. Sem migration extra; promover a draft-irmão com lifecycle próprio é
  fast-follow.
- Q: As 4 seções (entregas/impacto/evolução/pontos a desenvolver) são obrigatórias? → A: **Não — são
  andaime sugerido.** A pessoa pode pular/reordenar/deixar vazias; salva parcial a qualquer momento
  (`status='draft'`). Preserva "a pessoa é autora".
- Q: Quais artefatos o passo-pra-frente entrega no v1? → A: **Só o plano de ação** (GROW Will +
  70-20-10, uma ação de experiência). O **prep de conversa com o gestor (1:1)** vira **fast-follow**.
- Q: Qual o default concreto da recorrência do ciclo? → A: **Trimestral** (`review_cycle_months = 3`),
  editável pela pessoa; `null` = sem recorrência (gatilho não dispara).
- Q: O recap "o seu ano, em fatos" usa LLM? → A: **Não — determinístico** sobre `loadPeriodSeed`, cada
  item com a fonte, zero adjetivo (garante anti-invenção por construção).

## User Scenarios & Testing *(mandatory)*

> **Nota (redesign 2026-06-19):** as user stories abaixo foram reescritas para o modelo cockpit. As
> versões anteriores (geração de 2 variações como destino de post) estão superadas.

### User Story 1 — Lembrar, refletir e escrever minha autoavaliação (Priority: P1)

Chega o ciclo. A pessoa escolhe um **período** e o sistema mostra **"o seu ano, em fatos"** — um recap
enxuto e factual do que ela registrou no intervalo (cada item com a fonte, sem bajulação) — pra ela
**lembrar antes de escrever**. Em seguida ela **escreve a própria autoavaliação** em primeira pessoa,
com a **trilha de evidências do período ao lado**; a IA só faz microssugestão, "reescreve com minhas
palavras" e puxa o foco pra resultado/impacto (STAR) — **nunca escreve por ela nem dá nota**. Ela sai
com um texto **dela**, fiel, pronto pra colar no formulário de avaliação ou levar ao gestor.

**Why this priority**: É o coração do redesign — devolve a autoria à pessoa (o que ativa o benefício
reflexivo e mata o "não é meu") sem reintroduzir a página em branco (o recap + stems ancoram).

**Independent Test**: Com a conta QA (entradas distribuídas no tempo), escolher um período → ver o
recap factual com fontes → escrever nas 4 seções com a trilha de evidências ao lado → a IA assiste sem
gerar bloco nem avaliar → salvar como autoavaliação própria (em `drafts`, fora do espelho).

**Acceptance Scenarios**:

1. **Given** um período com entradas, **When** a pessoa entra, **Then** vê primeiro um recap **factual
   e com fonte** (não uma autoavaliação pronta), e só então a superfície de escrita.
2. **Given** a superfície de escrita, **When** a pessoa escreve, **Then** a IA oferece apenas
   microssugestão/reescrita e nudge de impacto — **nunca** insere parágrafos nem atribui nota.
3. **Given** um período com pouca/nenhuma entrada, **When** a pessoa entra, **Then** o recap reconhece a
   base limitada e convida a registrar — **nunca** fabrica fatos pra preencher.
4. **Given** a autoavaliação salva, **When** se inspeciona o espelho, **Then** o texto escrito pela
   pessoa **não** aparece como evidência (segue só `entries`).

### User Story 2 — Um passo à frente, sem ser invasivo (Priority: P2)

Depois de escrever, a pessoa recebe **uma** oferta opcional, ancorada nas próprias palavras: transformar
os "pontos a desenvolver" num **plano de ação** (uma ação de experiência por área, estilo 70-20-10 +
pergunta de compromisso GROW) e/ou **preparar a conversa com o gestor** (talking points). Se recusar,
nada é forçado e não há reprovação. A data de revisão que ela mesma define vira o gatilho ético de
retorno no próximo ciclo.

**Why this priority**: Fecha o ciclo (reflexão → ação) e cria o motivo de retorno sem dark pattern. A
US1 já entrega valor sozinha.

**Acceptance Scenarios**:

1. **Given** uma autoavaliação escrita, **When** ela termina, **Then** vê **uma** oferta opcional
   citando o que **ela** escreveu — não um veredito nem um plano imposto.
2. **Given** a oferta, **When** ela recusa, **Then** segue sem nag, sem badge de incompleto.
3. **Given** que ela aceita o plano, **When** define uma data de revisão, **Then** essa data (dela) é o
   único gatilho de retorno — sem streak/gamificação.

### User Story 3 — Meu histórico de autoavaliações (Priority: P2)

A pessoa acessa as autoavaliações que já escreveu (período + data), reabre, lê e edita — o registro do
artefato episódico, **separado do feed de registros e do espelho** (vive em `drafts`).

**Acceptance Scenarios**:

1. **Given** autoavaliações salvas, **When** a pessoa abre `/autoavaliacao`, **Then** vê a lista das
   anteriores e pode reabrir/editar cada uma.
2. **Given** o histórico, **When** se inspeciona `entries`/espelho, **Then** as autoavaliações não
   aparecem lá (isolamento preservado).

---

## Anexo — user stories originais (SUPERADAS pelo redesign 2026-06-19)

> Mantidas só como referência histórica do modelo de post. **Não implementar.**

### [SUPERADA] User Story 1 — Gerar minha autoavaliação a partir do ano (Priority: P1)

Chega o ciclo de avaliação. Em vez de encarar uma página em branco tentando lembrar o que fez nos
últimos meses, a pessoa escolhe um **período** (ex.: o último ciclo / o ano) e o motor **colhe todas as
entradas daquele intervalo** e gera uma **autoavaliação estruturada por seções** — entregas, impacto,
evolução e **pontos a desenvolver** — em 2 variações, cada afirmação ancorada em evidência real, sem
inventar número. Os pontos a desenvolver **não são fraquezas inventadas**: saem de sinal honesto da
própria evidência (ex.: uma força ainda "Emergente" que não consolidou, um tema com pouca evidência) ou
de uma intenção de crescimento que a pessoa informa. Ela sai com o material pronto para preencher o
formulário de avaliação, falar com o gestor, ou fundamentar um pedido de promoção.

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
4. **Given** a seção "pontos a desenvolver", **When** a autoavaliação é gerada, **Then** os pontos
   derivam de sinal honesto da evidência (força "Emergente" não consolidada, tema com pouca evidência)
   ou de intenção informada pela pessoa — **nunca** uma fraqueza inventada sem lastro.

### User Story 2 — O produto me lembra antes do ciclo (gatilho de calendário) (Priority: P2)

Ancorado no nudge da 016, o produto **ressurge a autoavaliação no painel no momento certo** — quando o
ciclo de avaliação se aproxima — com um convite do tipo "seu ciclo está chegando; seu ano já está
aqui". A recorrência tem um **default trimestral/semestral** que a pessoa pode **editar**; o gatilho é
de **rotina/calendário** (não "faz X dias que você sumiu") e empurra a alimentação **antes** da véspera,
para o material chegar fresco. No v1 o disparo é **só no painel** — e-mail fica como fast-follow. O
nudge **mensal leve** de "manter o dado fresco" **não é desta feature** (é o ressurgimento da 016): aqui
é o payoff pesado e episódico, não um nag mensal.

**Why this priority**: É o que transforma a autoavaliação de "ferramenta que a pessoa lembra de usar"
em "gatilho que traz a pessoa de volta" — o valor de retenção. Entra no v1, mas **depende da 016**
(nudge) estar construída; a US1 já entrega o valor sob demanda. Por isso P2 (a US1 é P1).

**Independent Test**: Com a recorrência default ativa e o ciclo próximo, confirmar que o painel ressurge
o convite à autoavaliação ancorado no calendário; editar a recorrência e ver o gatilho mudar; sem
recorrência/ciclo, confirmar que nada é forçado e a geração sob demanda segue.

**Acceptance Scenarios**:

1. **Given** um ciclo de avaliação próximo (pela recorrência default ou editada), **When** a pessoa
   abre o app, **Then** o painel (via 016) inclui um convite à autoavaliação ancorado no calendário, sem
   linguagem de cobrança e **sem e-mail** no v1.
2. **Given** a recorrência default trimestral/semestral, **When** a pessoa a edita, **Then** o gatilho
   passa a respeitar a nova recorrência.
3. **Given** o ciclo se aproximando com poucos dados recentes, **When** o nudge aparece, **Then** ele
   convida a **registrar antes** (alimentar), não a gerar uma autoavaliação magra na véspera.
4. **Given** nenhuma recorrência/ciclo, **When** a pessoa usa o app, **Then** nada é forçado; a
   autoavaliação permanece acessível sob demanda (US1).

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

#### Lembrar e escrever (US1)
- **FR-001**: O usuário MUST escolher o período por **presets** ("este ano", "último ciclo") **+ range
  personalizado**; o sistema MUST carregar a evidência por **período** (`loadPeriodSeed`, por intervalo
  de datas), escopada ao usuário (RLS), com **limite seguro** de evidência (`MAX_PERIOD_EVIDENCE`).
- **FR-002**: O sistema MUST exibir, **antes** da escrita, um recap **"o seu ano, em fatos"** —
  **determinístico** (sem LLM) a partir do seed do período, cada item **com a fonte** (chip clicável
  para a `entry`), **zero adjetivo**. É auxílio de memória, não avaliação.
- **FR-003**: O usuário MUST **escrever a própria autoavaliação** em primeira pessoa. As 4 seções
  (entregas / impacto / evolução / pontos a desenvolver) são **andaime sugerido** — opcionais,
  pulável/reordenável; o sistema MUST permitir **salvar parcial** a qualquer momento (`status='draft'`).
- **FR-004**: A IA MUST assistir a escrita **sem gerar o bloco e sem dar nota**, com três ajudas opt-in:
  **"reescreve com minhas palavras"** (reformula só o texto da pessoa), **"Não sei por onde começar"**
  (a IA faz 1 pergunta ancorada no recap, cuja resposta vira rascunho **dela** — rótulo escolhido por
  dizer o que acontece; modo interno `unblock`) e **nudge STAR/impacto** (pergunta "qual foi o
  resultado/número?"; **nunca** preenche). A IA MUST NOT inserir/sobrescrever — a pessoa aceita/rejeita/
  edita.
- **FR-005**: A superfície de escrita MUST oferecer **sentence-stems ancorados em fato** (derivados do
  seed do período) e a **trilha de evidências** ao lado (chips citáveis, nunca auto-inseridos).
- **FR-006**: Com período sem evidência suficiente, o recap MUST reconhecer a **base limitada** e
  convidar a registrar, **sem** fabricar fatos. A escrita sob demanda **nunca** é bloqueada.

#### Passo-pra-frente (US2)
- **FR-007**: Após a escrita, o sistema MUST oferecer **uma** opção opcional, in-flow, **ancorada nas
  palavras que a pessoa escreveu**: transformar os "pontos a desenvolver" num **plano de ação** (GROW
  Will + 70-20-10, **uma ação de experiência**). É a **única** IA geradora da feature; o conteúdo MUST
  derivar só do `body` escrito (anti-invenção **bloqueante**: nunca inventa área nem infla caso). O
  resultado MUST persistir em **`drafts.qa.forwardStep`**. (Prep de conversa com o gestor / 1:1 é
  **fast-follow**, fora do v1.)
- **FR-008**: Recusar a oferta MUST seguir **sem nag** e sem badge de incompleto. Aceitar e definir uma
  **data de revisão** grava `profiles.review_cycle_anchor`; essa data (da pessoa) é o único gatilho de
  retorno — sem streak/gamificação.

#### Gatilho de calendário (US2 — reusa a 016)
- **FR-009**: O sistema MUST ter uma **recorrência configurável** (`review_cycle_months`, **default
  trimestral = 3**, editável); o disparo proativo no v1 é **só no painel** (reusa a superfície de
  ressurgimento da 016), **sem e-mail**. Quando o ciclo se aproxima com poucos dados recentes, o convite
  MUST ser "registre antes" (alimentar), não "escreva uma autoavaliação magra".
- **FR-010**: Sem recorrência (`review_cycle_months`/`anchor` nulos), o gatilho proativo MUST NOT
  disparar; a escrita sob demanda MUST permanecer sempre disponível. O nudge **mensal leve** de manter
  o dado fresco é da **016**, não desta feature.

#### Persistência e histórico (US3)
- **FR-011**: A autoavaliação escrita MUST persistir em `drafts` (`format='self_assessment'`,
  `seed_type='period'`, `body` = texto humano), com lifecycle `draft`→`copied`/`discarded` e RLS;
  **isolada** de `entries`/espelho (a interpretação da pessoa **não** vira evidência). O `body` humano
  MUST NOT passar pelo ruleset anti-IA (que vale só para saída de modelo).
- **FR-012**: O usuário MUST acessar o **histórico** das autoavaliações (período + data), reabrir e
  editar; o histórico MUST NOT aparecer no feed de registros nem no espelho.

#### Plataforma e dados (constituição)
- **FR-013**: A migration MUST estender os CHECKs de `drafts` (`format` += `self_assessment`,
  `seed_type` += `period`, `status` += `draft`) e adicionar `profiles.review_cycle_months` +
  `review_cycle_anchor`; o número MUST ser o próximo livre — **013** (012 ocupado por `012_entry_title`
  da 017, já em `main`).
- **FR-014**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando.
  Zero string hardcoded.
- **FR-015**: Toda entrada do usuário MUST ser validada/sanitizada antes do LLM; o contexto de IA MUST
  NUNCA incluir dado de outro usuário; RLS de `drafts` e `entries` preservada.

### Key Entities *(include if feature involves data)*

- **Draft** (`drafts`, evolução): reusa a tabela para o **texto escrito pela pessoa**
  (`format='self_assessment'`, `seed_type='period'`, `body` humano, `status='draft'`→`copied`/
  `discarded`). Lifecycle e RLS reusados; isolado de `entries`/espelho.
- **PeriodSeed** (loader `loadPeriodSeed`, PR 46): intervalo de datas como fonte de evidência; agrega as
  `entries` do período (escopadas ao usuário), com limite seguro. Alimenta o recap e a trilha.
- **Recap "o seu ano, em fatos"** (derivado, não persistido): transformação **determinística** do seed —
  registros do período, cada um com a fonte, zero adjetivo.
- **ForwardStep** (`drafts.qa.forwardStep`, gerado pela IA): plano de ação (GROW + 70-20-10) ancorado nas
  palavras da pessoa, com anti-invenção bloqueante. Único conteúdo gerado por LLM na feature.
- **ReviewCycle / Recorrência** (`profiles`, colunas aditivas): `review_cycle_months` (**default 3**,
  editável) + `review_cycle_anchor` (a data que a pessoa define). Sem recorrência → gatilho não dispara.
- **DevelopmentArea** (seção escrita pela pessoa): "pontos a desenvolver" é texto **dela**, não
  inferência da IA; o passo-pra-frente pode ancorar nela, mas nunca inventa fraqueza.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ao abrir um período com N entradas, o recap **"o seu ano, em fatos"** lista os registros
  do intervalo, **cada um com a fonte**, **sem adjetivo** e **sem LLM** — verificável em teste do
  loader determinístico.
- **SC-002**: A IA durante a escrita **nunca** insere bloco nem atribui nota; só microssugestão/
  reescrita (sobre o texto da pessoa) e nudge de impacto — verificável em teste de que `assist` não
  retorna afirmação factual nova.
- **SC-003**: A autoavaliação escrita (`body` humano) **não** passa pelo ruleset anti-IA e **não**
  aparece como evidência no espelho/`entries` — verificável em teste de isolamento.
- **SC-004**: Período sem evidência suficiente nunca produz texto fabricado; o recap reconhece a base
  limitada — verificável em teste do estado honesto.
- **SC-005**: O passo-pra-frente (plano de ação) deriva **só** do que a pessoa escreveu e passa pela
  checagem anti-invenção antes de persistir — zero área/fraqueza inventada — verificável em teste.
- **SC-006**: O gatilho de calendário ressurge a autoavaliação **no painel** na recorrência configurada
  (default trimestral = 3 meses, editável); sem recorrência, nada é forçado; **sem e-mail no v1** —
  verificável em teste dos ramos.
- **SC-007**: Cobertura de teste ≥ 80% nos caminhos novos (recap determinístico, `assist`,
  passo-pra-frente anti-invenção, sinal de calendário).
- **SC-008**: Validação manual da Ohana: a autoavaliação que **ela escreveu** (com a IA ancorando, não
  escrevendo) é material que ela **levaria com confiança** para um ciclo — fiel, sem floreio, e **dela**.

## Assumptions

- **A autoavaliação é escrita pela pessoa**, não gerada. `generateDraft` (motor da 013) **deixa de ser
  o destino** da autoavaliação — segue dono só das superfícies "pra fora" (post/bio/resumo).
- Reusa o `drafts` (009/010) para **persistir o texto humano** (`format='self_assessment'`,
  `status='draft'`, `body` humano) e a fundação de período da PR 46 (`loadPeriodSeed`, `period.ts`,
  `PeriodPicker`). A 015/016/017 já estão em `main`.
- O recap "o seu ano, em fatos" é **determinístico** (sem LLM) sobre o seed do período. A única IA
  geradora é o **passo-pra-frente** (plano de ação), com anti-invenção bloqueante; a assistência de
  escrita (`assist`) reformula/pergunta, nunca afirma fato novo.
- O passo-pra-frente persiste em **`drafts.qa.forwardStep`** (sem migration extra); draft-irmão com
  lifecycle próprio é fast-follow.
- O gatilho de calendário **reusa a superfície de ressurgimento da 016**; a US1 (sob demanda) é
  independente. Recorrência com **default trimestral (3 meses), editável**; disparo **só painel** no v1.
- A migration é **013** (012 ocupado por `012_entry_title` da 017): estende `format`/`seed_type`/`status`
  de `drafts` + recorrência em `profiles`.
- Personas-guia: todas, no momento episódico do ciclo de avaliação — `docs/discovery-retencao-e-conteudo.md`.

## Out of Scope

- **IA geradora da autoavaliação** — a pessoa escreve; a IA ancora. `generateDraft` perde o destino
  `self_assessment` (não há "gerar 2 variações").
- **Prep de conversa com o gestor / 1:1** — **fast-follow**; o v1 entrega só o plano de ação como
  passo-pra-frente.
- **Passo-pra-frente como draft-irmão com lifecycle próprio** — v1 guarda em `qa.forwardStep`; promover
  é fast-follow.
- **Integração com ferramentas de RH / formulários de avaliação** (preencher o sistema da empresa
  automaticamente) — o v1 entrega o texto pronto para copiar.
- **Lembrete por e-mail/push do ciclo no v1** — o gatilho é **só painel** (reusa o nudge da 016);
  e-mail é **fast-follow** condicional, quando o in-app provar valor, seguindo as 4 regras anti-lixo do
  discovery (por evento/delta, carrega o valor, frequência se ganha, um trabalho por e-mail).
- **Nudge mensal leve de "manter o dado fresco"** — é o ressurgimento da **016**, não desta feature.
- **Pontos a desenvolver como crítica/fraqueza não-ancorada** — só itens com lastro honesto ou intenção
  informada; nada inventado.
- **Os outros elos** — captura/nudge (016), feed (017), seeds de post (018).
