-- Snapshot of the `creator_verifications` table that already exists on
-- prod (created ad-hoc during Singpass integration) but was never captured
-- as a migration file. Re-running this against prod would conflict, so
-- this migration is marked applied on the remote via `migration repair`
-- rather than executed — it exists so new environments (preview branches,
-- local dev) can recreate the table from scratch.
--
-- Why it exists: stores a one-row-per-creator record of a successful
-- Singpass MyInfo KYC. The `uinfin_hash` (SHA-256 of the UINFIN) is the
-- de-dup key — one person can only be verified against one profile, so
-- we can detect duplicate-account fraud without storing the raw UINFIN.
-- Raw UINFIN is never persisted; `verified_name`/`verified_dob` etc. are
-- the MyInfo response fields we need for payout compliance.

create table if not exists creator_verifications (
  profile_id     uuid        primary key references profiles(id) on delete cascade,
  method         text        not null check (method = 'singpass'),
  uinfin_hash    text        not null,
  verified_name  text        not null,
  verified_dob   date,
  nationality    text,
  residency      text,
  verified_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- One UINFIN → at most one profile. This is the anti-duplicate-account
-- guard — attempting to verify a second profile with the same person's
-- UINFIN will fail with a unique-violation.
create unique index if not exists creator_verifications_uinfin_hash_unique
  on creator_verifications (uinfin_hash);

alter table creator_verifications enable row level security;

-- Creators can see their own verification record (used to gate the
-- "Verified creator" badge / payout-setup flow).
create policy "Users can view own verification"
  on creator_verifications
  for select
  using (auth.uid() = profile_id);

-- Admins can audit any verification record.
create policy "Admins can view all verifications"
  on creator_verifications
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- The Singpass callback (server-only) writes through the service role.
create policy "Service role full access on verifications"
  on creator_verifications
  for all
  using (true)
  with check (true);
