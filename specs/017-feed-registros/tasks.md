# Tasks: Feed de Registros (+ Grade-Faísca)

**Input**: Design documents em `/specs/017-feed-registros/`

**References**: [plan.md](plan.md) · [spec.md](spec.md) · [data-model.md](data-model.md) · [contracts/api-feed.md](contracts/api-feed.md) · [quickstart.md](quickstart.md)

**TDD obrigatório** (Constituição § VI): escrever o teste, confirmar que FALHA, então implementar.

---

## Phase 1: Setup

**Purpose**: Criar estrutura de pastas e garantir pré-requisitos antes de qualquer código de feature.

- [x] T001 Criar pastas `src/lib/feed/`, `src/lib/feed/__tests__/`, `src/components/features/feed/`, `src/app/api/feed/activity/`, `src/app/[locale]/(app)/registros/` (vazias, com `.gitkeep` se necessário)
- [x] T002 Rodar `/impeccable shape` para `/registros` — decisões cravadas em [shape.md](shape.md): célula=dia / linha=semana, símbolo ✦ com intensidade por tamanho+cor, faixa sticky vertical desktop / horizontal mobile, threshold 5 dias distintos/90d

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base que TODAS as user stories dependem — migration, tipos, extração, i18n, componente-base.

**⚠️ CRÍTICO**: Nenhuma user story começa antes desta fase estar completa.

- [x] T003 Confirmar número da migration (verificar última em `supabase/migrations/`), criar `supabase/migrations/01X_entry_title.sql` com `ALTER TABLE entries ADD COLUMN IF NOT EXISTS title TEXT` e `CREATE INDEX IF NOT EXISTS entries_user_entry_date_idx ON entries (user_id, entry_date DESC NULLS LAST)`
- [x] T004 Adicionar `title?: string | null` a `ExtractedEntry` em `src/types/entry.ts` (o campo é herdado por `Entry` automaticamente)
- [x] T005 [P] Criar `src/lib/feed/types.ts` com `FeedItem`, `FeedQuery`, `FeedAxis`, `ActivityCell`, `FeedPage` conforme [data-model.md](data-model.md)
- [x] T006 [P] Adicionar namespace `feed` em `src/messages/pt-BR.json` e espelhar stub em `src/messages/en.json` com todas as chaves de [data-model.md § i18n Keys](data-model.md)
- [x] T007 Adicionar `title` ao schema Zod de extração em `src/lib/ai/extraction/schemas.ts` (`z.string().max(80).optional()`)
- [x] T008 Atualizar prompt de extração em `src/lib/ai/extraction/prompts/linkedin.ts` (ou arquivo equivalente com `DOCUMENT_EXTRACTION_SYSTEM_PROMPT`) para instruir o Haiku a gerar `title`: string curta ≤80 chars que captura a essência do registro
- [x] T009 Criar `src/components/features/feed/EntryCard.tsx` — componente unificado (`variant: 'feed' | 'panel'`): colapsável (`aria-expanded`), título, metadados, botão "Usar" (`<UsarButton>`); variante `feed` exibe opção de excluir (AlertDialog de confirmação); variante `panel` omite excluir

**Checkpoint**: Migration pronta, tipos alinhados, extração gera `title`, i18n configurado, `<EntryCard>` renderizável isoladamente.

---

## Phase 3: US1 — Feed Cru de Registros (Priority: P1) 🎯 MVP

**Goal**: `/registros` lista todos os registros como cards colapsáveis com título, "Usar" funciona, exclusão com confirmação funciona.

**Independent Test**: Com conta QA (≥5 registros), abrir `/registros` → ver todos em cards com título → expandir → "Usar" abre geração → excluir um → some do feed.

### Testes (escrever ANTES da implementação — devem FALHAR primeiro)

- [x] T010 [P] [US1] Escrever teste unitário de `getFeedData` em `src/lib/feed/__tests__/getFeedData.test.ts`: retorna `FeedItem[]` paginado, título nunca vazio (fallback determinístico), filtra apenas registros do `userId` correto
- [x] T011 [P] [US1] Escrever teste unitário do endpoint `GET /api/feed` em `src/app/api/feed/__tests__/route.test.ts`: retorna 401 sem auth, 400 com `axis` inválido, 200 com shape correto de `FeedPage`

