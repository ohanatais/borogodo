# Feature Specification: Captura v2 — Captura sem atrito

**Feature Branch**: `016-captura-v2`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada)

**Input**: Primeira aposta de retenção pós-bloco de Presença, conforme o discovery
`docs/discovery-retencao-e-conteudo.md` (seções 1, 3 e 8). Diagnóstico central: **o gargalo de
retenção do Borogodó está no input** (alimentar dados frescos), não no output. A cadeia 013→014→015
sofisticou o lado "Usar" (gerar conteúdo); mas se a alimentação seca, o motor gera em cima de dado
velho e o output fica genérico — a mesma crítica que o produto faz ao Taplio. Esta feature ataca o
input com frentes de baixo atrito e fecha o loop Hooked **encurtando a recompensa** (um aha por
captura) e **prendendo o gatilho à rotina que já existe** (não cria ritual novo).

> **Princípio que guia tudo**: o diferenciador não é áudio vs. texto. É **trazer o material que a
> pessoa já produz em outro lugar** (uma transcrição de reunião, um e-mail, uma conversa) em vez de
> pedir um diário. Reusa o pipeline de extração que já existe (`claude-haiku-4-5` + schema Zod),
> `entries`, `ReflectionCard` e `proactive_insights`. **Provavelmente sem migration nova.**

> **Estado atual do código (a 016 evolui, não constrói do zero).** Levantamento feito no kickoff:
> - **Colar texto já vira (múltiplas) entradas hoje**: `captureAndReflect` (`src/lib/ai/extraction/`)
>   extrai `ExtractedEntry[]` de texto bruto numa chamada Haiku, validado por Zod; o `CaptureComposer`
>   já tem o textarea de captura. → US1 é **enquadrar para artefatos** + resolver o modelo de revisão,
>   não reconstruir extração.
> - **Nudge por relógio já existe**: `getCapturePrompt` (`src/lib/panel/`) escolhe um prompt por
>   dias-desde-a-última-entrada (`today`/`yesterday`/`longGap`/`themeNudge`). → US2 **substitui o
>   relógio por delta** e adiciona o ressurgimento de vitória antiga.
> - **Pergunta cirúrgica já existe, mas síncrona**: `ReflectionCard` + `PATCH /api/entries/[id]/enrich`
>   + `enrichEntryField` já perguntam e incorporam a resposta — **no momento da captura**. → US4 **mantém
>   a síncrona e adiciona** um ressurgimento **assíncrono** (a pergunta volta depois, só se a entrada
>   continuar magra) — aditivo, não substituição.
> - **Áudio é só um stub**: `AudioButton` está `disabled` ("em breve") e `transcribe.ts` lança erro
>   (costura de Whisper-servidor nunca ligada). → US3 implementa de fato, via **Web Speech client-side**
>   (decisão do discovery), não pelo stub de servidor.

## Clarifications

### Session 2026-06-15 (kickoff da 016, antes da implementação)

- Q: Esta feature cria infraestrutura de push/email/PWA? → A: **Não.** O nudge é **in-app, movido por
  delta**. Email inteligente e MCP/encaminhamento de e-mail são ondas seguintes e só se justificam se
  o in-app provar valor. Newsletter está fora do wedge do produto. (Decisão tomada — discovery §8.)
- Q: Áudio usa transcrição no servidor? → A: **Não no v1.** Começa pela **Web Speech API do navegador**
  (grátis, client-side); migrar para servidor só se a qualidade incomodar. Onde a Web Speech é fraca
  (iPhone/Safari), o texto continua sendo o caminho principal e o áudio é um plus. (Decisão tomada.)
- Q: Há migration nova? → A: **Provavelmente não.** Reusa `entries`, o pipeline de extração,
  `ReflectionCard` e `proactive_insights`. Confirmar o estado do schema no `/speckit-plan`.

### Session 2026-06-15 (clarify)

