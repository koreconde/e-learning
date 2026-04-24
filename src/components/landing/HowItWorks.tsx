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
  <section className="py-24">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">Come funziona</div>
        <h2 className="font-display text-4xl font-bold text-primary md:text-5xl">
          Tre passi verso il tuo <em className="text-accent">vero</em> livello
        </h2>
      </motion.div>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="group relative rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="absolute -top-4 left-8 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold font-display text-sm font-bold text-accent-foreground shadow-gold">
              {i + 1}
            </div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-gradient-navy group-hover:text-primary-foreground">
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-display text-2xl font-semibold text-primary">{s.title}</h3>
            <p className="text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);