# Feature Specification: Refino de Voz e Qualidade Contínua (+ mini-bio)

**Feature Branch**: `015-refino-voz`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada / batch)

**Input**: Terceiro e último elo da cadeia de Geração de Conteúdo (epic plan
`docs/conteudo-plano-de-acao.md`). Sobe a **barra de qualidade ao longo do tempo**: o loop "soa como
você?" afina o `voice_profile`, o golden set vira **guardrail de regressão no CI**, e a **mini-bio**
entra como terceiro formato no mesmo motor (sem nova superfície).

> **Depende da 013 e da 014**: usa o `voice_feedback` que se acumula em `drafts` (013/014), o motor
> `generateDraft` e o golden set (013). **É o último a rodar num batch.**

## Clarifications

### Session 2026-06-15 (kickoff do bloco)

- Q: Por que mini-bio fica na 015 e não na 013? → A: Para manter a primeira entrega focada na **barra
  de qualidade dos dois formatos âncora** (post + resumo). A mini-bio amplia formato sem nova
  superfície, então cabe no elo de qualidade contínua.
- Q: A mini-bio precisa de migration? → A: **Sim, pequena.** Estende o CHECK de `drafts.format` para
  aceitar `'mini_bio'` (migration `010`). Sem tabela nova; reusa `drafts` e o motor.
- Q: O CI já roda os testes? → A: **Sim** (`.github/workflows/ci.yml` roda `npm test` em todo PR para
  `main`/`develop`). O golden set da 013 já é gate por estar na suíte; a 015 o torna um **guardrail
  explícito e robusto** de regressão de voz (cobertura ampliada + step dedicado).
- Q: O refino de voz é automático ou pedido? → A: **Híbrido com controle.** O sistema **sugere**
  recalibrar quando há sinal acumulado ("vi que alguns rascunhos não soaram como você; quer afinar?");
  a pessoa confirma. Nunca muda a voz dela às costas dela.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Minha voz melhora conforme eu uso (Priority: P1)

Ao longo do tempo, a pessoa marca rascunhos como "soa" / "não soa" (013/014). Quando há sinal
acumulado suficiente, o produto **sugere** afinar a voz: a partir dos rascunhos que soaram (e dos que
não soaram), mais as amostras explícitas, recalibra o `inferred_summary`/`tone` do `voice_profile`.
A pessoa confirma a recalibração; as próximas gerações soam mais com ela. A voz nunca muda sem o
consentimento dela.

**Why this priority**: É a promessa de "qualidade ao longo do tempo" — o produto aprende a voz da
pessoa em vez de ficar estático. Diferencia de geradores que tratam voz como um campo fixo.

**Independent Test**: Com a conta QA, acumular feedback "não soa" em alguns rascunhos → confirmar que
surge a sugestão de recalibrar; aceitar → confirmar que o `voice_profile` evolui e que uma nova
geração reflete o ajuste; sem aceitar → a voz permanece igual.

**Acceptance Scenarios**:

1. **Given** feedback de voz acumulado em `drafts`, **When** o limiar de sinal é atingido, **Then** o
   produto sugere recalibrar a voz (sem mudar nada ainda).
2. **Given** a sugestão de recalibrar, **When** a pessoa aceita, **Then** o `voice_profile`
   (`inferred_summary`/`tone`) é atualizado a partir do feedback + amostras, com `updated_at` novo.
3. **Given** a recalibração aceita, **When** a pessoa gera de novo, **Then** o output reflete a voz
   ajustada e continua passando no ruleset anti-IA.
4. **Given** a pessoa **não** aceita, **When** ela gera de novo, **Then** a voz permanece a anterior.

### User Story 2 — Golden set como guardrail de regressão no CI (Priority: P1)

Qualquer mudança em prompt do bloco (post, resumo, mini-bio, voz) roda o **golden set** no CI. Se uma
mudança quebra uma regra anti-IA ou faz um caso parar de citar evidência real, o CI **bloqueia** o
merge. A barra de voz deixa de depender de vigilância manual e vira gate automático.

**Why this priority**: A 015 mexe em prompt (recalibração + mini-bio), e a 014/futuro também mexerão.
Sem o golden set como gate, regressão de voz passa despercebida até produção. É o que torna "qualidade
contínua" verdadeira.

**Independent Test**: Abrir um PR que degrade propositalmente um prompt (introduz travessão/antítese)
→ confirmar que o job do golden set **falha** e bloqueia; reverter → CI passa.

**Acceptance Scenarios**:

1. **Given** o golden set ampliado, **When** um prompt é alterado quebrando uma regra, **Then** o CI
   falha com a violação por `assert`.
2. **Given** um PR que não toca prompt, **When** o CI roda, **Then** o golden set passa sem custo de IA
   (asserções determinísticas sobre fixtures).
3. **Given** o `ci.yml`, **When** um PR é aberto, **Then** o golden set roda como parte do gate de
   qualidade (step dedicado ou dentro de `npm test`, mas **obrigatório**).

### User Story 3 — Mini-bio como terceiro formato (Priority: P2)

A pessoa gera uma **mini-bio** profissional (para topo de LinkedIn, assinatura, "sobre mim") a partir
do espelho/entradas, no mesmo motor, com schema e prompt próprios. Curta, factual, na voz dela, sem
clichê de bio ("apaixonado por tecnologia"). Amplia o valor sem exigir nova tela: reusa o
`GenerateSheet`/`DraftCard` e o hub.

**Why this priority**: Terceiro formato âncora pedido pela pesquisa, mas posterior à barra de
qualidade dos dois primeiros. Prova final de que a fundação (motor + schema por formato) escala.

