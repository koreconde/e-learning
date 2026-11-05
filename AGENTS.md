# Architecture rules

- Dispatch EscapeVision from submit-lead only after a successful database save, alongside existing background tasks, so navigation and test completion cannot duplicate or block delivery.
- Keep runtime-neutral CRM helpers in supabase/functions/_shared and re-export through src/lib so function deployment includes them and browser/server validation stays consistent.