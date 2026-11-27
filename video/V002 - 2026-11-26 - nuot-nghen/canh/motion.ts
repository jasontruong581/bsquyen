/* Chuyển động: đường đi của Cơm, các chỗ ống bị bóp, nắp thanh quản, nước, van, ống nội soi và máy quay (toàn bộ tính từ mốc lời đọc). */
import {P, lerp} from '../../src/timeline';
import {type Sq, Y_VALVE} from './geometry';
import {S, W} from './timeline';

/* ---------- mốc chính ---------- */
export const closeAt = W(2, 'đóng') - 0.1; // nắp thanh quản đóng
export const reopenAt = S(3) - 0.2; // mở lại sau khi cơm qua
export const valveOpenAt = W(4, 'mở') - 0.1;
export const valveShutAt = W(4, 'đóng') - 0.05;
const slideAt = closeAt + 0.55; // cơm trượt xuống sau khi nắp đã đóng
const stuckAt = S(5) + 0.7; // cơm thứ hai kẹt lại
const waterAt = W(5, 'nước') - 0.15;
const pushAt = W(5, 'trôi') + 0.05;
export const scopeStart = W(9, 'chỉ') - 0.1;

/* ---------- đường đi của một vật theo các mốc [t, x, y, kiểu nội suy: 0 thẳng, 1 mượt, 2 tăng tốc, 3 giảm tốc] ---------- */
type Key = [number, number, number, number];
const track = (keys: Key[], t: number) => {
  if (t <= keys[0][0]) return {x: keys[0][1], y: keys[0][2]};
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < b[0]) {
      const p = (t - a[0]) / (b[0] - a[0]);
      const q = a[3] === 1 ? p * p * (3 - 2 * p) : a[3] === 2 ? p * p : a[3] === 3 ? 1 - (1 - p) ** 2 : p;
      return {x: lerp(a[1], b[1], q), y: lerp(a[2], b[2], q)};
    }
  }
  const l = keys[keys.length - 1];
  return {x: l[1], y: l[2]};
};

/* Cơm thứ nhất: trong miệng (khởi động) -> họng -> thực quản -> van -> dạ dày */
const com1Keys: Key[] = [
  [0, 350, 760, 1],
  [W(2, 'đầu') - 0.05, 350, 760, 1],
  [W(2, 'đầu') + 0.55, 520, 766, 0],
  [closeAt - 0.15, 622, 835, 1],
  [slideAt, 622, 835, 1],
  [slideAt + 0.8, 640, 990, 0],
  [S(3) - 0.5, 640, 1090, 1],
  [S(3) + 0.05, 640, 1090, 1],
  [S(3) + 0.8, 640, 1260, 0],
  [W(3, 'răng'), 640, 2400, 0],
  [valveOpenAt - 0.15, 640, 2735, 1],
  [valveOpenAt + 0.4, 640, 2770, 1],
  [valveOpenAt + 0.55, 640, 2790, 2],
  [valveOpenAt + 1.0, 648, 3138, 1],
  [valveOpenAt + 1.35, 650, 3152, 1],
];
export const com1 = (t: number) => {
  const p = track(com1Keys, t);
  const hop = 15 * Math.abs(Math.sin(t * Math.PI * 1.6)) * (1 - P(t, W(2, 'đầu') - 0.5, 0.45)) * P(t, 0.15, 0.2);
  const inTube = t > valveOpenAt + 1.4;
  const bob = inTube ? 5 * Math.sin(t * 2.2) : 0;
  const warm = 1 - P(t, W(2, 'đầu') - 0.5, 0.45);
  return {
    x: p.x,
    y: p.y - hop + bob,
    sx: 1 + warm * 0.06 * Math.sin(t * Math.PI * 3.2),
    sy: 1 - warm * 0.06 * Math.sin(t * Math.PI * 3.2),
    rot: t > S(3) && t < valveOpenAt ? 5 * Math.sin(t * 6) : 0,
  };
};
export const com1Mood = (t: number) => (t < S(5) ? ('vui' as const) : ('tn' as const));

