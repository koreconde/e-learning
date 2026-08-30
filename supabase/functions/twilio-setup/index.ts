const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function headers() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": `${Deno.env.get("TWILIO_API_KEY")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function post(path: string, form: Record<string, string>) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: new URLSearchParams(form),
  });
  const text = await res.text();
  return { path, status: res.status, body: text.slice(0, 2000) };
}

Deno.serve(async () => {
  const out: unknown[] = [];

  const svc = await post("/messaging/v1/Services", {
    FriendlyName: "English Infinity Verify",
    UseInboundWebhookOnNumber: "true",
  });
  out.push(svc);
  let msgSid = "";
  try {
    msgSid = JSON.parse(svc.body).sid ?? "";
  } catch { /* ignore */ }

  if (msgSid) {
    out.push(
      await post(`/messaging/v1/Services/${msgSid}/ChannelSenders`, {
        Sid: "XE0635e14e84d3b080d7618463a42e5e1b",
      }),
    );
    out.push(
      await post("/verify/v2/Services/VA422639a8c5eb1f4341d1da210d64f693", {
        "Whatsapp.MsgServiceSid": msgSid,
        "Whatsapp.From": "+15559698467",
      }),
    );
  }

  return new Response(JSON.stringify({ msgSid, out }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
