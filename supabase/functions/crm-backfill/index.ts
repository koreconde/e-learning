import { createClient } from "npm:@supabase/supabase-js@2";
import { syncLeadToCrm, deriveSource } from "../_shared/crm-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Esporta tutti i lead esistenti verso il CRM esterno.
// Protetta dallo stesso segreto della sync (header x-crm-ingest-secret).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const secret = Deno.env.get("CRM_INGEST_SECRET");
  if (!secret || req.headers.get("x-crm-ingest-secret") !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const limit = Number(body.limit ?? 2000);
  const offset = Number(body.offset ?? 0);
  const dryRun = body.dryRun === true;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "name,email,phone,goal,timeline,lead_score,lead_quality,contact_preference,level,score,total,completed,created_at,call_status,call_notes,assigned_to,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,landing_url",
    )
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (dryRun) {
    return new Response(JSON.stringify({ count: leads?.length ?? 0, sample: leads?.[0] ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  for (const lead of leads ?? []) {
    const attribution = {
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
      referrer: lead.referrer,
      landing_url: lead.landing_url,
    };
    const fonte = deriveSource(attribution);
    await syncLeadToCrm({
      nome: lead.name,
      email: lead.email,
      telefono: lead.phone,
      obiettivo: lead.goal,
      tempistica: lead.timeline,
      contatto: lead.contact_preference,
      qualita: lead.lead_quality,
      score: lead.lead_score,
      livello: lead.level,
      test_score: lead.score,
      test_total: lead.total,
      completato: lead.completed,
      data_ingresso: lead.created_at,
      fonte,
      ...attribution,
      note: `Fonte: ${fonte} | Livello: ${lead.level ?? "-"} | Test: ${lead.score ?? "-"}/${lead.total ?? "-"} | Qualità: ${lead.lead_quality ?? "-"} (${lead.lead_score ?? "-"}/100) | Obiettivo: ${lead.goal ?? "-"} | Tempistica: ${lead.timeline ?? "-"} | Contatto: ${lead.contact_preference ?? "-"} | Esito: ${lead.call_status ?? "-"} | Assegnato: ${lead.assigned_to ?? "-"}${lead.call_notes ? ` | Note: ${lead.call_notes}` : ""}`,
    });
    sent++;
  }

  return new Response(JSON.stringify({ success: true, sent, offset, limit }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});