const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MC_KEY = Deno.env.get("MAILCHIMP_API_KEY") ?? "";
const MC_DC = (Deno.env.get("MAILCHIMP_SERVER_PREFIX") || MC_KEY.split("-")[1] || "").trim();
const MC_LIST_ID = Deno.env.get("MAILCHIMP_DEFAULT_LIST_ID") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Internal-only: require service role key
  const auth = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!svc || auth !== svc) return json({ error: "Unauthorized" }, 401);

  if (!MC_KEY || !MC_DC) return json({ skipped: true, reason: "mailchimp_not_configured" });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const listId = body.listId || MC_LIST_ID;
  if (!listId) return json({ skipped: true, reason: "no_list_id" });

  const email = String(body.email || "").toLowerCase();
  if (!email) return json({ error: "email required" }, 400);

  const [first, ...rest] = String(body.name || "").trim().split(/\s+/);
  const tags: string[] = [];
  if (body.level) tags.push(`CEFR:${body.level}`);
  tags.push(body.completed ? "test_completato" : "test_non_completato");
  if (body.utm_source) tags.push(`src:${body.utm_source}`);

  // Subscriber hash = md5 lowercase email
  const { default: md5 } = await import("https://esm.sh/js-md5@0.8.3");
  const hash = md5(email);

  const baseUrl = `https://${MC_DC}.api.mailchimp.com/3.0`;
  const headers = {
    Authorization: `Basic ${btoa(`anystring:${MC_KEY}`)}`,
    "Content-Type": "application/json",
  };

  const upsert = await fetch(`${baseUrl}/lists/${listId}/members/${hash}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: first || "",
        LNAME: rest.join(" "),
        PHONE: body.phone || "",
        LEVEL: body.level || "",
        SCORE: body.score ?? "",
      },
    }),
  });
  if (!upsert.ok) {
    const t = await upsert.text();
    console.error("mailchimp upsert failed", upsert.status, t);
    return json({ error: "upsert_failed", status: upsert.status }, 500);
  }

  if (tags.length > 0) {
    await fetch(`${baseUrl}/lists/${listId}/members/${hash}/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tags: tags.map((name) => ({ name, status: "active" })) }),
    }).catch((e) => console.error("tag error", e));
  }

  return json({ ok: true });
});