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
> - **`seed_type` hoje** = `('entry','theme','project')` no CHECK de `drafts` (009). Se opinião/externo
>   virarem `seed_type`, exige migration no CHECK; se virarem `angle_kind` no `qa`, **não exige**
>   migration (ver Clarifications / decisão de modelagem).

## Clarifications

### Session 2026-06-15 (kickoff da 018, antes da implementação)

- Q: A 018 relaxa alguma das regras anti-IA por causa do formato de opinião? → A: **Não — o contrário.**
  Nenhum dos asserts anti-IA é relaxado; a 018 **adiciona** termos de opinião-vazia ("hot take",
  "impopular mas", "ninguém fala sobre isso") às listas de `bannedTerms.ts`. (Discovery §5.)
- Q: `external` busca a URL? → A: **Não no v1.** `external` **prefere texto colado** a buscar o link
  (evita alucinação sobre conteúdo que o motor não leu). Fetch de URL é evolução fora do v1.
- Q: A "lacuna do `project`" da 013 entra aqui? → A: **Não — já está resolvida** (014, `loadProjectSeed`).

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
**uma linha** (o ângulo/intenção); o motor gera 2 posts que **defendem a tese ancorando cada
afirmação sobre o trabalho dela na evidência real** das entradas — nunca uma opinião solta. O resultado
é "opinião com lastro", não o "hot take" vazio do mercado. Se não há evidência real que sustente, o
sistema não fabrica — sinaliza honestamente.

**Why this priority**: É o ângulo de maior potencial de engajamento (thought leadership), mas tem
**risco médio** ao moat (opinião sem lastro) — por isso depois do estudo (US1) e com guardrail de
evidência. Custo baixo (só estende o que o motor já faz).

**Independent Test**: Escrever uma tese de 1 linha + escolher evidência → ver 2 posts que defendem a
tese citando fatos reais das entradas; tentar gerar opinião sem nenhuma evidência ancorável → ver o
estado honesto, não um post de opinião vazia.

**Acceptance Scenarios**:

1. **Given** uma tese de 1 linha + um seed com evidência, **When** o usuário gera, **Then** vê 2 posts
   que defendem a tese com **ao menos uma** afirmação ancorada em evidência real (`evidence_refs`
   não-vazio), sem violar as regras anti-IA.
2. **Given** uma tentativa de gerar opinião sem nenhuma evidência ancorável, **When** o motor roda,
   **Then** ele **não** produz um post de opinião vazia — sinaliza que falta evidência (nunca fabrica
   fato pra sustentar a tese).
