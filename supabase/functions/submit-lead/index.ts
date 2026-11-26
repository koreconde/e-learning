import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { parsePhoneNumberFromString } from "npm:libphonenumber-js@1.13.2";
import { syncLeadToCrm, deriveSource } from "../_shared/crm-sync.ts";
import { sendLeadToEscapeVision } from "../_shared/escapevision.ts";
import { sendAuditedEmail } from "../_shared/send-audited-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Disposable email domains blocklist (common ones)
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "trashmail.com", "throwawaymail.com", "fakeinbox.com",
  "getnada.com", "maildrop.cc", "sharklasers.com", "guerrillamailblock.com",
  "dispostable.com", "mailnesia.com", "mailcatch.com", "tempinbox.com",
  "tempr.email", "tmpmail.org", "throwaway.email", "burnermail.io",
  "spamgourmet.com", "mintemail.com", "emailondeck.com", "moakt.com",
  "mohmal.com", "harakirimail.com", "tempmailaddress.com", "emltmp.com",
  "1secmail.com", "1secmail.net", "1secmail.org", "wegwerfmail.de",
  "trbvm.com", "tempmail.dev", "tempm.com", "minuteinbox.com",
]);

const BodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).toLowerCase(),
  phone: z.string().trim().min(8).max(25),
  goal: z.enum(["lavoro", "studio", "viaggio", "curiosita"]),
  timeline: z.enum(["subito", "1_3_mesi", "piu_avanti", "non_so"]),
  eta: z.enum(["18-24", "25-34", "35-44", "45-54", "55+"]),
  occupazione: z.enum([
    "Lavoratore dipendente",
    "Libero professionista",
    "Imprenditore",
    "Studente",
    "Non lavoratore",
  ]),
  consent: z.literal(true),
  turnstileToken: z.string().min(10).max(2048),
  phoneVerificationToken: z.string().max(64).optional().default(""),
  adsAttribution: z.object({
    gclid: z.string().regex(/^[A-Za-z0-9_\-.~]{10,255}$/).optional(),
    gbraid: z.string().regex(/^[A-Za-z0-9_\-.~]{10,255}$/).optional(),
    wbraid: z.string().regex(/^[A-Za-z0-9_\-.~]{10,255}$/).optional(),
    ts: z.number().finite(),
  }).optional().catch(undefined),

  // Honeypot — must be empty
  website: z.string().max(0).optional().default(""),
  // Anti-bot: how long the user spent on the form (ms)
  elapsedMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
  attribution: z
    .object({
      utm_source: z.string().max(120).nullable().optional(),
      utm_medium: z.string().max(120).nullable().optional(),
      utm_campaign: z.string().max(120).nullable().optional(),
      utm_content: z.string().max(120).nullable().optional(),
      utm_term: z.string().max(120).nullable().optional(),
      referrer: z.string().max(500).nullable().optional(),
      landing_url: z.string().max(500).nullable().optional(),
    })
    .optional()
    .default({}),
});

// Free email domains (lower intent for B2B/professional training)
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.it", "ymail.com",
  "hotmail.com", "hotmail.it", "outlook.com", "outlook.it", "live.com", "live.it", "msn.com",
  "libero.it", "alice.it", "tin.it", "tiscali.it", "virgilio.it", "fastwebnet.it",
  "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me", "gmx.com", "gmx.it",
]);

function scoreLead(input: {
  goal: string;
  timeline: string;
  email: string;
  elapsedMs: number;
  utm_source: string | null;
  utm_medium: string | null;
}): { score: number; quality: "hot" | "warm" | "cold" } {
  let s = 0;
  // Goal
  s += input.goal === "lavoro" ? 30 : input.goal === "studio" ? 25 : input.goal === "viaggio" ? 12 : 5;
  // Timeline
  s += input.timeline === "subito" ? 35 : input.timeline === "1_3_mesi" ? 25 : input.timeline === "piu_avanti" ? 10 : 5;
  // Email type
  const domain = (input.email.split("@")[1] ?? "").toLowerCase();
  s += FREE_EMAIL_DOMAINS.has(domain) ? 5 : 20;
  // Engagement: time spent on form (sweet spot 8s–5min)
  if (input.elapsedMs >= 8000 && input.elapsedMs <= 5 * 60 * 1000) s += 10;
  else if (input.elapsedMs > 2000) s += 5;
  // Source quality
  const src = (input.utm_source ?? "").toLowerCase();
  const med = (input.utm_medium ?? "").toLowerCase();
  if (!src && !med) s += 5; // direct/organic
  else if (med.includes("organic") || src.includes("google")) s += 8;
  else if (med.includes("referral")) s += 6;
  // cap
  s = Math.max(0, Math.min(100, s));
  const quality = s >= 70 ? "hot" : s >= 45 ? "warm" : "cold";
  return { score: s, quality };
}

