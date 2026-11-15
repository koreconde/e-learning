# Tasks

- [x] Sweep Twilio funding/auth failures across WhatsApp, SMS, code checking and daily monitoring; 13 regression checks and intercepted 390px browser check pass. Updated functions deployed; frontend awaits publication. Lead gate and settled records unchanged.
- [x] Restore Twilio authorization and verify live balance and Verify service: both return 200 after reconnect; balance positive and affected functions redeployed. Actual code delivery remains unverified; no real codes sent.

- [x] Handle WhatsApp 60600 as an unsupported destination and expose the safe error with explicit SMS alternative. Reconnected Twilio and verified service read (200); deployed verification functions. Regression checks and 320/390px UI passed; actual SMS/WhatsApp delivery to affected numbers remains unverified (no codes sent).
- [x] Verify restored audio/voice credits with real decoded audio and accurate hosted transcription; disable retries for permanent failures while retaining text access. No models or credit limits changed; frontend requires publication.

- [x] Review publication readiness: 39 tests pass, latest build OK and basic security scan reports no findings. Real-device and full lead/CRM verification remain unverified; publishing was not requested directly and was not performed.
- [x] Activate daily monitoring at 07:23 UTC for website reachability, database reads, Twilio service access, recent email failures and real example audio/transcription. First run passed all five checks. Failure-only alerts configured for raff@escapecampus.it; actual alert delivery has not been exercised because no failure occurred. No synthetic leads or WhatsApp codes sent.

- [x] Include a level-matched speaking task after receptive completion or timeout; recorded/written/skipped outcome appears in results without changing CEFR scoring.
- [x] Verify test-to-speaking-to-results flow with real example audio, recorded speech and hosted transcription at 320px, 390px and desktop; 36 tests passed, including permission denial and cleanup. Physical iOS/Android and in-app browser checks remain unavailable without actual devices; lead and CRM flows untouched.

- [x] Fix binary listening playback and tap-driven mobile-safe controls; all 14 listening recordings decoded successfully and real playback passed.
- [x] Harden microphone recording and verify real transcription and confirmation at 320px, 390px and desktop; cleanup and permission tests passed; 32 tests passed overall.
- [x] Clarify speaking availability: adaptive assessment currently excludes it; no scoring or question-bank change made. Physical Safari/Chrome and in-app browser checks need actual devices and remain unverified.

- [x] Improve question coverage and introduce adaptive difficulty with honest placement results.
- [x] Verify adaptive routing and scoring with 8 focused tests; 25 tests passed overall. Desktop/mobile completion with audio-unavailable fallback passed without overflow. Live audio and verified-phone lead/CRM completion were not exercised; calibration against teacher assessments remains outside this implementation.

- [x] Update email delivery, preserve contents and recipients, and retain audit data.
- [x] Replace legacy outcome handlers, validate and deploy replacements without publishing.
- [x] Remove replaced legacy source files; Deno checks, 17 tests, preview rendering and automatic build passed. Production sending/outcome callbacks require publishing and were not exercised.

- [x] Add non-blocking EscapeVision delivery after successful lead saves without replacing existing destinations.
- [x] Capture and validate Google click IDs before rendering, with a 90-day expiry.
- [x] Run 11 focused tests, verify browser attribution capture, deploy submit-lead and verify validation still rejects invalid requests; full verified-phone submission remains untested.
- [x] Show the requested diff in the completion message.