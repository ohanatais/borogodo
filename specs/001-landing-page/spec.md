# Feature Specification: Landing Page Borogodó

**Feature Branch**: `001-landing-page`

**Created**: 2026-06-05
**Last Updated**: 2026-06-06

**Status**: Draft

**Input**: Landing page do Borogodó — app de inteligência de carreira para o white-collar brasileiro.

---

## Contexto e estrutura da página

A LP é a porta de entrada pública do produto. Ela não tem lista de espera — o CTA leva
diretamente ao fluxo de criação de conta (sign up), com acesso secundário para quem já tem
conta (sign in). Os módulos de autenticação são features separadas e serão desenvolvidos
na sequência.

**Seções da página** (em ordem de rolagem):

1. Hero — ataca a dor, não o produto; CTA principal de sign up
2. As quatro dores — situações concretas e reconhecíveis
3. Como funciona — três passos, foco no usuário
4. O espelho — mockup visual do core de inteligência
5. Mapa de carreira — mockup visual do histórico e perfil profissional por skills
6. Geração de conteúdo — comparação real vs. genérico
7. CTA final — sign up primário + sign in secundário

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Profissional que trava na hora de pedir promoção (Priority: P1)

Ana é PM em uma empresa de tech. Daqui a dois meses ela tem revisão de desempenho. Ela chega
na LP depois de pesquisar "como pedir promoção" e lê a headline — para de rolar imediatamente.
Reconhece a própria situação, sente que a página foi escrita pra ela, entende o produto em
uma frase e cria uma conta.

**Why this priority**: Caminho mais curto entre dor aguda e conversão. Usuária com deadline
emocional é a mais propensa a agir agora.

**Independent Test**: Exibir o hero + seção de dores para usuários representativos e medir
se reconhecem a própria situação sem instruções.

**Acceptance Scenarios**:

1. **Given** Ana chega na LP via busca orgânica,
   **When** ela lê a headline do hero,
   **Then** ela para de rolar e lê o restante da dobra acima da linha de corte.

2. **Given** Ana leu o hero e a seção de dores,
   **When** ela clica no botão de CTA primário,
   **Then** ela é direcionada para a tela de criação de conta sem fricção intermediária.

---

### User Story 2 — Profissional que quer postar no LinkedIn mas trava (Priority: P2)

Bruno é gerente de vendas. Bateu meta pelo segundo trimestre consecutivo mas não sabe como
contar isso sem parecer arrogante ou genérico. Chega na LP, vê a seção de geração de
conteúdo e entende que o Borogodó gera posts a partir do que ele viveu — não de um prompt
em branco. Cria uma conta.

**Why this priority**: Introduz a proposta de valor de geração de conteúdo, que diferencia
o produto de ferramentas genéricas de IA.

**Independent Test**: Exibir a seção de geração de conteúdo de forma isolada e medir se
usuários entendem a diferença entre "gerado do histórico real" vs. "gerado do zero".

**Acceptance Scenarios**:

1. **Given** Bruno chega à seção de geração de conteúdo,
   **When** ele vê o exemplo de post lado a lado (histórico real vs. genérico),
   **Then** ele consegue articular a diferença sem que a LP precise explicar explicitamente.

2. **Given** Bruno decide criar uma conta,
   **When** ele busca o CTA,
   **Then** ele encontra o botão sem precisar rolar mais do que duas telas de altura a partir
   de qualquer ponto da página.

---

### User Story 3 — Profissional competente mas invisível que quer crescer (Priority: P3)

Clara trabalha em finanças há 5 anos. É reconhecida internamente mas invisível para o mercado.
Chegou na LP por indicação de uma colega. Rola a página, reconhece a própria situação nas
seções de dores e no mapa de carreira, entende o que ganha e cria uma conta.

**Why this priority**: Representa o público que chega por indicação — crucial para crescimento
orgânico — e valida que a LP funciona também para quem não tem urgência imediata.

**Independent Test**: Medir a taxa de conversão de tráfego indicado vs. tráfego de busca,
esperando que a linguagem direta em segunda pessoa gere identificação mesmo sem urgência imediata.

**Acceptance Scenarios**:

1. **Given** Clara lê a LP completa,
   **When** ela chega ao CTA final,
   **Then** ela consegue articular o ganho específico que o produto entrega para ela — sem
   que a LP precise nomear um perfil com o nome dela.

2. **Given** Clara quer compartilhar a LP com uma colega,
   **When** ela usa o link nativo de compartilhamento do celular,
   **Then** a página carrega e se torna interativa em menos de 3 segundos em conexão 4G.

---

### User Story 4 — Profissional experiente sem clareza da própria identidade profissional (Priority: P2)

