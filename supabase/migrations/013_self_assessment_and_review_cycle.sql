-- Feature 019-autoavaliacao (modelo cockpit): formato `self_assessment` (autoavaliação ESCRITA pela
-- pessoa, persistida em `drafts`) + recorrência do ciclo de avaliação. Mudanças aditivas
-- (constituição III): reusa a tabela `drafts` e o lifecycle existentes; só amplia o domínio dos
-- CHECKs e adiciona duas colunas nullable em `profiles`.
--
-- Pré-requisitos: 009 (cria `drafts` com os CHECKs de `format`/`seed_type`/`status`), 010 (`format`
-- += 'mini_bio'), 011 (016 — `profiles.last_panel_seen`), 012 (017 — `entries.title`). O número 013
-- foi confirmado livre: existem DOIS arquivos `012` (`012_entry_title.sql` da 017, já em `main`, e
-- a versão antiga desta feature) — esta migration foi renumerada para 013 para resolver a colisão.
--
-- `drafts_format_check` / `drafts_seed_type_check` / `drafts_status_check` são os nomes que o Postgres
-- gera para os CHECKs inline da 009; `if exists` deixa os ALTERs idempotentes caso o nome divirja.

-- format += 'self_assessment' (a autoavaliação escrita pela pessoa vive aqui, isolada do espelho)
alter table public.drafts
  drop constraint if exists drafts_format_check;

alter table public.drafts
  add constraint drafts_format_check
  check (format in ('post', 'impact_summary', 'mini_bio', 'self_assessment'));

-- seed_type += 'period' (seed por intervalo de datas — ancora a trilha de evidências e o recap, US1)
alter table public.drafts
  drop constraint if exists drafts_seed_type_check;

alter table public.drafts
  add constraint drafts_seed_type_check
  check (seed_type in ('entry', 'theme', 'project', 'period'));

-- status += 'draft' — a autoavaliação é ESCRITA pela pessoa, então nunca nasce 'generated'. 'draft'
-- = rascunho em andamento/salvo pela pessoa; depois segue o lifecycle existente ('copied'/'discarded').
alter table public.drafts
  drop constraint if exists drafts_status_check;

alter table public.drafts
  add constraint drafts_status_check
  check (status in ('draft', 'generated', 'edited', 'copied', 'discarded'));

-- Recorrência do ciclo de avaliação (US2) — aditivo, nullable. Sem recorrência → gatilho não dispara.
alter table public.profiles
  add column if not exists review_cycle_months smallint,
  add column if not exists review_cycle_anchor date;
