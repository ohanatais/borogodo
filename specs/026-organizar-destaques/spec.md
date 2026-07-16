# Feature Specification: Organizar + Destaques

**Feature Branch**: `026-organizar-destaques`

**Created**: 2026-07-14

**Status**: Draft

**Input**: User description: "Organizar + destaques (depende de 025-registro-deposito): botão
opcional 'Organizar' que detecta anexos e infere métrica/impacto/tags via Haiku em campos
editáveis (só preenche vazios); se não clicado, organização assíncrona disparada pelo salvar (sem
cron, sem rascunho; 'não organizado' transitório). Registro = FONTE com destaques dentro (layout
dois níveis; não splitar fonte de um evento). Cru preservado verbatim como substrato de RAG;
geração lê a fonte, não o resumo. Títulos substantivo-primeiro/outcome-first editáveis. Tudo
conta pro Espelho (sem gestão de destino). Registros reestruturado: miniatura real, feed 1 card
por fonte com '+N destaques', timeline por mês, grade-faísca sem streak. Reusa
entries/evidences/embedding; provavelmente sem migration. Contexto:
docs/decisions/003-registro-deposito-e-captura.md."

**Contexto de decisão**: [docs/decisions/003-registro-deposito-e-captura.md](../../docs/decisions/003-registro-deposito-e-captura.md)
— decision record completo (discovery, alternativas, riscos), item "Quebra em features (A → B →
C)". Esta é a **Feature B**, que depende da Feature A (`025-registro-deposito`, fundação do
drawer sempre-salva) já implementada na branch/PR #59 (mergeada). A Feature C
(`027-importar-historico`) depende desta e fica fora de escopo aqui.

## Estado herdado da Feature A (025)

A 025 já entrega, e esta feature deve reusar sem recriar:
- **Drawer sempre-salva** (`Drawer.tsx`/`DrawerTextarea.tsx`): textarea livre + anexo de
  imagem/link de primeira classe (clique/colar/arrastar), sem pedágio de IA no caminho crítico.
- **`Entry`** (`src/types/entry.ts`): já guarda `raw_content` (cru preservado verbatim),
  `EntrySource` inclui `'deposito'`, e os campos estruturados (`what_i_did`, `metric`, `impact`,
  `tags`, `company`, `entry_date`, etc.) já existem no tipo mas **não são preenchidos de forma
  confiável no caminho do depósito** — ficam vazios até este trabalho.
- **`SavedPanel`** pós-salvar: confirmação com título editável, "salvo em Registros" — **sem**
  o bloco "Organizando o resto em segundo plano" (explicitamente fora da 025, é desta feature).
- **`evidences` JSONB + bucket `evidence-files`** (migration 007): já destravado para
  imagem/link no drawer.

Esta feature **não** deve reabrir escopo já resolvido pela 025 (drawer, anexos, navegação em
grupos, dark mode) — o alvo aqui é o que acontece **depois** do salvar: estruturação por IA
opcional, destaques dentro da fonte, e a reestruturação da tela Registros.

## Por que empresa/período têm mecanismo próprio (não é só "mais um campo do Organizar")

Revisão de 2026-07-15, motivada por um risco levantado pela Ohana: registros vão alimentar usos
de alto risco de erro no futuro — preparo de entrevista, geração de currículo — onde misturar o
contexto de duas empresas, ou a IA "inventar" que algo aconteceu num lugar que não aconteceu, tem
custo real (uma informação errada numa entrevista ou currículo não é um bug cosmético). Duas
decisões seguem disso:

1. **Empresa/projeto NÃO pode ser só inferência de IA por texto.** Texto livre é ambíguo demais
   pra sustentar uma correlação que depois vira fato usado em geração de conteúdo — a pessoa pode
   não mencionar a empresa explicitamente, ou mencionar duas. Por isso esta feature introduz um
   **seletor de contexto por pílulas** (empresas já usadas pela pessoa + "Projeto pessoal" +
   "Outro"), que é uma **escolha explícita e determinística** (custo zero, sem chamada de IA) —
   não uma adivinhação. Story 2.
2. **Isso não pode reabrir o "sempre salva" da 025.** Tornar o campo obrigatório *no momento de
   salvar* recriaria exatamente o pedágio que a 025 removeu (bloquear salvar por causa de um
   campo é o mesmo padrão que gerava `noContent` e quebrava o dogfooding). Em vez disso: o
   contexto pode ficar **não identificado** por um tempo, mas fica **visivelmente sinalizado**
   como tal (FR-008) — e essa sinalização é o que uma feature futura de geração de alto risco
   (currículo, prep de entrevista — fora de escopo aqui) vai poder checar antes de usar o
   registro como fonte, em vez de inventar ou misturar silenciosamente. Esta feature entrega o
   **sinal**; o **gate de uso** em si é trabalho futuro (ver Assumptions).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organizar sob demanda, sem perder o que já preenchi (Priority: P1)

Como profissional que acabou de salvar um registro cru, eu clico em "Organizar" e o sistema
detecta os anexos e infere métrica, impacto, tags e — quando não resolvidos manualmente via
seletor de contexto (Story 2) — empresa e período, preenchendo campos que eu posso editar
livremente. Se eu já tinha preenchido algum campo manualmente antes de clicar, a IA não
sobrescreve o que eu escrevi.

