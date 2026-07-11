# Feature Specification: Rebuild da Landing Page

**Feature Branch**: `022-landing-rebuild`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Rebuild da landing page do Borogodó: narrativa dos 4 verbos, pilar Provas, propriedade do dado, mídia real (com placeholder agora), SEO e GEO completos. Mescla da issue #36 (narrativa, voz, estrutura) com a auditoria de mercado (camada técnica de SEO/GEO + reforço dos diferenciais). Direção em docs/decisions/001-landing-page-rebuild.md."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitante frio entende e cria conta (Priority: P1)

Uma pessoa chega pela primeira vez por um link de LinkedIn, no celular, sem conhecer a marca.
Em poucos segundos ela entende qual é a dor que o produto resolve, vê uma demonstração real do
resultado, percebe que é de graça e tem uma única ação clara pra fazer: criar conta.

**Why this priority**: é o objetivo core da página (adesão). Sem isto, nada mais converte. É o
MVP da LP: mesmo que só esta fatia exista, a página já cumpre a função de transformar visita
em signup.

**Independent Test**: abrir a LP no mobile e no desktop sem sessão, confirmar que a primeira
dobra comunica a dor (não a palavra "borogodó" sozinha), mostra a demo, deixa claro que é
gratuito e leva ao fluxo de criação de conta com um clique.

**Acceptance Scenarios**:

1. **Given** um visitante sem sessão no mobile, **When** a LP carrega, **Then** ele vê a
   headline da dor, a linha de significado de "borogodó", a demo do produto e um único CTA de
   signup, tudo na primeira dobra (a demo não fica escondida no mobile).
2. **Given** um visitante na primeira dobra, **When** ele lê abaixo do CTA, **Then** vê que é
   gratuito e que o primeiro resultado leva cerca de 5 minutos.
3. **Given** um visitante que clica no CTA primário, **When** a ação dispara, **Then** ele cai
   no fluxo de criação de conta (onboarding), não numa waitlist.
4. **Given** um visitante que já tem conta, **When** ele procura entrar, **Then** encontra um
   link "Entrar" discreto na navbar, sem competir visualmente com o CTA de signup.

---

### User Story 2 - Buscador e assistentes de IA encontram e citam o Borogodó (Priority: P1)

Uma pessoa pergunta a um motor de busca ou a um assistente de IA (ChatGPT, Perplexity, Gemini,
resumo de IA do Google) por uma ferramenta de inteligência de carreira, autoavaliação ou brag
document em português. O Borogodó pode aparecer e ser citado porque a página é legível por
crawlers, tem dados estruturados e uma definição autocontida.

**Why this priority**: a Ohana exige SEO e GEO em 100%. "borogodó" tem busca zero hoje; a
descoberta orgânica e a citação por IA dependem inteiramente desta camada. É requisito de
lançamento, não melhoria futura.

**Independent Test**: validar que a página tem um H1 único e hierarquia limpa, que os dados
estruturados (JSON-LD de software, organização e FAQ) passam em validador, que existe um
arquivo de orientação pra modelos de IA na raiz do domínio, que o conteúdo é renderizado no
servidor (visível sem JavaScript), e que crawlers de IA não estão bloqueados.

**Acceptance Scenarios**:

1. **Given** a LP publicada, **When** um crawler busca conteúdo sem executar JavaScript,
   **Then** todo o texto das seções está presente no HTML servido (renderização no servidor).
2. **Given** a LP publicada, **When** os dados estruturados são extraídos, **Then** existem
   três blocos válidos (aplicação de software, organização e página de perguntas) sem erro em
   validador de schema.
3. **Given** a seção de perguntas frequentes, **When** o schema de FAQ é gerado, **Then** cada
   pergunta e resposta visível na página corresponde a uma entrada no dado estruturado.
4. **Given** a raiz do domínio, **When** um assistente de IA busca orientação, **Then** existe
   um arquivo de definição (o que é, diferenciais, público, preço, links) acessível.
5. **Given** os primeiros parágrafos da página, **When** um modelo de IA extrai uma definição,
   **Then** existe uma frase autocontida que descreve o que é o Borogodó sem depender do resto.
6. **Given** a configuração do domínio, **When** crawlers de IA tentam acessar, **Then** eles
   não estão bloqueados.
7. **Given** as meta tags, **When** o link é compartilhado, **Then** título, descrição e imagem
   de compartilhamento são textos humanos (não a palavra "Borogodó" sozinha).

