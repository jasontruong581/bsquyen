/* Chuyển động theo thời gian của V009: độ nghiêng đĩa, xoay, căng/mềm, độ lún khi ấn, đội hình ba ngón tay, nét mặt và độ hiện của khối. */
import {lerp} from '../../src/timeline';
import {DEPTH, LUMP, SPIRAL, TAIL_TIP, geom, spiralAt} from './Geo';
import {E, S, W} from './timeline';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (p: number) => p * p * (3 - 2 * p);
/** 0 -> 1 từ mốc a, kéo dài d giây, làm mượt */
export const ramp = (t: number, a: number, d: number) => smooth(clamp01((t - a) / d));

/** Nội suy nhiều giá trị giữa các mốc [t, v1, v2, ...] (ease ở mỗi đoạn, đứng yên ở hai đầu) */
export const kf = (keys: number[][], t: number): number[] => {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) {
      const p = smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
      return keys[i].slice(1).map((v, k) => lerp(v, keys[i + 1][k + 1], p));
    }
  }
  return keys[keys.length - 1].slice(1);
};

/* ---------- mốc thời gian ---------- */
export const T = {
  badge: [1.95, 2.2, 2.45], // ba huy hiệu 1 2 3 ở cảnh 1
  benign: W(2, 'lành') - 0.1, // dấu tích "lành tính" trên khối
  before: W(2, 'trước') - 0.05,
  after: W(2, 'sau') - 0.05,
  tryHand: W(3, 'chỉ') - 0.2, // ba ngón chạm khối, hiện dấu hỏi
  know: W(3, 'biết'),
  calCircle: W(4, 'Mỗi') + 0.1,
  period: W(4, 'Còn'),
  clean: W(4, 'sạch') - 0.15,
  menopause: W(4, 'Mãn'),
  fixed: W(4, 'một', 1) - 0.1,
  pose: [W(5, 'tay') - 0.05, W(5, 'chống') - 0.05, W(5, 'giơ') - 0.05],
  shape: W(5, 'hình') - 0.1,
  dimple: W(5, 'da') - 0.1,
  nipple: W(5, 'núm') - 0.1,
  pad: W(6, 'bụng') - 0.1,
  circle0: W(6, 'xoay') - 0.15,
  coin: W(6, 'đồng') - 0.2,
  press: [W(6, 'nhẹ') - 0.2, W(6, 'vừa') - 0.2, W(6, 'mạnh') - 0.2],
  release: [E(6) + 0.2, E(6) + 0.4, E(6) + 0.6],
  spiral0: S(7) + 0.5,
  spiral1: W(7, 'sót') + 0.35,
  tail: W(7, 'và') - 0.1,
  clav: W(7, 'lên') - 0.05,
  forgot: W(7, 'chỗ') - 0.05,
  lump8: W(8, 'sờ') - 0.1,
  ruler: W(8, 'bình') - 0.35,
  note: W(8, 'ghi') - 0.15,
  moon8: W(8, 'Khối', 1) - 0.1,
  clinic: W(8, 'đi') - 0.05,
  stay: W(8, 'đừng') - 0.15,
  probe: W(9, 'siêu') - 0.2,
  film: W(9, 'chụp') - 0.2,
  needle: W(9, 'sinh') + 0.1,
  numb: W(9, 'gây') - 0.05,
  answer: W(9, 'câu') - 0.1,
  card2: W(10, 'từ') - 0.1,
  follow: W(10, 'Follow'),
};

/* ---------- độ nghiêng của đĩa: 0 = nhìn từ trên xuống, 1 = nhìn ngang (mặt cắt) ---------- */
const TILT: number[][] = [
  [0, 0],
  [S(2) + 0.1, 0],
  [S(2) + 1.6, 0.62],
  [E(2), 0.62],
  [S(3) + 3.0, 0.5],
  [T.know - 0.2, 0.3],
  [S(4) + 0.2, 0.28],
  [E(4), 0.28],
  [S(5) + 0.5, 0],
  [T.pose[1], 0.2],
  [T.pose[2] + 0.3, 0],
  [S(6) + 0.1, 0],
  [S(6) + 1.5, 0.55],
  [T.press[0] - 0.9, 0.55],
  [T.press[0] - 0.15, 1],
  [E(6) + 0.45, 1],
  [E(6) + 1.3, 0],
  [S(9) + 0.1, 0],
  [S(9) + 0.7, 0.3],
  [T.needle - 1.0, 0.3],
  [T.needle - 0.1, 1],
  [E(9) + 0.1, 1],
  [E(9) + 1.2, 0],
];
export const tiltAt = (t: number) => kf(TILT, t)[0];

