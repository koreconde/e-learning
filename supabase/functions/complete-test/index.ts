import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { syncLeadToCrm, deriveSource } from "../_shared/crm-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ErrorItemSchema = z.object({
  questionNumber: z.number(),
  level: z.string().max(20),
  skill: z.string().max(40),
  prompt: z.string().max(2000),
  userAnswer: z.string().max(500),
  correctAnswer: z.string().max(500),
});

const BodySchema = z.object({
  leadToken: z.string().uuid(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(0).max(1000),
  errors: z.array(ErrorItemSchema).max(500),
}).refine((d) => d.score <= d.total, { message: "score must be <= total", path: ["score"] });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
  const { leadToken, level, score, total, errors } = parsed.data;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up lead by token
  const { data: lead, error: lookupError } = await supabase
    .from("leads")
    .select("id, name, email, phone, completed, goal, timeline, lead_score, lead_quality, contact_preference, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_url, created_at")
    .eq("lead_token", leadToken)
    .maybeSingle();

  if (lookupError || !lead) {
    console.warn("Lead token not found", { leadToken, lookupError });
    // Silent success — likely a honeypot/spam pseudo-token
    return jsonResponse({ success: true });
  }

  // Prevent overwriting an already-completed test
  if (lead.completed) {
    return jsonResponse({ success: true, alreadyCompleted: true });
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      completed: true,
      level,
      score,
      total,
      errors,
      completed_at: new Date().toISOString(),
    })
    .eq("id", lead.id);

  if (updateError) {
    console.error("Lead update failed", updateError);
    return jsonResponse({ error: "Errore nel salvataggio" }, 500);
  }

  const idemBase = `${lead.email}-${Date.now()}`;
  const emailPayload = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    level,
    score,
    total,
    errors,
  };

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const invokeHeaders = { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey };

  // Aggiorna il CRM esterno con TUTTE le informazioni del lead
  {
    const attribution = {
      utm_source: lead.utm_source ?? null,
      utm_medium: lead.utm_medium ?? null,
      utm_campaign: lead.utm_campaign ?? null,
      utm_content: lead.utm_content ?? null,
      utm_term: lead.utm_term ?? null,
      referrer: lead.referrer ?? null,
      landing_url: lead.landing_url ?? null,
    };
    const fonte = deriveSource(attribution);
    await syncLeadToCrm({
      nome: lead.name,
      email: lead.email,
      telefono: lead.phone,
      obiettivo: lead.goal ?? null,
      tempistica: lead.timeline ?? null,
      contatto: lead.contact_preference ?? null,
      qualita: lead.lead_quality ?? null,
      score: lead.lead_score ?? null,
      livello: level,
      test_score: score,
      test_total: total,
      completato: true,
      fonte,
      ...attribution,
      data_ingresso: lead.created_at ?? null,
      note: `Fonte: ${fonte} | Livello: ${level} | Test: ${score}/${total} | Qualità: ${lead.lead_quality ?? "-"} (${lead.lead_score ?? "-"}/100) | Obiettivo: ${lead.goal ?? "-"} | Tempistica: ${lead.timeline ?? "-"} | Contatto: ${lead.contact_preference ?? "-"}`,
    });
  }

  // Send result to lead
  supabase.functions
    .invoke("send-transactional-email", {
      headers: invokeHeaders,
      body: {
        templateName: "test-result-lead",
        recipientEmail: lead.email,
        idempotencyKey: `lead-${idemBase}`,
        templateData: emailPayload,
      },
    })
    .then((res) => {
      if (res.error) console.error("lead email error", res.error);
    })
    .catch((e) => console.error("lead email exception", e));

  const admins = ["info@englishinfinity.io", "giada@escapecampus.it", "raff@escapecampus.it", "francesca@escapecampus.it"];
  await Promise.all(
    admins.map((addr) =>
      supabase.functions
        .invoke("send-transactional-email", {
          headers: invokeHeaders,
          body: {
            templateName: "test-result-admin",
            recipientEmail: addr,
            idempotencyKey: `admin-${addr}-${idemBase}`,
            templateData: emailPayload,
          },
        })
        .then((res) => {
          if (res.error) console.error("admin result email error", addr, res.error);
        })
        .catch((e) => console.error("admin result email exception", addr, e)),
    ),
  );

  // Fire-and-forget Mailchimp sync (uses MAILCHIMP_DEFAULT_LIST_ID if set)
  supabase.functions
    .invoke("mailchimp-sync-lead", {
      headers: invokeHeaders,
      body: {
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        level,
        score,
        total,
        completed: true,
      },
    })
    .then((res) => { if (res.error) console.error("mailchimp sync error", res.error); })
    .catch((e) => console.error("mailchimp sync exception", e));

  return jsonResponse({ success: true });
});