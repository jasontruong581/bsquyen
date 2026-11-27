import data from '../../public/polyp-dai-trang/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');

/* Mọi chữ "ung thư" trong lời đọc: [bắt đầu "ung", kết thúc "thư"]. Quanh các mốc này (±2 giây) không có mặt cười,
   bong bóng thoại hay tiếng vui (docs/video-giong-dieu.md, quy tắc 2). */
export const UNG_THU: [number, number][] = timeline.scenes.flatMap((s) =>
  s.words.flatMap((w, i) => (norm(w.text) === 'ung' && s.words[i + 1] && norm(s.words[i + 1].text) === 'thư' ? [[w.t0, s.words[i + 1].t1] as [number, number]] : [])),
);

/** t có nằm trong khoảng ±2 giây quanh một chữ "ung thư" không (thêm `pad` giây dự phòng) */
export const nearUngThu = (t: number, pad = 0) => UNG_THU.some(([a, b]) => t >= a - 2 - pad && t <= b + 2 + pad);

/** Mốc bắt đầu chữ "hoá" của "hoá ác" (cảnh 3) */
export const HOA_AC = W(3, 'hoá');

/** Đoạn nghiêm: từ "hoá ác" (cảnh 3) tới hết cảnh 4 (có chữ "ung thư"), và cả cảnh 9 (máu khi đi cầu) */
export const inSeriousScene = (t: number) => (t >= HOA_AC - 0.3 && t <= E(4) + 0.1) || (t >= S(9) && t <= E(9) + 0.1);

/** Không cười, không bong bóng hài, không tiếng vui: trong đoạn nghiêm và ±2 giây quanh mọi chữ "ung thư" (kèm `pad` giây dự phòng) */
export const serious = (t: number, pad = 0) => inSeriousScene(t) || nearUngThu(t, pad);
