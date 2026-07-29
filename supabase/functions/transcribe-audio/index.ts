const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { audio, mimeType } = await req.json();
    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "Missing audio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // base64 -> bytes (chunked to avoid stack overflow on large inputs)
    const binary = atob(audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Audio too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const type = typeof mimeType === "string" && mimeType ? mimeType : "audio/webm";
    const ext = type.includes("mp4") || type.includes("m4a")
      ? "mp4"
      : type.includes("mpeg") ? "mp3" : type.includes("wav") ? "wav" : "webm";

    const form = new FormData();
    form.append("file", new Blob([bytes], { type }), `audio.${ext}`);
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("language", "en");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Lovable-API-Key": key },
      body: form,
    });

    const bodyText = await res.text();
    if (!res.ok) {
      console.error(`Transcription failed [${res.status}]: ${bodyText}`);
      return new Response(
        JSON.stringify({ error: "Transcription failed", status: res.status, details: bodyText }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let text = "";
    try {
      text = JSON.parse(bodyText)?.text ?? "";
    } catch {
      text = bodyText;
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe-audio error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
