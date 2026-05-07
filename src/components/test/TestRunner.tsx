import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, SkipForward } from "lucide-react";
import { questions, isAnswerCorrect } from "@/data/questions";
import {
  MultipleChoiceView,
  ListeningView,
  FillBlankView,
  ReorderView,
  WritingView,
  SpeakingView,
} from "./QuestionTypes";

export interface AnsweredQuestion {
  questionNumber: number;
  level: string;
  skill: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
}

interface TestRunnerProps {
  onFinish: (correctIds: number[], details: AnsweredQuestion[]) => void;
}

const TOTAL_SECONDS = 12 * 60; // a bit more time for written/spoken tasks

type Answer = number | string | string[] | null;

export const TestRunner = ({ onFinish }: TestRunnerProps) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null));
  const [draft, setDraft] = useState<Answer>(null);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  // Reset draft when question changes
  useEffect(() => {
    setDraft(q.type === "reorder" ? [] : q.type === "multiple-choice" || q.type === "listening" ? null : "");
    setLocked(false);
  }, [index, q.type]);

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      finishWith(answers);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Keyboard shortcuts only for option-based questions
  useEffect(() => {
    if (q.type !== "multiple-choice" && q.type !== "listening") return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const key = e.key.toLowerCase();
      const map: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        a: 0, b: 1, c: 2, d: 3,
      };
      if (key in map) handleOptionSelect(map[key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, locked]);

  const finishWith = (final: Answer[]) => {
    const correctIds: number[] = [];
    const details: AnsweredQuestion[] = final.map((ans, i) => {
      const q = questions[i];
      const correct = isAnswerCorrect(q, ans);
      if (correct) correctIds.push(q.id);
      return {
        questionNumber: i + 1,
        level: q.level,
        skill: q.skill,
        prompt: getPrompt(q),
        userAnswer: formatAnswer(q, ans),
        correctAnswer: getCorrectAnswer(q),
        correct,
      };
    });
    onFinish(correctIds, details);
  };

  const advance = (newAnswers: Answer[]) => {
    if (index === questions.length - 1) {
      finishWith(newAnswers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const commit = (answer: Answer, autoAdvance = true) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);
    setLocked(true);
    if (autoAdvance) {
      setTimeout(() => advance(newAnswers), 350);
    }
  };

  const handleOptionSelect = (i: number) => {
    if (locked) return;
    setDraft(i);
    commit(i);
  };

  const handleSkip = () => {
    if (locked) return;
    const newAnswers = [...answers];
    newAnswers[index] = null;
    setAnswers(newAnswers);
    advance(newAnswers);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const lowTime = secondsLeft < 60;

  const renderQuestion = () => {
    switch (q.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceView
            q={q}
            selected={typeof draft === "number" ? draft : null}
            onSelect={handleOptionSelect}
            locked={locked}
          />
        );
      case "listening":
        return (
          <ListeningView
            q={q}
            selected={typeof draft === "number" ? draft : null}
            onSelect={handleOptionSelect}
            locked={locked}
          />
        );
      case "fill-blank":
        return (
          <FillBlankView
            q={q}
            value={typeof draft === "string" ? draft : ""}
            onChange={(v) => setDraft(v)}
            onSubmit={() => commit(typeof draft === "string" ? draft : "")}
            locked={locked}
          />
        );
      case "reorder":
        return (
          <ReorderView
            q={q}
            current={Array.isArray(draft) ? draft : []}
            onChange={(v) => setDraft(v)}
            onSubmit={() => commit(Array.isArray(draft) ? draft : [])}
            locked={locked}
          />
        );
      case "writing":
        return (
          <WritingView
            q={q}
            value={typeof draft === "string" ? draft : ""}
            onChange={(v) => setDraft(v)}
            onSubmit={() => commit(typeof draft === "string" ? draft : "")}
            locked={locked}
          />
        );
      case "speaking":
        return (
          <SpeakingView
            q={q}
            transcript={typeof draft === "string" ? draft : ""}
            onChange={(v) => setDraft(v)}
            onSubmit={() => commit(typeof draft === "string" ? draft : "")}
            locked={locked}
          />
        );
    }
  };

  const skillBadgeColor: Record<string, string> = {
    Grammar: "bg-foreground text-background",
    Vocabulary: "bg-foreground text-background",
    Reading: "bg-foreground text-background",
    Listening: "bg-brand-blue text-white",
    Speaking: "bg-destructive text-white",
    Writing: "bg-accent text-foreground",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-hero">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur">
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
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 items-start justify-center px-4 py-10 md:items-center">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.25em]">
                <span className="rounded-full bg-foreground px-3 py-1 font-bold text-background">
                  {q.level}
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-bold ${skillBadgeColor[q.skill] ?? "bg-secondary text-foreground"}`}
                >
                  {q.skill}
                </span>
              </div>

              {renderQuestion()}

              <div className="mt-8 text-center">
                <button
                  onClick={handleSkip}
                  disabled={locked}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
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
