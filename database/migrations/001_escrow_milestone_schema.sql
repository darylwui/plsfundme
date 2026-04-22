-- Milestone Submissions (Creator submits proof)
CREATE TABLE milestone_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_number INT NOT NULL CHECK (milestone_number IN (1, 2, 3)),
  proof_data JSONB NOT NULL, -- {photos_url, letter_text, tracking_numbers, etc.}
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, milestone_number) -- Only one submission per milestone per campaign
);

CREATE INDEX idx_milestone_submissions_campaign_id ON milestone_submissions(campaign_id);
CREATE INDEX idx_milestone_submissions_creator_id ON milestone_submissions(creator_id);
CREATE INDEX idx_milestone_submissions_status ON milestone_submissions(status);

-- Milestone Approvals (Platform reviews submissions)
CREATE TABLE milestone_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES milestone_submissions(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_info')),
  feedback_text TEXT,
  reviewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestone_approvals_submission_id ON milestone_approvals(submission_id);

-- Escrow Releases (Audit trail of fund releases)
CREATE TABLE escrow_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_number INT NOT NULL CHECK (milestone_number IN (1, 2, 3)),
  amount_sgd NUMERIC(12, 2) NOT NULL,
  released_at TIMESTAMP NOT NULL,
  reason TEXT NOT NULL, -- 'milestone_approved'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_releases_campaign_id ON escrow_releases(campaign_id);

-- Disputes (Backers file claims)
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  backer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  filed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'refunded')),
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disputes_campaign_id ON disputes(campaign_id);
CREATE INDEX idx_disputes_backer_id ON disputes(backer_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Creator Qualifications (Track Creator+ status)
CREATE TABLE creator_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'creator_plus')),
  completed_campaigns_count INT NOT NULL DEFAULT 0,
  external_proof_url TEXT, -- Portfolio link, external verification
  external_proof_type TEXT, -- 'portfolio', 'kickstarter', 'manufacturing_letter', 'endorsement'
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id) -- One qualification record per creator
);

CREATE INDEX idx_creator_qualifications_creator_id ON creator_qualifications(creator_id);
CREATE INDEX idx_creator_qualifications_tier ON creator_qualifications(tier);
