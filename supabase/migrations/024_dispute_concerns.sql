-- ============================================================
-- get that bread — Stage 1 dispute concerns
-- Migration: 024_dispute_concerns.sql
-- ============================================================
-- Per the Refund & Dispute Policy, the dispute process has two stages:
--   Stage 1: Backer flags a concern → Creator has 14 days to respond
--   Stage 2: If no response or inadequate response → formal dispute opens
--
-- The existing `disputes` table (migration 018) models Stage 2 — the
-- formal, admin-investigated dispute that may result in refund
-- classification. This table models Stage 1 — an informal "I have a
-- concern, please look into it" flag from the backer that may later
-- be `escalated` into a `disputes` row.
-- ============================================================

CREATE TABLE dispute_concerns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id         uuid NOT NULL REFERENCES pledges(id) ON DELETE RESTRICT,
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  backer_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  -- null = whole-campaign concern; 1/2/3 = specific milestone
  milestone_number  int CHECK (milestone_number IS NULL OR milestone_number IN (1, 2, 3)),
  message           text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  -- 'open'       = filed, awaiting admin triage / creator response
  -- 'responded'  = creator or admin responded; backer may close or escalate
  -- 'dismissed'  = admin closed without action (false alarm, resolved by comms)
  -- 'escalated'  = converted into a formal `disputes` row for investigation
  status            text NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open', 'responded', 'dismissed', 'escalated')),
  admin_notes       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispute_concerns_backer ON dispute_concerns(backer_id);
CREATE INDEX idx_dispute_concerns_project ON dispute_concerns(project_id);
CREATE INDEX idx_dispute_concerns_pledge ON dispute_concerns(pledge_id);
CREATE INDEX idx_dispute_concerns_status ON dispute_concerns(status);

-- updated_at trigger (matches the trg_<table>_updated_at convention)
CREATE TRIGGER trg_dispute_concerns_updated_at
  BEFORE UPDATE ON dispute_concerns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE dispute_concerns ENABLE ROW LEVEL SECURITY;

-- Backers can read their own concerns. Admins can read all. Creators
-- get NO direct read access — Stage 1 is admin-mediated communication;
-- the creator hears about it via admin outreach (per policy).
CREATE POLICY "dispute_concerns_select_own_or_admin"
  ON dispute_concerns FOR SELECT
  USING (
    is_admin()
    OR backer_id = auth.uid()
  );

-- Backers can file concerns only on their own pledges. The pledge
-- ownership check is the security boundary — without it, a hostile
-- client could spoof backer_id on insert and we'd accept it.
CREATE POLICY "dispute_concerns_insert_own_pledge"
  ON dispute_concerns FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND backer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pledges
      WHERE pledges.id = pledge_id
        AND pledges.backer_id = auth.uid()
        AND pledges.project_id = dispute_concerns.project_id
    )
  );

-- Only admins update (status transitions, admin_notes).
CREATE POLICY "dispute_concerns_update_admin"
  ON dispute_concerns FOR UPDATE
  USING (is_admin());

-- Only admins delete.
CREATE POLICY "dispute_concerns_delete_admin"
  ON dispute_concerns FOR DELETE
  USING (is_admin());
