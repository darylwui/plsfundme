# Privacy Policy Addition — Identity Verification Section

**Where to paste this:** `https://getthatbread.sg/privacy` (or wherever
the current privacy policy lives — if no page exists yet, create one
at `/privacy` before submitting the linkup application). GovTech
reviewers visit this URL to verify that the published policy matches
what's claimed in the linkup submission, so **this section must be
publicly accessible before you hit Submit in the developer portal.**

Paste the text below as a new section titled **"Identity Verification
via Singpass Myinfo"** — either as a sibling heading in the existing
privacy policy, or as a standalone `/privacy/identity-verification`
subpage linked from the main policy index.

---

## Identity Verification via Singpass Myinfo

Creators on Get That Bread are required to verify their identity
through Singpass Myinfo before publishing a campaign. This section
explains what that means for your personal data.

### What we collect

When you verify, Singpass returns the following information to us —
with your explicit consent, given on our consent screen before you
are redirected to Singpass:

- Your **NRIC / FIN**, which we SHA-256 hash immediately on receipt
  and never store in raw form.
- Your **legal name**, as recorded on your NRIC.
- Your **date of birth**.
- Your **nationality**.
- Your **residential status** (Citizen, Permanent Resident, or other).

After Singpass returns this information, we show it to you read-only on
a confirmation screen. Nothing is saved to your account until you
explicitly click "Confirm."

### Why we collect it

- **NRIC / FIN (hashed):** to ensure that only one Get That Bread
  creator account can be linked to a single real person. This is our
  primary defence against duplicate-account fraud.
- **Name:** to match campaign payouts to the real person running the
  campaign. When we transfer funds you've raised, the recipient's
  bank account or PayNow name must match your verified legal name.
- **Date of birth:** to verify you are at least 18, the age of
  majority for commercial contract in Singapore.
- **Nationality:** to determine appropriate tax treatment at payout.
- **Residential status:** Get That Bread is currently open to
  Singapore Citizens and Permanent Residents only. If this is not
  your status, we direct you to an alternative onboarding path.

### How we use it

Your Myinfo information is used **only for the five purposes listed
above**. It is not used for marketing, profiling, advertising, or any
other purpose. It is not shared with third parties except:

- Our database host (Supabase, in Singapore region) under a data-
  processing agreement.
- Our payout processor, at payout time, solely to verify the match
  between verified name and bank-account name.

We do **not** cache your Myinfo data for re-use across sessions. Each
verification is a one-time event, and if your verification ever needs
to be refreshed or corrected, you'll re-authenticate through Singpass.

### How long we keep it

We retain your verification record for **the lifetime of your creator
account plus five years** after account closure. The five-year tail
covers commercial record-keeping obligations and anticipated audit
requirements.

### Your rights

Under Singapore's Personal Data Protection Act (PDPA), you have the
right to:

- **Access** — request a copy of the verification data we hold.
- **Correction** — request correction of inaccurate data (though the
  source of truth for Myinfo data is Singpass itself).
- **Withdraw consent / deletion** — request deletion of your
  verification record and your Get That Bread account.

To exercise any of these rights, email
[hello@getthatbread.sg](mailto:hello@getthatbread.sg). We will respond
within 30 days.

### If you cannot use Singpass

If you are based outside Singapore, do not hold a Singpass account, or
for any other reason cannot use Singpass, you may contact
[hello@getthatbread.sg](mailto:hello@getthatbread.sg) to discuss
alternative onboarding arrangements on a case-by-case basis.

### Data Protection Officer

For any data-protection query — access, correction, withdrawal,
incident report — contact:

**Daryl Wui**
[hello@getthatbread.sg](mailto:hello@getthatbread.sg)
