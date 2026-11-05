export interface AdsAttribution {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  ts: number;
}

const CLICK_ID_PATTERN = /^[A-Za-z0-9_\-.~]{10,255}$/;
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function validAdsClickIds(value: unknown, now = Date.now()): Partial<Record<typeof CLICK_ID_KEYS[number], string>> {
  if (!value || typeof value !== "object") return {};
  const stored = value as Record<string, unknown>;
  if (typeof stored.ts !== "number" || !Number.isFinite(stored.ts) || now < stored.ts || now - stored.ts >= MAX_AGE_MS) return {};
  const ids: Partial<Record<typeof CLICK_ID_KEYS[number], string>> = {};
  for (const key of CLICK_ID_KEYS) {
    const id = stored[key];
    if (typeof id === "string" && CLICK_ID_PATTERN.test(id)) ids[key] = id;
  }
  return ids;
}

export function captureAdsAttribution(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const ids: Partial<Record<typeof CLICK_ID_KEYS[number], string>> = {};
    for (const key of CLICK_ID_KEYS) {
      const id = params.get(key);
      if (id && CLICK_ID_PATTERN.test(id)) ids[key] = id;
    }
    // A visit without a valid click ID must not erase previous attribution.
    if (Object.keys(ids).length) {
      window.localStorage.setItem("adsAttribution", JSON.stringify({ ...ids, ts: Date.now() }));
    }
  } catch {
    // Storage may be unavailable in private or restricted browsers.
  }
}

export function readAdsAttribution(): AdsAttribution | undefined {
  try {
    const raw = window.localStorage.getItem("adsAttribution");
    if (!raw) return undefined;
    const stored = JSON.parse(raw);
    const ids = validAdsClickIds(stored);
    return Object.keys(ids).length ? { ...ids, ts: stored.ts } : undefined;
  } catch {
    return undefined;
  }
}