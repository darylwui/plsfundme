-- ============================================================
-- Creator review threading (HubSpot-portal pattern, in-app)
-- ============================================================
-- Adds a "needs_info" state, a threaded notes log (internal + shared),
-- and supporting columns on creator_profiles to track follow-ups.
--
-- Paired with:
--   app/dashboard/admin/creators           (admin drawer + composer)
--   app/dashboard/application              (creator-facing thread)
-- ============================================================

-- 1. New status value — creators can now be moved to "needs_info"
ALTER TYPE creator_status ADD VALUE IF NOT EXISTS 'needs_info';

-- 2. Tracking columns on creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS info_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_id       uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_reviewer_id     ON creator_profiles(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_info_requested  ON creator_profiles(info_requested_at);

-- 3. Threaded notes / messages log
CREATE TABLE IF NOT EXISTS creator_review_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  author_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  author_role  text NOT NULL CHECK (author_role IN ('admin', 'creator')),
  visibility   text NOT NULL CHECK (visibility IN ('internal', 'shared')),
  body         text NOT NULL CHECK (length(body) > 0),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_review_notes_creator_id  ON creator_review_notes(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_review_notes_visibility  ON creator_review_notes(visibility);

-- 4. RLS
ALTER TABLE creator_review_notes ENABLE ROW LEVEL SECURITY;

-- Admins see all notes; creators see only SHARED notes on their own thread.
CREATE POLICY "creator_review_notes_select"
  ON creator_review_notes FOR SELECT
  USING (
    is_admin()
    OR (creator_id = auth.uid() AND visibility = 'shared')
  );

-- Admins can insert any note (internal or shared) on any thread.
CREATE POLICY "creator_review_notes_insert_admin"
  ON creator_review_notes FOR INSERT
  WITH CHECK (
    is_admin()
    AND author_id = auth.uid()
    AND author_role = 'admin'
  );

-- Creators can only insert shared notes authored by themselves, on their own thread.
CREATE POLICY "creator_review_notes_insert_creator"
  ON creator_review_notes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND creator_id = auth.uid()
    AND author_id = auth.uid()
    AND author_role = 'creator'
    AND visibility = 'shared'
  );

-- Nobody updates notes after the fact — treat this as an append-only log.
-- (No UPDATE policy; RLS denies by default.)

-- Only admins can hard-delete (moderation / mistakes).
CREATE POLICY "creator_review_notes_delete_admin"
  ON creator_review_notes FOR DELETE
  USING (is_admin());
