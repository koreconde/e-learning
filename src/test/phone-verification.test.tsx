import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneVerifyDialog } from "@/components/landing/PhoneVerifyDialog";
import { phoneVerificationError, phoneServiceOutage, requirePositiveTwilioBalance } from "../../supabase/functions/_shared/phone-verification-error";
import { PHONE_VERIFICATION_ENABLED, requiresPhoneVerification } from "@/lib/phone-verification-policy";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Phone verification channel recovery", () => {
  it("requires phone verification again even when a visitor omits the token", () => {
    expect(PHONE_VERIFICATION_ENABLED).toBe(true);
    expect(requiresPhoneVerification("")).toBe(true);
  });
  it("classifies Twilio 60600 as an unsupported destination for either channel", () => {
    expect(phoneVerificationError('[400]: {"code":60600}', "whatsapp").status).toBe(400);
    expect(phoneVerificationError('[400]: {"code":60600}', "sms").status).toBe(400);
    expect(phoneVerificationError('[401]: {"code":70051}', "whatsapp").status).toBe(503);
  });
  it("reads a rejected WhatsApp response and sends SMS only on explicit request", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: "Numero non raggiungibile su WhatsApp. Prova via SMS o controlla il numero." }), { status: 400 }) } });
    mocks.invoke.mockResolvedValueOnce({ data: { success: true, verificationId: "sms-id" }, error: null });
    render(<PhoneVerifyDialog open phone="+393401234567" onOpenChange={() => {}} onVerified={() => {}} />);
    await screen.findByText("Numero non raggiungibile su WhatsApp. Prova via SMS o controlla il numero.");
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Invia via SMS" }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenLastCalledWith("phone-verify-start", { body: { phone: "+393401234567", channel: "sms" } }));
  });
  it.each(["whatsapp", "sms"] as const)("blocks both channels after a funding outage in %s", async (channel) => {
    const outage = phoneVerificationError('[402]: {"message":"Insufficient balance"}', channel);
    mocks.invoke.mockResolvedValue({ data: null, error: { context: new Response(JSON.stringify(outage), { status: 503 }) } });
    render(<PhoneVerifyDialog open phone="+393401234567" onOpenChange={() => {}} onVerified={() => {}} />);
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Invia via SMS" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rinvia su WhatsApp" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Invia via SMS" }));
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
  });
  it("distinguishes a provider outage from an invalid submitted code", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { success: true, verificationId: "id" }, error: null });
    const outage = phoneServiceOutage('[401]: {"code":70051}');
    expect(outage?.props.retryable).toBe(false);
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify(outage), { status: 503 }) } });
    render(<PhoneVerifyDialog open phone="+393401234567" onOpenChange={() => {}} onVerified={() => {}} />);
    await screen.findByText(/Codice a 6 cifre inviato/);
    fireEvent.change(screen.getByPlaceholderText("123456"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Conferma codice" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Conferma codice" })).toBeDisabled();
    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });
  it("does not classify a wrong code as a global outage", () => {
    expect(phoneServiceOutage('[400]: {"code":60202}')).toBeNull();
  });
  it("rejects exhausted or unknown balances but accepts a positive balance", () => {
    expect(() => requirePositiveTwilioBalance("0.00")).toThrow();
    expect(() => requirePositiveTwilioBalance("-1.00")).toThrow();
    expect(() => requirePositiveTwilioBalance(undefined)).toThrow();
    expect(() => requirePositiveTwilioBalance("1.00")).not.toThrow();
  });
});