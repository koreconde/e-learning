declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const fbqTrack = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
};

export {};