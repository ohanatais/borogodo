# Feature Specification: Preparação Conversacional

**Feature Branch**: `027-preparacao-conversacional`
**Created**: 2026-07-19
**Status**: Ready
**Input**: Transformar “Me preparar” numa conversa contextual por momento, com evidências reais, chat ampliado e preparação salva, sem histórico automático de chats.

## Process Decision

O passo formal `/speckit-clarify` foi dispensado porque as decisões de escopo, privacidade e UX foram
respondidas explicitamente pela fundadora na conversa que originou esta spec: chat efêmero, preparação
salva, evidências ricas, Autoavaliação em Usar, remoção de geração imediata e share somente opt-in.
Não restou marcador de clarificação e a checklist foi validada integralmente. O gate humano obrigatório
permanece no `shape.md` antes da implementação.

## User Scenarios & Testing

### User Story 1 - Preparar uma conversa com contexto real (Priority: P1)

Ao escolher Entrevista, Conversa de avaliação ou Pedir aumento, a pessoa entra diretamente num chat contextualizado. O Borogodó pede o mínimo necessário antes da primeira geração e usa os registros relevantes para ajudá-la a montar seu caso.

**Why this priority**: É o payoff episódico do produto e elimina a geração prematura “Quero algo pronto”, que consome tokens sem contexto suficiente.

**Independent Test**: Escolher cada momento abre o chat correto, mostra uma pergunta inicial sem chamada de IA e só consulta a IA depois da resposta da pessoa.

**Acceptance Scenarios**:

1. **Given** a tela Me preparar, **When** a pessoa escolhe Entrevista, **Then** o chat abre ampliado e pede a descrição da vaga ou o cargo desejado.
2. **Given** o chat de avaliação, **When** ele abre, **Then** pergunta o período e o objetivo da conversa.
3. **Given** o chat de aumento, **When** ele abre, **Then** pergunta o que mudou no escopo ou impacto desde a última conversa salarial.
4. **Given** qualquer momento, **When** a pessoa ainda não respondeu à pergunta inicial, **Then** nenhuma geração de IA acontece.
5. **Given** uma resposta contextual, **When** a IA responde, **Then** ela usa o momento, o contexto e o histórico profissional da pessoa.

---

### User Story 2 - Ver as evidências que sustentam a preparação (Priority: P1)

Depois de responder, a pessoa vê quais registros realmente sustentam a orientação, com impacto, métrica e provas anexadas. Ela pode abrir o registro ou uma prova sem sair da conversa.

**Why this priority**: Materializa a vantagem do Borogodó sobre um chat genérico e preserva a regra anti-invenção.

**Independent Test**: Uma resposta com referências exibe apenas as evidências declaradas como usadas, com links e miniaturas quando existirem.

**Acceptance Scenarios**:

1. **Given** registros semanticamente relevantes, **When** a IA usa três deles, **Then** somente esses três aparecem em “Evidências usadas”.
2. **Given** uma evidência com métrica, impacto, link ou imagem, **When** o bloco é exibido, **Then** esses elementos ficam identificáveis e acessíveis.
3. **Given** uma prova em link, **When** a pessoa a abre, **Then** o destino abre com segurança em nova aba.
4. **Given** uma imagem, **When** a pessoa a seleciona, **Then** vê a prova ampliada sob demanda, sem uma imagem gigante no fluxo.
5. **Given** uma evidência sem prova externa, **When** ela aparece, **Then** o produto não sugere que existe validação externa.

---

### User Story 3 - Salvar uma preparação escolhida (Priority: P2)

A pessoa pode salvar uma resposta útil como preparação para retomar o material depois. O chat completo não é salvo automaticamente.

**Why this priority**: Preserva o payoff sem criar um histórico de chat complexo no MVP.

**Independent Test**: Salvar uma resposta cria uma preparação com momento, texto e referências; fechar e reabrir o chat não recupera mensagens anteriores.

**Acceptance Scenarios**:

1. **Given** uma resposta concluída no modo preparação, **When** a pessoa escolhe “Salvar preparação”, **Then** o texto, o momento e os registros citados são guardados.
2. **Given** preparações salvas, **When** a pessoa volta a Me preparar, **Then** vê uma lista compacta e pode abrir ou excluir cada uma.
3. **Given** uma conversa não salva, **When** o chat é fechado e reiniciado, **Then** as mensagens anteriores não reaparecem.
4. **Given** uma preparação salva, **When** um registro é alterado, **Then** o vínculo continua apontando para o registro original sem duplicar sua prova.

---

### User Story 4 - Navegar por intenções coerentes (Priority: P2)

Autoavaliação aparece como destino próprio dentro de Usar e deixa de competir com os três momentos conversacionais.

**Independent Test**: Desktop e mobile exibem Gerar conteúdo, Me preparar, Escrever autoavaliação e Perguntar no grupo Usar; a grade Me preparar contém apenas três momentos.

**Acceptance Scenarios**:

1. **Given** a navegação desktop ou mobile, **When** a pessoa abre Usar, **Then** encontra Autoavaliação como destino próprio.
2. **Given** Me preparar, **When** a tela carrega, **Then** Autoavaliação não aparece entre os momentos.

---

### User Story 5 - Aprender com uso sem capturar conversas silenciosamente (Priority: P3)

O produto mede o funil de preparação sem registrar texto bruto. A pessoa pode compartilhar voluntariamente uma conversa específica para melhoria do produto.

