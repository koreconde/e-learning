import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export const Header = () => (
  <header className="absolute top-0 left-0 right-0 z-30">
    <div className="container mx-auto flex items-center justify-between py-6 px-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-navy shadow-card">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-xl font-bold text-primary">Escape Campus</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">English for executives</div>
        </div>
      </motion.div>
      <div className="hidden text-sm text-muted-foreground md:block">
        Cambridge-based · CEFR A1 → C1
      </div>
    </div>
  </header>
);