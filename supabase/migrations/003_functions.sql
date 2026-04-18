-- ============================================================
-- get that bread — Database Functions & Scheduled Jobs
-- Migration: 003_functions.sql
-- ============================================================

-- ============================================================
-- FUNCTION: increment_pledge_totals
-- Called after a pledge is authorized/captured to update
-- denormalized counters on the projects row atomically.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_pledge_totals(
  p_project_id  uuid,
  p_amount_sgd  numeric
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET
    amount_pledged_sgd = amount_pledged_sgd + p_amount_sgd,
    backer_count       = backer_count + 1,
    updated_at         = now()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: decrement_pledge_totals
-- Called when a pledge is released/refunded to reverse counters.
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_pledge_totals(
  p_project_id  uuid,
  p_amount_sgd  numeric
)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET
    amount_pledged_sgd = GREATEST(0, amount_pledged_sgd - p_amount_sgd),
    backer_count       = GREATEST(0, backer_count - 1),
    updated_at         = now()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: claim_reward_slot
-- Atomically increments claimed_count and validates availability.
-- Returns false if the reward is full (caller should abort pledge).
-- ============================================================

CREATE OR REPLACE FUNCTION claim_reward_slot(p_reward_id uuid)
RETURNS boolean AS $$
DECLARE
  v_max     integer;
  v_claimed integer;
BEGIN
  SELECT max_backers, claimed_count
    INTO v_max, v_claimed
    FROM rewards
    WHERE id = p_reward_id
    FOR UPDATE;  -- row-level lock

  -- Unlimited reward
  IF v_max IS NULL THEN
    UPDATE rewards SET claimed_count = claimed_count + 1 WHERE id = p_reward_id;
    RETURN true;
  END IF;

  -- Check availability
  IF v_claimed >= v_max THEN
    RETURN false;
  END IF;

  UPDATE rewards SET claimed_count = claimed_count + 1 WHERE id = p_reward_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: release_reward_slot
-- Decrements claimed_count when a pledge is released/refunded.
-- ============================================================

CREATE OR REPLACE FUNCTION release_reward_slot(p_reward_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE rewards
  SET claimed_count = GREATEST(0, claimed_count - 1)
  WHERE id = p_reward_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: process_expired_campaigns
-- Runs on a schedule (pg_cron) to evaluate campaigns past deadline.
-- Transitions active projects to 'funded' or 'failed'.
-- The actual Stripe capture/release is handled by the Edge Function
-- that reads the projects this function marks as needing action.
-- ============================================================

CREATE OR REPLACE FUNCTION process_expired_campaigns()
RETURNS TABLE(
  project_id    uuid,
  outcome       text,
  total_pledged numeric,
  goal          numeric
) AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      p.id,
      p.funding_goal_sgd,
      p.amount_pledged_sgd,
      p.creator_id
    FROM projects p
    WHERE p.status = 'active'
      AND p.deadline <= now()
    FOR UPDATE OF p
  LOOP
    IF rec.amount_pledged_sgd >= rec.funding_goal_sgd THEN
      -- Campaign succeeded
      UPDATE projects
      SET
        status    = 'funded',
        funded_at = now(),
        updated_at = now()
      WHERE id = rec.id;

      project_id    := rec.id;
      outcome       := 'funded';
      total_pledged := rec.amount_pledged_sgd;
      goal          := rec.funding_goal_sgd;
      RETURN NEXT;
    ELSE
      -- Campaign failed
      UPDATE projects
      SET
        status    = 'failed',
        failed_at = now(),
        updated_at = now()
      WHERE id = rec.id;

      project_id    := rec.id;
      outcome       := 'failed';
      total_pledged := rec.amount_pledged_sgd;
      goal          := rec.funding_goal_sgd;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: calculate_platform_fee
-- Returns the 5% platform fee for a given amount (rounded to 2dp).
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_platform_fee(p_amount_sgd numeric)
RETURNS numeric AS $$
BEGIN
  RETURN ROUND(p_amount_sgd * 0.05, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- FUNCTION: check_stretch_goals
-- Called after pledge totals are updated.
-- Marks stretch goals as reached when their threshold is crossed.
-- ============================================================

CREATE OR REPLACE FUNCTION check_stretch_goals(p_project_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE stretch_goals
  SET
    reached_at = now(),
    updated_at = now()
  WHERE project_id = p_project_id
    AND reached_at IS NULL
    AND goal_amount_sgd <= (
      SELECT amount_pledged_sgd FROM projects WHERE id = p_project_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SCHEDULED JOB: process_expired_campaigns every hour
-- Requires pg_cron extension (enabled in 001_initial_schema.sql)
-- ============================================================

SELECT cron.schedule(
  'process-expired-campaigns',
  '0 * * * *',   -- every hour on the hour
  $$SELECT process_expired_campaigns();$$
);
