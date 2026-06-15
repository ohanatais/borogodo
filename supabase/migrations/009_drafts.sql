-- Feature 013-motor-de-voz: tabela `drafts` (lifecycle de rascunho de conteúdo) +
-- coluna `profiles.voice_profile` (JSONB, perfil de voz 1:1 por usuário).
-- Fundação compartilhada do bloco de Geração de Conteúdo (Presença); reusada por 014 e 015.

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('post', 'impact_summary')),
  seed_type text not null check (seed_type in ('entry', 'theme', 'project')),
  seed_ref text,
  angle text not null default '',
  body text not null,
  status text not null default 'generated'
    check (status in ('generated', 'edited', 'copied', 'discarded')),
  voice_feedback text check (voice_feedback in ('soa', 'nao_soa')),
  qa jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drafts enable row level security;

-- RLS: cada usuário só acessa os próprios rascunhos (espelha `entries`/`mirror_snapshots`).
-- Políticas explícitas por comando, com `with check` no insert/update (constituição I).
create policy "own drafts select" on public.drafts
  for select using (auth.uid() = user_id);
create policy "own drafts insert" on public.drafts
  for insert with check (auth.uid() = user_id);
create policy "own drafts update" on public.drafts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drafts delete" on public.drafts
  for delete using (auth.uid() = user_id);

-- Listagem do hub (014): rascunhos do usuário, mais recentes primeiro.
create index drafts_user_created_idx on public.drafts(user_id, created_at desc);

-- Perfil de voz por usuário (1:1), nullable até a primeira inferência/calibração.
alter table public.profiles
  add column if not exists voice_profile jsonb;