/** Xoay mặt đồng hồ (độ); chỉ cảnh 5 xoay "ba góc", cảnh 10 xoay chậm */
export const psiAt = (t: number) => {
  const a = kf(
    [
      [0, 0],
      [T.pose[0] - 0.2, 0],
      [T.pose[1], 38],
      [T.pose[2], -34],
      [T.pose[2] + 1.1, 0],
    ],
    t,
  )[0];
  return a + (t > S(10) ? 6 * (t - S(10)) : 0);
};

/** Căng (+1) và mềm (-0,35) theo chu kỳ kinh, chỉ ở cảnh 2 */
export const swellAt = (t: number) => kf([[0, 0], [T.before - 0.1, 0], [T.before + 0.55, 1], [T.after - 0.05, 1], [T.after + 0.55, -0.35], [E(2) + 0.3, -0.3], [E(2) + 1.2, 0]], t)[0];

/** Pha trăng 0..1 trong chu kỳ ở cảnh 2 (kinh), cảnh 8 (qua một kỳ) */
export const moonAt = (t: number) => (t < S(3) ? clamp01((t - S(2) - 1.2) / (E(2) - S(2) - 1.6)) * 0.95 : clamp01((t - T.moon8) / 1.5) * 0.88);

/** Độ hiện của khối nhỏ: có từ cảnh 2 tới giữa cảnh 3, rồi lại có từ lúc "sờ thấy khối" ở cảnh 8 tới hết cảnh 9 */
export const lumpAlpha = (t: number) => {
  if (t < S(5)) return ramp(t, S(2) + 1.0, 0.6) * (1 - ramp(t, T.know + 0.4, 0.8));
  return ramp(t, T.lump8, 0.5) * (1 - ramp(t, E(9) + 0.1, 0.6));
};

/** Mức ấn của từng ngón (0..1) và độ lún của mặt cắt tương ứng */
export const pressAmt = (j: number, t: number) => ramp(t, T.press[j], 0.22) * (1 - ramp(t, T.release[j], 0.35));
export const dentsAt = (t: number) => [0, 1, 2].map((j) => DEPTH[j] * pressAmt(j, t));

/* ---------- đội hình ba ngón tay: [t, x, y, tỉ lệ, xoay, khoảng cách giữa các ngón] (y = chỗ bàn chân/bụng ngón) ---------- */
export type Group = {x: number; y: number; s: number; rot: number; spread: number};
const spiralStart = spiralAt(0);
const spiralEnd = spiralAt(1);
const GROUP: number[][] = [
  [0, 0, 425, 1.0, 0, 150],
  [S(2) - 0.1, 0, 425, 1.0, 0, 150],
  [S(2) + 1.3, 0, 445, 0.72, 0, 175],
  [T.tryHand - 0.2, 0, 445, 0.72, 0, 175],
  [T.tryHand + 0.6, LUMP.x, 40, 0.62, 0, 58],
  [T.know - 0.35, LUMP.x, 40, 0.62, 0, 58],
  [T.know + 0.35, 0, 445, 0.72, 0, 175],
  [E(3), 0, 440, 0.72, 0, 175],
  [S(4) + 0.6, -20, 420, 0.62, 0, 110],
  [E(4), -20, 420, 0.62, 0, 110],
  [S(5) + 0.6, -300, 355, 0.6, 0, 92],
  [E(5), -300, 355, 0.6, 0, 92],
  [T.pad - 0.4, -300, 355, 0.6, 0, 92],
  [T.pad + 0.5, 0, 12, 0.66, 0, 58],
  [T.press[0] - 0.9, 0, 12, 0.66, 0, 58],
  [T.press[0] - 0.3, 0, -70, 0.9, 0, 222],
  [E(6) + 0.5, 0, -70, 0.9, 0, 222],
  [T.spiral0, spiralStart.x, spiralStart.y, 0.55, 0, 52],
  [T.spiral1, spiralEnd.x, spiralEnd.y, 0.55, 0, 52],
  [T.tail + 0.5, TAIL_TIP.x + 12, TAIL_TIP.y + 24, 0.55, 0, 52],
  [E(7) + 0.1, TAIL_TIP.x + 12, TAIL_TIP.y + 24, 0.55, 0, 52],
  [S(8) + 1.0, -300, 380, 0.55, 0, 84],
  [E(8), -300, 380, 0.55, 0, 84],
  [S(9) + 0.7, 235, 0, 0.5, 0, 46],
  [E(9) + 0.3, 235, 0, 0.5, 0, 46],
  [S(10) + 0.5, 0, 150, 0.9, 0, 140],
  [E(10) + 1.5, 0, 150, 0.9, 0, 140],
];
const WALK0 = T.spiral0 + 0.25; // thời điểm bắt đầu đi theo đường xoắn
/** Tiến độ 0..1 của đường xoắn đi tay ở cảnh 7 */
export const spiralU = (t: number) => clamp01((t - WALK0) / (T.spiral1 - WALK0));
export const groupAt = (t: number): Group => {
  const [x0, y0, s, rot, spread] = kf(GROUP, t);
  let x = x0;
  let y = y0;
  // cảnh 3: bàn chân bám theo vị trí khối khi mặt đĩa còn nghiêng (khối nằm ở y * cos(nghiêng))
  const wl = ramp(t, T.tryHand, 0.6) * (1 - ramp(t, T.know - 0.35, 0.6));
  if (wl > 0) y = lerp(y, LUMP.y * geom(t, tiltAt(t)).ca + 8 + 5 * Math.abs(Math.sin(t * 5)) * wl, wl);
  // cảnh 6: xoay vòng nhỏ cỡ đồng xu
  const wc = ramp(t, T.circle0, 0.3) * (1 - ramp(t, T.press[0] - 0.9, 0.3));
  if (wc > 0) {
    const a = (t - T.circle0) * 7;
    x += wc * 15 * Math.cos(a);
    y += wc * 8 * Math.sin(a);
  }
  // cảnh 7: đi theo đường xoắn từ ngoài vào trong
  const ws = ramp(t, WALK0, 0.3) * (1 - ramp(t, T.spiral1, 0.2));
  if (ws > 0) {
    const p = spiralAt(spiralU(t));
    x = lerp(x, p.x, ws);
    y = lerp(y, p.y + 6, ws);
  }
  return {x, y, s, rot, spread};
};

