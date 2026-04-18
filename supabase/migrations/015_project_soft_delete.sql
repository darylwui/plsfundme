-- ============================================================
-- get that bread — Soft-delete for projects
-- Migration: 015_project_soft_delete.sql
--
-- Creators can delete their own projects in non-funded states.
-- We soft-delete so pledge / payout / audit records stay intact
-- and admins can restore if needed. Public / creator-dashboard
-- reads filter out soft-deleted rows via RLS.
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_projects_deleted_at
  ON projects(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Slug uniqueness should only apply to live rows. A creator who
-- deletes a draft must be able to re-use the same slug later.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_slug_key;
DROP INDEX IF EXISTS projects_slug_key;

CREATE UNIQUE INDEX projects_slug_key
  ON projects(slug)
  WHERE deleted_at IS NULL;

-- ============================================================
-- RLS — hide soft-deleted projects from public + creator views.
-- Admins keep full visibility (for restore tooling).
-- ============================================================

DROP POLICY IF EXISTS "projects_select_public" ON projects;

CREATE POLICY "projects_select_public"
  ON projects FOR SELECT
  USING (
    (
      status IN ('active', 'funded', 'failed')
      AND deleted_at IS NULL
    )
    OR (
      creator_id = auth.uid()
      AND deleted_at IS NULL
    )
    OR is_admin()
  );

-- Prevent pledges on deleted campaigns even if status lags behind.
DROP POLICY IF EXISTS "pledges_insert_auth" ON pledges;

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
        AND p.deleted_at IS NULL
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

-- Hide stretch goals / rewards / updates for soft-deleted projects.
DROP POLICY IF EXISTS "stretch_goals_select_public" ON stretch_goals;

CREATE POLICY "stretch_goals_select_public"
  ON stretch_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = stretch_goals.project_id
        AND p.deleted_at IS NULL
        AND (p.status IN ('active', 'funded', 'failed') OR p.creator_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "rewards_select_public" ON rewards;

CREATE POLICY "rewards_select_public"
  ON rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND p.deleted_at IS NULL
        AND (p.status IN ('active', 'funded', 'failed') OR p.creator_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_updates_select_public" ON project_updates;

CREATE POLICY "project_updates_select_public"
  ON project_updates FOR SELECT
  USING (
    is_backers_only = false
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_updates.project_id
        AND p.status IN ('active', 'funded', 'failed')
        AND p.deleted_at IS NULL
    )
  );
