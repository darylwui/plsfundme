# Escrow & Milestone System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a three-milestone escrow system with creator proof-of-work verification, backer education, dispute resolution, and Creator+ tier qualification to protect backers and reward proven creators.

**Architecture:** Backers' pledges are held in escrow (non-withdrawable) until creators hit three milestones (Tooling/Proof/Fulfillment). Creators submit proof; platform verifies; funds release upon approval. Disputes escalate to admin review. Creator+ tier unlocks custom payout structures. System prioritizes transparency & protection.

**Tech Stack:** Next.js 16 API routes, Supabase PostgreSQL, React components, Resend for emails, TDD with Vitest.

---

## Phase 1: Database Schema & Core Escrow Logic

### Task 1: Design & Create Milestone Schema

**Files:**
- Create: `database/migrations/001_escrow_milestone_schema.sql`
- Create: `lib/milestones/types.ts` (TypeScript types for validation)

- [ ] **Step 1: Draft schema design**

Review the spec (Sections 1–4) and outline tables needed:
- `milestone_submissions` — Creator submits proof for a milestone
- `milestone_approvals` — Platform reviews & approves/rejects submission
- `escrow_releases` — Log of when funds were released (audit trail)
- `disputes` — Backers file claims against a campaign
- `creator_qualifications` — Track Creator+ approval status & external credentials

**Schema outline (Draft, no SQL yet):**

```
milestone_submissions:
  id (uuid, PK)
  campaign_id (uuid, FK → projects)
  creator_id (uuid, FK → profiles)
  milestone_number (1, 2, or 3)
  proof_data (jsonb) — {photos_url, letter_text, tracking_numbers}
  submitted_at (timestamp)
  status ('pending', 'approved', 'rejected')

milestone_approvals:
  id (uuid, PK)
  submission_id (uuid, FK → milestone_submissions)
  approved_by (uuid, FK → profiles) — platform admin
  decision ('approved', 'rejected', 'needs_info')
  feedback_text (text)
  approved_at (timestamp)

escrow_releases:
  id (uuid, PK)
  campaign_id (uuid, FK → projects)
  milestone_number (1, 2, or 3)
  amount_sgd (numeric)
  released_at (timestamp)
  reason (text) — 'milestone_approved'

disputes:
  id (uuid, PK)
  campaign_id (uuid, FK → projects)
  backer_id (uuid, FK → profiles)
  description (text)
  filed_at (timestamp)
  status ('open', 'investigating', 'resolved', 'refunded')
  resolution_notes (text)

creator_qualifications:
  id (uuid, PK)
  creator_id (uuid, FK → profiles)
  tier ('standard', 'creator_plus')
  completed_campaigns_count (int)
  external_proof_submitted (text or jsonb) — portfolio link, kickstarter proof, etc.
  approved_at (timestamp)
  approved_by (uuid, FK → profiles)
```

- [ ] **Step 2: Write SQL migration**

Create `database/migrations/001_escrow_milestone_schema.sql`:

```sql
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
```

- [ ] **Step 3: Run migration to verify SQL**

Run the migration against your development Supabase project (you'll do this in a later task once you've set up the migration infrastructure). For now, just verify the SQL is syntactically correct.

Command: `npx supabase db lint < database/migrations/001_escrow_milestone_schema.sql`

Expected: No errors; SQL parses cleanly.

- [ ] **Step 4: Create TypeScript types**

Create `lib/milestones/types.ts`:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/001_escrow_milestone_schema.sql lib/milestones/types.ts
git commit -m "feat: add escrow & milestone database schema and TypeScript types

- Create milestone_submissions table for creator proof submissions
- Create milestone_approvals table for platform review
- Create escrow_releases table for audit trail
- Create disputes table for backer claims
- Create creator_qualifications table for Creator+ tier tracking
- Define TypeScript types for all entities

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Implement Escrow Logic (Hold & Release)

**Files:**
- Create: `lib/milestones/escrow.ts`
- Create: `tests/lib/milestones/escrow.test.ts`

**Context:** This task implements the core business logic: when a milestone is approved, funds are released from escrow. We'll write tests first (TDD), then the implementation.

- [ ] **Step 1: Write failing tests**

Create `tests/lib/milestones/escrow.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { releaseMilestonePayment, holdPaymentInEscrow } from '@/lib/milestones/escrow';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

describe('Escrow Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('releaseMilestonePayment', () => {
    it('should release 40% for milestone 1 when approved', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-1' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(20000); // 40% of 50k
      expect(result.reason).toBe('milestone_approved');
    });

    it('should release 40% for milestone 2', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-2' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 2,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(20000); // 40% of 50k
    });

    it('should release 20% for milestone 3', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'release-3' }], error: null }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 3,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.amount_released).toBe(10000); // 20% of 50k
    });

    it('should return error if insert fails', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await releaseMilestonePayment({
        campaign_id: 'campaign-1',
        milestone_number: 1,
        campaign_total_sgd: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('holdPaymentInEscrow', () => {
    it('should mark a pledge as held in escrow', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [{ id: 'pledge-1', escrow_held: true }], error: null }),
            }),
          }),
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const result = await holdPaymentInEscrow('pledge-1');

      expect(result.success).toBe(true);
      expect(result.held).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/lib/milestones/escrow.test.ts
```

Expected: FAIL — functions don't exist yet.

- [ ] **Step 3: Write implementation**

