export type MilestoneNumber = 1 | 2 | 3;

export type MilestoneSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_info';
export type MilestoneDecision = 'approved' | 'rejected' | 'needs_info';

export interface MilestoneProofData {
  photos_url?: string; // URL to factory photos (for M1, M2)
  letter_text?: string; // Factory letter content (for M1, M2)
  tracking_numbers?: string[]; // Tracking numbers (for M3)
  fulfillment_summary?: string; // Units shipped, ETA (for M3)
}

export interface MilestoneSubmission {
  id: string;
  campaign_id: string;
  creator_id: string;
  milestone_number: MilestoneNumber;
  proof_data: MilestoneProofData;
  submitted_at: string;
  status: MilestoneSubmissionStatus;
  created_at: string;
}

export interface MilestoneApproval {
  id: string;
  submission_id: string;
  approved_by: string;
  decision: MilestoneDecision;
  feedback_text?: string;
  reviewed_at: string;
  created_at: string;
}

export interface EscrowRelease {
  id: string;
  campaign_id: string;
  milestone_number: MilestoneNumber;
  amount_sgd: number;
  released_at: string;
  reason: string;
}

export interface Dispute {
  id: string;
  campaign_id: string;
  backer_id: string;
  description: string;
  filed_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'refunded';
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export type CreatorTier = 'standard' | 'creator_plus';

export interface CreatorQualification {
  id: string;
  creator_id: string;
  tier: CreatorTier;
  completed_campaigns_count: number;
  external_proof_url?: string;
  external_proof_type?: 'portfolio' | 'kickstarter' | 'manufacturing_letter' | 'endorsement';
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}