**Why this priority**: É o núcleo do reframe de "Organizar" como assistente opcional, não
pedágio — sem isso, a estruturação continua bloqueando ou sendo invisível, e o registro nunca
ganha profundidade de campo.

**Independent Test**: Salvar um registro cru com um anexo de imagem e sem campos preenchidos,
clicar em "Organizar", e verificar que métrica/impacto/tags aparecem preenchidos e editáveis.
Repetir preenchendo manualmente o campo "impacto" antes de clicar em "Organizar" — o valor
manual permanece intacto após a organização rodar.

**Acceptance Scenarios**:

1. **Given** um registro salvo com um anexo de imagem e nenhum campo estruturado preenchido,
   **When** a pessoa clica em "Organizar", **Then** o sistema infere métrica, impacto e tags via
   IA e os exibe em campos editáveis.
2. **Given** um registro salvo em que a pessoa já preencheu manualmente o campo "impacto",
   **When** a pessoa clica em "Organizar", **Then** o sistema preenche apenas os campos vazios
   (métrica, tags) e não altera o campo "impacto" já preenchido.
3. **Given** um registro sem nenhum anexo, **When** a pessoa clica em "Organizar", **Then** o
   sistema ainda tenta inferir métrica/impacto/tags a partir do texto cru, sem exigir anexo.
4. **Given** os campos de "+ adicionar detalhes" disponíveis antes de clicar em "Organizar",
   **When** a pessoa expande essa seção, **Then** os campos estruturados aparecem vazios e
   editáveis manualmente, sem depender de a IA já ter rodado.
