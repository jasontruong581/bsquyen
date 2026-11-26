/* Chuyển động của ống soi (Soi) theo thời gian: vị trí đầu soi trên đường tâm đại tràng, khoảng cách tới polyp, hướng mặt.
   Dùng chung cho camera (World.tsx), Soi.tsx và index.tsx. */
import {lerp} from '../../src/timeline';
import {E, S, W} from './timeline';
import {U_DESC, U_POLYP, U_RECTUM, U_SIGMA, pathAt} from './Path';

export const smooth = (p: number) => p * p * (3 - 2 * p);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Nội suy mượt giữa các mốc [t, giá trị] (đứng yên ở hai đầu) */
export const track = (keys: [number, number][], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
  }
  return keys[keys.length - 1][1];
};

/* ---------- cảnh 1–5: đầu soi đứng ở bên phải polyp, tiến lại gần dần ---------- */
const GAP_KEYS: [number, number][] = [
  [0, 267],
  [S(2) + 1, 250],
  [E(2), 205],
  [S(3), 200],
  [E(5) + 0.3, 195],
];
export const gapAt = (t: number) => track(GAP_KEYS, t);

/* Sau cảnh 5, Soi đi dọc đại tràng (thấy rõ khi camera lùi ra ở cảnh 6–7), nghỉ ở đoạn sigma cảnh 8, vào trực tràng cảnh 9, quay về sigma cảnh 10 */
const TOUR: [number, number][] = [
  [S(6) + 0.3, U_POLYP + 195],
  [S(7) + 0.2, U_POLYP + 520],
  [E(7), U_DESC + 40],
  [S(8) + 1.0, U_SIGMA],
  [E(8) + 0.1, U_SIGMA],
  [S(9) + 0.8, U_RECTUM - 40],
  [E(9) + 0.1, U_RECTUM - 40],
  [S(10) + 1.8, U_SIGMA + 30],
];
/** Độ dài u (trên đường tâm) của đầu soi */
export const soiU = (t: number) => (t < S(6) + 0.3 ? U_POLYP + gapAt(t) : track(TOUR, t));

/** Hướng mặt: +1 mặt quay sang trái màn hình (ống đi về bên phải), -1 quay sang phải. Làm trơn trong ±0,2s để lật mượt */
export const faceDir = (t: number, rot: (t: number) => number) => {
  let sum = 0;
  const n = 9;
  for (let i = 0; i < n; i++) {
    const tt = t - 0.2 + (0.4 * i) / (n - 1);
    const p = pathAt(soiU(tt));
    const r = (rot(tt) * Math.PI) / 180;
    const sx = p.tx * Math.cos(r) - p.ty * Math.sin(r);
    sum += sx >= -0.05 ? 1 : -1;
  }
  return sum / n;
};

/* ---------- cảm xúc: vui/cười chỉ ngoài vùng nghiêm ---------- */
export type SoiMood = 'calm' | 'smile' | 'serious' | 'happy';
export const soiMood = (t: number): SoiMood => {
  if (t < 4.2) return 'calm'; // cảnh 1 và ±2 giây quanh "ung thư": không cười
  if (t < W(3, 'hoá') - 0.5) return 'smile';
  if (t < E(4) + 0.3) return 'serious'; // "hoá ác", "ung thư" và cảnh 4
  if (t < S(6)) return 'happy'; // tin tốt: cắt polyp
  if (t < S(8)) return 'smile';
  if (t < S(9)) return 'happy';
  if (t < E(9) + 0.3) return 'serious';
  return 'happy';
};
