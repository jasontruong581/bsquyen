import data from '../../public/gan-tham-lang/timeline.json';
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

/** Đoạn nghiêm: từ đầu cảnh 4 (Gan không đùa) tới hết lời đọc cảnh 6. Nhãn "UNG THƯ" hiện từ đầu cảnh 5, nên ±2 giây của nó nằm trọn trong đoạn này. */
export const SERIOUS_FROM = S(4);
export const SERIOUS_TO = E(6) + 0.1;
export const serious = (t: number) => (t >= SERIOUS_FROM && t <= SERIOUS_TO) || nearUngThu(t);

/** Mốc sớm nhất sau đoạn nghiêm mà mặt cười được phép quay lại: hết ±2 giây quanh chữ "ung thư" cuối cùng và hết lời đọc cảnh 6 */
export const SMILE_AT = Math.max(E(6), UNG_THU[UNG_THU.length - 1][1] + 2.05);