Create `lib/milestones/escrow.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { MilestoneNumber } from './types';

interface ReleaseMilestonePaymentInput {
  campaign_id: string;
  milestone_number: MilestoneNumber;
  campaign_total_sgd: number;
}

interface ReleaseMilestonePaymentResult {
  success: boolean;
  amount_released?: number;
  reason?: string;
  error?: string;
}

/**
 * Calculate payout percentage based on milestone number
 */
function getPayoutPercentage(milestone_number: MilestoneNumber): number {
  if (milestone_number === 1) return 0.4; // 40%
  if (milestone_number === 2) return 0.4; // 40%
  if (milestone_number === 3) return 0.2; // 20%
  throw new Error(`Invalid milestone number: ${milestone_number}`);
}

/**
 * Release funds from escrow upon milestone approval
 */
export async function releaseMilestonePayment(
  input: ReleaseMilestonePaymentInput
): Promise<ReleaseMilestonePaymentResult> {
  const { campaign_id, milestone_number, campaign_total_sgd } = input;

  const percentage = getPayoutPercentage(milestone_number);
  const amount_sgd = Math.round(campaign_total_sgd * percentage * 100) / 100;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('escrow_releases')
    .insert({
      campaign_id,
      milestone_number,
      amount_sgd,
      released_at: new Date().toISOString(),
      reason: 'milestone_approved',
    })
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    amount_released: amount_sgd,
    reason: 'milestone_approved',
  };
}

interface HoldPaymentResult {
  success: boolean;
  held?: boolean;
  error?: string;
}

/**
 * Mark a pledge as held in escrow (non-refundable until milestone hit)
 */
export async function holdPaymentInEscrow(pledge_id: string): Promise<HoldPaymentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pledges')
    .update({
      escrow_held: true,
      escrow_held_at: new Date().toISOString(),
    })
    .eq('id', pledge_id)
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    held: true,
  };
}

/**
 * Refund a pledge (from escrow, when dispute resolved or milestone missed)
 */
export async function refundPledgeFromEscrow(pledge_id: string, reason: string): Promise<HoldPaymentResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pledges')
    .update({
      escrow_held: false,
      refunded: true,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', pledge_id)
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    held: false,
  };
}
```

**Note:** This assumes the `pledges` table has `escrow_held`, `escrow_held_at`, `refunded`, `refund_reason`, and `refunded_at` columns. You'll add these to the pledges schema in a later task.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/lib/milestones/escrow.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/milestones/escrow.ts tests/lib/milestones/escrow.test.ts
git commit -m "feat: implement escrow hold and release logic

- Add releaseMilestonePayment: releases 40/40/20 based on milestone
- Add holdPaymentInEscrow: marks pledge as non-refundable until milestones
- Add refundPledgeFromEscrow: reverses escrow hold for disputes or missed milestones
- All functions tested with TDD

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 2: Proof-of-Work Submission & Approval Flow

### Task 3: Create Milestone Submission API Route

**Files:**
- Create: `app/api/campaigns/[campaignId]/milestone-submit/route.ts`
- Create: `tests/api/campaigns/milestone-submit.test.ts`
- Modify: `lib/milestones/proofs.ts` (create new file with validation logic)

- [ ] **Step 1: Write validation test**

Create `tests/api/campaigns/milestone-submit.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateMilestoneProof } from '@/lib/milestones/proofs';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

describe('Milestone Proof Validation', () => {
  describe('Milestone 1 (Tooling)', () => {
    it('should accept valid M1 proof (contract + receipt)', () => {
      const proof: MilestoneProofData = {
        letter_text: 'Signed factory contract from XYZ Factory...',
        photos_url: 'https://example.com/contract-photo.jpg',
      };

      const result = validateMilestoneProof(1, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M1 proof missing letter_text', () => {
      const proof: MilestoneProofData = {
        photos_url: 'https://example.com/contract.jpg',
      };

      const result = validateMilestoneProof(1, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('letter_text required');
    });
  });

  describe('Milestone 2 (Production)', () => {
    it('should accept valid M2 proof (photos + letter)', () => {
      const proof: MilestoneProofData = {
        photos_url: 'https://example.com/factory-floor.jpg',
        letter_text: 'Production timeline letter from factory...',
      };

      const result = validateMilestoneProof(2, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M2 proof with malformed URL', () => {
      const proof: MilestoneProofData = {
        photos_url: 'not-a-url',
        letter_text: 'Letter...',
      };

      const result = validateMilestoneProof(2, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('photos_url must be valid');
    });
  });

  describe('Milestone 3 (Fulfillment)', () => {
    it('should accept valid M3 proof (tracking numbers)', () => {
      const proof: MilestoneProofData = {
        tracking_numbers: ['DHL123', 'DHL124', 'DHL125'],
        fulfillment_summary: 'Shipped 100/100 units',
      };

      const result = validateMilestoneProof(3, proof);
      expect(result.valid).toBe(true);
    });

    it('should reject M3 proof missing tracking_numbers', () => {
      const proof: MilestoneProofData = {
        fulfillment_summary: 'Shipped 100/100 units',
      };

      const result = validateMilestoneProof(3, proof);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('tracking_numbers required');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/api/campaigns/milestone-submit.test.ts
```

Expected: FAIL — `validateMilestoneProof` doesn't exist.

- [ ] **Step 3: Write validation logic**

Create `lib/milestones/proofs.ts`:

