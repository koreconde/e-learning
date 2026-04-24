import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero.jpg";

interface HeroProps {
  onStart: () => void;
}

export const Hero = ({ onStart }: HeroProps) => (
  <section className="relative overflow-hidden bg-gradient-hero pt-28 pb-20 md:pt-36 md:pb-28">
    <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
    <div className="container relative mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Test ufficiale Cambridge-based
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] text-primary md:text-6xl lg:text-7xl">
          Scopri il tuo livello di inglese in <span className="italic text-accent">10 minuti</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground md:text-xl">
          Test gratuito basato sul framework Cambridge · CEFR (A1 → C1). Valuta grammatica, vocabolario, reading e listening.
        </p>
        <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Button variant="hero" size="hero" onClick={onStart} className="group">
            Inizia il test gratuito
            <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["10 minuti", "100% gratuito", "Certificato Cambridge-based"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-gold opacity-20 blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl shadow-elegant ring-1 ring-primary/10">
          <img
            src={heroImg}
            alt="Professionista italiana che svolge il test di inglese Cambridge online"
            width={1536}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-card/95 p-4 backdrop-blur shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Risultato medio</div>
                <div className="font-display text-2xl font-bold text-primary">B1 → B2</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Studenti</div>
                <div className="font-display text-2xl font-bold text-accent">10.000+</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);