import { act, fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListeningView, SpeakingView } from "@/components/test/QuestionTypes";
import type { ListeningQ, SpeakingQ } from "@/data/questions";
import { ServiceFailure } from "@/lib/service-errors";

const mocks = vi.hoisted(() => ({ load: vi.fn(), invoke: vi.fn() }));
vi.mock("@/lib/test-audio", () => ({ loadTestAudio: mocks.load }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
const listening: ListeningQ = { id: 3, type: "listening", level: "A1", category: "Listening", skill: "Listening", audioText: "Hello from London", prompt: "Where?", options: ["London", "Paris"], correct: 0 };
const speaking: SpeakingQ = { id: 4, type: "speaking", level: "A1", category: "Speaking", skill: "Speaking", prompt: "Introduce yourself", targetPhrase: "My name is Alex" };
let audio: FakeAudio;
class FakeAudio {
  src = ""; preload = ""; paused = true; currentTime = 0;
  onplaying: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() { audio = this; }
  play = vi.fn(async () => { this.paused = false; this.onplaying?.(); });
  pause = vi.fn(() => { this.paused = true; this.onpause?.(); });
  load = vi.fn();
  removeAttribute() { this.src = ""; }
}
let recorder: FakeRecorder;
class FakeRecorder {
  static isTypeSupported(type: string) { return type === "audio/mp4"; }
  mimeType = "audio/mp4"; state = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(_stream: unknown, options?: { mimeType: string }) { recorder = this; expect(options?.mimeType).toBe("audio/mp4"); }
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["real-recording-fixture"], { type: this.mimeType }) }); this.onstop?.(); }
}
beforeEach(() => {
  mocks.load.mockResolvedValue("blob:test-audio");
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("MediaRecorder", FakeRecorder);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("Mobile audio lifecycle", () => {
  it("blocks audio retries after a permanent credit failure while retaining text access", async () => {
    mocks.load.mockRejectedValue(new ServiceFailure("Not enough credits. Top up credits.", 402, false));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reveal = vi.fn();
    render(<ListeningView q={listening} selected={null} onSelect={() => {}} locked={false} onTextReveal={reveal} />);
    await screen.findByText("Not enough credits. Top up credits.");
    expect(screen.getByRole("button", { name: "Riproduci audio" })).toBeDisabled();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Mostra il testo/ }));
    expect(reveal).toHaveBeenCalledTimes(1);
  });
  it("stops voice retries after 402 and keeps the written answer available", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] })) } });
    mocks.invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify({ details: JSON.stringify({ message: "Not enough credits. Top up credits." }) }), { status: 402 }) } });
    render(<SpeakingView q={speaking} transcript="" onChange={() => {}} onSubmit={() => {}} locked={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Registra risposta" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ferma registrazione" }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Scrivi la risposta invece" })).toBeEnabled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Registra risposta" })).toBeDisabled());
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Scrivi la risposta invece" }));
    expect(screen.getByRole("textbox", { name: "Risposta scritta" })).toBeEnabled();
  });
  it("prepares without autoplay and plays synchronously on the user's tap", async () => {
    render(<ListeningView q={listening} selected={null} onSelect={() => {}} locked={false} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Riproduci audio" })).toBeEnabled());
    expect(audio.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Riproduci audio" }));
    expect(audio.play).toHaveBeenCalledTimes(1);
    await screen.findByRole("button", { name: "Ferma audio" });
    fireEvent.click(screen.getByRole("button", { name: "Ferma audio" }));
    expect(audio.paused).toBe(true);
  });
  it("does not turn Listening into Reading when autoplay or preparation fails", async () => {
    mocks.load.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reveal = vi.fn();
    render(<ListeningView q={listening} selected={null} onSelect={() => {}} locked={false} onTextReveal={reveal} />);
    await screen.findByText("Audio non disponibile. Tocca per riprovare.");
    expect(reveal).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Mostra il testo/ }));
    expect(reveal).toHaveBeenCalledTimes(1);
  });
  it("ignores late preparation when the question is removed", async () => {
    let resolve: (url: string) => void = () => {};
    mocks.load.mockReturnValue(new Promise<string>((done) => { resolve = done; }));
    const view = render(<ListeningView q={listening} selected={null} onSelect={() => {}} locked={false} />);
    view.unmount();
    await act(async () => resolve("blob:late"));
    expect(audio.src).toBe("");
    expect(audio.play).not.toHaveBeenCalled();
  });
  it("records Safari MP4 and sends the actual format for transcription", async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] })) } });
    mocks.invoke.mockResolvedValue({ data: { text: "My name is Alex" }, error: null });
    const change = vi.fn();
    render(<SpeakingView q={speaking} transcript="" onChange={change} onSubmit={() => {}} locked={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Registra risposta" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ferma registrazione" }));
    await waitFor(() => expect(change).toHaveBeenCalledWith("My name is Alex"));
    expect(mocks.invoke).toHaveBeenCalledWith("transcribe-audio", { body: { audio: expect.any(String), mimeType: "audio/mp4" } });
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
  it("releases microphone on exit without submitting a recording", async () => {
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] })) } });
    const view = render(<SpeakingView q={speaking} transcript="" onChange={() => {}} onSubmit={() => {}} locked={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Registra risposta" }));
    await screen.findByRole("button", { name: "Ferma registrazione" });
    view.unmount();
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(recorder.state).toBe("inactive");
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("recovers from denied permission without leaving controls busy", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(async () => { throw new DOMException("Denied", "NotAllowedError"); }) } });
    render(<SpeakingView q={speaking} transcript="" onChange={() => {}} onSubmit={() => {}} locked={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Registra risposta" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Registra risposta" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Scrivi la risposta invece" })).toBeEnabled();
  });
});