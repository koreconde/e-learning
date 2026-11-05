import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureAdsAttribution, readAdsAttribution, validAdsClickIds } from "@/lib/ads-attribution";
import { sendLeadToEscapeVision } from "@/lib/escapevision";

const now = 1793903220000;
const day = 24 * 60 * 60 * 1000;
const lead = { name: "Test Person", email: "test@example.com", phone: "+393401234567" };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Google click attribution", () => {
  it("captures only matching IDs with the current timestamp", () => {
    window.history.replaceState({}, "", "/?gclid=Abc_12345-.~&gbraid=too-short&wbraid=0123456789");
    captureAdsAttribution();
    expect(JSON.parse(localStorage.getItem("adsAttribution") ?? "{}")).toEqual({ gclid: "Abc_12345-.~", wbraid: "0123456789", ts: now });
  });
  it("accepts lengths 10 through 255 and rejects invalid characters", () => {
    expect(validAdsClickIds({ ts: now, gclid: "a".repeat(10), gbraid: "b".repeat(255), wbraid: "invalid/value" })).toEqual({ gclid: "a".repeat(10), gbraid: "b".repeat(255) });
    expect(validAdsClickIds({ ts: now, gclid: "a".repeat(9), gbraid: "b".repeat(256) })).toEqual({});
  });
  it("excludes attribution at exactly 90 days old", () => {
    expect(validAdsClickIds({ ts: now - 90 * day, gclid: "0123456789" })).toEqual({});
    expect(validAdsClickIds({ ts: now - 90 * day + 1, gclid: "0123456789" })).toEqual({ gclid: "0123456789" });
  });
  it("does not refresh or erase attribution on a direct visit", () => {
    localStorage.setItem("adsAttribution", JSON.stringify({ ts: now - day, gclid: "0123456789" }));
    captureAdsAttribution();
    expect(readAdsAttribution()).toEqual({ ts: now - day, gclid: "0123456789" });
  });
  it("ignores corrupt storage and future timestamps", () => {
    localStorage.setItem("adsAttribution", "broken json");
    expect(readAdsAttribution()).toBeUndefined();
    expect(validAdsClickIds({ ts: now + 1, gclid: "0123456789" })).toEqual({});
  });
  it("does not throw when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    window.history.replaceState({}, "", "/?gclid=0123456789");
    expect(() => captureAdsAttribution()).not.toThrow();
    expect(readAdsAttribution()).toBeUndefined();
  });
});

describe("EscapeVision delivery", () => {
  it("sends a single JSON POST with keepalive, strings and no auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendLeadToEscapeVision({ ...lead, adsAttribution: { ts: now, gclid: "0123456789" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://www.condedaw.com/EscapeVision-PHP/api/potentials/acquire-lead.php");
    expect(options).toMatchObject({ method: "POST", keepalive: true, headers: { "Content-Type": "application/json" } });
    const body = JSON.parse(options.body);
    expect(body).toEqual({ ...lead, branch: "2", note: "English Infinity test - level: ", language: "0", type: "0", source: "8", referrer: "ENGLISH INFINITY LUCIA", google_user_id: "", gclid: "0123456789" });
    expect(Object.values(body).every(value => typeof value === "string")).toBe(true);
  });
  it("includes an available level and omits expired click IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendLeadToEscapeVision({ ...lead, level: "B2", adsAttribution: { ts: now - 90 * day, gclid: "0123456789" } });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.note).toBe("English Infinity test - level: B2");
    expect(body).not.toHaveProperty("gclid");
  });
  it("logs network failure without rejection or retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendLeadToEscapeVision(lead)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledOnce();
  });
  it("logs an unsuccessful HTTP response without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await sendLeadToEscapeVision(lead);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith("EscapeVision lead delivery failed", 500);
  });
  it("dispatches immediately without waiting for the response", async () => {
    let resolve: ((value: { ok: boolean }) => void) | undefined;
    const fetchMock = vi.fn(() => new Promise<{ ok: boolean }>(r => { resolve = r; }));
    vi.stubGlobal("fetch", fetchMock);
    const pending = sendLeadToEscapeVision(lead);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve?.({ ok: true });
    await pending;
  });
});