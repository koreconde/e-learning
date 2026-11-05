# Architecture rules

- Dispatch EscapeVision from submit-lead only after a successful database save, alongside existing background tasks, so navigation and test completion cannot duplicate or block delivery.
- Keep the EscapeVision sender and attribution validator runtime-neutral in src/lib so the browser captures attribution while the save handler sends validated data using the same rules.