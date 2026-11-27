/* Mốc thời gian của V013: tra theo giờ đọc thật của từng chữ (public/lap-tu-cung/timeline.json, sinh bằng npm run voice -- V013). */
import data from '../../public/lap-tu-cung/timeline.json';
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
  pearLabel: W(1, 'quả'),
  pearAway: W(1, 'lắp'),
  eggIn: W(1, 'làm'),
  uterus: W(2, 'khối') - 0.1,
  hollow: W(2, 'rỗng'),
  pelvis: W(2, 'khung'),
  uterusName: W(2, 'tử'),
  muscle: W(3, 'lớp'),
  squeeze: W(3, 'co', 1),
  liningThin: W(4, 'lớp'),
  liningName: W(4, 'nội'),
  liningThick: W(4, 'dày'),
  cushion: W(4, 'nệm'),
  ovaries: W(5, 'buồng'),
  walnut: W(5, 'óc'),
  hormone: W(5, 'hormone'),
  follicles: W(6, 'trứng'),
  bag: W(6, 'túi'),
  follicleName: W(6, 'nang'),
  tubes: W(7, 'vòi'),
  length: W(7, 'dài'),
  notJoined: W(8, 'không'),
  funnel: W(8, 'Đầu'),
  fingersName: W(8, 'tua'),
  sweep: W(8, 'quét'),
  zoom: W(9, 'phóng'),
  bulge: W(9, 'nang'),
  burst: W(9, 'nứt'),
  release: W(9, 'thả'),
  curl: W(10, 'tua'),
  catch: W(10, 'đón'),
  enter: W(10, 'đưa'),
  travel: W(10, 'Rồi'),
  toward: W(10, 'về'),
  fertilize: W(11, 'thụ'),
  meet: W(11, 'trong'),
  ready: W(11, 'sẵn'),
  ifNot: W(12, 'Còn'),
  shed: W(12, 'bong'),
  period: W(12, 'kỳ'),
  newCycle: W(12, 'mới'),
  cervix: W(13, 'cổ'),
  canal: W(13, 'ống'),
  blood: W(13, 'Máu'),
  screening: W(14, 'tầm'),
  party: S(15),
  end: E(15),
};
