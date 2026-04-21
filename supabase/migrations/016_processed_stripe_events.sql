-- Dedupe Stripe webhook deliveries. Stripe retries 5xx/timeout deliveries
-- up to 3 days, which without guardrails would double-increment pledge
-- totals and fire duplicate emails. The handler attempts an INSERT into
-- this table first; the primary-key conflict is how we detect a replay.

create table if not exists processed_stripe_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Only the service role (used by the webhook handler) should touch this.
alter table processed_stripe_events enable row level security;

-- No policies → no access for anon/auth roles. Service role bypasses RLS.

-- Cheap maintenance: bound growth by letting old rows be pruned manually
-- or via a scheduled task. Index on processed_at to make that efficient.
create index if not exists processed_stripe_events_processed_at_idx
  on processed_stripe_events (processed_at);
