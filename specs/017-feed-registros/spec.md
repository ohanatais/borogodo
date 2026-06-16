# Feature Specification: Feed de Registros (+ grade-faísca)

**Feature Branch**: `017-feed-registros`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada)

**Input**: Segundo elo da aposta de retenção, conforme o discovery
`docs/discovery-retencao-e-conteudo.md` (seções 4 e 10). Fecha o loop "ver a pilha crescer": é a
única superfície onde o **investimento** (cada captura) vira **patrimônio visível e contável** — o
equivalente ao histórico de chats do Claude. Enquanto o `/historico` esconde o dado cru de propósito
(sintetiza, agrupa por empresa, deduplica), falta o **feed cru de tudo que foi registrado**. A 017
entrega esse feed + a **grade de atividade estilo GitHub com faíscas** (a mecânica de engajamento #3
escolhida no discovery), que dá leitura macro instantânea e é a ponte clicável para o feed.

> **Por que isto retém**: Ana prepara um review filtrando o trimestre; Bruno acha os números que
> esqueceu; Clara vê a pilha crescer contra o "meu trabalho é invisível"; Rafael ganha a
> granularidade que o `/historico` apaga. A recompensa do investimento fica **visível** — a metade
> que falta do conserto do loop Hooked (a 016 encurta a recompensa no retorno; a 017 a torna
> patrimônio acumulável).

> **Estado atual do código (a 017 evolui o que existe).** Audit feito no kickoff:
> - **`entries` já tem o que a busca semântica precisa**: `evidences` JSONB (migration 007), `embedding
>   vector(1536)` + índice HNSW (008, hoje só usados para dedup), bucket `evidence-files` (imagens).
> - **`/historico` já existe e sintetiza**: `getHistoricoData.ts` agrupa por empresa → cargos →
>   projetos → entradas; a 017 **complementa** com o feed cru (`getFeedData.ts` espelhando o padrão).
> - **3 representações divergentes de "entrada" já existem**: `EntryItem`, `TrajectoryHighlights`,
>   `RecentEntries` (esta nem montada no painel). A 017 consolida num `<EntryCard variant>` único.
> - **NÃO existe coluna `title`**: a 017 adiciona (migration pequena) + gera o título no momento da
>   extração (a IA já roda ali) + fallback determinístico.

## Clarifications

### Session 2026-06-15 (kickoff da 017, antes da implementação)

- Q: Rota nova ou item de nav novo? → A: **Rota nova `/registros`, sem 5º item de nav.** A barra já
  tem 4 itens. Acesso via "Ver tudo →" do painel e cross-link no `/historico`. Modelo mental:
  histórico de chats. (Decisão do discovery §4.)
- Q: `/historico` é substituído pelo feed? → A: **Não.** São complementares e fazem cross-link: o
  `/historico` é a síntese curada (empresa/projeto); o `/registros` é o cru, granular, contável.
- Q: A grade-faísca aparece sempre? → A: **Amadurece com massa crítica.** Com 2–3 faíscas é um céu
  vazio e triste; no começo o feed cru + o medidor de força carregam o peso, e a grade entra como
  recompensa de quem já alimentou. (Discovery §10.)
