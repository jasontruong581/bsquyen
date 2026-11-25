import {Easing, interpolate} from 'remotion';

export type Word = {text: string; t0: number; t1: number};
export type Scene = {id: string; start: number; dur: number; audio: string; words: Word[]; labels: {text: string; t: number}[]};
export type Timeline = {total: number; scenes: Scene[]};
export const FPS = 30;

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');

/** Gói timeline của một video (đọc từ public/<slug>/timeline.json) thành các hàm tra mốc thời gian. */
export const makeTimeline = (data: unknown) => {
  const timeline = data as Timeline;
  /** Mốc bắt đầu cảnh thứ n (đánh số từ 1 như trong script.json) */
  const S = (n: number) => timeline.scenes[n - 1].start;
  /** Mốc kết thúc lời đọc của cảnh n */
  const E = (n: number) => timeline.scenes[n - 1].start + timeline.scenes[n - 1].dur;
  /** Mốc chữ đầu tiên bắt đầu bằng `prefix` trong cảnh n (lần xuất hiện thứ `nth`) */
  const W = (n: number, prefix: string, nth = 0) => {
    const hits = timeline.scenes[n - 1].words.filter((w) => norm(w.text).startsWith(norm(prefix)));
    if (!hits[nth]) throw new Error(`Cảnh ${n}: không có chữ "${prefix}"`);
    return hits[nth].t0;
  };
  return {timeline, S, E, W};
};

const ease = Easing.bezier(0.45, 0, 0.2, 1);
/** Tiến độ 0..1 từ mốc a, kéo dài d giây, có làm mượt */
export const P = (t: number, a: number, d: number, easing = ease) =>
  interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
