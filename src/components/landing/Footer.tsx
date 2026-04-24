import { Instagram, Linkedin, Youtube, GraduationCap } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-navy">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="font-display text-lg font-bold text-primary">Escape Campus</div>
        </div>
        <div className="flex gap-4 text-muted-foreground">
          <a href="#" aria-label="Instagram" className="hover:text-accent transition-colors"><Instagram className="h-5 w-5" /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-accent transition-colors"><Linkedin className="h-5 w-5" /></a>
          <a href="#" aria-label="YouTube" className="hover:text-accent transition-colors"><Youtube className="h-5 w-5" /></a>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} Escape Campus SRL · P.IVA [placeholder] · Bari, Italia</div>
        <div className="flex gap-5">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
        </div>
      </div>
    </div>
  </footer>
);