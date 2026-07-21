create table public.preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moment text not null check (moment in ('entrevista', 'review', 'salario')),
  title text not null,
  body text not null check (char_length(body) between 1 and 12000),
  evidence_entry_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(evidence_entry_ids) <= 5)
);

create table public.preparation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'moment_selected', 'context_submitted', 'evidence_opened',
    'preparation_saved', 'conversation_shared'
  )),
  moment text check (moment in ('entrevista', 'review', 'salario')),
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.shared_chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moment text check (moment in ('entrevista', 'review', 'salario')),
  messages jsonb not null,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.preparations enable row level security;
alter table public.preparation_events enable row level security;
alter table public.shared_chat_feedback enable row level security;

create policy "own preparations select" on public.preparations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own preparations insert" on public.preparations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own preparations update" on public.preparations for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own preparations delete" on public.preparations for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "own preparation events insert" on public.preparation_events for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own preparation events select" on public.preparation_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "own shared feedback insert" on public.shared_chat_feedback for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own shared feedback select" on public.shared_chat_feedback for select to authenticated
  using ((select auth.uid()) = user_id);

create index preparations_user_created_idx on public.preparations(user_id, created_at desc);
create index preparation_events_user_created_idx on public.preparation_events(user_id, created_at desc);
create index shared_chat_feedback_user_created_idx on public.shared_chat_feedback(user_id, created_at desc);

grant select, insert, update, delete on public.preparations to authenticated;
grant select, insert on public.preparation_events to authenticated;
grant select, insert on public.shared_chat_feedback to authenticated;
