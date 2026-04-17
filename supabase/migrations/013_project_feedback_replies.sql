-- ============================================================
-- PROJECT FEEDBACK REPLIES (CREATOR RESPONSES)
-- ============================================================

ALTER TABLE project_feedback
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES project_feedback(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_project_feedback_parent_id
  ON project_feedback(parent_id);

-- Replace insert policy to allow:
-- 1) non-creators to post top-level feedback on active campaigns
-- 2) creators to post replies on their own campaigns
DROP POLICY IF EXISTS "project_feedback_insert_authenticated" ON project_feedback;

CREATE POLICY "project_feedback_insert_authenticated"
  ON project_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      (
        parent_id IS NULL
        AND EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = project_feedback.project_id
            AND p.status = 'active'
            AND p.creator_id <> auth.uid()
        )
      )
      OR
      (
        parent_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM projects p
          JOIN project_feedback parent ON parent.id = project_feedback.parent_id
          WHERE p.id = project_feedback.project_id
            AND p.creator_id = auth.uid()
            AND parent.project_id = p.id
        )
      )
    )
  );
