import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, SkipForward } from "lucide-react";
import { questions } from "@/data/questions";

interface TestRunnerProps {
  onFinish: (correctIds: number[]) => void;
}

const TOTAL_SECONDS = 10 * 60;

export const TestRunner = ({ onFinish }: TestRunnerProps) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [selected, setSelected] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      finish(answers);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Keyboard shortcuts 1-4 / a-d
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      if (key in map) handleSelect(map[key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const finish = (final: (number | null)[]) => {
    const correctIds: number[] = [];
    final.forEach((ans, i) => {
      if (ans !== null && ans === questions[i].correct) correctIds.push(questions[i].id);
    });
    onFinish(correctIds);
  };

  const advance = (newAnswers: (number | null)[]) => {
    if (index === questions.length - 1) {
      finish(newAnswers);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const handleSelect = (optionIdx: number) => {
    if (selected !== null) return;
    setSelected(optionIdx);
    const newAnswers = [...answers];
    newAnswers[index] = optionIdx;
    setAnswers(newAnswers);
    setTimeout(() => advance(newAnswers), 300);
  };

  const handleSkip = () => {
    if (selected !== null) return;
    const newAnswers = [...answers];
    newAnswers[index] = null;
    setAnswers(newAnswers);
    advance(newAnswers);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const lowTime = secondsLeft < 60;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-hero">
      {/* Top bar */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="text-sm font-medium text-muted-foreground">
            Domanda <span className="text-primary font-bold">{index + 1}</span> di {questions.length}
          </div>
          <div
            role="timer"
            aria-live="polite"
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
              lowTime ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-border bg-secondary text-primary"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Tempo: {timeStr}</span>
          </div>
        </div>
        <div
          className="h-1.5 w-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <motion.div
            className="h-full bg-gradient-gold"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent">
                <span className="rounded-full bg-accent/15 px-3 py-1 font-bold text-accent">{q.level}</span>
                <span className="text-muted-foreground">{q.category}</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-tight text-primary md:text-4xl">
                {q.text}
              </h2>

              <div className="mt-8 grid gap-3">
                {q.options.map((opt, i) => {
                  const isSel = selected === i;
                  const letter = "abcd"[i];
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={selected !== null}
                      className={`group flex items-center gap-4 rounded-xl border-2 bg-card p-4 text-left transition-all duration-200 hover:border-accent hover:shadow-card disabled:cursor-not-allowed md:p-5 ${
                        isSel ? "border-accent bg-accent/10 shadow-gold" : "border-border"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold uppercase transition-colors ${
                          isSel ? "bg-gradient-gold text-accent-foreground" : "bg-secondary text-primary group-hover:bg-accent/20"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-base text-foreground md:text-lg">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleSkip}
                  disabled={selected !== null}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Non lo so, salta
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};