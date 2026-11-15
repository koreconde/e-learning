export function phoneVerificationError(message: string, channel: "whatsapp" | "sms") {
  const outage = phoneServiceOutage(message);
  if (outage) return outage;
  if (/(?:60600|60200|60205|21211)/.test(message)) {
    return {
      status: 400,
      error: channel === "whatsapp"
        ? "Numero non raggiungibile su WhatsApp. Prova via SMS o controlla il numero."
        : "Numero non raggiungibile via SMS. Controlla il numero o prova un altro numero.",
    };
  }
  return { status: 502, error: "Impossibile inviare il codice. Riprova tra poco." };
}

/** Shared by sending, code checking and the daily monitor. Never expose raw provider details. */
export function phoneServiceOutage(message: string) {
  if (/\[(?:401|402|403)\]|\b(?:70051|20003|20005)\b|insufficient.*(?:credit|balance|fund)|credential_refresh_token_expired/i.test(message)) {
    return {
      status: 503,
      error: "Verifica telefonica temporaneamente non disponibile. WhatsApp e SMS sono sospesi: riprova più tardi.",
      props: { retryable: false },
    };
  }
  return null;
}

export function requirePositiveTwilioBalance(balance: unknown) {
  const amount = typeof balance === "string" && balance.trim() !== "" ? Number(balance) : NaN;
  if (!Number.isFinite(amount)) throw new Error("Saldo Twilio non verificabile.");
  if (amount <= 0) throw new Error("Credito Twilio esaurito: ricaricare l’account Twilio.");
}