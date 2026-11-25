export type TimedWord = {text: string; t0: number; t1: number};
export type DisplayToken = {text: string; n: number};
export function buildPhatAm(text: string, phatAm?: Record<string, string>): {ttsText: string; tokens: DisplayToken[]};
export function mergePhatAm(ttsWords: TimedWord[], tokens: DisplayToken[]): TimedWord[];
