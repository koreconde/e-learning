import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface Lead {
  name: string;
  email: string;
  phone: string;
}

const schema = z.object({
  name: z.string().min(2, "Inserisci nome e cognome"),
  email: z.string().email("Email non valida"),
  phone: z.string().min(8, "Numero troppo corto"),
  consent: z.literal(true, { errorMap: () => ({ message: "Consenso obbligatorio" }) }),
});

type FormValues = z.infer<typeof schema>;

interface LeadFormProps {
  onSubmit: (lead: Lead) => void;
}

export const LeadForm = ({ onSubmit }: LeadFormProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "+39 ", consent: false as unknown as true },
  });

  const consentChecked = watch("consent");

  const submit = handleSubmit((data) => {
    onSubmit({ name: data.name, email: data.email, phone: data.phone });
  });

  return (
    <section id="lead-form" className="bg-gradient-navy py-24 text-primary-foreground">
      <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-accent">Ultimo passo</div>
          <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Ultimo passo prima di <em className="text-accent">iniziare</em>
          </h2>
          <p className="mt-5 max-w-md text-primary-foreground/75">
            Inserisci i tuoi dati per accedere al test. Riceverai il risultato dettagliato via email, insieme a un'analisi personalizzata del tuo livello CEFR.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-primary-foreground/60">
            <Lock className="h-4 w-4" />
            I tuoi dati sono protetti e non saranno condivisi con terze parti.
          </div>
        </motion.div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-2xl bg-card p-8 text-foreground shadow-elegant md:p-10"
        >
          <div className="space-y-5">
            <div>
              <Label htmlFor="name">Nome e cognome</Label>
              <Input id="name" placeholder="Marco Rossi" className="mt-1.5 h-12" {...register("name")} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="marco@azienda.it" className="mt-1.5 h-12" {...register("email")} />
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Numero di telefono</Label>
              <Input id="phone" type="tel" placeholder="+39 333 1234567" className="mt-1.5 h-12" {...register("phone")} />
              {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
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

            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={isSubmitting}>
              Accedi al test gratuito
              <ArrowRight />
            </Button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};