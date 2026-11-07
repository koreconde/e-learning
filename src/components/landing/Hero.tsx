import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

interface HeroProps {
  onStart: () => void;
}

const PillButton = ({
  variant,
  children,
  onClick,
}: {
  variant: "yellow" | "white";
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center justify-between gap-6 rounded-full pl-7 pr-2 py-2 text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
      variant === "yellow"
        ? "bg-accent text-accent-foreground shadow-yellow"
        : "bg-card text-foreground border border-border shadow-card"
    }`}
  >
    <span>{children}</span>
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
      <ArrowRight className="h-4 w-4" />
    </span>
  </button>
);

export const Hero = ({ onStart }: HeroProps) => (
  <section className="relative overflow-hidden bg-background pt-28 pb-16 md:pt-32 md:pb-24">
    <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
    <div className="container relative mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1.05fr_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl"
      >
        <div className="mb-7 inline-flex items-center rounded-full border border-foreground/15 bg-card/60 px-4 py-1.5 text-sm font-medium text-foreground/80 backdrop-blur">
          Online English School
        </div>
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-foreground md:text-7xl lg:text-[5.5rem]">
          Scopri il tuo
          <br />
          livello di{" "}
          <span className="relative inline-block">
            inglese
            <svg
              viewBox="0 0 200 14"
              className="absolute -bottom-1 left-0 h-3 w-full text-brand-blue"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 C 50 2, 150 14, 198 6"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-7 max-w-lg text-lg text-muted-foreground md:text-xl">
          Test gratuito, fino a 12 minuti, per una stima orientativa del livello CEFR (A1 → C1). Grammatica, vocabolario, reading e listening.
        </p>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <PillButton variant="yellow" onClick={onStart}>
            Inizia il test
          </PillButton>
          <PillButton
            variant="white"
            onClick={() =>
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Come funziona
          </PillButton>
        </div>
        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {["Fino a 12 minuti", "100% gratuito", "Livello indicativo CEFR"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-foreground" />
              {t}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="relative overflow-hidden rounded-[2rem] shadow-elegant">
          <img
            src={heroImg}
            alt="Studentessa italiana che svolge il test di inglese Cambridge online"
            width={1536}
            height={1024}
            className="h-[480px] w-full object-cover md:h-[560px]"
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute -bottom-6 -left-4 rounded-2xl bg-card p-4 shadow-elegant md:-left-8 md:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground font-display text-lg font-bold">
              B2
            </div>
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Livello medio</div>
              <div className="font-display text-base font-semibold">10.000+ studenti testati</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);