# Feature Specification: Autenticação e Sessão

**Feature Branch**: `002-user-auth`

**Created**: 2026-06-06

**Status**: Draft

**Input**: Módulo de autenticação do Borogodó — ponto de entrada do produto. Google OAuth como caminho principal (um clique, sem senha), email + senha como fallback.

## Clarifications

### Session 2026-06-06

- Q: URL da tela unificada de autenticação (login + signup na mesma tela)? → A: `/login` — rota única que apresenta as duas opções; `/signup` eliminado como rota separada; middleware já redireciona para `/login`
- Q: Cadastro por e-mail e senha: coleta nome do usuário? → B: Sim — nome é campo obrigatório no formulário, para paridade com o perfil criado via Google

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cadastro via Google (Priority: P1)

Um profissional chega ao Borogodó pela primeira vez e quer criar uma conta com o mínimo de fricção. Na tela `/login`, clica em "Entrar com Google", autoriza o acesso, e é direcionado para o painel do produto — sem digitar nada.

**Why this priority**: Google OAuth elimina toda fricção de digitação. É o caminho preferencial — a maioria dos usuários usará este fluxo.

**Independent Test**: Criar uma conta Google nova e chegar ao `/painel`, sem nenhuma outra funcionalidade necessária.

**Acceptance Scenarios**:

1. **Given** o usuário está em `/login`, **When** clica em "Entrar com Google" e autoriza o acesso, **Then** uma conta é criada, um perfil é gerado com nome e avatar vindos do Google, e o usuário é redirecionado para `/painel`
2. **Given** o usuário já tem conta Google vinculada, **When** acessa `/login` e clica em "Entrar com Google", **Then** é reconhecido como usuário existente e redirecionado para `/painel`
3. **Given** o usuário cancela a autorização Google, **When** retorna ao produto, **Then** nenhuma conta é criada e o usuário permanece em `/login` sem erro bloqueante

---

### User Story 2 — Cadastro por e-mail e senha (Priority: P2)

Um profissional que prefere não usar login social preenche nome, e-mail e senha na tela `/login` para criar sua conta. Recebe um e-mail de confirmação e só então acessa o produto.

**Why this priority**: Fallback necessário para usuários que evitam OAuth social ou têm restrições corporativas.

**Independent Test**: Criar conta com nome, e-mail válido e senha, confirmar via link recebido, e chegar ao `/painel`.

**Acceptance Scenarios**:

1. **Given** o usuário está em `/login` com o modo "Criar conta" selecionado, **When** preenche nome, e-mail válido e senha com 8+ caracteres e confirma, **Then** recebe um e-mail de confirmação e vê a mensagem "Confira sua caixa de entrada — o link chega em segundos"
2. **Given** o usuário clica no link de confirmação, **When** o link é válido e não expirou, **Then** a conta é ativada e o usuário é redirecionado para `/painel`
3. **Given** o usuário tenta cadastrar com e-mail já existente, **When** confirma o formulário, **Then** vê inline "Esse e-mail já tem uma conta. Quer entrar?" — sem criar duplicata
4. **Given** o usuário preenche senha com menos de 8 caracteres, **When** tenta enviar o formulário, **Then** vê erro inline antes de qualquer requisição ao servidor
5. **Given** o usuário deixa o campo nome vazio, **When** tenta enviar o formulário, **Then** vê erro inline indicando que nome é obrigatório

---

### User Story 3 — Login em conta existente (Priority: P2)

Um usuário retornante acessa `/login`, escolhe o método com que se cadastrou, e é direcionado para o painel.

**Why this priority**: Acesso recorrente é o fluxo mais frequente após o cadastro.

**Independent Test**: Fazer login com conta existente e verificar chegada ao `/painel`.

**Acceptance Scenarios**:

1. **Given** o usuário tem conta existente, **When** faz login por qualquer método (Google ou e-mail+senha) via `/login`, **Then** é redirecionado para `/painel`
2. **Given** o usuário digita senha incorreta, **When** tenta fazer login, **Then** vê erro inline "Senha incorreta" sem revelar se o e-mail existe
3. **Given** o usuário tem e-mail cadastrado mas não confirmado, **When** tenta fazer login, **Then** vê mensagem específica pedindo que confirme o e-mail, com opção de reenvio

