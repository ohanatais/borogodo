# Feature Specification: Motor de Voz + Geração (Presença)

**Feature Branch**: `013-motor-de-voz`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada)

**Input**: Primeiro elo da cadeia de Geração de Conteúdo (verbo **Usar** da espinha), conforme
o epic plan `docs/conteudo-plano-de-acao.md`. Entrega o motor compartilhado de voz e geração,
mais os dois formatos âncora: **post de LinkedIn** e **resumo de impacto**, gerados a partir de
evidência real (entrada ou tema do espelho), na voz da pessoa, herdando integralmente a
disciplina anti-IA do `MIRROR_SYSTEM_PROMPT`.

> **Nota de escopo**: esta feature trava a **fundação compartilhada** do bloco (tabela `drafts`,
> `voice_profile` JSONB em `profiles`, módulo `src/lib/ai/content/`, golden set) que os elos 014
> (Presença/hub) e 015 (refino de voz) vão reusar. Os pontos de entrada aqui são **mínimos** (botão
> "Usar" numa entrada e num tema do espelho); o hub `/presenca`, a lista de rascunhos persistidos e
> o nudge proativo são da 014.

## Clarifications

### Session 2026-06-15 (kickoff do bloco, antes da 013)

- Q: Label do item de nav para a rota de conteúdo? → A: **"Presença"** (termo de marca). A rota
  `/presenca` e o item de nav entram na **014**, não aqui; a 013 só adiciona os botões "Usar".
- Q: Onde guardar o perfil de voz? → A: **JSONB `voice_profile` em `profiles`** (um registro por
  usuário, comporta-se como blob de settings), não tabela nova.
