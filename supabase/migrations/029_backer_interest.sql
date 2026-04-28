-- Backer interest waitlist: email capture for pre-launch visitors who want
-- to be notified when campaigns go live. No auth required — collected via
-- public API route with rate limiting.

CREATE TABLE backer_interest (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  referrer   text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX backer_interest_email_idx ON backer_interest (lower(email));

ALTER TABLE backer_interest ENABLE ROW LEVEL SECURITY;
-- Accessed exclusively via service-role from the API route; no client-side
-- RLS policies needed.