**Independent Test**: Eventos estruturados não contêm mensagens; compartilhar uma conversa exige ação explícita e confirmação.

**Acceptance Scenarios**:

1. **Given** uma preparação, **When** a pessoa escolhe momento, envia contexto, abre evidência ou salva, **Then** o produto registra apenas o tipo do evento e metadados não textuais.
2. **Given** uma conversa, **When** a pessoa não autoriza compartilhamento, **Then** nenhum texto é persistido.
3. **Given** uma confirmação explícita, **When** a pessoa compartilha, **Then** uma cópia da conversa e o consentimento são armazenados para melhoria do produto.

### Edge Cases

- Sem registros ou Espelho: o chat informa a limitação e oferece Registrar, sem inventar evidências.
- Descrição de vaga maior que o limite: a interface informa o limite antes do envio.
- URL sem conteúdo colado: o MVP pede que a descrição seja colada; não promete leitura automática do link.
- Evidência removida entre resposta e salvamento: salvar mantém apenas referências ainda pertencentes ao usuário.
- Prova externa inválida: o card continua mostrando o registro e omite a prova quebrada.
- Falha ao salvar: a conversa local permanece aberta e a pessoa pode tentar novamente.
- Limite de IA: a pergunta contextual continua visível e a pausa é explicada sem apagar o texto digitado.

## Requirements

### Functional Requirements

- **FR-001**: O sistema MUST remover “Quero algo pronto” e abrir diretamente o chat ao escolher um momento.
- **FR-002**: O chat MUST iniciar cada momento com uma pergunta contextual determinística e gratuita.
- **FR-003**: Entrevista MUST solicitar cargo ou descrição da vaga; Avaliação MUST solicitar período e objetivo; Aumento MUST solicitar mudança de escopo/impacto e objetivo.
- **FR-004**: O sistema MUST aceitar conteúdo colado, mas MUST NOT afirmar que lê automaticamente uma URL no MVP.
- **FR-005**: O contexto de recuperação MUST combinar momento, resposta atual e contexto recente da conversa.
- **FR-006**: Cada resposta MUST declarar quais registros foram realmente usados; somente eles podem aparecer como evidências.
- **FR-007**: Evidências MUST incluir, quando disponíveis, título, empresa, data, métrica, impacto, links e imagens.
- **FR-008**: Provas visuais MUST carregar como miniaturas e ampliar sob demanda.
- **FR-009**: O chat MUST ocupar toda a tela no mobile e uma superfície de 720–800 px no desktop quando estiver em preparação; o chat livre mantém o tamanho compacto.
- **FR-010**: A pessoa MUST poder salvar uma resposta do assistente como preparação.
- **FR-011**: Uma preparação MUST registrar momento, texto salvo, registros citados e datas, sem armazenar automaticamente o restante da conversa.
- **FR-012**: A pessoa MUST poder listar, abrir e excluir suas preparações salvas.
- **FR-013**: Autoavaliação MUST ser destino próprio no grupo Usar em desktop e mobile e MUST sair da grade Me preparar.
- **FR-014**: Eventos analíticos MUST conter somente nomes de evento e propriedades estruturadas não textuais.
- **FR-015**: Texto de conversa MUST NOT ser persistido sem consentimento explícito e específico.
- **FR-016**: A pessoa MUST poder compartilhar voluntariamente uma conversa para melhoria, após ver uma explicação clara do que será enviado.
- **FR-017**: Todos os dados persistidos MUST ser privados por usuário; nenhum usuário pode acessar preparações, eventos ou compartilhamentos de outro.
- **FR-018**: Toda nova copy MUST existir em português e espelho estrutural em inglês.
- **FR-019**: A experiência MUST funcionar com teclado, leitor de tela e alvos móveis mínimos de 48 px.
- **FR-020**: O produto MUST NOT persistir histórico automático de chat nem oferecer retomada de conversa no MVP.

### Key Entities

- **Preparação**: artefato escolhido pelo usuário, ligado a um momento e às entradas citadas.
- **Evento de preparação**: ocorrência estruturada do funil, sem conteúdo textual da conversa.
- **Conversa compartilhada**: cópia voluntária e consentida de uma conversa específica para pesquisa de produto.
- **Evidência de chat**: projeção enriquecida de um registro e suas provas externas, exibida sem duplicar a fonte.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos momentos abrem a pergunta contextual em até uma interação, sem geração anterior.
- **SC-002**: 100% das evidências exibidas correspondem a registros declarados como usados pela resposta.
- **SC-003**: A pessoa consegue abrir uma prova ou registro em no máximo dois toques a partir da resposta.
- **SC-004**: A pessoa consegue salvar uma preparação em uma ação após receber a resposta.
- **SC-005**: Nenhuma conversa não compartilhada aparece no banco após fechar o chat.
- **SC-006**: 100% dos eventos analíticos passam por validação que rejeita campos de texto livre.
- **SC-007**: A jornada completa funciona em 375 px sem corte horizontal e em desktop sem painel excessivamente estreito.
- **SC-008**: Testes automatizados cobrem abertura por momento, evidências, salvamento, privacidade e navegação.

## Assumptions

- A pessoa está autenticada e os registros existentes continuam sendo a fonte canônica.
- O MVP aceita descrição da vaga colada; ingestão automática de URLs fica fora.
- Preparação salva é um artefato, não um histórico de conversa.
- Compartilhamento para pesquisa é opt-in e separado da experiência normal.
- Publicação, calendário, lembretes e retomada de chat ficam fora do escopo.
