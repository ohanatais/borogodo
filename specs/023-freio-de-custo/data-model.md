# Data Model: Freio de custo de IA

Migration aditiva **`014_ai_usage_events.sql`** (014 é o próximo número livre — há dois `013`).
Duas tabelas novas; nenhuma alteração em tabelas existentes.

## Tabela `ai_usage_events`

Um registro por chamada paga de IA. Fonte única de verdade para: limite/hora, custo diário
agregado, custo por usuário (ranking), usuários ativos e usuários travados.

| Coluna          | Tipo          | Notas |
|-----------------|---------------|-------|
| `id`            | `uuid` PK     | `default gen_random_uuid()` |
| `user_id`       | `uuid`        | FK `auth.users(id)` on delete cascade. Null só para chamadas de sistema sem usuário (evitar; insight tem usuário-alvo) |
| `action`        | `text`        | CHECK in (`capture`,`insight`,`mirror`,`post`,`self_assessment`,`chat`) |
| `role`          | `text`        | CHECK in (`extraction`,`synthesis`) — espelha o role do provider |
| `model`         | `text`        | model id efetivo (ex. `claude-sonnet-4-6`) — auditoria de custo |
| `input_tokens`  | `integer`     | `>= 0` |
| `output_tokens` | `integer`     | `>= 0` |
| `cost_usd`      | `numeric(10,5)`| custo calculado no momento do registro (`>= 0`) |
| `created_at`    | `timestamptz` | `default now()` |

**Índices:**
- `(user_id, created_at)` — contagem por hora do usuário (limite anti-robô).
- `(created_at)` — soma diária agregada e varredura do dia (ranking/ativos).
- `(action, created_at)` — filtrar ações de geração na janela de 1h.

**RLS:** habilitada. **Sem** policy de `select`/`insert`/`update`/`delete` para `anon`/
`authenticated` — escrita e leitura acontecem **server-side** (o guard usa o client do servidor; a
leitura para alertas é operacional). Nenhum usuário final lê esta tabela. (Confirmar no
`/speckit-tasks` se o insert precisa de service-role key ou se o server client autenticado basta;
o registro é do próprio `user_id` da requisição, então uma policy `insert ... with check (user_id
= auth.uid())` é uma alternativa segura — decidir na implementação, default: server-only.)

**Validação no boundary (antes do insert):** `action`/`role` são literais de união no TS; tokens e
custo derivados da resposta do provider. Nenhum input de usuário entra aqui — só telemetria de
chamada.

## Tabela `ai_daily_alert_state`

Idempotência dos e-mails de alerta — garante no máximo um preventivo e um de teto por dia.

| Coluna       | Tipo          | Notas |
|--------------|---------------|-------|
| `day`        | `date` PK     | dia (UTC) ao qual o estado se refere |
| `warned_at`  | `timestamptz` | quando o e-mail preventivo (limiar) foi enviado; null se ainda não |
| `capped_at`  | `timestamptz` | quando o e-mail de teto-atingido foi enviado; null se ainda não |
| `created_at` | `timestamptz` | `default now()` |

**RLS:** habilitada, server-only (igual acima). Operacional, sem leitura de usuário.

**Uso:** ao avaliar a trava após registrar um evento, o guard faz um upsert e checa/seta
`warned_at`/`capped_at` na mesma transação lógica para não duplicar e-mail sob concorrência (usar
`insert ... on conflict (day) do update ... where ai_daily_alert_state.warned_at is null`).

## Configuração (não é tabela — variáveis de ambiente)

Lidas em `src/lib/ai/cost/limits.ts`, com defaults e validação de número.

| Env                       | Default | Significado |
|---------------------------|:-------:|-------------|
| `AI_RATE_LIMIT_PER_HOUR`  | `10`    | máx. de ações de geração por usuário por hora |
| `AI_DAILY_CAP_USD`        | `10`    | teto diário de gasto total de IA (US$) |
| `AI_DAILY_WARN_RATIO`     | `0.7`   | fração do teto que dispara o e-mail preventivo (0–1) |
| `OPS_ALERT_EMAIL`         | `admin@borogodo.ai` | destinatário dos alertas |
| `RESEND_API_KEY`          | —       | credencial de envio (secret; nunca `NEXT_PUBLIC_`) |

## Consultas derivadas (em `src/lib/db/aiUsage.ts`)

Sem tabelas novas além das duas acima — tudo deriva de `ai_usage_events`:

- **Contagem por hora (limite):** `count(*)` onde `user_id = :uid` e `action` ∈ geração e
  `created_at > now() - interval '1 hour'`.
- **Custo diário agregado (trava/limiar):** `sum(cost_usd)` onde `created_at >= date_trunc('day', now())`.
- **Ranking de consumo (e-mail):** `sum(cost_usd) group by user_id order by desc` no dia, juntando
  e-mail via `auth.users` (só para o e-mail operacional ao controlador).
- **Usuários ativos hoje (e-mail):** `count(distinct user_id)` no dia.
- **Usuários travados hoje (e-mail):** `user_id`s cuja contagem de geração na última hora ≥ limite
  (ou que receberam bloqueio registrado no dia).

## Entidades → requisitos

| Entidade da spec                  | Materialização |
|-----------------------------------|----------------|
| Uso de geração por usuário        | `count` em `ai_usage_events` (janela 1h) |
| Gasto de IA por usuário (do dia)  | `sum(cost_usd) group by user_id` no dia |
| Gasto diário de IA (agregado)     | `sum(cost_usd)` no dia |
| Configuração de limites           | env vars (`limits.ts`) |
| (idempotência de alerta)          | `ai_daily_alert_state` |