### Implementação US1

- [x] T012 [US1] Criar `src/lib/feed/getFeedData.ts`: query Supabase com cursor `(created_at, id)`, `FEED_PAGE_SIZE = 20`, projeção para `FeedItem`, fallback de `title` (`what_i_did.slice(0, 60).trim()`), extração de `thumbnail` do `evidences` JSONB
- [x] T013 [US1] Criar `src/app/api/feed/route.ts`: auth (`createServerClient` + `getUser`), parse e validação dos query params de `FeedQuery`, chama `getFeedData`, retorna `FeedPage` JSON
- [x] T014 [US1] Criar `src/app/[locale]/(app)/registros/page.tsx` (Server Component): lê search params iniciais, faz fetch server-side da primeira página, passa dados ao `<FeedPageClient>`
- [x] T015 [P] [US1] Criar `src/app/[locale]/(app)/registros/loading.tsx`: skeleton de Suspense para a página do feed
- [x] T016 [US1] Criar `src/components/features/feed/FeedPage.tsx` (Client Component): recebe primeira página via props, gerencia estado de paginação ("Carregar mais" → fetch `/api/feed?cursor=…`), lista `<EntryCard variant="feed">` com remoção otimista ao excluir
- [x] T017 [US1] Criar `src/components/features/feed/EmptyFeed.tsx`: estado de boas-vindas quando sem registros (título, texto, botão CTA para captura) — nunca página em branco
- [x] T018 [US1] Atualizar `src/components/features/painel/EntryItem.tsx` para ser wrapper de `<EntryCard variant="panel">` (mantém interface atual externamente)

**Checkpoint US1**: `/registros` funciona end-to-end. Testes T010–T011 passando. Validar cenários 1 e 2 do [quickstart.md](quickstart.md).

---

## Phase 4: US2 — Dois Eixos de Tempo (Priority: P1)

**Goal**: Toggle "Quando anotei" / "Quando aconteceu" com estado na URL; abrir URL direta reproduz o eixo.

**Independent Test**: Alternar toggle → URL muda → ordenação muda → abrir URL numa aba nova → mesmo eixo; entradas sem `entry_date` agrupadas ao final, nunca sumindo.

### Testes (escrever ANTES — devem FALHAR primeiro)

- [x] T019 [US2] Adicionar caso de teste em `src/lib/feed/__tests__/getFeedData.test.ts`: eixo `entry_date` ordena por `entry_date DESC NULLS LAST`; entradas sem `entry_date` aparecem ao final, nunca somem

### Implementação US2

- [x] T020 [US2] Atualizar `getFeedData` em `src/lib/feed/getFeedData.ts` para suportar `axis: 'entry_date'` — ordenar por `entry_date DESC NULLS LAST`, cursor por `(entry_date, id)`
- [x] T021 [US2] Atualizar `/api/feed` em `src/app/api/feed/route.ts` para validar e repassar parâmetro `axis`
- [x] T022 [US2] Criar toggle de eixo em `src/components/features/feed/FeedFilters.tsx` (Client Component inicial, apenas axis toggle): atualiza URL com `router.replace` ao mudar; lê estado da URL; labels em i18n (`feed.axis.created_at`, `feed.axis.entry_date`)
- [x] T023 [US2] Atualizar `src/app/[locale]/(app)/registros/page.tsx` para ler `axis` dos search params e passá-lo ao `<FeedPageClient>`; atualizar `<FeedPage.tsx>` para incluir `<FeedFilters>` e recarregar ao mudar eixo

**Checkpoint US2**: Testes T019 passando. Validar cenário 3 do [quickstart.md](quickstart.md).

---

## Phase 5: US3 — Título em Todo Card (Priority: P2)

**Goal**: Todo card tem título — IA para novos registros, fallback determinístico para antigos. Nenhum card vazio.

**Independent Test**: Criar captura nova → inspecionar `entries.title` no Supabase → título IA presente; abrir feed com registro antigo (sem título) → card exibe fallback, nunca vazio.

### Testes (escrever ANTES — devem FALHAR primeiro)