5. **Given** um texto cru que menciona explicitamente uma data/período (ex.: "em março", "ano
   passado"), **When** a organização roda e a pessoa não selecionou período manualmente,
   **Then** o sistema preenche o período com o valor identificado no texto.
6. **Given** um texto cru que não menciona período de forma identificável e a pessoa não o
   selecionou manualmente, **When** a organização roda, **Then** o campo de período permanece
   vazio — o sistema MUST NOT inventar ou "adivinhar" um valor sem sinal textual.

---

### User Story 2 - Contexto explícito por pílulas: empresa, projeto pessoal, ou outro (Priority: P1)

Como profissional que às vezes registra algo de um emprego formal e às vezes de um projeto
pessoal, freelance ou trabalho voluntário, eu preciso indicar rapidamente e sem ambiguidade a
qual contexto um registro pertence — sem digitar toda vez, e sem depender só da IA "adivinhar"
algo que depois pode virar currículo ou resposta de entrevista com o lugar errado.

**Why this priority**: É o mecanismo que resolve a correlação confiável entre o que aconteceu e
onde/quando — ao contrário da inferência por texto (que é probabilística e pode errar ou não
achar sinal nenhum), a seleção por pílula é **determinística e de custo zero** (mesmo princípio
do "detecta anexos, determinístico, custo zero" que já vale para evidências no drawer da 025).
É pré-requisito de confiança para qualquer geração futura de alto risco (currículo, prep de
entrevista) que dependa de não misturar contextos — ver "Por que empresa/período têm mecanismo
próprio" acima.

**Independent Test**: Abrir um registro (novo ou já salvo) e ver pílulas com as empresas já
usadas pela pessoa + "Projeto pessoal" + "Outro"; selecionar uma pílula preenche o campo de
contexto imediatamente, sem chamada de IA. Selecionar "Outro" abre um campo de texto livre.
Repetir em um registro que a pessoa não classificou — o campo permanece sem contexto resolvido,
sinalizado como tal, até a pessoa escolher.

**Acceptance Scenarios**:

1. **Given** um registro salvo (com ou sem organização já rodada), **When** a pessoa abre a área
   de contexto, **Then** o sistema mostra pílulas com as empresas já usadas anteriormente pela
   mesma pessoa, mais duas opções fixas: "Projeto pessoal" e "Outro".
2. **Given** as pílulas de contexto exibidas, **When** a pessoa seleciona uma empresa já
   existente, **Then** o campo de empresa é preenchido imediatamente com esse valor, sem chamada
   de IA, e nenhuma inferência automática subsequente sobrescreve essa escolha (mesma regra de
   FR-002 aplicada aqui).
3. **Given** as pílulas de contexto, **When** a pessoa seleciona "Projeto pessoal", **Then** o
   registro é marcado como fora do contexto de uma empresa formal — não aparece como pendência
   de "contexto não identificado".
4. **Given** as pílulas de contexto, **When** a pessoa seleciona "Outro" e digita um nome, **Then**
   um campo de texto livre é exibido, o valor é salvo como contexto do registro, e passa a
   aparecer como pílula própria em registros futuros da mesma pessoa (o vocabulário de contextos
   cresce com o uso, mesmo mecanismo do vocabulário de tags — ver Story 6/Key Entities).
5. **Given** um registro cujo contexto (empresa/projeto pessoal/outro) não foi selecionado
   manualmente nem inferido com confiança pelo Organizar, **When** a pessoa visualiza esse
   registro, **Then** ele é sinalizado como "contexto não identificado" de forma discreta, sem
   bloquear nenhuma ação sobre o registro (ver FR-008).
6. **Given** um registro cuja empresa foi inferida automaticamente pelo Organizar (Story 1) sem
   seleção manual da pessoa, **When** a pessoa abre as pílulas de contexto, **Then** a pílula
   correspondente à empresa inferida aparece pré-selecionada, mas editável — a pessoa corrige com
   um clique se a IA errou.
7. **Given** um registro cujo texto cru menciona duas empresas diferentes (ex.: uma retrospectiva
   comparando o antes e o depois de uma migração de fornecedor), **When** a organização roda sem
   seleção manual prévia, **Then** o sistema pré-seleciona a pílula da empresa com papel central
   no relato (o sujeito da ação, não uma menção lateral) — deixando claro que é uma sugestão
   editável, não um fato fechado.

---

### User Story 3 - Organização silenciosa quando eu não clico em nada (Priority: P1)

Como profissional que só quer salvar e seguir em frente, eu não clico em "Organizar" — e mesmo
assim, em segundo plano, o sistema organiza o registro sozinho pouco depois de eu salvar, sem
bloquear meu fluxo e sem me pedir nada.

**Why this priority**: É o que garante que TODO registro ganhe estrutura eventualmente, sem
tornar isso um fardo do usuário — mantém o RAG rico mesmo para quem nunca clica em "Organizar".

**Independent Test**: Salvar um registro sem clicar em "Organizar", navegar para outra tela, e
depois voltar a esse registro em Registros — os campos estruturados já aparecem preenchidos, sem
nenhuma ação adicional da pessoa.

**Acceptance Scenarios**:

1. **Given** um registro recém-salvo sem clique em "Organizar", **When** o salvamento é
   concluído, **Then** o sistema dispara a organização em segundo plano automaticamente (fire-
   and-forget), sem exigir confirmação.
2. **Given** um registro em processamento assíncrono de organização, **When** a pessoa visualiza
   esse registro em Registros durante os poucos segundos de processamento, **Then** o sistema
   mostra um estado transitório de "organizando…" sem rótulo persistente nem CTA adicional no
   card.
3. **Given** um registro cuja organização assíncrona já terminou, **When** a pessoa abre o
   registro, **Then** os campos aparecem preenchidos como se a pessoa tivesse clicado em
   "Organizar" manualmente.
4. **Given** um registro que falha ao organizar (erro na chamada de IA), **When** a falha
   acontece, **Then** o registro permanece salvo e visível normalmente, sem estado de erro
   bloqueante nem perda de dado — a pessoa pode tentar "Organizar" manualmente depois.

---

### User Story 4 - Um registro, vários destaques dentro dele (Priority: P1)

Como profissional que registrou uma fonte rica (uma reunião, um e-mail, um documento com vários
resultados), eu quero que os vários wins dessa fonte apareçam como destaques dentro do mesmo
registro — não espalhados em registros separados que perdem o contexto compartilhado.

**Why this priority**: É a peça central do reframe "registro = fonte, destaques dentro" — sem
isso, cada win vira um registro solto e a riqueza do RAG (contexto + várias facetas de uma mesma
experiência) se perde.

**Independent Test**: Organizar um registro cujo texto cru descreve dois resultados distintos de
uma mesma reunião — o sistema apresenta dois cartões de destaque dentro do mesmo registro, cada
um com sua própria métrica/impacto/tags, sem criar registros adicionais.

**Acceptance Scenarios**:

1. **Given** um registro com texto cru descrevendo múltiplos resultados de um mesmo contexto
   (mesma empresa/reunião/período), **When** a organização roda (manual ou assíncrona), **Then**
   o sistema cria múltiplos destaques dentro do mesmo registro, um por resultado identificado.
2. **Given** um registro com um único destaque, **When** a pessoa visualiza o registro, **Then**
   o cartão de destaque aparece aberto (não colapsado) — não há necessidade de expandir.
3. **Given** um registro com múltiplos destaques, **When** a pessoa visualiza o registro,
   **Then** os cartões de destaque aparecem colapsados por padrão, permitindo escanear os
   títulos antes de expandir cada um.
4. **Given** um registro com destaques, **When** a pessoa clica em "+ adicionar destaque",
   **Then** um novo cartão de destaque em branco é criado dentro do mesmo registro, editável
   manualmente.
5. **Given** um cartão de destaque dentro de um registro, **When** a pessoa edita ou remove esse
   destaque, **Then** a mudança afeta apenas aquele destaque — o registro (fonte) e os demais
   destaques permanecem intactos.
6. **Given** um registro cujo texto cru não menciona nenhuma métrica clara, **When** a
   organização roda, **Then** o sistema ainda cria ao menos um destaque sem métrica (ex.: um
   aprendizado ou uma skill) — a ausência de métrica é tratada como normal, não como erro.
7. **Given** o empresa/contexto e o período vivem no nível da FONTE (compartilhados entre todos
   os destaques daquela fonte — ver Key Entities), **When** um registro descreve resultados que
   pertencem a contextos diferentes (empresas diferentes, não apenas facetas de um mesmo evento),
   **Then** isso não é "múltiplos destaques de uma fonte" — é o caso de FR-014 (fronteira do
   evento): contextos diferentes indicam fontes diferentes, não destaques diferentes dentro da
   mesma fonte.

---

### User Story 5 - Título que soa como um caso profissional, mas ainda é meu (Priority: P2)

Como profissional que quer usar meus registros como prova de carreira, eu vejo cada destaque com
um título gerado no estilo substantivo-primeiro e outcome-first (o que foi entregue, com número
quando existir) — e posso editá-lo livremente se não gostar do que a IA escreveu.

**Why this priority**: Título fraco ("fiz um projeto") não vira prova de carreira; título
genérico-corporativo ("Otimização de processos") soa "CV genérico" e mina a marca. É importante,
mas depende das Stories 1, 3 e 4 já existirem (o destaque precisa existir antes de ter título).

**Independent Test**: Organizar um registro que descreve uma redução de tempo mensurável — o
título gerado para o destaque correspondente puxa o número para o título (ex.: "Redução de 50%
no tempo de investigação de bug crítico"), e a pessoa consegue editá-lo e salvar um título
diferente.

**Acceptance Scenarios**:

1. **Given** um destaque com métrica identificada no texto cru, **When** o título é gerado,
   **Then** o título é substantivo-primeiro, outcome-first, e inclui o número/prova quando
   presente no cru.
2. **Given** um título gerado por IA para um destaque, **When** a pessoa edita esse título,
   **Then** o sistema salva o valor editado e não o sobrescreve em reorganizações futuras.
3. **Given** um texto cru vago sobre "otimização de processos" sem objeto específico, **When** o
   título é gerado, **Then** o sistema evita nominalização vaga e busca o objeto concreto mais
   próximo no texto cru (ex.: qual processo, qual resultado) em vez de repetir o termo vago.

---

### User Story 6 - Tags que eu consigo filtrar, não etiquetas soltas (Priority: P1)

Como profissional que quer revisitar tudo que fiz sobre um tema (ex.: "liderança", "SQL",
"negociação"), eu preciso que as tags geradas por "Organizar" sejam consistentes entre
registros diferentes — a mesma habilidade ou tema deve usar sempre a mesma tag, não variações
como "liderança", "Liderança de equipe" e "gestão de pessoas" espalhadas em registros distintos
que na prática falam da mesma coisa. Isso é o que torna o filtro por tag em Registros (que já
existe) útil de verdade.

> **Nota de escopo (2026-07-15)**: a Ohana avaliou remover a geração automática de tags e decidiu
> manter como está por ora — quer ver funcionando na prática antes de decidir se pivota ou
> refina. Esta Story descreve o comportamento a implementar agora; qualquer mudança de rumo em
> tags (reduzir escopo, trocar abordagem) é uma decisão pós-uso, não bloqueia esta feature.

**Why this priority**: É pré-requisito de qualidade para toda a inferência de tags desta
feature — sem isso, "Organizar" adiciona ruído em vez de estrutura, e o filtro por tag em
Registros (`getFeedData`, que já suporta filtrar por `tags`) fica praticamente inutilizável à
medida que o vocabulário se fragmenta. É P1 porque roda dentro da mesma chamada de IA das
Stories 1 e 3 — não é um recurso à parte, é um requisito de qualidade do que elas já produzem.

**Independent Test**: Organizar dois registros que descrevem, em palavras diferentes, a mesma
habilidade concreta (ex.: um menciona "liderei o time" e outro "fui responsável pela equipe") —
as tags resultantes usam exatamente a mesma string para essa habilidade nos dois registros.
Depois, usar o filtro por tag em Registros e confirmar que ambos os registros aparecem sob a
mesma tag.

**Acceptance Scenarios**:

1. **Given** um registro sendo organizado e um vocabulário de tags já usado anteriormente pela
   mesma pessoa, **When** o texto cru descreve algo que corresponde a uma tag já existente no
   vocabulário da pessoa, **Then** o sistema reaproveita a tag existente (mesma grafia) em vez
   de criar uma variação nova.
2. **Given** um registro cujo conteúdo não corresponde a nenhuma tag já usada pela pessoa,
   **When** a organização roda, **Then** o sistema cria uma nova tag, seguindo um formato
   consistente (mesma capitalização/idioma das tags já existentes da pessoa).
3. **Given** as tags geradas para um registro, **When** a pessoa visualiza os resultados,
   **Then** nenhuma tag é um adjetivo genérico isolado (ex.: "importante", "difícil",
   "produtivo") — toda tag representa uma skill, tema ou domínio concreto identificável.
4. **Given** uma tag gerada automaticamente, **When** a pessoa a edita ou remove no campo
   editável, **Then** o sistema respeita a edição (mesma regra de FR-002/FR-020) e não a
   recria numa reorganização futura.
5. **Given** o filtro por tag na tela Registros, **When** a pessoa seleciona uma tag, **Then**
   todos os registros que usam exatamente aquela tag aparecem — sem tags "quase iguais" ficando
   de fora por variação de escrita.

---

### User Story 7 - Registros mostra a fonte, não uma lista de fragmentos (Priority: P2)

Como profissional revisando meu histórico, eu vejo em Registros um card por fonte (não um card
por destaque), com miniatura real da evidência quando existir, e um selo indicando quantos
destaques aquela fonte tem — posso expandir para ver todos os destaques e acessar a fonte
completa.

**Why this priority**: Depende dos destaques (Story 4) já existirem; sem essa reestruturação, a
tela Registros mostraria fragmentos soltos e perderia a legibilidade "fonte + facetas" que é o
ponto central do reframe.

**Independent Test**: Abrir Registros com uma fonte de 3 destaques e uma fonte de 1 destaque — a
primeira aparece como 1 card com selo "+3 destaques" (ou equivalente), a segunda como 1 card sem
selo (ou com indicação de destaque único); expandir a primeira revela os 3 destaques e acesso ao
texto cru da fonte.

**Acceptance Scenarios**:

1. **Given** uma fonte com múltiplos destaques, **When** a pessoa visualiza o feed de Registros,
   **Then** o sistema mostra 1 card por fonte, com um selo indicando o total de destaques.
2. **Given** um card de fonte no feed, **When** a pessoa expande o card, **Then** todos os
   destaques daquela fonte aparecem, junto com acesso ao texto cru completo e aos anexos.
3. **Given** uma fonte com evidência de imagem, **When** o card aparece no feed, **Then** a
   miniatura mostrada é a imagem real anexada, não um ícone genérico por tipo.
4. **Given** o feed de Registros, **When** a pessoa navega pela timeline, **Then** os registros
   são agrupados por mês.
5. **Given** a grade-faísca (mapa de atividade) em Registros, **When** a pessoa a visualiza,
   **Then** ela reflete a densidade de registros ao longo do tempo sem usar streak gamificado
   nem emoji.
6. **Given** um card de fonte cujo contexto está sinalizado como "não identificado" (Story 2),
   **When** a pessoa visualiza o feed, **Then** essa sinalização aparece de forma discreta no
   card (não um badge de erro/alerta chamativo) — é um convite a completar, não uma falha.

---

### Edge Cases

- O que acontece se a chamada de IA de "Organizar" falhar (timeout, erro de API)? O registro
  permanece salvo com os campos vazios; a pessoa pode tentar "Organizar" novamente manualmente
  (ver Story 3, Acceptance Scenario 4).
- O que acontece se a pessoa clicar em "Organizar" duas vezes seguidas rapidamente (duplo
  clique) antes da primeira chamada terminar? O sistema deve evitar disparar duas chamadas de IA
  simultâneas para o mesmo registro (idempotência da ação).
- O que acontece se a pessoa editar o texto cru do registro depois que a organização já rodou?
  Os destaques e campos já gerados não são regenerados automaticamente — a pessoa pode clicar em
  "Organizar" de novo para tentar refletir a edição (reusa a mesma regra de "só preenche
  vazios", então campos já preenchidos manualmente continuam protegidos).
- O que acontece se um registro antigo (criado antes desta feature, sem passar pelo depósito da
  025) for aberto em Registros? Ele deve continuar navegável normalmente, sem destaques (trata-se
  como fonte de destaque único, o próprio registro), e com contexto "não identificado" até a
  pessoa selecionar uma pílula ou rodar o Organizar.
- O que acontece se o texto cru for grande o suficiente para descrever 5+ resultados distintos?
  Não há limite artificial de destaques por fonte — cada resultado identificável vira seu
  próprio destaque.
- O que acontece se o texto cru não trouxer nenhum sinal de período (ex.: "resolvi um bug hoje",
  sem mais contexto) e a pessoa não selecionou nada manualmente? O campo de período fica vazio —
  o sistema não preenche a partir de inferência estatística (ex.: "provavelmente é o mesmo período
  do último registro"), só a partir de sinal textual explícito ou seleção manual.
- O que acontece se a lista de pílulas de empresas crescer muito ao longo dos anos de uso? A UI
  precisa de alguma affordance de busca/scroll dentro do seletor — decisão de interação específica
  cabe ao `/impeccable shape`, mas a spec exige que a lista continue navegável independente do
  tamanho (não há limite de quantas empresas o vocabulário pode ter).
- O que acontece na primeira vez que a pessoa usa o produto e ainda não tem nenhuma empresa no
  vocabulário? O seletor mostra só "Projeto pessoal" e "Outro" — a primeira empresa nomeada via
  "Outro" inicia o vocabulário dela.
- O que acontece se duas tags já existentes no vocabulário da pessoa forem quase sinônimas (ex.:
  criadas em registros diferentes antes desta feature existir, uma "lideranca" e outra
  "liderança-de-equipe")? Esta feature não faz limpeza retroativa do vocabulário existente — a
  consistência (Story 6) vale para tags novas geradas a partir de agora; consolidar tags antigas
  é decisão de produto separada, fora de escopo aqui.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer um botão "Organizar" opcional em qualquer registro salvo,
  que dispara a inferência de métrica, impacto, tags e, quando ainda não resolvidos manualmente,
  empresa/contexto e período — a partir do texto cru e dos anexos.
- **FR-002**: A inferência via IA MUST preencher apenas campos estruturados que estejam vazios —
  campos já preenchidos manualmente (pela pessoa, via seleção de pílula, ou por uma organização
  anterior editada) MUST permanecer intocados.
- **FR-003**: O sistema MUST oferecer um seletor de contexto por pílulas em qualquer registro,
  independente de o Organizar já ter rodado, com as opções: cada empresa já usada anteriormente
  pela pessoa, mais duas opções fixas — "Projeto pessoal" e "Outro" (texto livre).
- **FR-004**: A seleção manual de contexto (pílula) MUST ter precedência sobre qualquer inferência
  automática — uma vez selecionada manualmente, o Organizar MUST NOT sobrescrever esse valor
  (aplicação específica de FR-002 ao contexto).
- **FR-005**: Quando a pessoa escolhe "Outro" e nomeia um contexto novo, esse valor MUST ser
  adicionado ao vocabulário de contextos da pessoa, passando a existir como pílula própria em
  registros futuros.
- **FR-006**: A inferência automática de empresa/contexto e período (quando não resolvidos por
  pílula) MUST se basear exclusivamente em sinal textual explícito presente no próprio registro
  (texto cru ou anexo) — o sistema MUST NOT inferir esses campos por associação estatística com
  outros registros da pessoa (ex.: "a última empresa registrada provavelmente é essa"). Na
  ausência de sinal textual e sem seleção manual, os campos permanecem vazios.
- **FR-007**: Quando o texto cru de um registro referenciar mais de uma empresa e a pessoa não
  tiver selecionado uma pílula manualmente, o sistema MUST pré-selecionar a pílula da empresa com
  papel central no relato (sujeito da ação, não uma menção lateral), sinalizando que é uma
  sugestão editável, não um fato fechado.
- **FR-008**: Quando nem seleção manual (pílula) nem inferência automática resolverem o contexto
  de um registro, o sistema MUST sinalizar visualmente esse registro como "contexto não
  identificado", de forma discreta, sem bloquear nenhuma ação (salvar, organizar, editar, ou
  qualquer outro uso do registro dentro do escopo desta feature).
- **FR-009**: Ao salvar um registro sem clique em "Organizar", o sistema MUST disparar a
  organização em segundo plano automaticamente (fire-and-forget), sem bloquear o salvar nem
  exigir confirmação da pessoa.
- **FR-010**: O sistema MUST NOT introduzir um conceito de rascunho — todo registro salvo é real
  e visível, independentemente de já ter sido organizado.
- **FR-011**: Enquanto a organização assíncrona está em andamento, o sistema MUST exibir um
  estado transitório (ex.: "organizando…") sem rótulo persistente nem CTA adicional após a
  conclusão.
- **FR-012**: O sistema MUST preservar o texto cru do registro verbatim, inalterado por qualquer
  operação de organização — a estrutura (campos, destaques) é um índice construído por cima,
  nunca substitui o cru.
- **FR-013**: Qualquer geração de conteúdo (posts, resumos, RAG) que use um registro como fonte
  MUST ler o texto cru da fonte, não um resumo derivado dela.
- **FR-014**: O sistema MUST representar um registro como uma FONTE única contendo um ou mais
  DESTAQUES — nunca splitar o texto cru de uma fonte de um único evento (mesmo contexto de
  tempo/empresa/reunião) em múltiplos registros separados. Contexto (empresa/projeto pessoal) e
  período MUST viver no nível da FONTE, compartilhados por todos os destaques dentro dela — não
  são campos por-destaque.
- **FR-015**: Cada destaque dentro de uma fonte MUST ter seus próprios campos (título, métrica,
  impacto, tags), editáveis e removíveis independentemente dos demais destaques da mesma fonte.
- **FR-016**: A pessoa MUST poder adicionar manualmente um novo destaque a um registro existente
  (via "+ adicionar destaque"), independente de a organização por IA ter rodado.
- **FR-017**: Quando uma fonte tem exatamente um destaque, o sistema MUST exibir o cartão desse
  destaque aberto por padrão; quando tem múltiplos, MUST exibi-los colapsados por padrão.
- **FR-018**: Um destaque sem métrica identificável MUST ser tratado como válido (ex.: um
  aprendizado, uma skill, um relacionamento) — ausência de métrica não é erro nem bloqueia a
  criação do destaque.
- **FR-019**: O sistema MUST gerar títulos de destaque no formato substantivo-primeiro e
  outcome-first (deliverable + objeto específico), priorizando incluir o número/prova quando
  presente no texto cru, e evitando nominalização vaga (ex.: "Otimização de processos").
- **FR-020**: Todo título gerado por IA MUST ser editável pela pessoa, e uma vez editado
  manualmente, MUST permanecer com o valor editado em reorganizações futuras (mesma regra de
  FR-002 aplicada ao título).
- **FR-021**: O sistema MUST NOT oferecer nenhuma forma de gestão de destino por-registro (ex.:
  chip "no espelho / só no histórico") — todo registro salvo conta para o Espelho.
- **FR-022**: Ao gerar tags para um registro, o sistema MUST reaproveitar uma tag já existente no
  vocabulário da pessoa quando o conteúdo corresponder conceitualmente a ela, em vez de criar uma
  variação nova (ex.: não gerar "Liderança de equipe" se a pessoa já usa "liderança" em outros
  registros).
- **FR-023**: Uma tag nova (sem correspondência no vocabulário já usado pela pessoa) MUST seguir
  um formato consistente com as tags já existentes da mesma pessoa (mesma capitalização e
  idioma) — o sistema MUST NOT misturar convenções de formatação dentro do vocabulário de uma
  mesma pessoa.
- **FR-024**: Nenhuma tag gerada por IA MUST ser um adjetivo genérico isolado (ex.: "importante",
  "difícil", "produtivo") — toda tag MUST representar uma skill, tema ou domínio concreto e
  identificável, reusando a mesma restrição que já valia na extração legada (`tags = skills/temas
  concretos, não adjetivos genéricos`).
- **FR-025**: A tela Registros MUST exibir um card por FONTE (não por destaque) no feed
  principal, com um selo indicando a contagem de destaques quando houver mais de um.
- **FR-026**: Expandir um card de fonte em Registros MUST revelar todos os destaques daquela
  fonte, junto com acesso ao texto cru completo e aos anexos da fonte.
- **FR-027**: Um card de fonte com evidência de imagem MUST exibir a miniatura real da imagem
  anexada, não um ícone genérico por tipo.
- **FR-028**: A tela Registros MUST agrupar os registros numa timeline por mês.
- **FR-029**: ~~A grade-faísca (mapa de densidade de atividade) em Registros MUST refletir a
  distribuição de registros ao longo do tempo sem usar mecânicas de streak gamificado nem
  emoji.~~ **Revisão pós-implementação (2026-07-15)**: a grade foi implementada e depois
  **removida** por decisão da Ohana durante revisão visual. Motivo: para o ritmo de uso real
  deste produto (poucas vezes por semana, não diário), a grade ficava majoritariamente vazia/cinza
  na maior parte do tempo — o mesmo risco de "cobrança visual" que este FR já tentava evitar ao
  proibir streak gamificado, só que reintroduzido pela cor em vez do número. Fica só o texto
  discreto "N registros em M meses" (sem grid), perto dos filtros da tela.
- **FR-030**: Uma falha na chamada de IA de organização (manual ou assíncrona) MUST NOT impedir
  o registro de permanecer salvo e visível normalmente — a pessoa pode tentar organizar
  novamente depois.
- **FR-031**: O sistema MUST evitar disparar mais de uma chamada de organização simultânea para
  o mesmo registro (proteção contra duplo clique / disparo concorrente).
- **FR-032**: Registros criados antes desta feature (sem destaques estruturados) MUST continuar
  navegáveis normalmente em Registros, tratados como fonte de destaque único.

### Key Entities

- **Registro (Fonte)**: a unidade que guarda o texto cru verbatim, anexos (evidences), empresa/
  contexto e período — já existe como `Entry` desde a 025 (o schema já reserva `company`/
  `entry_date`, mas a extração legada nunca os preenchia de forma confiável — ver Assumptions).
  Nesta feature, ganha um estado de organização (não-organizado transitório / organizado), um
  estado de contexto (não identificado / inferido / confirmado manualmente via pílula), e passa
  a agrupar um ou mais Destaques. Empresa/contexto e período vivem **neste nível**, não no
  destaque (FR-014).
- **Destaque**: uma faceta dentro de um registro — título editável, métrica/impacto opcionais,
  tags. Repetível dentro de uma mesma fonte; nem todo destaque tem métrica. É a unidade que o
  Espelho e a geração de conteúdo consomem para achar padrão, mas sempre em referência à fonte
  completa (FR-013), incluindo o contexto (empresa/período) dela.
- **Vocabulário de tags da pessoa**: o conjunto de tags já usadas por uma pessoa em seus
  registros anteriores. É o que a inferência de tags (FR-022/FR-023) consulta antes de criar uma
  tag nova, para manter consistência e permitir filtrar por tag em Registros (`getFeedData` já
  suporta esse filtro hoje) sem fragmentação de sinônimos.
- **Vocabulário de contextos da pessoa**: o conjunto de empresas (e o valor "Projeto pessoal")
  já usadas por uma pessoa, seja via seleção manual (pílula) ou via "Outro" nomeado por ela.
  Alimenta as pílulas oferecidas em qualquer registro (FR-003) e cresce a cada novo contexto
  nomeado (FR-005) — mesmo mecanismo do vocabulário de tags, aplicado a empresa/contexto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pessoa consegue organizar um registro salvo (via clique ou automaticamente) e
  ver os campos estruturados preenchidos em menos de 15 segundos após o salvar, sem precisar
  recarregar a página.
- **SC-002**: 100% dos registros salvos — organizados manualmente ou não — terminam com pelo
  menos um destaque associado, sem exigir ação adicional da pessoa além de salvar.
- **SC-003**: Editar manualmente um campo (título, métrica, impacto, tag) ou selecionar
  manualmente o contexto (pílula) antes ou depois da organização automática nunca é sobrescrito
  por uma organização subsequente — verificável em 100% dos casos testados.
- **SC-004**: Uma fonte com múltiplos resultados distintos no texto cru gera múltiplos destaques
  dentro do mesmo registro, sem criar registros adicionais — nenhuma fragmentação em N registros
  para eventos de contexto único.
- **SC-005**: A tela Registros carrega o feed reestruturado (1 card por fonte, timeline por mês,
  grade-faísca) sem regressão perceptível de tempo de carregamento em relação à versão da 025.
- **SC-006**: Ao organizar registros que descrevem a mesma skill/tema em palavras diferentes, a
  taxa de reaproveitamento de tag já existente (em vez de criar uma variação nova) é alta o
  suficiente para que o filtro por tag em Registros continue útil — medido, pós-lançamento,
  observando se o número de tags distintas por pessoa cresce de forma descontrolada em relação ao
  número de registros (sinal de fragmentação de vocabulário).
- **SC-007**: Selecionar o contexto de um registro (empresa, projeto pessoal ou outro) via pílula
  leva um único clique — sem digitação — para qualquer empresa já usada anteriormente pela pessoa.
- **SC-008**: A pessoa consegue identificar, ao olhar um registro ou o feed de Registros, se o
  contexto (empresa/projeto pessoal) daquele registro está resolvido ou não, sem precisar abrir
  o registro para descobrir.

## Assumptions

- A extração via IA desta feature reusa `claude-haiku-4-5` (já mandatado pela constituição para
  extração/estruturação) — mesma família de modelo que a extração legada usava antes da 025
  desligar o pedágio síncrono.
- Não há migration nova prevista: destaques são modelados reaproveitando os campos estruturados
  já existentes em `entries` (ou uma tabela/coluna adicional simples de detalhes por destaque,
  decisão técnica que cabe ao `/speckit-plan`, não a esta spec) — o decision record afirma
  "provavelmente sem migration"; a confirmação final acontece na fase de plano técnico. O
  vocabulário de contextos (FR-003/FR-005) provavelmente é derivável por `SELECT DISTINCT
  company FROM entries WHERE user_id = ...` sem tabela nova, mas essa é decisão técnica do plano,
  não desta spec.
- O texto cru inteiro de cada fonte já está preservado desde a 025 (`raw_content`); esta feature
  não precisa resolver retrocompatibilidade de captura, apenas organizar o que já existe.
- A definição de "mesmo contexto" para não-splitar (FR-014) usa como sinal principal
  tempo/empresa/evento mencionados no próprio texto cru submetido em uma única sessão do drawer
  — não há input explícito da pessoa indicando limites de evento.
- O "botão Organizar" e a organização assíncrona operam sobre o mesmo registro em qualquer
  estado (recém-criado ou antigo) — não há restrição de janela de tempo para reorganizar.
- **Empresa/período não eram extraídos de forma confiável antes desta feature**: o campo
  `company` já existe no schema `Entry`/`ExtractedEntry` desde a captura legada (003), mas o
  prompt de extração (`src/lib/ai/extraction/prompts/capture.ts`) nunca o listava entre os campos
  a preencher — só `tags`/`metric`/`impact`/`decision`/`learning`/`entry_date`. Esta feature
  corrige essa lacuna, mas não só com mais inferência de IA — com um mecanismo determinístico
  (pílulas, FR-003 a FR-008) que é a resposta ao risco levantado pela Ohana de misturar contexto
  ou inventar correlação empresa/evento em usos futuros de alto risco (currículo, entrevista).
- **O gate de uso em geração de alto risco é trabalho futuro, fora desta feature.** Esta feature
  entrega o sinal ("contexto não identificado" vs. resolvido, FR-008) e o mecanismo pra resolver
  rápido (pílulas). Ela **não** implementa nenhuma lógica que impeça ou avise antes de usar um
  registro com contexto não identificado numa geração futura (currículo, prep de entrevista) —
  isso cabe à feature que implementar essa geração (provavelmente parte da trilha de conteúdo
  013/014, ou uma feature dedicada), que deve consultar esse sinal antes de tratar um registro
  como fonte confiável de "o quê aconteceu onde". Decisão consciente: construir o sinal agora
  (mais barato aqui, onde o contexto nasce) é mais barato do que fazer isso como workaround depois
  — mas o consumo do sinal não é escopo de 026.
- **Consistência de tags não existia como requisito antes desta feature**: a única orientação de
  tags na extração legada era "skills/temas concretos, não adjetivos genéricos" — sem noção de
  vocabulário nem de reaproveitamento entre registros. FR-022/FR-023/FR-024 formalizam isso pela
  primeira vez; a estratégia adotada (reusar o vocabulário já usado pela própria pessoa, sem uma
  taxonomia global curada) é o default mais simples que atende ao pedido de "permitir filtrar".
  Diferente do contexto empresa/período, a Ohana optou por manter a geração de tags como está
  (sem mecanismo de pílula equivalente) e decidir depois de ver funcionando na prática se pivota
  ou refina — essa é uma decisão deliberadamente mais provisória que a de contexto.
- Não há tabela de histórico profissional estruturado (cargos/empresas com datas) contra a qual
  validar ou corrigir a inferência de empresa/período — o vocabulário de contextos desta feature
  (FR-003/FR-005) é construído a partir do próprio uso do produto (valores já usados pela pessoa
  em registros anteriores, incluindo os nomeados via "Outro"), não de uma fonte de verdade externa.
