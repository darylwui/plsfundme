# Singpass Myinfo Linkup Application — Submission Bundle

**Applicant:** Get That Bread (legal entity name: TBD — confirm with
Daryl before submission. If the platform is operating under a sole-
proprietorship, the UEN is on the Corppass account; if incorporated,
use the registered company UEN.)

**Contact:** daryl.wui@gmail.com

**Date prepared:** 2026-04-22

**Target environment:** Production (sandbox is self-serve and does not
require this bundle)

---

## How to use this folder

Every file here is a draft of one deliverable the GovTech linkup
application asks for. Each file is designed to be **copy-pasted** into
the corresponding field of the Singpass Developer Portal submission
form, or attached as-is.

Below is the mapping from each GovTech portal field to the file in this
folder that fills it.

| # | Portal field / artefact | File | Submission format |
|---|---|---|---|
| 1 | User-journey presentation (wireframes) | `user-journey.md` | Paste slide-by-slide into the `.pptx` template GovTech provides in the portal. Export as `.pptx` for upload. |
| 2 | Data-field justification | `field-justifications.md` | Paste the prose directly into the "Justification for each data field requested" field in the portal. |
| 3 | PDPA consent + retention statement | `pdpa-statement.md` | Paste into the "Data-handling statement" / "PDPA compliance" field. |
| 4 | Security practices | `security-practices.md` | Paste into the "Security measures" field. |
| 5 | Alternative (non-Singpass) path | `alternative-path.md` | Paste into the "Alternative authentication method" field (GovTech requires Singpass not be the sole onboarding option). |
| 6 | Redirect URI list | `redirect-uris.md` | Copy the bulleted URIs into the "Allowed redirect URIs" field. |
| 7 | Privacy policy (live URL required) | `privacy-policy-section.md` | **Before submission**, paste this section into `https://getthatbread.sg/privacy`. GovTech visits this URL during review. |

## Supporting artefacts (not uploaded, but referenced)

| # | Item | Location |
|---|---|---|
| 8 | Public JWKS endpoint | `https://getthatbread.sg/.well-known/jwks.json` (live after Phase 1 merge) |
| 9 | Business registration / UEN proof | Screenshot from Corppass (user-side) |
| 10 | Current Myinfo Standard pricing screenshot | Screenshot from SDP billing tab (user-side) |

---

## Pre-submission checklist

Before hitting **Submit** in the developer portal:

- [ ] Corppass account for the platform's UEN is set up and Daryl is an authorised signatory.
- [ ] Singpass developer account is logged in under the correct Corppass entity.
- [ ] Sandbox client is registered first (self-serve) — production linkup flows through sandbox validation.
- [ ] All seven artefacts in this folder have been reviewed by Daryl and pasted into the portal form.
- [ ] `https://getthatbread.sg/privacy` has been updated with the section from `privacy-policy-section.md` and is publicly accessible.
- [ ] `https://getthatbread.sg/.well-known/jwks.json` is publicly accessible and returns two public keys.
- [ ] The user-journey `.pptx` has been assembled from `user-journey.md` and GovTech's template.
- [ ] Current Myinfo Standard pricing tier has been screenshotted from the SDP billing tab.

Post-submission, the expected timeline is **~2 weeks** for a clean
application, **up to ~6 weeks** if GovTech comes back with questions.

---

## Ownership split — who does what

See `ownership-split.md` in this folder for the full line-by-line list
of which artefacts Claude has drafted vs. which ones require Daryl to
complete manually (screenshots, Corppass, slide deck assembly, live
privacy-policy update, final submission).
