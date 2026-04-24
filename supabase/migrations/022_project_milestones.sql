-- Adds milestone definitions to projects. Creators define what M1/M2/M3
-- mean for their campaign (title, description, target date). The payout
-- split stays hardcoded at 40/40/20 in lib/milestones/escrow.ts — this
-- column only captures what the creator promises to deliver.
--
-- Shape: array of exactly 3 objects, in order.
-- [
--   { "title": "Prototype approved",    "description": "…", "target_date": "2026-07-01" },
--   { "title": "Manufacturing complete","description": "…", "target_date": "2026-09-01" },
--   { "title": "Shipped to backers",    "description": "…", "target_date": "2026-11-01" }
-- ]

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS milestones JSONB;

-- Validate shape at the DB level so bad writes from future call sites still fail loud.
-- Allow NULL for existing rows and drafts that haven't defined milestones yet.
ALTER TABLE public.projects
  ADD CONSTRAINT projects_milestones_shape_check
  CHECK (
    milestones IS NULL
    OR (
      jsonb_typeof(milestones) = 'array'
      AND jsonb_array_length(milestones) = 3
    )
  );

COMMENT ON COLUMN public.projects.milestones IS
  'Array of exactly 3 milestone definitions (title, description, target_date). Payout split is fixed 40/40/20 in escrow.ts.';
