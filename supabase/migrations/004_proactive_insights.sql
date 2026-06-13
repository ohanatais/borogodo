-- Feature 005-panel-dashboard: tabela `proactive_insights` (inteligência proativa do painel)
-- Preenchida pelo job `triggerProactiveInsight` (stub no-op desde 003-capture-pipeline).

create table public.proactive_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,         -- 'invisible_skill' | 'emerging_pattern' | 'connection' | 'evidence_gap'
  headline text not null,
  body text not null,
  entry_ids uuid[] default '{}',
  seen boolean default false,
  generated_at timestamptz default now()
);

alter table public.proactive_insights enable row level security;

create policy "own insights" on public.proactive_insights
  for all using (auth.uid() = user_id);

create index proactive_insights_user_unseen_idx
  on public.proactive_insights(user_id, seen, generated_at desc);
