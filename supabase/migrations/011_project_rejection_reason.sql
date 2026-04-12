-- ============================================================
-- plsfundme — Project rejection reason
-- Migration: 011_project_rejection_reason.sql
-- ============================================================
-- Stores the admin's rejection message on the project row so
-- the creator can read it in their dashboard and on the edit page.
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS rejection_reason text;
