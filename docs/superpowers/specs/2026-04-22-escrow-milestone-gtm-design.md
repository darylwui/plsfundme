# Escrow & Milestone System + Founder Fellowship GTM Design
**Date:** 2026-04-22  
**Project:** GetThatBread.sg — High-Trust Crowdfunding for Hardware/Product Creators  
**Scope:** System design for mandatory milestone-based escrow, creator tier incentives, founder acquisition, and backer protection  

---

## Overview

GetThatBread solves the "failure to deliver" problem in crowdfunding by implementing a **mandatory escrow & milestone system** that protects backers while rewarding proven creators. This design covers:

1. Core escrow mechanics and creator tiers
2. Backer protection & dispute resolution
3. Low-friction proof-of-work verification
4. Edge case handling with tier-based flexibility
5. Alternative revenue streams (insurance, logistics, data)
6. Backer psychology & messaging
7. Founder Fellowship GTM strategy

**Key Principle:** All creators launch with a default 40/40/20 payout split. Proven creators (Creator+ tier) unlock custom structures, more autonomy, and faster approval workflows. Backers are always protected; the system feels like *protection*, not bureaucracy.

---

## Section 1: Core Escrow & Creator Tier System

### Base Escrow Model (All Creators)

All campaigns default to a **three-milestone payout structure:**

- **Milestone 1 (40%):** Tooling & Deposits  
  - Released upon: creator submits signed factory contract + payment receipt  
  - Platform verifies: direct contact with factory, order confirmation  
  - Timeline: 3–5 business days  

- **Milestone 2 (40%):** Proof of Production  
  - Released upon: creator submits factory photos (date-stamped) + production timeline letter  
  - Platform verifies: spot-check via factory call/email; request video if >SGD 50k  
  - Timeline: 5–7 business days  

- **Milestone 3 (20%):** Fulfillment & Shipping  
  - Released upon: creator submits tracking numbers for all shipments + fulfillment summary  
  - Platform verifies: spot-check 10–20% of tracking numbers manually (Phase 1); API auto-verification in Phase 2  
  - Timeline: 10–15 business days  

**Platform fee:** 5% of funds raised (non-negotiable across both tiers)

---

### Creator Tiers: Standard vs Creator+

#### **Standard Creator (First-Time or Unproven)**
Creators on their first campaign, or without external credibility signals.

**Constraints:**
- Locked into 40/40/20 payout structure (no negotiation)
- 15-day auto-approval for production delays; beyond that requires justification
- Must justify shipping cost overruns; approval up to 50% of final 20%
- Partial fulfillment: lose the final 20%; unfulfilled backers refunded from escrow
- Response requirement: 48 hours (to support requests, silence flags)

**Support Provided:**
- Onboarding guide + milestone checklist
- Email templates for communicating with factory, freight forwarders
- Pre-vetted manufacturer/logistics partner directory (optional)
- Direct Slack/email support channel during campaign

---

#### **Creator+ Tier (Proven Track Record)**
Creators with ≥1 successful campaign on GetThatBread + external credibility signals (portfolio, past Kickstarter success, manufacturing partnerships, third-party endorsements).

**Unlocks:**
- **Custom escrow negotiation** — Creator can propose alternative payout structures (e.g., 50/30/20, 45/35/20) subject to platform approval
  - Guardrails: first payout max 60%, final payout min 15%
  - Approval criteria: creator justifies changes, risk is acceptable
- **Extended delay grace period** — 30-day auto-approval for production delays (vs. 15 days for Standard)
- **Shipping cost flexibility** — Up to 10% overrun auto-approved; beyond that requires justification
- **Partial fulfillment grace** — You work with creator on a refund plan (e.g., refund unfulfilled backers, creator keeps 20% if promising to ship remainder within X days)
- **Faster response window** — 72 hours (vs. 48) to respond to support requests
- **Exclusive features:**
  - Direct support line (faster responses)
  - Access to manufacturing partner network (vetted factories, auditors, logistics)
  - "Creator+" badge on campaign (prestige signal)

**How to Achieve Creator+ Status:**
1. Complete 1+ successful campaign on GetThatBread with on-time delivery
2. Provide external credibility signals (portfolio, past success, endorsements) reviewed by platform