- [x] T024 [P] [US3] Adicionar caso de teste em `src/lib/feed/__tests__/getFeedData.test.ts`: `FeedItem.title` nunca é `null` ou `''` — fallback determinístico para registros sem `title` persistido
- [x] T025 [P] [US3] Adicionar caso de teste em `src/lib/ai/extraction/__tests__/schemas.test.ts` (ou criar): `title` presente no JSON extraído passa validação Zod; ausência de `title` é tratada graciosamente (campo opcional na validação, mas gerado pelo prompt)

### Implementação US3

- [x] T026 [US3] Verificar end-to-end: fazer captura de texto, inspecionar `SELECT title FROM entries ORDER BY created_at DESC LIMIT 1` no Supabase Studio local — confirmar que `title` está persistido (smoke test manual)
- [x] T027 [US3] Garantir que `<EntryCard>` exibe `item.title` (que já vem sem null de `getFeedData` graças ao fallback) — sem mudança extra de código se T009 foi implementado corretamente

**Checkpoint US3**: Testes T024–T025 passando. Validar cenários 4 e 5 do [quickstart.md](quickstart.md).

---

## Phase 6: US4 — Busca e Filtros (Priority: P2)

**Goal**: Busca textual + filtros combináveis (período, empresa, tags, com-métrica, origem) reduzem o feed ao subconjunto correto.

**Independent Test**: Buscar termo presente em uma entrada → só os matches aparecem; filtrar "Com métrica" + empresa → subconjunto correto; limpar → feed completo; busca com caractere suspeito → sem erro 500.

### Testes (escrever ANTES — devem FALHAR primeiro)

- [x] T028 [US4] Adicionar casos de teste em `src/lib/feed/__tests__/getFeedData.test.ts`: filtro `q` retorna só matches; `metricOnly` filtra; `company` filtra; filtros combináveis; busca com string suspeita (injeção) não quebra

### Implementação US4

- [x] T029 [US4] Atualizar `getFeedData` em `src/lib/feed/getFeedData.ts` para aplicar todos os filtros: `q` (`ilike` em `what_i_did`, `title`; `contains` em `tags`), `from`/`to` (range em `created_at` ou `entry_date` conforme eixo), `company` (ilike), `tags` (array contains), `metricOnly` (`not('metric', 'is', null)`), `source`
- [x] T030 [US4] Atualizar `/api/feed` em `src/app/api/feed/route.ts` para aceitar, validar (Zod) e repassar todos os params de filtro
- [x] T031 [US4] Expandir `src/components/features/feed/FeedFilters.tsx` com: input de busca textual (`q`), seletor de período (presets: hoje, semana, mês, trimestre + range), dropdown empresa, multi-select tags, checkbox "Com métrica", dropdown origem — tudo serializado na URL
- [x] T032 [US4] Adicionar estado "sem resultados" em `<FeedPage.tsx>`: quando `items.length === 0` e há filtros ativos, exibir mensagem honesta + botão limpar (nunca parece erro)

**Checkpoint US4**: Testes T028 passando. Validar cenário 6 do [quickstart.md](quickstart.md).

---

## Phase 7: US5 — Grade-Faísca (Priority: P2)

**Goal**: Grade de atividade estilo GitHub no topo do feed; faíscas nos dias com registro; clique filtra o feed; massa crítica controla visibilidade.

**Independent Test**: Conta com registros distribuídos → grade com faíscas nos dias corretos, células claras nos vazios → clicar faísca → feed filtra e URL atualiza; conta quase vazia → grade oculta ou contida.

### Testes (escrever ANTES — devem FALHAR primeiro)

- [x] T033 [US5] Criar `src/lib/feed/__tests__/getActivityData.test.ts`: retorna array esparso com `date` + `count`; só registros do `userId` correto; janela de dias respeitada
- [x] T034 [US5] Criar `src/app/api/feed/activity/__tests__/route.test.ts`: 401 sem auth, 200 com `ActivityCell[]`; parâmetro `window` fora do range (1–730) retorna 400

### Implementação US5

