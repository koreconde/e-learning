import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, Lock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TurnstileWidget } from "./TurnstileWidget";
import { PhoneVerifyDialog } from "./PhoneVerifyDialog";

// Temporarily off while the phone provider account is suspended.
const PHONE_VERIFICATION_ENABLED = false;
import { parsePhoneNumberFromString } from "libphonenumber-js";


export interface Lead {
  name: string;
  email: string;
  phone: string;
  goal: string;
  timeline: string;
  eta: string;
  occupazione: string;
}

// Strict name: at least 2 words, only letters/spaces/apostrophes/hyphens
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-]{2,}(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ'’\-]{2,})+$/;
const PHONE_RE = /^\+?[0-9 ()\-.]{8,25}$/;

const GOALS = ["lavoro", "studio", "viaggio", "curiosita"] as const;
const TIMELINES = ["subito", "1_3_mesi", "piu_avanti", "non_so"] as const;
const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;
const OCCUPAZIONI = [
  "Lavoratore dipendente",
  "Libero professionista",
  "Imprenditore",
  "Studente",
  "Non lavoratore",
] as const;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Inserisci nome e cognome")
    .max(80, "Nome troppo lungo")
    .regex(NAME_RE, "Inserisci nome e cognome reali (solo lettere)"),
  email: z.string().trim().toLowerCase().email("Email non valida").max(120),
  phone: z
    .string()
    .trim()
    .min(8, "Numero troppo corto")
    .max(25, "Numero troppo lungo")
    .regex(PHONE_RE, "Numero non valido")
    .refine((val) => {
      const parsed = parsePhoneNumberFromString(val, "IT");
      return !!parsed && parsed.isValid();
    }, "Inserisci un numero di telefono reale e valido"),
  goal: z.enum(GOALS, { errorMap: () => ({ message: "Seleziona un obiettivo" }) }),
  timeline: z.enum(TIMELINES, { errorMap: () => ({ message: "Seleziona una tempistica" }) }),
  eta: z.enum(AGE_RANGES, { errorMap: () => ({ message: "Seleziona la tua fascia di età" }) }),
  occupazione: z.enum(OCCUPAZIONI, { errorMap: () => ({ message: "Seleziona la tua occupazione" }) }),
  consent: z.literal(true, { errorMap: () => ({ message: "Consenso obbligatorio" }) }),
  // Honeypot — must remain empty
  website: z.string().max(0, "Spam rilevato").optional(),
});

type FormValues = z.infer<typeof schema>;

export interface LeadSubmitMeta {
  turnstileToken: string;
  elapsedMs: number;
  honeypot: string;
  phoneVerificationToken: string;
}

interface LeadFormProps {
  onSubmit: (lead: Lead, meta: LeadSubmitMeta) => void | Promise<void>;
}