/** Vị trí ngón j trong đội hình (bàn chân), đã tính độ ấn ở cảnh 6 */
export const fingerAt = (j: number, t: number) => {
  const g = groupAt(t);
  let y = g.y + 3 * Math.sin(t * 3.1 + j * 1.7);
  const pr = pressAmt(j, t);
  if (pr > 0) y = g.y + 3 * Math.sin(t * 3.1 + j * 1.7) * (1 - pr) + pr * (70 + DEPTH[j] - 3 * Math.sin(t * 3.1 + j * 1.7));
  return {x: g.x + (j - 1) * g.spread * g.s, y: y + hop(j, t), s: g.s, rot: g.rot};
};

/** Nhún lên xuống: chào ở cảnh 1 và 10, gật ở cảnh 3, nhảy vui lúc xong cảnh 7 */
const hop = (j: number, t: number) => {
  const bounce = (a: number, d: number, amp: number, freq: number, delay = 0) => {
    const k = (t - a - delay) / d;
    return k > 0 && k < 1 ? -amp * Math.abs(Math.sin(k * Math.PI * freq)) : 0;
  };
  return (
    bounce(0.2, 2.4, 22, 4, j * 0.12) +
    bounce(T.know, 1.0, 16, 2, j * 0.08) +
    bounce(T.follow, 2.7, 30, 5, j * 0.1) +
    bounce(T.fixed + 0.3, 1.0, 12, 2, j * 0.08)
  );
};

/** Độ nghiêng thân lúc chào/gật (độ) */
export const wobble = (j: number, t: number) => {
  const wave = (a: number, d: number, amp: number) => (t > a && t < a + d ? amp * Math.sin((t - a) * 9 + j * 1.2) * Math.sin(((t - a) / d) * Math.PI) : 0);
  return wave(0.3, 2.3, 9) + wave(T.follow, 2.7, 11) + wave(T.know, 0.9, 6);
};

export type Mood = 'grin' | 'smile' | 'think' | 'serious';
export const moodAt = (j: number, t: number): Mood => {
  if (t < S(2)) return 'grin';
  if (t >= T.tryHand && t < T.know - 0.2) return 'think';
  if (t >= T.forgot - 0.1 && t < E(7)) return 'think';
  if (t >= T.lump8 && t < W(9, 'câu') + 0.2) return 'serious';
  if (j === 2 && t >= T.press[2] - 0.1 && t < T.release[2] + 0.4) return 'serious';
  if (t >= T.pad && t < T.press[0] - 0.3) return 'grin';
  if (t >= T.follow - 0.2) return 'grin';
  return 'smile';
};

/** Hướng nhìn của mắt (-1..1) */
export const lookAt = (t: number): [number, number] => {
  if (t < S(2)) return [0, 0.1];
  if (t >= S(5) && t < T.pad - 0.4) return [0.85, -0.25];
  if (t >= S(8) + 0.8 && t < S(9) + 0.5) return [0.75, -0.35];
  if (t >= S(9) + 0.5 && t < E(9)) return [-0.85, 0.2];
  return [0.2, 0.2];
};

/** Bụng ngón sáng cam (cảnh 6: "dùng bụng ba ngón") */
export const padGlow = (t: number) => ramp(t, T.pad, 0.25) * (1 - ramp(t, T.press[0] - 0.8, 0.4)) * 0.9;
