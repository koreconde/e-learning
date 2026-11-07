export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type QuestionType =
  | "multiple-choice"
  | "fill-blank"
  | "reorder"
  | "listening"
  | "writing"
  | "speaking";

export interface BaseQuestion {
  id: number;
  level: CEFRLevel;
  category: string;
  type: QuestionType;
  skill: "Grammar" | "Vocabulary" | "Reading" | "Listening" | "Speaking" | "Writing";
}

export interface MultipleChoiceQ extends BaseQuestion {
  type: "multiple-choice";
  text: string;
  options: string[];
  correct: number;
}

export interface FillBlankQ extends BaseQuestion {
  type: "fill-blank";
  text: string; // use ___ as placeholder
  accepted: string[]; // accepted answers (lowercased, trimmed)
}

export interface ReorderQ extends BaseQuestion {
  type: "reorder";
  prompt: string;
  scrambled: string[];
  correct: string[]; // ordered words/phrases
}

export interface ListeningQ extends BaseQuestion {
  type: "listening";
  audioText: string; // text-to-speech source
  prompt: string;
  options: string[];
  correct: number;
  lang?: string;
}

export interface WritingQ extends BaseQuestion {
  type: "writing";
  prompt: string;
  minWords: number;
  keywords?: string[]; // optional keywords for self-evaluation
}

export interface SpeakingQ extends BaseQuestion {
  type: "speaking";
  prompt: string;
  targetPhrase: string; // what the user should say
  lang?: string;
}

export type Question =
  | MultipleChoiceQ
  | FillBlankQ
  | ReorderQ
  | ListeningQ
  | WritingQ
  | SpeakingQ;

