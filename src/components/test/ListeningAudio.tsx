import { useEffect, useRef, useState } from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadTestAudio } from "@/lib/test-audio";
import { ServiceFailure } from "@/lib/service-errors";

export function ListeningAudio({ text, label = "Riproduci audio" }: { text: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    setLoading(true);
    setFailed(false);
    setBlockedMessage("");
    setPlaying(false);
    setPlayed(0);
    audio.onplaying = () => { if (active) setPlaying(true); };
    audio.onpause = audio.onended = () => { if (active) setPlaying(false); };
    audio.onerror = () => { if (active) { setFailed(true); setPlaying(false); } };
    void loadTestAudio(text).then((url) => {
      if (!active) return;
      audio.src = url;
      audio.load();
      setLoading(false);
    }).catch((error) => {
      if (!active) return;
      console.error("Audio preparation error", error);
      setLoading(false);
      setFailed(true);
      if (error instanceof ServiceFailure && !error.retryable) setBlockedMessage(error.message);
    });
    return () => {
      active = false;
      audio.onplaying = audio.onpause = audio.onended = audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [text, attempt]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || loading || blockedMessage) return;
    if (!audio.paused) { audio.pause(); return; }
    if (failed && !audio.src) { setAttempt((value) => value + 1); return; }
    setFailed(false);
    audio.currentTime = 0;
    // No await before play(): Safari needs the original touch activation.
    void audio.play().then(() => setPlayed((value) => value + 1)).catch((error) => {
      console.error("Audio playback error", error);
      setFailed(true);
      setPlaying(false);
    });
  };

  return (
    <div className="mt-6 flex items-center gap-4 rounded-lg border-2 border-border bg-secondary p-4">
      <Button size="icon" onClick={toggle} disabled={loading || !!blockedMessage} aria-label={playing ? "Ferma audio" : label} className="h-14 w-14 shrink-0 rounded-full">
        {loading ? <Loader2 className="animate-spin" /> : playing ? <Square /> : <Volume2 />}
      </Button>
      <div className="min-w-0 text-sm text-muted-foreground" role="status">
        <div className="font-semibold text-foreground">{loading ? "Preparazione audio…" : playing ? "Riproduzione in corso…" : "Ascolta l’audio"}</div>
        <div>{blockedMessage || (failed ? "Audio non disponibile. Tocca per riprovare." : `Riproduzioni: ${played}`)}</div>
      </div>
    </div>
  );
}