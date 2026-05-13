import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Mic, Square, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  MultipleChoiceQ,
  FillBlankQ,
  ReorderQ,
  ListeningQ,
  WritingQ,
  SpeakingQ,
} from "@/data/questions";

/* ============ MULTIPLE CHOICE ============ */
export const MultipleChoiceView = ({
  q,
  selected,
  onSelect,
  locked,
}: {
  q: MultipleChoiceQ;
  selected: number | null;
  onSelect: (i: number) => void;
  locked: boolean;
}) => (
  <>
    <h2 className="font-display text-3xl font-bold leading-tight tracking-[-0.02em] text-foreground md:text-4xl">
      {q.text}
    </h2>
    <OptionList options={q.options} selected={selected} onSelect={onSelect} locked={locked} />
  </>
);

/* ============ LISTENING ============ */
export const ListeningView = ({
  q,
  selected,
  onSelect,
  locked,
}: {
  q: ListeningQ;
  selected: number | null;
  onSelect: (i: number) => void;
  locked: boolean;
}) => {
  const [played, setPlayed] = useState(0);
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(q.audioText);
    u.lang = q.lang ?? "en-US";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
    setPlayed((p) => p + 1);
  };

  useEffect(() => {
    // auto-play once on mount
    const t = setTimeout(speak, 400);
    return () => {
      clearTimeout(t);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  return (
    <>
      <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-foreground md:text-3xl">
        {q.prompt}
      </h2>
      <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-brand-blue/30 bg-brand-blue/5 p-5">
        <button
          onClick={speak}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Riproduci audio"
        >
          <Volume2 className="h-6 w-6" />
        </button>
        <div className="text-sm text-muted-foreground">
          <div className="font-semibold text-foreground">Ascolta l'audio</div>
          <div>Riproduzioni: {played} • Puoi riascoltare</div>
        </div>
      </div>
      <OptionList options={q.options} selected={selected} onSelect={onSelect} locked={locked} />
    </>
  );
};

/* ============ FILL BLANK ============ */
export const FillBlankView = ({
  q,
  value,
  onChange,
  onSubmit,
  locked,
}: {
  q: FillBlankQ;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  locked: boolean;
}) => {
  const parts = q.text.split("___");
  return (
    <>
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Completa con la parola mancante
      </div>
      <h2 className="font-display text-2xl font-bold leading-snug tracking-[-0.02em] text-foreground md:text-3xl">
        {parts[0]}
        <span className="mx-2 inline-block min-w-[120px] border-b-4 border-accent align-baseline">
          &nbsp;
        </span>
        {parts[1]}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onSubmit();
        }}
        className="mt-8"
      >
        <Input
          autoFocus
          value={value}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Scrivi la tua risposta..."
          className="h-14 rounded-2xl border-2 border-border bg-card px-5 text-lg focus-visible:border-foreground"
        />
        <button
          type="submit"
          disabled={!value.trim() || locked}
          className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold uppercase tracking-wide text-background transition hover:opacity-90 disabled:opacity-40"
        >
          Conferma →
        </button>
      </form>
    </>
  );
};

