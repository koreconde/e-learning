import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } },
        );
        const data = await res.json();
        if (data.valid) setState({ kind: "valid" });
        else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "error", message: "Errore di connessione" });
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState({ kind: "done" });
      else setState({ kind: "error", message: data.error ?? "Errore" });
    } catch {
      setState({ kind: "error", message: "Errore di connessione" });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <h1 className="font-display text-2xl font-bold text-foreground">Disiscrizione email</h1>
        <div className="mt-6 text-foreground">
          {state.kind === "loading" && <p className="text-muted-foreground">Verifica in corso…</p>}
          {state.kind === "invalid" && (
            <p className="text-destructive">Link non valido o scaduto.</p>
          )}
          {state.kind === "already" && (
            <p className="text-muted-foreground">Sei già stato disiscritto. Non riceverai altre email.</p>
          )}
          {state.kind === "valid" && (
            <>
              <p className="text-muted-foreground">
                Sei sicuro di voler disiscriverti dalle email di Escape Campus?
              </p>
              <button
                onClick={confirm}
                className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Conferma disiscrizione
              </button>
            </>
          )}
          {state.kind === "submitting" && <p className="text-muted-foreground">Elaborazione…</p>}
          {state.kind === "done" && (
            <p className="text-success">Fatto. Sei stato disiscritto correttamente.</p>
          )}
          {state.kind === "error" && <p className="text-destructive">{state.message}</p>}
        </div>
      </div>
    </main>
  );
};

export default Unsubscribe;