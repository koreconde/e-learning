import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneVerifyDialog } from "@/components/landing/PhoneVerifyDialog";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Phone verification channel recovery", () => {
  it("reads a rejected WhatsApp response and sends SMS only on explicit request", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "Numero non raggiungibile su WhatsApp. Prova via SMS o controlla il numero." }), { status: 400 }) } });
    mocks.invoke.mockResolvedValueOnce({ data: { success: true, verificationId: "sms-id" }, error: null });
    render(<PhoneVerifyDialog open phone="+393401234567" onOpenChange={() => {}} onVerified={() => {}} />);
    await screen.findByText("Numero non raggiungibile su WhatsApp. Prova via SMS o controlla il numero.");
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Invia via SMS" }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenLastCalledWith("phone-verify-start", { body: { phone: "+393401234567", channel: "sms" } }));
  });
});