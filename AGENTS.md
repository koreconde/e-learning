# Architecture rules

- Dispatch EscapeVision from submit-lead only after a successful database save, alongside existing background tasks, so navigation and test completion cannot duplicate or block delivery.
- Keep runtime-neutral CRM helpers in supabase/functions/_shared and re-export through src/lib so function deployment includes them and browser/server validation stays consistent.
- Send app emails from their feature functions through the managed helper with attempt-derived idempotency keys; retain legacy audit tables only as notification copies, never send gates.
- Deduplicate signed email outcome notifications by a deterministic event-derived audit row ID so retries cannot append duplicate records.
- Route the English screener through a balanced adaptive receptive-skill bank with provisional Bayesian estimates; productive skills are teacher-assessed, not inferred from word count or copied transcripts.
- Always append a level-matched speaking task after adaptive completion or timeout; keep its recorded/written/skipped outcome separate from receptive-skill scoring.
- Fetch test audio as binary blobs, preload without autoplay, and invoke playback directly from a tap to preserve mobile browser user activation.
- Use complete MediaRecorder files for speaking transcription and release microphone tracks on every exit so voice input does not depend on Web Speech availability.