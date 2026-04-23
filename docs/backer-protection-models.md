# Backer Protection System — Models & Architecture

**Date:** April 23, 2026  
**Status:** Live (PR #52 merged to main)

## Overview

The backer protection system safeguards crowdfunding backers through:
- **Escrow holding** — funds held until milestones are met
- **Milestone-based releases** — 40/40/20 payout split across 3 milestones
- **Admin approval** — human review of creator proof submissions
- **Dispute resolution** — backers can file claims if creators fail to deliver
- **Creator vetting** — multi-tier qualification system

---

## 1. Escrow Model

### Purpose
All pledge funds are held in escrow until the creator completes milestone deliverables. Funds are only released when milestones are approved by platform admin.

### Key Fields (pledges table)
```
escrow_held: boolean (default: true)
escrow_held_at: timestamp
refunded: boolean (default: false)
refund_reason: text
refunded_at: timestamp
```

### Flow
1. Backer pledges funds → `escrow_held = true`
2. Creator submits milestone proof → admin reviews
3. Admin approves → funds released via `escrow_releases` table
4. Funds move from escrow to creator's payouts
5. If dispute filed → `refunded = true, refund_reason` populated

---

## 2. Milestone Submission Model

### Purpose
Creators provide proof that they've completed each milestone (factory photos, shipping tracking, etc.)

### Database Table: `milestone_submissions`
```sql
CREATE TABLE milestone_submissions (
  id UUID PRIMARY KEY,
  campaign_id UUID (references projects),
  creator_id UUID (references profiles),
  milestone_number INT (1, 2, or 3),
  proof_data JSONB,
  submitted_at TIMESTAMP,
  status TEXT ('pending', 'approved', 'rejected', 'needs_info'),
  created_at TIMESTAMP
);
```

### Proof Data Structure
```typescript
interface MilestoneProofData {
  photos_url?: string;           // Factory/production photos
  letter_text?: string;          // Official letter from factory
  tracking_numbers?: string[];   // Shipping tracking numbers
  fulfillment_summary?: string;  // Units shipped, expected delivery
}
```

### Milestone Schedule
- **M1 (40%):** Factory production complete, photos/letter from manufacturer
- **M2 (40%):** Units manufactured and ready to ship, tracking numbers provided
- **M3 (20%):** Units shipped to backers, fulfillment completed

---

## 3. Milestone Approval Model

### Purpose
Platform admins review proof submissions and decide whether to approve fund release.

### Database Table: `milestone_approvals`
```sql
CREATE TABLE milestone_approvals (
  id UUID PRIMARY KEY,
  submission_id UUID (references milestone_submissions),
  approved_by UUID (references profiles - admin),
  decision TEXT ('approved', 'rejected', 'needs_info'),
  feedback_text TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Approval Process
1. Creator submits proof → `milestone_submissions.status = 'pending'`
2. Admin reviews submission via `/api/campaigns/[campaignId]/milestone-approve`
3. Admin decision options:
   - **approved** → funds released, `escrow_releases` record created
   - **rejected** → funds held, creator can resubmit (or dispute filed)
   - **needs_info** → feedback sent, creator resubmits

### Admin-Only Endpoint
```
POST /api/campaigns/[campaignId]/milestone-approve

Headers: Authorization (verified via supabase auth + is_admin check)

Body:
{
  submission_id: string,
  decision: 'approved' | 'rejected' | 'needs_info',
  feedback_text?: string
}
```

---

## 4. Escrow Release Model

### Purpose
Audit trail showing when funds were released from escrow and for which milestone.

### Database Table: `escrow_releases`
```sql
CREATE TABLE escrow_releases (
  id UUID PRIMARY KEY,
  campaign_id UUID (references projects),
  milestone_number INT (1, 2, or 3),
  amount_sgd NUMERIC(12, 2),
  released_at TIMESTAMP,
  reason TEXT ('milestone_approved'),
  created_at TIMESTAMP
);
```

### Release Logic
- **M1 approved:** Release 40% of total pledged amount
- **M2 approved:** Release 40% of total pledged amount
- **M3 approved:** Release remaining 20%

Amount calculation:
```
total_escrow = sum(pledges where campaign_id = X and escrow_held = true)
m1_release = total_escrow * 0.40
m2_release = total_escrow * 0.40
m3_release = total_escrow * 0.20
```

---

## 5. Dispute Model

### Purpose
Backers can file claims if creators fail to deliver, triggering investigation and potential refund.

### Database Table: `disputes`
```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  campaign_id UUID (references projects),
  backer_id UUID (references profiles),
  description TEXT,
  filed_at TIMESTAMP,
  status TEXT ('open', 'investigating', 'resolved', 'refunded'),
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Dispute Lifecycle
1. Backer files dispute → `status = 'open'`
2. Platform reviews → `status = 'investigating'`
3. Decision made:
   - **Refund:** `status = 'refunded'`, pledge `refunded = true, refund_reason = 'dispute'`
   - **Close:** `status = 'resolved'`, `resolution_notes` explain decision

### Refund Process
```
dispute.status = 'refunded'
  ↓
pledge.refunded = true
pledge.refund_reason = 'dispute'
pledge.refunded_at = NOW()
  ↓
Backer payment method credited (via Stripe/payment processor)
```

---

## 6. Creator Qualification Model

### Purpose
Multi-tier system to vet creators and unlock features based on track record.

### Database Table: `creator_qualifications`
```sql
CREATE TABLE creator_qualifications (
  id UUID PRIMARY KEY,
  creator_id UUID (references profiles),
  tier TEXT ('standard', 'creator_plus'),
  completed_campaigns_count INT,
  external_proof_url TEXT,
  external_proof_type TEXT ('portfolio', 'kickstarter', 'manufacturing_letter', 'endorsement'),
  approved_at TIMESTAMP,
  approved_by UUID (references profiles - admin),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tier System
- **Standard:** Default for all new creators, basic campaign features
- **Creator+:** Unlocked after completing campaigns successfully
  - Proof: Portfolio link, Kickstarter history, manufacturing endorsement, admin endorsement
  - Benefits: Extended campaign duration, higher pledge limits, premium support

### Qualification Flow
1. Creator submits proof (portfolio URL, Kickstarter link, letter from manufacturer, etc.)
2. Admin reviews: `/api/creators/qualification/apply` endpoint
3. Admin approves → `tier = 'creator_plus'`, `approved_by` set, `approved_at` recorded
4. Creator gains access to Creator+ features

---

## 7. Access Control (RLS Policies)

### Row-Level Security Enforcement

#### Who can view/edit milestone submissions?
- **Creator:** Can view/create only their own submissions
- **Admin:** Can view all, approve/reject any
- **Backer:** Can view (read-only) for campaigns they backed

#### Who can file disputes?
- **Backer:** Can file disputes for campaigns they backed (status = their pledge)
- **Admin:** Can view/update any dispute
- **Creator:** Cannot access dispute table

#### Who can approve milestones?
- **Admin only:** `is_admin = true` verified server-side before allowing approval

#### Who can view qualifications?
- **Admin:** Can view all creator qualifications
- **Creator:** Can view/update only their own
- **Public:** Tier only visible on creator profile

---

## 8. API Endpoints

### Milestone Submission
```
POST /api/campaigns/[campaignId]/milestone-submit
  Creator submits proof for a milestone
  
POST /api/campaigns/[campaignId]/milestone-approve
  Admin approves/rejects/requests more info
```

### Disputes
```
POST /api/campaigns/[campaignId]/disputes
  Backer files a dispute
  
GET /api/campaigns/[campaignId]/disputes
  Admin views disputes for campaign
```

### Creator Qualifications
```
POST /api/creators/qualification/apply
  Creator applies for Creator+ tier
  
GET /api/dashboard/creator-profile
  Creator views their qualification status
```

---

## 9. Payment Flow Example

### Successful Campaign (All Milestones Approved)

```
Day 1: Campaign funded
  pledges.escrow_held = true ✓
  Total: $10,000 SGD in escrow

Day 45: Milestone 1 approved (factory production)
  escrow_releases created: 40% = $4,000
  pledges.escrow_held = false (for M1 portion)
  Creator receives payout via payouts table

Day 90: Milestone 2 approved (units ready to ship)
  escrow_releases created: 40% = $4,000
  Creator receives payout

Day 120: Milestone 3 approved (units delivered)
  escrow_releases created: 20% = $2,000
  Creator receives final payout
  Campaign complete, all funds released
```

### Disputed Campaign (M2 Failed)

```
Day 1: Campaign funded
  pledges.escrow_held = true ✓
  Total: $10,000 SGD

Day 45: M1 approved
  escrow_releases: $4,000
  Creator receives first payout

Day 100: Creator doesn't submit M2 proof
  Backers become concerned, file dispute

Day 110: Platform investigates, decides creator failed
  disputes.status = 'refunded'
  
Day 115: Refund processed
  pledges.refunded = true
  pledges.refund_reason = 'dispute'
  pledges.refunded_at = timestamp
  Backer's payment method credited with remaining $6,000 + refund of first $4,000
```

---

## 10. Security Considerations

### Admin-Only Operations
- All `milestone_approvals` requires `is_admin = true` check
- `creator_qualifications.approve` only admin can set `approved_by` and `approved_at`
- Dispute resolution only admin

### Data Isolation (RLS)
- Creators can only see their own submissions
- Backers can see campaigns they backed, but not other backers' data
- Admins have full visibility

### Fraud Prevention
- Escrow prevents creators from claiming full payment upfront
- Milestones prevent creators from disappearing mid-project
- Disputes provide recourse if creator fails to deliver
- Photo/letter verification from official manufacturers adds legitimacy check

---

## Database Schema Summary

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `pledges` | Track backer funds | `escrow_held`, `refunded`, `refund_reason` |
| `milestone_submissions` | Creator proof uploads | `proof_data` (JSONB), `status` |
| `milestone_approvals` | Admin review records | `decision`, `feedback_text` |
| `escrow_releases` | Fund release audit trail | `amount_sgd`, `milestone_number` |
| `disputes` | Backer claims | `status`, `resolution_notes` |
| `creator_qualifications` | Creator vetting tier | `tier`, `external_proof_*` |

---

## Success Metrics

1. **Backer Safety:** 100% of funds in escrow until milestones complete
2. **Creator Incentive:** Clear milestone path to payment, transparent approval process
3. **Platform Trust:** Audit trail for all fund movements and approvals
4. **Dispute Resolution:** <7 day investigation time for disputes filed

