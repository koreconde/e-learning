import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";

export const Header = () => (
  <header className="absolute top-0 left-0 right-0 z-30">
    <div className="container mx-auto flex items-center justify-between px-4 py-5">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        aria-label="Apri menu"
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </motion.button>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo withText={false} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
      >
        <span aria-hidden>🇮🇹</span>
        <span>IT</span>
      </motion.div>
    </div>
  </header>
);