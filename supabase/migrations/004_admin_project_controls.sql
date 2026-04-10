-- Add pending_review and removed to project_status enum
-- pending_review: newly submitted project awaiting admin approval
-- removed: project removed by admin for ToS violation

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'removed';
