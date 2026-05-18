import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

const BodySchema = z.object({
  leadId: z.string().uuid(),
  startISO: z.string().min(10),
  durationMinutes: z.number().int().min(15).max(240),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
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

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
  if (!LOVABLE_API_KEY || !GOOGLE_CALENDAR_API_KEY) {
    return json({ error: "Google Calendar non configurato" }, 500);
  }

  // Verify caller is an authenticated admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Non autenticato" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    return json({ error: "Permessi insufficienti" }, 403);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, 400);
  }
  const { leadId, startISO, durationMinutes, title, description } = parsed.data;

  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return json({ error: "Data non valida" }, 400);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  // Fetch lead
  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .select("id,name,email,phone,level")
    .eq("id", leadId)
    .single();
  if (leadErr || !lead) return json({ error: "Lead non trovato" }, 404);

  const eventTitle = title?.trim() || `Call EnglishInfinity · ${lead.name}`;
  const eventDescription = [
    description?.trim(),
    "",
    `Lead: ${lead.name}`,
    `Email: ${lead.email}`,
    `Telefono: ${lead.phone}`,
    lead.level ? `Livello test: ${lead.level}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const eventBody = {
    summary: eventTitle,
    description: eventDescription,
    start: { dateTime: start.toISOString(), timeZone: "Europe/Rome" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Rome" },
    attendees: [{ email: lead.email, displayName: lead.name }],
    reminders: { useDefault: true },
    conferenceData: {
      createRequest: {
        requestId: `meet-${lead.id}-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const url =
    `${GATEWAY_URL}/calendars/primary/events` +
    `?sendUpdates=all&conferenceDataVersion=1`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Google Calendar error", resp.status, data);
    return json(
      { error: `Errore Google Calendar [${resp.status}]: ${data?.error?.message ?? "sconosciuto"}` },
      500,
    );
  }

  return json({
    success: true,
    eventId: data.id,
    htmlLink: data.htmlLink,
    meetLink: data.hangoutLink ?? null,
  });
});