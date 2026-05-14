import { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LeadForm, type Lead } from "@/components/landing/LeadForm";
import { Footer } from "@/components/landing/Footer";
import { TestRunner } from "@/components/test/TestRunner";
import type { AnsweredQuestion } from "@/components/test/TestRunner";
import { ResultPage } from "@/components/test/ResultPage";
import { calculateLevel, type Result } from "@/data/questions";
import { fbqTrack } from "@/lib/fpixel";
import { supabase } from "@/integrations/supabase/client";

type Stage = "landing" | "test" | "result";

const Index = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [lead, setLead] = useState<Lead | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLeadSubmit = (l: Lead) => {
    setLead(l);
    fbqTrack("Lead", { content_name: "English Test Lead" });
    // Notify admins immediately so we capture the lead even if the test isn't completed
    const idemBase = `${l.email}-${Date.now()}`;
    const payload = { name: l.name, email: l.email, phone: l.phone };
    ["info@englishinfinity.io", "giada@escapecampus.it", "raff@escapecampus.it"].forEach((addr) => {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-lead-admin",
          recipientEmail: addr,
          idempotencyKey: `newlead-${addr}-${idemBase}`,
          templateData: payload,
        },
      });
    });
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
    if (lead) {
      const errors = details
        .filter((d) => !d.correct)
        .map(({ correct, ...e }) => e);
      const idemBase = `${lead.email}-${Date.now()}`;
      const payload = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        level: r.level,
        score: r.score,
        total: r.total,
        errors,
      };
      // Send result to lead
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "test-result-lead",
          recipientEmail: lead.email,
          idempotencyKey: `lead-${idemBase}`,
          templateData: payload,
        },
      });
      // Copy to admin
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "test-result-admin",
          recipientEmail: "info@englishinfinity.io",
          idempotencyKey: `admin-${idemBase}`,
          templateData: payload,
        },
      });
      // Copy to additional admins
      ["giada@escapecampus.it", "raff@escapecampus.it"].forEach((addr) => {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "test-result-admin",
            recipientEmail: addr,
            idempotencyKey: `admin-${addr}-${idemBase}`,
            templateData: payload,
          },
        });
      });
    }
    setStage("result");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  useEffect(() => {
    // Test runner manages its own scroll container
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
      <LeadForm onSubmit={handleLeadSubmit} />
      <Footer />
    </main>
  );
};

export default Index;
