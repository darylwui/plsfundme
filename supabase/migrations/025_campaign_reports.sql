-- ============================================================
-- get that bread — Campaign abuse reports
-- Migration: 025_campaign_reports.sql
-- ============================================================
-- Lets any signed-in user flag a live campaign for fraud, IP
-- infringement, illegal/regulated content, inappropriate content,
-- or other policy violations. Distinct from `dispute_concerns`
-- (Stage 1 backer concern about a pledge) — campaign reports are
-- about the campaign itself and don't require a pledge.
-- ============================================================

CREATE TABLE campaign_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  reporter_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category      text NOT NULL CHECK (category IN (
                  'fraud',
                  'ip_infringement',
                  'illegal_regulated',
                  'inappropriate',
                  'other'
                )),
  message       text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 2000),
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'reviewing', 'dismissed', 'action_taken')),
  admin_notes   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_reports_project ON campaign_reports(project_id);
CREATE INDEX idx_campaign_reports_reporter ON campaign_reports(reporter_id);
CREATE INDEX idx_campaign_reports_status ON campaign_reports(status);
CREATE INDEX idx_campaign_reports_category ON campaign_reports(category);

CREATE TRIGGER trg_campaign_reports_updated_at
  BEFORE UPDATE ON campaign_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE campaign_reports ENABLE ROW LEVEL SECURITY;

-- Reporters can see what they've filed; admins see everything.
-- Creators are deliberately excluded — tipping off a bad actor that
-- they've been reported is the opposite of what we want.
CREATE POLICY "campaign_reports_select_own_or_admin"
  ON campaign_reports FOR SELECT
  USING (
    is_admin()
    OR reporter_id = auth.uid()
  );

-- Anyone signed in can file. Reporter must be the authed user (no
-- spoofing). The route handler additionally rejects creators
-- reporting their own campaigns; we don't enforce that in RLS to keep
-- the check simple — admin can always purge a self-report row later.
CREATE POLICY "campaign_reports_insert_signed_in"
  ON campaign_reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reporter_id = auth.uid()
  );

CREATE POLICY "campaign_reports_update_admin"
  ON campaign_reports FOR UPDATE
  USING (is_admin());

CREATE POLICY "campaign_reports_delete_admin"
  ON campaign_reports FOR DELETE
  USING (is_admin());
