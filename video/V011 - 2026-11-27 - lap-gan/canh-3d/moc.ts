/* Mốc thời gian của V011: tra theo giờ đọc thật của từng chữ (public/lap-gan/timeline.json, sinh bằng npm run voice -- V011). */
import data from '../../public/lap-gan/timeline.json';
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
/** Bật rồi tắt: 1 trong [a, b], mờ vào/ra mỗi bên f giây */
export const win = (t: number, a: number, b: number, f = 0.25) => sm(t, a, f) * (1 - sm(t, b - f, f));
/** Nảy ra: 0 → 1 có vọt quá đà một chút (easeOutBack) */
export const pop = (t: number, a: number, d = 0.5) => {
  const p = clamp01((t - a) / d);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};

/* ---------- mốc theo lời đọc ---------- */
export const T = {
  ribs0: 0.5,
  liverDrop: 0.0,
  leftLobe: W(2, 'hai') - 0.2,
  ghost: S(3) + 0.15,
  intestine: W(3, 'ruột') - 0.4,
  portal: W(3, 'máu') - 0.1,
  artery: W(4, 'nên') - 0.1,
  hepatic: W(5, 'ba') - 0.1,
  zoomIn: W(6, 'phóng') - 0.2,
  lobule: W(6, 'phóng') + 0.8,
  triadV: W(7, 'tĩnh'),
  triadA: W(7, 'động'),
  triadB: W(7, 'ống'),
  flow: W(7, 'Máu'),
  center: W(7, 'tĩnh', 1),
  sugar: W(8, 'Cất'),
  filter: W(8, 'lọc'),
  bile: W(9, 'dịch'),
  pullBack: W(9, 'Nhưng') - 0.1,
  ducts: W(9, 'ống'),
  gb: W(9, 'túi'),
  squeeze: W(10, 'túi'),
  drip: W(10, 'đẩy'),
  solid: S(11) - 0.1,
  regen: W(11, 'tái'),
  cut: W(11, 'cắt'),
  remain: W(11, 'phần', 1),
  regrow: W(11, 'lớn'),
  months: W(11, 'khoảng'),
  healthy: W(12, 'khỏe'),
  vaccine: W(12, 'tiêm'),
  alcohol: W(12, 'hạn'),
  party: S(13),
  end: E(13),
};
