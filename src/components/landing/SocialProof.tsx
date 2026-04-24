import { motion } from "framer-motion";
import { Award, BookOpen, Users } from "lucide-react";

const stats = [
  { icon: Users, value: "10.000+", label: "Studenti testati" },
  { icon: Award, value: "98%", label: "Completa il percorso" },
  { icon: BookOpen, value: "Cambridge", label: "Metodologia certificata" },
];

export const SocialProof = () => (
  <section className="border-y border-border/60 bg-card py-14">
    <div className="container mx-auto px-4">
      <div className="grid gap-10 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="flex items-center gap-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-navy text-primary-foreground shadow-card">
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border/60 pt-8 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <span>Cambridge English</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <span>CEFR Framework</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <span>Council of Europe</span>
        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
        <span>British Council Aligned</span>
      </div>
    </div>
  </section>
);