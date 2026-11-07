# Architecture rules

- Dispatch EscapeVision from submit-lead only after a successful database save, alongside existing background tasks, so navigation and test completion cannot duplicate or block delivery.
- Keep runtime-neutral CRM helpers in supabase/functions/_shared and re-export through src/lib so function deployment includes them and browser/server validation stays consistent.
- Send app emails from their feature functions through the managed helper with attempt-derived idempotency keys; retain legacy audit tables only as notification copies, never send gates.
- Deduplicate signed email outcome notifications by a deterministic event-derived audit row ID so retries cannot append duplicate records.