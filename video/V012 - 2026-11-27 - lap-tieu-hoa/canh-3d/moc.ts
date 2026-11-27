/* Mốc thời gian của V012: tra theo giờ đọc thật của từng chữ (public/lap-tieu-hoa/timeline.json, sinh bằng npm run voice -- V012). */
import data from '../../public/lap-tieu-hoa/timeline.json';
import {makeTimeline} from '../../src/timeline';

export const {timeline, S, E, W} = makeTimeline(data);

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (p: number) => p * p * (3 - 2 * p);
/** Tiến độ làm mượt 0..1 từ mốc a, kéo dài d giây */
export const sm = (t: number, a: number, d: number) => smooth(clamp01((t - a) / d));
/** Nội suy trơn qua các mốc [t, giá trị] */
export const kf = (keys: [number, number][], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i];
    const [b, vb] = keys[i + 1];
    if (t < b) return va + (vb - va) * smooth((t - a) / (b - a));
  }
  return keys[keys.length - 1][1];
};
/** Nảy ra: 0 → 1 có vọt quá đà một chút (easeOutBack) */
export const pop = (t: number, a: number, d = 0.5) => {
  const p = clamp01((t - a) / d);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
/** Bật rồi tắt: 1 trong [a, b], mờ vào/ra mỗi bên f giây */
export const win = (t: number, a: number, b: number, f = 0.25) => sm(t, a, f) * (1 - sm(t, b - f, f));

/* ---------- mốc theo lời đọc ---------- */
export const T = {
  mouthIn: W(1, 'lắp') - 0.2, // viên cơm rơi vào miệng
  teeth: W(2, 'Răng'),
  tongue: W(2, 'lưỡi'),
  saliva: W(2, 'nước'),
  softBall: W(2, 'thành'),
  enzymeMouth: W(2, 'enzym'),
  swallow: W(3, 'xuống'), // viên thức ăn bắt đầu đi xuống
  esoph: W(3, 'thực'),
  esophPush: W(3, 'đẩy'),
  stomach: W(4, 'dạ'),
  churn: W(4, 'nhào'),
  glands: W(5, 'Tuyến'),
  acid: W(5, 'axit'),
  enzymeSt: W(5, 'enzym'),
  protein: W(5, 'chất'),
  smallInt: W(6, 'ruột'),
  threeParts: W(6, 'ba'),
  duo: W(6, 'tá'),
  jej: W(6, 'hỗng'),
  ile: W(6, 'hồi'),
  pancreas: W(7, 'tụy'),
  liver: W(7, 'Gan'),
  gallbladder: W(7, 'túi'),
  bileDrop: W(7, 'đổ'),
  zoomIn: W(8, 'phóng'),
  villiUp: W(8, 'Bên'),
  villiName: W(8, 'nhung'),
  surface: W(8, 'Chúng'),
  capillary: W(9, 'mạch'),
  absorb: W(9, 'thấm'),
  carried: W(9, 'theo'),
  colon: W(10, 'ruột'),
  water: W(10, 'nước'),
  bacteria: W(10, 'vi'),
  rectum: W(11, 'trực'),
  anus: W(11, 'hậu'),
  exit: W(11, 'ra'),
  peristalsis: W(12, 'nhu'),
  behind: W(12, 'phía'),
  meters: W(13, 'vài'),
  party: S(15),
  end: E(15),
};
