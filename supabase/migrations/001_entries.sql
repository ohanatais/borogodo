-- Feature 003-capture-pipeline: tabela `entries` (espinha dorsal de dados do Borogodó)
-- Reusada por 004 (espelho), 005 (painel) e 006 (import LinkedIn).

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  what_i_did text not null,
  decision text,
  learning text,
  impact text,
  metric text,
  entry_date date,
  tags text[] default '{}',
  source text not null,         -- 'linkedin_pdf' | 'audio' | 'text' | 'chips' | 'image'
  raw_content text,
  company text,
  role_title text,
  role_start date,
  role_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.entries enable row level security;

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id);

create index entries_user_created_idx on public.entries(user_id, created_at desc);
