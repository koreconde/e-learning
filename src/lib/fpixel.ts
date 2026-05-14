declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void; page: () => void };
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