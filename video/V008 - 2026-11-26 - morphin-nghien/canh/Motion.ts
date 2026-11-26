/* Chuyển động theo thời gian dùng chung: Tin chạy trên đường dây, núm âm lượng, độ "to" của cơn đau, mốc xuất hiện các trạm và biển báo. */
import {lerp} from '../../src/timeline';
import {U_BRAIN, U_END, pathAt, uNear} from './Path';
import {E, S, W} from './timeline';

export const smooth = (p: number) => p * p * (3 - 2 * p);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Nội suy mượt giữa các mốc [t, giá trị] (đứng yên ở hai đầu, ease ở mỗi đoạn) */
export const track = (keys: [number, number][], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
  }
  return keys[keys.length - 1][1];
};

/* ---------- mốc thời gian ---------- */
export const T = {
  run0: W(2, 'chạy') - 0.45, // Tin bắt đầu chạy khỏi chỗ đau
  arrive: W(2, 'não') + 0.1, // tới chân não
  st: [W(3, 'chèn') - 0.2, W(3, 'di') - 0.1, W(3, 'dây') - 0.05, W(3, 'hoặc') - 0.05], // bốn trạm phát tín hiệu
  tag: [W(4, 'qua') + 0.05, W(4, 'ba') - 0.05, W(4, 'bậc') - 0.05], // ba nấc trên bảng tổng đài lần lượt sáng
  morphin: W(4, 'Morphin') - 0.05,
  heavy: W(4, 'nặng') - 0.1,
  essential: W(4, 'thiết') - 0.1,
  sign: [W(6, 'quen') - 0.15, W(6, 'lệ') - 0.15, W(6, 'nghiện', 1) - 0.2], // ba biển báo
  split: W(8, 'Dùng', 1) - 0.3, // biển báo thứ ba tách riêng ("Dùng đúng chỉ định...")
  shield: W(8, 'đúng') - 0.2,
  doc: W(9, 'nói') - 0.3, // bàn tay chỉ vào "BÁC SĨ"
  caution: S(9) + 0.1,
};

/* ---------- độ "to" của cơn đau: 1 = lớn, hạ dần theo từng nấc, thấp nhất khi tới nấc 3 (morphin) ---------- */
const VOL: [number, number][] = [
  [0, 1],
  [T.tag[0] - 0.3, 1],
  [T.tag[0] + 0.3, 0.84],
  [T.tag[1] + 0.3, 0.6],
  [T.morphin, 0.6],
  [T.morphin + 0.9, 0.2],
  [S(11), 0.2],
  [S(11) + 2.4, 0.1],
];
export const loud = (t: number) => track(VOL, t);

/* ---------- núm âm lượng: góc (độ, 0 = thẳng lên, dương theo chiều kim đồng hồ); ba nấc ở -50, 0, +50 ---------- */
export const NOTCH = [-50, 0, 50];
const KNOB: [number, number][] = [
  [0, -104],
  [T.tag[0] - 0.05, -104],
  [T.tag[0] + 0.3, NOTCH[0]],
  [T.tag[1] + 0.1, NOTCH[0]],
  [T.tag[2] + 0.25, NOTCH[1]],
  [T.morphin - 0.05, NOTCH[1]],
  [T.morphin + 0.45, NOTCH[2]],
];
export const knobAngle = (t: number) => track(KNOB, t) + (t > T.morphin + 0.45 ? 1.2 * Math.sin(t * 1.3) : 0);

/* ---------- Tin: vị trí theo độ dài u trên đường dây (dây thần kinh, qua não, ra dây cáp) ---------- */
export const U_STOP = U_BRAIN - 90; // dừng ở cổ, gần não, lúc đưa tin
export const U_REST = U_END - 62; // đứng trên dây cáp cạnh bảng tổng đài
export const U_SIGN = uNear(716, 790); // đứng cạnh các biển báo ở cột sống
export const U_SLEEP = U_END - 120; // nằm ngủ giữa dây cáp
const TIN_U: [number, number][] = [
  [0, 44],
  [T.run0, 44],
  [T.arrive, U_STOP],
  [S(3) + 0.4, U_STOP],
  [S(3) + 3.8, U_SIGN], // đi chậm xuống đứng cạnh cột sống, im lặng nhìn các trạm
  [S(3) + 5.3, U_SIGN],
  [S(4) + 0.75, U_REST],
  [E(4) - 0.1, U_REST],
  [E(5) - 0.1, U_REST],
  [S(6) + 0.85, U_SIGN],
  [E(9) + 0.2, U_SIGN],
  [S(10) + 1.35, U_REST],
  [E(10) + 0.3, U_REST],
  [S(11) + 1.3, U_SLEEP], // đi vài bước ra giữa dây cáp rồi nằm xuống ngủ
];
export const tinU = (t: number) => track(TIN_U, t);

export type TinPose = 'stand' | 'run' | 'sit' | 'sleep';
export const tinPose = (t: number): TinPose => {
  const sp = Math.abs(tinU(t + 0.06) - tinU(t - 0.06)) / 0.12;
  if (sp > 190) return 'run';
  if (t >= S(11) + 1.5) return 'sleep';
  if (t >= T.morphin + 1.0 && t < S(6) + 0.1) return 'sit';
  return 'stand';
};
/** Mức lo lắng của Tin 0..1 (nhăn mày, vã mồ hôi khi cơn đau to; dịu dần khi âm lượng hạ) */
export const tinWorry = (t: number) => clamp01(loud(t) * 0.95 + (t >= S(6) && t < S(8) ? 0.1 : 0));

/** Hướng mặt: +1 quay sang phải màn hình, -1 sang trái; đứng yên thì quay sang trái (vào phía cơ thể/bảng); làm trơn ±0,15s để lật mượt */
export const tinFace = (t: number) => {
  let sum = 0;
  const n = 7;
  for (let i = 0; i < n; i++) {
    const tt = t - 0.15 + (0.3 * i) / (n - 1);
    const du = (tinU(tt + 0.06) - tinU(tt - 0.06)) / 0.12;
    const p = pathAt(tinU(tt));
    const vx = p.tx * du;
    sum += Math.abs(du) > 190 && Math.abs(vx) > 0.25 * Math.abs(du) ? (vx > 0 ? 1 : -1) : -1;
  }
  return sum / n;
};

export const tinPos = (t: number) => {
  const p = pathAt(tinU(t));
  return {x: p.x, y: p.y, tx: p.tx, ty: p.ty};
};
