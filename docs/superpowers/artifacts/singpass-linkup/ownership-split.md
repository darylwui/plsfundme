# Linkup Submission — Ownership Split

Everything needed to submit the Singpass Myinfo linkup application,
divided into **things Claude has already done for you** and **things
you (Daryl) must do manually**.

---

## Things Claude has drafted (you: review, edit if needed, paste)

All files below live in `docs/superpowers/artifacts/singpass-linkup/`.

| # | Artefact | File | What to do with it |
|---|---|---|---|
| 1 | Submission index + portal-field mapping | `README.md` | Reference only — the "how to use this folder" doc. |
| 2 | Data-field justifications | `field-justifications.md` | Review → paste into the "Justification for each data field requested" field in the developer portal. |
| 3 | PDPA statement | `pdpa-statement.md` | Review → paste into the "Data-handling statement" / "PDPA compliance" field. |
| 4 | Security practices | `security-practices.md` | Review → paste into the "Security measures" field. |
| 5 | Alternative (non-Singpass) path | `alternative-path.md` | Review → paste into the "Alternative authentication method" field. |
| 6 | Redirect URIs | `redirect-uris.md` | Copy the bulleted URIs (both sandbox and production lists) into the "Allowed redirect URIs" field. |
| 7 | Privacy-policy section | `privacy-policy-section.md` | Paste into the live `https://getthatbread.sg/privacy` page **before submitting** the linkup form. |
| 8 | User-journey slide content (12 slides) | `user-journey.md` | Use as the script/speaker-notes when assembling the GovTech `.pptx` template. |

**Review suggestion:** read `README.md` first (it's the map), then skim
each artefact. I've flagged "TBD — confirm with Daryl" in one place
only (the legal entity / UEN in `README.md`).

---

## Things only you can do (Daryl-only)

These are the blocking steps that require your credentials, your
identity, or your physical access to things I don't have.

### A. Corppass + Singpass developer account

| Step | Why only you | Where |
|---|---|---|
| A1. **Set up Corppass** for the Get That Bread entity (if not already done) | Requires UEN + your SingPass | https://www.corppass.gov.sg |
| A2. **Authorise yourself** as an authorised signatory for the API Services Agreement inside Corppass | Requires entity admin | Corppass admin panel |
| A3. **Create a Singpass developer portal account** using that Corppass | Requires Corppass auth | https://developer.singpass.gov.sg |
| A4. **Register a sandbox client** on the developer portal and note the `client_id` | Portal only lets the entity admin register | Developer portal → "My Apps" |
| A5. **Upload the JWKS URL** (`https://getthatbread.sg/.well-known/jwks.json`) to the sandbox client config | Portal requires logged-in admin | Developer portal → app config |
| A6. **Screenshot current Myinfo Standard pricing tier** from the SDP billing tab | Behind Singpass auth; pricing changes | Developer portal → Billing |

**Blocker for Claude:** Phase 2 of the implementation plan cannot
start until steps A1–A5 are done and the sandbox env vars are populated
in Vercel. Phase 1 (credential-free foundation) can ship independently.

### B. Legal / business info

| Step | Why only you | Notes |
|---|---|---|
| B1. **Confirm the legal entity** applying (sole-prop vs Pte Ltd; UEN) | Claude doesn't know how the business is incorporated | This goes into the top of the submission bundle + into `README.md` where it currently says "TBD" |
| B2. **Authorised-signatory signature** on the eventual API Services Agreement GovTech will send you | Legal signature, only you | Sent via email after portal approval |

### C. Publishing + hosting

| Step | Why only you | Notes |
|---|---|---|
| C1. **Publish a `/privacy` page on getthatbread.sg** with the content from `privacy-policy-section.md` | You own the site content; I can draft but can't deploy | Create the page or add a section; confirm publicly accessible before submitting linkup |
| C2. **Ensure the JWKS endpoint is live** at `https://getthatbread.sg/.well-known/jwks.json` | Requires Phase 1 merge + production deploy | Happens automatically once you merge the Phase 1 PR — but verify by `curl`-ing the URL before submission |
| C3. **Generate + install the production JWK keypair** via `scripts/generate-singpass-jwks.ts` and paste the JWKs into Vercel env vars | Requires Vercel access (yours) | Walkthrough is in Task 4 of the implementation plan |

### D. User-journey `.pptx` assembly

| Step | Why only you | Notes |
|---|---|---|
| D1. **Download the GovTech `.pptx` template** from the developer portal when starting the linkup application | Portal gives it to the applicant | |
| D2. **Paste 12 slides of content** from `user-journey.md` into the template | Needs your PowerPoint / Keynote / Google Slides | Rough time estimate: ~45 min if using wireframes, ~2h if capturing real screenshots from a preview deployment |
| D3. **Draw/insert wireframe images** for slides 2, 3, 5, 6, 7, 8, 9, 10 | Visual asset creation | Options: hand-sketched, Figma mocks, or real screenshots once Phase 2 is deployed to a preview URL |
| D4. **Export to `.pptx`** and attach to the portal form | | |

**Tip:** If you can wait to submit until Phase 2 is deployed to a
Vercel preview, real screenshots are faster and more persuasive than
wireframes.

### E. Submission

| Step | Why only you | Notes |
|---|---|---|
| E1. **Log into the Singpass developer portal** with your Corppass | Your credentials | |
| E2. **Paste each artefact** (items 2–6 in the table above) into the matching portal form field | Only you can click "Submit" | |
| E3. **Upload the user-journey `.pptx`** | | |
| E4. **Attach the pricing screenshot** from step A6 | | |
| E5. **Submit** | 🚀 | |

### F. Open-question resolution (during implementation, not submission)

None of these block submission, but they're on the implementation
plan's "open questions" list that only you can answer definitively:

- **F1.** Does `@govtechsg/singpass-myinfo-oidc-helper` support Pushed
  Authorization Requests (PAR), as required by FAPI 2.0 by
  31 Dec 2026? Claude will investigate during Phase 2 implementation,
  but if the library is missing PAR and you want us to swap to
  `openid-client` or `oauth4webapi` instead, that's your call.
- **F2.** Sandbox client wildcard redirect URIs — portal may or may not
  allow wildcards for preview URLs. Ask during registration.

---

## Things outside the scope of the linkup application

Reminders that are not about the Singpass submission, but are still
on your plate:

- **Rotate the exposed Sentry auth token** (`sntrys_eyJpYXQi…`) — a
  token that was accidentally committed earlier. Not blocking
  anything, but don't forget.

---

## Timeline expectation

- **You (Daryl) can start items A1–A6 today.** They take ~60–90
  minutes total if Corppass is already set up, or a few hours if
  Corppass setup is needed.
- **Once A4 + A5 are done** and sandbox env vars are in Vercel,
  Claude can execute Phase 2 of the implementation plan immediately
  (real sandbox wiring + end-to-end smoke).
- **Linkup submission** can go in parallel with Phase 2 — you don't
  need a working sandbox before submitting; wireframes + the drafted
  artefacts are sufficient for first submission.
- **GovTech response** typically lands in **~2 weeks** if the
  submission is clean, **up to ~6 weeks** if they come back with
  questions.
- **Production cutover** (Phase 3) is a 30-minute Vercel config
  change once GovTech approves.

---

## Three-line summary

1. I've written every artefact the GovTech portal needs — just
   review and paste.
2. You need to do Corppass + sandbox registration + `.pptx`
   assembly + final click-Submit. Everything else is code or draft
   text that's already in this repo.
3. You can start submission prep right now — wireframes are fine
   for first round; don't wait for Phase 2 sandbox to be live.
