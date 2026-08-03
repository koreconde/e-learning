// Sincronizzazione lead verso il CRM esterno (progetto Lovable "Lead Connect CRM").
// Non deve MAI bloccare o far fallire il flusso della landing.

const CRM_INGEST_URL = "https://xagdqzlbsltypdwftntb.supabase.co/functions/v1/ingest-lead";

export interface CrmLeadPayload {
  nome: string;
  email: string;
  telefono: string | null;
  obiettivo?: string | null;
  tempistica?: string | null;
  contatto?: string | null;
  qualita?: string | null;
  score?: number | null;
  livello?: string | null;
  test_score?: number | null;
  completato?: boolean;
  lista?: string | null;
  data_ingresso?: string | null;
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
      body: JSON.stringify({ ...payload, lista: payload.lista ?? "test-englishinfinity" }),
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