export const questions: Question[] = [
  // === A1 ===
  {
    id: 1,
    level: "A1",
    category: "Grammar",
    skill: "Grammar",
    type: "multiple-choice",
    text: "Hello, ______ name is Marco.",
    options: ["I", "my", "me", "mine"],
    correct: 1,
  },
  {
    id: 2,
    level: "A1",
    category: "Vocabulary",
    skill: "Vocabulary",
    type: "fill-blank",
    text: "The opposite of 'hot' is ___.",
    accepted: ["cold"],
  },
  {
    id: 3,
    level: "A1",
    category: "Listening",
    skill: "Listening",
    type: "listening",
    audioText: "My name is Sarah and I am from London.",
    prompt: "Where is the speaker from?",
    options: ["Paris", "London", "New York", "Dublin"],
    correct: 1,
  },
  {
    id: 4,
    level: "A1",
    category: "Speaking",
    skill: "Speaking",
    type: "speaking",
    prompt: "Pronuncia questa frase di presentazione:",
    targetPhrase: "Nice to meet you, my name is Alex.",
  },

  // === A2 ===
  {
    id: 5,
    level: "A2",
    category: "Grammar",
    skill: "Grammar",
    type: "multiple-choice",
    text: "Yesterday I ______ to the cinema with my friends.",
    options: ["go", "goed", "went", "gone"],
    correct: 2,
  },
  {
    id: 6,
    level: "A2",
    category: "Reorder",
    skill: "Grammar",
    type: "reorder",
    prompt: "Riordina le parole per formare una frase corretta:",
    scrambled: ["coffee", "every", "I", "morning", "drink"],
    correct: ["I", "drink", "coffee", "every", "morning"],
  },
  {
    id: 7,
    level: "A2",
    category: "Vocabulary",
    skill: "Vocabulary",
    type: "fill-blank",
    text: "A place where you buy medicine is called a ___.",
    accepted: ["pharmacy", "chemist", "drugstore"],
  },
  {
    id: 8,
    level: "A2",
    category: "Listening",
    skill: "Listening",
    type: "listening",
    audioText: "The train to Manchester leaves at half past seven from platform four.",
    prompt: "At what time does the train leave?",
    options: ["7:15", "7:30", "7:45", "8:00"],
    correct: 1,
  },

  // === B1 ===
  {
    id: 9,
    level: "B1",
    category: "Grammar",
    skill: "Grammar",
    type: "multiple-choice",
    text: "If it ______ tomorrow, we'll cancel the picnic.",
    options: ["rain", "rains", "will rain", "rained"],
    correct: 1,
  },
  {
    id: 10,
    level: "B1",
    category: "Grammar",
    skill: "Grammar",
    type: "fill-blank",
    text: "I've lived in Milan ___ 2015.",
    accepted: ["since"],
  },
  {
    id: 11,
    level: "B1",
    category: "Reorder",
    skill: "Grammar",
    type: "reorder",
    prompt: "Riordina per formare una domanda al present perfect:",
    scrambled: ["have", "you", "ever", "to", "Japan", "been"],
    correct: ["have", "you", "ever", "been", "to", "Japan"],
  },
  {
    id: 12,
    level: "B1",
    category: "Speaking",
    skill: "Speaking",
    type: "speaking",
    prompt: "Descrivi le tue ultime vacanze. Pronuncia:",
    targetPhrase: "Last summer I went to the beach with my family.",
  },

  // === B2 ===
  {
    id: 13,
    level: "B2",
    category: "Grammar",
    skill: "Grammar",
    type: "multiple-choice",
    text: "By the time we arrived, the meeting ______.",
    options: [
      "already started",
      "had already started",
      "has already started",
      "was already starting",
    ],
    correct: 1,
  },
  {
    id: 14,
    level: "B2",
    category: "Listening",
    skill: "Listening",
    type: "listening",
    audioText:
      "Although the company reported strong sales, profits actually decreased due to rising production costs.",
    prompt: "What happened to the company's profits?",
    options: ["They increased", "They stayed the same", "They decreased", "They doubled"],
    correct: 2,
  },
  {
    id: 15,
    level: "B2",
    category: "Vocabulary",
    skill: "Vocabulary",
    type: "fill-blank",
    text: "In business, 'to break ___' means to cover costs without profit or loss.",
    accepted: ["even"],
  },
  {
    id: 16,
    level: "B2",
    category: "Writing",
    skill: "Writing",
    type: "writing",
    prompt:
      "Scrivi una breve email professionale (almeno 30 parole) per richiedere un incontro con un cliente la prossima settimana.",
    minWords: 30,
    keywords: ["meeting", "next week", "available", "discuss"],
  },

  // === C1 ===
  {
    id: 17,
    level: "C1",
    category: "Grammar",
    skill: "Grammar",
    type: "multiple-choice",
    text: "______ had he finished the presentation than the client called with new requirements.",
    options: ["No sooner", "Hardly", "Barely", "Scarcely"],
    correct: 0,
  },
  {
    id: 18,
    level: "C1",
    category: "Reorder",
    skill: "Grammar",
    type: "reorder",
    prompt: "Riordina questa frase con inversione formale:",
    scrambled: ["circumstances", "no", "under", "you", "are", "to disclose", "allowed"],
    correct: ["under", "no", "circumstances", "are", "you", "allowed", "to disclose"],
  },
  {
    id: 19,
    level: "C1",
    category: "Listening",
    skill: "Listening",
    type: "listening",
    audioText:
      "Notwithstanding the board's reservations, the CEO pushed forward with the merger, a decision that would later prove controversial.",
    prompt: "What does the passage suggest about the merger decision?",
    options: [
      "It was unanimously supported",
      "It was made despite some opposition",
      "It was postponed indefinitely",
      "It was rejected by the CEO",
    ],
    correct: 1,
  },
  {
    id: 20,
    level: "C1",
    category: "Writing",
    skill: "Writing",
    type: "writing",
    prompt:
      "Argomenta in inglese (almeno 20 parole): 'Remote work is more productive than office work.' Esprimi la tua opinione con esempi.",
    minWords: 20,
    keywords: ["however", "furthermore", "in my opinion", "for instance", "therefore"],
  },
];