- [x] T035 [US5] Criar `src/lib/feed/getActivityData.ts`: query `SELECT DATE(created_at), COUNT(*) FROM entries WHERE user_id = $1 AND created_at >= NOW() - INTERVAL GROUP BY DATE(created_at) ORDER BY date ASC`; retorna `ActivityCell[]` esparso (só dias com count > 0)
- [x] T036 [US5] Criar `src/app/api/feed/activity/route.ts`: auth, valida `window` (1–730, default 365), chama `getActivityData`, retorna `ActivityCell[]`
- [x] T037 [US5] Criar `src/components/features/feed/ActivityGrid.tsx` (Client Component): símbolo ✦ (U+2726) por célula com tamanho+cor variando pelo count do dia (0→8px opacidade 0.3, 1→9px 0.85, 2–3→11px, 4+→13px roxo-jambo pleno); layout desktop = faixa vertical sticky 7col×52linhas mais recente no topo com label de mês; layout mobile = faixa horizontal 13 semanas scroll suave sem scrollbar; threshold `GRID_MIN_DISTINCT_DAYS = 5` dias distintos em 90d controla visibilidade; hover = scale 1.4 CSS 150ms; clique → `onCellClick(date)` → atualiza URL; ver [shape.md](shape.md) §8
- [x] T038 [US5] Integrar `<ActivityGrid>` em `src/components/features/feed/FeedPage.tsx`: fetch de `/api/feed/activity` ao montar; threshold de massa crítica (≥5 registros em dias distintos nos últimos 90 dias, constante `GRID_MIN_DISTINCT_DAYS = 5`); ocultar grid quando abaixo do threshold

**Checkpoint US5**: Testes T033–T034 passando. Validar cenário 7 do [quickstart.md](quickstart.md).

---

## Phase 8: US6 — Painel Aponta pro Feed (Priority: P2)

**Goal**: Painel exibe "Seus registros" (5 recentes) + "Ver tudo →" no lugar de TrajectoryHighlights; MiniTimeline mantido; filtro "Com métrica" no feed reproduz curadoria antiga.

**Independent Test**: Abrir `/painel` → "Seus registros" + "Ver tudo →" visíveis, sem TrajectoryHighlights; clicar "Ver tudo →" → `/registros`; MiniTimeline presente; filtro "Com métrica" no feed mostra os que teriam aparecido nos destaques.

### Testes (escrever ANTES — devem FALHAR primeiro)

- [x] T039 [US6] Adicionar/atualizar teste de `getPanelData` em `src/lib/panel/__tests__/getPanelData.test.ts` (ou criar): não retorna mais `highlights`; retorna `recentEntries` com 5 itens (incluindo `title`); shape correto

### Implementação US6

- [x] T040 [US6] Atualizar `getPanelData` em `src/lib/panel/getPanelData.ts`: remover query `highlightsRes`, aumentar limite de `recentRes` para 5, adicionar `title` ao `select` de `recentEntries`; remover `highlights` do tipo `PanelData`
- [x] T041 [US6] Atualizar `src/components/features/painel/RecentEntries.tsx`: exibir até 5 entradas (`MAX_VISIBLE_ENTRIES = 5`), adicionar link "Ver tudo →" (`/registros`) abaixo da lista — i18n key `feed.viewAll`
- [x] T042 [US6] Atualizar `src/app/[locale]/(app)/painel/page.tsx`: remover `<TrajectoryHighlights>` e sua importação; garantir que `<RecentEntries>` recebe os 5 recentes com `title`
- [x] T043 [US6] Marcar `src/components/features/painel/TrajectoryHighlights.tsx` para remoção: deletar o arquivo e remover quaisquer referências residuais

**Checkpoint US6**: Testes T039 passando. Validar cenário 8 do [quickstart.md](quickstart.md).

---

## Phase 9: Polish & Validação Final

**Purpose**: Revisão de design, qualidade e segurança antes do PR.

