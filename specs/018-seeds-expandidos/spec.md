# Feature Specification: Seeds Expandidos de Post (opinião, externo, estudo)

**Feature Branch**: `018-seeds-expandidos`

**Created**: 2026-06-15

**Status**: Draft (planejamento — implementação em sessão separada)

**Input**: Terceiro elo da aposta de retenção, conforme o discovery
`docs/discovery-retencao-e-conteudo.md` (seção 5). Posts não são só "o que eu fiz" — são também
**opinião**, **conteúdo estudado** e **reação a algo externo**. O motor da 013 já é mais maduro que os
docs sugerem; a 018 amplia o **output** (mais ângulos de post) sem trair o moat.

> **Princípio que protege o moat (inegociável)**: o input externo (uma tese, um link, um tema
> estudado) entra como **ângulo/intenção**; a **prova continua vindo da evidência real do banco da
> pessoa** (as `entries`). O texto só afirma fato sobre o trabalho dela a partir das entradas. Isso
> transforma "opinião vazia" (padrão do mercado, segundo a Edelman) em **"opinião com lastro"** — que é
> o que engaja. Sem evidência real ancorada, não há post de opinião.

> **Estado atual do código (a 018 estende o motor da 013/015).** Audit feito no kickoff:
> - **`drafts.qa jsonb` já existe** (migration 009) e absorve `thesis`/`external_ref`/`angle_kind` sem
>   migration.
> - **`loadSeedEvidence` JÁ trata `entry`, `theme` e `project`** — a "lacuna do `project`" que o
>   discovery §5 mandava fechar **já foi fechada pela 014** (`loadProjectSeed`). Fora do escopo da 018.
> - **`generateDraft` + `validateRuleset` + `bannedTerms` + prompts** (`post.ts`, `discipline.ts`) são
>   o ponto de extensão; a disciplina anti-IA é herança literal e **não se relaxa** por causa de opinião.
> - **`seed_type` hoje** = `('entry','theme','project')` no CHECK de `drafts` (009). **Decisão (clarify):**
>   o ângulo vive como `angle_kind` no `qa jsonb` — **sem migration**; `seed_type` segue sendo a fonte
>   de evidência (entry/theme/project), não o tipo de post.

## Clarifications

### Session 2026-06-15 (kickoff da 018, antes da implementação)

- Q: A 018 relaxa alguma das regras anti-IA por causa do formato de opinião? → A: **Não — o contrário.**
  Nenhum dos asserts anti-IA é relaxado; a 018 **adiciona** termos de opinião-vazia ("hot take",
  "impopular mas", "ninguém fala sobre isso") às listas de `bannedTerms.ts`. (Discovery §5.)
- Q: `external` busca a URL? → A: **Não no v1.** `external` **prefere texto colado** a buscar o link
  (evita alucinação sobre conteúdo que o motor não leu). Fetch de URL é evolução fora do v1.
- Q: A "lacuna do `project`" da 013 entra aqui? → A: **Não — já está resolvida** (014, `loadProjectSeed`).

### Session 2026-06-15 (clarify)

- Q: Modelar opinião/externo como `seed_type` (migration) ou `angle_kind` no `qa` (sem migration)? → A:
  **`angle_kind` no `qa`, sem migration.** Modelo mental único: um post é um post, a pessoa escolhe o
  **ângulo** (relato / estudo / opinião); o `seed_type` segue sendo a **fonte de evidência**. Mais
  claro pro usuário, mais simples de construir/gerir, sem coordenação de migration entre branches.
- Q: Reação a externo entra no v1? → A: **Não — adiada.** A 018 entrega **estudo + opinião**; reação a
  externo (maior risco: alucinação/fetch) fica para um elo seguinte.
- Q: Como tratar opinião de vivência **não registrada** (caso brasileiro)? → A: **Lastro = vivência
  registrada OU dita na hora.** A opinião se ancora numa entrada registrada **ou** numa vivência que a
  pessoa escreve no momento; quando ela escreve na hora, o produto **oferece registrar** como entry
  (alimenta o banco — sinergia com a 016). Barra-se só o hot-take genérico **sem nenhuma vivência
  concreta**. O moat é "não ser opinião oca", não "estar no banco".

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Post de algo que estudei/aprendi (ângulo sobre evidência real) (Priority: P1)

