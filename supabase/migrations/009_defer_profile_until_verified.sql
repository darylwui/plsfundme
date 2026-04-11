-- ============================================================
-- Migration 009: Only create profile after email is verified
-- (or immediately for OAuth users who are pre-verified)
--
-- Problem: handle_new_user fires on INSERT into auth.users,
-- creating a profile even for unverified email signups.
--
-- Fix:
--   1. INSERT trigger: only create profile if email_confirmed_at
--      is already set (i.e. OAuth / Google users, pre-verified).
--   2. New UPDATE trigger: create profile when email_confirmed_at
--      transitions from NULL → NOT NULL (email link clicked).
-- ============================================================

-- Step 1: Replace INSERT trigger — only fires for pre-verified users (OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create profile immediately if email is already confirmed
  -- (Google OAuth and other pre-verified providers)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  -- For email signups: do nothing here, wait for email confirmation (UPDATE trigger below)
  RETURN NEW;
END;
$$;

-- Step 2: New UPDATE trigger — fires when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_user_verified()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only act when email_confirmed_at transitions NULL → NOT NULL
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 3: Create the UPDATE trigger on auth.users (if not exists)
DO $$ BEGIN
  CREATE TRIGGER trg_on_auth_user_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_verified();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
