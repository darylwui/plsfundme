-- Defense-in-depth: enforce one escrow release per (campaign, milestone)
-- at the database level.
--
-- The application code in `app/api/campaigns/[campaignId]/milestone-approve`
-- already guards against double-approval by checking
-- `submission.status !== 'pending'` before inserting an
-- `escrow_releases` row. That works under normal use, but it's a
-- read-then-write race window — two admins clicking "approve" at the
-- same millisecond, or a network retry that re-fires the POST, could
-- both pass the guard and insert duplicate rows.
--
-- Each `escrow_releases` row triggers a Stripe transfer to the
-- creator, so a duplicate row releases real money twice. With launch
-- imminent, the application-level idempotency is not enough — the
-- database needs to refuse the second insert too.
--
-- Pre-launch the table is empty in prod, so the constraint adds
-- cleanly. If a duplicate ever existed, this migration would fail
-- loudly, which is the right behavior — a duplicate is the bug.

ALTER TABLE escrow_releases
  ADD CONSTRAINT escrow_releases_campaign_milestone_unique
  UNIQUE (campaign_id, milestone_number);
