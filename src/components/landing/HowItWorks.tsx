import { motion } from "framer-motion";
import { ClipboardList, GraduationCap, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Rispondi a 20 domande",
    desc: "Grammatica, vocabolario e comprensione, in soli 10 minuti.",
  },
  {
    icon: GraduationCap,
    title: "Ricevi il tuo livello CEFR",
    desc: "Da A1 a C1, con un'analisi dettagliata delle tue competenze.",
  },
  {
    icon: MessageSquare,
    title: "Prenota un colloquio gratuito",
    desc: "Con un docente certificato Cambridge per validare il tuo Speaking.",
  },
];

export const HowItWorks = () => (
  <section id="how-it-works" className="py-24">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
          Come funziona
        </div>
        <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">
          Tre passi verso il tuo livello reale
        </h2>
      </motion.div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="group relative rounded-3xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors group-hover:bg-accent">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="font-display text-5xl font-bold text-secondary">
                0{i + 1}
              </span>
            </div>
            <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-foreground">
              {s.title}
            </h3>
            <p className="text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);