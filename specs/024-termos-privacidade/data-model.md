# Data Model: Termos, Privacidade e Consentimento

## Mudança de schema

Migration aditiva `supabase/migrations/015_profiles_consent.sql`. Todas as colunas em `profiles` são
aditivas e seguras para linhas existentes (nullable ou com default), portanto zero risco de backfill.

### `profiles` (colunas adicionadas)

| Coluna | Tipo | Nulo? | Default | Descrição |
|---|---|---|---|---|
| `terms_accepted_at` | `timestamptz` | sim | `null` | Momento em que a conta aceitou os termos. `null` = nunca aceitou (contas antigas). |
| `terms_version` | `text` | sim | `null` | Versão dos termos aceita (ex.: `"2026-07"`). Comparada com `CURRENT_TERMS_VERSION` pelo gate. `null` ou divergente → exige re-aceite. |
| `marketing_consent` | `boolean` | não | `false` | Opt-in de comunicações de marketing. **Nunca pré-marcado.** Revogável. |

**RLS**: inalterada. As políticas existentes de `profiles` (usuário lê/atualiza a própria linha via
`auth.uid() = id`) já cobrem estas colunas. As server actions escrevem sempre a linha do próprio usuário
autenticado; nenhuma política nova é necessária.

**Índices**: nenhum. As colunas são lidas junto do perfil (por PK `id`); não há consulta por versão/consent
que justifique índice.

### SQL (referência — a implementação vai para a migration)

```sql
alter table profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version    text,
  add column if not exists marketing_consent boolean not null default false;
```

## Entidades conceituais

### Registro de aceite de termos
Representado pelo par (`terms_accepted_at`, `terms_version`) na linha de `profiles`. É o artefato
auditável do consentimento contratual. Invariantes:
- Se `terms_version` = `CURRENT_TERMS_VERSION`, a conta está em dia (não vê gate).
- Se `terms_version` é `null` ou ≠ `CURRENT_TERMS_VERSION`, a conta precisa (re)aceitar.
- `terms_accepted_at` acompanha sempre a última gravação de `terms_version`.

### Preferência de marketing
Representada por `marketing_consent`. Desacoplada do aceite de termos. Invariantes:
- Default `false` em toda conta nova.
- Só vira `true` por ato afirmativo do usuário (checkbox no cadastro por e-mail ou pergunta no
  onboarding ou toggle nas configurações).
- Revogável a qualquer momento (`true` → `false`).

### Versão vigente da política
Não é dado de banco — é a constante `CURRENT_TERMS_VERSION` em `src/lib/legal/policy.ts` (fonte única).
Dispara re-consentimento ao mudar.

## Tipo TypeScript

`src/types/profile.ts` — `Profile` ganha:

```typescript
export type Profile = {
  // ...campos existentes...
  terms_accepted_at: string | null
  terms_version: string | null
  marketing_consent: boolean
}
```
