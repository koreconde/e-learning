// Sincronizzazione lead verso il CRM esterno (progetto Lovable "Lead Connect CRM").
// Non deve MAI bloccare o far fallire il flusso della landing.

const CRM_INGEST_URL = "https://leads.englishinfinity.io/api/public/ingest-lead";

export interface CrmLeadPayload {
  nome: string;
  email: string;
  telefono: string | null;
  obiettivo?: string | null;
  tempistica?: string | null;
  eta?: string | null;
  occupazione?: string | null;
  contatto?: string | null;
  qualita?: string | null;
  score?: number | null;
  livello?: string | null;
  test_score?: number | null;
  test_total?: number | null;
  completato?: boolean;
  lista?: string | null;
  data_ingresso?: string | null;
  // Attribuzione / sorgente
  fonte?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
  note?: string | null;
}

/** Deriva la fonte leggibile (Facebook/IG, TikTok, Google, Altro, Diretto). */
export function deriveSource(a: {
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
  landing_url?: string | null;
}): string {
  const s = (a.utm_source ?? "").toLowerCase();
  const m = (a.utm_medium ?? "").toLowerCase();
  const ref = (a.referrer ?? "").toLowerCase();
  const url = (a.landing_url ?? "").toLowerCase();
  const blob = `${s} ${m} ${ref} ${url}`;

  if (/fbclid|facebook|instagram|\big\b|\bfb\b|meta/.test(blob)) return "Facebook/IG";
  if (/ttclid|tiktok|\bttq\b/.test(blob)) return "TikTok";
  if (/li_fat_id|linkedin|\blnkd\b/.test(blob)) return "LinkedIn";
  if (/google|gclid|\bads\b|adwords/.test(blob)) return "Google";
  if (s || m || ref) return "Altro";
  return "Diretto";
}

export async function syncLeadToCrm(payload: CrmLeadPayload): Promise<void> {
  const secret = Deno.env.get("CRM_INGEST_SECRET");
  if (!secret) {
    console.warn("CRM sync skipped: missing CRM_INGEST_SECRET");
    return;
  }
  try {
    const res = await fetch(CRM_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crm-ingest-secret": secret,
      },
      body: JSON.stringify({
        ...payload,
        lista: payload.lista ?? "test-englishinfinity",
        data_ingresso: payload.data_ingresso ?? new Date().toISOString(),
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("CRM sync failed", res.status, text.slice(0, 500));
    } else {
      console.log("CRM sync ok", payload.email);
    }
  } catch (e) {
    console.error("CRM sync exception", e);
  }
}