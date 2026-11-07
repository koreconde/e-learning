import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Mic, Square, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListeningAudio } from "./ListeningAudio";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
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
export const ListeningView = ({ q, selected, onSelect, locked, onTextReveal }: {
  q: ListeningQ; selected: number | null; onSelect: (i: number) => void;
  locked: boolean; onTextReveal?: () => void;
}) => {
  const [showText, setShowText] = useState(false);
  return (
    <>
      <h2 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl">{q.prompt}</h2>
      <ListeningAudio key={q.id} text={q.audioText} />
      {!showText && <Button variant="link" className="mt-3 h-auto min-h-11 whitespace-normal px-0 text-left" onClick={() => { setShowText(true); onTextReveal?.(); }}>Non senti l'audio? Mostra il testo</Button>}
      {showText && <div className="mt-3 rounded-lg border-2 border-border bg-card p-4 text-base italic text-foreground">“{q.audioText}”</div>}
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
export const SpeakingView = ({ q, transcript, onChange, onSubmit, locked }: {
  q: SpeakingQ; transcript: string; onChange: (v: string) => void;
  onSubmit: () => void; locked: boolean;
}) => {
  const [state, setState] = useState<"idle" | "permission" | "recording" | "transcribing">("idle");
  const [error, setError] = useState("");
  const [textFallback, setTextFallback] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);
  const busyRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const canRecord = typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  const release = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      release();
    };
  }, [q.id]);

  const stop = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const start = async () => {
    if (busyRef.current || locked) return;
    busyRef.current = true;
    setError("");
    setState("permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => {
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
        release(); busyRef.current = false;
        if (activeRef.current) { setError("Registrazione interrotta. Riprova."); setState("idle"); }
      };
      recorder.onstop = async () => {
        release();
        if (!activeRef.current) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
        if (!blob.size) { setError("Registrazione vuota. Riprova."); setState("idle"); busyRef.current = false; return; }
        setState("transcribing");
        try {
          const audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Audio read failed"));
            reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
            reader.readAsDataURL(blob);
          });
          const { data, error: requestError } = await supabase.functions.invoke("transcribe-audio", { body: { audio, mimeType: blob.type } });
          if (requestError) throw requestError;
          if (!activeRef.current) return;
          const text = (data as { text?: string })?.text?.trim();
          if (text) onChangeRef.current(text);
          else setError("Non ho riconosciuto parole. Riprova.");
        } catch (cause) {
          console.error("Transcription error", cause);
          if (activeRef.current) setError("Trascrizione non disponibile. Riprova o scrivi la risposta.");
        } finally {
          busyRef.current = false;
          if (activeRef.current) setState("idle");
        }
      };
      recorder.start();
      onChangeRef.current("");
      setState("recording");
      timerRef.current = setTimeout(stop, 15000);
    } catch (cause) {
      release(); busyRef.current = false;
      if (!activeRef.current) return;
      const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
      setError(denied ? "Permesso microfono negato. Abilitalo nelle impostazioni del browser." : "Microfono non disponibile. Prova ad aprire il link in Safari o Chrome.");
      setState("idle");
    }
  };

  return (
    <>
      <div className="mb-4 text-xs font-semibold uppercase text-muted-foreground">Speaking</div>
      <h2 className="font-display text-xl font-bold leading-snug text-foreground md:text-2xl">{q.prompt}</h2>
      <p className="mt-4 break-words text-lg text-foreground">“{q.targetPhrase}”</p>
      <ListeningAudio text={q.targetPhrase} label="Ascolta esempio" />
      <div className="mt-6">
        {!textFallback && canRecord && <>
          <Button size="icon" variant={state === "recording" ? "destructive" : "default"} className="h-16 w-16 rounded-full" disabled={locked || state === "permission" || state === "transcribing"} onClick={() => state === "recording" ? stop() : void start()} aria-label={state === "recording" ? "Ferma registrazione" : "Registra risposta"}>
            {state === "permission" || state === "transcribing" ? <Loader2 className="animate-spin" /> : state === "recording" ? <Square /> : <Mic />}
          </Button>
          <p role="status" className="mt-3 text-sm text-muted-foreground">{state === "permission" ? "In attesa del permesso microfono…" : state === "recording" ? "Registrazione in corso…" : state === "transcribing" ? "Sto trascrivendo…" : "Microfono pronto"}</p>
        </>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        {!canRecord && <p className="text-sm text-muted-foreground">Microfono non disponibile in questo browser. Apri il link in Safari o Chrome.</p>}
        {!textFallback && <Button variant="outline" className="mt-4 min-h-11 whitespace-normal" disabled={state !== "idle" || locked} onClick={() => setTextFallback(true)}>Scrivi la risposta invece</Button>}
        {textFallback && <Input aria-label="Risposta scritta" value={transcript} disabled={locked} onChange={(event) => onChange(event.target.value)} placeholder="Write your answer in English…" className="mt-4 h-12 text-base" />}
        {!textFallback && transcript && <p className="mt-4 break-words text-foreground">Hai detto: “{transcript}”</p>}
        {transcript.trim() && state === "idle" && <Button onClick={onSubmit} disabled={locked} className="mt-4 min-h-11">Conferma risposta</Button>}
      </div>
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
