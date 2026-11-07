import type { CEFRLevel, SpeakingQ } from "@/data/questions";

export type SpeakingAttempt = { status: "recorded" | "written" | "skipped"; transcript: string };

export function speakingQuestionFor(level: CEFRLevel): SpeakingQ {
  const prompts: Record<CEFRLevel, [string, string]> = {
    A1: ["Presentati in inglese: nome e città in cui vivi.", "Hello, my name is Alex. I live in London."],
    A2: ["Descrivi in inglese una cosa che fai nel tempo libero.", "In my free time, I enjoy walking because it helps me relax."],
    B1: ["Racconta in inglese un viaggio e cosa ti è piaciuto.", "Last summer I visited the coast. I enjoyed exploring small villages and trying local food."],
    B2: ["Esprimi in inglese un vantaggio e uno svantaggio del lavoro da casa.", "Working from home offers flexibility, although it can make collaboration more challenging."],
    C1: ["Esprimi in inglese la tua opinione sull'intelligenza artificiale nell'istruzione, con una riserva.", "While artificial intelligence can make education more accessible, its value depends on how thoughtfully it complements human teaching."],
  };
  const [prompt, targetPhrase] = prompts[level];
  return { id: 9001, level, type: "speaking", skill: "Speaking", category: "Speaking", prompt, targetPhrase };
}