- [ ] T044 [P] Rodar `/impeccable audit` — checar design identity, acessibilidade, mobile-first, i18n completo, tokens do sistema usados (nenhum hex hardcoded)
- [ ] T045 [P] Rodar `/code-review high` — bugs, simplificação, eficiência em `getFeedData`, `getActivityData`, `<EntryCard>`, `<ActivityGrid>`, `<FeedFilters>`
- [ ] T046 Validar todos os 8 cenários do [quickstart.md](quickstart.md) manualmente (incluindo teste de injeção SQL e RLS com duas contas)
- [ ] T047 Rodar `pnpm test` — confirmar ≥80% cobertura nos módulos novos (`getFeedData`, `getActivityData`, `<EntryCard>`)
- [ ] T048 Rodar `/pr-review` — revisão multi-agente (segurança, qualidade, arquitetura, performance, requisitos, regressão) antes de abrir o PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Começa imediatamente — sem dependências
- **Phase 2 (Foundational)**: Após Phase 1 — **BLOQUEIA todas as user stories**
- **Phase 3 (US1) e Phase 4 (US2)**: Após Phase 2 — US2 depende de US1 (feed deve existir para adicionar toggle)
- **Phase 5 (US3)**: Pode rodar em paralelo com US2 após Phase 2 (não depende de US1/US2 para verificação de título)
- **Phase 6 (US4)**: Após US1 (os filtros operam sobre o feed cru)
- **Phase 7 (US5)**: Após US1 (a grade opera sobre o feed)
- **Phase 8 (US6)**: Após Phase 2 (independente do feed em si)
- **Phase 9 (Polish)**: Após todas as user stories desejadas

### User Story Dependencies

- **US1 (P1)**: Inicia após Phase 2 — núcleo do feed
- **US2 (P1)**: Depende de US1 (adiciona toggle ao feed existente)
- **US3 (P2)**: Inicia após Phase 2 — maioria do trabalho já feito em T007–T008
- **US4 (P2)**: Inicia após US1 (filtros sobre o feed)
- **US5 (P2)**: Inicia após US1 (grade sobre o feed)
- **US6 (P2)**: Inicia após Phase 2 (painel independente do feed)

### Within Each User Story

1. Escrever testes → confirmar que FALHAM
2. Implementar → testes passam
3. Integrar com componentes existentes
4. Validar checkpoint manualmente

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
Paralelo:
  T005 — criar src/lib/feed/types.ts
  T006 — adicionar i18n keys pt-BR.json + en.json
Sequencial após T004 e T007:
  T008 — atualizar prompt de extração
  T009 — criar <EntryCard> (depende de T005 para FeedItem)
```

### Phase 3 (US1)

```
Paralelo:
  T010 — teste unitário getFeedData
  T011 — teste unitário /api/feed route
  T015 — loading.tsx skeleton
Sequencial:
  T012 → T013 → T014 → T016 → T017 → T018
```

### Phases 5, 7, 8 (após US1)

```
Podem rodar em paralelo se houver capacidade:
  Phase 5 (US3) — title end-to-end
  Phase 7 (US5) — grade-faísca
  Phase 8 (US6) — painel
```

---

## Implementation Strategy

### MVP (US1 + US2 — P1)

1. Complete Phase 1: Setup (+ `/impeccable shape` T002)
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — `/registros` com feed cru + exclusão
4. Complete Phase 4: US2 — dois eixos na URL
5. **PARAR E VALIDAR**: cenários 1, 2, 3 do quickstart.md
6. Isso já entrega o núcleo de retenção ("ver a pilha crescer")

### Incremental

1. MVP (US1+US2) → validar → as P2s em paralelo ou sequencial
2. US3 é quase gratuito (extração já atualizada em Phase 2)
3. US6 (painel) pode ir junto com MVP — impacto pequeno e fecha o loop North Star

### Sequência recomendada para uma desenvolvedora só

```
Phase 1 → Phase 2 → US1 → US2 → US6 → US3 → US4 → US5 → Polish
```

US6 logo após o MVP porque muda o painel (visível à Ohana imediatamente) e é rápida.
US5 (grade-faísca) por último — maior complexidade visual, menor impacto de retenção sem massa crítica.

---

## Notes

- **[P]** = arquivos diferentes, sem dependência entre si — podem rodar em paralelo
- **[Story]** = user story a que a task pertence (rastreabilidade)
- TDD é não-negociável (Constituição §VI): testes falham antes de qualquer implementação
- Confirmar número da migration em T003 consultando `supabase/migrations/` na data de início de implementação
- Granularidade da grade (dia vs semana) é travada em T002 (`/impeccable shape`) — não codar `<ActivityGrid>` sem essa decisão
- `TrajectoryHighlights.tsx` deletado em T043 — confirmar que não há referências residuais antes de deletar
