import data from '../../public/thuoc-la/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');

/** Mốc kết thúc của chữ đầu tiên (hoặc thứ `nth`) bắt đầu bằng `prefix` trong cảnh n */
export const WE = (n: number, prefix: string, nth = 0) => {
  const hits = timeline.scenes[n - 1].words.filter((w) => norm(w.text).startsWith(norm(prefix)));
  if (!hits[nth]) throw new Error(`Cảnh ${n}: không có chữ "${prefix}"`);
  return hits[nth].t1;
};

/* Mọi chữ "ung thư" trong lời đọc: [bắt đầu "ung", kết thúc "thư"]. Quanh các mốc này (±2 giây) không có mặt cười,
   bong bóng thoại hay tiếng vui (docs/video-giong-dieu.md, quy tắc 2). */
export const UNG_THU: [number, number][] = timeline.scenes.flatMap((s) =>
  s.words.flatMap((w, i) => (norm(w.text) === 'ung' && s.words[i + 1] && norm(s.words[i + 1].text) === 'thư' ? [[w.t0, s.words[i + 1].t1] as [number, number]] : [])),
);

/** t có nằm trong khoảng ±2 giây quanh một chữ "ung thư" không (thêm `pad` giây dự phòng) */
export const nearUngThu = (t: number, pad = 0) => UNG_THU.some(([a, b]) => t >= a - 2 - pad && t <= b + 2 + pad);

/** Mốc sớm nhất sau cảnh 8 mà mặt cười được phép quay lại: hết ±2 giây quanh chữ "ung thư" cuối cùng và hết lời đọc cảnh 8 */
export const SMILE_AT = Math.max(E(8), UNG_THU[UNG_THU.length - 1][1] + 2.05);

/** Khói chỉ lém lỉnh ở cảnh 1, 3, 4: trung tính ở cảnh 2, từ cảnh 5 trở đi và trong ±2 giây quanh chữ "ung thư" */
export const khoiMood = (t: number) => (t >= S(5) || (t >= S(2) - 0.4 && t < S(3)) || nearUngThu(t) ? ('tn' as const) : ('lem' as const));
