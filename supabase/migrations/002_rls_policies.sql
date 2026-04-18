-- ============================================================
-- get that bread — Row Level Security Policies
-- Migration: 002_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stretch_goals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: is_admin()
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- CATEGORIES
-- ============================================================

-- Anyone can read active categories
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (is_active = true OR is_admin());

-- Only admins can insert/update/delete
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (is_admin());

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (is_admin());

-- ============================================================
-- PROFILES
-- ============================================================

-- Public fields visible to all (no stripe IDs, no KYC details)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion to admin or self-clearing stripe IDs
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
    AND stripe_account_id IS NOT DISTINCT FROM (SELECT stripe_account_id FROM profiles WHERE id = auth.uid())
    AND stripe_customer_id IS NOT DISTINCT FROM (SELECT stripe_customer_id FROM profiles WHERE id = auth.uid())
  );

-- Service role handles Stripe ID writes (via API routes)
-- Admins can update KYC status
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ============================================================
-- PROJECTS
-- ============================================================

-- Public can see active, funded, or failed projects
-- Creators can see their own drafts and cancelled projects
CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (
    status IN ('active', 'funded', 'failed')
    OR creator_id = auth.uid()
    OR is_admin()
  );

-- Authenticated users can create projects
CREATE POLICY "projects_insert_auth"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND creator_id = auth.uid()
  );

-- Creators can update their own projects; admins can update any
CREATE POLICY "projects_update_creator"
  ON projects FOR UPDATE
  USING (creator_id = auth.uid() OR is_admin())
  WITH CHECK (creator_id = auth.uid() OR is_admin());

-- Only admins can delete projects (creators should cancel instead)
CREATE POLICY "projects_delete_admin"
  ON projects FOR DELETE
  USING (is_admin());

-- ============================================================
-- STRETCH GOALS
-- ============================================================

CREATE POLICY "stretch_goals_select_public"
  ON stretch_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stretch_goals.project_id
        AND (p.status IN ('active', 'funded', 'failed') OR p.creator_id = auth.uid())
    )
  );

CREATE POLICY "stretch_goals_insert_creator"
  ON stretch_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stretch_goals.project_id
        AND p.creator_id = auth.uid()
    )
  );

CREATE POLICY "stretch_goals_update_creator"
  ON stretch_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stretch_goals.project_id
        AND p.creator_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "stretch_goals_delete_creator"
  ON stretch_goals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stretch_goals.project_id
        AND p.creator_id = auth.uid()
        AND p.status = 'draft'
    ) OR is_admin()
  );

-- ============================================================
-- REWARDS
-- ============================================================

-- Anyone can view rewards for public projects
CREATE POLICY "rewards_select_public"
  ON rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND (p.status IN ('active', 'funded', 'failed') OR p.creator_id = auth.uid())
    )
  );

-- Only project creator can manage rewards
CREATE POLICY "rewards_insert_creator"
  ON rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND p.creator_id = auth.uid()
    )
  );

CREATE POLICY "rewards_update_creator"
  ON rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND p.creator_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "rewards_delete_creator"
  ON rewards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND p.creator_id = auth.uid()
        AND p.status = 'draft'
    ) OR is_admin()
  );

-- ============================================================
-- PLEDGES
-- ============================================================

-- Backers see their own pledges
-- Creators see pledges for their projects (PII masked for anonymous pledges via view)
-- Admins see all
CREATE POLICY "pledges_select_own_backer"
  ON pledges FOR SELECT
  USING (backer_id = auth.uid());

CREATE POLICY "pledges_select_creator"
  ON pledges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pledges.project_id
        AND p.creator_id = auth.uid()
    )
  );

CREATE POLICY "pledges_select_admin"
  ON pledges FOR SELECT
  USING (is_admin());

-- Only authenticated users can create pledges for active projects
CREATE POLICY "pledges_insert_auth"
  ON pledges FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND backer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pledges.project_id
        AND p.status = 'active'
        AND p.deadline > now()
    )
    AND (
      reward_id IS NULL
      OR EXISTS (
        SELECT 1 FROM rewards r
        WHERE r.id = pledges.reward_id
          AND r.project_id = pledges.project_id
          AND r.is_active = true
          AND pledges.amount_sgd >= r.minimum_pledge_sgd
          AND (r.max_backers IS NULL OR r.claimed_count < r.max_backers)
      )
    )
  );

-- Status transitions happen server-side only (via service role in webhook handler)
-- Backers cannot update their own pledges once created — immutable audit trail
-- Creators can update fulfillment fields only
CREATE POLICY "pledges_update_creator_fulfillment"
  ON pledges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = pledges.project_id
        AND p.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Creators can only update fulfillment fields, nothing financial
    status IS NOT DISTINCT FROM (SELECT status FROM pledges WHERE id = pledges.id)
    AND amount_sgd IS NOT DISTINCT FROM (SELECT amount_sgd FROM pledges WHERE id = pledges.id)
    AND stripe_payment_intent_id IS NOT DISTINCT FROM (SELECT stripe_payment_intent_id FROM pledges WHERE id = pledges.id)
  );

-- No deletes — pledges are permanent records
-- (status transitions replace deletion)

-- ============================================================
-- PROJECT UPDATES
-- ============================================================

-- Public updates visible to all; backers-only visible to confirmed backers
CREATE POLICY "project_updates_select_public"
  ON project_updates FOR SELECT
  USING (
    is_backers_only = false
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_updates.project_id
        AND p.status IN ('active', 'funded', 'failed')
    )
  );

CREATE POLICY "project_updates_select_backers"
  ON project_updates FOR SELECT
  USING (
    is_backers_only = true
    AND EXISTS (
      SELECT 1 FROM pledges pl
      WHERE pl.project_id = project_updates.project_id
        AND pl.backer_id = auth.uid()
        AND pl.status IN ('authorized', 'paynow_captured', 'captured')
    )
  );

CREATE POLICY "project_updates_select_creator"
  ON project_updates FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "project_updates_insert_creator"
  ON project_updates FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_updates.project_id
        AND p.creator_id = auth.uid()
    )
  );

CREATE POLICY "project_updates_update_creator"
  ON project_updates FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "project_updates_delete_creator"
  ON project_updates FOR DELETE
  USING (creator_id = auth.uid() OR is_admin());

-- ============================================================
-- PAYOUTS
-- ============================================================

-- Creators see their own payouts; admins see all
CREATE POLICY "payouts_select_creator"
  ON payouts FOR SELECT
  USING (creator_id = auth.uid() OR is_admin());

-- Payouts are created by service role only (triggered on campaign funding)
-- No direct user insert/update/delete
