-- ============================================================
-- get that bread — Security hardening
-- Migration: 031_security_hardening.sql
--
-- Three fixes from the pre-launch security review:
--
-- 1. Drop two RLS policies that were created without a `TO
--    service_role` clause. Postgres defaults a missing TO to PUBLIC,
--    so the policies leaked full read/write of creator_profiles
--    (creator KYC + Singpass identifiers) and creator_verifications
--    (hashed UINFIN + MyInfo PII) to anon and authenticated. Service
--    role bypasses RLS by definition and does not need a policy.
--
-- 2. Revoke EXECUTE on the SECURITY DEFINER pledge / reward / cron
--    accounting functions from PUBLIC, anon, and authenticated.
--    These functions mutate projects and rewards with no caller
--    check; with the default PUBLIC EXECUTE grant they were
--    callable as RPCs by anyone holding the public anon key. They
--    should be reachable only from the Stripe webhook (service
--    role) and pg_cron (postgres role) paths.
--
-- 3. Add `amount_refunded_sgd` to pledges so the charge.refunded
--    webhook handler can decrement project totals by the actual
--    refund delta instead of the full pledge amount on every
--    event. Without this column, a $100 pledge that gets refunded
--    in two parts ($30 + $70) decrements totals by $200 because
--    every refund event subtracts the full pledge amount.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Drop the open "service role full access" policies.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "Service role full access" ON creator_profiles;
DROP POLICY IF EXISTS "Service role full access on verifications" ON creator_verifications;

-- ------------------------------------------------------------
-- 2. Revoke RPC EXECUTE on accounting functions, re-grant only to
--    service_role. pg_cron runs as postgres which bypasses GRANT.
-- ------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION increment_pledge_totals(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_pledge_totals(uuid, numeric) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION increment_pledge_totals(uuid, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION decrement_pledge_totals(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION decrement_pledge_totals(uuid, numeric) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION decrement_pledge_totals(uuid, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION claim_reward_slot(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION claim_reward_slot(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION claim_reward_slot(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION release_reward_slot(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION release_reward_slot(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION release_reward_slot(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION check_stretch_goals(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION check_stretch_goals(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION check_stretch_goals(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION process_expired_campaigns() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_expired_campaigns() FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION process_expired_campaigns() TO service_role;

-- ------------------------------------------------------------
-- 3. Track cumulative refunded amount per pledge so the webhook
--    handler can compute the actual refund delta.
-- ------------------------------------------------------------

ALTER TABLE pledges
  ADD COLUMN IF NOT EXISTS amount_refunded_sgd numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (amount_refunded_sgd >= 0);
