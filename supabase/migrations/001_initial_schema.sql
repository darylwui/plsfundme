-- ============================================================
-- get that bread — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE project_status AS ENUM (
  'draft',
  'active',
  'funded',
  'failed',
  'cancelled'
);

CREATE TYPE pledge_status AS ENUM (
  'pending',
  'authorized',       -- card: PaymentIntent authorized, not captured
  'paynow_captured',  -- paynow: immediately captured, refundable if goal fails
  'captured',         -- card: captured after campaign funded
  'released',         -- PaymentIntent cancelled (campaign failed, card path)
  'refunded',         -- refunded (campaign failed, paynow path)
  'failed'
);

CREATE TYPE payment_method_type AS ENUM ('card', 'paynow');

CREATE TYPE fulfillment_status AS ENUM (
  'unfulfilled',
  'shipped',
  'delivered'
);

CREATE TYPE kyc_status AS ENUM (
  'unverified',
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE payout_mode AS ENUM ('manual', 'automatic');

CREATE TYPE payout_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed'
);

-- ============================================================
-- CATEGORIES (admin-managed)
-- ============================================================

CREATE TABLE categories (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL UNIQUE,
  slug          text NOT NULL UNIQUE,
  description   text,
  icon_name     text,         -- Lucide icon name
  is_active     boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          text NOT NULL,
  avatar_url            text,
  bio                   text,
  website_url           text,
  -- KYC
  kyc_status            kyc_status NOT NULL DEFAULT 'unverified',
  kyc_submitted_at      timestamptz,
  kyc_reviewed_at       timestamptz,
  kyc_rejection_reason  text,
  -- Stripe
  stripe_account_id     text,             -- Stripe Connect account (creator payouts)
  stripe_customer_id    text,             -- Stripe Customer (backer payments)
  -- Meta
  is_admin              boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE projects (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category_id           uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

  title                 text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  short_description     text NOT NULL CHECK (char_length(short_description) <= 200),
  full_description      text NOT NULL DEFAULT '',
  cover_image_url       text,
  video_url             text,

  -- Funding
  funding_goal_sgd      numeric(12, 2) NOT NULL CHECK (funding_goal_sgd > 0),
  amount_pledged_sgd    numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount_pledged_sgd >= 0),
  backer_count          integer NOT NULL DEFAULT 0 CHECK (backer_count >= 0),

  -- Payout
  payout_mode           payout_mode NOT NULL DEFAULT 'automatic',

  -- Status & Timeline
  status                project_status NOT NULL DEFAULT 'draft',
  start_date            timestamptz,
  deadline              timestamptz NOT NULL,
  launched_at           timestamptz,
  funded_at             timestamptz,
  failed_at             timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT deadline_after_start CHECK (deadline > COALESCE(start_date, now()))
);

CREATE INDEX idx_projects_creator_id ON projects(creator_id);
CREATE INDEX idx_projects_category_id ON projects(category_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
CREATE INDEX idx_projects_launched_at ON projects(launched_at DESC);

-- ============================================================
-- STRETCH GOALS
-- ============================================================

CREATE TABLE stretch_goals (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             text NOT NULL,
  description       text,
  goal_amount_sgd   numeric(12, 2) NOT NULL CHECK (goal_amount_sgd > 0),
  reached_at        timestamptz,
  display_order     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stretch_goals_project_id ON stretch_goals(project_id);

-- ============================================================
-- REWARDS
-- ============================================================

CREATE TABLE rewards (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  title                   text NOT NULL,
  description             text,
  minimum_pledge_sgd      numeric(12, 2) NOT NULL CHECK (minimum_pledge_sgd > 0),
  estimated_delivery_date date,
  max_backers             integer CHECK (max_backers > 0),  -- NULL = unlimited
  claimed_count           integer NOT NULL DEFAULT 0 CHECK (claimed_count >= 0),
  includes_physical_item  boolean NOT NULL DEFAULT false,
  is_active               boolean NOT NULL DEFAULT true,
  display_order           integer NOT NULL DEFAULT 0,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT claimed_not_exceeds_max CHECK (
    max_backers IS NULL OR claimed_count <= max_backers
  )
);

CREATE INDEX idx_rewards_project_id ON rewards(project_id);

-- ============================================================
-- PLEDGES
-- ============================================================

CREATE TABLE pledges (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id                  uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  backer_id                   uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reward_id                   uuid REFERENCES rewards(id) ON DELETE SET NULL,

  amount_sgd                  numeric(12, 2) NOT NULL CHECK (amount_sgd > 0),
  platform_fee_sgd            numeric(12, 2) NOT NULL DEFAULT 0 CHECK (platform_fee_sgd >= 0),

  -- Stripe
  stripe_payment_intent_id    text UNIQUE,
  stripe_setup_intent_id      text UNIQUE,  -- SetupIntent path for long campaigns
  stripe_payment_method_id    text,         -- saved PM for deferred capture
  payment_method              payment_method_type NOT NULL,

  -- Status
  status                      pledge_status NOT NULL DEFAULT 'pending',

  -- Fulfillment
  fulfillment_status          fulfillment_status NOT NULL DEFAULT 'unfulfilled',
  shipped_at                  timestamptz,
  delivered_at                timestamptz,
  tracking_url                text,

  -- Privacy
  is_anonymous                boolean NOT NULL DEFAULT false,

  -- Notes
  backer_note                 text CHECK (char_length(backer_note) <= 500),

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pledges_project_id ON pledges(project_id);
CREATE INDEX idx_pledges_backer_id ON pledges(backer_id);
CREATE INDEX idx_pledges_reward_id ON pledges(reward_id);
CREATE INDEX idx_pledges_status ON pledges(status);
CREATE INDEX idx_pledges_stripe_pi ON pledges(stripe_payment_intent_id);

-- ============================================================
-- PAYOUTS
-- ============================================================

CREATE TABLE payouts (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id            uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  creator_id            uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  amount_sgd            numeric(12, 2) NOT NULL CHECK (amount_sgd > 0),
  platform_fee_sgd      numeric(12, 2) NOT NULL CHECK (platform_fee_sgd >= 0),
  net_amount_sgd        numeric(12, 2) NOT NULL CHECK (net_amount_sgd >= 0),

  stripe_transfer_id    text UNIQUE,
  status                payout_status NOT NULL DEFAULT 'pending',

  requested_at          timestamptz NOT NULL DEFAULT now(),
  processed_at          timestamptz,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payouts_project_id ON payouts(project_id);
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);

-- ============================================================
-- PROJECT UPDATES
-- ============================================================

CREATE TABLE project_updates (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creator_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title               text NOT NULL,
  body                text NOT NULL,
  is_backers_only     boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_updates_project_id ON project_updates(project_id);

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at       BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated_at       BEFORE UPDATE ON projects        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rewards_updated_at        BEFORE UPDATE ON rewards         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pledges_updated_at        BEFORE UPDATE ON pledges         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payouts_updated_at        BEFORE UPDATE ON payouts         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at     BEFORE UPDATE ON categories      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_stretch_goals_updated_at  BEFORE UPDATE ON stretch_goals   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_project_updates_updated_at BEFORE UPDATE ON project_updates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
