const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const SERVICE_NAME = "English Infinity";
// Known Verify service SID — avoids an extra Twilio round-trip on every request.
const DEFAULT_SERVICE_SID = "VA422639a8c5eb1f4341d1da210d64f693";

let cachedServiceSid: string | null = DEFAULT_SERVICE_SID;


function authHeaders() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const twilioKey = Deno.env.get("TWILIO_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!twilioKey) throw new Error("TWILIO_API_KEY is not configured");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": twilioKey,
  };
}

async function twilioFetch(path: string, init?: { method?: string; form?: Record<string, string> }) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      ...authHeaders(),
      ...(init?.form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: init?.form ? new URLSearchParams(init.form) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Twilio request failed [${res.status}] ${path}: ${text}`);
    throw new Error(`[${res.status}]: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function getVerifyServiceSid(): Promise<string> {
  if (cachedServiceSid) return cachedServiceSid;

  const list = await twilioFetch("/verify/v2/Services?PageSize=50");
  const existing = (list.services ?? []).find(
    (s: { friendly_name?: string; sid: string }) => s.friendly_name === SERVICE_NAME,
  );
  if (existing) {
    cachedServiceSid = existing.sid;
    return existing.sid;
  }

  const created = await twilioFetch("/verify/v2/Services", {
    method: "POST",
    form: { FriendlyName: SERVICE_NAME, CodeLength: "6" },
  });
  cachedServiceSid = created.sid;
  return created.sid as string;
}

export async function startVerification(phoneE164: string, channel: "whatsapp" | "sms" = "whatsapp") {
  const sid = await getVerifyServiceSid();
  return await twilioFetch(`/verify/v2/Services/${sid}/Verifications`, {
    method: "POST",
    form: { To: phoneE164, Channel: channel, Locale: "it" },
  });
}

export async function checkVerification(phoneE164: string, code: string) {
  const sid = await getVerifyServiceSid();
  return await twilioFetch(`/verify/v2/Services/${sid}/VerificationCheck`, {
    method: "POST",
    form: { To: phoneE164, Code: code },
  });
}
