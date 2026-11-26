import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Share2, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { CEFRLevel, Result } from "@/data/questions";
import { fbqTrack } from "@/lib/fpixel";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const CALENDLY_URL = "https://calendly.com/francescafilipp";
const WHATSAPP_NUMBER = "393770268033";

interface ResultPageProps {
  result: Result;
  name: string;
  email: string;
}

export const ResultPage = ({ result, name, email }: ResultPageProps) => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const shareText = encodeURIComponent(`Ho ottenuto il livello ${result.level} su Escape Campus! Prova anche tu il test gratuito.`);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
            Complimenti{name ? `, ${name.split(" ")[0]}` : ""}
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground md:text-6xl">
            Il tuo livello indicativo
          </h1>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 90 }}
            className="relative mx-auto mt-8 inline-flex"
          >
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-accent opacity-50 blur-3xl" />
            <div className="rounded-[2rem] bg-accent px-14 py-10 shadow-yellow">
              <div className="font-display text-7xl font-black tracking-tight text-accent-foreground md:text-8xl">
                {result.level}
              </div>
            </div>
          </motion.div>

          <p className="mt-6 text-muted-foreground">
            Basato su <span className="font-semibold text-foreground">{result.score}</span> risposte corrette su {result.total}
          </p>
          <div role="note" className="mx-auto mt-6 max-w-xl rounded-2xl border-2 border-accent bg-accent/10 p-5 text-left">
            <p className="font-display text-lg font-bold text-foreground">Attenzione: questo livello non è ancora convalidato</p>
            <p className="mt-1 text-sm text-foreground/80">È una stima automatica. Per avere il tuo livello reale deve essere convalidato da un docente certificato Cambridge, che valuta anche come parli e scrivi.</p>
            {result.confidence === 'limited' && <p className="mt-2 text-sm text-foreground/80">Le risposte date sono poche: la verifica con un docente è ancora più importante.</p>}
          </div>
          {result.speaking && <div className="mx-auto mt-6 max-w-xl border-t border-border pt-4 text-left">
            <p className="font-semibold text-foreground">Speaking · {result.speaking.status === 'recorded' ? 'Risposta vocale completata' : result.speaking.status === 'written' ? 'Risposta scritta, non vocale' : 'Prova saltata'}</p>
            {result.speaking.transcript && <p className="mt-2 break-words text-sm text-muted-foreground">“{result.speaking.transcript}”</p>}
            <p className="mt-2 text-sm text-muted-foreground">Pronuncia e fluidità da valutare con un docente; questa prova non modifica il livello indicativo.</p>
          </div>}
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-10 overflow-hidden rounded-[2rem] bg-foreground p-8 text-center text-background shadow-elegant md:p-14"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-4 py-1.5 text-xs font-medium text-background/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Prossimo passo
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] md:text-5xl">
            Convalida il tuo livello
            <br />
            con un <span className="text-accent">docente certificato Cambridge</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            Consulenza gratuita uno-a-uno: confermi il tuo livello reale e ricevi un percorso su misura. Scegli tu come preferisci.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                fbqTrack("Schedule", {
                  content_name: "Speaking Test Booking",
                  level: result.level,
                  score: result.score,
                });
                setBookingOpen(true);
              }}
              className="group flex items-center gap-5 rounded-full bg-accent pl-7 pr-2 py-2 text-base font-semibold text-accent-foreground shadow-yellow transition-all hover:-translate-y-0.5 hover:bg-accent/90 md:text-lg"
            >
              <span>Scegli giorno e ora della consulenza</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `Salve, ho appena completato il test di inglese di Escape Campus (livello ottenuto: ${result.level}) e vorrei prenotare la consulenza gratuita per convalidare il mio livello. Grazie.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                fbqTrack("Contact", {
                  content_name: "WhatsApp Contact",
                  level: result.level,
                });
                // Fallback for sandboxed iframes (e.g. Lovable preview) that block target=_blank
                const url = (e.currentTarget as HTMLAnchorElement).href;
                const win = window.open(url, "_blank", "noopener,noreferrer");
                if (!win) {
                  e.preventDefault();
                  window.top?.location.assign(url);
                }
              }}
              className="group flex items-center gap-5 rounded-full bg-success pl-7 pr-2 py-2 text-base font-semibold text-success-foreground shadow-elegant transition-all hover:-translate-y-0.5 hover:bg-success/90 md:text-lg"
            >
              <span>Preferisco organizzarla su WhatsApp</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/15 text-white transition-transform group-hover:translate-x-0.5">
                <MessageCircle className="h-5 w-5" />
              </span>
            </a>
            <button
              onClick={() => toast.success(`Risultato dettagliato inviato a ${email}`)}
              className="inline-flex items-center gap-2 text-sm text-background/70 underline-offset-4 hover:text-accent hover:underline"
            >
              <Mail className="h-4 w-4" />
              Ricevi l'analisi dettagliata via email
            </button>
          </div>
        </motion.div>

        {/* CEFR Ladder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-12 flex items-end justify-center gap-2 md:gap-4"
        >
          {LEVELS.map((lvl, i) => {
            const active = lvl === result.level;
            const reached = LEVELS.indexOf(lvl) <= LEVELS.indexOf(result.level);
            return (
              <div key={lvl} className="flex flex-col items-center gap-2">
                <div
                  className={`flex w-14 items-center justify-center rounded-2xl font-display text-lg font-bold transition-all md:w-20 md:text-xl ${
                    active
                      ? "h-28 bg-accent text-accent-foreground shadow-yellow md:h-36"
                      : reached
                        ? "h-20 bg-secondary text-foreground md:h-24"
                        : "h-14 bg-secondary text-muted-foreground md:h-16"
                  }`}
                >
                  {lvl}
                </div>
              </div>
            );
          })}
        </motion.div>

        {result.skills && <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">{result.skills.map(s => <div key={s.skill} className="border-b border-border py-4 text-center"><p className="text-sm text-muted-foreground">{s.skill}</p><p className="mt-2 text-xl font-semibold text-foreground">{s.correct} / {s.total}</p></div>)}</div>}

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-card p-8 text-center"
        >
          <p className="text-lg leading-relaxed text-foreground">{result.description}</p>
        </motion.div>

        {/* Share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="mt-10 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <Share2 className="h-4 w-4" /> Condividi il tuo risultato
          </div>
          <div className="flex justify-center gap-3">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-success hover:text-success"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              LinkedIn
            </a>
          </div>
        </motion.div>
      </div>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-3xl p-0 sm:max-w-3xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display text-2xl">Prenota la tua consulenza gratuita</DialogTitle>
          </DialogHeader>
          <div className="h-[600px] w-full overflow-hidden rounded-b-lg">
            <iframe
              src={CALENDLY_URL}
              title="Prenota Speaking Test"
              className="h-full w-full border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};