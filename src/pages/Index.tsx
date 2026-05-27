import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Partners } from "@/components/landing/Partners";
import { LeadForm, type Lead, type LeadSubmitMeta } from "@/components/landing/LeadForm";
import { Footer } from "@/components/landing/Footer";
import { TestRunner } from "@/components/test/TestRunner";
import type { AnsweredQuestion } from "@/components/test/TestRunner";
import { ResultPage } from "@/components/test/ResultPage";
import { calculateLevel, type Result } from "@/data/questions";
import { fbqTrack, ttqTrack } from "@/lib/fpixel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Stage = "landing" | "test" | "result";

const Index = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [lead, setLead] = useState<Lead | null>(null);
  const leadTokenRef = useRef<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLeadSubmit = async (l: Lead, meta: LeadSubmitMeta) => {
    const params = new URLSearchParams(window.location.search);
    const attribution = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      referrer: document.referrer || null,
      landing_url: window.location.href,
    };

    try {
      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: l.name,
          email: l.email,
          phone: l.phone,
          consent: true,
          turnstileToken: meta.turnstileToken,
          elapsedMs: meta.elapsedMs,
          website: meta.honeypot,
          attribution,
        },
      });

      if (error || !data?.success) {
        const msg = (data && (data.error as string)) || "Errore di invio. Riprova.";
        toast({ title: "Impossibile inviare", description: msg, variant: "destructive" });
        return;
      }

      leadTokenRef.current = data.leadToken as string;
    } catch (e) {
      console.error(e);
      toast({ title: "Errore di rete", description: "Riprova tra qualche istante.", variant: "destructive" });
      return;
    }

    setLead(l);
    fbqTrack("Lead", { content_name: "English Test Lead" });
    ttqTrack("SubmitForm", { content_name: "English Test Lead" });
    ttqTrack("CompleteRegistration", { content_name: "Test inglese - Lead acquisito" });

    setStage("test");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const handleTestFinish = (correctIds: number[], details: AnsweredQuestion[]) => {
    const r = calculateLevel(correctIds);
    setResult(r);
    fbqTrack("CompleteRegistration", {
      content_name: "English Test Completed",
      value: r.score,
      level: r.level,
    });
    ttqTrack("CompleteRegistration", {
      content_name: "English Test Completed",
      value: r.score,
      level: r.level,
    });

    const errors = details
      .filter((d) => !d.correct)
      .map(({ correct, ...e }) => e);

    if (leadTokenRef.current) {
      supabase.functions
        .invoke("complete-test", {
          body: {
            leadToken: leadTokenRef.current,
            level: r.level,
            score: r.score,
            total: r.total,
            errors,
          },
        })
        .catch((e) => console.error("complete-test failed", e));
    }

    setStage("result");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  useEffect(() => {
    return;
  }, [stage]);

  if (stage === "test") return <TestRunner onFinish={handleTestFinish} />;
  if (stage === "result" && result && lead)
    return <ResultPage result={result} name={lead.name} email={lead.email} />;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero onStart={scrollToForm} />
      <SocialProof />
      <HowItWorks />
      <Partners />
      <LeadForm onSubmit={handleLeadSubmit} />
      <Footer />
    </main>
  );
};

export default Index;
