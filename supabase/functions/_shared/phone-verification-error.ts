export function phoneVerificationError(message: string, channel: "whatsapp" | "sms") {
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