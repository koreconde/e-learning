export interface Check { name: string; ok: boolean; detail: string }
export function transcriptMatches(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return ["english", "test", "audio", "working"].every(word => words.includes(word));
}
export function shouldPauseAI(status: number): boolean {
  return status === 402 || status === 403;
}