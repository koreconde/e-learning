import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, SkipForward } from "lucide-react";
import { isAnswerCorrect } from "@/data/questions";
import type { Question, Result } from "@/data/questions";
import { ADAPTIVE_MAX, adaptiveResult, nextAdaptiveQuestion, shouldFinishAdaptive, type AdaptiveResponse, type TestedSkill } from "@/lib/adaptive-test";
import { Button } from "@/components/ui/button";
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
  onFinish: (result: Result, details: AnsweredQuestion[]) => void;
}

const TOTAL_SECONDS = 12 * 60; // a bit more time for written/spoken tasks

type Answer = number | string | string[] | null;

function getPrompt(q: Question): string {
  switch (q.type) {
    case "multiple-choice":
    case "fill-blank":
      return q.text;
    case "listening":
      return q.prompt;
    case "reorder":
    case "writing":
    case "speaking":
      return q.prompt;
  }
}

function formatAnswer(q: Question, ans: Answer): string {
  if (ans === null || ans === undefined || ans === "") return "";
  switch (q.type) {
    case "multiple-choice":
    case "listening":
      return typeof ans === "number" ? q.options[ans] ?? "" : "";
    case "fill-blank":
      return typeof ans === "string" ? ans : "";
    case "reorder":
      return Array.isArray(ans) ? ans.join(" ") : "";
    case "writing":
    case "speaking":
      return typeof ans === "string" ? ans : "";
  }
}

function getCorrectAnswer(q: Question): string {
  switch (q.type) {
    case "multiple-choice":
    case "listening":
      return q.options[q.correct] ?? "";
    case "fill-blank":
      return q.accepted[0] ?? "";
    case "reorder":
      return q.correct.join(" ");
    case "writing":
      return `(min ${q.minWords} parole)`;
    case "speaking":
      return q.targetPhrase;
  }
}

export const TestRunner = ({ onFinish }: TestRunnerProps) => {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<AdaptiveResponse[]>([]);
  const [details, setDetails] = useState<AnsweredQuestion[]>([]);
  const [q, setQuestion] = useState(() => nextAdaptiveQuestion([]));
  const completed = useRef(false);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitLock = useRef(false);
  const [textAssisted, setTextAssisted] = useState(false);
  const [draft, setDraft] = useState<Answer>(null);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);

  const progress = (index / ADAPTIVE_MAX) * 100;

  // Reset draft when question changes
  useEffect(() => {
    if (!q) return;
    setDraft(q.type === "reorder" ? [] : q.type === "multiple-choice" || q.type === "listening" ? null : "");
    setLocked(false);
    commitLock.current = false;
    setTextAssisted(false);
  }, [q]);

  useEffect(() => () => { if (transitionRef.current) clearTimeout(transitionRef.current); }, []);

  // Timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      finishWith(responses, details);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // Keyboard shortcuts only for option-based questions
  useEffect(() => {
    if (!q || (q.type !== "multiple-choice" && q.type !== "listening")) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      const key = e.key.toLowerCase();
      const map: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        a: 0, b: 1, c: 2, d: 3,
      };
      if (key in map && !locked) setDraft(map[key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, locked]);

  const finishWith = (final: AdaptiveResponse[], finalDetails: AnsweredQuestion[]) => {
    if (completed.current) return;
    completed.current = true;
    if (transitionRef.current) clearTimeout(transitionRef.current);
    onFinish(adaptiveResult(final), finalDetails);
  };

  const advance = (next: AdaptiveResponse[], nextDetails: AnsweredQuestion[]) => {
    const nextQuestion = nextAdaptiveQuestion(next);
    if (shouldFinishAdaptive(next) || !nextQuestion) {
      finishWith(next, nextDetails);
    } else {
      setIndex((i) => i + 1);
      setQuestion(nextQuestion);
    }
  };

  const commit = (answer: Answer, autoAdvance = true) => {
    if (!q || commitLock.current || completed.current) return;
    commitLock.current = true;
    const correct = isAnswerCorrect(q, answer);
    const skill = (textAssisted && q.skill === 'Listening' ? 'Reading' : q.skill) as TestedSkill;
    const next = [...responses, { id: q.id, correct, skill }];
    const nextDetails = [...details, { questionNumber: index + 1, level: q.level, skill, prompt: getPrompt(q), userAnswer: formatAnswer(q, answer), correctAnswer: getCorrectAnswer(q), correct }];
    setResponses(next);
    setDetails(nextDetails);
    setLocked(true);
    if (autoAdvance) {
      transitionRef.current = setTimeout(() => advance(next, nextDetails), 200);
    }
  };

  const handleOptionSelect = (i: number) => {
    if (locked) return;
    setDraft(i);
  };

  const handleSkip = () => {
    if (locked) return;
    commit(null);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;
  const lowTime = secondsLeft < 60;

  const renderQuestion = () => {
    if (!q) return null;
    switch (q.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceView
            q={q}
            selected={typeof draft === "number" ? draft : null}
            onSelect={handleOptionSelect}
            locked={locked}
            onTextReveal={() => setTextAssisted(true)}
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
    Listening: "bg-brand-blue text-primary-foreground",
    Speaking: "bg-destructive text-destructive-foreground",
    Writing: "bg-accent text-foreground",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gradient-hero">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-border/60 bg-card/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="text-sm font-medium text-muted-foreground">
            Domanda <span className="text-primary font-bold">{index + 1}</span> · massimo {ADAPTIVE_MAX}
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
              key={q?.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex items-center gap-2 text-xs uppercase tracking-[0.25em]">
                <span className="rounded-full bg-foreground px-3 py-1 font-bold text-background">
                  Test inglese
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-bold ${skillBadgeColor[q?.skill ?? ''] ?? "bg-secondary text-foreground"}`}
                >
                  {textAssisted ? 'Reading' : q?.skill}
                </span>
              </div>

              {renderQuestion()}
              {(q?.type === 'multiple-choice' || q?.type === 'listening') && (
                <Button className="mt-6" disabled={typeof draft !== 'number' || locked} onClick={() => commit(draft)}>Conferma risposta</Button>
              )}

              <div className="mt-8 text-center">
                <Button variant="ghost"
                  onClick={handleSkip}
                  disabled={locked}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Non lo so, salta
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
