/* Mốc thời gian của V014: tra theo giờ đọc thật của từng chữ (public/lap-chiec-rang/timeline.json, sinh bằng npm run voice -- V014). */
import data from '../../public/lap-chiec-rang/timeline.json';
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
  hard: W(1, 'cứng'),
  mouth: W(1, 'miệng'),
  build: W(1, 'lắp'),
  pulp: W(2, 'tủy'),
  vessels: W(2, 'mạch'),
  nerve: W(2, 'dây'),
  cover: W(3, 'che'),
  dentin: W(3, 'ngà'),
  enamel: W(4, 'men'),
  hardest: W(4, 'chất'),
  hardMore: W(4, 'cứng', 1),
  boneHard: W(4, 'xương'),
  mineral: W(4, 'chín'),
  root: W(5, 'chân'),
  cement: W(5, 'xê'),
  bone: W(5, 'xương'),
  ligament: W(5, 'dây'),
  cushion: W(5, 'đệm'),
  gum: W(6, 'nướu'),
  guard: W(6, 'bảo'),
  plaque: W(7, 'mảng'),
  bacteria: W(7, 'vi'),
  sugar: W(8, 'ngọt'),
  meal: W(8, 'bữa'),
  acid: W(8, 'axit'),
  zoomIn: W(9, 'phóng'),
  wall: W(9, 'bức'),
  acidWall: W(9, 'Axit'),
  leave: W(9, 'rút'),
  repeat: W(10, 'lặp'),
  spot: W(10, 'đốm'),
  early: W(10, 'Đó'),
  fix: W(11, 'sửa'),
  saliva: W(11, 'Nước'),
  flo: W(11, 'flo'),
  stop: W(11, 'dừng'),
  zoomOut: W(12, 'Nhưng'),
  hole: W(12, 'vỡ'),
  lost: W(12, 'Men', 2),
  noHeal: W(13, 'tự'),
  spread: W(13, 'lan'),
  toPulp: W(13, 'tủy'),
  noPain: W(14, 'chưa'),
  nearNerve: W(14, 'thần'),
  painful: W(14, 'đau', 1),
  notSure: W(14, 'Nên'),
  protect: W(15, 'bảo'),
  brush: W(15, 'đánh'),
  twice: W(15, 'hai'),
  fluoride: W(15, 'flo'),
  floss: W(15, 'kẽ'),
  limit: W(16, 'Hạn'),
  snack: W(16, 'vặt'),
  everyTime: W(16, 'mỗi'),
  ask: W(16, 'hỏi'),
  dentist: W(16, 'nha'),
  check: W(17, 'khám'),
  detect: W(17, 'phát'),
  party: S(18),
  end: E(18),
};
