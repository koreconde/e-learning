import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // Meta verification handshake
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token && expected && token === expected) {
      console.log("WhatsApp webhook verified");
      return new Response(challenge ?? "", { status: 200 });
    }
    console.warn("WhatsApp webhook verification failed", { mode, tokenMatch: token === expected });
    return new Response("Forbidden", { status: 403 });
  }

  // Event delivery
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("WhatsApp webhook event:", JSON.stringify(body));
    } catch (e) {
      console.error("Invalid JSON from WhatsApp webhook", e);
    }
    // Meta requires a 200 quickly
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});