-- Keep a highlight attached to an entry owned by the same authenticated user.
-- The FK alone enforces existence, not ownership.
drop policy if exists "own entry highlights insert" on public.entry_highlights;
drop policy if exists "own entry highlights update" on public.entry_highlights;
drop policy if exists "own entry highlights select" on public.entry_highlights;

create policy "own entry highlights select" on public.entry_highlights
  for select using (
    auth.uid() = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
  );

create policy "own entry highlights insert" on public.entry_highlights
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
  );

create policy "own entry highlights update" on public.entry_highlights
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
  ) with check (
    auth.uid() = user_id
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = auth.uid())
  );
