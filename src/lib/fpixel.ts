declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      identify?: (data: Record<string, string>) => void;
    };
  }
}

export const fbqTrack = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
};

export const ttqTrack = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined" || !window.ttq) return;
  if (params) window.ttq.track(event, params);
  else window.ttq.track(event);
};

export {};

const sha256Hex = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

/** Advanced matching: sends SHA-256 hashed email/phone to TikTok before tracking events. */
export const ttqIdentify = async (email?: string, phone?: string) => {
  if (typeof window === "undefined" || !window.ttq?.identify) return;
  if (!crypto?.subtle) return;
  try {
    const payload: Record<string, string> = {};
    if (email) payload.email = await sha256Hex(email.trim().toLowerCase());
    if (phone) payload.phone_number = await sha256Hex(phone.replace(/[^\d+]/g, ""));
    if (Object.keys(payload).length) window.ttq.identify(payload);
  } catch (e) {
    console.error("ttq.identify failed", e);
  }
};