**Independent Test**: Escolher "mini-bio" na geração → 2 versões curtas e factuais, sem clichê de bio,
passando no ruleset; persistir em `drafts` com `format='mini_bio'`.

**Acceptance Scenarios**:

1. **Given** o motor da 013, **When** o formato é `mini_bio`, **Then** usa `miniBioDraftSchema` e o
   prompt de mini-bio, e passa pela mesma validação (Zod + ruleset).
2. **Given** uma mini-bio gerada, **When** persistida, **Then** vira uma linha em `drafts` com
   `format='mini_bio'` (CHECK estendido pela migration `010`).
3. **Given** a saída, **When** validada, **Then** sem clichê de bio nem jargão, na voz da pessoa.

### Edge Cases

- **Sinal de voz insuficiente**: sem feedback acumulado bastante, a sugestão de recalibrar **não**
  aparece (não recalibra do nada).
- **Recalibração que pioraria a voz**: a recalibração nunca remove as amostras explícitas do usuário
  (âncora de verdade); o feedback ajusta o `inferred_summary`, não apaga o que a pessoa colou.
- **Golden set flaky**: as asserções de regra são determinísticas (sem IA); a parte que depende de
  saída de LLM usa fixtures mockadas, não chamadas reais no CI (sem custo, sem flakiness).
- **Mini-bio sem evidência suficiente**: gera curta e honesta, sem inventar; reconhece a base limitada.

## Requirements *(mandatory)*

### Functional Requirements

#### Refino de voz
- **FR-001**: O sistema MUST acumular o `voice_feedback` (`soa`/`nao_soa`) dos rascunhos (013/014) como
  sinal de calibração.
- **FR-002**: O sistema MUST **sugerir** recalibrar a voz quando o sinal acumulado atinge um limiar,
  sem alterar o `voice_profile` antes do consentimento.
- **FR-003**: Ao aceitar, o sistema MUST recalibrar `inferred_summary`/`tone` a partir do feedback +
  amostras, preservando as amostras explícitas; `updated_at` é atualizado.
- **FR-004**: As gerações seguintes MUST usar o `voice_profile` recalibrado; sem aceite, a voz
  permanece.

#### Guardrail de qualidade no CI
- **FR-005**: O golden set MUST ser ampliado para cobrir os três formatos (post, resumo, mini-bio) e as
  classes de regra anti-IA.
- **FR-006**: O CI (`.github/workflows/ci.yml`) MUST rodar o golden set como gate obrigatório em todo
  PR para `main`/`develop`, falhando o merge em regressão.
- **FR-007**: As asserções de regra MUST ser determinísticas (sem chamada de IA no CI); saídas de LLM
  usadas em fixtures são mockadas.

#### Mini-bio (terceiro formato)
- **FR-008**: O sistema MUST gerar **mini-bio** pelo mesmo `generateDraft`, com `miniBioDraftSchema` e
  prompt próprio, herdando a disciplina anti-IA + regra anti-clichê de bio.
- **FR-009**: A migration `010` MUST estender o CHECK de `drafts.format` para aceitar `'mini_bio'`.
- **FR-010**: A mini-bio MUST reusar `GenerateSheet`/`DraftCard`/hub (sem nova superfície).

#### Plataforma (constituição)
- **FR-011**: Strings novas MUST viver em `pt-BR.json` (`presenca.*`); `en.json` espelha. Zero
  hardcoded.
- **FR-012**: Recalibração e geração MUST manter RLS, contexto de IA só do próprio usuário, e saída
  validada antes de persistir.

### Key Entities *(include if feature involves data)*

- **VoiceProfile** (de 013, `profiles.voice_profile` JSONB): ganha evolução ao longo do tempo via
  recalibração; `samples` explícitas são preservadas.
- **Draft** (de 013, `drafts`): `format` passa a aceitar `'mini_bio'` (migration `010`); o
  `voice_feedback` acumulado é o sinal de recalibração.
- **GoldenCase** (fixture de teste): `{ seed, voiceProfile, format, expectedOutput }` — agora cobrindo
  os três formatos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Após acumular feedback "não soa" e aceitar a recalibração, uma nova geração reflete a voz
  ajustada (validável por comparação de `voice_profile` antes/depois e por avaliação manual).
- **SC-002**: Um PR que degrada um prompt **falha** no CI pelo golden set; um PR limpo passa.
- **SC-003**: O golden set roda no CI sem custo de IA e sem flakiness (determinístico + fixtures).
- **SC-004**: A mini-bio gera 2 versões factuais sem clichê de bio, persistidas com `format='mini_bio'`.
- **SC-005**: A voz nunca muda sem consentimento (testado: sem aceite → `voice_profile` inalterado).
- **SC-006**: Cobertura ≥ 80% na recalibração e no schema/prompt de mini-bio.

## Assumptions

- 013 e 014 implementadas antes (motor, `drafts`, `voice_feedback`, golden set, hub).
- O CI atual (`ci.yml`) roda `npm test` em PRs; o golden set vive na suíte de teste.
- O limiar de sinal para sugerir recalibração é um parâmetro ajustável (config), começando conservador.
- A migration `010` é a próxima livre após a `009` da 013 (confirmar na hora).

## Out of Scope

- Novas superfícies/telas (mini-bio reusa as da 013/014).
- Publicação/agendamento no LinkedIn.
- Recalibração automática sem consentimento.
- Formatos além de post, resumo de impacto e mini-bio.
- Avaliação de voz por LLM-judge no CI (asserções são determinísticas; LLM-judge é trabalho futuro, se
  necessário).
