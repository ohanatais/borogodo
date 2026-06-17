# Data Model — Autoavaliação de Desempenho (019)

Reuso pesado do modelo da 013–016. As mudanças são **aditivas**: um novo valor de `format`, um novo
`SeedType`, e duas colunas de recorrência em `profiles`. Nenhuma tabela nova.

## Entidades

### Draft (`drafts`) — evolução, sem nova coluna

Reusa a tabela e o lifecycle existentes (`generated` / `edited` / `copied` / `discarded`) e a RLS.

- **`format`**: passa a aceitar `'self_assessment'` além de `'post'`, `'impact_summary'`, `'mini_bio'`
  (extensão do CHECK na migration 012).
- **`seed_type`**: passa a aceitar `'period'` além de `'entry'`, `'theme'`, `'project'`.
- **`seed_ref`**: para `period`, codifica o intervalo (`period:::<from>:::<to>`, datas ISO).
- **`body`**: para `self_assessment`, contém a autoavaliação **estruturada por seções** (entregas,
  impacto, evolução, pontos a desenvolver) como texto puro com cabeçalhos de seção (ver research D1).

### PeriodSeed (conceitual — novo loader `loadPeriodSeed`)

Não é tabela; é a evidência agregada de um **intervalo de datas**.

- **Entrada:** `userId`, `from` (ISO date), `to` (ISO date).
- **Fonte:** `entries` do usuário no intervalo (`entry_date` quando houver, senão `created_at`),
  escopada por `user_id` (RLS).
- **Limite seguro:** prioriza as entradas mais recentes/relevantes do intervalo até um teto nomeado
  (na linha do `MAX_THEME_EVIDENCE = 12`), para não estourar o contexto do LLM.
- **Saída:** `SeedEvidence { seedSummary, evidence: EvidenceItem[] }` (mesmo tipo dos outros seeds).
- **Validação:** range válido (datas parseáveis, `from <= to`); intervalo vazio → `SeedEvidence` com
  `evidence: []`, que o prompt trata como base limitada (não fabrica — FR-006).

### ReviewCycle / Recorrência (`profiles` — colunas aditivas)

Config 1:1 com o usuário para o gatilho de calendário (US2).

- **`review_cycle_months`** `smallint`, nullable — periodicidade do ciclo. Default conceitual
  trimestral/semestral, **editável** pela pessoa. `null` = sem recorrência (gatilho não dispara).
- **`review_cycle_anchor`** `date`, nullable — âncora a partir da qual o próximo ciclo é calculado.
- **Regra:** sem `review_cycle_months`/`anchor` → `getReviewCycleSignal` não dispara; geração sob
  demanda (US1) permanece sempre disponível (FR-009).

### DevelopmentArea (conceitual — seção do output, não persistida à parte)

Um "ponto a desenvolver" dentro do `body`, ancorado em **sinal honesto** (força "Emergente" não
consolidada / tema com pouca evidência) **ou** em **intenção informada** pela pessoa. **Nunca**
fraqueza inventada (FR-005, garantido pelo prompt + ruleset).

## Migration 012 (esboço)

`supabase/migrations/012_self_assessment_and_review_cycle.sql` — aditiva, idempotente:

```sql
-- 019-autoavaliacao: novo formato + recorrência do ciclo de avaliação
alter table drafts
  drop constraint if exists drafts_format_check;
alter table drafts
  add constraint drafts_format_check
  check (format in ('post', 'impact_summary', 'mini_bio', 'self_assessment'));

alter table profiles
  add column if not exists review_cycle_months smallint,
  add column if not exists review_cycle_anchor date;
```

> Confirmar o `seed_type` em `drafts`: se houver CHECK em `seed_type`, estendê-lo para `'period'` na
> mesma migration (verificar na 009 durante a implementação).

## Tipos (`src/types/content.ts`)

```ts
export type DraftFormat = 'post' | 'impact_summary' | 'mini_bio' | 'self_assessment'
export type SeedType = 'entry' | 'theme' | 'project' | 'period'
```

(Demais tipos — `DraftVariant`, `Draft`, lifecycle — reusados sem mudança.)
