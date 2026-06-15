-- Feature 015-refino-voz: estende `drafts.format` para aceitar 'mini_bio' (terceiro formato).
-- A mini-bio reusa o mesmo motor e lifecycle da 013 (sem tabela nova); só amplia o domínio do CHECK.
-- Pré-requisito: migration 009 (cria `drafts` com o CHECK original de `format`).
--
-- `drafts_format_check` é o nome que o Postgres gera para o CHECK inline da coluna `format` na 009;
-- `if exists` deixa o ALTER idempotente caso o nome divirja num ambiente.

alter table public.drafts
  drop constraint if exists drafts_format_check;

alter table public.drafts
  add constraint drafts_format_check
  check (format in ('post', 'impact_summary', 'mini_bio'));