---

### User Story 4 — Painel vazio e logout (Priority: P1)

Após qualquer autenticação bem-sucedida, o usuário chega ao `/painel` — tela placeholder que representa o futuro dashboard — e tem a opção de encerrar a sessão.

**Why this priority**: Fecha o loop de autenticação de ponta a ponta. Sem isso o fluxo não é testável end-to-end.

**Independent Test**: Autenticar por qualquer método, verificar que `/painel` é acessível com botão de logout, e confirmar que logout redireciona para `/login`.

**Acceptance Scenarios**:

1. **Given** o usuário acaba de autenticar, **When** é redirecionado para `/painel`, **Then** vê a tela placeholder do dashboard com botão de logout visível
2. **Given** o usuário está no `/painel`, **When** clica em logout, **Then** a sessão é encerrada e o usuário é redirecionado para `/login`
3. **Given** o usuário faz logout, **When** tenta voltar para `/painel` via browser history, **Then** é redirecionado para `/login`

---

### User Story 5 — Proteção de rotas autenticadas (Priority: P1)

Um visitante não autenticado tenta acessar uma rota protegida e é redirecionado para `/login`. Um usuário autenticado que tenta acessar `/login` é redirecionado para `/painel`.

**Why this priority**: Segurança de acesso é requisito base — sem isso o produto está aberto.

**Independent Test**: Acessar `/painel` sem sessão ativa e verificar redirecionamento para `/login`.

**Acceptance Scenarios**:

1. **Given** o visitante não tem sessão ativa, **When** tenta acessar qualquer rota protegida, **Then** é redirecionado para `/login`
2. **Given** o usuário está autenticado, **When** tenta acessar `/login`, **Then** é redirecionado para `/painel`

---

### User Story 6 — Sincronização com CTAs da landing page (Priority: P1)

Todos os botões de "Criar conta" e "Entrar" presentes na landing page direcionam para `/login`, a tela unificada de autenticação.

**Why this priority**: A landing page é o principal ponto de entrada de novos usuários. CTAs desconectados da tela de auth quebram o funil de conversão.

**Independent Test**: Clicar em qualquer CTA de auth na landing page e verificar chegada em `/login` com ambas as opções disponíveis.

**Acceptance Scenarios**:

1. **Given** o visitante está na landing page, **When** clica em qualquer botão de "Criar conta" ou "Entrar", **Then** é direcionado para `/login`
2. **Given** o visitante chega em `/login` vindo da landing page, **When** a tela carrega, **Then** ambas as opções — entrar e criar conta — estão visíveis e acessíveis

---

### Edge Cases

