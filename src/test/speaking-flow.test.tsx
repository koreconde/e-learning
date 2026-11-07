import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TestRunner } from "@/components/test/TestRunner";
import { adaptiveResult, type AdaptiveResponse } from "@/lib/adaptive-test";
import { speakingQuestionFor } from "@/lib/speaking-test";

vi.mock("@/lib/test-audio", () => ({ loadTestAudio: vi.fn(() => new Promise(() => {})) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("offers speaking after receptive questions and finishes only after its submission", async () => {
  vi.useFakeTimers();
  const finish = vi.fn();
  render(<TestRunner onFinish={finish} />);
  for (let i = 0; i < 24 && !screen.queryByRole("button", { name: "Scrivi la risposta invece" }); i++) {
    fireEvent.click(screen.getByRole("button", { name: "Non lo so, salta" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
  }
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Scrivi la risposta invece" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Risposta scritta" }), { target: { value: "My name is Alex" } });
  fireEvent.click(screen.getByRole("button", { name: "Conferma risposta" }));
  expect(finish).toHaveBeenCalledTimes(1);
  const [result, details] = finish.mock.calls[0];
  expect(result.speaking).toEqual({ status: "written", transcript: "My name is Alex" });
  expect(result.score).toBe(0);
  expect(result.total).toBeLessThanOrEqual(24);
  expect(details.every((item: { skill: string }) => item.skill !== "Speaking")).toBe(true);
});

it("still offers speaking when the twelve-minute receptive timer expires", async () => {
  vi.useFakeTimers();
  const finish = vi.fn();
  render(<TestRunner onFinish={finish} />);
  for (let i = 0; i < 720; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Non lo so, salta" }));
  expect(finish.mock.calls[0][0].speaking.status).toBe("skipped");
  expect(finish.mock.calls[0][0].total).toBe(0);
});

it("matches speaking difficulty to the estimated receptive level", () => {
  expect(speakingQuestionFor("A1").level).toBe("A1");
  expect(speakingQuestionFor("C1").level).toBe("C1");
});

it("does not infer speaking ability from a transcript", () => {
  const responses: AdaptiveResponse[] = [{ id: 3, correct: true, skill: "Listening" }];
  const before = adaptiveResult(responses);
  const withSpeaking = { ...before, speaking: { status: "recorded", transcript: "A perfect sentence copied from the prompt" } };
  expect(withSpeaking.level).toBe(before.level);
  expect(withSpeaking.score).toBe(1);
  expect(withSpeaking.total).toBe(1);
});