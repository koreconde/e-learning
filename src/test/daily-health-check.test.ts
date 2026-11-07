import { describe, expect, it } from 'vitest';
import { transcriptMatches, shouldPauseAI } from '../../supabase/functions/daily-health-check/checks';
describe('daily audio monitoring', () => {
  it('accepts the spoken sample despite punctuation', () => { expect(transcriptMatches('The English test audio is working.')).toBe(true); });
  it('rejects unrelated or empty transcription', () => { expect(transcriptMatches('Hello world')).toBe(false); expect(transcriptMatches('')).toBe(false); });
  it('pauses automated AI checks on credit or policy failures', () => { expect(shouldPauseAI(402)).toBe(true); expect(shouldPauseAI(403)).toBe(true); expect(shouldPauseAI(429)).toBe(false); expect(shouldPauseAI(200)).toBe(false); });
});