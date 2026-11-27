/* Chuyển động theo thời gian của V010: máy quay bay dọc hai làn đường, vị trí và nét mặt của Đèn, mốc xuất hiện các vật trên đường.
   Toạ độ thế giới: x ngang (dương sang phải), y cao, z dọc theo đường (z = 0 là cột mốc "chẩn đoán"). Làn xanh (điều trị) x < 0, làn cam (chăm sóc giảm nhẹ) x > 0. */
import {E, S, W} from './timeline';

export const smooth = (p: number) => p * p * (3 - 2 * p);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** Tiến độ 0..1 làm mượt từ mốc a, kéo dài d giây */
export const ramp = (t: number, a: number, d: number) => smooth(clamp01((t - a) / d));

/** Nội suy Hermite qua các mốc [t, ...giá trị]: đi liền mạch qua mốc (không khựng), đứng yên ở hai đầu */
export const spline = (keys: number[][], t: number, col: number) => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][col];
  if (t >= keys[n - 1][0]) return keys[n - 1][col];
  let i = 0;
  while (t >= keys[i + 1][0]) i++;
  const m = (k: number) => {
    const a = Math.max(0, k - 1);
    const b = Math.min(n - 1, k + 1);
    return (keys[b][col] - keys[a][col]) / (keys[b][0] - keys[a][0]);
  };
  const h = keys[i + 1][0] - keys[i][0];
  const u = (t - keys[i][0]) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * keys[i][col] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * keys[i + 1][col] + (u3 - u2) * h * m(i + 1);
};

/* ---------- mốc thời gian ---------- */
export const T = {
  hookEnd: E(1), // hết câu hỏi: gạch chéo "BỎ CUỘC?"
  lit: W(2, 'Không') - 0.1, // làn cam sáng lên
  icon: [W(2, 'nhẹ') - 0.1, W(2, 'chất') - 0.1, W(2, 'người') - 0.15], // ba biểu tượng bớt đau / bớt khó chịu / được nâng đỡ
  beams: W(3, 'điều') - 0.2, // hai chùm sáng: điều trị -> điểm tượng trưng, chăm sóc giảm nhẹ -> người
  beamCare: W(3, 'còn') - 0.1,
  flow: W(4, 'Hai') - 0.2, // hạt sáng chảy từ làn cam sang làn xanh
  back0: E(4) - 0.5, // máy quay bay ngược về cột mốc chẩn đoán
  back1: W(5, 'WHO') - 0.5,
  early: W(5, 'bắt') - 0.1,
  week: W(5, '8') - 0.1,
  card1: W(6, 'Một') - 0.05,
  card1a: W(6, 'chất') - 0.1,
  card1b: W(6, 'ít') - 0.1,
  card2: W(7, 'Nhưng') - 0.05,
  dots: W(7, 'khoảng') - 0.2,
  house: W(8, 'tại') - 0.2,
  bag: W(8, 'bác') - 0.05, // túi bác sĩ tới cửa
  enter: W(8, 'đến') - 0.1, // Đèn vào cửa sổ
  exit: W(8, 'hướng') - 0.3, // Đèn ra khỏi cửa sổ
  family: W(8, 'hướng') + 0.1,
  sign: [W(9, 'đau') - 0.25, W(9, 'ăn') - 0.2, W(9, 'hoặc') - 0.1], // ba biển hiệu ven đường
  ask: W(9, 'Điều') - 0.3, // bong bóng hỏi bác sĩ
  askEnd: E(9) + 0.45,
};

/* ---------- máy quay: mốc [t, z, x, cao, góc cúi (độ)] ---------- */
const CAM: number[][] = [
  [0, -470, 0, 450, 28],
  [S(2), -390, 10, 450, 28],
  [S(2) + 1.2, -300, 0, 450, 28],
  [S(2) + 2.35, 140, 0, 480, 28],
  [S(3), 200, 0, 450, 27],
  [S(4), 300, 0, 540, 31],
  [T.back0, 480, 0, 600, 33],
  [T.back1, -330, 0, 560, 32],
  [S(6) - 0.8, -300, 0, 560, 32],
  [S(6) + 0.3, -150, 560, 570, 31],
  [S(6) + 1.2, 150, 540, 520, 30],
  [S(6) + 2.0, 420, 420, 480, 28],  [S(7), 520, 90, 450, 27],
  [S(8), 760, 160, 430, 26],
  [T.house, 880, 300, 420, 26],
  [T.enter, 1000, 470, 400, 25],
  [T.exit + 1.0, 1060, 380, 410, 26],
  [S(9) + 1.2, 1230, 150, 430, 27],
  [S(10), 1620, 0, 480, 29],
  [E(10), 2250, 0, 560, 32],
  [E(10) + 2.6, 2420, 0, 600, 33],
];
/** Đường cong nhẹ của con đường theo z: các vật ven đường và hai làn cùng uốn theo */
export const bend = (z: number) => 150 * Math.sin(z / 1100);