---

## Section 2: Backer Protection & Dispute Resolution

### Philosophy
Backers are protected throughout the campaign lifecycle. The platform's role is to verify, escalate issues, and facilitate recovery—not to automatically refund from platform reserves (unless insurance is in place).

### Dispute Resolution Flow

#### **Phase 1: Milestone Miss Detection**
- Creator was supposed to hit a milestone by deadline X; doesn't submit proof
- Platform flags automatically; sends creator warning + 7-day cure window
- If creator responds within 7 days with progress: extend deadline; no escalation
- If creator goes silent: proceed to Phase 2

#### **Phase 2: Dispute Initiation**
- Backers can file a claim via dashboard (describe expectation vs. what happened)
- GetThatBread reviews claim + creator response within 10 business days
- Decision options:
  - **(a) Release milestone funds** — Creator gets benefit of doubt; timeline extended
  - **(b) Hold funds pending more evidence** — Request additional proof; extend review deadline
  - **(c) Initiate refund & suspend creator** — Creator failed to provide satisfactory response; backers get refunded from escrow

#### **Phase 3: Escalation & Recovery**
- If funds are refunded to backers but creator spent them: GetThatBread logs case for legal pursuit
- Backers receive:
  - Claim documentation (evidence you collected)
  - Creator contact info
  - Guide to small claims in their jurisdiction
  - Option to participate in group recovery action (if multiple backers affected)

### Creator Consequences for Failure

**First offense:**
- 30-day account suspension
- Creator must complete a "remediation plan" with platform before unlocking Creator+ tier again
- If already Creator+, reverted to Standard tier for next campaign

**Repeated offenses (2+):**
- Permanent ban from platform
- Backer recovery efforts continue (legal action encouraged)

---

## Section 3: Proof-of-Work — Streamlined Verification

### Principle
Creators submit proof at each milestone via dashboard forms. Platform verifies internally. Backers only see milestone status (✓ Approved / ⏳ In Review / ⚠️ Delayed), not raw proof.

### Milestone 1: Tooling & Deposits
**Creator submits:**
- Signed contract/PO from factory
- Payment receipt or invoice showing deposit amount

**Platform verifies:**
- Contact factory directly (phone, email)
- Confirm order is on their books
- Confirm creator's name, product specs, timeline

**Timeline:** 3–5 business days

---

### Milestone 2: Proof of Production
**Creator submits:**
- Factory photos (date-stamped, showing production floor / product units)
- Production timeline letter signed by factory manager (on official letterhead, with contact info)

**Platform verifies:**
- Email/call factory to confirm letter is authentic
- For large campaigns (>SGD 50k): request 5–10 min video walkthrough of production floor / packaging
- Spot-check: do photos/video match factory location claimed?

**Timeline:** 5–7 business days

---

### Milestone 3: Fulfillment & Shipping
**Creator submits:**
- Tracking numbers for all shipments (paste into dashboard form)
- Fulfillment summary: units shipped, destinations, ETA delivery

**Platform verifies:**
- Phase 1 (MVP): Manually spot-check 10–20% of tracking numbers by calling courier or checking courier website
- Phase 2 (Post-launch): Integrate with DHL/FedEx/local courier APIs to auto-verify tracking data in real-time

**Timeline:** 10–15 business days (depends on courier responsiveness)

---

## Section 4: Edge Cases & Tier-Based Flexibility

### Edge Case 1: Production Delay

**What happens:** Creator hits Milestone 1, but factory needs extra time before Milestone 2

**Standard Creator Policy:**
- Can request **15-day extension** (auto-approved, no questions)
- Beyond 15 days: must submit explanation + revised factory timeline + proof of progress
- Platform approves or requests more evidence

**Creator+ Tier Policy:**
- Can request **30-day extension** (auto-approved, no questions)
- Beyond 30 days: same review process as Standard, but platform prioritizes faster approval

**Backer messaging:** "Campaign updated: production delayed to [new date]. Your funds remain safely in escrow."

---

### Edge Case 2: Partial Fulfillment

**What happens:** Creator ships 60% of orders, then runs out of money; can't ship final 40%

