import { describe, expect, it } from "vitest";
import { readServiceFailure } from "@/lib/service-errors";

describe("Permanent service failures", () => {
  it.each([402, 403])("does not offer repeated requests for status %i", async (status) => {
    const failure = await readServiceFailure(new Response(JSON.stringify({ details: JSON.stringify({ message: "Not enough credits. Top up credits.", props: { retryable: false } }) }), { status }), "Unavailable");
    expect(failure.status).toBe(status);
    expect(failure.retryable).toBe(false);
    expect(failure.message).toBe("Not enough credits. Top up credits.");
  });
  it("retains retry eligibility for a transient 503", async () => {
    const failure = await readServiceFailure(new Response("offline", { status: 503 }), "Unavailable");
    expect(failure.retryable).toBe(true);
  });
});