- Q: Migration nova? → A: **Sim, pequena** (coluna `title` + índice por `entry_date`). ⚠️ O número
  **não é 010** (reservado pela 015, não-mergeada) — confirmar no kickoff de implementação relativo à
  ordem de merge 015→016→017 (provável `011`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ver a pilha inteira: o feed cru de registros (Priority: P1)

A pessoa abre `/registros` e vê **tudo o que já registrou**, em ordem cronológica, como um feed de
atividade — não a síntese curada do `/historico`, mas o dado cru, granular e contável. Cada item é um
**card colapsado** com título (gerado automaticamente), metadados (origem, data, empresa/cargo quando
houver), badge de métrica se existir, tags e thumbnail se houver imagem. Ao expandir, vê os campos
estruturados, a imagem maior e um botão **"Usar"** que leva direto à geração de conteúdo (fecha o loop
North Star a partir do feed). A pilha crescendo é a prova visível de que o trabalho dela não é
invisível.

**Why this priority**: É o coração da feature e a única superfície que transforma o investimento em
patrimônio visível. Sem ela, a 017 não existe. Entrega valor sozinha (ver/buscar/usar) mesmo sem a
grade-faísca.

**Independent Test**: Com a conta QA (com histórico), abrir `/registros` → ver todos os registros como
cards colapsados com título e metadados → expandir um → ver campos estruturados + "Usar" → confirmar
que "Usar" abre a geração com aquela evidência carregada.

**Acceptance Scenarios**:

1. **Given** um usuário com N entradas, **When** abre `/registros`, **Then** vê os N registros como
   cards colapsados em ordem cronológica, cada um com título, origem, data e (quando houver) métrica,
   tags e thumbnail — sem a agregação por empresa do `/historico`.
2. **Given** um card colapsado, **When** o usuário o expande (`aria-expanded`), **Then** vê os campos
   estruturados, a imagem maior se houver, e o botão "Usar".
3. **Given** um card expandido, **When** o usuário clica "Usar", **Then** a geração de conteúdo abre com
   a evidência daquele registro carregada.
4. **Given** muitos registros, **When** o usuário rola o feed, **Then** o carregamento é paginado (sem
   travar nem carregar tudo de uma vez) e mantém a ordem.

### User Story 2 — Dois eixos de tempo: "quando anotei" vs "quando aconteceu" (Priority: P1)

O mesmo feed se lê por **dois eixos**, via toggle com estado **na URL** (linkável): "quando anotei"
(`created_at`, feed de atividade — quando o registro entrou) e "quando aconteceu" (`entry_date`,
timeline de carreira expandida e granular — quando o fato ocorreu). É a diferença entre "o que andei
registrando" e "o que aconteceu na minha carreira", e cada um serve um momento (revisar atividade
recente vs. montar a narrativa cronológica de carreira).

**Why this priority**: Sem o eixo "quando aconteceu", o feed é só um log de digitação e perde o uso de
preparar review/narrativa de carreira (o caso da Ana e do Rafael). É parte do núcleo do valor, não um
extra. O estado na URL torna o feed compartilhável/linkável.

**Independent Test**: Em `/registros`, alternar o toggle → confirmar que a ordenação muda entre
`created_at` e `entry_date`, que o estado vai pra URL, e que abrir a URL direto reproduz o mesmo eixo.

**Acceptance Scenarios**:

1. **Given** o feed aberto no eixo "quando anotei", **When** o usuário troca para "quando aconteceu",
   **Then** a ordenação passa a usar `entry_date` (com tratamento de datas ausentes) e o estado é
   refletido na URL.
2. **Given** uma URL de `/registros` com o eixo "quando aconteceu", **When** alguém a abre direto,
   **Then** o feed carrega já nesse eixo.
3. **Given** entradas sem `entry_date`, **When** o eixo "quando aconteceu" é usado, **Then** elas têm
   um tratamento previsível (ex.: agrupadas ao fim como "sem data"), nunca sumindo nem quebrando a
   ordem.

### User Story 3 — Todo card tem um título (nunca página em branco) (Priority: P2)

Cada registro ganha um **título curto** gerado **no momento da extração** (a IA já roda ali — sem
chamada extra), persistido em coluna nova. Quando a geração falha ou o registro é antigo (pré-feature),
um **fallback determinístico** (primeiros ~60 caracteres de `what_i_did`) garante que nenhum card fique
sem título. Princípio "nunca página em branco" aplicado ao feed.

**Why this priority**: É o que torna o feed legível e escaneável (cards sem título viram um muro de
texto). Mas o feed funciona com o fallback determinístico mesmo sem o título de IA, então P2.

**Independent Test**: Criar uma entrada nova → confirmar que ela ganha um título de IA persistido;
checar um registro antigo (sem título) → confirmar que o feed mostra o fallback determinístico, nunca
um card sem título.

**Acceptance Scenarios**:

1. **Given** uma nova captura, **When** a extração roda, **Then** um título curto é gerado junto (sem
   chamada de IA extra) e persistido.
2. **Given** um registro sem título persistido (antigo ou geração falha), **When** o feed o exibe,
   **Then** usa o fallback determinístico (início de `what_i_did`) — nunca um card vazio.

### User Story 4 — Buscar e filtrar a pilha (Priority: P2)

A pessoa **busca** por texto (MVP: `ilike` no conteúdo + tags) e **filtra** por período (presets +
range), empresa, tags, com-métrica e tipo de origem. Ana filtra o trimestre para um review; Bruno acha
o número que esqueceu. A busca semântica em linguagem natural (reusando o `embedding` + HNSW que já
existem) é evolução conectada à promessa do v1, mas o MVP é textual.

