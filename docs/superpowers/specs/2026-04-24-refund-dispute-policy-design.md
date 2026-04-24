# Refund & Dispute Policy Page — Design

**Date:** 2026-04-24
**Scope:** Pre-launch trust & compliance, sub-project #2 of 3 (refund/dispute policy → backer protection expansion → PDPA review).

## Goal

Publish a concrete, citable `/refund-policy` page that documents exactly what happens when a creator fails to deliver. Must be written before it happens — we cannot ad-hoc refund decisions once campaigns are live.

## Non-goals

- Rewriting `/backer-protection` (that is project #3).
- PDPA / privacy-policy audit (that is project #1).
- Changing backend dispute/escrow logic. Policy documents the existing model in [backer-protection-models.md](../../backer-protection-models.md); no schema or API changes in this spec.
- Legal counsel review. Copy should be drafted in a tone that is easy for a lawyer to later tighten, but this is not a substitute for MAS/PDPA legal sign-off.

## Product decisions (locked)

1. **Refund amount — conditional rule.**
   - Fraud / material misrepresentation → **full pledge refunded**, regardless of how much has already been released from escrow. Platform absorbs the gap or pursues the creator.
   - Good-faith failure (supplier collapse, genuine inability to deliver) → **refund of funds still in escrow** only. Backer bears the loss on already-released milestones.
2. **Two-stage dispute process.**
   - Stage 1: backer flags concern → creator has 14 calendar days to post a written response/update.
   - Stage 2: if no adequate response, dispute opens and platform investigates (up to 14 calendar days).
   - Auto-trigger: if a milestone is 45+ days overdue **and** the creator has posted no update, the platform opens the dispute on backers' behalf without requiring stage 1.
3. **Platform fee in refunds — always refunded.** Backer pledged $100 → backer gets $100 back (not $95). The 5% platform fee is refunded in full, regardless of fraud vs good-faith classification.
4. **Classification authority.** Platform admin classifies each case as fraud/misrepresentation vs good-faith, using evidence from the dispute investigation (per stage 2 flow in [backer-protection-models.md](../../backer-protection-models.md)). The policy page states plainly that the platform makes this call — backers are not entitled to self-classify their own refund tier.
5. **Placement — standalone page at `/refund-policy`.** Linked from `/backer-protection`, `/terms`, and the site footer.

## Page architecture

- **Route:** `/refund-policy` inside the `(marketing)` route group.
- **File:** `app/(marketing)/refund-policy/page.tsx`.
- **Component style:** server component, static content. Mirror the structure of `app/(marketing)/privacy/page.tsx` — same `Section` helper pattern, same `LAST_UPDATED` const at top, same design tokens (`var(--color-surface-raised)`, `var(--color-ink)`, `var(--color-brand-crust)`, etc.).
- **Metadata:**
  - `title`: "Refund & dispute policy — get that bread"
  - `description`: "When and how backers get refunded on get that bread — milestone-based escrow, two-stage disputes, full refunds including platform fee."
- **Last-updated:** single `LAST_UPDATED = "24 April 2026"` const rendered at top of page.
- **Contact email:** reuse `hello@getthatbread.sg` (same constant pattern as `/privacy` and `/backer-protection`).

## Information architecture (page sections, in order)

1. **Hero.** One promise line: "If a creator fails to deliver, here is exactly what happens and when." Small badge/eyebrow label ("Refund & dispute policy") matching the style on `/backer-protection`.
2. **At-a-glance summary — three cards.**
   - Card 1: "Conditional full refund" — full pledge on fraud, escrow-only on good-faith failure.
   - Card 2: "Two-stage process" — creator gets 14 days to respond before a dispute opens.
   - Card 3: "Platform fee always refunded" — our 5% comes back with the rest.
3. **When you can request a refund.** Concrete trigger list:
   - Creator cancels or shuts down the campaign after funding.
   - A milestone is 45+ days overdue and the creator has posted no update (auto-opens dispute).
   - The estimated delivery date has passed by 60+ days with no delivery and no adequate explanation.
   - Material misrepresentation — fake photos, plagiarised work, fabricated credentials.
   - Fraud.
   - Duplicate or unauthorized charge.
4. **How much you get back.** States the conditional rule (decision 1) plainly, then a worked example:
   > "You pledge $100. M1 is approved and $40 is released to the creator. Then the creator stops delivering. If we find good-faith failure, you get back the $60 still in escrow. If we find fraud or material misrepresentation, you get the full $100 back — we absorb the gap or pursue it from the creator."
   - Short note that platform fee is always refunded in full on both paths.
   - Short note that the platform makes the fraud-vs-good-faith classification based on the investigation evidence — backers cannot self-classify.
5. **How disputes work.** Two-stage flow (decision 2), plus the 45-day auto-trigger. Explain why stage 1 exists (delays happen in real projects; gives honest creators a chance to respond).
6. **Timelines table.**

   | Event | Target |
   |---|---|
   | Initial ticket response | 2 business days |
   | Creator response window (stage 1) | 14 calendar days |
   | Dispute investigation (stage 2) | Up to 14 calendar days |
   | Refund processing (once approved) | 5–10 business days to original card / PayNow |
   | Auto-trigger threshold | Milestone 45+ days overdue with no creator update |

7. **What's not covered.** Carry over from existing backer-protection:
   - Cosmetic differences between prototype and final product.
   - Delays the creator has communicated and the backer has had a reasonable chance to respond to.
   - Shipping damage once a package leaves the creator.
   - Subjective quality disputes where creator delivered what was promised.
8. **How to file a dispute.**
   - Email `hello@getthatbread.sg`.
   - Include: campaign name/link, email used to pledge, short description of what happened, any screenshots of creator posts, missed updates, or communications.
   - Chargeback note: "Please talk to us before filing a bank chargeback — we can usually resolve faster than your bank's 30+ day window, and filing one locks the dispute process."
9. **Edge cases briefly addressed.**
   - Creator cancels mid-campaign (before funding): nothing to refund — we only charge on successful funding; authorizations release automatically.
   - Creator cancels after funding: treated as good-faith (escrow-only refund) unless there is evidence of misrepresentation.
10. **Contact.** Final section with mail icon and `hello@getthatbread.sg`, matching `/backer-protection` pattern.

## Cross-link edits

**`app/(marketing)/backer-protection/page.tsx`:**
- Replace the existing `"When can I request a refund?"` + `"How to request a refund"` sections with a short 2-paragraph summary plus a prominent `Read the full refund & dispute policy →` link to `/refund-policy`.
- Leave `"What's not covered"` and `"For creators"` sections as-is for now — project #3 will do the full rewrite.

**`app/(marketing)/terms/page.tsx`:**
- Add one clause near the existing payments/refunds language (or as its own short clause if none exists): "Our Refund & Dispute Policy, available at /refund-policy, is incorporated into these Terms by reference."
- Need to locate the exact insertion point during implementation.

**Site footer:**
- Add "Refund policy" link between "Privacy" and "Terms" in the marketing footer. Exact component needs to be located during implementation (likely in `components/` or inlined in `app/(marketing)/layout.tsx`).

## Content constraints

- Tone: friendly but precise. Match `/backer-protection`'s voice — plain English, no legalese, but specific about numbers and days.
- Length: target ~600–900 words of body copy. Longer than `/backer-protection`, shorter than `/privacy`.
- No emojis.
- No raw HTML escape artifacts — use `&apos;` etc. consistent with existing pages.
- Singapore-specific language: SGD for all dollar examples, mention PayNow and card as the two refund methods.

## Verification / definition of done

- Page renders at `/refund-policy` with correct `<title>` and meta description.
- `LAST_UPDATED` date visible at top of page.
- All internal links resolve:
  - `/backer-protection` → `/refund-policy` (new link)
  - `/refund-policy` → `mailto:hello@getthatbread.sg`
  - `/terms` → `/refund-policy`
  - footer → `/refund-policy`
- Footer shows "Refund policy" link on every marketing route.
- `npm run lint` and `npm run build` pass with no new warnings.
- Manual browser smoke test: page is readable on mobile (<=375px), dark mode styles work, matches visual weight of `/privacy` and `/backer-protection`.
- No new unit tests — pure content page, consistent with existing marketing routes.

## Out of scope (explicitly deferred)

- Admin / creator-facing dispute UX. Existing admin endpoints from PR #52 stand.
- Any new database columns or schema changes.
- Email templates for dispute notifications.
- The `/backer-protection` rewrite (project #3).
- PDPA audit of `/privacy` vs actual data practices (project #1).
- Legal review by counsel prior to Singapore launch (~May 2026). Tracked separately.

## Risks

- **Copy drift.** If we later change dispute windows (e.g. 14 → 21 days) the policy page and the underlying admin workflow can diverge. Mitigation: keep [backer-protection-models.md](../../backer-protection-models.md) as the engineering source of truth and update the policy page in the same PR that changes backend behaviour.
- **Legal phrasing.** This is not a lawyer-reviewed document. Copy is drafted to be easy to tighten later. Flag as a launch TODO alongside Sentry wiring.