---

### User Story 3 - Visitante cético confia antes de criar conta (Priority: P2)

Uma pessoa interessada mas desconfiada rola a página com perguntas na cabeça: "a IA inventa?",
"meus dados são privados?", "minha empresa vê?", "é diferente do ChatGPT?". A página responde
cada uma com clareza, prova o diferencial e mostra que há uma pessoa real por trás.

**Why this priority**: confiança é o segundo maior fator de conversão num produto de carreira
(decisão de alto risco emocional). Importa muito, mas a fatia P1 já entrega valor sem ela.

**Independent Test**: rolar a página inteira e confirmar que existem as seções de Provas,
propriedade do dado, manifesto, prova social honesta e perguntas frequentes, cada uma
respondendo a uma objeção real.

**Acceptance Scenarios**:

1. **Given** a seção Provas, **When** o visitante lê, **Then** entende que cada força nasce de
   um fato registrado e vem com a evidência ao lado, e que a IA pergunta quando falta prova.
2. **Given** a seção de propriedade do dado, **When** o visitante lê, **Then** entende que o
   registro é dele e não da empresa, com sinais de privacidade (criptografia, só ele vê,
   exportável, sem acesso do empregador).
3. **Given** a seção de prova social, **When** o visitante lê, **Then** vê a construção no
   aberto pela founder, sem depoimento inventado nem número de fachada.
4. **Given** a seção de perguntas, **When** o visitante busca uma objeção comum, **Then**
   encontra resposta direta pra gratuidade, funcionamento, anti-fabricação, diferença do
   ChatGPT, privacidade e esforço necessário.

---

### User Story 4 - Visitante percorre a narrativa dos 4 verbos (Priority: P2)

Uma pessoa que se interessou quer entender como funciona. A página apresenta a jornada completa
em quatro movimentos (Descobrir, Entender, Provar, Usar) e fecha com um convite final coerente.

**Why this priority**: a narrativa dos 4 verbos é a espinha do produto e dá significado à
proposta, mas a conversão básica (P1) não depende dela estar 100%.

**Independent Test**: confirmar que a seção "como funciona" apresenta os quatro verbos como
passos de uma jornada (não grid genérico de cards), sem prometer recurso fora do v1 (currículo,
portfólio), e que há um CTA final.

**Acceptance Scenarios**:

1. **Given** a seção de como funciona, **When** o visitante lê, **Then** vê os quatro
   movimentos na ordem Descobrir, Entender, Provar, Usar, cada um com benefício concreto.
2. **Given** a página, **When** o visitante procura promessas de recurso, **Then** não há
   menção a currículo por vaga nem portfólio completo (fora do v1).
3. **Given** o fim da página, **When** o visitante termina de rolar, **Then** encontra um CTA
   final único pra signup, coerente com o do hero.

---

### User Story 5 - Slots de mídia real do produto (com placeholder agora) (Priority: P3)

Os mockups desenhados à mão que imitam o produto dão lugar a slots preparados para mídia real
(vídeo do output do onboarding e screenshot do card de força). Enquanto a mídia real não é
produzida, cada slot mostra um placeholder de boa qualidade, fácil de trocar depois sem mexer
na estrutura.

**Why this priority**: coerência com o wedge ("não inventa, comprova") pede mostrar produto
real, mas a página funciona com placeholder enquanto a mídia real é produzida. Pode entrar por
último.

**Independent Test**: confirmar que os dois slots de mídia (demo do hero e card de Provas)
existem como áreas isoladas com placeholder, prontas pra receber mídia real sem alterar o
layout ao redor, e que o mockup de mapa de carreira foi removido.

**Acceptance Scenarios**:

1. **Given** a demo do hero, **When** a página carrega, **Then** existe um slot de mídia com
   placeholder de qualidade, dimensionado para receber o vídeo real do onboarding depois.
2. **Given** a seção Provas, **When** a página carrega, **Then** existe um slot com placeholder
   dimensionado para o screenshot real do card de força com evidência citada.
3. **Given** a troca futura da mídia, **When** a mídia real substituir o placeholder, **Then**
   nenhuma outra parte do layout precisa mudar.
4. **Given** a LP atual, **When** comparada com a anterior, **Then** o mockup de mapa de
   carreira não existe mais.

### Edge Cases

