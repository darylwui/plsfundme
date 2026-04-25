-- Milestone visibility for backers
--
-- Adds narrow public-read policies on the milestone-system tables so the
-- backer dashboard and public project page can show milestone status.
-- Read access is gated by the parent project's status — only campaigns
-- that are active/funded/failed/cancelled (i.e. once they've been
-- launched into review) expose their milestone state.
--
-- Drafts, removed, and pending_review projects stay hidden from the
-- public read path; their data only flows through admin/creator surfaces.

-- milestone_submissions: backer + anon may read submissions for launched campaigns
CREATE POLICY "milestone_submissions_select_public"
  ON milestone_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = milestone_submissions.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- milestone_approvals: same gate, joined through the parent submission
CREATE POLICY "milestone_approvals_select_public"
  ON milestone_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM milestone_submissions ms
      JOIN projects p ON p.id = ms.campaign_id
      WHERE ms.id = milestone_approvals.submission_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- escrow_releases: same gate
CREATE POLICY "escrow_releases_select_public"
  ON escrow_releases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = escrow_releases.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );

-- disputes: same gate. Note we expose status presence, not dispute description
-- (the helper only selects `id` for the open-dispute count).
CREATE POLICY "disputes_select_public"
  ON disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = disputes.campaign_id
        AND p.status IN ('active', 'funded', 'failed', 'cancelled')
    )
  );
