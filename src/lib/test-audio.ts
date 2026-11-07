const cache = new Map<string, Promise<string>>();

/** Fetch binary audio directly: functions.invoke decodes audio/mpeg as text. */
export function loadTestAudio(text: string): Promise<string> {
  const existing = cache.get(text);
  if (existing) return existing;
  const request = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text, voice: "nova" }),
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith("audio/")) throw new Error("Invalid audio response");
    const url = URL.createObjectURL(blob);
    // Bound retained object URLs in long-running tabs.
    if (cache.size > 32) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined && oldest !== text) {
        const previous = cache.get(oldest);
        cache.delete(oldest);
        void previous?.then(URL.revokeObjectURL).catch(() => {});
      }
    }
    return url;
  }).catch((error) => {
    cache.delete(text);
    throw error;
  });
  cache.set(text, request);
  return request;
}