import { adaptiveBank } from '@/data/adaptive-bank';
import type { CEFRLevel, Question, Result } from '@/data/questions';

export const ADAPTIVE_MIN = 16;
export const ADAPTIVE_MAX = 24;
export const TEST_SKILLS = ['Grammar', 'Vocabulary', 'Reading', 'Listening'] as const;
export type TestedSkill = typeof TEST_SKILLS[number];
export interface AdaptiveResponse { id: number; correct: boolean; skill: TestedSkill }
const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

// A provisional Bayesian routing estimate, not a calibrated CEFR exam.
// Distractor guessing is modelled for choices; unanswered items still count.
export function estimateAbility(responses: AdaptiveResponse[]) {
  const grid = Array.from({ length: 61 }, (_, i) => -1 + i / 10);
  const logWeights = grid.map(theta => {
    let log = -0.5 * ((theta - 1.5) / 1.5) ** 2;
    for (const response of responses) {
      const q = adaptiveBank.find(q => q.id === response.id);
      if (!q) continue;
      const guess = q.type === 'multiple-choice' || q.type === 'listening' ? 1 / q.options.length : 0;
      const probability = guess + (1 - guess) / (1 + Math.exp(-1.7 * (theta - levels.indexOf(q.level))));
      log += Math.log(response.correct ? probability : 1 - probability);
    }
    return log;
  });
  const peak = Math.max(...logWeights);
  const weights = logWeights.map(log => Math.exp(log - peak));
  const sum = weights.reduce((a, b) => a + b, 0);
  const mean = grid.reduce((a, theta, i) => a + theta * weights[i], 0) / sum;
  const deviation = Math.sqrt(grid.reduce((a, theta, i) => a + (theta - mean) ** 2 * weights[i], 0) / sum);
  return { mean, deviation };
}

export function nextAdaptiveQuestion(responses: AdaptiveResponse[], bank: Question[] = adaptiveBank): Question | undefined {
  if (responses.length >= ADAPTIVE_MAX) return undefined;
  const counts = Object.fromEntries(TEST_SKILLS.map(skill => [skill, responses.filter(r => r.skill === skill).length]));
  const minimum = Math.min(...Object.values(counts));
  const availableSkills = TEST_SKILLS.filter(skill => bank.some(q => q.skill === skill && !responses.some(r => r.id === q.id)));
  const skill = availableSkills.sort((a, b) => counts[a] - counts[b])[0];
  const { mean } = estimateAbility(responses);
  const available = bank.filter(q => q.skill === skill && !responses.some(r => r.id === q.id));
  return available.sort((a, b) => Math.abs(levels.indexOf(a.level) - mean) - Math.abs(levels.indexOf(b.level) - mean))[0];
}

export function shouldFinishAdaptive(responses: AdaptiveResponse[]) {
  if (responses.length >= ADAPTIVE_MAX) return true;
  if (responses.length < ADAPTIVE_MIN) return false;
  if (TEST_SKILLS.some(skill => responses.filter(r => r.skill === skill).length < 3)) return false;
  return estimateAbility(responses).deviation <= 0.55;
}

export function adaptiveResult(responses: AdaptiveResponse[]): Result {
  const { mean, deviation } = estimateAbility(responses);
  const index = Math.max(0, Math.min(4, Math.round(mean)));
  // Never claim a band above the hardest actually demonstrated difficulty.
  const demonstrated = responses.filter(r => r.correct).map(r => adaptiveBank.find(q => q.id === r.id)).filter((q): q is Question => !!q);
  const highest = Math.max(0, ...demonstrated.map(q => levels.indexOf(q.level)));
  const level = levels[Math.min(index, highest)];
  const coverage = TEST_SKILLS.every(skill => responses.filter(r => r.skill === skill).length >= 3);
  const confidence = responses.length < ADAPTIVE_MIN || !coverage ? 'limited' : deviation <= 0.55 ? 'moderate' : 'limited';
  const descriptions: Record<CEFRLevel, string> = {
    A1: 'Le risposte suggeriscono di consolidare le basi: frasi quotidiane, lessico essenziale e brevi messaggi.',
    A2: 'Le risposte suggeriscono una base per comprendere situazioni familiari. Il prossimo passo è affrontare messaggi più articolati.',
    B1: 'Le risposte suggeriscono una comprensione intermedia di contesti quotidiani e lavorativi. Puoi lavorare su precisione e inferenze.',
    B2: 'Le risposte suggeriscono una buona comprensione di testi e messaggi più complessi. Sfumature, registro e impliciti sono il prossimo passo.',
    C1: 'Le risposte suggeriscono una comprensione avanzata, anche di argomentazioni e significati impliciti. Da confermare con una valutazione completa.',
  };
  return {
    level, score: responses.filter(r => r.correct).length, total: responses.length,
    description: descriptions[level], confidence,
    skills: TEST_SKILLS.map(skill => ({ skill, correct: responses.filter(r => r.skill === skill && r.correct).length, total: responses.filter(r => r.skill === skill).length })),
  };
}