- Q: Ao colar um artefato que gera várias entradas, revisar antes de salvar ou auto-salvar? → A:
  **Auto-salvar + desfazer.** Mantém a captura de 1 toque (auto-salva todas as entradas extraídas) e
  mostra um resumo "criei N entradas" com **desfazer rápido**. Não há tela de revisão obrigatória.
- Q: O que conta como "tem novidade" no ressurgimento (delta)? → A: **≥1 entrada nova desde o último
  retorno** dispara o estado "tem novidade". O **aha de força** ("reforça sua força em Y") aparece
  quando o **espelho também regenerou** (a cada ~5 entradas); com entrada nova mas sem regeneração do
  espelho, mostra a novidade sem afirmar análise de força nova.
- Q: A pergunta cirúrgica de enriquecimento vira assíncrona? → A: **Aditivo, não substituição.** Mantém
  a pergunta **síncrona** no momento da captura (já funciona via `ReflectionCard`) **e** ressurge a
  pergunta **depois** apenas se a entrada continuar magra. Dois momentos de completude, nenhum removido.
- Q: Postura de privacidade para dado de terceiros no texto colado (v1)? → A: **RLS + aviso leve.**
  Mantém o isolamento por RLS que já existe e adiciona um aviso discreto de privacidade no campo de
  colar. **Sem** detecção/remoção automática de PII no v1.
- Q: O áudio cobre o "começar, não gostar, parar e recomeçar" (intuição do WhatsApp)? → A: **Sim —
  ciclo iniciar/parar/cancelar/regravar (FR-012a).** Diferença honesta do v1: Web Speech entrega
  **texto ao vivo**, não clipe de áudio; "ouvir de novo" vira "ler o texto", regravar limpa a
  transcrição anterior. Áudio-clipe com replay exigiria servidor → fora do v1 (Out of Scope).
- Q: Texto-ao-vivo (sem replay de áudio) está de bom tamanho pro v1? → A: **Sim.** Mantém Web Speech
  grátis/sem servidor; replay de áudio fica como evolução (Out of Scope).
- Q: Como disparar parar/cancelar na gravação? → A: **Botões explícitos** (parar/cancelar/regravar),
  não segurar-e-arrastar — por acessibilidade e por funcionar no desktop (FR-012b).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Colar um artefato e virar entradas, sem escrever do zero (Priority: P1)

A pessoa (Ana, Rafael — odeiam diário e odeiam áudio) acabou de sair de uma reunião, ou tem um
e-mail/uma conversa de chat com uma vitória dentro. Em vez de redigir um relato, ela **cola o texto
bruto** num campo de captura ("cole aqui uma transcrição de reunião, um e-mail, uma conversa") e o
pipeline de extração que já existe **quebra o material em uma ou mais entradas** estruturadas, que são
**salvas na hora** (captura de 1 toque). Um resumo "criei N entradas" aparece com **desfazer rápido**,
e ela pode editar ou excluir qualquer entrada depois no histórico — nunca uma tela de revisão
obrigatória. O atrito de "ter que formular a conquista" desaparece: ela só traz o que já produziu.

**Why this priority**: É o ataque direto ao gargalo (input) e o canal mais universal e barato (zero
infra). Atende a maior fatia do público (quem não quer áudio nem escrever) e destrava dado fresco que
faz todo o resto (espelho, voz, geração) parar de degradar. Sem este, a feature não entrega o núcleo.

**Independent Test**: Com a conta QA, colar uma transcrição de reunião com 2–3 conquistas distintas →
ver 2–3 entradas estruturadas (o que fiz / impacto / empresa quando inferível) **salvas na hora** com
um resumo "criei N entradas" + desfazer → confirmar que as `entries` aparecem no histórico, ancoradas
no texto colado, e que o desfazer remove o lote.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado no ponto de captura, **When** cola um texto com múltiplas
   conquistas e dispara a extração, **Then** o sistema cria uma ou mais `entries` (salvas na hora),
   cada uma derivada do texto colado, sem inventar fato ausente, com o conteúdo bruto preservado para
   rastreabilidade, e aplica a dedup semântica existente.
