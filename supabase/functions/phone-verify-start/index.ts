import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { parsePhoneNumberFromString } from "npm:libphonenumber-js@1.13.2";
import { startVerification } from "../_shared/twilio-verify.ts";
import { phoneVerificationError } from "../_shared/phone-verification-error.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  phone: z.string().trim().min(8).max(25),
  channel: z.enum(["whatsapp", "sms"]).optional().default("whatsapp"),
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
  if (!parsed.success) return json({ error: "Numero non valido" }, 400);

  const parsedPhone = parsePhoneNumberFromString(parsed.data.phone, "IT");
  if (!parsedPhone || !parsedPhone.isValid()) {
    return json({ error: "Inserisci un numero di telefono reale e valido" }, 400);
  }
  const phone = parsedPhone.number;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;

  // Rate limit: max 5 send attempts per phone per hour
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("phone_verifications")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", since);

  if ((count ?? 0) >= 5) {
    return json({ error: "Troppi tentativi. Riprova tra un'ora." }, 429);
  }

  try {
    await startVerification(phone, parsed.data.channel);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Twilio verification start failed", msg);
    const failure = phoneVerificationError(msg, parsed.data.channel);
    return json(failure, failure.status);
  }

  const { data: row, error } = await supabase
    .from("phone_verifications")
    .insert({ phone, ip })
    .select("id")
    .single();

  if (error) {
    console.error("phone_verifications insert failed", error);
    return json({ error: "Errore interno. Riprova." }, 500);
  }

  return json({ success: true, verificationId: row.id, phone });
});
