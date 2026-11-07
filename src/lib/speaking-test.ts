import { questions, type CEFRLevel, type SpeakingQ } from "@/data/questions";

export type SpeakingAttempt = { status: "recorded" | "written" | "skipped"; transcript: string };

export function speakingQuestionFor(level: CEFRLevel): SpeakingQ {
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  const candidates = questions.filter((q): q is SpeakingQ => q.type === "speaking");
  const closest = candidates.sort((a, b) => Math.abs(levels.indexOf(a.level) - levels.indexOf(level)) - Math.abs(levels.indexOf(b.level) - levels.indexOf(level)))[0];
  return closest ?? { id: 9001, level, type: "speaking", skill: "Speaking", category: "Speaking", prompt: "Presentati in inglese:", targetPhrase: "Hello, my name is Alex. Nice to meet you." };
}