Rafael é engenheiro de produto com 7 anos de carreira. Já entregou muito — em startups,
scale-ups, projetos de 0 a 1. Mas nunca conseguiu enxergar o próprio mapa: o que ele é
por skills, onde é realmente bom, qual padrão define sua trajetória. Chega na LP, vê a
seção do mapa de carreira, e pela primeira vez vê uma representação do tipo de profissional
que ele é — AI-native, adaptação rápida, complexidade como ambiente natural. Cria uma conta.

**Why this priority**: Representa uma dor crônica e profunda — diferente da urgência de
Ana, é uma dor de identidade que afeta a maioria dos profissionais experientes. Também
valida o diferencial de "mapa de carreira visual" como feature única do produto.

**Independent Test**: Exibir a seção do mapa de carreira de forma isolada e medir se
usuários com 5+ anos de experiência sentem que o mockup mostra algo que nunca viram antes
sobre si mesmos.

**Acceptance Scenarios**:

1. **Given** Rafael chega à seção do mapa de carreira,
   **When** ele vê o mockup visual com clustering de skills e padrões de trajetória,
   **Then** ele verbaliza espontaneamente algo como "é isso que eu precisava ver".

2. **Given** Rafael quer entender melhor o produto antes de criar conta,
   **When** ele rola a página inteira,
   **Then** ele encontra todas as respostas para suas dúvidas sem precisar de um FAQ.

---

### Edge Cases

- Como a LP se comporta em tela com menos de 375px de largura (dispositivos muito antigos)?
- Como a LP se comporta com JavaScript desabilitado no navegador?
- O que acontece se o serviço de autenticação (sign up) estiver indisponível ao clicar no CTA?
- Como o botão de sign in se comporta quando há sessão ativa (usuário já logado)?
- Como as animações de entrada se comportam quando o usuário prefere movimento reduzido
  (`prefers-reduced-motion: reduce`)?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A LP DEVE exibir uma headline no hero que comunique a dor do usuário antes de
  mencionar o produto ou qualquer funcionalidade.
- **FR-002**: O CTA primário da LP é "Criar conta", que direciona para o fluxo de sign up.
  O CTA secundário é "Já tenho conta", que direciona para o fluxo de sign in. Nenhum outro
  botão de ação principal DEVE existir na página.
- **FR-003**: Os botões de CTA (primário e secundário) DEVEM estar presentes no hero e
  repetidos no CTA final da página. Em nenhuma outra seção DEVEM aparecer.
- **FR-004**: A LP DEVE exibir quatro situações de dor concretas e reconhecíveis, escritas
  em linguagem do usuário — sem bullet points genéricos e sem jargão de produto.
- **FR-005**: A LP DEVE exibir uma seção "Como funciona" com exatamente três passos,
  focados no que o usuário faz — não no que a tecnologia faz.
- **FR-006**: A LP DEVE exibir um mockup visual do "espelho" (core de inteligência), com
  exemplo de insight baseado em evidência real — não uma lista genérica de skills. Ex:
  "Você liderou 4 projetos sob pressão e entregou os quatro no prazo. Esse é um padrão seu."
- **FR-007**: A LP DEVE exibir um mockup visual separado do "mapa de carreira", representando
  o histórico profissional de forma visual e clara: clustering de skills, padrões de
  trajetória, e o perfil profissional por skills do usuário (ex: AI-native, 0→1, SaaS).
  Esse mockup DEVE parecer revelador, não analítico.
- **FR-008**: A LP DEVE exibir a comparação entre um post gerado a partir de histórico real
  e um post genérico de IA, com diferença perceptível sem necessidade de legenda explicativa.
- **FR-010**: O CTA final DEVE ter o botão "Criar conta" em destaque visual claro, com o
  link "Já tenho conta" em peso menor logo abaixo. Sem formulários ou campos de input nessa
  seção — o preenchimento acontece nas telas de auth (módulos separados).
- **FR-011**: A LP DEVE ser totalmente funcional em dispositivos móveis com largura mínima
  de 375px, com layout mobile-first (estilos Tailwind base para mobile; breakpoints `md:`
  e `lg:` somente para expansão em telas maiores).
- **FR-012**: Nenhuma imagem genérica de stock DEVE aparecer na LP. Todo elemento visual
  DEVE ser ilustração, mockup de produto ou composição tipográfica.
- **FR-013**: Todo o copy da LP DEVE estar em português brasileiro coloquial — sem
  "tradutês", sem jargão de tecnologia ou de IA.
- **FR-014**: Todos os elementos interativos (botões de CTA, links) DEVEM ter área de toque
  mínima de 48×48px em mobile.
- **FR-015**: Micro-interações e transições de hover DEVEM ser implementadas via CSS puro.
  Framer Motion é permitido apenas para animações de entrada de seção (fade/slide ao entrar
  na viewport). Nenhuma animação JavaScript DEVE gerar jank em dispositivos intermediários.
- **FR-016**: Nenhuma string de texto DEVE estar hardcoded em componentes React. Todos os
  textos DEVEM estar em `src/messages/pt-BR.json`, acessados via `next-intl`.