**Why this priority**: Multiplica o valor do feed para o uso episódico (preparar review/entrevista),
mas o feed cru já entrega valor sem busca/filtro. Por isso P2.

**Independent Test**: Em `/registros`, buscar um termo presente em uma entrada → ver só os registros que
casam; aplicar filtro "com métrica" + empresa → ver o subconjunto correto; limpar → voltar ao feed
completo.

**Acceptance Scenarios**:

1. **Given** o feed, **When** o usuário busca um termo, **Then** vê os registros cujo conteúdo ou tags
   casam (busca textual), sem vazar registros de outro usuário.
2. **Given** o feed, **When** o usuário aplica filtros (período / empresa / tags / com-métrica /
   origem), **Then** o feed reduz ao subconjunto correspondente e os filtros são combináveis.
3. **Given** filtros ativos, **When** o usuário os limpa, **Then** o feed volta ao conjunto completo.

### User Story 5 — A grade-faísca: o mapa do ano (Priority: P2)

No topo do feed, uma **grade de atividade estilo GitHub** (dias/semanas × colunas, fundo de células
bem claras) com **faíscas preenchendo** os dias que tiveram registro e célula vazia (clara, não
vermelha) quando não houve. A temperatura caminha de lilás suave a coral nos recentes, dando leitura
macro instantânea ("o que importa agora está aceso") sem legenda. Cada faísca é **clicável** → filtra
o feed por aquele período. A grade **amadurece com massa crítica**: com poucos registros, o feed cru e
o medidor de força carregam o peso; a grade entra como recompensa de quem já alimentou.

**Why this priority**: É a mecânica de engajamento que dá orgulho do acúmulo e leitura macro, mas é
sobre o feed (US1) que ela opera — sem o feed, não há o que mapear. Por isso P2, e condicionada a
massa crítica.

**Independent Test**: Com uma conta com registros distribuídos no tempo, abrir `/registros` → ver a
grade com faíscas nos dias com registro e células claras nos vazios; clicar numa faísca → ver o feed
filtrar para aquele período. Com conta quase vazia, confirmar que a grade não aparece (ou aparece
contida) sem parecer triste.

**Acceptance Scenarios**:

1. **Given** uma conta com registros suficientes, **When** abre `/registros`, **Then** vê a grade no
   topo com faíscas nos dias com registro e células claras (nunca vermelhas) nos dias sem.
2. **Given** a grade exibida, **When** o usuário clica numa faísca/célula, **Then** o feed filtra para
   aquele período (e o estado vai pra URL, como US2/US4).
3. **Given** uma conta com pouquíssimos registros, **When** abre `/registros`, **Then** a grade não se
   impõe (oculta ou contida) e o feed cru carrega o valor — sem "céu vazio e triste".

### User Story 6 — O painel aponta pro feed (Priority: P2)

No Painel, a seção de destaque por métrica (`TrajectoryHighlights`) dá lugar a **"Seus registros"** (os
5 mais recentes) + **"Ver tudo →"** que leva ao `/registros`. O `MiniTimeline` é mantido (propósito
diferente). A curadoria por métrica **não é deletada** — vira um filtro "com métrica" dentro do feed.

**Why this priority**: Conecta o painel ao feed e dá o ponto de entrada principal, mas o feed é
acessível e valioso independ do painel. P2.

**Independent Test**: Abrir o Painel → ver "Seus registros" (5 recentes) + "Ver tudo →" no lugar do
destaque por métrica; clicar "Ver tudo →" → cair no `/registros`; confirmar que o `MiniTimeline` segue
e que o filtro "com métrica" existe no feed.

**Acceptance Scenarios**:

1. **Given** o Painel, **When** carrega, **Then** mostra "Seus registros" (5 mais recentes) + "Ver
   tudo →" no lugar de `TrajectoryHighlights`, mantendo `MiniTimeline`.
2. **Given** o Painel, **When** o usuário clica "Ver tudo →", **Then** vai para `/registros`.
3. **Given** o feed, **When** o usuário quer só registros com métrica, **Then** o filtro "com métrica"
   reproduz a antiga curadoria (nada se perdeu, só mudou de lugar).

### Edge Cases

- **Banco vazio / primeira vez**: `/registros` mostra um estado de boas-vindas que convida a capturar
  (nunca página em branco); a grade-faísca não aparece.
