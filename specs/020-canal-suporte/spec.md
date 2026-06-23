# Feature Specification: Canal de contato/suporte (pré-launch)

**Feature Branch**: `020-canal-suporte`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "Canal de contato/suporte pré-launch: uma seção de contato acessível pelo rodapé da landing page e pela Central de Configurações, exibindo o e-mail admin@borogodo.ai como texto com botão 'copiar e-mail' (sem mailto: forçado), um link secundário para o LinkedIn da fundadora, e microcopy de SLA informal. Sem formulário. i18n pt-BR/en."

> Origem: decisão de produto registrada em [`docs/decisions/001-canal-de-suporte-contato.md`](../../docs/decisions/001-canal-de-suporte-contato.md) (issue #35, `pre-launch`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar como pedir ajuda e copiar o e-mail de suporte (Priority: P1)

Uma pessoa que está usando o Borogodó (ou avaliando na landing page) encontra um problema ou
tem uma dúvida e precisa falar com alguém. Ela procura um ponto de contato, encontra a seção de
contato, lê o e-mail de suporte e o copia com um clique para colar no app de e-mail que ela
mesma escolher — sem ser jogada para um aplicativo nativo que ela não usa.

**Why this priority**: É o coração da issue. Sem um e-mail copiável e acessível, não há canal —
e no pré-launch o canal é o instrumento que transforma churn invisível em aprendizado. Entrega
valor sozinho: já é um MVP funcional do suporte.

**Independent Test**: Acessar a seção de contato pelo rodapé da LP e por `/configuracoes`,
verificar que o e-mail `admin@borogodo.ai` aparece como texto legível, clicar em "copiar e-mail"
e confirmar que o endereço foi para a área de transferência com um feedback visual de confirmação.

**Acceptance Scenarios**:

1. **Given** um visitante na landing page, **When** ele rola até o rodapé, **Then** vê um ponto
   de contato/ajuda que leva à seção de contato.
2. **Given** um usuário logado em `/configuracoes`, **When** ele abre a área de contato/ajuda,
   **Then** vê o e-mail de suporte como texto e um botão "copiar e-mail".
3. **Given** a seção de contato visível, **When** o usuário clica em "copiar e-mail", **Then** o
   endereço `admin@borogodo.ai` é copiado para a área de transferência e um feedback visível
   confirma a cópia (ex.: "copiado!").
4. **Given** a seção de contato, **When** o usuário a visualiza, **Then** nenhum clique dispara
   automaticamente um aplicativo de e-mail nativo do sistema.

---

### User Story 2 - Falar pelo LinkedIn como canal secundário (Priority: P2)

A pessoa prefere um canal mais informal/social, ou quer dar um feedback aberto em vez de
reportar um bug. Ela encontra, na mesma seção, um link para o LinkedIn da fundadora, claramente
posicionado como canal de "papo/feedback" e não como canal primário de problema.

**Why this priority**: On-brand para um produto de carreira e build-in-public; baixa a barreira
de quem vive no LinkedIn. Secundário porque DM de não-conexão é limitada, então não pode ser o
canal de bug.

**Independent Test**: Verificar que existe um link de LinkedIn na seção de contato, rotulado
como canal secundário, que abre o perfil correto em uma nova aba.

**Acceptance Scenarios**:

1. **Given** a seção de contato, **When** o usuário a visualiza, **Then** vê um link para o
   LinkedIn da fundadora rotulado como canal de conversa/feedback (secundário ao e-mail).
2. **Given** o link de LinkedIn, **When** o usuário clica, **Then** o perfil abre em uma nova aba
   sem sair do Borogodó.

---

### User Story 3 - Entender o que esperar (expectativa de resposta) (Priority: P2)

A pessoa, antes de gastar energia escrevendo, entende quem responde e em quanto tempo, para não
ficar com a sensação de mandar mensagem para o vazio.

**Why this priority**: Um canal sem expectativa de resposta quebra mais confiança do que não ter
canal. A microcopy de SLA honesto é o que torna a promessa crível e protege o público early.

**Independent Test**: Verificar que a seção de contato exibe uma microcopy de SLA informal e
honesta (quem responde + prazo aproximado), em pt-BR e en.

**Acceptance Scenarios**:

1. **Given** a seção de contato, **When** o usuário a visualiza, **Then** vê uma frase curta de
   SLA informal (ex.: "Sou eu que respondo, em até 2 dias úteis").
2. **Given** o idioma ativo (pt-BR ou en), **When** a seção é exibida, **Then** todos os textos
   (rótulos, botão, SLA) aparecem traduzidos no idioma ativo.

---

### Edge Cases

- **Clipboard indisponível/negado** (navegador antigo ou permissão bloqueada): o e-mail continua
  legível como texto e selecionável manualmente; a falha de cópia não trava a tela e, idealmente,
  informa que a cópia não funcionou.
- **LinkedIn ainda não definido**: se a URL do perfil não estiver configurada, o link secundário
  é omitido em vez de apontar para um destino quebrado.
- **Acesso por leitor de tela/teclado**: o e-mail é texto real (não imagem) e o botão de copiar é
  acionável por teclado com rótulo acessível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST exibir uma seção de contato que apresenta o e-mail de suporte
  (`admin@borogodo.ai`) como texto legível e selecionável.
- **FR-002**: O sistema MUST oferecer um botão "copiar e-mail" que copia o endereço de suporte
  para a área de transferência e exibe um feedback de confirmação visível.
- **FR-003**: O sistema MUST NOT acionar automaticamente um aplicativo de e-mail nativo do
  dispositivo como gesto principal (sem `mailto:` forçado).
- **FR-004**: O sistema MUST disponibilizar acesso à seção de contato a partir do rodapé da
  landing page e a partir da Central de Configurações (`/configuracoes`).
- **FR-005**: O sistema MUST exibir um link secundário para o LinkedIn da fundadora, rotulado
  como canal de conversa/feedback, que abre em nova aba; e MUST omiti-lo se a URL não estiver
  configurada.
- **FR-006**: O sistema MUST NOT incluir formulário de contato.
- **FR-007**: O sistema MUST exibir uma microcopy de SLA informal e honesta (quem responde +
  prazo aproximado de resposta).
- **FR-008**: Todos os textos da seção (rótulos, botão, SLA, link) MUST ser internacionalizados
  em pt-BR e en.
- **FR-009**: A seção MUST degradar com segurança quando a cópia para a área de transferência
  não estiver disponível, mantendo o e-mail acessível como texto.

### Key Entities

Nenhuma entidade de dados nova. O canal é estático (e-mail e URL de LinkedIn como configuração de
conteúdo); não há persistência de mensagens nesta versão.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir de qualquer ponto de entrada (rodapé da LP ou Configurações), o usuário
  alcança o e-mail de suporte em no máximo 2 cliques.
- **SC-002**: 100% dos acessos à seção de contato exibem o e-mail como texto copiável sem
  disparar um app de e-mail nativo.
- **SC-003**: O canal é monitorado: contatos recebidos têm resposta dentro do SLA informal
  declarado (prazo divulgado na microcopy).
- **SC-004**: A seção é totalmente legível e operável nos dois idiomas (pt-BR e en) sem texto
  faltante ou não traduzido.

## Assumptions

- O e-mail `admin@borogodo.ai` está ativo e **redireciona para o e-mail pessoal da fundadora**
  (confirmado 2026-06-22) — canal monitorado, compatível com o SLA divulgado.
- A URL do perfil de LinkedIn é `https://www.linkedin.com/in/ohana-taís/` (confirmada
  2026-06-22). O link secundário só é omitido se a URL for removida da configuração de conteúdo.
- Persistência de mensagens, triagem, histórico de tickets e formulário com contexto técnico
  estão **fora de escopo** desta versão — caminho de evolução registrado no decision record caso
  o volume justifique.
- Reaproveita o sistema de i18n e os componentes de UI/design system já existentes no projeto.
