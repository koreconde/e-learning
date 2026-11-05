import { validAdsClickIds, type AdsAttribution } from "./ads-attribution.ts";

interface EscapeVisionLead {
  name: string;
  email: string;
  /** Already normalized and validated by submit-lead. */
  phone: string;
  level?: string | null;
  adsAttribution?: AdsAttribution;
}

export async function sendLeadToEscapeVision(lead: EscapeVisionLead): Promise<void> {
  try {
    const response = await fetch("https://www.condedaw.com/EscapeVision-PHP/api/potentials/acquire-lead.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        branch: "2",
        note: `English Infinity test - level: ${lead.level ?? ""}`,
        language: "0",
        type: "0",
        source: "8",
        referrer: "ENGLISH INFINITY LUCIA",
        google_user_id: "",
        ...validAdsClickIds(lead.adsAttribution),
      }),
    });
    if (!response.ok) console.error("EscapeVision lead delivery failed", response.status);
  } catch (error) {
    console.error("EscapeVision lead delivery failed", error);
  }
}