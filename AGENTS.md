# Architecture rules

- Share the phone-verification enablement policy between the form and lead handler so the client and server cannot disagree about requiring OTP.

- Run daily monitoring through a token-protected scheduled function with a database lease, per-day persisted checks, deterministic alert keys and persisted AI pause state; never create synthetic leads or send verification codes.

- Dispatch EscapeVision from submit-lead only after a successful database save, alongside existing background tasks, so navigation and test completion cannot duplicate or block delivery.
- Keep runtime-neutral CRM helpers in supabase/functions/_shared and re-export through src/lib so function deployment includes them and browser/server validation stays consistent.
- Send app emails from their feature functions through the managed helper with attempt-derived idempotency keys; retain legacy audit tables only as notification copies, never send gates.
- Deduplicate signed email outcome notifications by a deterministic event-derived audit row ID so retries cannot append duplicate records.
- Route the English screener through a balanced adaptive receptive-skill bank with provisional Bayesian estimates; productive skills are teacher-assessed, not inferred from word count or copied transcripts.
- Always append a level-matched speaking task after adaptive completion or timeout; keep its recorded/written/skipped outcome separate from receptive-skill scoring.
- Fetch test audio as binary blobs, preload without autoplay, and invoke playback directly from a tap to preserve mobile browser user activation.
- Use complete MediaRecorder files for speaking transcription and release microphone tracks on every exit so voice input does not depend on Web Speech availability.
- Parse structured function error responses through the shared browser service-error helper so safe upstream reasons and terminal retry restrictions survive non-2xx responses.
- Map unsupported phone destinations in a runtime-neutral helper and keep SMS sends user-initiated so channel recovery cannot generate duplicate or unsolicited verification traffic.
- Classify phone-provider funding/auth outages in one shared helper for send/check flows; block channel retries until the dialog is reopened and monitor balance read-only so service accessibility is not mistaken for funded delivery.