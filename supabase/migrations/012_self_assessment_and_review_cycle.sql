-- Feature 019-autoavaliacao: novo formato `self_assessment` + recorrência do ciclo de avaliação.
-- Mudanças aditivas (constituição III): reusa a tabela `drafts` e o lifecycle existentes; só amplia
-- o domínio dos CHECKs e adiciona duas colunas nullable em `profiles`.
-- Pré-requisitos: migration 009 (cria `drafts` com os CHECKs de `format` e `seed_type`),
-- 010 (estende `format` para 'mini_bio'), 011 (016 — `profiles.last_panel_seen`).
--
-- `drafts_format_check` / `drafts_seed_type_check` são os nomes que o Postgres gera para os CHECKs
-- inline das colunas na 009; `if exists` deixa os ALTERs idempotentes caso o nome divirja num ambiente.

-- format += 'self_assessment'
alter table public.drafts
  drop constraint if exists drafts_format_check;

alter table public.drafts
  add constraint drafts_format_check
  check (format in ('post', 'impact_summary', 'mini_bio', 'self_assessment'));

-- seed_type += 'period' (seed por intervalo de datas, US1)
alter table public.drafts
  drop constraint if exists drafts_seed_type_check;

alter table public.drafts
  add constraint drafts_seed_type_check
  check (seed_type in ('entry', 'theme', 'project', 'period'));

-- Recorrência do ciclo de avaliação (US2) — aditivo, nullable. Sem recorrência → gatilho não dispara.
alter table public.profiles
  add column if not exists review_cycle_months smallint,
  add column if not exists review_cycle_anchor date;
