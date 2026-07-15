# Data Model: Organizar + Destaques

Ver `research.md` para a decisão e o raciocínio completo por trás de cada mudança de schema.
**Uma migration nova**: `016_entry_highlights.sql` (tabela nova + colunas aditivas em `entries`,
nenhuma alteração destrutiva).

## Entidade: `entries` (tabela `public.entries`) — passa a representar a FONTE

Já existe desde `001_entries.sql`. Colunas relevantes e o que muda nesta feature:

| Coluna | Tipo | Status | Papel nesta feature |
|---|---|---|---|
| `id`, `user_id` | `uuid` | inalterado | identidade da fonte |
| `raw_content` | `text` | inalterado | texto cru verbatim (FR-012) — nunca reescrito por organização |
| `what_i_did`, `title` | `text` | legado, preservado | continuam preenchidos no salvamento (025); para fontes SEM destaque (FR-032), servem como o "destaque único implícito" no feed |
| `company` | `text`, nullable | **reuso ampliado** | agora é o valor de contexto resolvido (empresa nomeada, existente ou via "Outro") — nível FONTE (FR-014), nunca por destaque |
| `is_personal_project` | `boolean not null default false` | **novo** | `true` = pílula "Projeto pessoal" selecionada — contexto resolvido, mas sem empresa (FR-003 acceptance #3) |
| `entry_date` | `date`, nullable | inalterado | período no nível da FONTE (FR-014); preenchido só por seleção manual ou sinal textual explícito (FR-006) |
| `tags` | `text[] default '{}'` | **reuso como rollup** | união das tags de todos os `entry_highlights` da fonte (ver `research.md` §4); fonte de verdade direta só quando não há destaque (legado) |
| `metric`, `impact` | `text`, nullable | legado, preservado | não mais preenchidos por organização em fontes novas (esses campos migram para `entry_highlights`); seguem existindo para fallback de fontes antigas (FR-032) e edição manual pré-025 |
| `organized_at` | `timestamptz null` | **novo** | `null` = nunca organizado com sucesso; preenchido no sucesso de uma organização (manual ou assíncrona) |
| `organizing_started_at` | `timestamptz null` | **novo** | guarda de concorrência (FR-031) + sinal do estado transitório "organizando…" (FR-011); limpo (`null`) ao final (sucesso ou falha) |
| `evidences` | `jsonb` | inalterado | anexos da fonte (migration 007), acessíveis ao expandir o card (FR-026) |

**Estado de organização (derivado, não é uma coluna de enum)**:
- **Não organizado (transitório)**: `organized_at IS NULL` e `organizing_started_at IS NULL`.
- **Organizando…**: `organizing_started_at IS NOT NULL` e recente (dentro de um timeout curto,
  ex. 60s — além disso trata-se como falha travada e permite nova tentativa).
- **Organizado**: `organized_at IS NOT NULL`.

**Estado de contexto (derivado)**:
- **Não identificado**: `company IS NULL AND is_personal_project = false` (FR-008).
- **Resolvido — empresa**: `company IS NOT NULL`.
- **Resolvido — projeto pessoal**: `is_personal_project = true`.

## Entidade nova: `entry_highlights` (tabela `public.entry_highlights`)

```sql
create table public.entry_highlights (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  metric text,
  impact text,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

| Coluna | Regra |
|---|---|
| `entry_id` | FK obrigatória — um destaque sempre pertence a exatamente uma fonte (FR-014) |
| `user_id` | denormalizado da fonte, para RLS simétrica a `entries` (ver `research.md` §1) |
| `title` | editável (FR-020); gerado no formato substantivo-primeiro/outcome-first quando por IA (FR-019); pode ficar vazio até a organização rodar ou até edição manual |
| `metric`, `impact` | opcionais — ausência de métrica é válida (FR-018), nunca tratada como erro |
| `tags` | tags do destaque (FR-015/FR-022/FR-023/FR-024) — a união de todos os destaques de uma fonte popula o rollup `entries.tags` (ver acima) |
| `position` | ordem de exibição dentro da fonte — cresce a cada "+ adicionar destaque" (FR-016) ou destaque gerado pela organização, na ordem de criação |

**Validação de conteúdo** (aplicação, não constraint de banco): `tags` de um destaque nunca é um
adjetivo genérico isolado (FR-024) — validado no schema Zod da extração (`schemas.ts`), não é uma
regra de banco (edição manual do usuário não passa por essa validação, por design — a pessoa pode
digitar o que quiser no campo editável).

**RLS**:
```sql
alter table public.entry_highlights enable row level security;

create policy "own entry highlights select" on public.entry_highlights
  for select using (auth.uid() = user_id);
create policy "own entry highlights insert" on public.entry_highlights
  for insert with check (auth.uid() = user_id);
create policy "own entry highlights update" on public.entry_highlights
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own entry highlights delete" on public.entry_highlights
  for delete using (auth.uid() = user_id);
```

Policies explícitas por comando (mesmo padrão de `drafts`, migration 009) — não uma única
policy `for all` (mais fácil de auditar por operação, e evita `with check` implícito faltando em
`update`/`insert`).

**Índices**:
```sql
create index entry_highlights_entry_position_idx
  on public.entry_highlights(entry_id, position);
create index entry_highlights_user_idx
  on public.entry_highlights(user_id);
```

`(entry_id, position)` serve a leitura ordenada dos destaques de uma fonte (FR-026, expandir o
card). `user_id` sozinho serve o vocabulário de tags (Story 6) e qualquer consulta futura de
"todos os destaques da pessoa" sem passar por `entries`.

## Vocabulário de contextos da pessoa (não persistido como tabela)

Derivado por query, confirmando a Assumption da spec:
```sql
select distinct company from entries
where user_id = :userId and company is not null
order by company;
```
"Projeto pessoal" e "Outro" são valores fixos da UI (Story 2), não vêm do banco. Selecionar
"Outro" e nomear um valor novo simplesmente grava esse texto em `entries.company` — no próximo
registro, essa query já o traz de volta como pílula (FR-005), sem tabela nova.

## Vocabulário de tags da pessoa (não persistido como tabela)

```sql
select distinct unnest(tags) as tag from entries
where user_id = :userId
order by tag;
```
Como `entries.tags` é mantido como rollup sincronizado com `entry_highlights.tags` (ver
`research.md` §4), esta única query já cobre tanto fontes organizadas (destaques) quanto fontes
legadas sem destaque (FR-032).

## Ciclo de vida de um registro (fonte) — resumo

1. **Criado** (salvo pelo drawer, 025) — `organized_at = null`, `company/is_personal_project`
   conforme seleção manual no drawer (se houver) ou `null/false`, nenhum `entry_highlights` ainda.
2. **Organizando…** — `organizing_started_at` setado (manual "Organizar" ou disparo assíncrono no
   salvar, FR-009).
3. **Organizado** — `organized_at` setado, `organizing_started_at = null`, um ou mais
   `entry_highlights` criados (nunca zero — FR-018/US4 acceptance #6 garantem ao menos um destaque
   mesmo sem métrica), `company`/`entry_date` preenchidos SE ainda vazios (FR-002/FR-006).
4. **Falha** — `organizing_started_at = null` novamente (sem `organized_at`), fonte permanece
   visível e íntegra (FR-030); pessoa pode tentar organizar de novo manualmente.
5. **Edição manual** (a qualquer momento, em qualquer estado) — edita um campo de destaque, o
   título, ou a pílula de contexto; esse valor nunca é sobrescrito por uma organização futura
   (FR-002/FR-004/FR-020), pois a organização só preenche campos vazios.

## Entidades legadas (fora do escopo de mudança direta, mas referenciadas)

- **`Entry` / `ExtractedEntry`** (`src/types/entry.ts`): tipos TypeScript existentes, estendidos
  (não quebrados) — ver `contracts/types.md` para os novos tipos `EntryHighlight`/`SourceStatus`.
- **`getFeedData`/`FeedItem`** (`src/lib/feed/`): a query e o tipo ganham os campos novos
  necessários ao card de fonte (FR-025/FR-027): contagem de destaques, estado de organização e de
  contexto — ver `contracts/feed.md`.
