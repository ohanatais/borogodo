# Research: Organizar + Destaques

**Input**: `spec.md`, `docs/decisions/003-registro-deposito-e-captura.md`, código real de
`entries`, `getFeedData`, `src/lib/ai/extraction/`, `src/lib/capture/saveDeposito.ts`,
`src/app/api/capture/route.ts`, migrations `001`–`015`.

Esta feature não tem "NEEDS CLARIFICATION" no Technical Context (ver `plan.md`) — as decisões
abaixo resolvem os pontos que a spec deliberadamente deixou para o plano técnico (Assumptions:
"decisão técnica que cabe ao `/speckit-plan`, não a esta spec").

## 1. Destaques: nova tabela vs. JSONB em `entries`

**Decision**: nova tabela `entry_highlights` (migration `016`), FK `entry_id → entries(id) on
delete cascade`, com `user_id` denormalizado (mesmo padrão de `drafts`/`ai_usage_events`) para
manter RLS simples e simétrica à de `entries`.

**Rationale**:
- FR-015/FR-016 exigem que cada destaque seja editável e removível **independentemente** dos
  demais — isso é edição/delete de linha, não read-modify-write de um array inteiro em JSONB.
- O padrão já estabelecido no projeto para "novo sub-recurso com lifecycle próprio" é sempre uma
  tabela dedicada com RLS própria (`drafts` na 013, `ai_usage_events`/`ai_daily_alert_state` na
  023) — nunca um blob JSONB quando o sub-recurso tem identidade e edição própria. `evidences`
  (JSONB, migration 007) é o único precedente de array-em-coluna no schema, e é usado
  precisamente para o caso oposto: itens *append-only*, nunca editados individualmente após
  criados. Destaques não se encaixam nesse padrão.
- Uma tabela permite índice em `(entry_id, position)` para ordenação estável dentro da fonte, e
  consulta direta por `user_id` para o vocabulário de tags (Story 6) sem precisar "unnestar" JSON
  em toda leitura.
- Alternativa rejeitada — coluna `highlights jsonb` em `entries`: mais simples de implementar
  no insert inicial, mas qualquer edição de UM destaque exigiria reler o array inteiro, editar em
  memória, e regravar — risco de corrida em updates concorrentes (menor aqui por ser mono-usuário,
  mas ainda uma classe de bug desnecessária) e nenhuma vantagem real de performance nesta escala
  (uso pessoal/dogfooding, mesma característica de escala que a 025 documentou).

**Alternatives considered**: coluna JSONB (rejeitada, ver acima); tabela `entry_highlights` sem
`user_id` denormalizado, RLS via join em `entries` (rejeitada — mais lenta e mais complexa que
replicar `user_id`, quebra o padrão simples de RLS `auth.uid() = user_id` usado em toda a base).

## 2. Estado de organização da fonte (transitório "organizando…" + guarda de concorrência)

**Decision**: duas colunas novas em `entries`: `organized_at timestamptz null` e
`organizing_started_at timestamptz null`.

- `organized_at` — `null` = nunca organizado com sucesso (FR-010: não é "rascunho", é um registro
  real e completo, só ainda sem destaques estruturados); preenchido no sucesso de uma organização
  (manual ou assíncrona).
- `organizing_started_at` — marca o início de uma chamada de organização em andamento. Serve
  **dois propósitos ao mesmo tempo** (evita uma segunda coluna/flag): (a) guarda de concorrência
  para FR-031 (se já setado e recente — abaixo de um timeout curto — uma nova chamada é um no-op
  em vez de disparar outra chamada de IA); (b) sinal para o estado transitório "organizando…" da
  US3/FR-011 — o cliente só precisa checar se essa coluna está preenchida e recente para mostrar o
  estado, sem precisar de uma máquina de estados adicional.

**Rationale**: reaproveita o mesmo princípio que a spec já usa para "campo preenchido = não
sobrescrever" (FR-002) — aqui, "coluna preenchida e recente = já em andamento". Evita introduzir
um enum de status (`pending`/`processing`/`done`/`failed`) que não tem precedente no schema (ver
achado de pesquisa abaixo) e que precisaria de mais uma migração de dado toda vez que um novo
estado for necessário.

**Achado de código**: não existe hoje nenhum precedente de coluna de status "em andamento" no
schema (`drafts.status` é um lifecycle de conteúdo já gerado, não um job em voo;
`ai_usage_events`/`ai_daily_alert_state` são telemetria pós-fato). Esta feature introduz o
primeiro caso — por isso a escolha acima prioriza o mínimo de superfície nova (2 timestamps, não
um enum).

