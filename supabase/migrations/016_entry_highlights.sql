-- Feature 026-organizar-destaques: tabela `entry_highlights` (destaques dentro de uma fonte)
-- + colunas aditivas em `entries` para o ciclo de vida de organização e contexto.
-- Ver specs/026-organizar-destaques/data-model.md para o raciocínio completo.

alter table public.entries
  add column if not exists organized_at timestamptz,
  add column if not exists organizing_started_at timestamptz,
  add column if not exists is_personal_project boolean not null default false;

create table public.entry_highlights (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  metric text,
  impact text,
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entry_highlights enable row level security;

-- RLS: policies explícitas por comando (mesmo padrão de `drafts`, migration 009) — mais fácil
-- de auditar por operação do que uma única policy `for all`.
create policy "own entry highlights select" on public.entry_highlights
  for select using (auth.uid() = user_id);
create policy "own entry highlights insert" on public.entry_highlights
  for insert with check (auth.uid() = user_id);
create policy "own entry highlights update" on public.entry_highlights
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own entry highlights delete" on public.entry_highlights
  for delete using (auth.uid() = user_id);

-- Leitura ordenada dos destaques de uma fonte (expandir o card).
create index entry_highlights_entry_position_idx
  on public.entry_highlights(entry_id, position);

-- Vocabulário de tags (Story 6) e consultas futuras "todos os destaques da pessoa".
create index entry_highlights_user_idx
  on public.entry_highlights(user_id);