- **Registro sem `entry_date`**: tratamento previsível no eixo "quando aconteceu" (agrupado como "sem
  data"), nunca some.
- **Registro sem título e sem `what_i_did` útil**: o fallback ainda produz algo legível (ex.: data +
  origem), nunca um card vazio.
- **Busca sem resultado**: estado honesto ("nada encontrado para X") + limpar busca, sem parecer erro.
- **Imagem/anexo ausente ou quebrado**: o card degrada sem thumbnail, sem layout quebrado.
- **Muitos registros (paginação)**: o feed pagina por cursor; a grade-faísca agrega sem carregar todas
  as entradas na memória.
- **Acesso a registro de outro usuário**: RLS bloqueia (`auth.uid() = user_id`); IDs internos não
  vazam.

## Requirements *(mandatory)*

### Functional Requirements

#### Feed cru (US1)
- **FR-001**: O sistema MUST oferecer a rota `/registros` que lista **todas** as entradas do usuário em
  ordem cronológica, como feed cru (sem a agregação por empresa do `/historico`), **sem** adicionar um
  5º item de nav.
- **FR-002**: Cada registro MUST ser um card **colapsável** (`aria-expanded`): colapsado mostra título,
  origem, data, empresa/cargo (quando houver), badge de métrica, tags e thumbnail se houver imagem;
  expandido mostra os campos estruturados, imagem maior e o botão **"Usar"**.
- **FR-003**: O botão "Usar" no card MUST abrir a geração de conteúdo com a evidência daquele registro
  carregada (mesmo destino do "Usar" das outras superfícies).
- **FR-004**: O feed MUST paginar por **cursor** (não carregar todas as entradas de uma vez).

#### Dois eixos (US2)
- **FR-005**: O feed MUST oferecer dois eixos via toggle — "quando anotei" (`created_at`) e "quando
  aconteceu" (`entry_date`) — com o estado **na URL** (linkável e reproduzível ao abrir direto).
- **FR-006**: No eixo "quando aconteceu", entradas sem `entry_date` MUST ter tratamento previsível
  (agrupadas/sinalizadas), nunca sumindo nem quebrando a ordenação.

#### Título (US3)
- **FR-007**: O sistema MUST gerar um **título curto** no momento da extração (sem chamada de IA extra)
  e persisti-lo em coluna nova `title` em `entries`.
- **FR-008**: O feed MUST ter um **fallback determinístico** de título (início de `what_i_did`) para
  qualquer registro sem `title` persistido — nenhum card sem título.

#### Busca e filtros (US4)
- **FR-009**: O feed MUST oferecer busca textual (MVP: `ilike` em conteúdo + tags), sem vazar registros
  de outro usuário.
- **FR-010**: O feed MUST oferecer filtros combináveis: período (presets + range), empresa, tags,
  com-métrica e tipo de origem.

#### Grade-faísca (US5)
- **FR-011**: O sistema MUST exibir, no topo do feed, uma grade de atividade (estilo GitHub) com
  faíscas nos períodos com registro e células claras (nunca vermelhas) nos sem registro.
- **FR-012**: Cada faísca/célula MUST ser clicável e filtrar o feed pelo período correspondente (estado
  na URL, coerente com US2/US4).
- **FR-013**: A grade MUST amadurecer com massa crítica: com pouquíssimos registros, não se impõe
  (oculta ou contida), deixando o feed cru carregar o valor — sem "céu vazio e triste".

#### Painel (US6)
- **FR-014**: O Painel MUST substituir `TrajectoryHighlights` por "Seus registros" (5 mais recentes) +
  "Ver tudo →" para `/registros`, **mantendo** `MiniTimeline`.
- **FR-015**: A curadoria por métrica MUST NOT ser deletada — MUST virar um filtro "com métrica" dentro
  do feed.

#### Plataforma e dados (constituição)
- **FR-016**: O sistema MUST consolidar as representações divergentes de entrada (`EntryItem`,
  `TrajectoryHighlights`, `RecentEntries`) num componente único `<EntryCard variant>` reusável.
- **FR-017**: Toda query MUST ser protegida por RLS (`auth.uid() = user_id`); IDs internos MUST NOT
  vazar; busca/filtro MUST NOT permitir SQL injection (input parametrizado/validado).
- **FR-018**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando.
  Zero string hardcoded.
- **FR-019**: A migration nova (coluna `title` + índice `entries(user_id, entry_date DESC NULLS
  LAST)`) MUST usar o próximo número livre confirmado na implementação — **não** `010` (reservado pela
  015), respeitando a ordem de merge 015→016→017.

### Key Entities *(include if feature involves data)*

- **Entry** (`entries`, evolução): campos existentes + **nova coluna `title`** (curto, gerado na
  extração). `evidences` JSONB, `embedding vector(1536)` e tags já existem.
- **FeedItem** (projeção de `Entry` para o feed): título, origem, data (`created_at`/`entry_date`),
  empresa/cargo, métrica, tags, thumbnail — alimenta o `<EntryCard>`.
- **Evidence** (`entries.evidences`, reuso): itens `url`/`image`; o `image` vira thumbnail no card.
- **ActivityCell** (conceitual, derivado): a contagem de registros por período que alimenta a
  grade-faísca; agregação no servidor, sem carregar todas as entradas.
- **FeedQuery** (conceitual): eixo (`created_at`|`entry_date`) + busca + filtros + cursor de paginação,
  serializável na URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em `/registros`, o usuário vê **100%** dos seus registros (nenhum somido), em cards
  legíveis com título, e consegue abrir a geração via "Usar" direto do feed.
- **SC-002**: O usuário alterna entre "quando anotei" e "quando aconteceu" e o estado persiste na URL
  (abrir a URL reproduz o eixo) — verificável em teste.
- **SC-003**: Nenhum card aparece sem título (IA ou fallback determinístico) — verificável em teste com
  registros novos e antigos.
- **SC-004**: Busca + filtros combináveis reduzem o feed ao subconjunto correto e nunca retornam
  registro de outro usuário — verificável em teste (incluindo um caso de tentativa de injeção).
- **SC-005**: A grade-faísca reflete fielmente os dias com/sem registro e cada faísca filtra o feed;
  com conta quase vazia, a grade não se impõe — verificável em teste dos dois extremos.
- **SC-006**: O Painel mostra "Seus registros" + "Ver tudo →" e mantém `MiniTimeline`; o filtro "com
  métrica" reproduz a curadoria antiga — verificável em teste.
- **SC-007**: Cobertura de teste ≥ 80% nos módulos novos (`getFeedData`, paginação por cursor,
  agregação da grade, `<EntryCard>`).
- **SC-008**: Validação manual da Ohana: "a pilha crescendo dá orgulho" e o feed serve para preparar um
  review real (filtrar trimestre, achar números).

## Assumptions

- Reusa `entries` (+ nova coluna `title`), `evidences` JSONB, `embedding`/HNSW (008, hoje só p/ dedup),
  bucket `evidence-files`, e o padrão de `getHistoricoData.ts` (novo `getFeedData.ts`).
- A migration é pequena (coluna + índice). O **número não é 010** (reservado pela 015 não-mergeada);
  confirmar o próximo livre na implementação conforme a ordem de merge 015→016→017 (provável `011`).
- O título gerado na extração reusa a chamada Haiku que já roda na captura — sem custo de IA extra.
- A grade-faísca usa **célula = semana ou dia** a decidir no `/impeccable shape` conforme a frequência
  real do público (dia-a-dia é lindo cheio, mas pode parecer ralo p/ quem captura 1x/semana).
- A superfície visual da grade e o ponto de "massa crítica" são decisões de `/impeccable shape`
  (validar com personas, sem cravar do nosso gosto; norte: sóbrio com calor brasileiro, sem clichê).
- Personas-guia: Ana (review/filtro), Bruno (achar números), Clara (ver a pilha), Rafael
  (granularidade) — `docs/discovery-retencao-e-conteudo.md`.

## Out of Scope

- **Busca semântica em linguagem natural** (reusar `embedding` + HNSW para query do usuário) —
  evolução conectada à promessa do v1, mas o MVP é busca textual (`ilike` + tags). Requer gerar
  embedding para **toda** entrada (hoje só as com empresa) — fora do v1.
- **Anexos genéricos (PDF/DOCX) como evidência** — hoje o bucket é só imagem; anexo genérico é
  evolução (novo bucket + `type:'file'`).
- **Substituir o `/historico`** — ele complementa o feed (síntese curada vs. cru), com cross-link.
- **Captura por colar/áudio e o ressurgimento por delta** — são da 016.
- **Edição inline dos campos no card do feed** — a edição fina segue no fluxo existente; o card foca em
  ver + "Usar".
- **A mecânica "medidor de força"** (#2 do discovery §10) — vive no espelho/painel, não é desta feature
  (pode entrar noutro elo).
