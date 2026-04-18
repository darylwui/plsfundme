-- ============================================================
-- get that bread — Campaign Drafts
-- Migration: 010_campaign_drafts.sql
-- ============================================================
-- One draft per user. Upserted on every step change.
-- Deleted after successful project submission.
-- ============================================================

CREATE TABLE campaign_drafts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data  jsonb NOT NULL DEFAULT '{}',
  rewards_data jsonb NOT NULL DEFAULT '[]',
  step        smallint NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE campaign_drafts ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own draft
CREATE POLICY "Users manage own draft"
  ON campaign_drafts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
