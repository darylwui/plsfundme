-- ============================================================
-- Fix: handle_new_user trigger fails for Google OAuth sign-ups
-- Migration: 008_fix_oauth_trigger.sql
--
-- Root cause: if migration 007 hasn't been applied to the live DB,
-- the user_role enum and role column may not exist, causing the
-- trigger to fail on any new user sign-up (including Google OAuth).
--
-- This migration is idempotent — safe to run multiple times.
-- ============================================================

-- Step 1: Create user_role enum if it doesn't already exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('backer', 'project_manager');
EXCEPTION WHEN duplicate_object THEN
  NULL; -- already exists, skip
END $$;

-- Step 2: Create pm_status enum if it doesn't already exist
DO $$ BEGIN
  CREATE TYPE pm_status AS ENUM ('pending_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN
  NULL; -- already exists, skip
END $$;

-- Step 3: Add role column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'backer';

-- Step 4: Create project_manager_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_manager_profiles (
  id                    uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio                   text NOT NULL,
  linkedin_url          text,
  company_name          text,
  company_website       text,
  project_type          text NOT NULL,
  project_description   text NOT NULL,
  id_document_url       text,
  singpass_verified     boolean NOT NULL DEFAULT false,
  singpass_sub          text,
  status                pm_status NOT NULL DEFAULT 'pending_review',
  rejection_reason      text,
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  reviewed_at           timestamptz,
  reviewed_by           uuid REFERENCES profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Step 5: Add updated_at trigger for project_manager_profiles (if not already)
DO $$ BEGIN
  CREATE TRIGGER trg_pm_profiles_updated_at
    BEFORE UPDATE ON project_manager_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Step 6: Enable RLS on project_manager_profiles (idempotent)
ALTER TABLE project_manager_profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Add RLS policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view own PM profile" ON project_manager_profiles;
DROP POLICY IF EXISTS "Admins can view all PM profiles" ON project_manager_profiles;
DROP POLICY IF EXISTS "Service role full access" ON project_manager_profiles;

CREATE POLICY "Users can view own PM profile"
  ON project_manager_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all PM profiles"
  ON project_manager_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Users can insert own PM profile"
  ON project_manager_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own PM profile"
  ON project_manager_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Step 8: Replace handle_new_user with a safe, defensive version
-- Uses DECLARE + explicit variable to avoid cast errors on OAuth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name text;
  v_avatar_url   text;
  v_role         user_role;
BEGIN
  -- Build display name: prefer full_name, fall back to name, then email prefix
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Avatar URL from OAuth provider (e.g. Google picture)
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Role: only set to project_manager if explicitly passed (email signup)
  -- Google/OAuth signups will have no 'role' key — default to backer
  IF (NEW.raw_user_meta_data->>'role') = 'project_manager' THEN
    v_role := 'project_manager'::user_role;
  ELSE
    v_role := 'backer'::user_role;
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (NEW.id, v_display_name, v_avatar_url, v_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