export interface Result {
  level: CEFRLevel;
  score: number;
  total: number;
  description: string;
  confidence?: 'limited' | 'moderate';
  skills?: { skill: string; correct: number; total: number }[];
}

export function calculateLevel(correctIds: number[]): Result {
  const inRange = (from: number, to: number) =>
    correctIds.filter((id) => id >= from && id <= to).length;

  const a1 = inRange(1, 4);
  const a2 = inRange(5, 8);
  const b1 = inRange(9, 12);
  const b2 = inRange(13, 16);
  const c1 = inRange(17, 20);

  // Highest band where the user got at least 2/4, with all lower bands also ≥2/4.
  // This avoids penalising users who skip an easy question but perform well overall.
  const bands: { level: CEFRLevel; score: number }[] = [
    { level: "A1", score: a1 },
    { level: "A2", score: a2 },
    { level: "B1", score: b1 },
    { level: "B2", score: b2 },
    { level: "C1", score: c1 },
  ];
  let level: CEFRLevel = "A1";
  for (const b of bands) {
    if (b.score >= 2) level = b.level;
    else break;
  }
  // Cap by total score: the band-by-band logic can over-promote users who
  // happened to get 2 correct answers in every band. Total score is the ceiling.
  const total = correctIds.length;
  const capByTotal: CEFRLevel =
    total >= 17 ? "C1" : total >= 13 ? "B2" : total >= 10 ? "B1" : total >= 6 ? "A2" : "A1";
  const order: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  if (order.indexOf(capByTotal) < order.indexOf(level)) level = capByTotal;

  const descriptions: Record<CEFRLevel, string> = {
    A1: "Sei all'inizio del tuo percorso. Comprendi e usi espressioni quotidiane di base. Con un metodo strutturato puoi fare enormi progressi in pochi mesi.",
    A2: "Hai solide basi. Puoi gestire interazioni semplici e ripetitive. Il prossimo passo è fluire nelle conversazioni quotidiane senza pensare alla grammatica.",
    B1: "Sei intermedio. Riesci a gestire la maggior parte delle situazioni che incontri viaggiando o al lavoro. Ti manca l'automatismo: la differenza tra capire e parlare spontaneamente.",
    B2: "Ottimo livello. Comprendi testi complessi e ti esprimi con sicurezza su argomenti professionali. Il salto verso il C1 è fatto di precisione, registro e naturalezza.",
    C1: "Livello avanzato. Ti esprimi in modo scorrevole e spontaneo, anche in contesti complessi. A questo punto, lavoriamo sulla padronanza: idiomi, sfumature, persuasione.",
  };

  return { level, score: correctIds.length, total: 20, description: descriptions[level] };
}

// Validators per question type
export function isAnswerCorrect(q: Question, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;

  switch (q.type) {
    case "multiple-choice":
    case "listening":
      return typeof answer === "number" && answer === q.correct;

    case "fill-blank": {
      if (typeof answer !== "string") return false;
      const normalized = answer.trim().toLowerCase().replace(/[.,!?;:]/g, "");
      return q.accepted.some((a) => a.toLowerCase() === normalized);
    }

    case "reorder": {
      if (!Array.isArray(answer)) return false;
      if (answer.length !== q.correct.length) return false;
      return answer.every((w, i) => w === q.correct[i]);
    }

    case "writing": {
      if (typeof answer !== "string") return false;
      const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
      return wordCount >= q.minWords;
    }

    case "speaking": {
      if (typeof answer !== "string") return false;
      // Loose match: at least 60% of target words present
      const target = q.targetPhrase
        .toLowerCase()
        .replace(/[.,!?;:]/g, "")
        .split(/\s+/);
      const said = answer.toLowerCase().replace(/[.,!?;:]/g, "").split(/\s+/);
      const matches = target.filter((w) => said.includes(w)).length;
      return matches / target.length >= 0.6;
    }
  }
}