- Q: Estado da fundação após a 012-chat mergear (PR #21)? → A: Re-validado em 15/jun/2026 — próxima
  migration livre é **009**; `drafts` e `voice_profile` ainda não existem; nav segue com 3 itens
  (sem conflito ao adicionar `/presenca` depois); padrão de módulo de IA confirmado em
  `src/lib/ai/chat/` (a 013 espelha em `src/lib/ai/content/`).
- Q: Qual modelo gera o conteúdo? → A: **`claude-sonnet-4-6`** (constituição III: Sonnet para
  espelho e geração de conteúdo). Sem novo provider; usa `src/lib/ai/client.ts`.
- Q: Quantos rascunhos por geração? → A: **2 variações** por formato, para a pessoa escolher e
  editar, nunca uma única saída imposta.
- Q: A calibração de voz é obrigatória antes de gerar? → A: **Não.** O motor sempre infere uma base
  da voz a partir do `raw_content` das capturas; as 1–2 amostras explícitas são um **refino
  opcional**. Nunca há uma página em branco bloqueando a geração.
- Q: O "soa como você?" regera o rascunho na hora? → A: **Não no v1.** O feedback é persistido para
  calibração; o loop que afina o `voice_profile` ao longo do tempo é da **015**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Gerar um post a partir de um tema do espelho, na minha voz (Priority: P1)

A pessoa abre um tema de força do seu espelho (ex: "produto 0→1") e clica em **"Usar"**. Sem nunca
ver uma página em branco, o motor já chega com a evidência daquele tema carregada, infere uma base
da voz dela a partir do que ela escreveu nas capturas, e oferece **2 rascunhos de post de LinkedIn**.
Cada afirmação do post se ancora em fato real das entradas; nada é genérico nem soa de template. Ela
pode, opcionalmente, colar 1–2 textos seus para afinar a voz antes ou depois de gerar.

**Why this priority**: É o aha do bloco de conteúdo e cumpre a promessa da LP ("transforma seu
histórico em presença"). Ataca o risco nº2 do PRD ("publicar com orgulho") e a dificuldade nº1 da
pesquisa (falar das próprias conquistas) — o produto faz o primeiro rascunho a partir do trabalho
real, não de um prompt vazio estilo Taplio.

**Independent Test**: Com a conta QA, abrir um tema do espelho com evidência, clicar "Usar" → ver 2
rascunhos de post, cada um citando evidência concreta das entradas, sem travessão, sem antítese, sem
jargão de LinkedIn. Colar uma amostra de voz e confirmar que a próxima geração reflete o ajuste.

**Acceptance Scenarios**:

1. **Given** um usuário com espelho gerado e ao menos um tema de força, **When** clica "Usar" no
   tema, **Then** vê 2 rascunhos de post, cada um com evidência ancorada em entradas reais e nenhum
   campo violando as regras anti-IA.
2. **Given** a tela de geração aberta, **When** o usuário cola 1–2 amostras de voz e regera,
   **Then** o `voice_profile` é atualizado e os novos rascunhos refletem o tom das amostras.
3. **Given** um usuário sem nenhuma amostra explícita de voz, **When** gera um post, **Then** o motor
   usa a voz **inferida** do `raw_content` das capturas e ainda assim produz 2 rascunhos válidos
   (nunca uma página em branco bloqueando).

### User Story 2 — Gerar um resumo de impacto a partir de uma entrada (Priority: P1)

A pessoa abre uma entrada específica do seu histórico (ex: o lançamento que ela liderou) e clica em
**"Usar"** → escolhe o formato **resumo de impacto**. O mesmo motor, com schema e prompt próprios do
formato, gera 2 versões de um resumo curto e factual — o material que serve o wedge episódico (review
de desempenho, entrevista, pedido de promoção). Cada linha cita o fato da entrada; números só quando
existem na evidência, nunca inventados.

**Why this priority**: É o segundo formato âncora e o que dá payoff episódico (o gatilho de retorno
do produto). Compartilha 100% do motor com US1, validando que a fundação serve mais de um formato —
pré-requisito para a 015 adicionar mini-bio sem nova superfície.

**Independent Test**: Abrir uma entrada com impacto, clicar "Usar" → "Resumo de impacto" → ver 2
versões, cada uma factual e ancorada na entrada, sem número inventado, passando nas regras anti-IA.

**Acceptance Scenarios**:

1. **Given** uma entrada com `what_i_did` e impacto, **When** o usuário gera um resumo de impacto,
   **Then** vê 2 versões factuais citando a entrada, sem inventar métrica ausente.
2. **Given** o mesmo motor (`generateDraft`), **When** o formato é "impact_summary" vs "post",
   **Then** o schema Zod e o prompt aplicados são os do formato escolhido, e ambos passam pela mesma
   validação anti-IA antes de exibir.

### User Story 3 — Editar, ajustar e copiar o rascunho (Priority: P2)

Depois de ver os 2 rascunhos, a pessoa escolhe um, **edita no lugar** o texto, e usa **chips de
ajuste** rápidos ("mais curto", "menos formal", "tira o jargão") que regeram o texto com aquele
ajuste. Quando está satisfeita, **copia** com um toque, pronta para colar no LinkedIn.

**Why this priority**: Fecha o ciclo do valor (a pessoa sai com algo pronto pra publicar), mas o
rascunho gerado já entrega valor sem isto. Edição e chips são o refino, não o aha.

**Independent Test**: Com um rascunho gerado, editar o texto inline, aplicar o chip "mais curto" e
ver o texto encurtar mantendo a evidência; clicar "Copiar" e confirmar que o texto foi para a área
de transferência.

**Acceptance Scenarios**:

1. **Given** 2 rascunhos exibidos, **When** o usuário edita o texto de um deles, **Then** a edição é
   refletida e marcada como `edited`.
2. **Given** um rascunho selecionado, **When** o usuário aplica o chip "tira o jargão", **Then** o
   texto é regerado com o ajuste e continua passando nas regras anti-IA.
3. **Given** um rascunho pronto, **When** o usuário clica "Copiar", **Then** o texto vai para a área
   de transferência e a UI confirma; o rascunho é marcado como `copied`.

### User Story 4 — Persistir o rascunho e dizer se "soa como você" (Priority: P2)

O rascunho que a pessoa gerou (e editou) é **persistido** na tabela `drafts`, com seu status de
lifecycle (`generated` → `edited` → `copied` ou `discarded`). Ao lado, ela responde **"soa como
você?"** (soa / não soa), que fica salvo. No v1 esse feedback não regera nada — ele é o sinal que a
015 vai usar para afinar a voz ao longo do tempo.

**Why this priority**: A persistência é a base que a 014 (lista de rascunhos no hub) e a 015 (loop de
voz) exigem. Mas o valor de gerar+copiar já existe sem ela; por isso P2.

**Independent Test**: Gerar um rascunho, recarregar a página e confirmar (via a query/estado) que o
rascunho persistiu com o status correto; dar "soa"/"não soa" e confirmar que o `voice_feedback` foi
salvo, sem regenerar.

**Acceptance Scenarios**:

1. **Given** um rascunho gerado, **When** o usuário o edita e copia, **Then** existe uma linha em
   `drafts` com `status` refletindo a última ação e os campos de seed/ângulo preenchidos.
2. **Given** um rascunho exibido, **When** o usuário responde "soa como você? → não soa", **Then** o
   `voice_feedback` é persistido e o rascunho **não** é regerado no v1.
3. **Given** um draft de outro usuário, **When** uma query é feita, **Then** a RLS impede o acesso
   (`auth.uid() = user_id`).

### Edge Cases

- **Sem espelho ainda / poucas entradas**: o botão "Usar" no tema do espelho só aparece quando há
  espelho; a partir de uma entrada, a geração funciona mesmo com histórico curto, mas o resultado
  reconhece a base de evidência limitada (não inventa fato pra preencher).
- **Saída do LLM viola regra anti-IA**: a saída passa pela validação determinística (ruleset) antes
  de ser exibida; se viola, o motor **regenera uma vez** com o feedback da violação; persistindo a
  falha, exibe um estado de erro honesto em vez de um rascunho ruim.
- **Saída malformada (campo ausente / não-JSON)**: o Zod rejeita e o motor trata como erro de
  geração, sem persistir nada parcial.
- **`voice_profile` vazio (primeira vez)**: o motor infere a voz do `raw_content`; se não há
  capturas com texto suficiente, usa um tom neutro-brasileiro padrão e sinaliza que colar uma amostra
  melhora o resultado.
- **Número inexistente**: assim como o espelho, métrica é convite, nunca invenção. Sem número na
  evidência, o rascunho afirma pela evidência qualitativa.
- **Copiar sem permissão de clipboard**: fallback de seleção de texto + instrução, sem quebrar.

## Requirements *(mandatory)*

### Functional Requirements

#### Motor e voz (fundação compartilhada)
- **FR-001**: O sistema MUST manter um `voice_profile` por usuário (JSONB em `profiles`) com `tone`,
  `length_pref`, `samples` (1–2 textos colados), `inferred_summary` (síntese da voz a partir do
  `raw_content` das capturas) e `updated_at`.
- **FR-002**: O sistema MUST inferir uma base de voz a partir do `raw_content` das capturas do
  usuário (`buildVoiceProfile`), e MUST fundir essa base com as amostras explícitas quando existirem
  (calibração híbrida).
- **FR-003**: O sistema MUST gerar conteúdo com `claude-sonnet-4-6` via `src/lib/ai/client.ts`, sem
  novo provider, com todos os wrappers sob `src/lib/ai/content/`.
- **FR-004**: O sistema MUST produzir **2 variações** por geração, para escolha do usuário.
- **FR-005**: O motor MUST aceitar um **seed** que carrega evidência real (`entry`, `theme` ou
  `project`) — nunca um prompt vazio. (Princípio "nunca uma página em branco".)

#### Formatos
- **FR-006**: O sistema MUST gerar **post de LinkedIn** a partir de um tema do espelho, com cada
  afirmação ancorada em evidência real das entradas.
- **FR-007**: O sistema MUST gerar **resumo de impacto** a partir de uma entrada, factual e ancorado,
  com schema e prompt próprios do formato, reusando o mesmo orquestrador (`generateDraft`).
- **FR-008**: Cada formato MUST ter seu schema Zod de saída (`src/lib/ai/content/schemas.ts`) e seu
  prompt (`prompts/post.ts`, `prompts/impactSummary.ts`).

#### Disciplina anti-IA (herança literal do espelho)
- **FR-009**: Os prompts de conteúdo MUST herdar integralmente a disciplina anti-IA do
  `MIRROR_SYSTEM_PROMPT`: sem travessão, sem antítese ("não é X, é Y"), sem advérbio de ênfase vazio,
  sem jargão de IA/LinkedIn, brasilidade como substância e não enfeite, número sempre com janela de
  tempo, métrica como convite nunca cobrança, sem inventar fato.
- **FR-010**: A saída de cada formato MUST passar por uma validação determinística (ruleset
  anti-IA, sem custo de IA) **antes** de ser exibida ou persistida; violações são detectáveis em
  teste contra fixtures.
- **FR-011**: Ao detectar violação, o sistema MUST tentar **uma** regeneração com o feedback da
  violação antes de exibir um estado de erro honesto.

#### Edição, ajuste e cópia
- **FR-012**: Os usuários MUST conseguir editar o texto do rascunho no lugar.
- **FR-013**: Os usuários MUST conseguir aplicar chips de ajuste ("mais curto", "menos formal", "tira
  o jargão") que regeram o texto mantendo a evidência e a disciplina anti-IA.
- **FR-014**: Os usuários MUST conseguir copiar o rascunho para a área de transferência, com fallback
  quando a API de clipboard não está disponível.

#### Persistência e feedback
- **FR-015**: O sistema MUST persistir cada rascunho em `drafts` com `format`, `seed_type`,
  `seed_ref`, `angle`, `body`, `status` (`generated` | `edited` | `copied` | `discarded`),
  `voice_feedback` (`soa` | `nao_soa` | null), `qa` (jsonb com o ângulo/perguntas que guiaram) e
  timestamps.
- **FR-016**: O sistema MUST registrar o feedback "soa como você?" sem regenerar o rascunho no v1.
- **FR-017**: Toda linha de `drafts` MUST ser protegida por RLS (`auth.uid() = user_id`), igual a
  `entries` e `mirror_snapshots`; IDs internos MUST NOT vazar em respostas de API.

#### Plataforma (constituição)
- **FR-018**: Toda string de UI MUST viver em `src/messages/pt-BR.json` (namespace `presenca.*` /
  `content.*`), com `en.json` espelhando a estrutura. Zero string hardcoded.
- **FR-019**: Toda entrada do usuário MUST ser validada e sanitizada antes de qualquer chamada ao
  LLM; o contexto de IA MUST NUNCA incluir dado de outro usuário.
- **FR-020**: Os pontos de entrada da 013 MUST se limitar ao botão "Usar" numa entrada e num tema do
  espelho. A rota `/presenca`, a lista de rascunhos e o nudge proativo são da 014 (fora de escopo).

### Key Entities *(include if feature involves data)*

- **Draft** (`drafts`): um rascunho de conteúdo gerado — `id`, `user_id`, `format` ('post' |
  'impact_summary'), `seed_type` ('entry' | 'theme' | 'project'), `seed_ref`, `angle`, `body`,
  `status`, `voice_feedback`, `qa` (jsonb), timestamps.
- **VoiceProfile** (`profiles.voice_profile` JSONB): perfil único de voz por usuário — `tone`,
  `length_pref`, `samples[]`, `inferred_summary`, `updated_at`.
- **DraftOutput** (schema Zod por formato): a saída validada do LLM — para `post` e para
  `impact_summary`, antes de virar `Draft.body`.
- **ContentRulesetViolation**: falha de regra anti-IA detectada — `assert`, `field`, `message`
  (espelha o padrão de `RulesetViolation` do espelho).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos rascunhos exibidos ao usuário passam pelo ruleset anti-IA com zero violações
  (após no máximo uma regeneração).
- **SC-002**: O golden set de 10–15 casos reais (seed + voice_profile) gera saída que (a) passa nas
  regras anti-IA e (b) cita evidência real do seed — verificado em `vitest`, sem custo de IA na
  asserção das regras.
- **SC-003**: O mesmo orquestrador (`generateDraft`) atende os dois formatos (post e resumo de
  impacto) trocando apenas schema + prompt — provável por teste de que ambos os formatos compartilham
  o caminho de validação.
- **SC-004**: A pessoa gera, edita e copia um rascunho sem nunca encontrar uma página em branco: todo
  ponto de entrada chega com evidência carregada.
- **SC-005**: Cobertura de teste ≥ 80% no módulo `src/lib/ai/content/` e no ruleset.
- **SC-006**: Validação manual ("você publicaria isso com orgulho?") aprovada pela Ohana em ao menos
  um post e um resumo de impacto gerados de evidência real.

## Assumptions

- Reusa a infraestrutura de IA existente (`src/lib/ai/client.ts`, `claude-sonnet-4-6`) e o padrão de
  módulo de `src/lib/ai/mirror/` e `src/lib/ai/chat/`.
- Reusa `entries` (seed e evidência), `mirror_snapshots` (temas de força como seed), `profiles`
  (onde mora o `voice_profile`). `entry_embeddings` e `entry_evidences` podem enriquecer a evidência,
  mas não são bloqueantes para o v1.
- A próxima migration livre é `009` (re-validado pós-merge da 012-chat). O número é confirmado na hora
  da implementação.
- A lista de regras anti-IA herda a do espelho e pode evoluir conforme observação de saídas reais.
- O `voice_profile` como JSONB em `profiles` é suficiente para um registro por usuário; versionamento
  ao longo do tempo (se necessário) é decisão da 015.

## Out of Scope

- Rota `/presenca`, item de nav e hub com lista de rascunhos persistidos (→ 014).
- Botão "Usar" no **projeto** da Linha do Tempo e **nudge proativo** "isso daria um post" (→ 014).
- Loop de refino de voz que afina o `voice_profile` ao longo do tempo e evals do golden set como
  guardrail no CI (→ 015).
- Mini-bio como terceiro formato (→ 015).
- Agendamento, publicação direta no LinkedIn, ou qualquer integração com a API do LinkedIn.
- Geração de imagem/carrossel; só texto no v1.
