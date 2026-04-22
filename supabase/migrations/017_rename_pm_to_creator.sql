-- Migration: rename "project manager" → "creator" across the schema
-- Touches: user_role enum value, pm_status enum type, project_manager_profiles table

-- 1. Rename the enum value in user_role
ALTER TYPE user_role RENAME VALUE 'project_manager' TO 'creator';

-- 2. Rename the pm_status enum type itself
ALTER TYPE pm_status RENAME TO creator_status;

-- 3. Rename the table
ALTER TABLE project_manager_profiles RENAME TO creator_profiles;

-- 4. Rename FK constraints so they match the new table name
ALTER TABLE creator_profiles
  RENAME CONSTRAINT project_manager_profiles_id_fkey TO creator_profiles_id_fkey;

ALTER TABLE creator_profiles
  RENAME CONSTRAINT project_manager_profiles_reviewed_by_fkey TO creator_profiles_reviewed_by_fkey;