- O que acontece quando o visitante tem movimento reduzido ativado no sistema? A demo e as
  animações respeitam essa preferência (sem movimento involuntário).
- Como a página se comporta em telas pequenas? Toda seção, incluindo a demo do hero, é legível
  e a demo não fica escondida.
- O que aparece no slot de mídia enquanto não há mídia real? Um placeholder de qualidade, nunca
  um espaço vazio ou quebrado.
- Como o compartilhamento se comporta antes da imagem de compartilhamento existir? Há uma imagem
  de fallback adequada, nunca um preview quebrado.
- O que acontece se a mídia real (vídeo) falhar ao carregar? Há um estado estático de fallback
  (imagem) que mantém o sentido da demo.

## Requirements *(mandatory)*

### Functional Requirements

**Estrutura e narrativa**

- **FR-001**: A LP MUST apresentar a narrativa dos quatro verbos (Descobrir, Entender, Provar,
  Usar) como a espinha da página, substituindo a história antiga de três cores.
- **FR-002**: A LP MUST incluir uma seção dedicada ao pilar Provas, nomeando explicitamente a
  ancoragem em fato (cada força vem de evidência real; a IA pergunta quando falta prova).
- **FR-003**: A LP MUST incluir uma seção de propriedade do dado ("seu, não da sua empresa")
  com sinais de privacidade.
- **FR-004**: A LP MUST incluir o manifesto brasileiro (mostrar valor não é se gabar).
- **FR-005**: A LP MUST incluir prova social honesta via construção no aberto pela founder, sem
  depoimento inventado nem número de fachada.
- **FR-006**: A LP MUST incluir uma seção de perguntas frequentes cobrindo gratuidade,
  funcionamento, anti-fabricação, diferença do ChatGPT, privacidade e esforço necessário.
- **FR-007**: A LP MUST NOT prometer recursos fora do v1 (currículo por vaga, portfólio
  completo, publicação automática).

**Hero e conversão**

- **FR-008**: O hero MUST liderar pela headline da dor, com a palavra "borogodó" recuperada
  numa linha de significado (estilo dicionário) próxima à headline.
- **FR-009**: A LP MUST ter um único CTA de conversão (signup), repetido no hero e no fim. O
  acesso de quem já tem conta MUST ser um link discreto "Entrar" na navbar.
- **FR-010**: O hero MUST deixar explícito que o produto é gratuito pra começar e que o
  primeiro resultado leva cerca de 5 minutos.
- **FR-011**: A demo do produto no hero MUST ser visível no mobile (não escondida).
- **FR-012**: A demo do hero MUST mostrar uma força com a evidência citada (o fato que a
  sustenta), não só o nome da força.
- **FR-013**: A LP MUST oferecer navegação por âncoras para as seções principais.

**Mídia real (slots com placeholder)**

- **FR-014**: A LP MUST substituir os mockups desenhados à mão por slots de mídia preparados
  para mídia real do produto em dois lugares: a demo do hero e o card da seção Provas.
- **FR-015**: Cada slot de mídia MUST exibir um placeholder de qualidade enquanto a mídia real
  não existe, e MUST permitir a troca pela mídia real sem alterar o layout ao redor.
- **FR-016**: A LP MUST remover o mockup de mapa de carreira (saiu da narrativa).
- **FR-017**: A demo do hero MUST ter um estado estático de fallback caso a mídia em vídeo não
  carregue.

**SEO e GEO (requisito de lançamento, 100%)**

- **FR-018**: A página MUST ter um único H1 (a headline da dor) e hierarquia de headings limpa
  (H2 por seção, H3 dentro).
- **FR-019**: A página MUST incluir dados estruturados válidos para aplicação de software,
  organização e página de perguntas frequentes.
- **FR-020**: O dado estruturado de perguntas frequentes MUST refletir exatamente as perguntas
  e respostas visíveis na seção de FAQ.
- **FR-021**: O domínio MUST servir um arquivo de orientação para modelos de IA na raiz, com
  definição, diferenciais, público, preço e links.
- **FR-022**: A página MUST ser renderizada no servidor, de modo que todo o conteúdo textual
  esteja presente no HTML sem execução de JavaScript.
- **FR-023**: Os primeiros parágrafos MUST conter uma frase definitória autocontida do que é o
  Borogodó.
- **FR-024**: A configuração do domínio MUST permitir o acesso de crawlers de busca e de IA
  (não bloqueá-los).