- **FR-017**: O arquivo `src/messages/en.json` DEVE existir como stub estrutural vazio,
  espelhando a estrutura de chaves do `pt-BR.json`, pronto para tradução futura.
- **FR-018**: O design DEVE criar ritmo visual ao longo da rolagem, alternando a temperatura
  cromática das seções usando os tokens do sistema (`--color-primary`, `--color-warm`,
  `--color-teal`, fundo creme). Nenhuma seção DEVE ter fundo escuro.
- **FR-019**: A tipografia de títulos DEVE usar Fraunces (display serif), com uso deliberado
  de itálico e variações de peso para criar ênfase visual. O corpo de texto DEVE usar
  Inter ou Geist Sans. Proibido usar uma única fonte em toda a página.
- **FR-020**: Mockups de produto (espelho, mapa de carreira, exemplo de post) DEVEM usar
  grids levemente assimétricos e cantos arredondados, passando sensação de tecnologia com
  sensibilidade humana — sem simetria perfeita ou alinhamentos rígidos de template SaaS.
- **FR-021**: A LP DEVE respeitar `prefers-reduced-motion`: quando ativo, todas as animações
  de entrada via Framer Motion DEVEM ser desativadas; o conteúdo DEVE aparecer sem transição.

### Key Entities

- **Visitante**: Profissional brasileiro que chega na LP; pode ou não criar uma conta.
- **Usuário criado**: Visitante que clicou em "Criar conta" e foi direcionado ao fluxo de
  sign up (módulo externo à LP).
- **Mockup de espelho**: Elemento visual que representa a tela de insights do produto;
  contém insight de exemplo baseado em padrão comportamental fictício mas verossímil.
- **Mockup de mapa de carreira**: Elemento visual que representa o histórico profissional
  organizado visualmente — clustering de skills, linha do tempo de trajetória, perfil
  profissional por especialização. Conteúdo estático e fictício, mas verossímil.
- **Exemplo de post**: Par de textos (histórico real vs. genérico) que demonstra a diferença
  na qualidade da geração de conteúdo.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Taxa de cliques no CTA "Criar conta" ≥ 8% dos visitantes únicos nos primeiros
  30 dias de tráfego orgânico.
- **SC-002**: Taxa de conclusão do fluxo de sign up (visitante que clicou no CTA e criou
  conta efetivamente) ≥ 50% — medida no módulo de auth, mas dependente da qualidade da LP.
- **SC-003**: A página carrega e se torna interativa em menos de 3 segundos em conexão 4G
  em dispositivos móveis Android e iOS.
- **SC-004**: ≥ 70% dos visitantes que chegam ao hero rolam pelo menos até a seção "As
  quatro dores", indicando que a headline gera interesse real.
- **SC-005**: ≥ 30% dos novos usuários criados compartilham a LP organicamente (via link
  ou redes sociais) nos 7 dias seguintes ao cadastro.
- **SC-006**: Em teste de 5 segundos com usuários representativos, ≥ 80% conseguem
  descrever o que o produto faz após ver apenas o hero.
- **SC-007**: Em sessões de teste com profissionais de 5+ anos de experiência, ≥ 70%
  identificam a seção do mapa de carreira como "algo que nunca viram antes" sobre si mesmos.

---

## Assumptions

- A LP é a página pública de entrada do produto. O CTA leva ao fluxo de sign up/sign in,
  que são módulos separados desenvolvidos na sequência — o escopo desta spec cobre apenas
  o frontend da LP e a navegação até as telas de auth.
- Não há lógica de autenticação, sessão ou backend dentro desta feature. O botão de CTA é
  um `<Link>` para as rotas `/sign-up` e `/sign-in`, que existirão nos próximos módulos.
- Se o usuário já tiver sessão ativa, o CTA do hero DEVE redirecionar para o dashboard
  (ou para `/app`) em vez do sign up — comportamento controlado por lógica no layout pai,
  não na LP em si.
- Animações Framer Motion apenas para entrada de seção (fade/slide via IntersectionObserver).
  Micro-interações e hovers via CSS puro.
- A tipografia display Fraunces está disponível via `next/font/google`; fallback é serif
  genérica para garantir legibilidade durante o carregamento.
- A estrutura next-intl é configurada como parte do setup base desta feature; a LP já nasce
  com i18n, mesmo que apenas pt-BR esteja preenchido. Arquivo `en.json` existe como stub.
- Métricas são coletadas via ferramenta de analytics plugada externamente (scripts padrão
  no layout); nenhuma implementação de analytics é escopo desta feature.
- Os mockups visuais (espelho, mapa de carreira, exemplo de post) são conteúdo estático —
  não gerados dinamicamente pelo produto real nesta fase.
- O layout é projetado a partir de 375px (mobile) e expandido via breakpoints Tailwind
  (`md:`, `lg:`). Nunca o inverso.
