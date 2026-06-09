import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createHmac, timingSafeEqual } from "node:crypto";

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
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
    const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
    const rawBody = await req.text();

    if (!appSecret) {
      console.error("WHATSAPP_APP_SECRET not set — rejecting unverified webhook");
      return new Response("Forbidden", { status: 403 });
    }

    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const a = new TextEncoder().encode(sigHeader);
    const b = new TextEncoder().encode(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      console.warn("WhatsApp webhook signature mismatch");
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const body = JSON.parse(rawBody);
      console.log("WhatsApp webhook event:", JSON.stringify(body));
    } catch (e) {
      console.error("Invalid JSON from WhatsApp webhook", e);
    }
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});