-- Milestone visibility for backers (REVISED: column-scoped views)
--
-- Backers and anonymous viewers need to see milestone status for launched
-- campaigns, but the underlying tables contain operational/private fields:
--   * milestone_submissions.proof_data (factory contracts, photos)
--   * milestone_approvals.feedback_text (admin internal notes)
--   * disputes.description, disputes.backer_id, disputes.resolution_notes
--
-- RLS gates rows but not columns, so a public-read RLS policy on these
-- tables would also expose the private columns. Instead, we expose only
-- the columns the backer-view helper needs through public-read views, and
-- leave the base-table RLS unchanged (creator/admin only).
--
-- Project status gate matches the rest of the codebase:
-- 'active' / 'funded' / 'failed' are the public-read statuses; cancelled
-- and pending_review/draft/removed stay creator-only.

-- milestone_submissions: only id, campaign_id, milestone_number, submitted_at
CREATE VIEW milestone_submissions_public AS
  SELECT ms.id,
         ms.campaign_id,
         ms.milestone_number,
         ms.submitted_at
    FROM milestone_submissions ms
    JOIN projects p ON p.id = ms.campaign_id
   WHERE p.status IN ('active', 'funded', 'failed');

GRANT SELECT ON milestone_submissions_public TO anon, authenticated;

-- milestone_approvals: only id, submission_id, decision, reviewed_at
CREATE VIEW milestone_approvals_public AS
  SELECT ma.id,
         ma.submission_id,
         ma.decision,
         ma.reviewed_at
    FROM milestone_approvals ma
    JOIN milestone_submissions ms ON ms.id = ma.submission_id
    JOIN projects p ON p.id = ms.campaign_id
   WHERE p.status IN ('active', 'funded', 'failed');

GRANT SELECT ON milestone_approvals_public TO anon, authenticated;

-- escrow_releases: only id, campaign_id, milestone_number, amount_sgd, released_at
CREATE VIEW escrow_releases_public AS
  SELECT er.id,
         er.campaign_id,
         er.milestone_number,
         er.amount_sgd,
         er.released_at
    FROM escrow_releases er
    JOIN projects p ON p.id = er.campaign_id
   WHERE p.status IN ('active', 'funded', 'failed');

GRANT SELECT ON escrow_releases_public TO anon, authenticated;

-- disputes: only id, campaign_id, status (no description, no backer_id, no resolution_notes)
CREATE VIEW disputes_public AS
  SELECT d.id,
         d.campaign_id,
         d.status
    FROM disputes d
    JOIN projects p ON p.id = d.campaign_id
   WHERE p.status IN ('active', 'funded', 'failed');

GRANT SELECT ON disputes_public TO anon, authenticated;
