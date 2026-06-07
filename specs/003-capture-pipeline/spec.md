# Feature Specification: Pipeline de Captura (Extração + Reflexo)

**Feature Branch**: `003-capture-pipeline`

**Created**: 2026-06-07

**Status**: Draft

**Input**: Espinha dorsal de dados do Borogodó. Transforma input bruto (texto ou arquivo) em entradas estruturadas no esquema do produto e devolve um reflexo (diagnóstico curto) na hora. Fonte: `docs/mvp/004-extraction-pipeline.md` (+ schema de `entries` de `docs/mvp/003-onboarding-linkedin.md`).

## Clarifications

### Session 2026-06-07

- Q: Quais modalidades de captura entram no MVP? → A: **Texto e arquivo (PDF)**. Áudio (Whisper) e imagem (visão Haiku) ficam fora do MVP, mas o type union `CaptureInput` e o `switch` da rota preservam os ramos `audio`/`image` retornando 501 — costuras prontas para ativação futura sem refatoração.
- Q: O `triggerProactiveInsight` da rota pertence a esta feature? → A: Não. Aqui ele é um **stub no-op documentado** (a tabela `proactive_insights` nasce na feature 005-panel). A rota já o chama de forma defensiva (com log de erro, nunca catch vazio).
- Q: O `maybeRegenerateMirror` pertence a esta feature? → A: Não. É costura para a feature 004-mirror; em 003 fica como stub no-op. A tabela `mirror_snapshots` ainda não existe nesta feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Captura de texto vira entrada estruturada + reflexo (Priority: P1)

Uma profissional digita um momento de trabalho em linguagem livre ("fechei a migração do banco no prazo, foi tenso mas deu certo"). O sistema transforma isso em uma entrada estruturada (o que fiz, decisão, impacto, tags, data) e devolve um reflexo curto e caloroso na voz dela, com 2–4 pílulas e **um** movimento (pergunta, afirmação ou sugestão). A entrada é salva na hora — sem gate de confirmação.

**Why this priority**: É o gesto central do produto e o caminho mais usado. Sem ele, nada do painel ou do espelho tem dado para trabalhar. Captura sem fricção é o princípio nº 1 do produto.

**Independent Test**: Enviar um texto para `/api/capture` autenticado e verificar que (a) uma entrada é persistida em `entries` com `user_id` correto e campos preenchidos, (b) a resposta inclui um `reflection` válido (summary + 1–4 pills + 1 move).

**Acceptance Scenarios**:

1. **Given** usuária autenticada, **When** envia `{ kind: 'text', content: 'texto de trabalho' }`, **Then** uma entrada é salva e a resposta traz `{ entries, reflection }` com reflexo na voz dela
2. **Given** texto com menos de 3 caracteres, **When** envia, **Then** recebe 400 "Conta um pouco mais — não consegui captar" **antes** de qualquer chamada de IA
3. **Given** requisição sem sessão válida, **When** chama `/api/capture`, **Then** recebe 401 e nada é salvo
4. **Given** o Haiku retorna algo que não passa na validação Zod, **When** processa, **Then** retorna erro e **nada parcial** é persistido

---

### User Story 2 — Import de arquivo (PDF) vira múltiplas entradas (Priority: P2)

A pessoa anexa um arquivo (ex.: PDF de currículo/LinkedIn). O sistema extrai o texto, gera uma ou mais entradas estruturadas (extração pura, sem reflexo individual) e as persiste. Esse é o motor reusado pelo onboarding (feature 006).

**Why this priority**: Uma ação gera muitas entradas ricas — o caminho de maior densidade de dado. Habilita o onboarding LinkedIn.

**Independent Test**: Chamar `extractFromLinkedIn(pdfText)` com um texto de perfil e verificar que retorna entradas estruturadas válidas (Zod), até o limite configurado.

**Acceptance Scenarios**:

1. **Given** um PDF válido, **When** o texto é extraído e passado ao extrator, **Then** retornam 1..N entradas estruturadas com `source` e `tags`
2. **Given** arquivo que não é PDF, **When** validado na borda, **Then** rejeita com mensagem clara antes de processar
3. **Given** PDF acima de 10 MB, **When** validado, **Then** rejeita com "Arquivo muito grande (máx 10 MB)"

---

### User Story 3 — Enriquecimento de entrada sem nova chamada de IA (Priority: P3)

Após o reflexo, se houve um movimento do tipo "pergunta" (ex.: "tem um número de impacto?"), a pessoa responde e a resposta vira o valor de um campo da entrada (ex.: `metric`) — sem nova chamada de LLM, instantâneo e barato.

**Why this priority**: Enriquece o dado quando a pessoa quer, mantendo a captura barata. Opcional por design — a entrada já vale sem a resposta.

**Independent Test**: `PATCH /api/entries/:id/enrich` com `{ answer, field }` atualiza o campo da entrada do próprio usuário e rejeita entradas de outros usuários.

**Acceptance Scenarios**:

