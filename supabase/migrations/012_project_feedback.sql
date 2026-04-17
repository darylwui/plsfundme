-- ============================================================
-- PROJECT FEEDBACK / QUESTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_feedback (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message             text NOT NULL CHECK (length(trim(message)) > 0),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_feedback_project_id
  ON project_feedback(project_id);

CREATE INDEX IF NOT EXISTS idx_project_feedback_author_id
  ON project_feedback(author_id);

CREATE TRIGGER trg_project_feedback_updated_at
  BEFORE UPDATE ON project_feedback
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;

-- Public can read feedback on publicly visible campaigns.
CREATE POLICY "project_feedback_select_public"
  ON project_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_feedback.project_id
        AND p.status IN ('active', 'funded', 'failed')
    )
  );

-- Campaign creators can always read feedback for their own projects.
CREATE POLICY "project_feedback_select_creator"
  ON project_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_feedback.project_id
        AND p.creator_id = auth.uid()
    )
  );

-- Any authenticated non-creator can post feedback/questions on active campaigns.
CREATE POLICY "project_feedback_insert_authenticated"
  ON project_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_feedback.project_id
        AND p.status = 'active'
        AND p.creator_id <> auth.uid()
    )
  );

-- Author can edit own feedback.
CREATE POLICY "project_feedback_update_author"
  ON project_feedback FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Author, campaign creator, or admin can delete feedback.
CREATE POLICY "project_feedback_delete_author_creator_admin"
  ON project_feedback FOR DELETE
  USING (
    author_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_feedback.project_id
        AND p.creator_id = auth.uid()
    )
  );
