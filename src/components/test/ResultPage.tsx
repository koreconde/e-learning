import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { CEFRLevel, Result } from "@/data/questions";

const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const CALENDLY_URL = "https://calendly.com/escape-campus/speaking-test";

interface ResultPageProps {
  result: Result;
  name: string;
  email: string;
}

export const ResultPage = ({ result, name, email }: ResultPageProps) => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const shareText = encodeURIComponent(`Ho ottenuto il livello ${result.level} su Escape Campus! Prova anche tu il test gratuito.`);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">
            Complimenti{name ? `, ${name.split(" ")[0]}` : ""}
          </div>
          <h1 className="font-display text-4xl font-bold text-primary md:text-5xl">
            Il tuo livello di inglese è
          </h1>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 90 }}
            className="relative mx-auto mt-8 inline-flex"
          >
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-gold opacity-30 blur-3xl" />
            <div className="rounded-3xl bg-gradient-navy px-12 py-8 shadow-elegant">
              <div className="font-display text-7xl font-bold text-accent md:text-8xl">{result.level}</div>
            </div>
          </motion.div>

          <p className="mt-6 text-muted-foreground">
            Basato su <span className="font-semibold text-primary">{result.score}</span> risposte corrette su {result.total}
          </p>
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
                  className={`flex w-14 items-center justify-center rounded-xl font-display text-lg font-bold transition-all md:w-20 md:text-xl ${
                    active
                      ? "h-28 bg-gradient-gold text-accent-foreground shadow-gold md:h-36"
                      : reached
                        ? "h-20 bg-primary/15 text-primary md:h-24"
                        : "h-14 bg-secondary text-muted-foreground md:h-16"
                  }`}
                >
                  {lvl}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-card"
        >
          <p className="text-lg leading-relaxed text-foreground">{result.description}</p>
        </motion.div>

        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-12 overflow-hidden rounded-3xl bg-gradient-navy p-8 text-center text-primary-foreground shadow-elegant md:p-12"
        >
          <div className="mx-auto mb-3 inline-block rounded-full border border-accent/40 bg-accent/15 px-4 py-1 text-xs uppercase tracking-[0.25em] text-accent">
            Prossimo passo
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            Prenota il tuo Speaking Test gratuito<br />
            con un <em className="text-accent">Cambridge Teacher</em>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            30 minuti, uno-a-uno, per validare il tuo Speaking e ricevere un piano di studio personalizzato.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Button variant="hero" size="hero" onClick={() => setBookingOpen(true)} className="group">
              Prenota il tuo Speaking Test
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
            <button
              onClick={() => toast.success(`Risultato dettagliato inviato a ${email}`)}
              className="inline-flex items-center gap-2 text-sm text-primary-foreground/70 underline-offset-4 hover:text-accent hover:underline"
            >
              <Mail className="h-4 w-4" />
              Ricevi l'analisi dettagliata via email
            </button>
          </div>
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
            <DialogTitle className="font-display text-2xl">Prenota il tuo Speaking Test</DialogTitle>
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