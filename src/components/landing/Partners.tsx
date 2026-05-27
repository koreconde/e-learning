import { motion } from "framer-motion";
import britishCouncil from "@/assets/partners/british-council.webp";
import cambridge from "@/assets/partners/cambridge-english.png";
import ielts from "@/assets/partners/ielts.svg";

const partners = [
  { src: cambridge, alt: "Cambridge English – Authorised Exam Centre" },
  { src: britishCouncil, alt: "British Council" },
  { src: ielts, alt: "IELTS" },
];

export const Partners = () => (
  <section className="py-24">
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
          Riconoscimenti & Partner
        </div>
        <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.02em] text-foreground md:text-5xl">
          Il metodo allineato ai gold standard internazionali
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          I nostri teachers preparano studenti alle certificazioni più riconosciute al mondo — accettate da università, datori di lavoro e governi in oltre 140 paesi.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 rounded-3xl border border-border bg-card p-10 sm:grid-cols-3 md:gap-12"
      >
        {partners.map((p) => (
          <div key={p.alt} className="flex items-center justify-center">
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="h-16 w-auto max-w-[200px] object-contain md:h-20"
            />
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);