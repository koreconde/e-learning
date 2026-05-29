import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MC_KEY = Deno.env.get("MAILCHIMP_API_KEY") ?? "";
const MC_DC = (Deno.env.get("MAILCHIMP_SERVER_PREFIX") || MC_KEY.split("-")[1] || "").trim();
const MC_BASE = MC_DC ? `https://${MC_DC}.api.mailchimp.com/3.0` : "";

async function mc(path: string, init: RequestInit = {}) {
  if (!MC_KEY || !MC_BASE) throw new Error("Mailchimp non configurato");
  const res = await fetch(`${MC_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`anystring:${MC_KEY}`)}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = (body && (body.detail || body.title)) || `Mailchimp error ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const action = String(body?.action || "");

  try {
    switch (action) {
      case "ping": {
        const r = await mc("/ping");
        return json({ ok: true, ping: r, dc: MC_DC });
      }
      case "audiences": {
        const r = await mc("/lists?count=50&fields=lists.id,lists.name,lists.stats.member_count,lists.date_created");
        return json({ audiences: r.lists || [] });
      }
      case "campaigns": {
        const r = await mc(
          "/campaigns?count=50&sort_field=create_time&sort_dir=DESC&fields=campaigns.id,campaigns.status,campaigns.create_time,campaigns.send_time,campaigns.emails_sent,campaigns.settings.subject_line,campaigns.settings.title,campaigns.settings.from_name,campaigns.settings.reply_to,campaigns.recipients.list_id,campaigns.recipients.list_name,campaigns.report_summary",
        );
        return json({ campaigns: r.campaigns || [] });
      }
      case "campaign_get": {
        const id = String(body.campaignId);
        const [c, content] = await Promise.all([
          mc(`/campaigns/${id}`),
          mc(`/campaigns/${id}/content`).catch(() => null),
        ]);
        return json({ campaign: c, content });
      }
      case "campaign_create": {
        const { listId, subject, fromName, replyTo, title, html, previewText } = body;
        if (!listId || !subject || !fromName || !replyTo || !html) {
          return json({ error: "Campi mancanti" }, 400);
        }
        const created = await mc(`/campaigns`, {
          method: "POST",
          body: JSON.stringify({
            type: "regular",
            recipients: { list_id: listId },
            settings: {
              subject_line: subject,
              preview_text: previewText || "",
              title: title || subject,
              from_name: fromName,
              reply_to: replyTo,
            },
          }),
        });
        await mc(`/campaigns/${created.id}/content`, {
          method: "PUT",
          body: JSON.stringify({ html }),
        });
        return json({ campaign: created });
      }
      case "campaign_send_test": {
        const { campaignId, emails } = body;
        if (!campaignId || !Array.isArray(emails) || emails.length === 0) {
          return json({ error: "campaignId ed email richiesti" }, 400);
        }
        await mc(`/campaigns/${campaignId}/actions/test`, {
          method: "POST",
          body: JSON.stringify({ test_emails: emails, send_type: "html" }),
        });
        return json({ ok: true });
      }
      case "campaign_send": {
        const { campaignId } = body;
        if (!campaignId) return json({ error: "campaignId richiesto" }, 400);
        await mc(`/campaigns/${campaignId}/actions/send`, { method: "POST" });
        return json({ ok: true });
      }
      case "campaign_delete": {
        const { campaignId } = body;
        if (!campaignId) return json({ error: "campaignId richiesto" }, 400);
        await mc(`/campaigns/${campaignId}`, { method: "DELETE" });
        return json({ ok: true });
      }
      case "sync_all_leads": {
        const { listId } = body;
        if (!listId) return json({ error: "listId richiesto" }, 400);
        const { data: leads, error } = await supabase
          .from("leads")
          .select("name,email,phone,level,score,total,utm_source,utm_campaign,completed,completed_at,created_at")
          .order("created_at", { ascending: false })
          .limit(1000);
        if (error) return json({ error: error.message }, 500);

        const members = (leads || []).map((l: any) => {
          const [first, ...rest] = (l.name || "").trim().split(/\s+/);
          const tags: string[] = [];
          if (l.level) tags.push(`CEFR:${l.level}`);
          if (l.completed) tags.push("test_completato"); else tags.push("test_non_completato");
          if (l.utm_source) tags.push(`src:${l.utm_source}`);
          return {
            email_address: String(l.email).toLowerCase(),
            status_if_new: "subscribed",
            status: "subscribed",
            merge_fields: {
              FNAME: first || "",
              LNAME: rest.join(" "),
              PHONE: l.phone || "",
              LEVEL: l.level || "",
              SCORE: l.score ?? "",
            },
            tags,
          };
        });

        // Mailchimp batch list members — chunks of 500
        let added = 0, updated = 0, errs = 0;
        for (let i = 0; i < members.length; i += 500) {
          const chunk = members.slice(i, i + 500);
          const r: any = await mc(`/lists/${listId}`, {
            method: "POST",
            body: JSON.stringify({ members: chunk, update_existing: true }),
          });
          added += r.total_created || 0;
          updated += r.total_updated || 0;
          errs += r.error_count || 0;
        }
        return json({ ok: true, total: members.length, added, updated, errors: errs });
      }
      default:
        return json({ error: "Azione non riconosciuta" }, 400);
    }
  } catch (e: any) {
    console.error("mailchimp-admin error", action, e?.message || e);
    return json({ error: e?.message || "Errore Mailchimp" }, 500);
  }
});