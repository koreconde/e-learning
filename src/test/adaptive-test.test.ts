import { describe, expect, it } from 'vitest';
import { adaptiveBank } from '@/data/adaptive-bank';
import { adaptiveResult, nextAdaptiveQuestion, shouldFinishAdaptive, ADAPTIVE_MAX, type AdaptiveResponse, type TestedSkill } from '@/lib/adaptive-test';

function simulate(correct: boolean) {
  const responses: AdaptiveResponse[] = [];
  while (!shouldFinishAdaptive(responses)) {
    const q = nextAdaptiveQuestion(responses);
    if (!q) break;
    responses.push({ id: q.id, correct, skill: q.skill as TestedSkill });
  }
  return responses;
}
describe('adaptive placement', () => {
  it('raises difficulty after demonstrated correct answers', () => {
    const q = nextAdaptiveQuestion([]);
    expect(q?.level).toBe('B1');
    const responses = simulate(true);
    expect(adaptiveBank.find(q => q.id === responses[8].id)?.level).toBe('C1');
    expect(adaptiveResult(responses).level).toBe('C1');
  });
  it('reduces difficulty after incorrect answers', () => {
    const responses = simulate(false);
    expect(adaptiveBank.find(q => q.id === responses[4].id)?.level).toBe('A1');
    expect(adaptiveResult(responses).level).toBe('A1');
  });
  it('uses at least 16 and no more than 24 distinct items', () => {
    for (const correct of [true, false]) {
      const responses = simulate(correct);
      expect(responses.length).toBeGreaterThanOrEqual(16);
      expect(responses.length).toBeLessThanOrEqual(24);
      expect(new Set(responses.map(r => r.id)).size).toBe(responses.length);
    }
    expect(nextAdaptiveQuestion(Array.from({length: ADAPTIVE_MAX}, () => ({id: 1, correct: false, skill: 'Grammar'})))).toBeUndefined();
  });
  it('includes reading and listening evidence, not copied speaking or word-count writing', () => {
    const responses = simulate(true);
    for (const skill of ['Grammar', 'Vocabulary', 'Reading', 'Listening']) {
      expect(responses.filter(r => r.skill === skill).length).toBeGreaterThanOrEqual(3);
    }
    expect(adaptiveBank.some(q => q.type === 'writing' || q.type === 'speaking')).toBe(false);
  });
  it('reports the actual number of administered questions', () => {
    const responses = simulate(true);
    expect(adaptiveResult(responses).total).toBe(responses.length);
    expect(adaptiveResult(responses).score).toBe(responses.length);
  });
  it('labels a timed-out short attempt as limited evidence', () => {
    expect(adaptiveResult([{id: 5, correct: false, skill: 'Grammar'}]).confidence).toBe('limited');
    expect(shouldFinishAdaptive([])).toBe(false);
  });
  it('has unique identifiers and complete skill coverage at every band', () => {
    expect(new Set(adaptiveBank.map(q => q.id)).size).toBe(adaptiveBank.length);
    for (const level of ['A1','A2','B1','B2','C1']) for (const skill of ['Grammar','Vocabulary','Reading','Listening']) {
      expect(adaptiveBank.filter(q => q.level === level && q.skill === skill).length).toBeGreaterThanOrEqual(2);
    }
  });
});