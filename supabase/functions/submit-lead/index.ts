import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

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
  consent: z.literal(true),
  turnstileToken: z.string().min(10).max(2048),
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

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.error("Missing TURNSTILE_SECRET_KEY");
    return false;
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
    return !!data.success;
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
  const domain = data.email.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return jsonResponse({ error: "Utilizza un indirizzo email reale" }, 400);
  }

  // Turnstile verification
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const ok = await verifyTurnstile(data.turnstileToken, ip);
  if (!ok) {
    return jsonResponse({ error: "Verifica anti-bot fallita. Ricarica e riprova." }, 403);
  }

  // Insert lead with service role (bypasses RLS)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const leadToken = crypto.randomUUID();
  const { data: inserted, error } = await supabase
    .from("leads")
    .upsert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      consent: true,
      lead_token: leadToken,
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
  const adminPayload = { name: data.name, email: data.email, phone: data.phone };
  const idemBase = `${data.email}-${Date.now()}`;
  const admins = ["info@englishinfinity.io", "giada@escapecampus.it", "raff@escapecampus.it"];
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  await Promise.all(
    admins.map((addr) =>
      supabase.functions
        .invoke("send-transactional-email", {
          headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
          body: {
            templateName: "new-lead-admin",
            recipientEmail: addr,
            idempotencyKey: `newlead-${addr}-${idemBase}`,
            templateData: adminPayload,
          },
        })
        .then((res) => {
          if (res.error) console.error("admin email error", addr, res.error);
          else console.log("admin email queued", addr);
        })
        .catch((e) => console.error("admin email exception", addr, e)),
    ),
  );

  return jsonResponse({ success: true, leadId: inserted.id, leadToken });
});