/* Cơm thứ hai (cảnh 5): kẹt giữa thực quản, được ngụm nước đẩy xuống */
const com2Keys: Key[] = [
  [stuckAt - 0.6, 640, 1640, 2],
  [stuckAt, 640, 1905, 1],
  [pushAt - 0.1, 640, 1905, 1],
  [pushAt + 1.0, 640, 2205, 1],
];
export const com2 = (t: number) => {
  const p = track(com2Keys, t);
  const struggle = P(t, stuckAt + 0.2, 0.2) * (1 - P(t, pushAt - 0.1, 0.2));
  return {x: p.x + 3 * struggle * Math.sin(t * 22), y: p.y + 2 * struggle * Math.sin(t * 17), sx: 1 - 0.05 * struggle, sy: 1 + 0.04 * struggle, rot: 4 * struggle * Math.sin(t * 13)};
};
export const com2Visible = (t: number) => t >= stuckAt - 0.6 && t < S(6) + 0.6;
export const com2Mood = (t: number) => (t < stuckAt ? ('vui' as const) : t < pushAt + 1.0 ? ('lo' as const) : ('tn' as const));

/* ---------- nắp thanh quản: 0 mở (dựng lên), 1 đóng (che đường thở) ---------- */
export const epiglottis = (t: number) => P(t, closeAt, 0.22) * (1 - P(t, reopenAt, 0.25));
/** biển cấm trên đường thở: 0..1 */
export const noEntry = (t: number) => P(t, closeAt + 0.25, 0.3) * (1 - P(t, reopenAt - 0.1, 0.3));

/* ---------- van tâm vị: độ mở 0..1 (cảnh 4 mở hẳn, cảnh 7 hé một chút khi trào ngược) ---------- */
export const valveOpen = (t: number) => {
  const o1 = P(t, valveOpenAt, 0.35) * (1 - P(t, valveShutAt, 0.35));
  const o2 = 0.5 * P(t, W(7, 'lành') - 0.1, 0.5) * (1 - P(t, S(8) - 0.1, 0.5));
  return Math.max(o1, o2);
};

/* ---------- các chỗ bóp hẹp của thực quản ---------- */
export const squeezers = (t: number): Sq[] => {
  const out: Sq[] = [{y: Y_VALVE, k: 0.93 * (1 - valveOpen(t)), s: 22}];
  // nhu động: vòng bóp ngay phía trên cơm, đẩy cơm xuống
  const peri = P(t, S(3) - 0.9, 0.4) * (1 - P(t, valveOpenAt + 0.3, 0.4));
  if (peri > 0.01) {
    const c = com1(t);
    out.push({y: c.y - 105, k: 0.55 * peri, s: 34}, {y: c.y - 270, k: 0.3 * peri, s: 40});
  }
  // cơm thứ hai: ống bóp phía trên, hẹp lại phía dưới nên cơm kẹt
  if (com2Visible(t)) {
    const c = com2(t);
    const stuck = P(t, stuckAt - 0.1, 0.25) * (1 - P(t, pushAt - 0.05, 0.3));
    const relax = 1 - P(t, pushAt + 0.9, 0.5);
    out.push({y: c.y + 98, k: 0.64 * stuck, s: 26}, {y: c.y - 92, k: 0.4 * P(t, stuckAt - 0.1, 0.25) * relax, s: 36});
  }
  return out;
};

/* ---------- ngụm nước (cảnh 5): dải nước chạy xuống ống, đẩy cơm ---------- */
export const water = (t: number) => {
  if (t < waterAt || t > S(6) + 0.2) return null;
  const c = com2(t);
  const approach = P(t, waterAt, pushAt - waterAt - 0.05);
  const contact = c.y - 52;
  const front = t < pushAt ? lerp(contact - 620, contact, approach) : contact + (P(t, pushAt + 0.95, 0.9) * (2790 - contact));
  const fade = 1 - P(t, pushAt + 1.0, 0.7);
  return {front, top: front - 420, opacity: fade};
};

/* ---------- ống nội soi (cảnh 9): đi theo đường của cơm, từ ngoài miệng xuống thực quản ---------- */
export const SCOPE_PTS: [number, number][] = [
  [90, 760],
  [350, 760],
  [520, 766],
  [622, 835],
  [640, 900],
  [640, 990],
  [640, 2380],
];
const segLen = SCOPE_PTS.slice(1).map((p, i) => Math.hypot(p[0] - SCOPE_PTS[i][0], p[1] - SCOPE_PTS[i][1]));
const scopeTotal = segLen.reduce((a, b) => a + b, 0);
/** các điểm của ống nội soi tính đến chiều dài s, điểm cuối là đầu ống */
export const scopeAlong = (s: number) => {
  const pts: [number, number][] = [SCOPE_PTS[0]];
  let left = s;
  for (let i = 0; i < segLen.length && left > 0; i++) {
    const a = SCOPE_PTS[i];
    const b = SCOPE_PTS[i + 1];
    const u = Math.min(1, left / segLen[i]);
    pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
    left -= segLen[i];
  }
  return pts;
};
export const scopeLen = (t: number) => {
  const p = P(t, scopeStart, 3.1, (x) => 1 - (1 - x) ** 1.6);
  return scopeTotal * p;
};
export const scopeTip = (t: number) => {
  const pts = scopeAlong(scopeLen(t));
  const [x, y] = pts[pts.length - 1];
  return {x, y};
};

