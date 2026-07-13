# Feature Specification: Termos, Privacidade e Consentimento

**Feature Branch**: `024-termos-privacidade`

**Created**: 2026-07-11

**Status**: Draft

**Input**: User description: "Implementar as páginas de Termos de Uso e Política de Privacidade (a estrutura, não o conteúdo jurídico), os vínculos para elas em todos os locais necessários da plataforma, e a garantia — auditável sob a LGPD — de que o usuário leu e consentiu ao criar a conta."

## Contexto e enquadramento

Antes do launch, o Borogodó precisa de duas coisas hoje inexistentes: **documentos legais públicos**
(Termos de Uso e Política de Privacidade) e uma **prova auditável de aceite** no momento do
cadastro. Hoje não há nenhuma página legal, nenhum vínculo para elas e nenhum registro de aceite —
qualquer usuário cria conta sem que o produto guarde *que* aceitou, *quando* e *qual versão*.

Duas distinções de base legal (LGPD) guiam o desenho e evitam over-engineering:

- **Aceite dos Termos de Uso é um contrato** (base legal "execução de contrato", Art. 7, V da LGPD).
  Não exige consentimento explícito por checkbox — o ato de se cadastrar, com os termos visíveis e
  vinculados no ponto da ação, forma o aceite (padrão "sign-in-wrap"). O que torna esse aceite
  *válido* não é a caixa marcada, e sim o **registro server-side** do aceite (quem/quando/versão).
- **Comunicação de marketing exige consentimento** explícito, opt-in, desmarcado por padrão e
  **separado** do aceite dos termos — a LGPD veda "empacotar" consentimento.

**O conteúdo jurídico dos documentos NÃO faz parte desta feature.** O que se constrói aqui é a
estrutura editável das páginas (com texto placeholder), os vínculos e o mecanismo de aceite. A Ohana
preenche o texto real depois, sem tocar no código de layout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Páginas legais públicas e vínculos institucionais (Priority: P1)

Qualquer pessoa — visitante da landing page, usuário logado ou um crawler — consegue abrir os Termos
de Uso e a Política de Privacidade em endereços públicos, sem precisar estar logada, e chegar até eles
a partir dos lugares onde é esperado encontrá-los (rodapé do site e configurações da conta).

**Why this priority**: É o entregável literal do pedido ("as páginas") e a fundação de todo o resto —
o aceite no cadastro precisa apontar para essas páginas. Entrega valor sozinha: documentos legais
acessíveis e vinculados são um pré-requisito de launch por si só.

**Independent Test**: Acessar as duas URLs públicas sem sessão e confirmar que renderizam com o
layout do produto; a partir do rodapé e das configurações, clicar nos vínculos e chegar às páginas.

**Acceptance Scenarios**:

1. **Given** um visitante não autenticado, **When** acessa a URL pública dos Termos de Uso, **Then** a
   página carrega com o conteúdo (placeholder por ora), o cabeçalho/rodapé do produto e a versão vigente
   visível, sem exigir login.
2. **Given** um visitante no rodapé da landing page, **When** procura por links legais, **Then** encontra
   e usa os vínculos para Termos de Uso e Política de Privacidade.
3. **Given** um usuário logado nas configurações da conta, **When** procura informação legal, **Then**
   encontra os vínculos para as duas páginas.
4. **Given** um mecanismo de busca ou agente de IA rastreando o site, **When** acessa as páginas legais,
   **Then** o conteúdo é servido de forma indexável (renderização no servidor).

---

### User Story 2 - Aceite dos termos registrado de forma auditável no cadastro (Priority: P1)

Ao criar uma conta — por Google ou por e-mail/senha — o usuário vê, ao lado dos botões de cadastro, um
aviso claro de que ao continuar concorda com os Termos de Uso e a Política de Privacidade, com links para
ambos. Ao concluir o cadastro, o sistema registra de forma permanente que aquela conta aceitou a versão
vigente dos termos, com data e hora. Esse registro vale igualmente para quem entrou por Google e para
quem entrou por e-mail/senha.

**Why this priority**: É o núcleo jurídico da feature. Sem o registro server-side, o aviso é decorativo
e não protege sob LGPD. É o que responde ao pedido "garantir que o user leu e consentiu quando criou
conta".