// Strict name: at least 2 words, only letters/spaces/apostrophes/hyphens
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’\-]{2,})+$/;
// Italian or international phone: + optional, 8-15 digits total
const PHONE_RE = /^\+?[0-9 ()\-.]{8,25}$/;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(token: string, ip: string | null): Promise<{ ok: boolean; codes: string[] }> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.error("Missing TURNSTILE_SECRET_KEY");
    return { ok: false, codes: ["missing-secret"] };
  }
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = await r.json();
    if (!data.success) {
      console.warn("Turnstile failed", data["error-codes"]);
    }
    return { ok: !!data.success, codes: Array.isArray(data["error-codes"]) ? data["error-codes"] : [] };
  } catch (e) {
    console.error("Turnstile network error", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const data = parsed.data;

  // Honeypot: if filled, silently succeed
  if (data.website && data.website.length > 0) {
    console.log("Honeypot triggered", { email: data.email });
    return jsonResponse({ success: true, leadToken: crypto.randomUUID(), spam: true });
  }

  // Time check: must take at least 2 seconds to fill the form
  if (data.elapsedMs < 2000) {
    console.log("Form submitted too fast", { elapsedMs: data.elapsedMs, email: data.email });
    return jsonResponse({ success: true, leadToken: crypto.randomUUID(), spam: true });
  }

  // Strict field validation
  if (!NAME_RE.test(data.name)) {
    return jsonResponse({ error: "Inserisci nome e cognome reali" }, 400);
  }
  if (!PHONE_RE.test(data.phone)) {
    return jsonResponse({ error: "Numero di telefono non valido" }, 400);
  }
  const parsedPhone = parsePhoneNumberFromString(data.phone, "IT");
  if (!parsedPhone || !parsedPhone.isValid()) {
    return jsonResponse({ error: "Inserisci un numero di telefono reale e valido" }, 400);
  }
  // Normalize to E.164 for storage
  const normalizedPhone = parsedPhone.number;
  const domain = data.email.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return jsonResponse({ error: "Utilizza un indirizzo email reale" }, 400);
  }

  // Turnstile verification
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;

  // Insert lead with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Temporarily off while the phone provider account is suspended: leads are
  // saved as unverified and the anti-bot check becomes strict.
  const PHONE_VERIFICATION_ENABLED = false;
  let phoneVerified = false;
  if (PHONE_VERIFICATION_ENABLED || data.phoneVerificationToken) {
  // Phone must be verified via WhatsApp OTP
    const { data: verification } = await supabase
      .from("phone_verifications")
      .select("id, phone, verified, expires_at")
      .eq("token", data.phoneVerificationToken)
      .maybeSingle();
  
    if (
      !verification ||
      !verification.verified ||
      verification.phone !== normalizedPhone ||
      new Date(verification.expires_at) < new Date()
    ) {
      return jsonResponse(
        { error: "Numero non verificato. Ripeti la verifica WhatsApp." },
        403,
      );
    }
    phoneVerified = true;
  }

  // Anti-bot check runs after the phone OTP check. A token that only expired or
  // was already consumed (OTP step took long, or a retry) is accepted because the
  // visitor already proved a real phone via OTP; any other failure still blocks.
  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.ok) {
    const onlyStale = turnstile.codes.length > 0 &&
      turnstile.codes.every((c) => c === "timeout-or-duplicate");
    if (!onlyStale || !phoneVerified) {
      return jsonResponse({ error: "Verifica anti-bot fallita. Ricarica e riprova." }, 403);
    }
    console.info("Turnstile stale token accepted after verified phone");
  }


  const leadToken = crypto.randomUUID();
  const scoring = scoreLead({
    goal: data.goal,
    timeline: data.timeline,
    email: data.email,
    elapsedMs: data.elapsedMs,
    utm_source: data.attribution.utm_source ?? null,
    utm_medium: data.attribution.utm_medium ?? null,
  });
  const { data: inserted, error } = await supabase
    .from("leads")
    .upsert({
      name: data.name,
      email: data.email,
      phone: normalizedPhone,
      phone_verified: phoneVerified,
      consent: true,
      lead_token: leadToken,

      // Reset test state: a re-submission with the same email is a new attempt
      completed: false,
      level: null,
      score: null,
      total: null,
      errors: null,
      completed_at: null,
      contact_preference: null,

      goal: data.goal,
      timeline: data.timeline,
      eta: data.eta,
      occupazione: data.occupazione,
      lead_score: scoring.score,
      lead_quality: scoring.quality,
      utm_source: data.attribution.utm_source ?? null,
      utm_medium: data.attribution.utm_medium ?? null,
      utm_campaign: data.attribution.utm_campaign ?? null,
      utm_content: data.attribution.utm_content ?? null,
      utm_term: data.attribution.utm_term ?? null,
      referrer: data.attribution.referrer ?? null,
      landing_url: data.attribution.landing_url ?? null,
    }, { onConflict: "email", ignoreDuplicates: false })
    .select("id")
    .single();

  if (error) {
    console.error("Lead insert failed", error);
    return jsonResponse({ error: "Errore nel salvataggio. Riprova." }, 500);
  }

  // Notify admins (fire-and-forget). Errors logged but don't block.
  // Exactly one dispatch per successful save; never dispatch from complete-test.
  const escapeVisionPromise = sendLeadToEscapeVision({
    name: data.name,
    email: data.email,
    phone: normalizedPhone,
    adsAttribution: data.adsAttribution,
  });

  const adminPayload = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    goal: data.goal,
    timeline: data.timeline,
    eta: data.eta,
    occupazione: data.occupazione,
    lead_score: scoring.score,
    lead_quality: scoring.quality,
  };
  const idemBase = leadToken;

  // Sync completa verso il CRM esterno
  const attribution = {
    utm_source: data.attribution.utm_source ?? null,
    utm_medium: data.attribution.utm_medium ?? null,
    utm_campaign: data.attribution.utm_campaign ?? null,
    utm_content: data.attribution.utm_content ?? null,
    utm_term: data.attribution.utm_term ?? null,
    referrer: data.attribution.referrer ?? null,
    landing_url: data.attribution.landing_url ?? null,
  };
  const fonte = deriveSource(attribution);
  const crmPromise = syncLeadToCrm({
    nome: data.name,
    email: data.email,
    telefono: normalizedPhone,
    obiettivo: data.goal,
    tempistica: data.timeline,
    eta: data.eta,
    occupazione: data.occupazione,
    qualita: scoring.quality,
    score: scoring.score,
    completato: false,
    fonte,
    ...attribution,
    note: `Fonte: ${fonte} | Qualità: ${scoring.quality} (${scoring.score}/100) | Obiettivo: ${data.goal} | Tempistica: ${data.timeline} | Età: ${data.eta} | Occupazione: ${data.occupazione}`,
  }).catch((e) => console.error("crm sync failed", e));

  const admins = ["info@englishinfinity.io", "giada@escapecampus.it", "raff@escapecampus.it", "francesca@escapecampus.it"];
  const emailPromise = Promise.all(
    admins.map((addr) =>
      sendAuditedEmail(supabase, "new-lead-admin", addr, {
          idempotencyKey: `new-lead-admin-${addr}-${idemBase}`,
          templateData: adminPayload,
        })
        .then((res) => {
          console.log("admin email outcome", { sent: res.sent });
        })
        .catch((e) => console.error("admin email exception", addr, e)),
    ),
  );

  // Non bloccare la risposta: CRM + email admin proseguono in background
  const bg = Promise.allSettled([crmPromise, emailPromise, escapeVisionPromise]);
  // @ts-ignore EdgeRuntime is available in Supabase Edge Functions
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(bg);

  return jsonResponse({ success: true, leadId: inserted.id, leadToken });
});