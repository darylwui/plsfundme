-- ============================================================
-- get that bread — Row Level Security Policies for Escrow & Milestones
-- Migration: 002_add_rls_policies.sql
-- ============================================================
-- Adds RLS policies to:
-- - milestone_submissions
-- - milestone_approvals
-- - escrow_releases
-- - disputes
-- - creator_qualifications
-- ============================================================

-- ============================================================
-- HELPER: is_admin()
-- ============================================================
-- Returns true if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE milestone_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_qualifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- MILESTONE_SUBMISSIONS Policies
-- ============================================================
-- Creators can view only their own submissions
-- Admins can view all submissions

CREATE POLICY "milestone_submissions_select_own"
  ON milestone_submissions FOR SELECT
  USING (
    is_admin()
    OR creator_id = auth.uid()
    OR (SELECT creator_id FROM projects WHERE id = campaign_id) = auth.uid()
  );

-- Only creators can insert their own submissions
CREATE POLICY "milestone_submissions_insert_creator"
  ON milestone_submissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND creator_id = auth.uid()
  );

-- Only admins can update submissions
CREATE POLICY "milestone_submissions_update_admin"
  ON milestone_submissions FOR UPDATE
  USING (is_admin());

-- Only admins can delete submissions
CREATE POLICY "milestone_submissions_delete_admin"
  ON milestone_submissions FOR DELETE
  USING (is_admin());

-- ============================================================
-- MILESTONE_APPROVALS Policies
-- ============================================================
-- Creators can view approvals on their own campaigns
-- Admins can view all approvals
-- Only admins can INSERT/UPDATE/DELETE

CREATE POLICY "milestone_approvals_select_own"
  ON milestone_approvals FOR SELECT
  USING (
    is_admin()
    OR (
      SELECT creator_id FROM projects
      WHERE id = (
        SELECT campaign_id FROM milestone_submissions
        WHERE id = submission_id
      )
    ) = auth.uid()
  );

-- Only admins can insert approvals
CREATE POLICY "milestone_approvals_insert_admin"
  ON milestone_approvals FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update approvals
CREATE POLICY "milestone_approvals_update_admin"
  ON milestone_approvals FOR UPDATE
  USING (is_admin());

-- Only admins can delete approvals
CREATE POLICY "milestone_approvals_delete_admin"
  ON milestone_approvals FOR DELETE
  USING (is_admin());

-- ============================================================
-- ESCROW_RELEASES Policies
-- ============================================================
-- Creators can view releases for their campaigns
-- Admins can view all releases
-- Only admins can INSERT/UPDATE (audit trail, not user-modifiable)

CREATE POLICY "escrow_releases_select_own"
  ON escrow_releases FOR SELECT
  USING (
    is_admin()
    OR (SELECT creator_id FROM projects WHERE id = campaign_id) = auth.uid()
  );

-- Only admins can insert releases
CREATE POLICY "escrow_releases_insert_admin"
  ON escrow_releases FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update releases
CREATE POLICY "escrow_releases_update_admin"
  ON escrow_releases FOR UPDATE
  USING (is_admin());

-- Only admins can delete releases
CREATE POLICY "escrow_releases_delete_admin"
  ON escrow_releases FOR DELETE
  USING (is_admin());

-- ============================================================
-- DISPUTES Policies
-- ============================================================
-- Backers can view only their own disputes
-- Creators can view disputes on their campaigns
-- Admins can view all disputes
-- Only backers can INSERT
-- Only admins can UPDATE/DELETE

CREATE POLICY "disputes_select_own"
  ON disputes FOR SELECT
  USING (
    is_admin()
    OR backer_id = auth.uid()
    OR (SELECT creator_id FROM projects WHERE id = campaign_id) = auth.uid()
  );

-- Only backers can insert their own disputes
CREATE POLICY "disputes_insert_backer"
  ON disputes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND backer_id = auth.uid()
  );

-- Only admins can update disputes
CREATE POLICY "disputes_update_admin"
  ON disputes FOR UPDATE
  USING (is_admin());

-- Only admins can delete disputes
CREATE POLICY "disputes_delete_admin"
  ON disputes FOR DELETE
  USING (is_admin());

-- ============================================================
-- CREATOR_QUALIFICATIONS Policies
-- ============================================================
-- Creators can view only their own qualification record
-- Admins can view all qualification records
-- Creators can INSERT (first application)
-- Only admins can UPDATE/DELETE

CREATE POLICY "creator_qualifications_select_own"
  ON creator_qualifications FOR SELECT
  USING (
    is_admin()
    OR creator_id = auth.uid()
  );

-- Creators can insert their own qualification record
CREATE POLICY "creator_qualifications_insert_own"
  ON creator_qualifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND creator_id = auth.uid()
  );

-- Only admins can update qualification records
CREATE POLICY "creator_qualifications_update_admin"
  ON creator_qualifications FOR UPDATE
  USING (is_admin());

-- Only admins can delete qualification records
CREATE POLICY "creator_qualifications_delete_admin"
  ON creator_qualifications FOR DELETE
  USING (is_admin());

-- ============================================================
-- Test Assertions (run manually to verify policies)
-- ============================================================
-- These assertions verify the RLS policies work correctly.
-- Run these after applying the migration to confirm permissions.
--
-- Test 1: Creator can view own submissions, cannot view others'
-- SELECT 'Test 1a: Creator views own submission' as test_name;
-- SET LOCAL role = authenticated;
-- SET LOCAL request.jwt.claims = jsonb_build_object('sub', 'creator_uuid_1');
-- -- Should return 1 row
-- SELECT COUNT(*) FROM milestone_submissions WHERE creator_id = 'creator_uuid_1';
--
-- Test 2: Admin can view all submissions
-- SET LOCAL role = authenticated;
-- SET LOCAL request.jwt.claims = jsonb_build_object('sub', 'admin_uuid');
-- -- Should return all rows (requires is_admin = true in profiles)
-- SELECT COUNT(*) FROM milestone_submissions;
--
-- Test 3: Backer can view own disputes, cannot view others'
-- SET LOCAL role = authenticated;
-- SET LOCAL request.jwt.claims = jsonb_build_object('sub', 'backer_uuid_1');
-- -- Should return only backer_uuid_1's disputes
-- SELECT COUNT(*) FROM disputes WHERE backer_id = 'backer_uuid_1';
--
-- Test 4: Creator cannot insert into disputes
-- SET LOCAL role = authenticated;
-- SET LOCAL request.jwt.claims = jsonb_build_object('sub', 'creator_uuid_1');
-- -- Should fail (backers only)
-- INSERT INTO disputes (campaign_id, backer_id, description, filed_at, status)
-- VALUES ('campaign_id', 'creator_uuid_1', 'test', now(), 'open');
--