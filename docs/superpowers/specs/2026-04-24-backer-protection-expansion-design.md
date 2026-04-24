# Backer Protection Expansion — Design

**Date:** 2026-04-24
**Scope:** Pre-launch trust & compliance, sub-project #3 of 3.

## Goal

Deepen [/backer-protection](../../../app/(marketing)/backer-protection/page.tsx) with concrete specifics (timelines + contact expectations) without duplicating the detail now living on [/refund-policy](../../../app/(marketing)/refund-policy/page.tsx). Fix drift on [/faq](../../../app/(marketing)/faq/page.tsx) introduced by the new refund policy and add two missing backer Q&As.

## Non-goals

- Escalation paths (deferred per user — contact stays as-is).
- Creator-side FAQ changes.
- Rewriting the `/backer-protection` hero, summary cards, or voice — current copy works.
- Any schema or API changes.

## Product decisions (locked)

1. **Single source of truth for FAQs** is `/faq`. We do not create a second FAQ block on `/backer-protection`. Instead we add a timeline visualization plus a prominent cross-link to `/faq` for long-tail questions.
2. **Timeline is a visualization, not a table.** Follows the `BackerStepper` pattern already used elsewhere — gold icon circles, cards, connecting line; responsive (horizontal on desktop, vertical on mobile).
3. **Four lifecycle stages:**
   - Pledge placed
   - Campaign funds
   - Milestone approved (covers all three of M1/M2/M3 — no need to show them as separate stages)
   - Delivery window
4. **No escalation guidance on either page.** Contact remains `hello@getthatbread.sg` with the existing "we answer every message within a business day" SLA.
5. **FAQ drift fixes, not rewrites.** Keep the existing structure on `/faq`. Update three stale answers plus add two new questions. Do not touch the creator-side FAQ or the hero.

## Components & files

### New

- **`components/marketing/BackerProtectionTimeline.tsx`** — visualization component.
  - Server component (no interactivity needed — static informational graphic).
  - Pattern: mirror `BackerStepper.tsx` structure minus the hover/focus state machine — we don't need interactive highlight on a reference graphic.
  - Responsive: horizontal 4-across on `md+`, vertical stack on mobile with connector line.
  - Icons (lucide): `CreditCard` (pledge placed), `Landmark` or `Lock` (campaign funds → escrow), `CheckCircle2` (milestone approved), `Truck` (delivery window).
  - Gold circle for stages 1–3 (brand-golden); stage 4 can use brand-crust to signal the "post-funding, dispute-eligible" phase is visually different. Keep it subtle.
  - Ring frame + card for each stage with: stage name + short protection-focused description.
  - Connecting line behind the circles at the icon's vertical center (desktop); vertical line beside icons (mobile). Same `bg-[var(--color-brand-golden)]/30` as BackerStepper.

### Changed

- **`app/(marketing)/backer-protection/page.tsx`**
  - Insert a new `"Your protection at every stage"` section after `"How milestone-based escrow protects you"` and before `"Refunds and disputes"`, rendering `<BackerProtectionTimeline />`.
  - Add one line above or below timeline pointing to `/faq` for long-tail questions. Keep the existing `"Questions?"` contact section at the bottom — don't duplicate FAQ link in two places.
