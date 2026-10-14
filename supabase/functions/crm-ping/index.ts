// Temporanea: reinvia al CRM i lead entrati da una certa data (con notifiche CRM attive).
import { createClient } from "npm:@supabase/supabase-js@2";
import { deriveSource } from "../_shared/crm-sync.ts";

const CRM = "https://leads.englishinfinity.io/api/public/ingest-lead";

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const since = String(body.since ?? "");
  const dryRun = body.dryRun === true;
  if (!/^\d{4}-\d{2}-\d{2}/.test(since)) return new Response("bad since", { status: 400 });

  const secret = Deno.env.get("CRM_INGEST_SECRET") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: leads, error } = await sb.from("leads").select("*").gte("created_at", since).order("created_at");
  if (error) return new Response(error.message, { status: 500 });
  if (dryRun) return Response.json({ count: leads.length });

  const results: Record<string, number> = {};
  const failures: string[] = [];
  for (const l of leads) {
    const attribution = {
      utm_source: l.utm_source, utm_medium: l.utm_medium, utm_campaign: l.utm_campaign,
      utm_content: l.utm_content, utm_term: l.utm_term, referrer: l.referrer, landing_url: l.landing_url,
    };
    const fonte = deriveSource(attribution);
    const res = await fetch(CRM, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-crm-ingest-secret": secret },
      body: JSON.stringify({
        nome: l.name, email: l.email, telefono: l.phone, obiettivo: l.goal, tempistica: l.timeline,
        eta: l.eta, occupazione: l.occupazione, contatto: l.contact_preference, qualita: l.lead_quality,
        score: l.lead_score, livello: l.level, test_score: l.score, test_total: l.total,
        completato: l.completed, phone_verified: l.phone_verified ?? false,
        lista: "test-englishinfinity", data_ingresso: l.created_at, fonte, ...attribution,
        note: `Fonte: ${fonte} | Livello: ${l.level ?? "-"} | Test: ${l.score ?? "-"}/${l.total ?? "-"} | Qualità: ${l.lead_quality ?? "-"} (${l.lead_score ?? "-"}/100)`,
      }),
    });
    results[res.status] = (results[res.status] ?? 0) + 1;
    if (!res.ok) failures.push(`${l.email}: ${res.status} ${(await res.text()).slice(0, 150)}`);
    else await res.text();
  }
  return Response.json({ total: leads.length, results, failures: failures.slice(0, 20) });
});
