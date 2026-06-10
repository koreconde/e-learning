import { motion } from "framer-motion";
import { ArrowRight, Phone, Clock, X } from "lucide-react";

export type ContactChoice = "subito" | "dopo" | "no";

interface ContactGateProps {
  name: string;
  onChoose: (choice: ContactChoice) => void;
  submitting?: boolean;
}

const OPTIONS: {
  value: ContactChoice;
  icon: typeof Phone;
  title: string;
  desc: string;
  accent: string;
}[] = [
  {
    value: "subito",
    icon: Phone,
    title: "Sì, contattatemi subito",
    desc: "Un docente ti chiama anche prima del risultato per costruire insieme il percorso.",
    accent: "border-accent bg-accent/10 hover:bg-accent/15",
  },
  {
    value: "dopo",
    icon: Clock,
    title: "Sì, dopo aver visto il risultato",
    desc: "Prima vedi il tuo livello, poi ricevi una consulenza gratuita di 15 minuti.",
    accent: "border-foreground/15 bg-card hover:bg-foreground/[0.03]",
  },
  {
    value: "no",
    icon: X,
    title: "No grazie, voglio solo il test",
    desc: "Ricevi solo il risultato via email, senza essere ricontattato.",
    accent: "border-foreground/10 bg-card hover:bg-foreground/[0.02]",
  },
];

export const ContactGate = ({ name, onChoose, submitting }: ContactGateProps) => {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  return (
    <main className="min-h-screen bg-background py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/[0.04] px-4 py-1.5 text-xs font-medium text-foreground/70">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Un'ultima cosa{firstName ? `, ${firstName}` : ""}
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-5xl">
            Vuoi ricevere informazioni sui nostri corsi?
          </h1>
          <p className="mt-4 max-w-xl text-foreground/70">
            Al termine del test possiamo offrirti una consulenza gratuita per costruire un percorso
            personalizzato sul tuo livello e sul tuo obiettivo. Scegli come preferisci.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4">
          {OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => onChoose(opt.value)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className={`group flex w-full items-center gap-5 rounded-2xl border-2 ${opt.accent} p-5 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-base font-semibold text-foreground md:text-lg">
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-sm text-foreground/65">{opt.desc}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
              </motion.button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-foreground/50">
          Qualunque scelta non blocca l'accesso al test. Riceverai sempre il tuo risultato.
        </p>
      </div>
    </main>
  );
};