- **`app/(marketing)/faq/page.tsx`**
  - **Fix Q2** ("What happens if the campaign doesn't reach its goal?"): current answer wrongly describes milestone escrow. Replace with the actual goal-not-met behaviour (card holds release, PayNow refunds automatically, nothing is captured).
  - **Fix Q3** ("What if the creator doesn't deliver their rewards?"): current answer is vague. Rewrite to reference the formal two-stage dispute process, escrow, and link to `/refund-policy` for specifics.
  - **Fix Q4** ("Can I cancel or change my pledge?"): current answer says refunds are at the creator's discretion — now inaccurate. Rewrite: cancellation before funding is free; after funding, refunds follow the `/refund-policy`.
  - **Add** `"How do you vet creators before they launch?"` — single paragraph covering admin review, creator qualifications/tier system (`standard` vs `creator_plus`), and link to backer protection.
  - **Add** `"What if the reward arrives but it's broken or not what was promised?"` — distinguishes (a) arrived broken / not as described (creator's responsibility; we help mediate) from (b) shipping damage in transit (courier). References `/refund-policy`.
  - Preserve the existing `plain` copy pattern for the JSON-LD FAQPage schema.

## Content — exact timeline copy

| Stage | Title | Body |
|---|---|---|
| 1 | Pledge placed | Your card is authorised, not charged. PayNow payments are held on-platform. Either way, you can change or cancel your pledge at any time before the campaign closes. |
| 2 | Campaign funds | Funds move into escrow. Nothing is released to the creator yet — we hold everything until the creator hits their first milestone. |
| 3 | Milestone approved | When the creator proves they've hit a milestone (M1 / M2 / M3), that milestone's share is released (40 / 40 / 20). The rest stays in escrow. |
| 4 | Delivery window | If a creator goes silent, misrepresents the project, or fails to deliver, you can open a dispute. Milestones 45+ days overdue with no update auto-trigger a dispute on your behalf. |

## Content — exact FAQ rewrites

### Fix Q2
> **Q.** What happens if the campaign doesn't reach its goal?
> **A.** If the campaign misses its funding goal by the deadline, no one is charged. Card authorisations release automatically (usually within a few days, depending on your bank). PayNow pledges — which are captured immediately — are refunded in full within 5–10 business days.

### Fix Q3
> **Q.** What if the creator doesn't deliver their rewards?
> **A.** Creators are legally responsible for fulfilling what they promised. Pledges sit in escrow after a campaign funds and are only released to the creator as they hit milestones — so the platform still holds funds when delivery slips. If a creator goes dark or fails to deliver, you can raise a concern via our two-stage dispute process: the creator has 14 days to respond, and if they don't, a formal dispute opens. Milestones 45+ days overdue with no update auto-trigger a dispute on your behalf. Full rules, refund amounts, and timelines are in our [Refund & Dispute Policy](/refund-policy).

### Fix Q4
> **Q.** Can I cancel or change my pledge?
> **A.** Yes — any time before the campaign ends, cancel or adjust your pledge for free. Once a campaign has successfully funded and funds are captured, refunds follow the rules set out in our [Refund & Dispute Policy](/refund-policy): full pledge back on fraud or misrepresentation, funds still in escrow back on good-faith failure, platform fee always refunded.

### Add: vetting
> **Q.** How do you vet creators before they launch?
> **A.** Every campaign goes through admin review before going live. Creators start on the Standard tier, and can earn Creator+ status by completing campaigns successfully or providing external proof (portfolio, prior Kickstarter history, manufacturing endorsement). Creator+ unlocks extended campaign duration and higher pledge limits. Admin review covers identity, campaign legitimacy, and compliance with our Terms — campaigns offering regulated financial products, counterfeit goods, or unlicensed activities are rejected.

### Add: broken reward
> **Q.** What if the reward arrives but it's broken or not what was promised?
> **A.** If the product arrived but isn't what the creator sold — wrong spec, missing components, materially different from the campaign — contact the creator first. They're responsible for making it right under Singapore's Consumer Protection (Fair Trading) Act. If the creator won't engage, escalate to us and we can mediate or, in serious cases of misrepresentation, treat it as a dispute under our [Refund & Dispute Policy](/refund-policy). Shipping damage that happened in transit is a separate issue — raise that with the courier or creator directly.

## Verification / definition of done

- `<BackerProtectionTimeline />` renders on `/backer-protection` between the escrow and refunds sections. All four stages visible on desktop (horizontal) and mobile (vertical). Connecting line present.
- `/faq` shows Q2, Q3, Q4 with updated text; two new questions appear in order (vetting + broken-reward). `plain` fields updated so the JSON-LD schema stays correct.
- Cross-link to `/faq` present on `/backer-protection`.
- `npm run lint` introduces no new errors.
- `npx tsc --noEmit` clean.
- Manual browser smoke: visual weight matches `BackerStepper`; mobile layout has vertical connector; light + dark mode both legible.

## Out of scope (explicitly deferred)

- Escalation guidance on either page.
- Creator-facing FAQ changes.
- Rewriting the `/backer-protection` hero or summary cards.
- Linking the timeline component to anywhere else on the site.
- PDPA review (project #1).
