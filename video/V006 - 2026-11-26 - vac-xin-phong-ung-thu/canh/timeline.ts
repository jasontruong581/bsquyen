import data from '../../public/vac-xin-phong-ung-thu/timeline.json';
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

/** Hai cảnh [N] theo brief: cảnh 4 (viêm gan B → ung thư gan) và cảnh 7 (HPV → ung thư cổ tử cung), từ đầu cảnh tới hết lời đọc */
export const inSeriousScene = (t: number) => (t >= S(4) && t <= E(4) + 0.1) || (t >= S(7) && t <= E(7) + 0.1);

/** Không cười, không bong bóng hài, không tiếng vui: trong hai cảnh [N] và ±2 giây quanh mọi chữ "ung thư" (kèm `pad` giây dự phòng) */
export const serious = (t: number, pad = 0) => inSeriousScene(t) || nearUngThu(t, pad);

/** Mốc sớm nhất mà mặt cười được quay lại sau mỗi đoạn nghiêm (cho Lính gác) */
export const calmAfter = (t: number) => !serious(t, 0.1);
