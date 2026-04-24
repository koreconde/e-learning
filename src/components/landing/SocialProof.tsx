import { motion } from "framer-motion";

const stats = [
  { value: "10.000+", label: "Studenti testati" },
  { value: "98%", label: "Completa il percorso" },
  { value: "Cambridge", label: "Metodologia certificata" },
];

export const SocialProof = () => (
  <section className="border-y border-border bg-secondary/40 py-12">
    <div className="container mx-auto px-4">
      <div className="grid gap-8 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="text-center md:text-left"
          >
            <div className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);