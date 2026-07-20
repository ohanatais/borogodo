# Data Model: Preparação Conversacional

## `preparations`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK gerada |
| `user_id` | uuid | FK auth.users, obrigatório |
| `moment` | text | entrevista, review ou salario |
| `title` | text | título curto derivado do momento/data |
| `body` | text | resposta explicitamente salva, 1..12000 caracteres |
| `evidence_entry_ids` | uuid[] | somente registros do próprio usuário, máximo 5 |
| `created_at`, `updated_at` | timestamptz | auditoria |

RLS: select/insert/update/delete apenas quando `(select auth.uid()) = user_id`. Índice
`(user_id, created_at desc)`. A API valida posse de todos os IDs antes do insert.

## `preparation_events`

| Campo | Tipo | Regra |
|---|---|---|
| `id`, `user_id` | uuid | identidade e posse |
| `event_name` | text | allowlist fechada |
| `moment` | text nullable | enum de momento |
| `properties` | jsonb | booleanos, números e enums; nenhum texto livre |
| `created_at` | timestamptz | auditoria |

Eventos: `moment_selected`, `context_submitted`, `evidence_opened`, `preparation_saved`,
`conversation_shared`. Retenção operacional poderá ser definida fora deste MVP.

## `shared_chat_feedback`

| Campo | Tipo | Regra |
|---|---|---|
| `id`, `user_id` | uuid | identidade e posse |
| `moment` | text nullable | contexto |
| `messages` | jsonb | array validado, máximo 20 mensagens/2000 caracteres cada |
| `consented_at` | timestamptz | obrigatório |
| `created_at` | timestamptz | auditoria |

Não há leitura pelo cliente após envio. RLS permite insert do próprio usuário; select fica restrito
ao próprio usuário no banco para portabilidade futura, mas nenhuma UI de histórico é criada.

## Evidência enriquecida (não persistida)

Projeção de `entries`: `entryId`, `title`, `label`, `company`, `date`, `metric`, `impact`, `proofs`.
`proofs` preserva os itens existentes `{type: url|image, value, label}`. Só IDs declarados em
`evidenceRefs` e pertencentes ao top-K recuperado são retornados.
