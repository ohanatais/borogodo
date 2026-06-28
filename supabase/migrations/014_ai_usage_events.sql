-- Feature 023-freio-de-custo: telemetria de custo de IA + estado de alerta diário.
-- Mudança aditiva (constituição III): duas tabelas novas, nenhuma alteração em tabelas existentes.
--
-- Numeração: existem DOIS arquivos `013` em main (013_entries_file_name.sql da 017 e
-- 013_self_assessment_and_review_cycle.sql da 019). 014 é o próximo número livre.
--
-- `ai_usage_events` é a fonte única de verdade do freio (023): limite por hora (count na janela),
-- gasto diário agregado (sum), gasto por usuário (ranking) e usuários ativos/travados.
-- Acesso é SERVER-ONLY via service-role (o guard em src/lib/ai/client.ts e o job de insight).
-- RLS habilitada sem policy para anon/authenticated: nenhum usuário final lê esta tabela.

create table if not exists public.ai_usage_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  action        text not null check (action in ('capture', 'insight', 'sufficiency', 'mirror', 'post', 'self_assessment', 'chat', 'voice')),
  role          text not null check (role in ('extraction', 'synthesis')),
  model         text not null,
  input_tokens  integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd      numeric(10, 5) not null default 0 check (cost_usd >= 0),
  created_at    timestamptz not null default now()
);

-- Contagem por hora do usuário (limite anti-robô) e varredura do dia.
create index if not exists ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at);
create index if not exists ai_usage_events_created_idx on public.ai_usage_events (created_at);
-- Filtrar ações de geração na janela de 1h.
create index if not exists ai_usage_events_action_created_idx on public.ai_usage_events (action, created_at);

alter table public.ai_usage_events enable row level security;
-- Sem policy: escrita e leitura só pelo service-role (RLS bloqueia anon/authenticated por padrão).

-- Idempotência dos e-mails de alerta operacional: no máximo um preventivo e um de teto por dia.
create table if not exists public.ai_daily_alert_state (
  day        date primary key,
  warned_at  timestamptz,
  capped_at  timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ai_daily_alert_state enable row level security;
-- Sem policy: operacional, server-only.
