/* Thế giới của V009: một "đĩa mặt đồng hồ" ở giữa, camera bay liên tục (zoom, pan, nghiêng). Nền gradient tím nhạt - đào, hạt bay chậm,
   và một lớp mặt đồng hồ mờ phía xa trôi chậm hơn (thị sai). Không có thân hình, không có chi tiết giải phẫu bên ngoài. */
import {lerp} from '../../src/timeline';
import {T} from './Motion';
import {E, S} from './timeline';

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng, góc xoay độ], nội suy Hermite + rung nhẹ ---------- */
export type Cam = {x: number; y: number; s: number; rot: number};
export const SCX = 470; // tâm vùng nội dung (chừa 160px lề phải cho cột nút của Reels)
export const SCY = 730;

const KEYS: number[][] = [
  [0, 0, 20, 0.98, 0],
  [S(2) - 0.1, 0, 20, 0.98, 0],
  [S(2) + 1.2, 0, 90, 1.08, 0],
  [E(2), 0, 90, 1.08, 0],
  [S(3) + 1.0, 0, 50, 1.0, 0],
  [E(3), 0, 40, 0.98, 0],
  [S(4) + 0.3, 50, 20, 1.0, 0],
  [E(4), 50, 20, 1.02, 0],
  [S(5) + 0.5, 0, -78, 0.9, 0],
  [E(5), 0, -78, 0.92, 0],
  [S(6) + 1.4, 0, 70, 1.05, 0],
  [T.press[0] - 0.9, 0, 70, 1.05, 0],
  [T.press[0] - 0.1, 0, -30, 1.28, 0],
  [E(6) + 0.45, 0, -30, 1.28, 0],
  [S(7) + 1.0, 0, 10, 0.95, 0],
  [T.spiral1, 0, 10, 0.95, 0],
  [T.tail + 0.9, -140, -60, 0.88, 0],
  [E(7), -140, -60, 0.88, 0],
  [S(8) + 0.9, 30, 20, 1.0, 0],
  [E(8), 30, 20, 1.02, 0],
  [S(9) + 0.2, 0, 20, 1.0, 0],
  [T.needle - 1.0, 0, 20, 1.0, 0],
  [T.needle + 0.1, 0, 95, 1.2, 0],
  [E(9) + 0.3, 0, 95, 1.2, 0],
  [S(10) + 1.1, 0, -10, 0.95, 0],
  [E(10) + 1.2, 0, -10, 0.97, 0],
];

const hermite = (v: number[], ts: number[], i: number, u: number) => {
  const m = (k: number) => {
    const a = Math.max(0, k - 1);
    const b = Math.min(v.length - 1, k + 1);
    return (v[b] - v[a]) / (ts[b] - ts[a]);
  };
  const h = ts[i + 1] - ts[i];
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * v[i + 1] + (u3 - u2) * h * m(i + 1);
};
const KT = KEYS.map((k) => k[0]);
const KX = KEYS.map((k) => k[1]);
const KY = KEYS.map((k) => k[2]);
const KZ = KEYS.map((k) => Math.log(k[3]));
export const camera = (t: number): Cam => {
  let x: number;
  let y: number;
  let s: number;
  if (t <= KT[0]) [x, y, s] = [KX[0], KY[0], Math.exp(KZ[0])];
  else if (t >= KT[KT.length - 1]) [x, y, s] = [KX[KX.length - 1], KY[KY.length - 1], Math.exp(KZ[KZ.length - 1])];
  else {
    let i = 0;
    while (t >= KT[i + 1]) i++;
    const u = (t - KT[i]) / (KT[i + 1] - KT[i]);
    [x, y, s] = [hermite(KX, KT, i, u), hermite(KY, KT, i, u), Math.exp(hermite(KZ, KT, i, u))];
  }
  // rung nhẹ: luôn có chuyển động
  return {x: x + 5 * Math.sin(t * 0.8), y: y + 4 * Math.cos(t * 0.6), s: s * (1 + 0.005 * Math.sin(t * 1.1)), rot: 0.5 * Math.sin(t * 0.45)};
};
export const viewTransform = (c: Cam) => `translate(${SCX} ${SCY}) rotate(${c.rot.toFixed(3)}) scale(${c.s.toFixed(4)}) translate(${-c.x.toFixed(2)} ${-c.y.toFixed(2)})`;
export const toScreen = (wx: number, wy: number, c: Cam) => {
  const r = (c.rot * Math.PI) / 180;
  const dx = (wx - c.x) * c.s;
  const dy = (wy - c.y) * c.s;
  return {x: SCX + dx * Math.cos(r) - dy * Math.sin(r), y: SCY + dx * Math.sin(r) + dy * Math.cos(r)};
};
const farCam = (c: Cam): Cam => {
  const k = 0.4;
  return {x: lerp(0, c.x, k), y: lerp(200, c.y, k), s: Math.exp(Math.log(c.s) * k), rot: c.rot * k};
};

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- định nghĩa dùng chung (tô màu, bóng, làm mờ) ---------- */
export const Defs = () => (
  <defs>
    <radialGradient id="gv-top" cx="0.42" cy="0.36" r="0.8">
      <stop offset="0" stopColor="#FFF8FC" />
      <stop offset="0.65" stopColor="#F4E1F7" />
      <stop offset="1" stopColor="#DCCBF5" />
    </radialGradient>
    <linearGradient id="gv-petal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFDCCB" />
      <stop offset="1" stopColor="#FFB9CC" />
    </linearGradient>
    <linearGradient id="gv-skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFD9C4" />
      <stop offset="1" stopColor="#FFC4AE" />
    </linearGradient>
    <linearGradient id="gv-gland" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F8E6F4" />
      <stop offset="1" stopColor="#EBD3F0" />
    </linearGradient>
    <linearGradient id="gv-chest" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#D5CDF6" />
      <stop offset="1" stopColor="#B9ADEC" />
    </linearGradient>
    <linearGradient id="gv-fg0" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#CFF5E6" />
      <stop offset="1" stopColor="#7ED8B6" />
    </linearGradient>
    <linearGradient id="gv-fg1" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#FFF0B5" />
      <stop offset="1" stopColor="#FFCB4A" />
    </linearGradient>
    <linearGradient id="gv-fg2" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#FFD3C6" />
      <stop offset="1" stopColor="#FF9478" />
    </linearGradient>
    <radialGradient id="gv-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFB067" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#FF8A3D" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="gv-mint" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#C6F6E8" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#8FE0D0" stopOpacity="0.4" />
      <stop offset="1" stopColor="#8FE0D0" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="gv-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.4" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="gv-sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#fff" stopOpacity="0" />
      <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
    </linearGradient>
    <filter id="gv-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="gv-soft2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4" />
    </filter>
    <clipPath id="gv-coin-clip">
      <circle r={330} />
    </clipPath>
  </defs>
);

