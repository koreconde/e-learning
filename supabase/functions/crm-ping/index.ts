// Temporanea: verifica se il segreto CRM viene accettato (payload vuoto, non crea nulla).
Deno.serve(async () => {
  const secret = Deno.env.get("CRM_INGEST_SECRET") ?? "";
  const res = await fetch("https://leads.englishinfinity.io/api/public/ingest-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-crm-ingest-secret": secret },
    body: JSON.stringify({}),
  });
  return new Response(JSON.stringify({ status: res.status, body: (await res.text()).slice(0, 300), secretLen: secret.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
