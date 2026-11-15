import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { checkVerification } from "../_shared/twilio-verify.ts";
import { phoneServiceOutage } from "../_shared/phone-verification-error.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  verificationId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{4,10}$/, "Codice non valido"),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) return json({ error: "Codice non valido" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: row, error } = await supabase
    .from("phone_verifications")
    .select("id, phone, verified, attempts, expires_at, token")
    .eq("id", parsed.data.verificationId)
    .maybeSingle();

  if (error || !row) return json({ error: "Verifica non trovata. Richiedi un nuovo codice." }, 404);
  if (new Date(row.expires_at) < new Date()) {
    return json({ error: "Codice scaduto. Richiedine uno nuovo." }, 410);
  }
  if (row.verified) return json({ success: true, verificationToken: row.token });
  if (row.attempts >= 6) return json({ error: "Troppi tentativi. Richiedi un nuovo codice." }, 429);

  let approved = false;
  try {
    const res = await checkVerification(row.phone, parsed.data.code);
    approved = res.status === "approved";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Twilio verification check failed", message);
    const outage = phoneServiceOutage(message);
    if (outage) return json(outage, outage.status);
    await supabase.from("phone_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return json({ error: "Codice non valido o scaduto." }, 400);
  }

  await supabase.from("phone_verifications").update({ attempts: row.attempts + 1 }).eq("id", row.id);

  if (!approved) return json({ error: "Codice errato. Riprova." }, 400);

  const { error: upErr } = await supabase
    .from("phone_verifications")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", row.id);

  if (upErr) {
    console.error("phone_verifications update failed", upErr);
    return json({ error: "Errore interno. Riprova." }, 500);
  }

  return json({ success: true, verificationToken: row.token });
});