A pessoa quer postar sobre **algo que estudou ou aprendeu** (um conceito, um curso, uma técnica), não
só relatar uma entrega. Ela escolhe uma entrada (ou tema) e um **ângulo de "estudo/aprendizado"**; o
motor gera 2 posts que conectam o que ela aprendeu ao que ela **de fato fez** (a evidência real),
sem inventar. É o ângulo de **menor risco** (sem input externo) — por isso o ponto de partida.

**Why this priority**: Amplia o output imediatamente, com risco mínimo ao moat (zero input externo,
prova 100% das entradas) e **sem migration** (reusa `entry`/`theme` + um `angle_kind` no `qa`). Entrega
valor sozinho e valida o padrão de "ângulo sobre evidência" que opinião/externo vão seguir.

**Independent Test**: Com a conta QA, escolher uma entrada, ângulo "algo que estudei" → ver 2 posts
que amarram o aprendizado à evidência real daquela entrada, passando nas regras anti-IA, sem fato
inventado.

**Acceptance Scenarios**:

1. **Given** uma entrada/tema do usuário, **When** ele gera um post com ângulo "estudo/aprendizado",
   **Then** vê 2 variações que conectam o aprendizado à evidência real do seed, sem inventar fato e sem
   violar as regras anti-IA.
2. **Given** o mesmo motor (`generateDraft`), **When** o ângulo é "estudo", **Then** a evidência vem do
   `loadSeedEvidence` existente (entry/theme/project) — nenhum caminho novo de evidência.

### User Story 2 — Post de opinião/tese com lastro (Priority: P2)

A pessoa tem uma **opinião/tese** sobre a área dela e quer defendê-la num post. Ela escreve a tese em
**uma linha** (o ângulo/intenção) e indica o **lastro** — uma entrada já **registrada** (evidência do
banco) **ou** uma **vivência que ela escreve ali na hora**. O motor gera 2 posts que defendem a tese
ancorados nesse lastro real — "opinião com lastro", não o "hot take" vazio do mercado. **Quando o
lastro é uma vivência dita na hora**, o produto **oferece registrá-la como entrada** (alimenta o banco
— sinergia com a 016: da próxima vez já está lá). O que o sistema **não** gera é opinião genérica **sem
nenhuma vivência concreta**.

**Why this priority**: É o ângulo de maior potencial de engajamento (thought leadership), mas tem
**risco médio** ao moat (opinião sem lastro) — por isso depois do estudo (US1) e com guardrail de
lastro. Custo baixo (estende o que o motor já faz) e a captura da vivência reforça o input.

**Independent Test**: Escrever uma tese de 1 linha + ancorar numa entrada registrada → ver 2 posts com
lastro; escrever a tese + uma vivência na hora → ver a opinião ancorada **e** o convite a registrar a
vivência; tentar opinião sem nenhum lastro concreto → ver o estado honesto, não um hot-take vazio.

**Acceptance Scenarios**:

1. **Given** uma tese de 1 linha + uma entrada registrada como lastro, **When** o usuário gera, **Then**
   vê 2 posts que defendem a tese com ao menos uma afirmação ancorada na evidência real, sem violar as
   regras anti-IA.
2. **Given** uma tese + uma vivência escrita na hora (não registrada), **When** o usuário gera, **Then**
   os posts se ancoram nessa vivência **e** o sistema oferece salvá-la como entrada (captura); aceitar o
   convite cria a entrada e o banco cresce.
3. **Given** uma tentativa de opinião **sem nenhuma vivência concreta** (registrada ou dita), **When** o
   motor roda, **Then** ele **não** produz opinião vazia — sinaliza que falta lastro, nunca fabrica fato.
