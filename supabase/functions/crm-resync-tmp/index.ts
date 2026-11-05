import { createClient } from "npm:@supabase/supabase-js@2";
import { syncLeadToCrm, deriveSource } from "../_shared/crm-sync.ts";

// Funzione temporanea: risincronizza i lead recenti verso il CRM.
// Protetta da token usa-e-getta passato come query param ?t=
const TOKEN = "rsync-9f3k2m8x4q1n6-tmp";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("t") !== TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      "name,email,phone,goal,timeline,lead_score,lead_quality,contact_preference,level,score,total,completed,created_at,call_status,call_notes,assigned_to,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,landing_url",
    )
    .gte("created_at", "2026-11-03T00:00:00Z")
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { email: string; ok: boolean; detail?: string }[] = [];
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
    try {
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
      results.push({ email: lead.email, ok: true });
    } catch (e) {
      results.push({ email: lead.email, ok: false, detail: String(e) });
    }
  }

  return new Response(JSON.stringify({ total: leads?.length ?? 0, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
