import { useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LeadForm, type Lead } from "@/components/landing/LeadForm";
import { Footer } from "@/components/landing/Footer";
import { TestRunner } from "@/components/test/TestRunner";
import { ResultPage } from "@/components/test/ResultPage";
import { calculateLevel, type Result } from "@/data/questions";

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
    // TODO: connect Lovable Cloud (Supabase) — insert into `leads` table
    setStage("test");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const handleTestFinish = (correctIds: number[]) => {
    const r = calculateLevel(correctIds);
    setResult(r);
    // TODO: update lead row with level + score
    setStage("result");
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  useEffect(() => {
    document.body.style.overflow = stage === "test" ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
