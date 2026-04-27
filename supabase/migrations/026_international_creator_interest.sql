-- ============================================================
-- get that bread — International creator interest waitlist
-- Migration: 026_international_creator_interest.sql
-- ============================================================
-- Captures interest from non-Singapore creators who land on the site
-- and want to apply, before we have actual international onboarding
-- infrastructure (Stripe Connect availability, KYC for foreigners,
-- regional Terms). Lets us build a warm-leads list and email them
-- when (if) we open in their country.
--
-- Distinct from creator_profiles — these aren't onboarded creators,
-- they're prospects. No login, no campaigns, no payouts.
-- ============================================================

CREATE TABLE international_creator_interest (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  display_name        text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 100),
  country             text NOT NULL CHECK (char_length(country) BETWEEN 2 AND 60),
  project_description text CHECK (project_description IS NULL OR char_length(project_description) <= 1000),
  -- Where the user came from when they submitted (e.g.
  -- "/for-creators", "/for-creators/international?ref=apply"). Helps
  -- attribute which entry points actually convert.
  referrer            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  -- Admin sets this when they email the prospect back. Leave NULL
  -- until then so we can filter "uncontacted" trivially.
  contacted_at        timestamptz
);

CREATE INDEX idx_intl_interest_country ON international_creator_interest(country);
CREATE INDEX idx_intl_interest_created ON international_creator_interest(created_at DESC);
CREATE INDEX idx_intl_interest_uncontacted ON international_creator_interest(created_at DESC)
  WHERE contacted_at IS NULL;

-- ============================================================
-- RLS
-- ============================================================
-- The form posts via a service-role API route (so we can write
-- without an authed user), and the admin list page also uses
-- service role. Public users have no read or write here at all.

ALTER TABLE international_creator_interest ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon or authenticated. Service role
-- always bypasses RLS, so the API route + admin page work fine.
-- Adding policies here would risk exposing the prospect list.

COMMENT ON TABLE international_creator_interest IS
  'Waitlist for creators outside Singapore. Service-role-only access; no public RLS policies by design.';