**Independent Test**: Criar uma conta nova por cada método (Google e e-mail/senha) e verificar que, após
a criação, existe um registro de aceite associado àquela conta contendo data/hora e a versão vigente.

**Acceptance Scenarios**:

1. **Given** a tela de cadastro, **When** o usuário a visualiza, **Then** vê o aviso de aceite ("Ao
   continuar, você concorda com os Termos de Uso e a Política de Privacidade") com links funcionais para
   as duas páginas, próximo aos dois métodos de cadastro, e **sem** caixa de seleção obrigatória.
2. **Given** um novo usuário que se cadastra por e-mail/senha, **When** a conta é criada, **Then** o
   sistema grava a data/hora do aceite e a versão vigente dos termos para aquela conta.
3. **Given** um novo usuário que se cadastra por Google, **When** a conta é criada, **Then** o sistema
   grava a data/hora do aceite e a versão vigente dos termos — sem depender de estado que se perca no
   redirecionamento do provedor.
4. **Given** um usuário que apenas faz login em uma conta já existente que já tem aceite registrado,
   **When** entra, **Then** o registro de aceite existente não é sobrescrito nem duplicado.

---

### User Story 3 - Gate de re-consentimento para contas sem aceite ou versão desatualizada (Priority: P2)

Contas criadas antes desta feature (ou qualquer conta, quando a versão dos termos mudar) não têm o
aceite da versão vigente registrado. No próximo acesso, antes de usar o produto, essas pessoas passam por
um passo que apresenta os termos e registra o aceite da versão vigente. Ninguém é bloqueado
permanentemente nem tem a conta apagada — apenas precisa passar pelo aceite uma vez.

**Why this priority**: Cobre a base de usuários atual (evita um buraco de conformidade para quem já
existe) e cria o mecanismo reutilizável para quando os termos forem atualizados. Depende do registro
de aceite (US2) já existir.

**Independent Test**: Simular uma conta sem aceite registrado (ou com versão antiga), acessar a área
logada e confirmar que o produto exige o aceite antes de liberar o uso, e que após o aceite o registro
fica com a versão vigente.

**Acceptance Scenarios**:

1. **Given** um usuário logado cuja conta não tem aceite da versão vigente, **When** tenta acessar
   qualquer área interna do produto, **Then** é direcionado a um passo de aceite antes de prosseguir.
2. **Given** esse usuário no passo de aceite, **When** confirma o aceite, **Then** o sistema grava a
   versão vigente com data/hora e libera o acesso normal.
3. **Given** um usuário cuja conta já tem o aceite da versão vigente, **When** navega no produto, **Then**
   não vê o passo de aceite.
4. **Given** que a versão vigente dos termos é atualizada, **When** um usuário com aceite de uma versão
   anterior acessa o produto, **Then** passa novamente pelo aceite da nova versão.

---

### User Story 4 - Consentimento de marketing separado e opt-in (Priority: P3)

Separadamente do aceite dos termos, o usuário pode optar por receber comunicações de marketing. A
preferência começa **desligada por padrão para toda conta** (nunca pré-marcada). No cadastro por
**e-mail/senha**, uma caixa desmarcada no próprio formulário permite optar; esse valor é persistido
silenciosamente quando a conta é criada. No cadastro por **Google** não há pergunta de marketing no fluxo
(nem no cadastro, nem no onboarding) — a preferência permanece desligada e o usuário a liga, se quiser,
nas **configurações**. Em ambos os casos, a preferência é sempre ligável/desligável pelo próprio usuário
nas configurações.

**Why this priority**: É a única parte que a LGPD exige como consentimento explícito, livre e revogável —
por isso jamais pode vir pré-ativada ou empacotada com o aceite dos termos. É independente das demais e
pode ser entregue por último sem bloquear o launch legal.

**Independent Test**: Confirmar que a preferência de marketing começa desligada em qualquer caminho de
cadastro, que o único opt-in no cadastro é o checkbox desmarcado do formulário de e-mail/senha, que o
usuário via Google fica desligado até ligar nas configurações, que ligá-la/desligá-la nas configurações
persiste a escolha, e que ela nunca aparece empacotada junto do aceite dos termos.

**Acceptance Scenarios**:

1. **Given** um novo usuário por e-mail/senha, **When** vê o formulário de cadastro, **Then** encontra uma
   caixa de marketing **desmarcada** e separada do aviso de aceite dos termos; a conta só recebe a
   preferência ligada se ele marcá-la explicitamente.
2. **Given** um novo usuário por Google, **When** passa pelo cadastro e pelo onboarding, **Then** não vê
   nenhuma pergunta de marketing; a preferência fica desligada até que ele a ligue nas configurações.
3. **Given** um usuário nas configurações, **When** vê a opção de comunicações de marketing, **Then** ela
   reflete a escolha atual da conta (desligada por padrão) e é separada de qualquer aceite de termos.
4. **Given** um usuário que liga a opção de marketing, **When** salva, **Then** a preferência fica
   registrada para a conta.
5. **Given** um usuário que havia ligado a opção, **When** a desliga, **Then** a revogação é registrada e
   respeitada.

---

### Edge Cases

- **Cadastro por e-mail/senha com confirmação pendente**: o aceite deve ser registrado no momento em que
  a conta/perfil efetivamente passa a existir, de forma consistente com o fluxo de confirmação por e-mail
  já existente — sem ficar "preso" numa etapa intermediária.
- **Links legais quebrados**: se uma das páginas legais estiver indisponível, o aviso de aceite ainda deve
  deixar claro a quais documentos o usuário está concordando (o vínculo não pode apontar para o vazio).
- **Conta sem registro de aceite que nunca reentra**: aceitável — o gate de re-consentimento age no
  próximo acesso; não há ação retroativa sobre contas inativas.
- **Troca de idioma**: as páginas legais e o aviso de aceite devem respeitar o idioma ativo, com fallback
  para pt-BR quando a tradução não existir (padrão atual do projeto).
- **Bloqueio duro no gate**: o passo de re-consentimento não pode criar um beco sem saída — o usuário
  sempre consegue ler os termos e concluir o aceite a partir dele.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar duas páginas legais públicas (Termos de Uso e Política de
  Privacidade) acessíveis sem autenticação, renderizadas no servidor para serem indexáveis, em URLs
  dedicadas, legíveis e estáveis em português — `/termos-de-uso` e `/politica-de-privacidade` (ex.:
  `borogodo.ai/politica-de-privacidade`).
- **FR-002**: O conteúdo das páginas legais MUST vir de uma fonte editável separada do código de layout,
  de modo que o texto real possa ser preenchido depois sem alterar a estrutura da página; nesta feature o
  conteúdo é placeholder.
- **FR-003**: O sistema MUST exibir, em cada página legal, a versão vigente do documento.
- **FR-004**: O sistema MUST manter a versão vigente dos termos e as URLs das páginas legais como fonte
  única de verdade, reutilizável por todas as superfícies (aviso de cadastro, rodapé, configurações,
  gate de re-consentimento).
- **FR-005**: O sistema MUST exibir vínculos para as duas páginas legais no rodapé institucional e na
  área de configurações da conta.
- **FR-006**: A tela de cadastro MUST exibir um aviso de aceite ("Ao continuar, você concorda com os
  Termos de Uso e a Política de Privacidade"), com links para as duas páginas, próximo aos dois métodos de
  cadastro (Google e e-mail/senha), **sem** caixa de seleção obrigatória.
- **FR-007**: No momento da criação da conta, o sistema MUST registrar de forma permanente e no servidor o
  aceite dos termos daquela conta, contendo a data/hora do aceite e a versão vigente, de forma idêntica
  para cadastro por Google e por e-mail/senha.
- **FR-008**: O registro de aceite MUST ser resiliente ao fluxo de OAuth (não pode depender de estado de
  interface que se perca no redirecionamento do provedor).
- **FR-009**: O sistema MUST NOT sobrescrever nem duplicar o registro de aceite quando um usuário com
  aceite já registrado apenas faz login.
- **FR-010**: O sistema MUST impedir o uso das áreas internas do produto por contas sem aceite da versão
  vigente, direcionando-as a um passo de aceite antes de liberar o acesso (gate de re-consentimento).
- **FR-011**: Ao concluir o aceite no gate, o sistema MUST gravar a versão vigente com data/hora e liberar
  o acesso normal, sem repetir o passo em acessos seguintes enquanto a versão não mudar.
- **FR-012**: Quando a versão vigente dos termos for atualizada, o sistema MUST exigir novo aceite de
  usuários cujo aceite registrado seja de versão anterior.
- **FR-013**: O sistema MUST oferecer um consentimento de marketing separado, explícito, **desligado por
  padrão para toda conta** e nunca pré-marcado, nunca empacotado com o aceite dos termos, e revogável pelo
  próprio usuário nas configurações. O único opt-in no cadastro MUST ser uma caixa desmarcada no
  formulário de e-mail/senha (persistida ao criar a conta); o cadastro por Google NÃO MUST exibir pergunta
  de marketing (nem no cadastro, nem no onboarding), permanecendo desligado até o usuário ligar nas
  configurações.
- **FR-014**: A área de configurações MUST informar ao usuário qual versão dos termos ele aceitou e em que
  data.
- **FR-015**: Todos os textos visíveis (páginas, aviso de aceite, gate, configurações) MUST estar sob o
  sistema de internacionalização do projeto, com fallback para pt-BR.

### Key Entities *(include if feature involves data)*

- **Registro de aceite de termos**: representa o consentimento contratual de uma conta. Atributos
  essenciais: a conta a que pertence, a data/hora do aceite e a versão dos termos aceita. É o artefato
  auditável que prova o aceite.
- **Preferência de marketing**: representa a escolha (opt-in) da conta em receber comunicações de
  marketing, revogável. Distinta e desacoplada do registro de aceite de termos.
- **Versão vigente da política**: identificador da versão atual dos documentos legais, fonte única de
  verdade usada para carimbar aceites e para disparar re-consentimento quando muda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das contas novas criadas após o launch desta feature possuem um registro de aceite com
  data/hora e versão, independentemente do método de cadastro.
- **SC-002**: As duas páginas legais são acessíveis publicamente sem login e alcançáveis em no máximo um
  clique a partir do rodapé e das configurações.
- **SC-003**: 100% das contas existentes sem aceite registrado passam pelo gate de re-consentimento no
  próximo acesso à área interna, antes de usar o produto.
- **SC-004**: Quando a versão vigente dos termos muda, 100% dos usuários com aceite de versão anterior são
  levados a re-aceitar no acesso seguinte.
- **SC-005**: A preferência de marketing começa desligada para 100% das contas e nunca aparece empacotada
  com o aceite dos termos.
- **SC-006**: O texto jurídico real pode ser substituído por uma pessoa não técnica sem alterar o código
  de layout das páginas.

## Assumptions

- O texto jurídico definitivo dos Termos de Uso e da Política de Privacidade será redigido pela Ohana em
  momento posterior; esta feature entrega estrutura com conteúdo placeholder.
- O produto está em fase pré-launch, com poucos ou nenhum usuário real além de contas de teste — por isso
  o tratamento das contas existentes é feito por um gate no próximo acesso, e não por uma migração de
  dados retroativa.
- O aceite dos termos apoia-se na base legal de "execução de contrato" (padrão sign-in-wrap), não em
  consentimento por checkbox; apenas o marketing usa consentimento explícito opt-in.
- O consentimento de marketing começa desligado por padrão em toda conta. O único opt-in no cadastro é o
  checkbox desmarcado do formulário de e-mail/senha (persistido silenciosamente ao criar a conta). O
  cadastro por Google não pergunta marketing em lugar nenhum do fluxo; o usuário liga nas configurações se
  quiser. Sempre editável nas configurações. (Decisão da Ohana: manter o onboarding livre de consentimento
  de marketing para preservar o momento WOW/AHA.)
- Reutiliza-se a autenticação, o onboarding, o rodapé, as configurações e o sistema de i18n já
  existentes no produto — nenhuma dessas fundações é reconstruída.
- O mecanismo de gate de re-consentimento pode se apoiar no mesmo ponto de controle de acesso à área
  interna já previsto (o redirecionamento de onboarding especificado na feature 009, ainda não
  implementado).

## Out of Scope *(não-objetivos)*

- O conteúdo jurídico dos documentos (redação dos termos e da política).
- Banner e gestão de cookies / consentimento de rastreamento.
- Fluxos de direitos do titular sob a LGPD (exclusão de conta, portabilidade, acesso aos dados) — podem
  virar feature futura.
- Histórico completo de versões aceitas por usuário (guarda-se a versão vigente aceita; um audit trail de
  múltiplas versões por conta não está no escopo).
