begin;

-- Fix Supabase linter errors for public tables with RLS disabled.
-- This is the safest baseline: enable RLS and rely on the default deny behavior
-- until explicit policies are added for anon/authenticated access.

alter table if exists public."_prisma_migrations" enable row level security;
alter table if exists public."PostSection" enable row level security;
alter table if exists public."Media" enable row level security;
alter table if exists public."Category" enable row level security;
alter table if exists public."Post" enable row level security;

commit;