**Alternatives considered**: enum `organize_status` (rejeitado — mais expressivo, mas nenhuma
necessidade concreta de mais de 2 bits de informação hoje; pode ser adicionado depois sem quebrar
nada, é aditivo); tabela de jobs dedicada (rejeitado — YAGNI, não há fila real, é uma chamada
única fire-and-forget por registro).

## 3. Contexto (empresa / projeto pessoal / não identificado)

**Decision**: reusar a coluna `company` já existente (`entries.company`) para o valor do
contexto (nome da empresa, ou o texto livre nomeado via "Outro" — Story 2 trata ambos como o
mesmo tipo de valor: um nome de contexto). Adicionar **uma** coluna nova,
`is_personal_project boolean not null default false`, para representar a opção fixa "Projeto
pessoal" sem sobrecarregar `company` com um valor sentinela de string.

- "Contexto não identificado" (FR-008) = `company IS NULL AND is_personal_project = false`.
- "Projeto pessoal" (FR-003, acceptance #3) = `is_personal_project = true` (não é pendência).
- Empresa nomeada (existente ou via "Outro") = `company = '<valor>'`, `is_personal_project =
  false`.

**Rationale**: `company` já existe desde a `001_entries.sql` e já é lido por `getFeedData`
(filtro `.ilike('company', ...)`) — reaproveitar em vez de criar uma coluna paralela evita
duplicar a fonte de verdade. Um booleano dedicado para "projeto pessoal" é mais barato e mais
explícito em queries (`WHERE is_personal_project` vs. comparar string a um sentinela mágico como
`company = 'Projeto pessoal'`, que colidiria com o raro caso real de alguém nomear uma empresa
literalmente assim).

**Vocabulário de contextos (FR-003/FR-005)**: confirmando a Assumption da spec — derivado por
`SELECT DISTINCT company FROM entries WHERE user_id = :userId AND company IS NOT NULL ORDER BY
company`, sem tabela nova. "Projeto pessoal" e "Outro" são valores fixos de UI, não vêm do banco.

## 4. Vocabulário de tags e onde tags vivem (fonte vs. destaque)

**Decision**: tags passam a ser geradas e editadas **por destaque** (`entry_highlights.tags`, FR-
015), mas `entries.tags` (coluna já existente) é mantida como um **rollup denormalizado** — a
união das tags de todos os destaques daquela fonte — recalculada a cada criação/edição/remoção de
destaque. Para fontes legadas sem destaque (FR-032), `entries.tags` continua sendo a fonte de
verdade direta (comportamento inalterado).

**Rationale**: `getFeedData` já filtra por tag no nível da fonte (`.contains('tags', tags)`,
FR-025 exige 1 card por fonte no feed) — manter esse contrato evita reescrever a paginação e o
filtro do feed nesta feature. A alternativa "pura" (fazer join/agregação em tempo de leitura contra
`entry_highlights` a cada chamada de `getFeedData`) é mais correta em teoria, mas exige refatorar
cursor/paginação hoje baseados em colunas simples de `entries` — risco desnecessário para o SC-005
("sem regressão perceptível de carregamento"). Fica registrado como possível limpeza futura se o
rollup denormalizado se mostrar inconsistente em uso real (não hoje, é decisão de otimização
prematura).

**Vocabulário de tags (Story 6)**: derivado por `SELECT DISTINCT unnest(tags) FROM entries WHERE
user_id = :userId` — como o rollup mantém `entries.tags` sincronizado, não é necessário
consultar `entry_highlights` diretamente para montar o vocabulário.

## 5. Mecanismo de disparo assíncrono (fire-and-forget) para a organização

**Decision**: reusar o mecanismo **já existente** no código — `fireAndForget()` em
`src/lib/ai/extraction/jobs.ts` (promise iniciada sem `await`, com `.catch` que só loga) — e
adicionar um novo job `triggerOrganizeEntry(entryId, userId)` à função `dispatchAsyncJobs()` em
`src/app/api/capture/route.ts`.

**Achado de código**: `dispatchAsyncJobs` já dispara 3 jobs (`triggerProactiveInsight`,
`maybeRegenerateMirror`, `triggerEnrichmentNudge`) exatamente neste padrão para os caminhos
`marco`/`text`/`file` — mas **não é chamada hoje no caminho `deposito`**
(`handleDepositoCapture`, em `src/app/api/capture/route.ts`). Esta feature corrige isso: FR-009
exige que TODO registro salvo dispare a organização automática, incluindo o caminho do drawer
(025), que hoje não dispara nenhum job pós-salvar.

**Rationale**: não há `waitUntil`/`after()` (`next/server`) em uso em nenhum lugar do código hoje
— confirmado por busca no repositório. Introduzir `after()` agora seria mais robusto em teoria
(a função serverless permanece viva até o job terminar, mesmo após a resposta ser enviada — mais
seguro que uma promise solta, que pode ser interrompida se a invocação for encerrada antes de
concluir), mas seria o único uso desse mecanismo no projeto, uma inconsistência de padrão sem
necessidade comprovada — os 3 jobs existentes já rodam sob o padrão atual em produção sem relato
de perda sistemática. Adotar o padrão já testado (`fireAndForget`) é a escolha mais simples e
consistente (KISS); trocar por `after()` em todos os jobs fire-and-forget do projeto é uma
melhoria de infraestrutura futura e ortogonal a esta feature — **não deve ser feita aqui**, para
não misturar uma refatoração ampla de infraestrutura com o escopo desta feature.

**Botão manual "Organizar"**: chama uma nova rota `POST /api/entries/[id]/organize` (síncrona do
ponto de vista do cliente — a pessoa clicou e espera o resultado, SC-001 exige <15s), que roda o
mesmo `organizeEntry()` usado pelo job assíncrono. A guarda de concorrência (`organizing_started_
at`, item 2 acima) é o que impede o duplo clique (edge case do spec) de disparar duas chamadas de
IA simultâneas — o endpoint retorna imediatamente com "já em andamento" (idempotente) se a coluna
já estiver setada e recente.

## 6. Prompt/extração: novo schema Zod para "Organizar"

**Decision**: novo prompt dedicado (`src/lib/ai/extraction/prompts/organize.ts`) e schema Zod
próprio (`organizeResultSchema` em `schemas.ts`) — não reaproveita `captureResultSchema` (que
gera `ExtractedEntry`, pensado para criar UMA entry nova a partir de texto cru na captura
original). O output de "Organizar" é uma **lista de destaques** para uma entry **já existente**:
`{ highlights: [{ title, metric, impact, tags }], company, entry_date }` — os dois últimos apenas
quando não resolvidos por pílula (FR-006), e omitidos do schema quando a fonte já tem contexto/
período resolvido (o prompt nem pede esses campos nesse caso, reforçando FR-004/FR-006 na
origem, não só na aplicação do resultado).

**Rationale**: mistura FR-014 (múltiplos destaques por fonte) com FR-006/FR-007 (empresa/período
só por sinal textual, nunca por associação estatística) — um schema down-stream de
`captureResultSchema` obrigaria a carregar campos que não fazem sentido aqui (`decision`,
`learning`, `role_title` continuam existindo só no nível legado da fonte, fora do escopo de
"destaque"). `claude-haiku-4-5` é reusado (constituição III, mandatório para extração) — mesma
family de modelo, prompt novo.

## 7. Título substantivo-primeiro / outcome-first (Story 5)

**Decision**: parte do mesmo prompt de "Organizar" (item 6) — não é uma segunda chamada de IA.
O prompt já existente (`capture.ts`) tem uma instrução de título "1 frase nominal" para a
ENTRY inteira; o prompt novo (`organize.ts`) aplica a mesma disciplina de título por DESTAQUE,
com a regra adicional de FR-019 (número/prova no título quando presente) e a anti-regra de FR-024
(evitar nominalização vaga, "Otimização de processos") — reaproveitando o anti-padrão já
documentado em `CAPTURE_SYSTEM_PROMPT` (sem travessão/seta/barra, sem jargão corporativo).

## Resumo de impacto no schema (confirmação da Assumption da spec)

| Mudança | Migration nova? |
|---|---|
| Tabela `entry_highlights` (destaques, FK `entries`, RLS própria) | **Sim** — `016_entry_highlights.sql` |
| `entries.organized_at timestamptz null` | Sim — mesma migration 016 |
| `entries.organizing_started_at timestamptz null` | Sim — mesma migration 016 |
| `entries.is_personal_project boolean not null default false` | Sim — mesma migration 016 |
| Vocabulário de contextos (`DISTINCT company`) | Não — query, sem coluna nova |
| Vocabulário de tags (`DISTINCT unnest(tags)`) | Não — query sobre coluna já existente |
| Rollup de `entries.tags` a partir de `entry_highlights.tags` | Não — lógica de aplicação, mesma coluna já existente |

**Conclusão**: a spec dizia "provavelmente sem migration" e pedia confirmação final aqui — a
confirmação é que **há sim uma migration nova** (`016`), mas mínima e estritamente aditiva (1
tabela nova + 3 colunas nullable/com default em `entries`), sem alterar nenhuma coluna existente
nem quebrar nenhum dado histórico (FR-032 continua servido pelas colunas legadas de `entries`
sem nenhuma migração de dado retroativa).