**Standard Creator Policy:**
- Creator forfeits the final 20% (no release)
- Funds for unfulfilled backers are refunded from escrow
- Fulfilled backers keep their order (shipped); no refund
- Creator can appeal only if there's proof of external shock (factory bankruptcy, freight disaster), burden on them to prove

**Creator+ Tier Policy:**
- Platform works with creator on a **refund plan** (vs. automatic forfeit)
- Example: Creator keeps 20% if they commit in writing to ship remaining orders within 30 days; platform monitors
- If creator fails to deliver within 30 days: full 20% is refunded to unfulfilled backers
- Allows creator to keep some upside if they have a real plan to recover

**Why this works:** Standard creators learn to plan conservatively; Creator+ creators aren't punished for recoverable situations.

---

### Edge Case 3: Quality Issues (Damaged/Defective Shipments)

**What happens:** 30% of shipments arrive damaged; backers demand refunds

**Policy (both tiers):**
- Creator is responsible for resolving (reshipping, refund, replacement parts)
- If creator refuses: backer escalates to dispute resolution (Section 2)
- Platform doesn't auto-refund; you facilitate claim & help backer pursue creator
- If pattern emerges (3+ campaigns with damage): creator loses Creator+ status; audited on next campaign

---

### Edge Case 4: Creator Goes Silent

**What happens:** Creator stops responding; no missed milestone yet, but backers get nervous

**Policy (both tiers):**
- Platform reaches out directly; **48-hour response requirement** (Standard), **72 hours** (Creator+)
- If no response: milestone flagged as "at risk"; notify backers; give creator 7-day cure window
- After 14 days of silence: freeze creator account; initiate dispute resolution

---

### Edge Case 5: Shipping Cost Overrun

**What happens:** Production on budget, but freight costs spike (fuel, customs, congestion); creator needs full 20% to ship

**Standard Creator Policy:**
- Must provide: original budget breakdown + updated freight quotes (from 2+ couriers) + justification
- Platform may release up to 50% of final 20% early if justified
- Remaining 10% releases upon proof of shipping

**Creator+ Tier Policy:**
- Up to 10% overrun auto-approved without justification (trust based on track record)
- Beyond 10%: same review as Standard, but faster approval

---

## Section 5: Alternative Revenue Streams

### Primary Revenue: Platform Fee
- **5% of all funds raised** — core, non-negotiable revenue
- Expected for MVP: 10 campaigns × SGD 500k average = SGD 250k funds raised → SGD 12.5k platform fee

### Secondary Revenue Streams (Priority Order)

#### **High Priority: Insurance Partnership** (Explore Phase 1)
- **What it is:** Partner with an insurer offering "Campaign Protection" add-on for backers
- **Mechanics:** 
  - Backers can opt-in to insurance (typically 2–3% of pledge amount)
  - Insurance covers: if creator disappears mid-campaign or fails delivery
  - You earn: 20–30% of insurance premium
- **Example:** Campaign SGD 50k; insurance costs SGD 1,500 (3%); you earn SGD 300–450
- **Status:** To be explored with insurance provider; feasibility TBD
- **Why:** Solves backer's #1 concern; creates recurring revenue; differentiates platform

#### **Medium Priority: Manufacturing & Logistics Network** (Post-MVP, Year 2)
- **What it is:** Curate vetted factories, freight forwarders, quality inspectors in SG/China/Vietnam
- **Mechanics:**
  - Creator+ tier gets access to directory + warm intros
  - When creator uses partner: you earn 5–10% referral fee
- **Example:** Creator uses recommended factory audit (SGD 2k); you earn SGD 100–200
- **Why:** Adds creator value; recurring revenue; positions you as ecosystem builder

#### **Low Priority: Data & Insights** (Post-MVP, Year 2+)
- **What it is:** Anonymized campaign data (success rates by category, typical timelines, backer demographics)
- **Mechanics:**
  - Sell to manufacturers, investors, market researchers
  - Option: API access for premium subscribers
- **Example:** Quarterly report on SG hardware trends: SGD 5–20k per report
- **Why:** Long-tail monetization; high margin; leverages unique dataset

### MVP Revenue Model
- **Core:** 5% platform fee
- **Explore:** Insurance partnership (if feasible, incorporate into Phase 1 launch)
- **Defer:** Logistics network, data products (post-MVP iterations)

