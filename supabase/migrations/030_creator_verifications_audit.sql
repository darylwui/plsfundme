-- Creator KYC audit trail + manual-review path.
--
-- 1. Widen `method` to allow 'manual' so the May-launch admin-review KYC
--    flow can write to the same table as Singpass Myinfo verifications.
--    Phase 1 of launch goes live with manual review; Singpass swaps in
--    once GovTech grants the prod linkup (4–10 week window).
--
-- 2. Add the audit-trail columns GovTech reviewers ask about during the
--    Myinfo prod linkup application:
--      - consent_granted_at: when the user clicked "Allow" on the
--        Singpass consent screen (the ID token `iat` is the closest
--        proxy we have)
--      - consent_scopes: the OIDC scopes the user actually consented to
--        (we record what the access token granted, not what we asked
--        for, in case Singpass narrows the response)
--      - myinfo_txn_id: the `txnNo` from the Myinfo Person response.
--        This is the receipt the user can quote when disputing what
--        was shared, and the value GovTech will ask for during any
--        post-incident audit.
--    All three are nullable because manual-review KYC won't have them.

alter table creator_verifications
  drop constraint if exists creator_verifications_method_check;

alter table creator_verifications
  add constraint creator_verifications_method_check
  check (method in ('singpass', 'manual'));

alter table creator_verifications
  add column if not exists consent_granted_at timestamptz,
  add column if not exists consent_scopes     text[],
  add column if not exists myinfo_txn_id      text;
