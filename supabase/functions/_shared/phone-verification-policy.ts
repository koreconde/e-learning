// Shared by the form and the lead handler so verification cannot drift.
export const PHONE_VERIFICATION_ENABLED = true;

export function requiresPhoneVerification(token: string): boolean {
  return PHONE_VERIFICATION_ENABLED || Boolean(token);
}