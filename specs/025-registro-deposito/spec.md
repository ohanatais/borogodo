# Feature Specification: Registro como Depósito (fundação)

**Feature Branch**: `025-registro-deposito`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Registro como depósito (fundação): substituir a captura atual por
um drawer estilo bloco de notas que SEMPRE salva — nunca rejeita por texto curto, sem reroute
por tamanho, sem pedágio de IA. Imagem e link de primeira classe na porta (destrava evidences
JSONB + bucket evidence-files da migration 007). Após salvar, registro visível e editável com
'salvo em Registros'. Painel: desfazer a barra fixa 'Registrar|Perguntar'; Espelho vira cartão
compacto co-igual a um gatilho de Registro coral que abre o drawer; 'Perguntar ao histórico'
discreto junto do Espelho. Mobile: bottom sheet. Sem migration nova (reusa entries/evidences/
bucket). FORA de escopo: botão Organizar/estruturação IA, destaques, reestruturação de
Registros, importar (features B e C). Contexto: docs/decisions/003-registro-deposito-e-captura.md."

**Contexto de decisão**: [docs/decisions/003-registro-deposito-e-captura.md](../../docs/decisions/003-registro-deposito-e-captura.md)
— decision record completo (discovery, alternativas, riscos), item "Quebra em features (A → B → C)".
Esta é a **Feature A**, fundação que destrava o dogfooding. As Features B (`026-organizar-destaques`)
e C (`027-importar-historico`) dependem desta e ficam fora de escopo aqui.

## Referência visual (Claude Design)

Protótipo interativo em `claude.ai/design`, projeto `9ea601ed-9460-4619-86e7-b45ddd818362`
(pasta `ui_kits/produto/redesign/`). **Importante**: existem DUAS iterações visuais no mesmo
projeto, e cada uma manda em uma parte diferente da feature — não misturar por engano.

**Iteração 1 (`rd-*.jsx`, pasta raiz)** manda no **fluxo de Registrar/Registros** — essa versão
foi validada em detalhe (anexos reais, confirmação editável, campos manuais) e continua a fonte
da verdade para o *comportamento* do drawer, mesmo com a iteração 2 tendo um layout mais bonito:
- `rd-drawer.jsx` → `Drawer`: bloco de notas (textarea sempre-salva) + tiles de anexo
  (imagem/link/áudio — **para a Feature A, considerar apenas imagem e link**; áudio é do
  escopo de captura v2, já existente) + rodapé com botão "Registrar". A tela `SavedPanel`
  dentro do mesmo arquivo é a confirmação pós-salvar com título editável — **usar exatamente
  essa tela** (sem o bloco "Organizando o resto em segundo plano", que é do escopo de B).
- `rd-ui.jsx`: átomos compartilhados (Icon, Avatar, Kicker, MetricBadge, Thumb, AttachTile,
  Btn) — reusar como vocabulário visual, não recriar do zero.

