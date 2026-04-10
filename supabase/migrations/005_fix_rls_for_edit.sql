-- Fix rewards delete policy — creators were only allowed to delete rewards
-- on draft projects, which blocked deletion from the edit-campaign page.
-- Now any creator can delete rewards from their own projects (any status),
-- as long as the reward has no active pledges (enforced in app logic).

DROP POLICY IF EXISTS "rewards_delete_creator" ON rewards;

CREATE POLICY "rewards_delete_creator"
  ON rewards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = rewards.project_id
        AND p.creator_id = auth.uid()
    )
    OR is_admin()
  );
