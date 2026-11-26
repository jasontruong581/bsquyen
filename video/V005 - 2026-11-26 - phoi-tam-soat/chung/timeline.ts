/* Mốc thời gian dùng chung cho bản 3D và bản 2D của V005 (cùng kịch bản, cùng giọng đọc, cùng nhịp). */
import data from '../../public/phoi-tam-soat/timeline.json';
import {makeTimeline, P} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');

/** Mốc kết thúc của chữ đầu tiên (hoặc thứ `nth`) bắt đầu bằng `prefix` trong cảnh n */
export const WE = (n: number, prefix: string, nth = 0) => {
  const hits = timeline.scenes[n - 1].words.filter((w) => norm(w.text).startsWith(norm(prefix)));
  if (!hits[nth]) throw new Error(`Cảnh ${n}: không có chữ "${prefix}"`);
  return hits[nth].t1;
};

export const smooth = (p: number) => p * p * (3 - 2 * p);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------- Máy CT quét từ đỉnh phổi xuống đáy (cảnh 5): vị trí quét theo thời gian, 1 = đỉnh, 0 = đáy ---------- */
export const SCAN_FROM = S(5) + 0.5;
export const SCAN_DUR = 5.2;
/** Độ cao (0..1) của lát cắt tại thời điểm t; 1 = trên đỉnh phổi, 0 = dưới đáy phổi */
export const scanLevel = (t: number) => 1 - smooth(P(t, SCAN_FROM, SCAN_DUR, (x) => x));

/** Nốt phổi nằm ở độ cao (0..1) này trên trục đỉnh-đáy phổi; lát cắt chạm nốt tại T_NODE */
export const NODULE_LEVEL = 0.34;
export const T_NODE = (() => {
  let a = SCAN_FROM;
  let b = SCAN_FROM + SCAN_DUR;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (scanLevel(m) > NODULE_LEVEL) a = m;
    else b = m;
  }
  return (a + b) / 2;
})();

/* ---------- Giọng điệu (docs/video-giong-dieu.md, quy tắc 2) ----------
   Lời đọc không có chữ "ung thư", nhưng chủ đề là tầm soát ung thư và có hình nốt bất thường:
   từ 2 giây trước khi nốt hiện (T_NODE) đến hết câu cảnh 7 (nốt đã được giải thích là phần lớn lành tính) thì
   máy CT mặt trung tính, không bong bóng hài, không tiếng vui. Cảnh 2 ("khối u nhỏ") cũng im tiếng vui. */
export const QUIET: [number, number][] = [
  [WE(2, 'giác') - 0.1, E(2) + 2],
  [T_NODE - 2, E(7) + 0.1],
];
export const quiet = (t: number, pad = 0) => QUIET.some(([a, b]) => t >= a - pad && t <= b + pad);

/** Máy CT: 'lem' lém lỉnh, 'tn' trung tính (trong vùng im lặng), 'cuoi' mỉm cười sau câu cảnh 7 */
export type CtMood = 'lem' | 'tn' | 'cuoi';
export const ctMood = (t: number): CtMood => (t >= E(7) + 0.1 ? 'cuoi' : quiet(t) ? 'tn' : 'lem');

/* Bong bóng thoại của máy CT: không cái nào nằm trong vùng im lặng */
export type Line = {at: number; dur: number; text: string; size?: number};
export const CT_LINES: Line[] = [
  {at: S(5) + 0.2, dur: 1.1, text: 'Để tôi quét cho~'},
  {at: W(8, 'Hãy') + 0.1, dur: 1.3, text: 'Hỏi bác sĩ trước nha~'},
];
for (const l of CT_LINES) {
  if (quiet(l.at - 0.05) || quiet(l.at + l.dur + 0.3)) throw new Error(`Bong bóng "${l.text}" rơi vào vùng im lặng quanh nốt phổi`);
}

/* ---------- Mốc các thẻ ---------- */
export const CARD1 = {from: S(4) + 0.35, to: E(4) + 0.55};
export const CARD2 = {from: S(9) + 0.25, to: E(9) + 0.7};
/** Hai ô so sánh X-quang / CT ở cảnh 6 */
export const PANELS = {from: W(6, 'phim') - 0.4, to: E(6) + 0.1};
/** Nhãn "sẹo cũ" và lịch hẹn ở cảnh 7 */
export const SCAR = {from: W(7, 'phần') - 0.2, to: E(7) + 0.4};
/** Nốt đổi sang màu trung tính khi bắt đầu nói "lành tính" */
export const NODE_NEUTRAL_AT = W(7, 'phần');

/* ---------- Máy CT trên trục thời gian (dùng chung hai bản): k = độ lớn 0..1, level = độ cao 0..1 (1 = trên đỉnh phổi) ---------- */
export type RingState = {k: number; level: number};
export const ringAt = (t: number): RingState => {
  if (t < S(7)) {
    const appear = smooth(P(t, S(5), 0.5, (x) => x));
    const gone = 1 - smooth(P(t, E(5) + 0.15, 0.5, (x) => x));
    return {k: appear * gone, level: t < SCAN_FROM ? 1 : scanLevel(t)};
  }
  const appear = smooth(P(t, E(7) + 0.05, 0.5, (x) => x));
  const shrink = 1 - 0.45 * smooth(P(t, S(8) + 1.0, 4.5, (x) => x));
  const gone = 1 - smooth(P(t, E(8) + 0.15, 0.6, (x) => x));
  return {k: appear * shrink * gone, level: 0.5};
};