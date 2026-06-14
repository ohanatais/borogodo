# Feature Specification: Espelho Honesto

**Feature Branch**: `006-espelho-honesto`

**Created**: 2026-06-14

**Status**: Implemented (spec retroativa — regularização do PR #13)

**Input**: Regularização retroativa de feature já construída. O espelho honesto é a síntese de carreira do Borogodó, gerada por Claude Sonnet a partir de evidência real das entradas do usuário, com prompt anti-bajulação e um validador determinístico que garante objetivamente a qualidade da saída. Fontes de planejamento: `docs/mvp/005-first-mirror.md`, `docs/mvp/draft-firstmirror-prompt.md`, `docs/mvp/draft-taxonomia-niveis-criterios.md`.

> **Nota de regularização**: esta spec foi escrita *depois* da implementação (PR #13), para
> documentar o que foi construído e dar à feature a rede de segurança do speckit. As tasks em
> `tasks.md` refletem trabalho já concluído e estão marcadas como tal.

## Clarifications

### Session 2026-06-14 (decisões já tomadas na implementação)

- Q: Como garantir que o espelho não caia em bajulação genérica, já que a saída é de um LLM? → A: **Duas camadas.** (1) Prompt com princípios anti-clichê. (2) Um **validador determinístico** (`validateMirrorRuleset`) que roda sem IA e checa 9 regras objetivas sobre o JSON de saída (sem travessão, sem buzzword banida, sem antítese, closing sem "?", aberturas de card variadas, etc.).
- Q: O campo de fechamento continua sendo uma pergunta ("closing_question")? → A: **Não.** Virou `closing` (afirmação, sem "?"). O campo legado `closing_question` é explicitamente proibido pelo validador (assert 9).
- Q: O feedback "Nem tanto" regera o espelho na hora? → A: **Não no v1.** Salva o feedback; regeneração com feedback imediato está fora de escopo.
- Q: Quantas entradas o espelho considera? → A: As **20 mais recentes** do usuário (decisão herdada de 005).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Ler o próprio espelho honesto (Priority: P1)

A pessoa abre `/espelho` e vê a síntese de quem ela é profissionalmente: uma força principal, uma skill invisível (algo que ela demonstra mas nunca nomeou), um padrão de contexto onde brilha, e um fechamento honesto. Cada card cita evidência real das entradas (empresa, projeto, situação) — não elogio genérico.

**Why this priority**: É o artefato central do produto — o "aha!" que torna o Borogodó memorável. Sem um espelho que soe verdadeiro e específico, o produto vira mais um gerador de bajulação de LinkedIn.

**Independent Test**: Acessar `/espelho` com um usuário que tem entradas → ver os quatro blocos preenchidos com evidência citada, sem clichês, e o fechamento sem ponto de interrogação.

**Acceptance Scenarios**:

1. **Given** um usuário com entradas capturadas, **When** abre `/espelho`, **Then** vê intro personalizada (com o nome), força principal, skill invisível, padrão de contexto e fechamento, cada card com evidência concreta.
2. **Given** um espelho gerado, **When** o conteúdo é exibido, **Then** nenhum campo contém travessão, buzzword banida, gíria de elogio, marcador de skill (●○), nem padrão de antítese.
3. **Given** os três cards do espelho, **When** exibidos, **Then** as aberturas dos headlines variam (não começam todas com "Você").

### User Story 2 — Reagir ao espelho (feedback) (Priority: P2)

Ao ler o espelho, a pessoa diz se ressoou ("Sim, faz sentido") ou não ("Nem tanto"). O feedback é registrado para calibração futura, sem regenerar o espelho na hora.

**Why this priority**: Fecha o loop de confiança e gera sinal de qualidade, mas não é pré-requisito para o valor central (ler o espelho).

**Independent Test**: Em `/espelho`, clicar em "Sim, faz sentido" ou "Nem tanto" → o feedback é salvo e a UI confirma o registro.

**Acceptance Scenarios**:

1. **Given** um espelho exibido, **When** a pessoa clica "Sim, faz sentido", **Then** o feedback positivo é persistido.
2. **Given** um espelho exibido, **When** a pessoa clica "Nem tanto", **Then** o feedback é persistido e o espelho **não** é regenerado.

### User Story 3 — Garantia automática de qualidade do espelho (Priority: P1)

Antes de um espelho ser considerado válido, sua saída passa por um validador determinístico que aplica 9 regras objetivas. Violações são detectadas sem custo de IA, permitindo testar a qualidade contra fixtures de referência.

**Why this priority**: É o que torna "honesto" uma propriedade verificável e não uma esperança. Sem o validador, a qualidade depende do humor do LLM a cada chamada.

**Independent Test**: Rodar `validateMirrorRuleset` contra fixtures (boas e propositalmente ruins) → fixtures boas retornam zero violações; fixtures ruins retornam as violações esperadas por assert.

**Acceptance Scenarios**:

1. **Given** um espelho que respeita todas as regras, **When** validado, **Then** retorna lista vazia de violações.
2. **Given** um espelho com travessão / buzzword / antítese / "?" no closing, **When** validado, **Then** retorna a violação correspondente com `assert`, `field` e `message`.

### Edge Cases

- **Poucas entradas (< 2)**: o espelho é gerado mesmo assim; a intro reconhece que é um primeiro vislumbre.
- **Saída malformada do LLM (campo ausente)**: o validador é resiliente (trata campos ausentes como string vazia) e não quebra.
- **Convite de métrica repetido**: no máximo 1 convite de métrica em todo o espelho; o 2º+ é violação (assert 7).
- **Campo legado `closing_question`**: se presente, é violação explícita (assert 9) — deve ser `closing`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST gerar uma síntese de carreira com os blocos: intro, força principal, skill invisível, padrão de contexto, fechamento e temas de força (`strength_themes`).
- **FR-002**: Cada bloco de card (força/skill/padrão) MUST conter um headline e uma evidência ancorada em entradas reais do usuário.
- **FR-003**: O sistema MUST aplicar princípios anti-bajulação na geração: específico acima de genérico, usar as palavras da própria pessoa, citar evidência real, focar em forças no v1.
- **FR-004**: O sistema MUST validar a saída do espelho contra um conjunto determinístico de 9 regras objetivas, sem invocar IA, retornando violações estruturadas (assert, campo, mensagem).
- **FR-005**: As regras de validação MUST incluir: (1) sem travessão "—"; (2) sem buzzword banida; (3) sem marcador de skill ●○; (4) `closing` sem "?"; (5) sem padrão de antítese; (6) sem gíria de elogio; (7) no máximo 1 convite de métrica; (8) aberturas de card não todas iguais ("Você"); (9) `closing` presente e `closing_question` ausente.
- **FR-006**: Os usuários MUST conseguir ler o espelho em uma página dedicada (`/espelho`).
- **FR-007**: Os usuários MUST conseguir registrar feedback de ressonância ("Sim, faz sentido" / "Nem tanto").
- **FR-008**: O sistema MUST persistir o feedback sem regenerar o espelho no v1.
- **FR-009**: O sistema MUST considerar até as 20 entradas mais recentes do usuário ao gerar o espelho.
- **FR-010**: O conjunto de regras MUST ser coberto por testes unitários e por fixtures de qualidade (boas e ruins) representando perfis variados.

### Key Entities *(include if feature involves data)*

- **Mirror**: a síntese estruturada — `intro`, `primary_strength` {headline, evidence}, `invisible_skill` {headline, evidence}, `context_pattern` {headline, evidence}, `closing`, `strength_themes[]`.
- **RulesetViolation**: uma falha de regra detectada — `assert` (nº da regra), `field` (campo afetado), `message` (descrição).
- **Mirror Feedback**: a reação do usuário ao espelho — ressonância (sim/não) associada ao snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos espelhos gerados que passam pelo validador retornam zero violações antes de serem exibidos ao usuário.
- **SC-002**: O validador detecta corretamente cada uma das 9 classes de violação (cobertura de teste por assert).
- **SC-003**: Fixtures de qualidade boas retornam zero violações; fixtures ruins retornam exatamente as violações esperadas.
- **SC-004**: A pessoa consegue ler o espelho completo e registrar feedback em uma única tela, sem recarregar.
- **SC-005**: A validação de qualidade roda sem custo de IA (determinística), permitindo checagem em CI/testes.

## Assumptions

- Reusa a infraestrutura de geração existente (Claude Sonnet, `generateMirror`, `mirror_snapshots`) das features anteriores (004/005).
- O espelho considera as 20 entradas mais recentes do usuário (default herdado de 005).
- Feedback "Nem tanto" não regenera no v1; calibração com feedback é trabalho futuro.
- A lista de buzzwords/gírias/antíteses banidas é específica de pt-BR e pode evoluir conforme observação de saídas reais.

## Out of Scope

- Regenerar o espelho com feedback imediato ("Nem tanto" não regera no v1).
- Streaming da resposta do Sonnet.
- Comparação entre snapshots ("seu espelho mudou desde X").
- Compartilhamento do espelho.
- Espelho completo com lacunas/gaps detalhados.
