-- Migration: rename "project manager" → "creator" across the schema
-- Touches: user_role enum value, pm_status enum type, project_manager_profiles table
--
-- Idempotent: each step is guarded so replaying this on a DB where the rename
-- is already applied (prod + any local that ran the original 017_rename_pm_to_creator
-- before this file was renumbered to 022) is a clean no-op.

-- 1. Rename the enum value in user_role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'project_manager'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role RENAME VALUE 'project_manager' TO 'creator';
  END IF;
END $$;

-- 2. Rename the pm_status enum type itself
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pm_status') THEN
    ALTER TYPE pm_status RENAME TO creator_status;
  END IF;
END $$;

-- 3. Rename the table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'project_manager_profiles'
  ) THEN
    ALTER TABLE project_manager_profiles RENAME TO creator_profiles;
  END IF;
END $$;

-- 4. Rename FK constraints so they match the new table name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_manager_profiles_id_fkey'
  ) THEN
    ALTER TABLE creator_profiles
      RENAME CONSTRAINT project_manager_profiles_id_fkey TO creator_profiles_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_manager_profiles_reviewed_by_fkey'
  ) THEN
    ALTER TABLE creator_profiles
      RENAME CONSTRAINT project_manager_profiles_reviewed_by_fkey TO creator_profiles_reviewed_by_fkey;
  END IF;
END $$;
