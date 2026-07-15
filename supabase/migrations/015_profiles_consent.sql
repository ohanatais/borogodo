-- Feature 024-termos-privacidade: colunas de consentimento (LGPD) em profiles.
-- Aditiva e nullable-safe — zero risco para linhas existentes (nenhum backfill).
alter table profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version    text,
  add column if not exists marketing_consent boolean not null default false;