- O que acontece se o provedor Google estiver indisponível no momento do login?
- O que acontece se o link de confirmação de e-mail expirar?
- O que acontece se o usuário fechar o browser antes de confirmar o e-mail?
- O que acontece em caso de erro de rede durante o submit do formulário?
- O que acontece se o perfil do usuário não for criado corretamente após o cadastro?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar login e cadastro na mesma tela (`/login`), com alternância entre os dois modos sem troca de rota
- **FR-002**: O sistema DEVE permitir que o usuário crie uma conta usando o provedor Google OAuth com um único clique, sem exigir preenchimento de formulário
- **FR-003**: O sistema DEVE permitir que o usuário crie uma conta com nome (obrigatório), e-mail (obrigatório) e senha (mínimo 8 caracteres)
- **FR-004**: O sistema DEVE exigir confirmação de e-mail antes de conceder acesso ao produto para contas criadas com e-mail e senha
- **FR-005**: O sistema DEVE criar automaticamente um perfil do usuário no momento do cadastro, populado conforme o provedor utilizado (ver tabela de campos abaixo)
- **FR-006**: O sistema DEVE redirecionar o usuário para `/painel` após qualquer autenticação bem-sucedida (cadastro ou login), independente do método utilizado
- **FR-007**: O sistema DEVE manter a sessão do usuário ativa por 30 dias sem exigir novo login
- **FR-008**: O sistema DEVE proteger todas as rotas não públicas, redirecionando visitantes não autenticados para `/login`
- **FR-009**: O sistema DEVE redirecionar usuários autenticados que tentam acessar `/login` para `/painel`, sem mostrar o formulário
- **FR-010**: O sistema DEVE exibir mensagens de erro inline e específicas para cada estado de falha: nome vazio, e-mail já cadastrado, senha incorreta, e-mail não confirmado, erro de rede
- **FR-011**: O sistema DEVE permitir reenvio do e-mail de confirmação ao usuário que relata não ter recebido
- **FR-012**: O sistema DEVE suportar múltiplos providers de autenticação por usuário na camada de dados, sem expor essa funcionalidade na UI neste módulo
- **FR-013**: O sistema DEVE apresentar em `/painel` uma tela placeholder com botão de logout funcional
- **FR-014**: O sistema DEVE encerrar a sessão do usuário ao clicar em logout e redirecioná-lo para `/login`
- **FR-015**: Todos os CTAs de autenticação presentes na landing page DEVEM direcionar para `/login`

### Campos por provedor

| Campo | Via Google | Via e-mail + senha |
|-------|------------|-------------------|
| nome | Automático (`full_name` do Google) | Obrigatório no formulário |
| e-mail | Automático (`email` do Google) | Obrigatório no formulário |
| avatar_url | Automático (`avatar_url` do Google) | Não coletado (null inicial) |
| senha | Não aplicável | Obrigatório (mín. 8 caracteres) |

### Key Entities

- **Usuário**: entidade central de identidade; identificado por ID único; possui nome, e-mail, avatar e estado de onboarding
- **Sessão**: período autenticado com duração de 30 dias; vinculada ao usuário e ao dispositivo/browser
- **Identidade**: vínculo entre um usuário e um provedor de autenticação (Google ou e-mail+senha); um usuário pode ter múltiplas identidades
- **Perfil**: extensão pública do usuário com dados complementares (nome display, avatar, flag de onboarding completado)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários que escolhem Google OAuth completam o cadastro em menos de 30 segundos, do clique inicial ao redirecionamento para `/painel`
- **SC-002**: A taxa de conclusão do cadastro (chegada ao `/painel`) via Google é superior à taxa via e-mail+senha, confirmando que Google é o caminho preferencial
- **SC-003**: 100% das rotas protegidas recusam acesso não autenticado, sem exception ou exposição de dados
- **SC-004**: Mensagens de erro aparecem em menos de 1 segundo após a ação do usuário, sem reload de página
- **SC-005**: Zero contas duplicadas são criadas para o mesmo e-mail, independente do método de cadastro
- **SC-006**: 100% dos CTAs de auth na landing page direcionam corretamente para `/login`

## Assumptions

- Usuários têm acesso a uma conta Google ativa ou a um cliente de e-mail para receber o link de confirmação
- Recuperação de senha não é necessária neste módulo — o provedor de autenticação oferece esse fluxo nativamente e pode ser ativado independentemente em momento futuro
- A interface de vinculação de múltiplos providers não será construída neste módulo, mas a arquitetura de dados deve suportá-la sem retrabalho
- O redirecionamento pós-auth para `/painel` é universal neste módulo; o módulo 003 (onboarding-linkedin) será responsável por interceptar usuários novos antes do acesso ao painel completo
- Dados de perfil vindos do Google (nome, avatar) são tratados como preferências iniciais — o usuário poderá editá-los em módulo futuro (painel)
- Funcionalidades de org/workspace e compliance corporativo estão fora do escopo deste módulo e de qualquer módulo MVP
- Rotas públicas são: `/`, `/login`, `/auth/callback`; todas as demais são protegidas
- O `/painel` neste módulo é uma tela vazia (placeholder); o dashboard completo será construído em módulo futuro