export type Cam = {x: number; z: number; h: number; pitch: number};
export const camera = (t: number): Cam => {
  const z = spline(CAM, t, 1) + 8 * Math.sin(t * 0.7);
  return {
    z,
    x: spline(CAM, t, 2) + 0.7 * bend(z + 450) + 6 * Math.sin(t * 0.5),
    h: spline(CAM, t, 3) + 5 * Math.cos(t * 0.6),
    pitch: ((spline(CAM, t, 4) + 0.35 * Math.sin(t * 0.4)) * Math.PI) / 180,
  };
};
/** Tốc độ bay ngược 0..1 (để vẽ vệt tốc độ) */
export const backSpeed = (t: number) => {
  const dz = (camera(t + 0.05).z - camera(t - 0.05).z) / 0.1;
  return clamp01(-dz / 300);
};

/* ---------- Đèn ---------- */
const LANTERN_AHEAD = 330;
/** Đèn bay trước máy quay ~400, trên làn nào tuỳ cảnh (x theo làn), tà tà lắc lư */
const LX: number[][] = [
  [0, 0],
  [T.flow, 0],
  [T.flow + 1.4, 125],
  [T.flow + 3.0, -125],
  [T.flow + 4.6, 125],
  [E(4), 0],
  [T.back1, -380],
  [S(6) - 0.3, -380],
  [S(6) + 1.2, 125],
  [S(8), 130],
  [T.house, 150],
  [T.house + 0.8, 330],
  [T.enter, 430],
  [T.exit, 430],
  [T.exit + 1.2, 230],
  [S(9) + 0.4, 120],
  [S(10), 0],
  [E(10), 0],
];
const LY: number[][] = [
  [0, 220],
  [S(3), 215],
  [T.back0, 215],
  [T.back1, 320],
  [S(6) + 0.2, 320],
  [S(6) + 1.8, 300],
  [S(8) - 0.6, 300],
  [S(8) + 0.8, 205],
  [T.house, 200],
  [T.house + 0.8, 160],
  [T.enter, 130],
  [T.exit, 130],
  [T.exit + 1.2, 205],
  [S(10), 215],
];
export type LanternState = {x: number; y: number; z: number; scale: number; inside: number; tilt: number};
export const lantern = (t: number): LanternState => {
  const cam = camera(t);
  // s6–s7: Đèn bay xa hơn (lên cao trên màn hình) để không bị hai thẻ ở dải dưới che; s5: Đèn lơ lửng giữa cổng chẩn đoán và cổng ~8 tuần
  const ahead = LANTERN_AHEAD + 40 * ramp(t, S(4), 2) - 50 * ramp(t, T.back0, 1.2) + 40 * ramp(t, E(10) - 3, 3) + 230 * ramp(t, S(6) + 0.5, 1.5) * (1 - ramp(t, S(8) - 0.5, 1.5));
  const hold = ramp(t, T.back0 + 0.8, 1.2) * (1 - ramp(t, S(6) + 0.3, 1.5));
  const into = ramp(t, T.house + 0.2, T.enter - T.house) * (1 - ramp(t, T.exit, 1.0));
  const zHouse = HOUSE.z - 14;
  const zFly = (cam.z + ahead) * (1 - hold) + 160 * hold;
  const z = zFly + (zHouse - zFly) * into;
  const bob = 8 * Math.sin(t * 1.9);
  const x = spline(LX, t, 1) + bend(z) + 8 * Math.sin(t * 1.3);
  const dx = (spline(LX, t + 0.1, 1) - spline(LX, t - 0.1, 1)) / 0.2;
  return {
    x,
    y: spline(LY, t, 1) + bob,
    z,
    scale: 1 * (1 - 0.4 * into),
    inside: t >= T.enter && t < T.exit ? 1 : 0,
    tilt: Math.max(-9, Math.min(9, dx * 0.08)) + 2.2 * Math.sin(t * 1.4),
  };
};
/** 0 = trầm, ân cần; 1 = mỉm cười nhẹ. Chỉ mỉm cười khi cách chữ nặng (ung thư, giai đoạn cuối) trên 2 giây: đầu s2, đầu s4 và câu kết */
export const mood = (t: number) => ramp(t, S(2) + 0.2, 0.6) * (1 - ramp(t, S(3) - 2.3, 0.5)) + ramp(t, S(4) + 0.3, 0.6) * (1 - ramp(t, E(4) - 1.4, 0.5)) + ramp(t, S(10) + 3.4, 0.8);

/* ---------- vật trên đường ---------- */
export const ARCH_Z = 0;
export const BLUE_END = 2050;
/** x tính từ tâm đường (cộng thêm độ uốn bend(z)) */
export const HOUSE = {x: 520, z: 1370};
export const lerpPos = (a: number, b: number, k: number) => a + (b - a) * k;
/** Mỗi biển đứng cách máy quay 760 ở thời điểm nó hiện ra, nên luôn nằm gọn trong khung lúc xuất hiện */
export const signZ = (i: number) => camera(T.sign[i]).z + 760;
export const SIGNS = [
  {x: -390, kind: 'pain' as const},
  {x: 390, kind: 'meal' as const},
  {x: -390, kind: 'family' as const},
];
/** Trạng thái làn cam: 0 mờ -> 1 sáng rực */
export const orangeGlow = (t: number) => 0.28 + 0.72 * ramp(t, T.lit, 1.6);
export const duskProgress = (t: number) => clamp01(t / 66);
