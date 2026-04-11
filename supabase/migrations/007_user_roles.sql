-- Add user_role enum
CREATE TYPE user_role AS ENUM ('backer', 'project_manager');

-- Add role to profiles (default backer)
ALTER TABLE profiles ADD COLUMN role user_role NOT NULL DEFAULT 'backer';

-- Add pm_status enum
CREATE TYPE pm_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Project Manager extended profiles
CREATE TABLE project_manager_profiles (
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

CREATE TRIGGER trg_pm_profiles_updated_at BEFORE UPDATE ON project_manager_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE project_manager_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own PM profile" ON project_manager_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all PM profiles" ON project_manager_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Service role full access" ON project_manager_profiles USING (true) WITH CHECK (true);

-- Update handle_new_user trigger to set role from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'backer'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