4. **Given** uma saída que usa jargão de opinião-vazia ("hot take", "impopular mas", "ninguém fala
   sobre isso"), **When** o ruleset roda, **Then** a violação é detectada (assert), e o motor regenera
   uma vez antes de exibir.

### User Story 3 — A disciplina anti-opinião-vazia (transversal) (Priority: P1)

Acompanhando os novos ângulos, o ruleset determinístico **ganha cobertura contra opinião-vazia** sem
relaxar nenhuma das regras anti-IA existentes. Termos de "hot take" entram nas listas banidas; o
golden set cobre os novos ângulos; o guardrail de **lastro** (vivência registrada ou dita na hora)
vale para a opinião.

**Why this priority**: É o que impede a 018 de virar uma fábrica de opinião genérica (o risco central
da feature). Sem ela, a opinião viola o moat. Por isso P1, junto do ângulo de menor risco.

**Independent Test**: Rodar o golden set com fixtures de estudo e opinião → confirmar que jargão de
opinião-vazia falha o assert, que os 2 ângulos passam quando ancorados em lastro, e que nenhum assert
anti-IA existente foi afrouxado.

**Acceptance Scenarios**:

1. **Given** as listas de `bannedTerms`, **When** a 018 adiciona os termos de opinião-vazia, **Then** o
   ruleset detecta-os e os asserts anti-IA existentes seguem inalterados (sem afrouxamento).
2. **Given** o golden set, **When** a 018 adiciona fixtures de estudo e opinião, **Then** o CI cobre os
   ângulos como gate (coerente com a 015), e uma opinião **sem lastro** falha o guardrail.

### Edge Cases

- **Opinião sem nenhum lastro concreto** (nem entrada registrada, nem vivência dita): o motor não
  fabrica fato — sinaliza honestamente que falta lastro.
- **Vivência dita na hora**: vira o lastro da opinião e o produto oferece registrá-la como entrada
  (captura opcional, sinergia com a 016); recusar o convite não bloqueia o post.
- **Tese muito longa / fora de foco**: tratada como ângulo de 1 linha; o excesso não vira conteúdo
  inventado.
- **Saída viola anti-IA ou usa opinião-vazia**: passa pelo ruleset antes de exibir; regenera uma vez;
  persistindo, estado de erro honesto (mesmo fluxo da 013).
- **Ângulo aplicado a seed sem evidência suficiente**: reconhece a base limitada, não inventa pra
  preencher (igual ao espelho/013).

## Requirements *(mandatory)*

### Functional Requirements

#### Ângulos de post (US1–US2)
- **FR-001**: O motor MUST gerar post com ângulo **"estudo/aprendizado"** sobre um seed existente
  (entry/theme/project), sem input externo, com a prova vinda da evidência real (`loadSeedEvidence`).
- **FR-002**: O motor MUST gerar post de **opinião/tese** a partir de uma **tese de 1 linha** (ângulo),
  ancorando ao menos uma afirmação no **lastro real** — uma entrada registrada **ou** uma vivência que
  a pessoa escreve na hora.
- **FR-003**: Quando o lastro da opinião é uma **vivência dita na hora** (não registrada), o sistema
  MUST oferecer salvá-la como entrada (captura opcional, reusa o pipeline de captura); recusar o convite
  MUST NOT bloquear a geração do post.
- **FR-004**: O ângulo e seus inputs (`angle_kind`: 'study' | 'opinion'; `thesis`; referência ao
  lastro) MUST ser persistidos no `drafts.qa jsonb` existente — **sem migration**.
- **FR-005**: Os ângulos MUST reusar o orquestrador `generateDraft` e produzir **2 variações**, como os
  formatos da 013 (sem caminho de geração paralelo).

#### Moat e guardrails (US2–US3)
- **FR-006**: Todo post de **opinião** MUST ter **`evidence_refs` não-vazio** — ao menos uma afirmação
  ancorada em lastro real (entrada registrada ou vivência dita na hora). Sem nenhum lastro concreto, o
  motor MUST sinalizar e **não** gerar opinião vazia. (O moat é "não ser opinião oca", não "estar no
  banco".)
- **FR-007**: O texto gerado MUST NOT afirmar fato sobre o trabalho da pessoa que não esteja no lastro
  (entrada registrada ou vivência fornecida); a tese é **ângulo**, nunca fonte de fato sobre ela.
- **FR-008**: O ruleset determinístico MUST ganhar cobertura contra **opinião-vazia** (termos como
  "hot take", "impopular mas", "ninguém fala sobre isso") em `bannedTerms.ts`, **sem relaxar** nenhum
  dos asserts anti-IA existentes.
- **FR-009**: O golden set MUST cobrir os ângulos (estudo, opinião) como **gate de CI** (coerente com a
  015), incluindo um caso de opinião **sem lastro** que **falha** o guardrail.

#### Modelagem e plataforma (constituição)
- **FR-010**: O ângulo MUST ser modelado como **`angle_kind` no `drafts.qa jsonb`** (não como novo
  `seed_type`) — **sem migration**. O `seed_type` segue sendo a fonte de evidência (entry/theme/
  project); o `format` segue `post`.
- **FR-011**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando.
  Zero string hardcoded.
- **FR-012**: Toda entrada do usuário (tese, texto externo colado) MUST ser validada e sanitizada antes
  de qualquer chamada ao LLM; o contexto de IA MUST NUNCA incluir dado de outro usuário; RLS de
  `drafts` (`auth.uid() = user_id`) preservada.

### Key Entities *(include if feature involves data)*

- **Draft** (`drafts`, evolução): reusa `format='post'`; o ângulo vive no `qa` (`angle_kind`:
  'study' | 'opinion') + `thesis` (opinião) — **sem migration** (o `qa jsonb` já existe).
- **Lastro** (conceitual): a âncora real da opinião — uma `entry` registrada **ou** uma vivência dita
  na hora; a vivência dita pode virar `entry` via o convite de captura (sinergia 016).
- **SeedEvidence** (reuso de `loadSeedEvidence`): a evidência real (entry/theme/project) que ancora
  qualquer ângulo — a prova do moat.
- **ContentRulesetViolation** (reuso): agora também detecta opinião-vazia, além dos asserts anti-IA.
- **GoldenCase** (reuso): fixtures dos ângulos (estudo, opinião) no gate de CI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os 2 ângulos (estudo, opinião) geram 2 posts cada, todos passando nas regras anti-IA,
  reusando o mesmo `generateDraft` — verificável em teste.
- **SC-002**: **100%** dos posts de opinião exibidos têm `evidence_refs` não-vazio (lastro registrado
  ou dito); uma tentativa sem nenhum lastro é bloqueada — verificável em teste do guardrail.
- **SC-003**: Nenhum post afirma fato sobre o trabalho da pessoa fora do lastro — verificável em teste
  com fixture onde a tese contém um "fato" que não está no lastro (não deve aparecer no post).
- **SC-004**: Jargão de opinião-vazia é detectado pelo ruleset e os asserts anti-IA existentes seguem
  inalterados (sem regressão) — verificável no golden set/CI.
- **SC-005**: A vivência dita na hora que vira lastro pode ser **salva como entrada** via o convite —
  verificável em teste (aceitar o convite cria a `entry`).
- **SC-006**: Cobertura de teste ≥ 80% nos caminhos novos (ângulos, guardrail de lastro, convite de
  captura, novos termos banidos).
- **SC-007**: Validação manual da Ohana: um post de opinião que ela **publicaria com orgulho** — com
  lastro, sem soar genérico.

## Assumptions

- Reusa o motor da 013/015 (`generateDraft`, `loadSeedEvidence`, `validateRuleset`, `bannedTerms`,
  prompts) e o `drafts.qa jsonb` (009). 015 já está em `main` (mini_bio, recalibração, golden set).
- A "lacuna do `project`" do discovery §5 **já está fechada** (014) — fora do escopo.
- A modelagem é `angle_kind` no `qa jsonb` → **sem migration** (decisão de clarify).
- O guardrail de lastro (`evidence_refs` não-vazio; registrado ou dito na hora) é a mitigação central
  contra opinião sem lastro; o convite a registrar a vivência reforça o input (016).
- Reação a **externo** está adiada (não é v1) — reduz o ângulo de maior risco.

## Out of Scope

- **Reação a externo (3º ângulo)** — adiada para um elo seguinte (maior risco: alucinação/fetch).
  Quando vier, será **texto colado** (não busca URL), seguindo o mesmo princípio de moat.
- **Fetch de URL externa** (ler o link automaticamente) — risco de alucinação.
- **Relaxar qualquer assert anti-IA** para acomodar opinião/formato — proibido pela constituição.
- **Novos formatos além de `post`** (a mini-bio é da 015; resumo de impacto, da 013) — a 018 amplia
  **ângulos** de post, não formatos.
- **Fechar a lacuna do `project`** em `loadSeedEvidence` — já feita pela 014.
- **Geração de imagem/carrossel** — só texto.
- **Autoavaliação de desempenho** — é a 019.