- **FR-025**: A página MUST ter meta tags humanas (título, descrição) e dados de
  compartilhamento (título, descrição e imagem) com texto humano, não a palavra "Borogodó"
  isolada.
- **FR-026**: A imagem de compartilhamento MUST representar o diferencial (o card de força com
  a prova), com um fallback adequado enquanto a imagem final não existe.

**Voz e identidade**

- **FR-027**: Toda a copy MUST obedecer à restrição de voz: sem travessão, sem a construção
  "não é X, é Y", sem lista de três para ritmo, sem frases emparelhadas, sem metáfora
  enfeitada; voz brasileira, direta, benefício em cada frase.
- **FR-028**: A LP MUST preservar o craft visual atual (paleta oklch, tipografia Fraunces e
  Geist, temperatura cromática variando por seção).
- **FR-029**: A LP MUST respeitar a preferência de movimento reduzido do sistema.

### Key Entities

- **Seção da LP**: uma unidade de conteúdo da página (hero, dores, 4 verbos, Provas,
  propriedade do dado, manifesto, prova social, perguntas, CTA final, rodapé), com sua própria
  temperatura cromática e papel na narrativa.
- **Slot de mídia**: área isolada que hoje mostra um placeholder e depois recebe mídia real
  (vídeo do onboarding ou screenshot do card de força), sem afetar o layout ao redor.
- **Dado estruturado**: a descrição legível por máquina da aplicação, da organização e das
  perguntas frequentes, derivada do conteúdo visível.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um visitante novo, sem contexto, consegue dizer o que o produto resolve em até 5
  segundos na primeira dobra (validável em teste de usuário).
- **SC-002**: 100% das seções com texto estão presentes no HTML servido sem execução de
  JavaScript.
- **SC-003**: 100% dos blocos de dados estruturados (software, organização, perguntas) passam
  em validador sem erro.
- **SC-004**: 100% das perguntas visíveis na seção de FAQ têm correspondência no dado
  estruturado.
- **SC-005**: A demo do produto é visível e legível em telas de celular (validável em
  larguras a partir de 360px).
- **SC-006**: Nenhuma promessa de recurso fora do v1 aparece na página (verificável por revisão
  de conteúdo).
- **SC-007**: Toda a copy passa na revisão de voz (zero travessões, zero construções "não é X,
  é Y", zero listas de três para ritmo).
- **SC-008**: Os dois slots de mídia aceitam a troca de placeholder por mídia real sem nenhuma
  alteração no layout ao redor (validável trocando por um arquivo de exemplo).
- **SC-009**: Crawlers de busca e de IA conseguem acessar a página (não bloqueados na
  configuração do domínio).
- **SC-010**: O preview de compartilhamento exibe título, descrição e imagem humanos, sem
  preview quebrado.
- **SC-011**: A taxa de conversão visita → conta criada é monitorável após o lançamento, com
  meta de referência de 2 a 3% no hero → signup para disparar reavaliação da headline.

## Assumptions

- O fluxo de criação de conta e o onboarding existentes (`CaptureLoopStep`) entregam um
  primeiro resultado mínimo no dia 1, então a LP pode prometer o espelho sem furar no primeiro
  uso.
- A mídia real (vídeo do onboarding e screenshot do card de força) será produzida depois; o
  escopo desta feature entrega slots com placeholder de qualidade, prontos para a troca.
- Antes de produzir a mídia real, será feito um julgamento se o output real do onboarding e do
  Espelho está digno de palco; se não estiver, a tela é polida antes ou a mídia real fica só no
  hero. Esse julgamento é externo a esta feature.
- O hub de conteúdo (blog/guias) e o consenso off-site (Reddit, LinkedIn, Product Hunt, PR) são
  uma trilha de GTM separada e estão fora do escopo deste rebuild.
- A seção de preço dedicada não entra enquanto não houver planos pagos no ar; a gratuidade é
  comunicada por microcopy no hero e no CTA final.
- O contato humano no rodapé (ContactCard da feature 020) é reaproveitado.
- A identidade visual atual (oklch, Fraunces, Geist, temperatura por seção) é a base; este é um
  rebuild de narrativa e estrutura, não de identidade.
- A direção completa está em `docs/decisions/001-landing-page-rebuild.md`, derivada da issue #36
  e da auditoria de mercado.