1. **Given** uma entrada do usuário e um campo válido, **When** envia `{ answer, field }`, **Then** o campo é atualizado e nenhuma chamada de IA ocorre
2. **Given** uma entrada de **outro** usuário, **When** tenta enriquecer, **Then** RLS bloqueia (nada é alterado)
3. **Given** um `field` fora do conjunto permitido, **When** envia, **Then** rejeita com 400

---

### Edge Cases

- Haiku não retorna JSON válido → erro → o cliente (CaptureConversation) oferece retry; entrada **não** é salva.
- Entrada falha na validação Zod → erro; no MVP não salva parcial.
- Ramo `audio`/`image` chamado → retorna **501 Not Implemented** com microcopy "em breve" (costura para o futuro, não erro de produto).
- Contexto de captura vazio (usuário sem entradas/espelho) → reflexo funciona com contexto mínimo ("nenhuma ainda").
- Múltiplas entradas extraídas de um único input → todas validadas; falha de uma invalida o lote (MVP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor `POST /api/capture` que aceita `kind ∈ {text, file}` e devolve `{ entries, reflection }`.
- **FR-002**: O sistema MUST verificar autenticação (`auth.getUser()`) como **primeira** operação da rota, retornando 401 caso ausente.
- **FR-003**: O sistema MUST validar o input na borda: texto com ≥ 3 caracteres; arquivo `application/pdf` ≤ 10 MB.
- **FR-004**: O sistema MUST normalizar qualquer modalidade suportada em `(rawText, source)` antes de chamar a IA.
- **FR-005**: O sistema MUST usar `claude-haiku-4-5` para extração + reflexo em **uma** chamada (`captureAndReflect`).
- **FR-006**: O sistema MUST montar um contexto compacto (`strengthThemes`, `recentSummaries`, `entryCount`) por usuário antes da chamada Haiku.
- **FR-007**: O sistema MUST validar toda saída do LLM com Zod **antes** de persistir; saída inválida não gera persistência parcial.
- **FR-008**: O sistema MUST persistir entradas em `entries` sempre com `user_id` do usuário autenticado.
- **FR-009**: O reflexo MUST conter `summary`, 1–4 `pills` e exatamente **um** `move` (`question|affirmation|suggestion`), com `field` quando `type=question`.
- **FR-010**: O sistema MUST oferecer `extractFromLinkedIn(pdfText)` (extração pura, sem reflexo) com limite de entradas configurável (máx 20).
- **FR-011**: O sistema MUST expor `PATCH /api/entries/:id/enrich` que atualiza um campo (`metric|impact|decision|learning`) sem chamada de IA, sujeito a RLS.
- **FR-012**: O sistema MUST preservar a voz da pessoa em `what_i_did` (sem reescrita corporativa) e nunca inventar dados ausentes — garantido via prompt.
- **FR-013**: O sistema MUST manter o system prompt estável por request para aproveitar prompt caching; o contexto variável é injetado de forma isolada.
- **FR-014**: A rota MUST disparar `triggerProactiveInsight(userId)` e `maybeRegenerateMirror(userId, total)` como jobs assíncronos não-bloqueantes, com tratamento de erro que **loga** (nunca catch vazio). Em 003 ambos são stubs no-op.
- **FR-015**: Os ramos `audio` e `image` MUST permanecer no type union e no `switch` da rota, retornando 501 com microcopy "em breve".
- **FR-016**: Nenhum dado de usuário MUST aparecer em logs; nenhum ID interno de banco MUST vazar em respostas além do `id` da entrada necessário ao enrich.

### Key Entities

- **Entry** (`entries`): um momento de trabalho estruturado — `what_i_did` (voz preservada), `decision`, `learning`, `impact`, `metric`, `entry_date`, `tags[]`, `source`, `raw_content`, campos de cargo (`company`, `role_title`, `role_start`, `role_end`), `user_id`, timestamps.
- **Reflection** (efêmero, não persistido): `summary`, `pills[]`, `move{type,text,field?}`.
- **CaptureContext** (efêmero): `strengthThemes[]`, `recentSummaries[]`, `entryCount`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma captura de texto curta retorna entrada salva + reflexo válido em ≤ 3 s (p95) sob carga normal.
- **SC-002**: 100% das saídas persistidas passaram por validação Zod (zero persistência sem validação).
- **SC-003**: Custo por captura de texto ≤ US$ 0,0005 (uma chamada Haiku).
- **SC-004**: Cobertura de testes ≥ 80% nos módulos de extração, validação e rota.
- **SC-005**: Zero vazamento de dados entre usuários — testado por cenário multiusuário com RLS.

## Assumptions

- O módulo de auth (002) já provê `createServerClient`, sessão e `profiles`.
- `ANTHROPIC_API_KEY` está disponível server-side; nunca exposta ao client.
- A captura de texto/arquivo do MVP cobre as personas; áudio/imagem são extensões futuras já costuradas.
- `transcribeAudio` e o bloco de visão ficam como stubs documentados em `src/lib/ai/`.
- A tabela `entries` é criada nesta feature e reusada por 004/005/006.
- Testes são obrigatórios (constituição, TDD) — incluídos no `tasks.md`.
