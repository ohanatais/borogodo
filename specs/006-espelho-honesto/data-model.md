# Data Model: Espelho Honesto

## Entidade: Mirror (`src/types/mirror.ts`)

A síntese estruturada exibida ao usuário e persistida.

| Campo | Tipo | Descrição |
|---|---|---|
| `intro` | string | abertura personalizada (1 linha, com o nome) |
| `primary_strength` | MirrorSection | força principal |
| `invisible_skill` | MirrorSection | skill demonstrada mas nunca nomeada pela pessoa |
| `context_pattern` | MirrorSection | tipo de situação onde a pessoa brilha |
| `closing` | string | fechamento honesto **afirmativo** (sem "?") |
| `strength_themes` | string[] | 3–6 temas curtos de força (alimentam painel e captura) |

**MirrorSection**: `{ headline: string; evidence: string }`

> Mudança da 006: `closing` (afirmação) substituiu o campo legado `closing_question` (pergunta). A presença de `closing_question` é uma violação de ruleset.

## Entidade: RulesetViolation (`src/lib/ai/mirror/validateRuleset.ts`)

Resultado de uma falha de regra detectada pelo validador determinístico.

| Campo | Tipo | Descrição |
|---|---|---|
| `assert` | number | número da regra (1–9) violada |
| `field` | string | campo afetado (ex: `primary_strength.headline`) |
| `message` | string | descrição legível da violação |

`validateMirrorRuleset(mirror): RulesetViolation[]` — array vazio = passa em tudo.

### As 9 regras (asserts)

| # | Regra | Escopo |
|---|---|---|
| 1 | Sem travessão (—) | todos os campos de texto |
| 2 | Sem buzzword banida (data-driven, proativo, jornada…) | todos os campos |
| 3 | Sem marcador de skill (●○) | todos os campos |
| 4 | `closing` sem ponto de interrogação | closing |
| 5 | Sem padrão de antítese ("não é X, é Y") | todos os campos |
| 6 | Sem gíria de elogio (mandou bem, arrasou, fera) | todos os campos |
| 7 | No máximo 1 convite de métrica no espelho inteiro | todos os campos |
| 8 | Headlines de card não começam todos com "Você" | 3 headlines |
| 9 | `closing` presente e `closing_question` ausente | closing / legado |

## Persistência: `mirror_snapshots` (Supabase)

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users, **RLS** `auth.uid() = user_id` |
| `mirror` | jsonb | o Mirror completo |
| `primary_strength` | jsonb | atalho para o painel |
| `strength_themes` | text[] | atalho para indicadores/captura |
| `entry_count` | int | nº de entradas consideradas |
| `generated_at` | timestamptz | default now() |
| `resonated` | boolean | feedback "Sim/Nem tanto" |
| `feedback_text` | text | feedback livre opcional |

Índice: `(user_id, generated_at desc)`.

## Regras de validação aplicadas

- **Forma** (Zod, `schemas.ts`): tipos e presença dos campos.
- **Conteúdo** (`validateRuleset.ts`): as 9 regras acima, determinísticas, sem IA.
- A saída do LLM passa por ambas **antes** de ser persistida (constituição III).
