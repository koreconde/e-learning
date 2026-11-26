// Shared by the lead handler and the test handler so admin notifications cannot drift.
// info@englishinfinity.io and giada@escapecampus.it were removed: those mailboxes
// refuse or bounce our notification emails.
export const ADMIN_NOTIFICATION_RECIPIENTS = [
  "raff@escapecampus.it",
  "francesca@escapecampus.it",
] as const;
