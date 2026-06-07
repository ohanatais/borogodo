-- Feature 004-mirror-generation: garante `profiles.onboarding_completed`
-- (especificada em 002-user-auth, mas sem migration commitada — provavelmente aplicada manualmente).

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;
