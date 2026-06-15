# Data Model: Motor de Voz + Geração (013)

Fundação compartilhada do bloco. Tudo aqui é reusado por 014 (hub) e 015 (refino).

## Persistência

### Tabela nova: `drafts` (migration `009_drafts.sql`)

Lifecycle de rascunho — uma linha por rascunho gerado, com status que evolui.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, `default gen_random_uuid()` |
| `user_id` | uuid | FK → `auth.users`, **RLS** `auth.uid() = user_id` |
| `format` | text | `'post'` \| `'impact_summary'` — `CHECK` |
| `seed_type` | text | `'entry'` \| `'theme'` \| `'project'` — `CHECK` |
| `seed_ref` | text | id da entrada / chave do tema / id do projeto (nullable se `theme` for string) |
| `angle` | text | o ângulo escolhido que guiou a geração |
| `body` | text | o texto do rascunho (o que vai pro clipboard) |
| `status` | text | `'generated'` \| `'edited'` \| `'copied'` \| `'discarded'` — `CHECK`, default `'generated'` |
| `voice_feedback` | text | `'soa'` \| `'nao_soa'` \| null — `CHECK` |
| `qa` | jsonb | o ângulo/perguntas que guiaram a geração (auditável) |
| `created_at` | timestamptz | default `now()` |
| `updated_at` | timestamptz | default `now()`, atualizado em edição |

**Índice**: `(user_id, created_at desc)` — para a listagem do hub (014).

**RLS** (espelha `entries`/`mirror_snapshots`):
- `select/insert/update/delete` apenas onde `auth.uid() = user_id`.
- Política de `insert` com `with check (auth.uid() = user_id)`.

> Constituição I: nenhum ID interno vaza em resposta de API; toda query filtra por `user_id`.

### Coluna nova: `profiles.voice_profile` (mesma migration `009`)

`voice_profile jsonb` — um registro de voz por usuário (1:1), nullable (default null até a primeira
calibração/inferência).

Forma do JSONB (validada por Zod ao ler/escrever):

```ts
{
  tone?: string                 // ex: "direto, caloroso, sem jargão"
  length_pref?: 'curto' | 'medio' | 'longo'
  samples: string[]             // 0 a 2 textos colados pelo usuário
  inferred_summary?: string     // síntese da voz a partir do raw_content (cacheada)
  updated_at: string            // ISO timestamp
}
```

## Tipos de aplicação (`src/types/content.ts`)

### `Draft`
Espelha a linha da tabela, em camelCase de leitura quando exposto à UI; o id interno não vaza além do
necessário para o cliente operar o próprio rascunho.

| Campo | Tipo |
|---|---|
| `id` | string |
| `format` | `'post' \| 'impact_summary'` |
| `seedType` | `'entry' \| 'theme' \| 'project'` |
| `seedRef` | string \| null |
| `angle` | string |
| `body` | string |
| `status` | `'generated' \| 'edited' \| 'copied' \| 'discarded'` |
| `voiceFeedback` | `'soa' \| 'nao_soa' \| null` |
| `createdAt` | string |

### `VoiceProfile`
`{ tone?: string; lengthPref?: 'curto'|'medio'|'longo'; samples: string[]; inferredSummary?: string; updatedAt: string }`

## Schemas Zod de saída do LLM (`src/lib/ai/content/schemas.ts`)

Cada formato valida a saída do Sonnet **antes** de persistir (constituição III). Padrão herdado de
`mirror/schemas.ts` (`validateMirror`).

### `postDraftSchema`
```ts
{
  variants: [                   // exatamente 2 variações
    {
      angle: string,            // o ângulo daquela variação
      body: string,             // o texto do post
      evidence_refs: string[],  // rótulos/ids das entradas citadas (rastreabilidade)
    }
  ]  // length 2
}
```

### `impactSummaryDraftSchema`
```ts
{
  variants: [                   // exatamente 2 variações
    {
      angle: string,
      body: string,             // resumo curto e factual
      evidence_refs: string[],
    }
  ]  // length 2
}
```

`validateDraftOutput(raw, format)` faz o parse com o schema do formato e lança em shape inválido — quem
chama não persiste nada parcial.

## Ruleset anti-IA (`src/lib/ai/content/validateRuleset.ts`)

`validateContentRuleset(text): ContentRulesetViolation[]` — determinístico, **sem IA**, espelhando
`validateMirrorRuleset`. Array vazio = passa.

### `ContentRulesetViolation`
| Campo | Tipo | Descrição |
|---|---|---|
| `assert` | number | nº da regra violada |
| `field` | string | onde (ex: `variant[0].body`) |
| `message` | string | descrição legível |

### Regras (herdadas do espelho, adaptadas a post/resumo)

| # | Regra | Escopo |
|---|---|---|
| 1 | Sem travessão (—) | body de cada variante |
| 2 | Sem buzzword banida (data-driven, proativo, jornada vaga, sinergia…) | body |
| 3 | Sem antítese ("não é X, é Y" / "deixou de ser X, virou Y") | body |
| 4 | Sem advérbio de ênfase vazio (exatamente, simplesmente, literalmente) | body |
| 5 | Sem jargão de IA / tradução do inglês (mover a agulha, destravar potencial, no fim das contas) | body |
| 6 | Sem jargão vazio de LinkedIn (humildemente animado, game changer, "bora?", "comente abaixo") | body |
| 7 | Número sempre com janela de tempo; sem número solto sugerindo cobrança | body |
| 8 | Sem gíria de elogio (arrasou, mandou bem, fera) | body |
| 9 | Brasilidade boba proibida (emoji, diminutivo fofo, metáfora de futebol/samba) | body |

> A lista de termos banidos é constante e centralizada (provável reuso/compartilhamento com a do
> espelho via um módulo comum, decidido na implementação para não duplicar). Evolui conforme saídas
> reais, como a do espelho.

## Regras de validação aplicadas (ordem)

1. **Forma** (Zod, `schemas.ts`): tipos, presença, exatamente 2 variantes.
2. **Conteúdo** (`validateContentRuleset`): as regras acima, determinísticas, sem IA.
3. Saída do LLM passa por ambas **antes** de exibir/persistir. Violação → 1 regeneração com feedback
   → senão, estado de erro honesto (sem persistir rascunho ruim).
4. **Evidência** (golden set): o output cita evidência real do seed (`evidence_refs` batem com o seed).

## Relação com o que já existe (reuso, sem alterar)

- `entries` — seed (`seed_type='entry'`) e fonte de `raw_content` para inferir voz.
- `mirror_snapshots.mirror.strength_themes` — seed de tema (`seed_type='theme'`).
- `profiles` — recebe a coluna `voice_profile` (única alteração de schema em tabela existente).
- `entry_embeddings` / `entry_evidences` — enriquecimento opcional de evidência (não bloqueante v1).