---

## Section 6: Backer Psychology — Framing as Protection

### Core Narrative
**"Your Money is Safe Until [Creator Name] Delivers"**

Every escrow restriction ties to a specific risk you're solving. Messaging emphasizes *protection*, not bureaucracy.

### Restriction-to-Message Mapping

| Restriction | Risk It Solves | Backer Message |
|---|---|---|
| 40/40/20 split | Creator ships product, then disappears without fulfilling | "We hold back shipping costs so creators can't disappear after production." |
| Proof of Production | Creator claims manufacturing but never actually produced | "We verify the factory actually made your product before releasing more funds." |
| Creator silence = freeze | Creator goes unresponsive; backers left wondering | "If a creator goes silent, we step in immediately to protect your pledge." |
| Partial fulfillment refund | Creator ships some orders, then stops | "If they ship some but not all, you get your money back for what didn't ship." |
| Dispute escalation | Creator refuses to resolve issues | "We don't just refund — we help you get justice if something goes wrong." |

### Visual Trust Signals (Dashboard)
- **✓ Approved** — Green checkmark on completed milestones with timestamp
- **⏳ In Review** — Amber/yellow hourglass on "being verified" milestones
- **⚠️ Delayed** — Red alert on missed milestones with explanation
- **🛡️ Creator verified** — Badge showing creator has met credibility requirements
- **🛡️ Campaign insured** — Badge if insurance partnership is active (future)

### Email Tone (Example)
> **Subject:** Production Verified — Your [Product Name] is on track  
> Hi [Backer Name],  
> Great news: [Creator Name] just submitted proof of production. We've verified it with the factory and confirmed they're building your units right now. Your money is still safe in escrow.  
> Next milestone: Shipping proof (estimated in [X weeks]).  
> Questions? Reply to this email.  
> — GetThatBread

### Key Messaging Principles
- **Transparency first:** Every update includes status, timeline, next step
- **Speed signals trust:** "We reviewed this in 3 days" > "We reviewed this"
- **Creator context:** Explain *why* milestone is delayed, not just that it is
- **Backer empowerment:** Remind them they can file disputes; you're on their side

---

## Section 7: Founder Fellowship — Early Creator GTM

### Goal
Acquire 10 high-quality hardware/tech founders from Singapore/SEA ecosystem to launch with. Generate case studies, build public momentum, establish credibility with next 100 creators.

### Target Founder Profile
- **Geography:** Singapore / Malaysia / Indonesia (cross-border manufacturing sourcing from China/Vietnam)
- **Stage:** MVP-ready or pre-manufacturing (validated product, not concept-stage)
- **Background:** Accelerator alumni (LaunchPad, NUS Enterprise, Anterra, Block71) OR indie hardware/tech entrepreneurs
- **Social signal:** 1K–10K social following; active on LinkedIn/Twitter; willing to be transparent
- **Maturity:** Age 25–40; tech-savvy; understands manufacturing complexity
- **Motivation:** Want to crowdfund but worried about execution risk / fulfillment

### Recruitment Channels

#### **Channel 1: Accelerator Partnerships** (Primary)
- Email LaunchPad, NUS Enterprise, Anterra, Block71 with pitch: "We're launching a crowdfunding platform built for hardware founders. We're selecting 10 founders for our Founder Fellowship (zero platform fees, custom terms, dedicated support)."
- Ask for: intro to 3–5 portfolio companies that fit profile
- Timeline: Week 1–2

#### **Channel 2: Direct Outreach** (Secondary)
- LinkedIn search: "Singapore OR Malaysia OR Indonesia" + "hardware OR IoT OR deep tech" + "founder OR CEO"
- Personalized DMs to 10–15 targets per week
- Pitch: "We're building something for hardware founders like you. Want to chat about bringing your product to market?"
- Timeline: Ongoing during recruitment phase

#### **Channel 3: Referrals** (Warm)
- Ask advisors, investors, accelerator partners for warm intros
- Referral bonus (optional): SGD 500 credit toward platform fee if referral founder joins
- Timeline: Ongoing