**Iteração 2 (`painel-home.html` + `home-app.jsx`, mesma pasta)** manda no **layout do Painel,
na navegação e no dark mode** — esta é uma versão posterior, mais madura visualmente, e
**substitui** o `rd-painel.jsx`/`rd-app.jsx` da iteração 1 para essas partes (confirmado com a
Ohana: "quero o painel novo, o fluxo de menu novo e dark mode... mas o registrar e a seção
registros definitivamente tá pior"):
- `home-app.jsx` → `HomeScreen`: saudação personalizada, `HeroInput` (gatilho único de Registro,
  borda coral), "Suas forças" (tags inline sublinhadas, não badges), "Registros recentes" (lista
  compacta) — layout de **coluna única**, não mais dois blocos co-iguais lado a lado.
- `home-app.jsx` → `Sidebar` (desktop) / `TabBar` (mobile) + `UsarSheet`: navegação em grupos —
  "Painel" e "Registrar" (ação) no topo; grupo **"Meu espelho"** (Perfil, Trajetória, Registros);
  grupo **"Usar"** (Gerar conteúdo, Me preparar, Perguntar). Tokens de tema claro/escuro em
  `painel-home.html` (`--surface-0/1/2`, `--text-primary/secondary/muted`, `--accent`, `--roxo`).
- **O que NÃO entra desta iteração**: o componente `RegistrarSurface` (drawer) desse arquivo —
  ele perdeu a confirmação editável, os anexos viraram ícones decorativos sem função, e não tem
  "+ adicionar detalhes". A única coisa que se aproveita dele é a **sensação de espaço** (textarea
  grande, visual mais limpo tipo Notion) — aplicar esse respiro visual ao `Drawer` da iteração 1,
  sem perder nenhuma das funcionalidades já validadas (US1-4).

Fora de escopo do protótipo para esta feature (ambas iterações): `rd-registros.jsx`
(destaques/faíscas — feature B), `rd-importar.jsx` (importar em lote — feature C), o botão
"Organizar" e os campos estruturados-por-IA dentro do drawer (feature B).

## Clarifications

### Session 2026-07-12

- Q: Na navegação agrupada (grupo "Usar"), "Gerar conteúdo" e "Me preparar" devem apontar para
  quê? → A: link direto para `/presenca?hub=mostrar` e `/presenca?hub=preparar` respectivamente
  (rotas já existentes da feature `013-motor-de-voz`), sem passar pela splash intermediária de
  2 cards que hoje existe em `/usar` — os itens do menu substituem essa splash como ponto de
  entrada.
- Q: No item "Perguntar" dentro do grupo "Usar", o que deve acontecer ao clicar? → A: abre o
  `ChatSheet` já existente como overlay por cima da página atual (mesmo comportamento de hoje via
  toggle `Segmented` em `AppShellClient.tsx`) — não vira uma rota nova.
- Q: A navegação em grupos + dark mode (US5/US6, FR-011 a FR-013, FR-023 a FR-026) continua dentro
  da feature 025 ou vira uma sub-fatia própria? → A: continua na 025 — navegação e dark mode são
  pré-requisito visual pro Painel/drawer novos, e o esforço é reorganização, não conteúdo novo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar sem nunca ser rejeitada (Priority: P1)

Como profissional que quer guardar o que fez, eu escrevo (ou colo) qualquer texto — curto,
longo, uma frase solta ou uma transcrição inteira — na porta de Registro e ele é salvo. Nunca
recebo um erro de "conteúdo insuficiente", nunca sou redirecionada para o chat por causa do
tamanho do texto, e nenhuma chamada de IA bloqueia o salvar.

**Why this priority**: É o núcleo do reframe — hoje a extração de IA no caminho crítico do
salvar rejeita input legítimo (`noContent`) e reroteia texto curto pro chat. Isso é o que quebra
o dogfooding e precisa ser destravado primeiro; sem isso, nenhuma outra peça da feature importa.

**Independent Test**: Abrir o drawer, digitar um texto de uma frase (ex.: "resolvi um bug hoje")
e salvar — o registro aparece em Registros, sem erro e sem redirecionamento. Repetir com um texto
de several parágrafos colado (ex.: transcrição de reunião) — o registro salva com o texto cru
preservado por inteiro.

**Acceptance Scenarios**:

1. **Given** o drawer de Registro aberto, **When** a pessoa digita um texto de poucas palavras e
   clica em "Registrar", **Then** o sistema salva o registro sem exibir erro de conteúdo
   insuficiente e sem redirecionar para outra tela.
2. **Given** o drawer de Registro aberto, **When** a pessoa cola um texto longo (ex.: e-mail ou
   transcrição com milhares de caracteres), **Then** o sistema salva o texto cru inteiro, sem
   truncar ou exigir resumo antes de salvar.
3. **Given** qualquer texto com conteúdo (mínimo de um caractere não-vazio), **When** a pessoa
   clica em "Registrar", **Then** o salvamento não depende de nenhuma chamada de IA ter
   respondido — o salvar é síncrono e imediato.
4. **Given** o campo de texto vazio e nenhum anexo, **When** a pessoa tenta clicar em
   "Registrar", **Then** o botão permanece desabilitado (não há o que salvar) — isso não é
   rejeição de conteúdo, é ausência de conteúdo.

---

### User Story 2 - Anexar imagem e link na hora de registrar (Priority: P1)

Como profissional que tem prints, dashboards e links (Figma, Notion, Sentry etc.) como prova do
que fez, eu anexo imagem e link diretamente na porta de Registro, no mesmo passo que escrevo o
texto — não como um passo extra escondido depois. E se eu já tenho o hábito de colar um print
(Cmd+Shift+4 → colar) ou arrastar um arquivo, como faço no Jira/Notion/Slack, isso funciona aqui
também — não só clicar num botão.

**Why this priority**: O suporte a evidência já existe no schema (`evidences` JSONB + bucket
`evidence-files`, migration 007) mas está trancado na UI atual. Destravar isso mata o "registra
às cegas" e é pré-requisito pra qualquer prova visual no Espelho depois. A forma de anexar
(clicar vs colar vs arrastar) é parte do requisito, não um detalhe visual — é o que determina se
o atrito de captura realmente caiu para quem já tem esse hábito em outras ferramentas.

**Independent Test**: No drawer, anexar uma imagem via botão, colar uma imagem da área de
transferência direto no campo de texto, e arrastar um arquivo de imagem para dentro do drawer —
as três formas produzem o mesmo resultado (tile com miniatura real). Testar também colar um link
via botão "Link"; conferir que uma URL colada dentro do texto livre permanece como texto, sem
virar anexo automaticamente.

**Acceptance Scenarios**:

1. **Given** o drawer de Registro aberto, **When** a pessoa clica em "Imagem" e escolhe um
   arquivo, **Then** o sistema mostra uma miniatura real da imagem anexada (não um ícone genérico
   por tipo) antes mesmo de salvar.
2. **Given** o drawer de Registro aberto com o cursor no campo de texto, **When** a pessoa cola
   (Cmd/Ctrl+V) uma imagem copiada para a área de transferência, **Then** o sistema reconhece que
   o conteúdo colado é uma imagem e a adiciona como anexo (tile com miniatura), sem inserir lixo
   no texto.
3. **Given** o drawer de Registro aberto, **When** a pessoa arrasta um arquivo de imagem de fora
   (Finder/Explorer) para qualquer área do drawer, **Then** o sistema mostra um destaque visual
   durante o arraste e, ao soltar, adiciona o arquivo como anexo.
4. **Given** o drawer de Registro aberto, **When** a pessoa clica em "Link" e informa uma URL,
   **Then** o sistema mostra o link como um tile com domínio/título reconhecível.
5. **Given** o drawer de Registro aberto, **When** a pessoa cola uma URL como parte de uma frase
   ou junto de outro texto, **Then** a URL permanece como texto normal dentro do registro — o
   sistema não a converte automaticamente em anexo-link (só o botão "Link" explícito cria um
   anexo-link).
6. **Given** um registro salvo com anexos, **When** a pessoa reabre esse registro em Registros,
   **Then** os mesmos anexos (imagem, link) continuam visíveis e associados ao registro.
7. **Given** um anexo adicionado por engano, **When** a pessoa remove o anexo antes de salvar,
   **Then** ele desaparece do drawer e não é persistido no registro.

---

### User Story 3 - Confirmação visível e editável após salvar (Priority: P1)

Como profissional que acabou de registrar algo, eu vejo imediatamente uma confirmação com o
título que o sistema deu ao meu registro, e posso editar esse título ali mesmo antes de
continuar — porque o título é meu, não da IA.

**Why this priority**: Mata o "registra às cegas" (risco #3 do decision record) — hoje a pessoa
salva e não sabe o que virou o registro. É o elo que fecha o loop de confiança da fatia 1.

**Independent Test**: Salvar um registro e verificar que a tela de confirmação aparece com um
título pré-preenchido, editável inline, e a mensagem "salvo em Registros"; editar o título e
confirmar que a edição persiste no registro final.

**Acceptance Scenarios**:

1. **Given** um registro recém-salvo, **When** a confirmação aparece, **Then** ela mostra um
   título gerado a partir do texto (sem chamada de IA bloqueante — heurística determinística
   a partir do texto digitado) em um campo editável, e o texto "salvo em Registros".
2. **Given** a tela de confirmação com o título editável, **When** a pessoa altera o texto do
   título e conclui, **Then** o registro salvo reflete o novo título.
3. **Given** a tela de confirmação, **When** a pessoa fecha sem editar o título, **Then** o
   título pré-preenchido é mantido como está.

---

### User Story 4 - Adicionar detalhes manualmente, sem esperar IA (Priority: P2)

Como profissional que já sabe a métrica de cabeça (ex.: "aceite em 2 ciclos"), eu digito isso
direto num campo, sem precisar que nenhuma IA processe meu texto primeiro — a estruturação
manual funciona independente de qualquer botão de organização automática.

**Why this priority**: O decision record descreve os campos estruturados como disponíveis "antes
E depois de Organizar" — ou seja, a digitação manual não depende do botão Organizar (que é
escopo da feature B). Dar esse atalho manual já na fundação evita forçar todo mundo a esperar a
estruturação por IA só para registrar uma métrica que a pessoa já tem na ponta da língua. P2
porque é um complemento ao registro básico (US1-3), não um bloqueio para ele.

**Independent Test**: No drawer, sem clicar em nenhum botão de IA, abrir "+ adicionar detalhes" e
preencher métrica/impacto/tags manualmente; salvar e conferir que os valores digitados persistem
exatamente como digitados, sem qualquer chamada de IA envolvida.

**Acceptance Scenarios**:

1. **Given** o drawer de Registro aberto, **When** a pessoa clica em "+ adicionar detalhes",
   **Then** o sistema mostra campos de texto simples para métrica, impacto, tags, empresa e data
   — todos vazios, todos editáveis, sem nenhuma chamada de IA disparada por essa ação.
2. **Given** os campos de detalhes abertos, **When** a pessoa preenche métrica e/ou tags e clica
   em "Registrar", **Then** o registro salvo contém exatamente o que foi digitado nesses campos.
3. **Given** o drawer de Registro aberto, **When** a pessoa não abre "+ adicionar detalhes",
   **Then** o registro salva normalmente só com texto cru e anexos (a seção é opcional, nunca
   obrigatória).
4. **Given** os campos de detalhes preenchidos manualmente, **When** a pessoa reabre o registro
   salvo, **Then** os valores continuam lá, editáveis, exatamente como foram digitados.

---

### User Story 5 - Painel novo: saudação, gatilho único e resumo rápido (Priority: P2)

Como profissional que abre o Painel, eu vejo uma saudação pessoal, um único gatilho claro pra
registrar, um resumo rápido das minhas forças e meus registros recentes — em vez de uma barra
fixa ambígua "Registrar | Perguntar" ou um cartão pesado de Espelho competindo por atenção.

**Why this priority**: Depende das Stories 1-3 existirem (drawer funcional) para fazer sentido;
é a peça de navegação/hierarquia que acompanha a mudança de captura, mas o valor central já foi
entregue sem ela. P2 porque é reorganização de superfície, não desbloqueio de funcionalidade.
Layout confirmado com a Ohana a partir da segunda iteração visual (`home-app.jsx`) — substitui o
desenho anterior de "dois blocos co-iguais" (cartão de Espelho + gatilho lado a lado).

**Independent Test**: Abrir o Painel e verificar visualmente que não existe mais a barra fixa
"Registrar | Perguntar"; que aparece a saudação, o gatilho único de Registro, "Suas forças" e
"Registros recentes" em coluna única, sem cartão de Espelho pesado disputando espaço.

**Acceptance Scenarios**:

1. **Given** o Painel carregado, **When** a pessoa olha o topo, **Then** vê uma saudação
   personalizada (Bom dia/Boa tarde/Boa noite + nome) seguida de um único gatilho de Registro em
   destaque (borda coral, "Registrar o que você fez"), sem a barra fixa "Registrar | Perguntar".
2. **Given** o Painel carregado, **When** a pessoa clica no gatilho de Registro, **Then** o
   drawer de depósito abre.
3. **Given** o Painel carregado com dados, **When** a pessoa rola a página, **Then** vê a seção
   "Suas forças" (resumo compacto em texto, com link "Ver espelho") e "Registros recentes" (até 3
   registros mais recentes, com link "Ver todos" para a tela de Registros).
4. **Given** uma conta sem nenhum registro ainda, **When** a pessoa abre o Painel, **Then** vê o
   modo "novo" com o gatilho de Registro em destaque e o Espelho como promessa (não como outdoor
   vazio, não como card gradiente pesado).
5. **Given** o modo "novo" do Painel, **When** a pessoa olha abaixo do gatilho de Registro,
   **Then** vê um botão "Importar currículo ou LinkedIn" **visível mas não funcional** (vitrine do
   que vem na feature `027-importar-historico`; clicar não dispara nenhuma ação nesta feature) e
   um cartão "Seu Espelho se forma conforme você registra" com um indicador de progresso rumo ao
   primeiro retrato (reusa o limiar já existente de 3 registros — `FIRST_MIRROR_MIN_ENTRIES` — sem
   inventar um número novo).

---

### User Story 6 - Navegação em grupos + dark mode (Priority: P2)

Como profissional que usa o produto tanto de dia quanto à noite, eu alterno entre tema claro e
escuro sem perder legibilidade em nenhuma tela; e quando abro o menu, encontro uma separação
clara entre "ver quem eu sou" (Perfil, Trajetória, Registros, agrupados como "Meu espelho") e "o
que posso fazer com isso" (Gerar conteúdo, Me preparar, Perguntar, agrupados como "Usar") — em
vez de quatro destinos soltos no mesmo nível.

**Why this priority**: Decisão explícita da Ohana ao revisar a segunda iteração visual — adotar o
menu novo junto com o layout novo do Painel e o dark mode, mantendo intacto o fluxo de Registrar/
Registros já validado (US1-4). P2 porque é reorganização de navegação, não desbloqueio do
registro em si.

**Independent Test**: No desktop, abrir a sidebar e conferir os dois grupos ("Meu espelho" e
"Usar") com seus itens; clicar em "Perfil" e "Trajetória" e confirmar que ambos levam à página do
Espelho já existente (a segunda abrindo com o toggle interno de trajetória/timeline já
selecionado); alternar para modo escuro e conferir legibilidade em Painel, drawer e navegação.

**Acceptance Scenarios**:

1. **Given** a sidebar desktop, **When** a pessoa olha o menu, **Then** vê "Painel" e "Registrar"
   (ação, não destino de navegação) no topo, o grupo "Meu espelho" (Perfil, Trajetória,
   Registros) e o grupo "Usar" (Gerar conteúdo, Me preparar, Perguntar).
2. **Given** a sidebar, **When** a pessoa clica em "Perfil", **Then** abre a página do Espelho já
   existente (feature `006`/`007`) — nenhum conteúdo novo é criado por esta feature.
3. **Given** a sidebar, **When** a pessoa clica em "Trajetória", **Then** abre a mesma página do
   Espelho, com o toggle interno já existente (feature `007`) pré-selecionado na visão de
   linha do tempo — a separação é só de navegação, o conteúdo e o toggle já existem.
4. **Given** a sidebar, **When** a pessoa clica em "Perguntar" (dentro do grupo "Usar"), **Then**
   abre o chat de Perguntar já existente — apenas reposicionado, não reconstruído.
5. **Given** o app em viewport mobile, **When** a pessoa olha a tab bar, **Then** vê 4 abas
   (Painel, Espelho, Registros, Usar) mais o FAB central de Registro — "Espelho" continua único no
   mobile (sem separar Perfil/Trajetória), preservando o toggle interno já existente por falta de
   espaço para dois itens de menu.
6. **Given** qualquer tela construída ou tocada por esta feature (Painel, drawer, navegação),
   **When** a pessoa alterna para modo escuro, **Then** todas essas superfícies usam os tokens de
   tema escuro, mantendo contraste e legibilidade equivalentes ao modo claro.

---

### User Story 7 - Registrar no celular via bottom sheet (Priority: P2)

Como profissional que registra pelo celular entre uma reunião e outra, eu abro o drawer de
Registro como uma folha que sobe da parte de baixo da tela (bottom sheet), do jeito que já
espero de apps mobile, em vez de um formulário de tela cheia desconectado do gesto de toque.

**Why this priority**: Sem isso a experiência mobile do drawer fica quebrada, mas o núcleo
(sempre salvar, anexos, confirmação) já vale mesmo antes do polish mobile — por isso P2 e não P1.

**Independent Test**: Em viewport mobile, tocar no gatilho de Registro (FAB central da navegação
inferior) e verificar que o drawer sobe como bottom sheet ocupando a maior parte da tela, com
alça de arrastar no topo, podendo ser fechado deslizando pra baixo ou tocando fora.

**Acceptance Scenarios**:

1. **Given** a app em viewport mobile, **When** a pessoa toca no gatilho central de Registro na
   navegação inferior, **Then** o drawer abre como bottom sheet (sobe da base, não desliza da
   lateral como no desktop).
2. **Given** o bottom sheet aberto no mobile, **When** a pessoa toca fora dele ou usa o gesto de
   fechar, **Then** ele fecha sem perder o texto já digitado até esse ponto (mantém no rascunho
   da sessão, não persiste como registro).

---

### Edge Cases

- O que acontece se a pessoa tentar salvar com o texto vazio e sem nenhum anexo? → O botão
  "Registrar" fica desabilitado; não há chamada de salvar disparada (não é um caso de erro,
  é ausência de ação possível).
- O que acontece se o salvamento falhar por erro de rede/servidor (não por rejeição de
  conteúdo)? → O sistema mostra uma mensagem de erro clara, mantém o texto digitado intacto no
  drawer (nada se perde) e oferece tentar novamente.
- O que acontece se a pessoa anexar uma imagem grande demais ou um link inválido? → O sistema
  valida no limite técnico já existente (tamanho de arquivo do bucket `evidence-files`) e
  informa o problema sem descartar o restante do conteúdo já digitado.
- O que acontece se a pessoa arrastar ou colar um arquivo de tipo não suportado (ex.: um `.zip`,
  um vídeo)? → O sistema informa que o tipo não é suportado e não adiciona o anexo, sem afetar o
  texto já digitado no drawer.
- O que acontece se a pessoa colar simultaneamente uma imagem E texto (ex.: copiou um trecho de
  documento que inclui uma figura)? → O sistema separa: o texto vai para o campo de texto, a
  imagem vira anexo — comportamento equivalente ao já esperado em Notion/Jira/Slack.
- O que acontece se a pessoa fechar o drawer no meio da digitação, sem salvar? → O conteúdo é
  descartado (não existe conceito de rascunho persistente nesta feature — decisão do record:
  "registro cru é real", não existe estado intermediário salvo).
- O que acontece se a pessoa colar um texto muito longo que pareça cobrir vários eventos/períodos
  (ex.: currículo inteiro, meses de anotações)? → Nesta feature, o sistema **não** detecta nem
  sugere separar em vários registros — apenas salva como um registro só, com o texto cru
  completo. A detecção de multi-evento e a ponte para "Importar como vários" ficam inteiramente
  na feature `027-importar-historico`, junto com o próprio Importar (decisão explícita: não faz
  sentido mostrar essa sugestão antes de existir destino pra ela).
- O que acontece no mobile se o teclado virtual cobrir o botão "Registrar"? → O bottom sheet
  precisa manter o rodapé de ação acessível (scroll interno do conteúdo, rodapé fixo).
- O que acontece se a pessoa clicar em "Perguntar ao histórico" sem nenhum registro ainda? →
  Mantém o comportamento já existente do chat de Perguntar (fora de escopo alterar essa lógica
  aqui).
- O que acontece se a pessoa clicar no botão "Importar currículo ou LinkedIn" do modo "novo"? →
  Nada — é intencionalmente não funcional nesta feature (FR-021). Não deve parecer quebrado (sem
  cursor de erro, sem log de exceção), apenas sem ação — vitrine do que vem na feature `027`.
- O que acontece se a pessoa clicar em "Gerar conteúdo" ou "Me preparar" (grupo "Usar")? →
  "Gerar conteúdo" navega direto para `/presenca?hub=mostrar` e "Me preparar" navega direto para
  `/presenca?hub=preparar` — ambas rotas já existentes da feature `013-motor-de-voz`. Os dois
  itens de menu substituem a splash intermediária de 2 cards que hoje existe em `/usar`; nenhum
  conteúdo novo é criado, é reorganização de entrada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE salvar qualquer registro com conteúdo textual não-vazio, independente
  do tamanho do texto, sem aplicar limite mínimo de caracteres.
- **FR-002**: O sistema NÃO DEVE redirecionar a pessoa para outra superfície (ex.: chat) como
  consequência do tamanho ou formato do texto digitado no drawer de Registro.
- **FR-003**: O sistema DEVE preservar o texto cru exatamente como digitado/colado (verbatim),
  sem truncar, resumir ou descartar conteúdo no momento do salvar.
- **FR-004**: O ato de salvar um registro NÃO DEVE depender da conclusão de nenhuma chamada de
  IA — o salvar é uma operação determinística e imediata.
- **FR-005**: O sistema DEVE permitir anexar uma ou mais imagens ao registro por três caminhos
  equivalentes: (a) clicar no botão "Imagem" e escolher um arquivo, (b) colar (Cmd/Ctrl+V) uma
  imagem da área de transferência com o foco no drawer, e (c) arrastar e soltar um arquivo de
  imagem sobre o drawer aberto — todos exibindo miniatura real da imagem anexada.
- **FR-005a**: Durante um arraste de arquivo sobre o drawer aberto, o sistema DEVE exibir um
  destaque visual indicando que soltar ali anexa o arquivo; fora de um arraste ativo, essa
  affordance permanece invisível (não polui a superfície do drawer em repouso).
- **FR-006**: O sistema DEVE permitir anexar um ou mais links ao registro **apenas** via o botão
  explícito "Link" (informar a URL nesse fluxo dedicado), exibindo o link como um tile
  identificável (domínio/título). Uma URL colada ou digitada como parte do texto livre do
  registro NÃO DEVE ser convertida automaticamente em anexo-link — permanece como texto.
- **FR-007**: O sistema DEVE permitir remover um anexo (imagem ou link) antes de salvar o
  registro.
- **FR-008**: Anexos de imagem e link DEVEM persistir associados ao registro após salvo, usando
  a estrutura de dados `evidences` e o bucket `evidence-files` já existentes (migration 007).
- **FR-009**: Após salvar, o sistema DEVE exibir uma confirmação visível com um título
  pré-preenchido e a indicação de que o registro foi salvo em Registros.
- **FR-010**: O título exibido na confirmação DEVE ser editável pela pessoa antes ou depois de
  concluir a confirmação, e a edição DEVE persistir no registro salvo.
- **FR-011**: O Painel DEVE exibir uma saudação personalizada, um gatilho único de Registro em
  destaque, um resumo de "Suas forças" e uma lista de "Registros recentes", substituindo tanto a
  barra fixa "Registrar | Perguntar" quanto o desenho anterior de cartão-Espelho + gatilho lado a
  lado.
- **FR-012**: O gatilho de Registro no Painel, ao ser ativado, DEVE abrir o drawer de depósito.
- **FR-012a**: Se a pessoa começar a digitar ou colar conteúdo diretamente no gatilho de Registro
  do Painel (antes de o drawer estar aberto), o sistema DEVE abrir o drawer já com esse conteúdo
  preenchido, sem perder o que foi digitado/colado no meio do caminho.
- **FR-013**: A ação "Perguntar" DEVE permanecer acessível a partir da navegação, dentro do grupo
  "Usar" (ver FR-023) — não mais como opção co-igual ao Registro numa barra fixa, nem inline no
  corpo do Painel. Ao ser ativada, DEVE abrir o `ChatSheet` já existente como overlay sobre a
  página atual (mesmo comportamento do toggle `Segmented` de hoje) — não é uma rota de navegação
  nova.
- **FR-023**: A navegação DEVE reorganizar os destinos em grupos: "Painel" e "Registrar" (ação)
  isolados no topo; grupo "Meu espelho" com Perfil, Trajetória e Registros; grupo "Usar" com
  Gerar conteúdo (link direto para `/presenca?hub=mostrar`), Me preparar (link direto para
  `/presenca?hub=preparar`) e Perguntar (overlay, ver FR-013) — ambos os links de "Usar"
  substituem a splash intermediária de 2 cards hoje existente em `/usar`.
- **FR-024**: "Perfil" e "Trajetória" DEVEM apontar para a página do Espelho já existente — a
  segunda com o toggle interno de trajetória/linha do tempo (já existente, feature `007`)
  pré-selecionado. Nenhum conteúdo novo de Espelho é criado por esta feature; é reorganização de
  navegação sobre o que já existe.
- **FR-025**: Em viewport mobile, a navegação DEVE manter "Espelho" como um único destino (sem
  separar Perfil/Trajetória), preservando o toggle interno já existente — a separação em dois
  itens é exclusiva do menu desktop, que tem espaço para isso.
- **FR-026**: Todas as superfícies construídas ou modificadas por esta feature (Painel, drawer de
  Registro, navegação) DEVEM suportar tema claro e escuro, com contraste e legibilidade
  equivalentes entre os dois.
- **FR-014**: Em viewport mobile, o drawer de Registro DEVE se apresentar como bottom sheet
  (sobe da base da tela), não como painel lateral (comportamento desktop) nem como formulário de
  tela cheia.
- **FR-015**: O sistema DEVE permitir fechar o drawer sem salvar, descartando o conteúdo digitado
  (sem persistir como rascunho).
- **FR-016**: Em caso de falha técnica ao salvar (rede/servidor), o sistema DEVE preservar o
  texto já digitado no drawer e oferecer nova tentativa, distinguindo esse erro de uma rejeição
  de conteúdo (que não deve mais existir).
- **FR-017**: Para textos colados acima de um tamanho perceptível (ex.: acima de ~200 caracteres),
  o sistema DEVE exibir um sinal visível confirmando que a fonte completa foi preservada (não
  resumida) — mitigação direta do risco "cru preservado mas não usado" do decision record.
- **FR-018**: O sistema DEVE permitir anexar áudio gravado ao registro, reaproveitando o
  componente de gravação/transcrição por voz já existente no produto (Web Speech, feature
  `016-captura-v2`) — sem reconstruir essa capacidade do zero.
- **FR-019**: O drawer DEVE oferecer uma seção opcional "+ adicionar detalhes" com campos de
  texto simples (métrica, impacto, tags, empresa, data) preenchíveis manualmente a qualquer
  momento, sem depender de nenhuma chamada de IA — essa seção existe independentemente de
  qualquer botão de estruturação automática (que é escopo da feature B).
- **FR-020**: O sistema NÃO DEVE detectar ou sugerir que um texto colado cobre "vários períodos/
  eventos", nem oferecer qualquer ponte para importação em lote — essa detecção e a ponte para
  "Importar como vários" pertencem inteiramente à feature `027-importar-historico`.
- **FR-021**: No modo "novo" do Painel (conta sem registros), o sistema DEVE exibir um botão
  "Importar currículo ou LinkedIn" como elemento visual, **sem** ação funcional associada —
  clicar nele não deve navegar nem disparar nenhum fluxo nesta feature.
- **FR-022**: O cartão "Seu Espelho se forma conforme você registra" (modo "novo" do Painel) DEVE
  exibir um indicador de progresso rumo ao primeiro retrato do Espelho, calculado a partir do
  limiar já existente no sistema (hoje 3 registros) — sem introduzir um novo número ou nova regra
  de negócio.

*Fora de escopo desta feature (pertence a `026-organizar-destaques` ou `027-importar-historico`)*:
botão "Organizar" e qualquer estruturação **por IA** de métrica/impacto/tags (a digitação manual
desses mesmos campos, sem IA, está em escopo — ver FR-019); conceito de destaques dentro de um
registro-fonte; reestruturação da tela Registros (grade de faíscas, timeline por mês, miniatura
em cards da lista); detecção de multi-evento e o fluxo de "Importar histórico" em lote (ver
FR-020).

*Fora de escopo mesmo com a adoção da navegação nova (FR-023 a FR-026)*: criar conteúdo novo para
Perfil, Trajetória, Gerar conteúdo, Me preparar ou Perguntar — esta feature só reorganiza a
navegação sobre o que já existe. Suporte a dark mode (FR-026) é limitado às superfícies que esta
feature constrói ou toca (Painel, drawer, navegação); não é um compromisso de dark mode para o
produto inteiro.

### Key Entities

- **Registro (`entries`)**: entrada existente no schema — reusada sem migration nova. Nesta
  feature, os campos relevantes são o texto cru (verbatim), o título (editável, gerado por
  heurística determinística, não por IA), os anexos associados, e — quando preenchidos
  manualmente via "+ adicionar detalhes" — métrica/impacto/tags/empresa/data. O código atual gera
  o título via chamada síncrona de IA (Haiku) acoplada à extração; esta feature substitui esse
  caminho por uma heurística local não-bloqueante, adiando título "de qualidade" (voz
  substantivo-primeiro/outcome-first) para a feature B, que reintroduz a IA de forma assíncrona
  e opcional.
- **Evidência (`evidences` JSONB + bucket `evidence-files`)**: anexos de imagem e link associados
  a um registro — infraestrutura já existente (migration 007) e parcialmente exposta hoje na tela
  de Histórico (`EvidenceSection.tsx` + rota `/api/entries/[id]/evidence`); esta feature estende
  esse mesmo caminho para o novo drawer de captura, em vez de construir um upload próprio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos registros com conteúdo textual não-vazio são salvos com sucesso — zero
  ocorrências de rejeição por tamanho de texto ou de redirecionamento para o chat.
- **SC-002**: O tempo entre clicar em "Registrar" e ver a confirmação salva é imediato
  (sub-segundo, sem esperar por processamento de IA).
- **SC-003**: Após o lançamento, a fundadora (dogfooding) consegue registrar pelo menos um
  evento por dia útil sem encontrar erro de conteúdo insuficiente — sinal definido no decision
  record como critério de sucesso do bloco.
- **SC-004**: 100% dos registros salvos com anexo de imagem exibem a miniatura real da imagem
  (não um ícone genérico) tanto no momento de anexar quanto ao revisitar o registro depois.
- **SC-005**: 100% dos títulos de confirmação são editáveis, e a edição é refletida no registro
  final em 100% dos casos testados.
- **SC-006**: No Painel, nenhuma pessoa nova reporta confusão sobre qual botão usar para
  registrar (medido qualitativamente via primeiro uso observado / feedback direto) — sinal de
  que a barra ambígua "Registrar | Perguntar" foi de fato resolvida.

## Assumptions

- O texto do título de confirmação (US3, FR-009/FR-010) é gerado por uma heurística
  determinística e local (ex.: primeira linha do texto, truncada) — não por chamada de IA,
  para não reintroduzir dependência de IA no caminho crítico do salvar. Refinar o título via IA
  ("substantivo-primeiro, outcome-first") é trabalho de estruturação e pertence à feature B. Isso
  é uma mudança real em relação ao código atual, que hoje gera o título via IA síncrona (Haiku,
  `captureAndReflect.ts`) acoplada à mesma chamada que extrai métrica/impacto/tags — essa chamada
  síncrona inteira é removida do caminho de salvar por esta feature.
- Áudio como tipo de anexo já existe no produto (`AudioRecorder`/`AudioButton`, Web Speech,
  feature `016-captura-v2`) e aparece também no protótipo visual desta feature (botão "Gravar").
  Por já existir e aparecer na referência visual, entra como requisito de reuso (FR-018), não
  como algo opcional — a transcrição por voz já funciona 100% client-side hoje e não depende da
  chamada de IA que está sendo removida.
- O código atual tem um caminho de captura direta sem IA já existente (`kind: 'marco'` na rota
  `/api/capture`, JSON simples, grava direto). Vale avaliar no `/speckit-plan` se o novo
  "sempre salva" desta feature pode reaproveitar essa lógica em vez de recriar do zero — não é
  uma decisão de spec, é uma oportunidade de implementação a confirmar no plano técnico.
- Existe um componente `CaptureComposer.tsx` que aparenta estar órfão (não importado fora do
  próprio diretório/testes) — o fluxo real hoje está em `AppShellClient.tsx` +
  `CaptureInput`/`CaptureConversation`. Confirmar no `/speckit-plan` se é seguro remover junto com
  o resto do fluxo antigo, antes de simplesmente deletar.
- **Regressão temporária aceita e decidida com a Ohana**: hoje existe um botão de importar PDF
  (`FileButton`, ícone de clipe) dentro da própria barra fixa "Registrar | Perguntar"
  (`AppShellClient.tsx`), acessível em qualquer página interna para quem já passou do onboarding.
  A FR-011 remove essa barra fixa, e o botão "Importar currículo ou LinkedIn" que a substitui no
  Painel (FR-021) é apenas visual, sem função. Ou seja: **entre o lançamento da 025 e o
  lançamento da 026/027, ninguém consegue importar currículo/PDF fora do onboarding** — decisão
  explícita, não descuido, condicionada a essas features seguirem de perto.
- Nenhuma migration de banco de dados é necessária — reusa as tabelas/colunas/bucket já
  existentes (`entries`, `evidences`, `evidence-files`), conforme confirmado no decision record.
- **Atualizado após a segunda iteração visual**: a navegação de 4 destinos (Painel, Espelho,
  Registros, Usar) da feature `021` **é alterada** por esta feature — não é mais só remoção da
  barra fixa. Vira uma navegação agrupada (FR-023 a FR-025): "Meu espelho" (Perfil, Trajetória,
  Registros) e "Usar" (Gerar conteúdo, Me preparar, Perguntar) no desktop; mobile mantém os 4
  destinos originais (Painel, Espelho, Registros, Usar) com "Espelho" ainda único. Essa é a maior
  expansão de escopo desta rodada de revisão — decisão explícita da Ohana ao ver a segunda
  iteração visual, não scope creep silencioso. **Decidido no `/speckit-clarify`**: o esforço de
  navegação continua dentro da 025 (não vira sub-fatia própria) — navegação e dark mode são
  pré-requisito visual pro Painel/drawer novos.
- A tela de Registros (lista/feed) já existe (feature `017`) e continua funcionando como está;
  esta feature apenas garante que novos registros salvos pelo drawer apareçam nela. Nenhuma
  mudança visual na lista de Registros em si é escopo desta feature.
- Dois detalhes de interação do protótipo ficam para o `/impeccable shape` (não viram FR aqui,
  por não mudar o que a feature faz, só como ela se sente): os prompts de "não sabe por onde
  começar?" no campo vazio (verificar se `src/lib/panel/getCapturePrompt.ts`, já existente, cobre
  isso) e os atalhos de teclado (Esc fecha o drawer, ⌘/Ctrl+Enter registra).
- O protótipo do Claude Design cobre o fluxo A+B+C junto; esta spec assume que a implementação
  visual desta feature usa APENAS os elementos listados em "Referência visual" acima, deixando
  claramente preparado o terreno (mesmo vocabulário de componentes/tokens) para B e C plugarem
  depois sem retrabalho visual.