/* ---------- máy quay: đường cong mượt (Hermite đơn điệu) qua các mốc [t, tâm x, tâm y, độ phóng] ---------- */
type CamKey = [number, number, number, number];
const camKeys = (): CamKey[] => {
  const k: CamKey[] = [
    [0, 470, 770, 1.45],
    [2.5, 470, 770, 1.55],
    [W(2, 'đầu') - 0.1, 470, 770, 1.6],
    [W(2, 'đầu') + 0.75, 540, 790, 1.7],
    [closeAt - 0.1, 590, 855, 1.8],
    [slideAt, 600, 855, 1.8],
    [slideAt + 0.8, 615, 1010, 1.75],
    [S(3) - 0.5, 620, 1110, 1.5],
    [S(3) + 0.05, 620, 1110, 1.4],
  ];
  for (const dt of [0.8, 1.4, 2.0, 2.6, 3.2]) {
    const tt = S(3) + dt;
    k.push([tt, 620, com1(tt).y + 20, 1.25]);
  }
  k.push(
    [valveOpenAt - 0.15, 630, 2760, 1.25],
    [valveOpenAt + 0.6, 640, 2930, 1.2],
    [valveOpenAt + 1.4, 640, 2990, 1.2],
    [S(5) - 0.25, 640, 3000, 1.15],
    [S(5) + 0.45, 640, 2350, 1.2],
    [S(5) + 0.95, 640, 1990, 1.25],
    [pushAt - 0.1, 640, 1995, 1.25],
    [pushAt + 1.0, 640, 2255, 1.25],
    [S(6) + 0.2, 640, 2330, 1.2],
    [S(7) - 0.4, 640, 3000, 1.2],
    [S(8) - 0.2, 640, 3000, 1.3],
    [S(8) + 4.0, 640, 3000, 1.2],
    [S(8) + 5.5, 470, 780, 1.4],
    [S(9), 470, 780, 1.4],
    [scopeStart, 470, 780, 1.4],
  );
  for (let tt = scopeStart + 0.4; tt < S(10); tt += 0.4) {
    const p = scopeTip(tt);
    k.push([tt, lerp(470, 610, Math.min(1, Math.max(0, (p.x - 350) / 290))), p.y - 60, 1.4]);
  }
  k.push([S(10), 620, 2380, 1.3]);
  return k;
};
const CAM = camKeys();
const slope = (a: number, b: number, c: number, ta: number, tb: number, tc: number) => {
  const d0 = (b - a) / (tb - ta);
  const d1 = (c - b) / (tc - tb);
  return d0 * d1 <= 0 ? 0 : (2 * d0 * d1) / (d0 + d1);
};
export const camera = (t: number) => {
  const n = CAM.length;
  if (t <= CAM[0][0]) return {x: CAM[0][1], y: CAM[0][2], s: CAM[0][3]};
  if (t >= CAM[n - 1][0]) return {x: CAM[n - 1][1], y: CAM[n - 1][2], s: CAM[n - 1][3]};
  let i = 0;
  while (i < n - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const h = b[0] - a[0];
  const u = (t - a[0]) / h;
  const m = (j: number, c: number) => (j <= 0 || j >= n - 1 ? 0 : slope(CAM[j - 1][c], CAM[j][c], CAM[j + 1][c], CAM[j - 1][0], CAM[j][0], CAM[j + 1][0]));
  const v = [1, 2, 3].map((c) => {
    const m0 = m(i, c) * h;
    const m1 = m(i + 1, c) * h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * a[c] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[c] + (u3 - u2) * m1;
  });
  return {x: v[0], y: v[1], s: v[2]};
};
export const toScreen = (wx: number, wy: number, c: {x: number; y: number; s: number}) => ({x: 540 + (wx - c.x) * c.s, y: 700 + (wy - c.y) * c.s});