/* ---------- nền màn hình: gradient + ánh sáng + hạt bay chậm ---------- */
type Particle = {x: number; y: number; r: number; vx: number; vy: number; d: number; a: number; ph: number};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry(909);
  return Array.from({length: 46}, () => ({x: rnd() * 1080, y: rnd() * 1500, r: 4 + rnd() * rnd() * 32, vx: (rnd() - 0.5) * 12, vy: -3 - rnd() * 10, d: 0.15 + rnd() * 0.7, a: 0.25 + rnd() * 0.4, ph: rnd() * 6.28}));
})();
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Backdrop = ({t, cam}: {t: number; cam: Cam}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #F2EDFF 0%, #E3E6FB 34%, #F3DDEC 70%, #FFE6D4 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 780px 640px at ${470 + 40 * Math.sin(t * 0.3)}px ${720 + 24 * Math.cos(t * 0.4)}px, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Defs />
      {PARTICLES.map((p, i) => {
        const x = wrap(p.x + p.vx * t - (cam.x - 540) * p.d * 0.25, 1160) - 40;
        const y = wrap(p.y + p.vy * t - (cam.y - 720) * p.d * 0.25, 1560) - 40;
        return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#gv-bokeh)" opacity={p.a * (0.75 + 0.25 * Math.sin(t * 0.9 + p.ph))} />;
      })}
    </svg>
  </>
);

/* ---------- lớp mặt đồng hồ mờ phía xa ---------- */
const GHOSTS = (() => {
  const rnd = mulberry(77);
  return Array.from({length: 9}, (_, i) => ({x: -800 + rnd() * 1700, y: -500 + rnd() * 1500, r: 140 + rnd() * 260, rot: rnd() * 360, sp: (rnd() - 0.5) * 5, ph: rnd() * 6.28, big: i < 4}));
})();
const PLUS = (() => {
  const rnd = mulberry(31);
  return Array.from({length: 26}, () => ({x: -700 + rnd() * 1600, y: -450 + rnd() * 1450, s: 7 + rnd() * 10, ph: rnd() * 6.28}));
})();
export const FarLayer = ({cam, t}: {cam: Cam; t: number}) => (
  <g transform={viewTransform(farCam(cam))} filter="url(#gv-soft2)" opacity={0.75}>
    {GHOSTS.map((g, i) => (
      <g key={i} transform={`translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) rotate(${(g.rot + g.sp * t).toFixed(2)})`}>
        <circle r={g.r} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={10} />
        <circle r={g.r * 0.62} fill="none" stroke="#C9C6F0" strokeOpacity={0.6} strokeWidth={4} strokeDasharray="4 22" />
        {Array.from({length: 12}, (_, k) => (
          <path key={k} d={`M 0 ${-g.r + 14} V ${-g.r + (k % 3 === 0 ? 40 : 28)}`} stroke="#C9C6F0" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" transform={`rotate(${k * 30})`} />
        ))}
      </g>
    ))}
    {PLUS.map((p, i) => (
      <path key={i} d={`M ${-p.s} 0 H ${p.s} M 0 ${-p.s} V ${p.s}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} stroke="#fff" strokeOpacity={0.55 + 0.3 * Math.sin(t * 0.8 + p.ph)} strokeWidth={5} strokeLinecap="round" />
    ))}
  </g>
);