#### **Channel 4: Social/Community** (Visibility)
- Engage with SG hardware/maker communities (Twitter, Discord, Reddit)
- Retweet, comment on founders' posts; build credibility
- Create FOMO: "Founder Fellowship spots filling up—7/10 spots taken"
- Timeline: Ongoing (Part of broader brand building)

### Fellowship Offer

#### **What Creators Get**
- **Zero platform fee on first campaign** (normally 5%) — direct cost savings for them
- **Custom escrow negotiation** — propose alternative payout structures (50/30/20, etc.); platform approves based on risk
- **Dedicated support** — Direct Slack/email channel with you (not generic support)
- **Manufacturing partner access** — Intro to 2–3 vetted factories, freight forwarders, quality inspectors
- **Public "Founder Fellow" badge** — Prestige signal on campaign page; signals early-stage credibility
- **Monthly check-ins** — You help them navigate milestones, troubleshoot problems, iterate

#### **What You Ask in Return**
1. **Transparency** — Share learnings (what worked, what was hard, unexpected challenges)
2. **Feedback** — Monthly 30-min calls; they help you iterate product (proof-of-work flow, dispute resolution, etc.)
3. **Evangelism** — At campaign launch, they commit to sharing with their networks (LinkedIn, Twitter, email list)
4. **Timeline commitment** — Launch campaign within 90 days; complete campaign within 12 months

### Recruitment & Onboarding Timeline

| Phase | Timeline | Deliverable |
|---|---|---|
| **Outreach** | Month 1 (Weeks 1–4) | 100+ warm intros; 10 Fellows selected |
| **Kickoff** | Month 1–2 (Weeks 3–5) | 1-on-1 calls; custom escrow terms defined; launch dates set |
| **Soft Launch** | Month 2–3 (Weeks 6–12) | 10 campaigns live; you actively support each milestone |
| **Case Study Doc** | Month 4–6 | 5–7 publishable case studies (with consent) |
| **Public Launch** | Month 6+ | Announce Fellowship results; highlight success stories; open platform to broader creators |

### Success Metrics

| Metric | Target | Why It Matters |
|---|---|---|
| Founders recruited | 10 | Market fit signal; social proof |
| Campaigns funded (%) | 70%+ (7/10) | Proves model works; creates case studies |
| Avg funding rate | 120%+ of goal | Shows backer demand; validates value prop |
| Case studies published | 5–7 | Marketing asset; social proof for next wave |
| Fellow NPS | >8/10 | Creator satisfaction; they become evangelists |
| Time to funding | <30 days avg | Indicates strong market interest |

---

## Summary: The Complete Model

### For Creators
- **Standard tier:** Safe baseline (40/40/20 locked, supportive process)
- **Creator+ tier:** Autonomy & trust (custom terms, faster approvals, exclusive network)
- **Founder Fellowship:** Zero platform fee, custom terms, dedicated support (first 10)

### For Backers
- **Escrow protection:** Always held until milestone hit
- **Transparency:** Clear status at each stage (✓ Approved / ⏳ In Review / ⚠️ Delayed)
- **Recourse:** Dispute resolution + legal support if creator fails
- **Insurance option:** Optional protection if available

### For Platform
- **Core revenue:** 5% platform fee
- **Explore revenue:** Insurance partnership
- **Defer revenue:** Logistics network, data products
- **GTM:** Founder Fellowship (10 high-quality creators → case studies → next 100 creators)

---

## Open Questions / To Explore

1. **Insurance Partnership Feasibility** — Check with local SG/SEA insurers; what's the premium structure, claims process, platform cut?
2. **Manufacturing Partner Network** — Which factories, forwarders, auditors should you vet first for Founder Fellowship?
3. **Dispute Resolution Team** — Who reviews milestone submissions & disputes? (You initially, then hire ops person at scale?)
4. **Creator+ Credibility Verification** — Process for reviewing external credentials (portfolio, past success, endorsements)?
5. **Backer Communication Cadence** — How often to email milestones? Weekly updates, or event-driven only?

---

## Next Steps
1. ✅ Design approved
2. → Write implementation plan (feature roadmap, team, timeline)
3. → Recruit & onboard first 5 Founder Fellows (parallel with dev)
4. → Soft launch with 10 campaigns
5. → Iterate based on Fellow feedback
6. → Public launch + broader creator recruitment
