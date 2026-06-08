-- Feature 004-mirror-generation: tabela `mirror_snapshots` (síntese profunda via Sonnet)
-- Reusada por 005 (indicadores do painel) e 006 (revelação do onboarding).

create table public.mirror_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mirror jsonb not null,
  primary_strength jsonb,
  strength_themes text[] default '{}',
  entry_count int not null,
  generated_at timestamptz default now(),
  resonated boolean,
  feedback_text text
);

alter table public.mirror_snapshots enable row level security;

create policy "own mirror" on public.mirror_snapshots
  for all using (auth.uid() = user_id);

create index mirror_snapshots_user_idx on public.mirror_snapshots(user_id, generated_at desc);