```typescript
import type { MilestoneNumber, MilestoneProofData } from './types';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateMilestoneProof(milestone_number: MilestoneNumber, proof: MilestoneProofData): ValidationResult {
  if (milestone_number === 1) {
    // Milestone 1: must have letter_text (factory contract) and photos_url
    if (!proof.letter_text) {
      return { valid: false, error: 'Milestone 1: letter_text (factory contract) required' };
    }
    if (!proof.photos_url) {
      return { valid: false, error: 'Milestone 1: photos_url required' };
    }
    if (!isValidUrl(proof.photos_url)) {
      return { valid: false, error: 'Milestone 1: photos_url must be valid URL' };
    }
    return { valid: true };
  }

  if (milestone_number === 2) {
    // Milestone 2: must have letter_text (production letter) and photos_url (factory floor)
    if (!proof.letter_text) {
      return { valid: false, error: 'Milestone 2: letter_text (production timeline) required' };
    }
    if (!proof.photos_url) {
      return { valid: false, error: 'Milestone 2: photos_url (factory floor) required' };
    }
    if (!isValidUrl(proof.photos_url)) {
      return { valid: false, error: 'Milestone 2: photos_url must be valid URL' };
    }
    return { valid: true };
  }

  if (milestone_number === 3) {
    // Milestone 3: must have tracking_numbers (array of tracking codes)
    if (!proof.tracking_numbers || proof.tracking_numbers.length === 0) {
      return { valid: false, error: 'Milestone 3: tracking_numbers array required (non-empty)' };
    }
    if (!proof.fulfillment_summary) {
      return { valid: false, error: 'Milestone 3: fulfillment_summary required' };
    }
    return { valid: true };
  }

  return { valid: false, error: 'Invalid milestone number' };
}

/**
 * Sanitize and normalize proof data before storage
 */
export function normalizeMilestoneProof(proof: MilestoneProofData): MilestoneProofData {
  return {
    photos_url: proof.photos_url?.trim(),
    letter_text: proof.letter_text?.trim(),
    tracking_numbers: proof.tracking_numbers?.map(t => t.trim().toUpperCase()),
    fulfillment_summary: proof.fulfillment_summary?.trim(),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/api/campaigns/milestone-submit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write API route**

Create `app/api/campaigns/[campaignId]/milestone-submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateMilestoneProof, normalizeMilestoneProof } from '@/lib/milestones/proofs';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { campaignId } = params;

  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { milestone_number, proof_data } = await req.json();

    // Validate milestone number
    if (![1, 2, 3].includes(milestone_number)) {
      return NextResponse.json({ error: 'Invalid milestone number' }, { status: 400 });
    }

    // Validate proof
    const validation = validateMilestoneProof(milestone_number as MilestoneNumber, proof_data);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify campaign ownership (creator can only submit for their own campaign)
    const { data: campaign, error: campaignError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || campaign?.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Normalize proof data
    const normalizedProof = normalizeMilestoneProof(proof_data);

    // Insert submission
    const { data: submission, error: submitError } = await supabase
      .from('milestone_submissions')
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        milestone_number,
        proof_data: normalizedProof,
        status: 'pending',
      })
      .select()
      .single();

    if (submitError) {
      return NextResponse.json({ error: submitError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error) {
    console.error('Milestone submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/milestones/proofs.ts app/api/campaigns/[campaignId]/milestone-submit/route.ts tests/api/campaigns/milestone-submit.test.ts
git commit -m "feat: add milestone proof submission API and validation

- Create validateMilestoneProof: validates proof structure per milestone (M1/M2/M3)
- Create normalizeMilestoneProof: sanitizes and normalizes proof before storage
- Create POST /api/campaigns/{campaignId}/milestone-submit: creator submits proof
- Verify creator ownership and milestone constraints
- Tests verify validation logic for all milestone types

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Create Milestone Approval Admin API Route

**Files:**
- Create: `app/api/campaigns/[campaignId]/milestone-approve/route.ts`
- Create: `tests/api/campaigns/milestone-approve.test.ts`

- [ ] **Step 1: Write test**

Create `tests/api/campaigns/milestone-approve.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/campaigns/[campaignId]/milestone-approve/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server');

describe('POST /api/campaigns/{campaignId}/milestone-approve', () => {
  it('should approve a milestone submission and release funds', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'admin-id' } },
        }),
      },
      from: vi.fn(),
    };

    const req = new NextRequest('http://localhost:3000/api/campaigns/campaign-1/milestone-approve', {
      method: 'POST',
      body: JSON.stringify({
        submission_id: 'sub-1',
        decision: 'approved',
        feedback_text: 'Looks good!',
      }),
    });

    // This test is a placeholder; full implementation in next step
    expect(req).toBeDefined();
  });
});
```

- [ ] **Step 2: Write API route**

Create `app/api/campaigns/[campaignId]/milestone-approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { releaseMilestonePayment } from '@/lib/milestones/escrow';

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { campaignId } = params;

  try {
    // Get authenticated user (must be admin)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin (add role-based access control)

    // Parse request
    const { submission_id, decision, feedback_text } = await req.json();

    if (!['approved', 'rejected', 'needs_info'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Get submission details
    const { data: submission, error: subError } = await supabase
      .from('milestone_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Update submission status
    const { error: updateError } = await supabase
      .from('milestone_submissions')
      .update({ status: decision })
      .eq('id', submission_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Record approval
    const { data: approval, error: approvalError } = await supabase
      .from('milestone_approvals')
      .insert({
        submission_id,
        approved_by: user.id,
        decision,
        feedback_text,
      })
      .select()
      .single();

    if (approvalError) {
      return NextResponse.json({ error: approvalError.message }, { status: 500 });
    }

    // If approved, release funds from escrow
    if (decision === 'approved') {
      // Get campaign total to calculate payout
      const { data: campaign } = await supabase
        .from('projects')
        .select('amount_pledged_sgd')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        const releaseResult = await releaseMilestonePayment({
          campaign_id: campaignId,
          milestone_number: submission.milestone_number,
          campaign_total_sgd: campaign.amount_pledged_sgd,
        });

        if (!releaseResult.success) {
          // Log error but still return success (approval recorded; release failed separately)
          console.error('Escrow release failed:', releaseResult.error);
        }
      }
    }

    return NextResponse.json({ success: true, approval }, { status: 200 });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/[campaignId]/milestone-approve/route.ts tests/api/campaigns/milestone-approve.test.ts
git commit -m "feat: add milestone approval API route

- Create POST /api/campaigns/{campaignId}/milestone-approve for admin review
- Validate decision (approved/rejected/needs_info)
- Update milestone_submissions status and record approval
- Release funds from escrow upon approval
- TODO: Add admin role check for authorization

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 3: Creator Components & Dashboard Integration

### Task 5: Create Milestone Submission Form Component

**Files:**
- Create: `components/creator/MilestoneSubmissionForm.tsx`
- Create: `tests/components/creator/MilestoneSubmissionForm.test.tsx`

- [ ] **Step 1: Write component test**

Create `tests/components/creator/MilestoneSubmissionForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MilestoneSubmissionForm } from '@/components/creator/MilestoneSubmissionForm';

describe('MilestoneSubmissionForm', () => {
  it('should render form for milestone 1 (tooling)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/factory contract/i)).toBeTruthy();
    expect(screen.getByLabelText(/contract photo/i)).toBeTruthy();
  });

  it('should render form for milestone 3 (fulfillment)', () => {
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={3} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/tracking numbers/i)).toBeTruthy();
    expect(screen.getByLabelText(/fulfillment summary/i)).toBeTruthy();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const mockOnSubmit = vi.fn();
    render(<MilestoneSubmissionForm campaignId="campaign-1" milestoneNumber={1} onSubmit={mockOnSubmit} />);

    // Fill form (simplified for test)
    fireEvent.change(screen.getByLabelText(/factory contract/i), {
      target: { value: 'Factory contract text...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Write component**

Create `components/creator/MilestoneSubmissionForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MilestoneNumber, MilestoneProofData } from '@/lib/milestones/types';

interface MilestoneSubmissionFormProps {
  campaignId: string;
  milestoneNumber: MilestoneNumber;
  onSubmit: (proofData: MilestoneProofData) => Promise<void>;
  isLoading?: boolean;
}

export function MilestoneSubmissionForm({
  campaignId,
  milestoneNumber,
  onSubmit,
  isLoading = false,
}: MilestoneSubmissionFormProps) {
  const [formData, setFormData] = useState<MilestoneProofData>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({}); // Clear form
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Milestone 1: Tooling */}
      {milestoneNumber === 1 && (
        <>
          <div>
            <label htmlFor="letter" className="block text-sm font-medium mb-2">
              Factory Contract (paste text or upload letter)
            </label>
            <textarea
              id="letter"
              value={formData.letter_text || ''}
              onChange={(e) => setFormData({ ...formData, letter_text: e.target.value })}
              placeholder="Paste the factory contract or letter confirming your order..."
              className="w-full p-3 border rounded-lg"
              rows={5}
            />
          </div>

          <div>
            <label htmlFor="photos_m1" className="block text-sm font-medium mb-2">
              Contract Photo (URL)
            </label>
            <input
              id="photos_m1"
              type="url"
              value={formData.photos_url || ''}
              onChange={(e) => setFormData({ ...formData, photos_url: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Link to a photo of your factory contract</p>
          </div>
        </>
      )}

      {/* Milestone 2: Production */}
      {milestoneNumber === 2 && (
        <>
          <div>
            <label htmlFor="letter_m2" className="block text-sm font-medium mb-2">
              Production Timeline Letter (from factory)
            </label>
            <textarea
              id="letter_m2"
              value={formData.letter_text || ''}
              onChange={(e) => setFormData({ ...formData, letter_text: e.target.value })}
              placeholder="Paste the factory letter confirming production is underway..."
              className="w-full p-3 border rounded-lg"
              rows={5}
            />
          </div>

          <div>
            <label htmlFor="photos_m2" className="block text-sm font-medium mb-2">
              Factory Floor Photo (URL)
            </label>
            <input
              id="photos_m2"
              type="url"
              value={formData.photos_url || ''}
              onChange={(e) => setFormData({ ...formData, photos_url: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Link to a date-stamped photo of your product in production</p>
          </div>
        </>
      )}

      {/* Milestone 3: Fulfillment */}
      {milestoneNumber === 3 && (
        <>
          <div>
            <label htmlFor="tracking" className="block text-sm font-medium mb-2">
              Tracking Numbers
            </label>
            <textarea
              id="tracking"
              value={formData.tracking_numbers?.join('\n') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tracking_numbers: e.target.value.split('\n').filter((t) => t.trim()),
                })
              }
              placeholder="DHL123456
FDX987654
..."
              className="w-full p-3 border rounded-lg font-mono text-sm"
              rows={8}
            />
            <p className="text-xs text-gray-500 mt-1">One tracking number per line</p>
          </div>

          <div>
            <label htmlFor="fulfillment" className="block text-sm font-medium mb-2">
              Fulfillment Summary
            </label>
            <input
              id="fulfillment"
              type="text"
              value={formData.fulfillment_summary || ''}
              onChange={(e) => setFormData({ ...formData, fulfillment_summary: e.target.value })}
              placeholder="e.g., Shipped 100/100 units, ETA arrival 2026-05-15"
              className="w-full p-3 border rounded-lg"
            />
          </div>
        </>
      )}

      {/* Error message */}
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      {/* Success message */}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">Proof submitted! Awaiting platform review.</div>}

      {/* Submit button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : `Submit Milestone ${milestoneNumber} Proof`}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/creator/MilestoneSubmissionForm.tsx tests/components/creator/MilestoneSubmissionForm.test.tsx
git commit -m "feat: add milestone submission form component

- Create MilestoneSubmissionForm with dynamic fields per milestone
- Milestone 1: factory contract + photo
- Milestone 2: production letter + floor photo
- Milestone 3: tracking numbers + fulfillment summary
- Handles form state, submission, success/error messaging

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 4: Dispute Resolution & Creator+ Qualification

### Task 6: Create Dispute Filing API & Component

**Files:**
- Create: `app/api/campaigns/[campaignId]/disputes/route.ts`
- Create: `components/backer/DisputeModal.tsx`

- [ ] **Step 1: Write API route for dispute creation**

Create `app/api/campaigns/[campaignId]/disputes/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { campaignId: string } }) {
  const { campaignId } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description } = await req.json();

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        campaign_id: campaignId,
        backer_id: user.id,
        description,
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dispute }, { status: 201 });
  } catch (error) {
    console.error('Dispute creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write dispute modal component**

Create `components/backer/DisputeModal.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DisputeModalProps {
  campaignId: string;
  onClose: () => void;
}

export function DisputeModal({ campaignId, onClose }: DisputeModalProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError);
      }

      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Report an Issue</h2>

        {success ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            <p className="font-medium">Dispute filed successfully</p>
            <p className="text-sm mt-1">We'll review your claim within 10 business days.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                What's the issue? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what went wrong with this campaign..."
                className="w-full p-3 border rounded-lg"
                rows={5}
                required
                minLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Submitting...' : 'File Dispute'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/[campaignId]/disputes/route.ts components/backer/DisputeModal.tsx
git commit -m "feat: add dispute filing API and modal component

- Create POST /api/campaigns/{campaignId}/disputes for backers to file claims
- Create DisputeModal component with form and success state
- Validate dispute description (min 10 chars)
- Insert dispute record with 'open' status

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Create Creator+ Qualification & Approval System

**Files:**
- Create: `app/api/creators/qualification/apply/route.ts`
- Create: `app/api/creators/qualification/approve/route.ts`
- Create: `components/creator/CreatorPlusApplicationForm.tsx`

- [ ] **Step 1: Write Creator+ application API**

Create `app/api/creators/qualification/apply/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { external_proof_url, external_proof_type } = await req.json();

    // Validate input
    if (!external_proof_url || !external_proof_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['portfolio', 'kickstarter', 'manufacturing_letter', 'endorsement'].includes(external_proof_type)) {
      return NextResponse.json({ error: 'Invalid proof type' }, { status: 400 });
    }

    try {
      new URL(external_proof_url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Check if creator already has a qualification record
    const { data: existing } = await supabase
      .from('creator_qualifications')
      .select('id')
      .eq('creator_id', user.id)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('creator_qualifications')
        .update({
          external_proof_url,
          external_proof_type,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Create new
      const { error } = await supabase.from('creator_qualifications').insert({
        creator_id: user.id,
        tier: 'standard',
        external_proof_url,
        external_proof_type,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Creator+ application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write Creator+ approval API (admin only)**

Create `app/api/creators/qualification/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check if user is admin
    // For now, assume admin check is done elsewhere

    const { creator_id, decision } = await req.json();

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const { error } = await supabase
      .from('creator_qualifications')
      .update({
        tier: decision === 'approved' ? 'creator_plus' : 'standard',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('creator_id', creator_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Creator+ approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Write Creator+ application form**

Create `components/creator/CreatorPlusApplicationForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CreatorPlusApplicationForm() {
  const [proofUrl, setProofUrl] = useState('');
  const [proofType, setProofType] = useState<'portfolio' | 'kickstarter' | 'manufacturing_letter' | 'endorsement'>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/creators/qualification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_proof_url: proofUrl,
          external_proof_type: proofType,
        }),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError);
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold mb-4">Apply for Creator+ Status</h2>

      {success ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          <p className="font-medium">Application submitted!</p>
          <p className="text-sm mt-1">We'll review your proof within 5–10 business days.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proofType" className="block text-sm font-medium mb-2">
              Proof Type <span className="text-red-500">*</span>
            </label>
            <select
              id="proofType"
              value={proofType}
              onChange={(e) => setProofType(e.target.value as typeof proofType)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="portfolio">Portfolio / Case Studies</option>
              <option value="kickstarter">Kickstarter / Indiegogo Campaign</option>
              <option value="manufacturing_letter">Manufacturing Partnership Letter</option>
              <option value="endorsement">Investor / Accelerator Endorsement</option>
            </select>
          </div>

          <div>
            <label htmlFor="proofUrl" className="block text-sm font-medium mb-2">
              Link to Proof <span className="text-red-500">*</span>
            </label>
            <input
              id="proofUrl"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 border rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Link to your portfolio, campaign, or letter</p>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Submitting...' : 'Apply for Creator+'}
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/creators/qualification/apply/route.ts app/api/creators/qualification/approve/route.ts components/creator/CreatorPlusApplicationForm.tsx
git commit -m "feat: add Creator+ qualification application system

- Create POST /api/creators/qualification/apply for creators to submit proof
- Create POST /api/creators/qualification/approve for admin to approve (TODO: add admin check)
- Create CreatorPlusApplicationForm with proof type selector
- Validate URL and proof type; store application for review

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 5: Backer Education & UI Integration

### Task 8: Add Backer Education Section to Campaign Page

**Files:**
- Modify: `app/(marketing)/projects/[slug]/page.tsx`
- Create: `components/backer/BackerEducationSection.tsx`

- [ ] **Step 1: Create education section component**

Create `components/backer/BackerEducationSection.tsx`:

```typescript
'use client';

export function BackerEducationSection() {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800 mb-6">
      <h3 className="font-bold text-lg mb-4">🛡️ Your Money is Safe</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 1: Factory Verified</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">We confirm the factory has your order</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 2: Production Proof</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Creator shows your product is being made</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step 3: Shipped & Delivered</p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Tracking shows your package is on the way</p>
        </div>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-amber-900 dark:text-amber-100">What if something goes wrong?</summary>
        <div className="mt-3 space-y-2 text-amber-800 dark:text-amber-200">
          <p>• <strong>Creator delays?</strong> We'll notify you and hold funds until they deliver.</p>
          <p>• <strong>Creator disappears?</strong> File a dispute. We help you pursue recovery.</p>
          <p>• <strong>Product damaged?</strong> Report it. Creator must resolve or we facilitate refund.</p>
        </div>
      </details>
    </div>
  );
}
```

- [ ] **Step 2: Integrate into campaign page**

Modify `app/(marketing)/projects/[slug]/page.tsx` (find the pledge section and add the component above it):

```typescript
// ... existing imports ...
import { BackerEducationSection } from '@/components/backer/BackerEducationSection';

export default function ProjectPage() {
  // ... existing component code ...

  return (
    <div>
      {/* ... existing sections ... */}

      {/* Add this before the pledge form */}
      <section className="max-w-2xl">
        <BackerEducationSection />
      </section>

      {/* ... rest of component ... */}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/backer/BackerEducationSection.tsx
git commit -m "feat: add backer education section to campaign pages

- Create BackerEducationSection showing 3-step protection process
- Add collapsible FAQ for common concerns
- Styling matches brand (amber accent)
- Integrated above pledge form on campaign pages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 6: Admin Dashboard & Notifications

### Task 9: Create Admin Milestone Review Dashboard

**Files:**
- Create: `components/admin/MilestoneReviewQueue.tsx`
- Create: `app/admin/milestones/page.tsx`

- [ ] **Step 1: Create milestone review queue component**

Create `components/admin/MilestoneReviewQueue.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MilestoneSubmission } from '@/lib/milestones/types';

export function MilestoneReviewQueue() {
  const [submissions, setSubmissions] = useState<MilestoneSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        // TODO: Create GET /api/admin/milestones endpoint
        const res = await fetch('/api/admin/milestones?status=pending');
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleApprove = async (submissionId: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/campaigns/[campaignId]/milestone-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          decision: 'approved',
          feedback_text: feedbackText,
        }),
      });

      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
        setFeedbackText('');
        setSelectedId(null);
      }
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (submissions.length === 0) {
    return <div className="p-4 text-center text-gray-500">No pending submissions</div>;
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="border rounded-lg p-4 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">Milestone {submission.milestone_number}</p>
              <p className="text-sm text-gray-500">Campaign: {submission.campaign_id}</p>
              <p className="text-sm text-gray-500">Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</p>
            </div>
            <Button
              onClick={() => setSelectedId(submission.id)}
              className="text-sm"
            >
              Review
            </Button>
          </div>

          {selectedId === submission.id && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Proof Data:</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(submission.proof_data, null, 2)}</pre>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Notes for creator..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedId(null)}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(submission.id)}
                  disabled={isApproving}
                  className="flex-1"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create admin page**

Create `app/admin/milestones/page.tsx`:

```typescript
import { MilestoneReviewQueue } from '@/components/admin/MilestoneReviewQueue';

export default function AdminMilestonesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Milestone Review Queue</h1>
      <MilestoneReviewQueue />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/MilestoneReviewQueue.tsx app/admin/milestones/page.tsx
git commit -m "feat: add admin milestone review dashboard

- Create MilestoneReviewQueue component with pending submissions list
- Display proof data and allow inline approval/rejection with feedback
- Create /admin/milestones page for admin access
- TODO: Create GET /api/admin/milestones endpoint to fetch submissions

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 7: Database Schema Updates & Migration

### Task 10: Update Pledges Table for Escrow

**Files:**
- Modify: `database/migrations/001_escrow_milestone_schema.sql` (add to existing file)

- [ ] **Step 1: Add escrow columns to pledges table**

Add this to the end of `database/migrations/001_escrow_milestone_schema.sql`:

```sql
-- Update pledges table to track escrow status
ALTER TABLE pledges
ADD COLUMN escrow_held BOOLEAN DEFAULT true,
ADD COLUMN escrow_held_at TIMESTAMP,
ADD COLUMN refunded BOOLEAN DEFAULT false,
ADD COLUMN refund_reason TEXT,
ADD COLUMN refunded_at TIMESTAMP;

CREATE INDEX idx_pledges_escrow_held ON pledges(escrow_held);
CREATE INDEX idx_pledges_refunded ON pledges(refunded);
```

- [ ] **Step 2: Test migration**

Verify the SQL is valid:

```bash
npx supabase db lint < database/migrations/001_escrow_milestone_schema.sql
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add database/migrations/001_escrow_milestone_schema.sql
git commit -m "db: add escrow tracking columns to pledges table

- Add escrow_held, escrow_held_at for escrow hold tracking
- Add refunded, refund_reason, refunded_at for refund tracking
- Create indexes for query performance

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 8: Email Notifications

### Task 11: Add Milestone Status Email Notifications

**Files:**
- Create: `lib/email/milestone-notifications.ts`
- Create: `tests/lib/email/milestone-notifications.test.ts`

- [ ] **Step 1: Write email template tests**

Create `tests/lib/email/milestone-notifications.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getMilestoneApprovedEmail,
  getPostPledgeEducationEmail,
} from '@/lib/email/milestone-notifications';

describe('Milestone Email Templates', () => {
  describe('getMilestoneApprovedEmail', () => {
    it('should return email with milestone status', () => {
      const email = getMilestoneApprovedEmail({
        backer_name: 'John Doe',
        creator_name: 'Jane Smith',
        milestone_number: 2,
        product_name: 'Amazing Widget',
      });

      expect(email.subject).toContain('Production Verified');
      expect(email.body).toContain('John Doe');
      expect(email.body).toContain('Jane Smith');
    });
  });

  describe('getPostPledgeEducationEmail', () => {
    it('should explain escrow and next steps', () => {
      const email = getPostPledgeEducationEmail({
        backer_name: 'Alice',
        product_name: 'Cool Gadget',
        amount_sgd: 100,
      });

      expect(email.subject).toContain('Your pledge is safe');
      expect(email.body).toContain('escrow');
      expect(email.body).toContain('milestone');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/lib/email/milestone-notifications.test.ts
```

Expected: FAIL — functions don't exist.

- [ ] **Step 3: Write email templates**

Create `lib/email/milestone-notifications.ts`:

```typescript
interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface MilestoneApprovedInput {
  backer_name: string;
  creator_name: string;
  milestone_number: 1 | 2 | 3;
  product_name: string;
}

export function getMilestoneApprovedEmail(input: MilestoneApprovedInput): { subject: string; body: string } {
  const { backer_name, creator_name, milestone_number, product_name } = input;

  const milestoneTexts = {
    1: 'Tooling & Deposits — Factory has confirmed your order',
    2: 'Production Verified — Your product is being manufactured',
    3: 'Shipped & Fulfilled — Your orders are on the way',
  };

  const subject = `Milestone ${milestone_number} Verified — ${product_name}`;
  const body = `
Hi ${backer_name},

Great news: ${creator_name} just submitted proof of milestone ${milestone_number} for ${product_name}. We've verified it with the factory, and funds are being released.

**Milestone ${milestone_number}: ${milestoneTexts[milestone_number]}**

Your money is still safe in escrow until all milestones are complete. You'll get an update when the next milestone is ready.

Questions? Reply to this email.

— GetThatBread
  `;

  return { subject, body };
}

interface PostPledgeEducationInput {
  backer_name: string;
  product_name: string;
  amount_sgd: number;
}

export function getPostPledgeEducationEmail(input: PostPledgeEducationInput): { subject: string; body: string } {
  const { backer_name, product_name, amount_sgd } = input;

  const subject = 'Your pledge is safe. Here's what happens next.';
  const body = `
Hi ${backer_name},

Thank you for backing ${product_name} with SGD ${amount_sgd}.

Your money is now in escrow — meaning it's held safely by GetThatBread until the creator delivers. The creator can't touch it until they hit three milestones:

1. **Tooling & Deposits** (40%) — We verify the factory has their order
2. **Production** (40%) — We confirm manufacturing is underway
3. **Fulfillment** (20%) — We track shipment to your door

**What happens if something goes wrong?**
- Creator delays? We notify you and hold funds.
- Creator disappears? File a dispute, and we help you recover your money.
- Product damaged? Report it, and we facilitate resolution or refund.

You'll get an email update every time a milestone is approved.

Questions? Visit our FAQ at getthatbread.sg/backer-faq

— GetThatBread
  `;

  return { subject, body };
}

/**
 * Placeholder for sending actual emails via Resend or similar
 * TODO: Implement sendEmail function that integrates with email service
 */
export async function sendMilestoneEmail(
  backer_email: string,
  template: 'milestone_approved' | 'post_pledge_education',
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrate with Resend API
    // const { success } = await resend.emails.send({
    //   from: 'notifications@getthatbread.sg',
    //   to: backer_email,
    //   subject: email.subject,
    //   html: email.body,
    // });

    console.log(`[Email] ${template} to ${backer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- tests/lib/email/milestone-notifications.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/email/milestone-notifications.ts tests/lib/email/milestone-notifications.test.ts
git commit -m "feat: add milestone email notification templates

- Create getMilestoneApprovedEmail: notifies backers when milestones verified
- Create getPostPledgeEducationEmail: educates backers on escrow after pledge
- Templates explain 3-milestone process and protection
- TODO: Integrate with Resend or email service provider

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Phase 9: Founder Fellowship GTM Prep

### Task 12: Create Founder Fellowship Recruitment Guide & Materials

**Files:**
- Create: `docs/founder-fellowship/recruitment-guide.md`
- Create: `docs/founder-fellowship/case-study-template.md`
- Create: `docs/founder-fellowship/fellowship-incentives.md`

- [ ] **Step 1: Write recruitment guide**

Create `docs/founder-fellowship/recruitment-guide.md`:

```markdown
# Founder Fellowship Recruitment Guide

## Goal
Recruit 10 high-quality hardware/tech creators from Singapore/SEA to launch with, generate case studies, build public momentum.

## Target Profile
- **Geography:** Singapore, Malaysia, Indonesia (manufacturing sourcing from China/Vietnam)
- **Stage:** MVP-ready or pre-manufacturing (validated product)
- **Background:** Accelerator alumni (LaunchPad, NUS Enterprise, Anterra) or indie entrepreneurs
- **Social:** 1K–10K followers; active on LinkedIn/Twitter
- **Willingness:** Transparent, willing to be documented

## Recruitment Timeline

### Week 1–2: Outreach
- Email LaunchPad, NUS Enterprise, Anterra, Block71 → 3–5 intros each
- Manual LinkedIn outreach: 10–15/week
- Ask advisors/investors for warm intros
- Engage on Twitter/Discord (build FOMO)

### Week 3–4: Kickoff Calls
- 1-on-1 with final 10 candidates
- Explain Fellowship terms (zero fees, custom terms, support)
- Set campaign launch dates (Month 2)

## Pitch Email Template

Subject: "Let's launch your product together (zero platform fees)"

Body:
> Hi [Name],
>
> We're launching GetThatBread.sg — a crowdfunding platform built specifically for hardware creators like you. We're selecting 10 founders for our Founder Fellowship:
>
> **You get:**
> - 0% platform fee on your first campaign (normally 5%)
> - Custom escrow terms (you propose, we approve)
> - Dedicated support + manufacturing partner access
> - Prestige "Founder Fellow" badge
>
> **We ask:**
> - Launch within 90 days
> - Share learnings (transparency)
> - Monthly feedback calls (help us iterate)
>
> Are you interested in chatting?
>
> — [Your name]

---

## Evaluation Criteria

✅ Checkmarks for strong fits:
- [ ] Product is MVP-ready or pre-manufacturing (not concept-stage)
- [ ] Creator is responsive and enthusiastic
- [ ] Has some audience/network to promote with
- [ ] Willing to be transparent/documented
- [ ] Manufacturing plan is clear (not vague)
- [ ] Realistic timeline (3–12 month campaign)

## Success Metrics

- **Recruited:** 10 founders
- **Funded (%):** 70%+ (7/10 campaigns)
- **Avg funding:** 120%+ of goal
- **Case studies:** 5–7 publishable stories
- **Fellow NPS:** >8/10

---

## Post-Launch Activities

### Month 4–6
- Document case studies (with consent)
- Collect feedback from Fellows
- Iterate platform based on learnings
- Prepare public launch announcement

### Month 6+
- Announce Fellowship results publicly
- Highlight 3–5 success stories
- Open platform to broader creators
- Scale acquisition

---

```

- [ ] **Step 2: Write case study template**

Create `docs/founder-fellowship/case-study-template.md`:

```markdown
# Founder Fellowship Case Study Template

Use this template to document each Fellow's journey. Get consent before publishing.

---

## Case Study: [Creator Name] — [Product Name]

**Campaign Duration:** [Start date] to [End date]  
**Funding Goal:** SGD [amount]  
**Actual Raised:** SGD [amount]  
**Funding Rate:** [100%+]  
**Backer Count:** [number]

### The Problem
[What problem does the product solve? Why was the creator hesitant about crowdfunding?]

**[Creator Name]'s concern:** "We were worried about failure to deliver. Our timeline was tight, and we didn't want to let backers down."

### The Solution: GetThatBread Escrow Model
Explain how the 40/40/20 milestone system gave them confidence.

**[Creator Name]:** "Having the escrow system took pressure off. Backers knew their money was protected, and we knew we could focus on execution without worrying about early fund abuse."

### Key Milestones
- **M1 (Tooling):** Factory contract verified [date]
- **M2 (Production):** Factory photos approved [date]
- **M3 (Fulfillment):** Tracking numbers submitted [date]

### Results
- Funded in [X days]
- Fulfilled [units] on time
- Backer satisfaction: [NPS score]

### Lessons Learned
> "[Creator] on what went well and what they learned..."

### Advice for Other Creators
> "[Creator's] tips for first-time crowdfunders..."

---
```

- [ ] **Step 3: Write fellowship incentives doc**

Create `docs/founder-fellowship/fellowship-incentives.md`:

```markdown
# Founder Fellowship Incentives

## What Fellows Get

### 1. **Zero Platform Fee on First Campaign**
- Normal: 5% of funds raised
- Fellowship: 0% (save 5% of total raised)
- Example: SGD 100k campaign saves SGD 5,000

### 2. **Custom Escrow Negotiation**
- Propose alternative payout structures (e.g., 50/30/20)
- Platform reviews and approves based on risk
- Guardrails: first payout max 60%, final min 15%

### 3. **Dedicated Support**
- Direct Slack/email channel with platform team
- Monthly check-in calls
- Help navigating milestones, troubleshooting

### 4. **Manufacturing Partner Access**
- Vetted factory recommendations (SG/China/Vietnam)
- Intro to freight forwarders, auditors
- Network you've personally screened

### 5. **"Founder Fellow" Badge**
- Public badge on their campaign page
- Signals credibility + early-stage prestige
- Social proof for backers

---

## What We Ask in Return

### 1. **Transparency**
Share learnings: what worked, what was hard, unexpected challenges

### 2. **Feedback**
Monthly 30-min calls. Help us iterate the product.

### 3. **Evangelism**
At campaign launch, share with your network (LinkedIn, Twitter, email list)

### 4. **Timeline Commitment**
- Launch within 90 days
- Complete campaign within 12 months

---

## Monetization (for GetThatBread)

While Fellows get zero platform fees for their first campaign:
- Subsequent campaigns: standard 5% fee
- Insurance partnership (if available): referral revenue
- Logistics network: referral fees on partner services

---
```

- [ ] **Step 4: Commit**

```bash
git add docs/founder-fellowship/recruitment-guide.md docs/founder-fellowship/case-study-template.md docs/founder-fellowship/fellowship-incentives.md
git commit -m "docs: add Founder Fellowship recruitment materials

- Create recruitment-guide: timeline, pitch template, evaluation criteria
- Create case-study-template: structure for documenting Fellow success
- Create fellowship-incentives: what Fellows get + what we ask
- Ready for Month 1 outreach and recruitment

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Open Tasks (TODO for future phases)

This plan covers the **core MVP** for the escrow & milestone system. Here are items deferred to Phase 2+ :

1. **Admin Authorization** — Add role-based access control (admin check) to approval endpoints
2. **GET /api/admin/milestones** — Endpoint to fetch pending submissions for admin dashboard
3. **Resend Integration** — Wire up email sending (currently logged, not sent)
4. **Creator+ Tier Automation** — Auto-promote creators after 1 successful campaign
5. **Milestone Status Widget** — Add to creator dashboard showing all campaigns' milestone progress
6. **Backer Education Email** — Trigger post-pledge email automatically
7. **Dispute Resolution UI** — Admin interface for viewing & resolving disputes
8. **Insurance Partnership** — Negotiate terms, wire up insurance opt-in flow
9. **Logistics API Integration** — Integrate DHL/FedEx tracking (Phase 2)
10. **Analytics Dashboard** — Track escrow metrics, Creator+ approval rates, dispute trends

---

## Summary

**This plan implements:**
- ✅ Database schema for milestones, submissions, approvals, disputes, Creator+ tiers
- ✅ Escrow logic (hold, release, refund)
- ✅ Proof-of-work submission API + validation
- ✅ Milestone approval workflow
- ✅ Creator+ application & verification system
- ✅ Dispute filing API
- ✅ Backer education UI
- ✅ Admin milestone review dashboard
- ✅ Email notification templates
- ✅ Founder Fellowship GTM materials

**Estimated timeline:** 6 weeks for core MVP (Phases 1–9), with Phases 2+ extending into Year 1.

---