/* ============ REORDER ============ */
export const ReorderView = ({
  q,
  current,
  onChange,
  onSubmit,
  locked,
}: {
  q: ReorderQ;
  current: string[];
  onChange: (v: string[]) => void;
  onSubmit: () => void;
  locked: boolean;
}) => {
  const remaining = q.scrambled.filter((w, i) => {
    // count instances
    const usedCount = current.filter((c) => c === w).length;
    const totalCount = q.scrambled.filter((s) => s === w).length;
    const before = q.scrambled.slice(0, i).filter((s) => s === w).length;
    return before >= usedCount ? false : true;
  });

  // simpler: track used indices
  const [usedIdx, setUsedIdx] = useState<number[]>([]);

  useEffect(() => {
    setUsedIdx([]);
    onChange([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  const addWord = (idx: number) => {
    if (locked || usedIdx.includes(idx)) return;
    const newUsed = [...usedIdx, idx];
    setUsedIdx(newUsed);
    onChange(newUsed.map((i) => q.scrambled[i]));
  };

  const removeAt = (pos: number) => {
    if (locked) return;
    const newUsed = usedIdx.filter((_, i) => i !== pos);
    setUsedIdx(newUsed);
    onChange(newUsed.map((i) => q.scrambled[i]));
  };

  const reset = () => {
    setUsedIdx([]);
    onChange([]);
  };

  const complete = usedIdx.length === q.scrambled.length;

  return (
    <>
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {q.prompt}
      </div>
      {/* Built sentence */}
      <div className="min-h-[80px] rounded-2xl border-2 border-dashed border-border bg-card p-4">
        {usedIdx.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Tocca le parole qui sotto per costruire la frase
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usedIdx.map((idx, pos) => (
              <button
                key={pos}
                onClick={() => removeAt(pos)}
                disabled={locked}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-80"
              >
                {q.scrambled[idx]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Word bank */}
      <div className="mt-6 flex flex-wrap gap-2">
        {q.scrambled.map((w, i) => {
          const used = usedIdx.includes(i);
          return (
            <button
              key={i}
              onClick={() => addWord(i)}
              disabled={used || locked}
              className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                used
                  ? "border-border bg-secondary text-muted-foreground opacity-40"
                  : "border-foreground bg-card text-foreground hover:bg-accent"
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!complete || locked}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold uppercase tracking-wide text-background transition hover:opacity-90 disabled:opacity-40"
        >
          Conferma →
        </button>
        <button
          onClick={reset}
          disabled={usedIdx.length === 0 || locked}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </>
  );
};

/* ============ WRITING ============ */
export const WritingView = ({
  q,
  value,
  onChange,
  onSubmit,
  locked,
}: {
  q: WritingQ;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  locked: boolean;
}) => {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const ok = wordCount >= q.minWords;
  return (
    <>
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Writing • Min. {q.minWords} parole
      </div>
      <h2 className="font-display text-xl font-bold leading-snug tracking-[-0.02em] text-foreground md:text-2xl">
        {q.prompt}
      </h2>
      <Textarea
        autoFocus
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here in English..."
        className="mt-6 min-h-[180px] rounded-2xl border-2 border-border bg-card p-4 text-base focus-visible:border-foreground"
      />
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${ok ? "text-green-600" : "text-muted-foreground"}`}
        >
          {wordCount} / {q.minWords} parole {ok && "✓"}
        </span>
        <button
          onClick={onSubmit}
          disabled={!ok || locked}
          className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold uppercase tracking-wide text-background transition hover:opacity-90 disabled:opacity-40"
        >
          Invia →
        </button>
      </div>
    </>
  );
};

/* ============ SPEAKING ============ */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: { transcript: string }[][] }) => void;
  onerror: (e: { error?: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

export const SpeakingView = ({
  q,
  transcript,
  onChange,
  onSubmit,
  locked,
}: {
  q: SpeakingQ;
  transcript: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  locked: boolean;
}) => {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recogError, setRecogError] = useState<string | null>(null);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  // Detect in-app browsers (Instagram, Facebook, TikTok, LinkedIn) where
  // the Web Speech API is unreliable even when the constructor exists.
  const isInAppBrowser =
    typeof navigator !== "undefined" &&
    /Instagram|FBAN|FBAV|FB_IAB|FBIOS|Twitter|Line|TikTok|LinkedInApp/i.test(navigator.userAgent);

  useEffect(() => {
    setRecogError(null);
    setShowTextFallback(false);
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR || isInAppBrowser) {
      setSupported(false);
      return;
    }
    const recog = new SR();
    recog.lang = q.lang ?? "en-US";
    recog.interimResults = false;
    recog.continuous = false;
    recog.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      onChange(text);
    };
    recog.onerror = (e) => {
      setRecording(false);
      const code = e?.error ?? "error";
      setRecogError(code);
      // On permission/hardware errors, surface the text fallback automatically.
      if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
        setShowTextFallback(true);
      }
    };
    recog.onend = () => setRecording(false);
    recogRef.current = recog;
    return () => recog.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  const playTarget = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(q.targetPhrase);
    u.lang = q.lang ?? "en-US";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const toggle = () => {
    if (!recogRef.current) return;
    if (recording) {
      recogRef.current.stop();
      setRecording(false);
    } else {
      onChange("");
      setRecogError(null);
      try {
        recogRef.current.start();
        setRecording(true);
      } catch {
        setRecording(false);
        setRecogError("start-failed");
        setShowTextFallback(true);
      }
    }
  };

  const useTextFallback = !supported || showTextFallback;

  return (
    <>
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Speaking
      </div>
      <h2 className="font-display text-xl font-bold leading-snug tracking-[-0.02em] text-foreground md:text-2xl">
        {q.prompt}
      </h2>
      <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-brand-blue/30 bg-brand-blue/5 p-4">
        <button
          onClick={playTarget}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white"
          aria-label="Ascolta esempio"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <p className="font-display text-lg font-semibold text-foreground md:text-xl">
          "{q.targetPhrase}"
        </p>
      </div>

      {useTextFallback ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          {isInAppBrowser ? (
            <>
              Il browser in-app (Instagram/Facebook) non supporta il microfono.
              Per registrare la voce apri il link in <strong>Safari</strong> o{" "}
              <strong>Chrome</strong>. In alternativa scrivi qui sotto la frase che
              avresti pronunciato:
            </>
          ) : recogError === "not-allowed" || recogError === "service-not-allowed" ? (
            <>
              Permesso microfono negato. Abilita il microfono nelle impostazioni del
              browser, oppure scrivi qui sotto la frase:
            </>
          ) : recogError === "audio-capture" ? (
            <>Nessun microfono rilevato. Scrivi qui sotto la frase:</>
          ) : recogError ? (
            <>Riconoscimento vocale non disponibile. Scrivi qui sotto la frase:</>
          ) : (
            <>Il tuo browser non supporta il riconoscimento vocale. Scrivi qui sotto cosa hai pronunciato:</>
          )}
          <Input
            value={transcript}
            disabled={locked}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type what you said..."
            className="mt-3 h-12 rounded-xl border-2 border-border bg-background"
          />
          <button
            onClick={onSubmit}
            disabled={!transcript.trim() || locked}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-bold uppercase tracking-wide text-background disabled:opacity-40"
          >
            Conferma
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <motion.button
            onClick={toggle}
            disabled={locked}
            animate={recording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 1, repeat: recording ? Infinity : 0 }}
            className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition ${
              recording ? "bg-destructive" : "bg-foreground hover:opacity-90"
            }`}
          >
            {recording ? <Square className="h-7 w-7" /> : <Mic className="h-8 w-8" />}
          </motion.button>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {recording ? "Sto ascoltando... parla ora" : "Tocca per registrare"}
          </p>
          <button
            type="button"
            onClick={() => setShowTextFallback(true)}
            className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Il microfono non funziona? Scrivi la risposta
          </button>
          {transcript && (
            <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Hai detto:
              </div>
              <div className="mt-1 text-base text-foreground">"{transcript}"</div>
            </div>
          )}
          {transcript && !recording && (
            <button
              onClick={onSubmit}
              disabled={locked}
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-bold uppercase tracking-wide text-background transition hover:opacity-90 disabled:opacity-40"
            >
              Conferma →
            </button>
          )}
        </div>
      )}
    </>
  );
};

/* ============ Shared option list ============ */
const OptionList = ({
  options,
  selected,
  onSelect,
  locked,
}: {
  options: string[];
  selected: number | null;
  onSelect: (i: number) => void;
  locked: boolean;
}) => (
  <div className="mt-8 grid gap-3">
    {options.map((opt, i) => {
      const isSel = selected === i;
      const letter = "abcd"[i];
      return (
        <button
          key={i}
          onClick={() => onSelect(i)}
          disabled={locked}
          className={`group flex items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all duration-200 hover:border-foreground hover:shadow-card disabled:cursor-not-allowed md:p-5 ${
            isSel ? "border-foreground bg-accent/30" : "border-border"
          }`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold uppercase transition-colors ${
              isSel ? "bg-foreground text-background" : "bg-secondary text-foreground group-hover:bg-accent"
            }`}
          >
            {letter}
          </span>
          <span className="text-base text-foreground md:text-lg">{opt}</span>
        </button>
      );
    })}
  </div>
);