export const LeadForm = ({ onSubmit }: LeadFormProps) => {
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileError, setTurnstileError] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingLead, setPendingLead] = useState<{ lead: Lead; elapsedMs: number; honeypot: string } | null>(null);
  const mountedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "+39 ",
      goal: undefined as unknown as (typeof GOALS)[number],
      timeline: undefined as unknown as (typeof TIMELINES)[number],
      eta: undefined as unknown as (typeof AGE_RANGES)[number],
      occupazione: undefined as unknown as (typeof OCCUPAZIONI)[number],
      consent: false as unknown as true,
      website: "",
    },
  });

  const consentChecked = watch("consent");
  const goalValue = watch("goal");
  const timelineValue = watch("timeline");
  const etaValue = watch("eta");
  const occupazioneValue = watch("occupazione");

  const submit = handleSubmit(async (data) => {
    if (!turnstileToken) {
      setTurnstileError(true);
      return;
    }
    const elapsedMs = Date.now() - mountedAtRef.current;
    setPendingLead({
      lead: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        goal: data.goal,
        timeline: data.timeline,
        eta: data.eta,
        occupazione: data.occupazione,
      },
      elapsedMs,
      honeypot: data.website ?? "",
    });
    if (!PHONE_VERIFICATION_ENABLED) {
      await onSubmit(
        {
          name: data.name, email: data.email, phone: data.phone, goal: data.goal,
          timeline: data.timeline, eta: data.eta, occupazione: data.occupazione,
        },
        { turnstileToken, elapsedMs, honeypot: data.website ?? "", phoneVerificationToken: "" },
      );
      return;
    }
    setVerifyOpen(true);
  });

  const handleVerified = async (phoneVerificationToken: string) => {
    if (!pendingLead) return;
    setVerifyOpen(false);
    await onSubmit(pendingLead.lead, {
      turnstileToken,
      elapsedMs: pendingLead.elapsedMs,
      honeypot: pendingLead.honeypot,
      phoneVerificationToken,
    });
  };


  return (
    <section id="lead-form" className="bg-foreground py-24 text-background">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-4 py-1.5 text-xs font-medium text-background/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Ultimo passo
          </div>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-6xl">
            Analisi linguistica personalizzata + consulenza gratuita
          </h2>
          <p className="mt-5 max-w-md text-background/70">
            Compila il modulo per accedere al test. Al termine riceverai il risultato CEFR via email
            e un nostro docente ti ricontatterà per una consulenza gratuita di 15 minuti, costruita sul tuo obiettivo.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-background/60">
            <Lock className="h-4 w-4" />
            I tuoi dati sono protetti e non saranno condivisi con terze parti.
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm text-background/90">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p>
              <span className="font-semibold">Attenzione:</span> questo test
              utilizza tecnologie AI avanzate che consumano risorse ed energia.
              È riservato esclusivamente a chi è realmente interessato a
              migliorare il proprio inglese. Se non hai intenzione di
              impegnarti, ti preghiamo di non procedere.
            </p>
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-3xl bg-card p-8 text-foreground shadow-elegant md:p-10"
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Nome e cognome</Label>
              <Input id="name" placeholder="Marco Rossi" className="mt-1.5 h-12 rounded-xl" {...register("name")} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="marco@azienda.it" className="mt-1.5 h-12 rounded-xl" {...register("email")} />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Numero di telefono</Label>
              <Input id="phone" type="tel" placeholder="+39 333 1234567" className="mt-1.5 h-12 rounded-xl" {...register("phone")} />
              {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="goal">Perché vuoi migliorare l'inglese?</Label>
              <Select
                value={goalValue}
                onValueChange={(v) => setValue("goal", v as (typeof GOALS)[number], { shouldValidate: true })}
              >
                <SelectTrigger id="goal" className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Seleziona un obiettivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lavoro">Per lavoro / carriera</SelectItem>
                  <SelectItem value="studio">Per studio / certificazione</SelectItem>
                  <SelectItem value="viaggio">Per viaggio / trasferimento</SelectItem>
                  <SelectItem value="curiosita">Curiosità personale</SelectItem>
                </SelectContent>
              </Select>
              {errors.goal && <p className="mt-1 text-sm text-destructive">{errors.goal.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="timeline">Quando vorresti iniziare un percorso?</Label>
              <Select
                value={timelineValue}
                onValueChange={(v) => setValue("timeline", v as (typeof TIMELINES)[number], { shouldValidate: true })}
              >
                <SelectTrigger id="timeline" className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Seleziona una tempistica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subito">Subito</SelectItem>
                  <SelectItem value="1_3_mesi">Entro 1-3 mesi</SelectItem>
                  <SelectItem value="piu_avanti">Più avanti nel tempo</SelectItem>
                  <SelectItem value="non_so">Non lo so ancora</SelectItem>
                </SelectContent>
              </Select>
              {errors.timeline && <p className="mt-1 text-sm text-destructive">{errors.timeline.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="eta">Fascia di età</Label>
              <Select
                value={etaValue}
                onValueChange={(v) => setValue("eta", v as (typeof AGE_RANGES)[number], { shouldValidate: true })}
              >
                <SelectTrigger id="eta" className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Seleziona la tua fascia di età" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eta && <p className="mt-1 text-sm text-destructive">{errors.eta.message as string}</p>}
            </div>

            <div>
              <Label htmlFor="occupazione">Occupazione</Label>
              <Select
                value={occupazioneValue}
                onValueChange={(v) => setValue("occupazione", v as (typeof OCCUPAZIONI)[number], { shouldValidate: true })}
              >
                <SelectTrigger id="occupazione" className="mt-1.5 h-12 rounded-xl">
                  <SelectValue placeholder="Seleziona la tua occupazione" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPAZIONI.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occupazione && <p className="mt-1 text-sm text-destructive">{errors.occupazione.message as string}</p>}
            </div>

            {/* Honeypot — invisible to humans, visible to bots */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            >
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="consent"
                checked={!!consentChecked}
                onCheckedChange={(v) => setValue("consent", v === true ? true : (false as unknown as true), { shouldValidate: true })}
                className="mt-1"
              />
              <Label htmlFor="consent" className="text-sm font-normal leading-relaxed text-muted-foreground">
                Acconsento al trattamento dei miei dati personali (GDPR) e a ricevere comunicazioni da Escape Campus.
              </Label>
            </div>
            {errors.consent && <p className="text-sm text-destructive">{errors.consent.message as string}</p>}

            <div className="pt-1">
              <TurnstileWidget
                onToken={(t) => {
                  setTurnstileToken(t);
                  setTurnstileError(false);
                }}
                onError={() => {
                  setTurnstileToken("");
                  setTurnstileError(true);
                }}
              />
              {turnstileError && (
                <p className="mt-2 text-sm text-destructive">
                  Verifica anti-bot non completata. Ricarica la pagina e riprova.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="group flex w-full items-center justify-between gap-4 rounded-full bg-accent pl-7 pr-2 py-2 text-base font-semibold text-accent-foreground shadow-yellow transition-all hover:-translate-y-0.5 hover:bg-accent/90 disabled:opacity-60"
            >
              <span>{isSubmitting ? "Verifica in corso…" : "Accedi al test gratuito"}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </motion.form>
      </div>

      <PhoneVerifyDialog
        open={verifyOpen}
        phone={pendingLead?.lead.phone ?? ""}
        onOpenChange={setVerifyOpen}
        onVerified={handleVerified}
      />
    </section>

  );
};
