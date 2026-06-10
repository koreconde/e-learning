import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  leadToken: z.string().uuid(),
  contactPreference: z.enum(["subito", "dopo", "no"]),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Score delta applied on top of the base score computed at lead submission
function scoreDelta(pref: "subito" | "dopo" | "no"): number {
  return pref === "subito" ? 30 : pref === "dopo" ? 20 : 0;
}
function qualityFor(score: number): "hot" | "warm" | "cold" {
  return score >= 70 ? "hot" : score >= 45 ? "warm" : "cold";
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
  const { leadToken, contactPreference } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up current score so we can add the delta
  const { data: lead, error: fetchErr } = await supabase
    .from("leads")
    .select("id, lead_score, contact_preference")
    .eq("lead_token", leadToken)
    .maybeSingle();

  if (fetchErr) {
    console.error("Lead lookup failed", fetchErr);
    return jsonResponse({ error: "Errore nel salvataggio" }, 500);
  }
  if (!lead) {
    return jsonResponse({ error: "Lead non trovato" }, 404);
  }

  // Idempotency: don't double-apply the delta if user clicks again with same choice
  if (lead.contact_preference === contactPreference) {
    return jsonResponse({ success: true, alreadySet: true });
  }

  // Recompute: strip previous delta if any, then add new one
  const previousDelta = lead.contact_preference
    ? scoreDelta(lead.contact_preference as "subito" | "dopo" | "no")
    : 0;
  const baseScore = (lead.lead_score ?? 0) - previousDelta;
  const newScore = Math.max(0, Math.min(100, baseScore + scoreDelta(contactPreference)));
  const newQuality = qualityFor(newScore);

  const { error: updateErr } = await supabase
    .from("leads")
    .update({
      contact_preference: contactPreference,
      lead_score: newScore,
      lead_quality: newQuality,
    })
    .eq("id", lead.id);

  if (updateErr) {
    console.error("Lead update failed", updateErr);
    return jsonResponse({ error: "Errore nel salvataggio" }, 500);
  }

  return jsonResponse({ success: true, leadScore: newScore, leadQuality: newQuality });
});