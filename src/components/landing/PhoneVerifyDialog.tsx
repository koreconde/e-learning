import { useEffect, useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { functionFailure } from "@/lib/service-errors";

interface PhoneVerifyDialogProps {
  open: boolean;
  phone: string;
  onOpenChange: (open: boolean) => void;
  onVerified: (verificationToken: string) => void;
}

export const PhoneVerifyDialog = ({
  open,
  phone,
  onOpenChange,
  onVerified,
}: PhoneVerifyDialogProps) => {
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sentChannel, setSentChannel] = useState<"whatsapp" | "sms" | null>(null);
  const [serviceBlocked, setServiceBlocked] = useState(false);

  useEffect(() => {
    if (!open) {
      setVerificationId(null);
      setCode("");
      setError(null);
      setCooldown(0);
      setSentChannel(null);
      setServiceBlocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (channel: "whatsapp" | "sms" = "whatsapp") => {
    if (serviceBlocked) return;
    setSending(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("phone-verify-start", {
        body: { phone, channel },
      });
      if (fnError || !data?.success) {
        const failure = await functionFailure(fnError, "Impossibile inviare il codice. Riprova.");
        setError((data?.error as string) || failure.message);
        setServiceBlocked(data?.props?.retryable === false || (failure.status === 503 && !failure.retryable));
        return;
      }
      setVerificationId(data.verificationId as string);
      setSentChannel(channel);
      setCooldown(45);
    } catch {
      setError("Errore di rete. Riprova tra qualche istante.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (open && !verificationId && !sending) void sendCode("whatsapp");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitCode = async () => {
    if (serviceBlocked || !verificationId || code.trim().length < 4) return;
    setChecking(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("phone-verify-check", {
        body: { verificationId, code: code.trim() },
      });
      if (fnError || !data?.success) {
        const failure = await functionFailure(fnError, "Codice errato. Riprova.");
        setError((data?.error as string) || failure.message);
        setServiceBlocked(data?.props?.retryable === false || (failure.status === 503 && !failure.retryable));
        return;
      }
      onVerified(data.verificationToken as string);
    } catch {
      setError("Errore di rete. Riprova tra qualche istante.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-accent" />
            Verifica il tuo numero
          </DialogTitle>
          <DialogDescription>
            {sentChannel ? `Codice a 6 cifre inviato ${sentChannel === "sms" ? "via SMS" : "su WhatsApp"} al numero ` : "Verifica il numero "}
            <span className="font-medium text-foreground">{phone}</span>.
            {sentChannel && " Inseriscilo qui sotto per accedere al test."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCode();
            }}
            className="h-14 rounded-xl text-center text-2xl tracking-[0.5em]"
          />

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button
            type="button"
            onClick={submitCode}
            disabled={serviceBlocked || !verificationId || checking || sending || code.length < 4}
            className="h-12 w-full rounded-full"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma codice"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Button variant="link"
              type="button"
              onClick={() => sendCode("whatsapp")}
              disabled={serviceBlocked || sending || cooldown > 0}
              className="text-muted-foreground underline underline-offset-4 disabled:opacity-50"
            >
              {cooldown > 0 ? `Rinvia tra ${cooldown}s` : "Rinvia su WhatsApp"}
            </Button>
            <Button variant="link"
              type="button"
              onClick={() => sendCode("sms")}
              disabled={serviceBlocked || sending || cooldown > 0}
              className="text-muted-foreground underline underline-offset-4 disabled:opacity-50"
            >
              Invia via SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
