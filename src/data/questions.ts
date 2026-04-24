export interface Question {
  id: number;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  category: string;
  text: string;
  options: string[];
  correct: number;
}

export const questions: Question[] = [
  // === A1 ===
  { id: 1, level: "A1", category: "Grammar", text: "Hello, ______ name is Marco.", options: ["I", "my", "me", "mine"], correct: 1 },
  { id: 2, level: "A1", category: "Grammar", text: "She ______ from Italy.", options: ["am", "are", "is", "be"], correct: 2 },
  { id: 3, level: "A1", category: "Vocabulary", text: "What's the opposite of 'hot'?", options: ["warm", "cool", "cold", "fresh"], correct: 2 },
  { id: 4, level: "A1", category: "Grammar", text: "I have ______ apple for breakfast.", options: ["a", "an", "the", "some"], correct: 1 },
  // === A2 ===
  { id: 5, level: "A2", category: "Grammar", text: "Yesterday I ______ to the cinema with my friends.", options: ["go", "goed", "went", "gone"], correct: 2 },
  { id: 6, level: "A2", category: "Grammar", text: "I'm ______ than my brother.", options: ["tall", "taller", "tallest", "more tall"], correct: 1 },
  { id: 7, level: "A2", category: "Vocabulary", text: "Which word means 'a place where you buy medicine'?", options: ["bakery", "butcher", "pharmacy", "stationery"], correct: 2 },
  { id: 8, level: "A2", category: "Grammar", text: "I'll see you ______ Monday morning.", options: ["in", "at", "on", "by"], correct: 2 },
  // === B1 ===
  { id: 9, level: "B1", category: "Grammar", text: "If it ______ tomorrow, we'll cancel the picnic.", options: ["rain", "rains", "will rain", "rained"], correct: 1 },
  { id: 10, level: "B1", category: "Grammar", text: "I've lived in Milan ______ 2015.", options: ["for", "since", "from", "during"], correct: 1 },
  { id: 11, level: "B1", category: "Vocabulary", text: "Choose the best synonym for 'to postpone':", options: ["cancel", "delay", "forget", "advance"], correct: 1 },
  { id: 12, level: "B1", category: "Reading", text: "\"I can't make it tonight\" most likely means:", options: ["I can't cook dinner", "I can't come", "I'm lost", "I'm confused"], correct: 1 },
  // === B2 ===
  { id: 13, level: "B2", category: "Grammar", text: "By the time we arrived, the meeting ______.", options: ["already started", "had already started", "has already started", "was already starting"], correct: 1 },
  { id: 14, level: "B2", category: "Grammar", text: "If I ______ you, I would accept the offer immediately.", options: ["am", "was", "were", "would be"], correct: 2 },
  { id: 15, level: "B2", category: "Vocabulary", text: "In business, 'to break even' means:", options: ["to make a huge profit", "to cover costs without profit or loss", "to go bankrupt", "to split a contract"], correct: 1 },
  { id: 16, level: "B2", category: "Grammar", text: "The meeting was ______ until next week.", options: ["put off", "put up", "put down", "put in"], correct: 0 },
  // === C1 ===
  { id: 17, level: "C1", category: "Grammar", text: "______ had he finished the presentation than the client called with new requirements.", options: ["No sooner", "Hardly", "Barely", "Scarcely"], correct: 0 },
  { id: 18, level: "C1", category: "Grammar", text: "Under no circumstances ______ to disclose this information.", options: ["you are allowed", "are you allowed", "you allowed", "allowed you"], correct: 1 },
  { id: 19, level: "C1", category: "Vocabulary", text: "'To throw in the towel' is an idiom meaning:", options: ["to start a fight", "to give up", "to celebrate", "to wash up"], correct: 1 },
  { id: 20, level: "C1", category: "Register", text: "Choose the most formal alternative to: 'We need to look into this matter.'", options: ["We need to check it out.", "We need to investigate this matter thoroughly.", "We gotta figure this out.", "We should have a look."], correct: 1 },
];

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export interface Result {
  level: CEFRLevel;
  score: number;
  total: number;
  description: string;
}

export function calculateLevel(correctIds: number[]): Result {
  const inRange = (from: number, to: number) =>
    correctIds.filter((id) => id >= from && id <= to).length;

  const a1 = inRange(1, 4);
  const a2 = inRange(5, 8);
  const b1 = inRange(9, 12);
  const b2 = inRange(13, 16);
  const c1 = inRange(17, 20);

  let level: CEFRLevel = "A1";
  if (a1 >= 3 && a2 >= 3 && b1 >= 3 && b2 >= 3 && c1 >= 3) level = "C1";
  else if (a1 >= 3 && a2 >= 3 && b1 >= 3 && b2 >= 3) level = "B2";
  else if (a1 >= 3 && a2 >= 3 && b1 >= 3) level = "B1";
  else if (a1 >= 3 && a2 >= 3) level = "A2";
  else level = "A1";

  const descriptions: Record<CEFRLevel, string> = {
    A1: "Sei all'inizio del tuo percorso. Comprendi e usi espressioni quotidiane di base. Con un metodo strutturato puoi fare enormi progressi in pochi mesi.",
    A2: "Hai solide basi. Puoi gestire interazioni semplici e ripetitive. Il prossimo passo è fluire nelle conversazioni quotidiane senza pensare alla grammatica.",
    B1: "Sei intermedio. Riesci a gestire la maggior parte delle situazioni che incontri viaggiando o al lavoro. Ti manca l'automatismo: la differenza tra capire e parlare spontaneamente.",
    B2: "Ottimo livello. Comprendi testi complessi e ti esprimi con sicurezza su argomenti professionali. Il salto verso il C1 è fatto di precisione, registro e naturalezza.",
    C1: "Livello avanzato. Ti esprimi in modo scorrevole e spontaneo, anche in contesti complessi. A questo punto, lavoriamo sulla padronanza: idiomi, sfumature, persuasione.",
  };

  return { level, score: correctIds.length, total: 20, description: descriptions[level] };
}