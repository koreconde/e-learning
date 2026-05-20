import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

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
  level: z.string().min(1).max(10),
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(0).max(1000),
  errors: z.array(ErrorItemSchema).max(500),
});

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
    .select("id, name, email, phone")
    .eq("lead_token", leadToken)
    .maybeSingle();

  if (lookupError || !lead) {
    console.warn("Lead token not found", { leadToken, lookupError });
    // Silent success — likely a honeypot/spam pseudo-token
    return jsonResponse({ success: true });
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

  return jsonResponse({ success: true });
});