3. **Given** uma saída que usa jargão de opinião-vazia ("hot take", "impopular mas", "ninguém fala
   sobre isso"), **When** o ruleset roda, **Then** a violação é detectada (assert), e o motor regenera
   uma vez antes de exibir.

### User Story 3 — Post reagindo a algo externo (texto colado, sem buscar URL) (Priority: P3)

A pessoa quer **reagir a algo externo** (um artigo, um post, uma notícia). Ela **cola o trecho/o
texto** (preferível a só um link — o motor não busca a URL no v1, pra não alucinar sobre o que não
leu) como ângulo/referência; o motor gera 2 posts que reagem ao externo **trazendo a perspectiva dela
ancorada na evidência real** do banco. A reação tem lastro (o que ela viveu/fez), não é eco vazio.

**Why this priority**: Completa os ângulos de conteúdo, mas é o de **maior risco** (alucinação sobre o
externo + tentação de fetch) — por isso P3 e restrito a texto colado no v1.

**Independent Test**: Colar o trecho de um artigo + escolher evidência → ver 2 posts que reagem ao
trecho trazendo a experiência real da pessoa, sem afirmar nada sobre o artigo além do que foi colado, e
sem inventar fato sobre o trabalho dela.

**Acceptance Scenarios**:

1. **Given** um trecho externo colado + um seed com evidência, **When** o usuário gera, **Then** vê 2
   posts que reagem ao trecho com a perspectiva dela ancorada em evidência real, sem violar anti-IA.
2. **Given** apenas um link (sem texto colado), **When** o usuário tenta gerar reação a externo,
   **Then** o sistema pede o texto/trecho (não busca a URL no v1) — nunca afirma conteúdo do link que
   não leu.
3. **Given** o texto colado externo, **When** o post é gerado, **Then** ele **não** afirma fato sobre o
   trabalho da pessoa que não esteja nas entradas (o externo é ângulo, a prova é das `entries`).

### User Story 4 — A disciplina anti-opinião-vazia (transversal) (Priority: P1)

Acompanhando os novos ângulos, o ruleset determinístico **ganha cobertura contra opinião-vazia** sem
relaxar nenhuma das regras anti-IA existentes. Termos de "hot take" entram nas listas banidas; o
golden set cobre os novos ângulos; o guardrail de **evidência ancorada** vale para opinião e externo.

**Why this priority**: É o que impede a 018 de virar uma fábrica de opinião genérica (o risco central
da feature). Sem ela, opinião/externo violam o moat. Por isso P1, junto do ângulo de menor risco.

**Independent Test**: Rodar o golden set com fixtures de opinião/externo → confirmar que jargão de
opinião-vazia falha o assert, que os 3 novos ângulos passam quando ancorados, e que nenhum assert
anti-IA existente foi afrouxado.

**Acceptance Scenarios**:

1. **Given** as listas de `bannedTerms`, **When** a 018 adiciona os termos de opinião-vazia, **Then** o
   ruleset detecta-os e os asserts anti-IA existentes seguem inalterados (sem afrouxamento).
2. **Given** o golden set, **When** a 018 adiciona fixtures dos 3 ângulos, **Then** o CI cobre opinião e
   externo como gate (coerente com a 015), e uma opinião sem evidência ancorada falha o guardrail.

### Edge Cases

- **Opinião/externo sem evidência ancorável**: o motor não fabrica fato — sinaliza honestamente que
  falta evidência (guardrail de `evidence_refs` não-vazio).
- **Só um link, sem texto colado** (externo): pede o trecho; não busca a URL no v1.
- **Tese muito longa / fora de foco**: tratada como ângulo de 1 linha; o excesso não vira conteúdo
  inventado.
- **Saída viola anti-IA ou usa opinião-vazia**: passa pelo ruleset antes de exibir; regenera uma vez;
  persistindo, estado de erro honesto (mesmo fluxo da 013).
- **Ângulo aplicado a seed sem evidência suficiente**: reconhece a base limitada, não inventa pra
  preencher (igual ao espelho/013).

## Requirements *(mandatory)*

### Functional Requirements

#### Ângulos de post (US1–US3)
- **FR-001**: O motor MUST gerar post com ângulo **"estudo/aprendizado"** sobre um seed existente
  (entry/theme/project), sem input externo, com a prova vinda da evidência real (`loadSeedEvidence`).
- **FR-002**: O motor MUST gerar post de **opinião/tese** a partir de uma **tese de 1 linha** (ângulo),
  ancorando ao menos uma afirmação em evidência real das entradas.
- **FR-003**: O motor MUST gerar post de **reação a externo** a partir de **texto colado** (não busca
  URL no v1), trazendo a perspectiva da pessoa ancorada na evidência real.
- **FR-004**: Os ângulos/inputs externos (`angle_kind`, `thesis`, `external_ref`) MUST ser persistidos
  no `drafts.qa jsonb` existente.
- **FR-005**: Os três ângulos MUST reusar o orquestrador `generateDraft` e produzir **2 variações**,
  como os formatos da 013 (sem caminho de geração paralelo).

#### Moat e guardrails (US2–US4)
- **FR-006**: Todo post de **opinião** e de **externo** MUST ter **`evidence_refs` não-vazio** (ao
  menos uma afirmação ancorada em entrada real); sem evidência ancorável, o motor MUST sinalizar e
  **não** gerar opinião vazia.
- **FR-007**: O texto gerado MUST NOT afirmar fato sobre o trabalho da pessoa que não esteja nas
  `entries`; o input externo (tese/link/trecho) é **ângulo**, nunca fonte de fato sobre ela.
- **FR-008**: O ruleset determinístico MUST ganhar cobertura contra **opinião-vazia** (termos como
  "hot take", "impopular mas", "ninguém fala sobre isso") em `bannedTerms.ts`, **sem relaxar** nenhum
  dos asserts anti-IA existentes.
- **FR-009**: O golden set MUST cobrir os 3 ângulos como **gate de CI** (coerente com a 015), incluindo
  um caso de opinião sem evidência que **falha** o guardrail.

#### Modelagem e plataforma (constituição)
- **FR-010**: A modelagem de opinião/externo (novo `seed_type` **vs** `angle_kind` no `qa`) MUST seguir
  a decisão de Clarifications; se exigir migration (CHECK de `seed_type`), o número MUST ser o próximo
  livre confirmado na implementação (**não** `010`, já em `main` pela 015), respeitando a ordem de
  merge.
- **FR-011**: Toda string de UI MUST viver em `src/messages/pt-BR.json`, com `en.json` espelhando.
  Zero string hardcoded.
- **FR-012**: Toda entrada do usuário (tese, texto externo colado) MUST ser validada e sanitizada antes
  de qualquer chamada ao LLM; o contexto de IA MUST NUNCA incluir dado de outro usuário; RLS de
  `drafts` (`auth.uid() = user_id`) preservada.

### Key Entities *(include if feature involves data)*

- **Draft** (`drafts`, evolução): reusa `format='post'`; o ângulo vive no `qa` (`angle_kind`:
  'study' | 'opinion' | 'external'), com `thesis` (opinião) e `external_ref` (externo) quando houver.
  Se a decisão for `seed_type`, ganha valores `opinion`/`external` no CHECK (migration).
- **SeedEvidence** (reuso de `loadSeedEvidence`): a evidência real (entry/theme/project) que ancora
  qualquer ângulo — a prova do moat.
- **ContentRulesetViolation** (reuso): agora também detecta opinião-vazia, além dos asserts anti-IA.
- **GoldenCase** (reuso): fixtures dos 3 ângulos no gate de CI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Os 3 ângulos (estudo, opinião, externo) geram 2 posts cada, todos passando nas regras
  anti-IA, reusando o mesmo `generateDraft` — verificável em teste.
- **SC-002**: **100%** dos posts de opinião/externo exibidos têm `evidence_refs` não-vazio; uma
  tentativa sem evidência ancorável é bloqueada — verificável em teste do guardrail.
- **SC-003**: Nenhum post afirma fato sobre o trabalho da pessoa fora das `entries` — verificável em
  teste com fixture onde o externo/tese contém um "fato" que não está nas entradas (não deve aparecer).
- **SC-004**: Jargão de opinião-vazia é detectado pelo ruleset e os asserts anti-IA existentes seguem
  inalterados (sem regressão) — verificável no golden set/CI.
- **SC-005**: Cobertura de teste ≥ 80% nos caminhos novos (ângulos, guardrail de evidência, novos
  termos banidos).
- **SC-006**: Validação manual da Ohana: um post de opinião e um de reação a externo que ela
  **publicaria com orgulho** — com lastro, sem soar genérico.

## Assumptions

- Reusa o motor da 013/015 (`generateDraft`, `loadSeedEvidence`, `validateRuleset`, `bannedTerms`,
  prompts) e o `drafts.qa jsonb` (009). 015 já está em `main` (mini_bio, recalibração, golden set).
- A "lacuna do `project`" do discovery §5 **já está fechada** (014) — fora do escopo.
- Se a modelagem for `angle_kind` no `qa`, **não há migration**; se for `seed_type`, a migration é só o
  CHECK e o número é confirmado na implementação (≠ `010`, após 015 em `main`).
- O guardrail de evidência (`evidence_refs` não-vazio) é a mitigação central contra opinião sem lastro.
- `external` no v1 é **texto colado**; fetch de URL é evolução.

## Out of Scope

- **Fetch de URL externa** (ler o link automaticamente) — risco de alucinação; v1 é texto colado.
- **Relaxar qualquer assert anti-IA** para acomodar opinião/formato — proibido pela constituição.
- **Novos formatos além de `post`** (a mini-bio é da 015; resumo de impacto, da 013) — a 018 amplia
  **ângulos** de post, não formatos.
- **Fechar a lacuna do `project`** em `loadSeedEvidence` — já feita pela 014.
- **Geração de imagem/carrossel** — só texto.
- **Autoavaliação de desempenho** — é a 019.