2. **Given** um lote de entradas recém-criado de um colar, **When** o resumo "criei N entradas" é
   exibido, **Then** o usuário pode **desfazer** o lote inteiro num toque (remove as entradas criadas)
   ou seguir e editar/excluir entradas individualmente no histórico.
3. **Given** um texto colado que não contém nenhuma conquista identificável, **When** a extração roda,
   **Then** o sistema responde com um estado honesto ("não encontrei uma vitória clara aqui — quer
   contar com suas palavras?") em vez de fabricar uma entrada vazia.
4. **Given** um texto muito longo (acima do limite seguro), **When** o usuário cola, **Then** o
   sistema avisa o limite e orienta, sem truncar silenciosamente nem falhar de forma opaca.

### User Story 2 — Voltar ao app e ver algo vivo: ressurgimento movido por delta (Priority: P1)

Ao abrir o app, a **primeira coisa** que a pessoa vê é uma de duas, decidida por **delta de dados**,
não por relógio:

- **Tem novidade** (≥1 entrada nova desde o último retorno) → "essa semana você fechou X". Quando o
  espelho **também** regenerou (a cada ~5 entradas), acompanha um aha de força ("isso reforça sua
  força em Y") ou um rascunho pronto; quando houve entrada nova mas o espelho não regenerou, mostra a
  novidade sem afirmar análise de força nova.
- **Não tem novidade** (nenhuma entrada nova) → ressurge uma vitória antiga ("há 1 ano você entregou
  Z") + um convite leve a registrar algo novo.

O gatilho se ancora em **rotina que já existe** (fim de semana, véspera de 1:1, ciclo de avaliação),
nunca em "faz X dias que você não escreve" (culpa). E **nunca finge análise vazia**: sem delta real,
vira gatilho de captura, não um insight inventado.

**Why this priority**: É a metade "encurtar a recompensa" do conserto do loop Hooked. Captura sem
motivo de voltar não retém; este é o motivo de voltar, e de graça (zero infra, zero risco de spam).
Valida a mecânica in-app antes de qualquer gasto com email. Sem ele, a US1 enche o banco mas a pessoa
não tem por que retornar.

**Independent Test**: Com a conta QA, (a) adicionar dado novo e reabrir → ver o estado "tem novidade"
com um aha ancorado em evidência real; (b) sem nenhum dado novo, reabrir → ver o ressurgimento de uma
vitória antiga + convite a registrar, sem nenhuma afirmação analítica nova fabricada.

**Acceptance Scenarios**:

1. **Given** ≥1 entrada nova desde o último retorno, **When** a pessoa abre o app, **Then** ela vê um
   destaque "tem novidade" ancorado nas entradas novas, sem linguagem de cobrança; o aha de força só
   acompanha se o espelho regenerou.
2. **Given** nenhuma entrada nova desde o último retorno, **When** a pessoa abre o app, **Then** ela vê
   o ressurgimento de uma conquista anterior + um convite leve a capturar, e **nenhuma** análise nova é
   inventada.
3. **Given** o ressurgimento exibido, **When** a pessoa toca no convite a registrar, **Then** ela cai
   direto num ponto de captura (colar / falar / escrever), fechando o gatilho→ação.

### User Story 3 — Falar em vez de escrever (áudio in-app) (Priority: P2)

A pessoa de perfil oral (Bruno, Clara) prefere falar a digitar. Ela toca um **botão de microfone** e
narra a conquista; a transcrição acontece **no próprio navegador** (Web Speech API, grátis) e cai no
mesmo campo de captura, de onde segue para a mesma extração da US1. Onde a Web Speech é fraca
(iPhone/Safari), a UI **deixa isso honesto** e mantém o texto/colar como caminho principal — o áudio
é um plus onde funciona bem (Android/Chrome/desktop), nunca uma promessa quebrada.

O controle de gravação segue a intuição de áudio do WhatsApp — começar, parar, **desistir no meio** e
**recomeçar do zero** —, com uma diferença honesta do v1: a Web Speech entrega **texto ao vivo**, não
um clipe de áudio. Então "ouvir de novo antes de mandar" vira **"ler o texto que saiu"** (até melhor
para o nosso caso, que é texto), e regravar significa **limpar o que transcreveu e falar de novo**. Em
nenhum momento o áudio vira entrada sozinho: sempre há o texto na tela antes de extrair. (Um modelo de
áudio-clipe com replay exigiria guardar áudio + transcrição no servidor — fora do v1, ver Out of Scope.)

**Why this priority**: Amplia o alcance da captura para um perfil real, mas o valor central (input sem
atrito) já é entregue por colar/escrever. A limitação de plataforma do v1 (Safari fraco) tira o áudio
do caminho crítico. Por isso P2.

**Independent Test**: Em Chrome/desktop, tocar o microfone, narrar uma conquista, parar → ver a
transcrição no campo; cancelar uma gravação no meio e confirmar que nada fica; regravar e confirmar que
o texto anterior é descartado; seguir para a extração da US1. Em Safari/iPhone, confirmar que a UI
sinaliza a limitação e não bloqueia a captura por texto.

**Acceptance Scenarios**:

1. **Given** um navegador com suporte a Web Speech, **When** o usuário grava e para, **Then** o texto
   transcrito aparece no campo de captura, editável antes da extração.
2. **Given** uma gravação em andamento, **When** o usuário **cancela no meio** (desiste), **Then** o
   reconhecimento para, nada é transcrito nem salvo, e a UI volta ao estado inicial (pronto pra gravar
   de novo ou digitar).
3. **Given** uma transcrição que a pessoa não gostou (ainda não extraída), **When** ela escolhe
   **regravar**, **Then** o texto anterior é descartado e uma nova gravação começa do zero — sem
   acumular com a tentativa anterior.
4. **Given** um navegador sem suporte confiável (Safari/iPhone), **When** o usuário acessa a captura,
   **Then** o botão de áudio se apresenta de forma honesta (indisponível/limitado) e o caminho de
   texto permanece plenamente funcional.
5. **Given** uma transcrição imperfeita, **When** o usuário a revisa, **Then** ele pode corrigir o
   texto antes de disparar a extração (o áudio nunca salva direto sem revisão).

### User Story 4 — Uma pergunta cirúrgica quando a entrada chega magra (Priority: P3)

Hoje, ao capturar, o produto já faz uma pergunta cirúrgica na hora (`ReflectionCard`). A 016 **mantém
esse momento** e **adiciona** um segundo: quando uma entrada continua magra (sem número, sem impacto
claro), o sistema, **num segundo momento de baixo custo**, faz **ressurgir uma** pergunta cirúrgica —
"teve algum número ou prazo nisso?" — reusando o `ReflectionCard` + `proactive_insights`. A captura
segue de 1 toque; a completude é empurrada para depois, sem travar o registro. Aditivo, não troca.

**Why this priority**: Eleva a qualidade do dado (consistência) sem adicionar atrito na captura, mas é
um refino sobre o que a US1/US3 já capturam. O produto funciona sem ele; por isso P3.

**Independent Test**: Capturar uma entrada deliberadamente magra que **não** foi enriquecida na hora →
confirmar que, depois (não no mesmo toque), **ressurge uma única** pergunta cirúrgica via
`ReflectionCard`; respondê-la enriquece a entrada; ignorá-la não quebra nada.

**Acceptance Scenarios**:

1. **Given** uma entrada que continua magra após a captura (não enriquecida na hora), **When** o
   enriquecimento assíncrono roda, **Then** o sistema faz ressurgir **uma** pergunta cirúrgica (nunca
   uma enxurrada), exibida fora do momento da captura.
2. **Given** a pergunta de enriquecimento exibida, **When** o usuário responde, **Then** a resposta é
   incorporada à entrada existente (não cria entrada nova) e a pergunta não reaparece.
3. **Given** a pergunta de enriquecimento exibida, **When** o usuário a ignora, **Then** o fluxo segue
   normal e a entrada permanece válida como está.

### Edge Cases

- **Colar texto com dado sensível de terceiros** (nomes, e-mails, conteúdo de reunião alheia): o
  conteúdo é tratado como dado do próprio usuário, isolado por RLS; nada vaza para o contexto de IA de
  outro usuário. O campo de colar exibe um **aviso leve de privacidade** ("cole só o que você pode
  guardar"). **Sem** detecção/remoção automática de PII no v1 (decisão de clarify — escopo do v1).
- **Web Speech indisponível ou permissão de microfone negada**: degrada para o caminho de texto sem
  erro opaco; a UI explica.
- **Cancelar/regravar no meio**: parar ou desistir da gravação encerra o reconhecimento na hora;
  regravar limpa a transcrição anterior antes de começar — nunca emenda a fala nova na antiga.
- **Transcrição vazia / barulho**: nada é salvo silenciosamente; o usuário vê o que foi transcrito e
  decide.
- **Delta ambíguo no nudge**: na dúvida entre "tem novidade" e "não tem", o sistema **nunca** fabrica
  análise — cai para o gatilho de captura.
- **Primeira sessão (banco vazio)**: o ressurgimento não tem vitória antiga para mostrar; cai para um
  convite de captura de boas-vindas, nunca uma página em branco.
- **Extração propõe entradas duplicadas** de um mesmo colar: reusa a dedup semântica de `saveEntries`
  (normalização + dedup no lote) já existente, para não inflar o banco.

## Requirements *(mandatory)*

### Functional Requirements

#### Colar / importar artefato (US1)
- **FR-001**: O sistema MUST oferecer um ponto de captura onde o usuário cola texto bruto (transcrição,
  e-mail, conversa) e dispara a extração que já existe (`claude-haiku-4-5` + schema Zod).
- **FR-002**: A extração MUST poder quebrar um único texto colado em **uma ou mais** entradas
  estruturadas e MUST **salvá-las na hora** (captura de 1 toque), sem tela de revisão obrigatória.
- **FR-003**: O sistema MUST exibir um resumo "criei N entradas" com **desfazer rápido** que remove o
  lote criado; MUST preservar o conteúdo bruto para rastreabilidade; e MUST aplicar a dedup semântica
  existente (`saveEntries`) para não duplicar entradas. A edição/exclusão fina segue no histórico.
- **FR-004**: Quando o texto colado não contém conquista identificável, o sistema MUST responder com
  um estado honesto e um convite, **sem** fabricar entrada vazia.
- **FR-005**: O sistema MUST impor e comunicar um limite de tamanho seguro para o texto colado, sem
  truncar silenciosamente nem falhar de forma opaca.

#### Ressurgimento in-app movido por delta (US2)
- **FR-006**: Ao abrir o app, o sistema MUST exibir um destaque que é função do **delta de dados**
  desde o último retorno: **≥1 entrada nova** → "tem novidade" (ancorado nas entradas novas); **nenhuma
  entrada nova** → "ressurgir + convidar".
- **FR-007**: O destaque "tem novidade" MUST se ancorar em entradas reais novas e MUST NOT usar
  linguagem de cobrança ("faz X dias que você sumiu"). O **aha de força** MUST acompanhar **somente
  quando o espelho regenerou** (a cada ~5 entradas); caso contrário, mostra a novidade sem afirmar
  análise de força nova.
- **FR-008**: Na ausência de entrada nova, o sistema MUST cair para ressurgimento de conquista anterior
  + convite a capturar, e MUST NOT inventar nenhuma análise nova.
- **FR-009**: O convite a registrar MUST levar diretamente a um ponto de captura (colar / falar /
  escrever), fechando gatilho→ação em um toque.
- **FR-010**: O gatilho do ressurgimento MUST ser ancorável em rotina (ex.: fim de semana, véspera de
  1:1, ciclo de avaliação), não no tempo-desde-a-última-entrada.

#### Áudio in-app (US3)
- **FR-011**: O sistema MUST oferecer captura por voz usando transcrição **no navegador** (Web Speech
  API), sem backend de transcrição no v1, alimentando o mesmo campo/extração da US1.
- **FR-012**: O áudio transcrito MUST ser revisável e editável pelo usuário **antes** da extração;
  nunca salva direto sem revisão.
- **FR-012a**: A captura por voz MUST oferecer o ciclo de controle de áudio (intuição do WhatsApp):
  **iniciar**, **parar**, **cancelar no meio** (descarta tudo, nada transcrito/salvo, volta ao estado
  inicial) e **regravar do zero** (descarta a transcrição anterior antes de iniciar a nova, sem
  acumular). No v1, com Web Speech, a revisão é **ler/editar o texto ao vivo**, não reouvir um clipe.
- **FR-012b**: Os controles de gravação MUST ser **botões explícitos** (parar / cancelar / regravar),
  rotulados e operáveis por teclado e leitor de tela — não um gesto de segurar-e-arrastar. Decisão por
  acessibilidade e por funcionar igualmente no desktop (onde o gesto do WhatsApp não se aplica).
- **FR-013**: Onde o suporte do navegador é fraco/ausente (ex.: Safari/iPhone), o sistema MUST
  sinalizar a limitação de forma honesta e MUST manter o caminho de texto plenamente funcional.

#### Enriquecimento assíncrono (US4)
- **FR-014**: O sistema MUST **manter** a pergunta cirúrgica síncrona no momento da captura (já
  existente) **e adicionar** um ressurgimento assíncrono: quando uma entrada continua magra (sem
  métrica/impacto claro) após a captura, MUST fazer ressurgir **uma única** pergunta cirúrgica, exibida
  **fora** do momento da captura, reusando `ReflectionCard` + `proactive_insights`.
- **FR-015**: A resposta à pergunta de enriquecimento MUST ser incorporada à entrada existente (não
  cria entrada nova) e a pergunta MUST NOT reaparecer após respondida ou dispensada.

#### Plataforma (constituição)
- **FR-016**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando a
  estrutura. Zero string hardcoded.
- **FR-017**: Toda entrada do usuário (texto colado, transcrição) MUST ser validada e sanitizada antes
  de qualquer chamada ao LLM; o contexto de IA MUST NUNCA incluir dado de outro usuário.
- **FR-018**: Toda nova superfície MUST respeitar a disciplina "nunca página em branco" e a RLS
  (`auth.uid() = user_id`) das entradas; IDs internos MUST NOT vazar em respostas de API.
- **FR-019**: O campo de colar artefato MUST exibir um **aviso leve de privacidade** (ex.: "cole só o
  que você pode guardar"); o v1 MUST NOT implementar detecção/remoção automática de PII — o isolamento
  por RLS é a proteção de base e dado colado é tratado como dado do próprio usuário.

### Key Entities *(include if feature involves data)*

- **Entry** (`entries`, reuso): a entrada estruturada gerada pela extração — campos existentes
  (`what_i_did`, impacto, empresa/cargo, datas, `raw_content`); a 016 não cria colunas novas (a
  confirmar no plan).
- **CaptureArtifact** (conceitual, não necessariamente persistido): o texto bruto colado ou transcrito
  que alimenta a extração; o `raw_content` da entrada preserva a rastreabilidade.
- **ProactiveInsight / ReflectionCard** (reuso): o veículo da pergunta de enriquecimento assíncrono e
  do ressurgimento/nudge in-app.
- **ReturnSignal / Delta** (conceitual): a noção de "dado novo desde o último retorno" que decide o
  estado do ressurgimento; deriva-se de `entries`/espelho, na mesma lógica do espelho que regenera a
  cada 5 entradas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de um texto colado com N conquistas distintas, o usuário sai com até N entradas
  estruturadas **salvas na hora** (com desfazer disponível), sem ter redigido nenhum relato do zero.
- **SC-002**: 100% das entradas criadas a partir de um colar derivam do texto fornecido — zero fato
  inventado — verificável em teste contra fixtures de texto colado.
- **SC-003**: Ao reabrir o app, a pessoa sempre vê um estado vivo e honesto (tem-novidade **ou**
  ressurgir+convidar) e **nunca** uma análise fabricada na ausência de dado novo — verificável em
  teste dos dois ramos do delta.
- **SC-004**: O caminho de captura por texto permanece 100% funcional em qualquer navegador, com ou
  sem suporte a áudio — o áudio nunca é pré-requisito para capturar.
- **SC-005**: Uma entrada magra gera **no máximo uma** pergunta de enriquecimento por vez, fora do
  momento da captura — verificável em teste.
- **SC-006**: Cobertura de teste ≥ 80% nos módulos novos (parser de colar/transcrição, lógica de
  delta do ressurgimento, enfileiramento da pergunta de enriquecimento).
- **SC-007**: Validação manual da Ohana: colar uma transcrição real produz entradas que ela
  reconhece como fiéis; reabrir o app "sentindo vivo" em ambos os ramos do delta.

## Assumptions

- Reusa o pipeline de extração existente (`claude-haiku-4-5` + schema Zod), `entries`, `ReflectionCard`
  e `proactive_insights`; **sem migration nova** prevista (a confirmar no `/speckit-plan`).
- O colar **auto-salva** as entradas extraídas (mantém o 1-toque do produto) + desfazer rápido no
  resumo; a curadoria fina (editar/excluir) reusa o histórico existente, não uma tela de revisão nova.
- A Web Speech API é suficiente para o v1 de áudio; servidor de transcrição é evolução condicional à
  qualidade observada.
- O "delta" que dirige o ressurgimento reusa a lógica de regeneração do espelho (a cada ~5 entradas)
  como ponto de partida; o ajuste fino do limiar é decisão de plan/implementação.
- O ressurgimento in-app vive num ponto de entrada já existente (provável: topo do Painel); a
  superfície exata é decisão de `/impeccable shape`.
- Personas-guia: Ana e Rafael (colar artefato), Bruno e Clara (áudio) — `docs/discovery-retencao-e-conteudo.md`.

## Out of Scope

- **E-mail / MCP**: encaminhar e-mail destacado ou puxar de ferramentas externas (maior valor, maior
  risco LGPD/deliverability) — onda seguinte, não MVP.
- **Email inteligente**: só depois e só se o ressurgimento in-app provar valor; quando vier, segue as
  4 regras anti-lixo do discovery (disparado por delta, carrega o valor, frequência se ganha, um
  trabalho por email).
- **Push / PWA / notificações fora do app**.
- **Newsletter** (formato e plataforma de envio) — outro produto, fora do wedge.
- **Transcrição de áudio no servidor** — evolução condicional, não v1.
- **Áudio-clipe com replay (modelo WhatsApp completo)** — gravar, dar play e regravar ouvindo o áudio
  exigiria guardar o arquivo de áudio + transcrição no servidor; o v1 entrega o equivalente em texto
  (ler/editar/regravar), não o replay do áudio.
- **Coluna `title` / feed cru de registros / grade-faísca** — são da 017.
- **Anexos genéricos (PDF/DOCX) no colar** — o v1 é texto; arquivo é evolução.
