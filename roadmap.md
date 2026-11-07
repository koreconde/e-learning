# Tasks

- [x] Improve question coverage and introduce adaptive difficulty with honest placement results.
- [x] Verify adaptive routing and scoring with 8 focused tests; 25 tests passed overall. Desktop/mobile completion with audio-unavailable fallback passed without overflow. Live audio and verified-phone lead/CRM completion were not exercised; calibration against teacher assessments remains outside this implementation.

- [x] Update email delivery, preserve contents and recipients, and retain audit data.
- [x] Replace legacy outcome handlers, validate and deploy replacements without publishing.
- [x] Remove replaced legacy source files; Deno checks, 17 tests, preview rendering and automatic build passed. Production sending/outcome callbacks require publishing and were not exercised.

- [x] Add non-blocking EscapeVision delivery after successful lead saves without replacing existing destinations.
- [x] Capture and validate Google click IDs before rendering, with a 90-day expiry.
- [x] Run 11 focused tests, verify browser attribution capture, deploy submit-lead and verify validation still rejects invalid requests; full verified-phone submission remains untested.
- [x] Show the requested diff in the completion message.