/* Thế giới của V008: MỘT dáng người nhìn nghiêng trong suốt (mặt quay sang trái) làm bản đồ, camera bay liên tục theo Tin.
   Các lớp: nền gradient + hạt bay (màn hình) -> mạng tế bào thần kinh mờ phía xa (thị sai) -> thân người trong suốt nhiều lớp (viền sáng, mảng chuyển màu, xương sườn,
   phổi, ruột, cột sống) -> dây thần kinh có xung sáng chạy -> não -> dây cáp ra bảng tổng đài -> chỗ đau. Không vẽ mặt người, không vẽ khối u. */
import {NAVY} from '../../src/common/overlays';
import {lerp} from '../../src/timeline';
import {CABLE_D, NERVE_D, U_SEG, pathAt} from './Path';
import {T, clamp01, loud, smooth, tinU} from './Motion';
import {E, S} from './timeline';

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng, góc xoay độ], nội suy Hermite (không khựng ở mốc) + rung nhẹ ---------- */
export type Cam = {x: number; y: number; s: number; rot: number};
type Key = [number, number, number, number, number];
export const SCY = 700;

const runKeys: Key[] = [];
for (let tt = T.run0 + 0.3; tt < T.arrive - 0.15; tt += 0.4) {
  const p = pathAt(tinU(tt));
  const k = (tt - T.run0) / (T.arrive - T.run0);
  runKeys.push([tt, p.x + (p.tx > 0.4 ? 90 : 10), p.y - 120, 1.34 - 0.12 * k, 0]);
}
const KEYS: Key[] = [
  [0, 440, 540, 0.74, 0],
  [S(2) + 0.25, 470, 780, 0.92, 0],
  [T.run0, 400, 1020, 1.36, 0],
  ...runKeys,
  [T.arrive + 0.45, 540, 345, 1.16, 0],
  [S(3) + 1.8, 500, 930, 0.88, 0],
  [S(3) + 5.0, 495, 925, 0.89, 0],
  [S(4) + 0.8, 215, 285, 1.02, 0],
  [E(4) - 0.4, 200, 272, 1.08, 0],
  [S(5) + 1.0, 545, 652, 0.92, 0],
  [E(5), 548, 648, 0.93, 0],
  [E(6), 546, 645, 0.95, 0],
  [S(7) + 1.2, 520, 640, 0.95, 0],
  [E(7), 520, 660, 0.95, 0],
  [S(8) + 0.5, 515, 880, 1.0, 0],
  [E(8), 518, 878, 1.03, 0],
  [S(9) + 1.4, 205, 285, 1.0, 0],
  [E(9), 200, 278, 1.04, 0],
  [S(10) + 1.2, 235, 340, 1.0, 0],
  [E(10) + 1.4, 250, 380, 0.9, 0],
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
const KS = [...KEYS].sort((a, b) => a[0] - b[0]);
const KT = KS.map((k) => k[0]);
const KX = KS.map((k) => k[1]);
const KY = KS.map((k) => k[2]);
const KZ = KS.map((k) => Math.log(k[3]));
const KR = KS.map((k) => k[4]);
export const camera = (t: number): Cam => {
  let base: Cam;
  if (t <= KT[0]) base = {x: KX[0], y: KY[0], s: Math.exp(KZ[0]), rot: KR[0]};
  else if (t >= KT[KT.length - 1]) base = {x: KX[KX.length - 1], y: KY[KY.length - 1], s: Math.exp(KZ[KZ.length - 1]), rot: KR[KR.length - 1]};
  else {
    let i = 0;
    while (t >= KT[i + 1]) i++;
    const u = (t - KT[i]) / (KT[i + 1] - KT[i]);
    base = {x: hermite(KX, KT, i, u), y: hermite(KY, KT, i, u), s: Math.exp(hermite(KZ, KT, i, u)), rot: hermite(KR, KT, i, u)};
  }
  // rung nhẹ: luôn có chuyển động
  return {x: base.x + 6 * Math.sin(t * 0.8), y: base.y + 5 * Math.cos(t * 0.6), s: base.s * (1 + 0.006 * Math.sin(t * 1.1)), rot: base.rot + 0.7 * Math.sin(t * 0.45)};
};
export const viewTransform = (c: Cam) => `translate(540 ${SCY}) rotate(${c.rot.toFixed(3)}) scale(${c.s.toFixed(4)}) translate(${-c.x.toFixed(2)} ${-c.y.toFixed(2)})`;
export const toScreen = (wx: number, wy: number, c: Cam) => {
  const r = (c.rot * Math.PI) / 180;
  const dx = (wx - c.x) * c.s;
  const dy = (wy - c.y) * c.s;
  return {x: 540 + dx * Math.cos(r) - dy * Math.sin(r), y: SCY + dx * Math.sin(r) + dy * Math.cos(r)};
};
/** Máy quay cho lớp nền xa: trôi chậm hơn (thị sai) */
const farCam = (c: Cam): Cam => {
  const k = 0.42;
  return {x: lerp(500, c.x, k), y: lerp(800, c.y, k), s: Math.exp(Math.log(c.s) * k), rot: c.rot * k};
};

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const f1 = (n: number) => n.toFixed(1);

/* ---------- định nghĩa dùng chung ---------- */
export const Defs = () => (
  <defs>
    <linearGradient id="g8-body" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.78" />
      <stop offset="0.45" stopColor="#EAF2FF" stopOpacity="0.6" />
      <stop offset="1" stopColor="#BFD3F5" stopOpacity="0.5" />
    </linearGradient>
    <linearGradient id="g8-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" />
      <stop offset="0.8" stopColor="#fff" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
    <mask id="g8-bodymask" maskUnits="userSpaceOnUse" x="-200" y="0" width="1400" height="1700">
      <rect x="-200" y="0" width="1400" height="1700" fill="url(#g8-fade)" />
    </mask>
    <radialGradient id="g8-brain" cx="0.4" cy="0.3" r="0.8">
      <stop offset="0" stopColor="#FFD3DF" />
      <stop offset="0.6" stopColor="#F7A6BF" />
      <stop offset="1" stopColor="#E888A9" />
    </radialGradient>
    <linearGradient id="g8-bone" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFF6E0" />
      <stop offset="1" stopColor="#F1D9AE" />
    </linearGradient>
    <linearGradient id="g8-nerve" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFE58A" />
      <stop offset="1" stopColor="#FFC94A" />
    </linearGradient>
    <linearGradient id="g8-device" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7C9DD8" />
      <stop offset="1" stopColor="#4C6CAB" />
    </linearGradient>
    <linearGradient id="g8-bezel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F3F7FF" />
      <stop offset="1" stopColor="#C7D6F0" />
    </linearGradient>
    <radialGradient id="g8-knob" cx="0.38" cy="0.3" r="0.85">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.6" stopColor="#E9EEF8" />
      <stop offset="1" stopColor="#B9C7E2" />
    </radialGradient>
    <radialGradient id="g8-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFB067" stopOpacity="0.95" />
      <stop offset="0.45" stopColor="#FF8A3D" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g8-calm" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#BFF1E6" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#8FE0D0" stopOpacity="0.4" />
      <stop offset="1" stopColor="#8FE0D0" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g8-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.4" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g8-tin" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stopColor="#FFF08A" />
      <stop offset="0.6" stopColor="#FFD23F" />
      <stop offset="1" stopColor="#FFB02E" />
    </linearGradient>
    <filter id="g8-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="g8-soft2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4" />
    </filter>
    <clipPath id="g8-bodyclip">
      <path d={BODY} />
    </clipPath>
  </defs>
);

/* ---------- nền màn hình: gradient + ánh sáng + hạt bay chậm ---------- */
type Particle = {x: number; y: number; r: number; vx: number; vy: number; d: number; a: number; ph: number};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry(808);
  return Array.from({length: 46}, () => ({x: rnd() * 1080, y: rnd() * 1500, r: 4 + rnd() * rnd() * 32, vx: (rnd() - 0.5) * 12, vy: -3 - rnd() * 10, d: 0.15 + rnd() * 0.7, a: 0.25 + rnd() * 0.4, ph: rnd() * 6.28}));
})();
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Backdrop = ({t, cam}: {t: number; cam: Cam}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #E9F0FF 0%, #D3E0FA 32%, #E1D3EE 68%, #F4C6D3 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 780px 640px at ${540 + 40 * Math.sin(t * 0.3)}px ${720 + 24 * Math.cos(t * 0.4)}px, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Defs />
      {PARTICLES.map((p, i) => {
        const x = wrap(p.x + p.vx * t - (cam.x - 540) * p.d * 0.25, 1160) - 40;
        const y = wrap(p.y + p.vy * t - (cam.y - 720) * p.d * 0.25, 1560) - 40;
        return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#g8-bokeh)" opacity={p.a * (0.75 + 0.25 * Math.sin(t * 0.9 + p.ph))} />;
      })}
    </svg>
  </>
);

/** Phủ mờ ngoài vùng đang nói tới (mờ khoảng 30–40%): tâm/bán kính theo toạ độ thế giới, a = độ đặc 0..1 */
export const Focus = ({cam, x, y, r, a}: {cam: Cam; x: number; y: number; r: number; a: number}) => {
  if (a <= 0.01) return null;
  const s = toScreen(x, y, cam);
  const R = r * cam.s;
  return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle ${R * 1.7}px at ${s.x}px ${s.y}px, rgba(228,226,248,0) ${R * 0.7}px, rgba(222,222,248,${0.4 * a}) ${R * 1.7}px)`}} />;
};

/* ---------- mạng tế bào thần kinh mờ phía xa ---------- */
const NEURONS = (() => {
  const rnd = mulberry(4242);
  const out: {d: string; nodes: [number, number, number][]; ph: number}[] = [];
  for (let i = 0; i < 16; i++) {
    let x = -500 + rnd() * 1900;
    let y = -200 + rnd() * 2100;
    let d = `M ${f1(x)} ${f1(y)}`;
    const nodes: [number, number, number][] = [[x, y, 9 + rnd() * 9]];
    let ang = rnd() * 6.28;
    for (let k = 0; k < 4; k++) {
      ang += (rnd() - 0.5) * 1.6;
      const l = 150 + rnd() * 170;
      const nx = x + Math.cos(ang) * l;
      const ny = y + Math.sin(ang) * l;
      d += ` Q ${f1((x + nx) / 2 + (rnd() - 0.5) * 90)} ${f1((y + ny) / 2 + (rnd() - 0.5) * 90)} ${f1(nx)} ${f1(ny)}`;
      x = nx;
      y = ny;
      nodes.push([x, y, 6 + rnd() * 9]);
    }
    out.push({d, nodes, ph: rnd() * 6.28});
  }
  return out;
})();
export const FarLayer = ({cam, t}: {cam: Cam; t: number}) => (
  <g transform={viewTransform(farCam(cam))} filter="url(#g8-soft2)" opacity={0.7}>
    {NEURONS.map((n, i) => (
      <g key={i}>
        <path d={n.d} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={9} strokeLinecap="round" />
        <path d={n.d} fill="none" stroke="#B9C6EA" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" strokeDasharray="6 44" strokeDashoffset={-t * 18 - n.ph * 20} />
        {n.nodes.map((p, k) => (
          <circle key={k} cx={p[0]} cy={p[1]} r={p[2] * (1 + 0.1 * Math.sin(t * 1.2 + n.ph + k))} fill="#fff" fillOpacity={0.6} stroke="#B9C6EA" strokeWidth={3} />
        ))}
      </g>
    ))}
  </g>
);

/* ---------- thân người trong suốt (mặt quay sang trái) ---------- */
const BODY =
  'M 500 70 C 612 70 692 150 697 255 C 701 332 668 388 626 408 C 652 440 704 468 752 532 C 812 612 832 762 818 902 C 804 1032 822 1160 812 1300 C 806 1420 800 1540 792 1700 L 262 1700 C 252 1560 242 1420 236 1300 C 216 1180 190 1080 205 960 C 220 840 242 722 292 642 C 306 604 326 552 366 522 C 388 506 398 488 398 464 C 398 444 388 428 372 416 C 352 404 338 386 342 360 C 340 346 350 338 362 335 C 350 322 340 306 326 292 C 342 281 354 270 358 258 C 354 200 372 110 500 70 Z';

// xương sườn: từ cột sống (bên phải) cong ra phía trước (bên trái)
const RIBS = Array.from({length: 7}, (_, i) => {
  const y = 610 + i * 47;
  const sx = 738 - i * 4;
  const fx = 318 + i * 9;
  const fy = y + 118 + i * 14;
  return `M ${sx} ${y} C ${sx - 130} ${y - 52} ${fx + 150} ${y - 24} ${fx} ${fy}`;
});
// cột sống phần dưới (từ chỗ nối với dây thần kinh xuống xương cùng)
const SPINE_LOW = (() => {
  const pts: {x: number; y: number}[] = [];
  const P0 = [700, 990];
  const C1 = [688, 1110];
  const C2 = [782, 1380];
  const P1 = [772, 1580];
  for (let i = 1; i <= 11; i++) {
    const k = i / 11;
    const m = 1 - k;
    const x = m * m * m * P0[0] + 3 * m * m * k * C1[0] + 3 * m * k * k * C2[0] + k * k * k * P1[0];
    const y = m * m * m * P0[1] + 3 * m * m * k * C1[1] + 3 * m * k * k * C2[1] + k * k * k * P1[1];
    pts.push({x, y});
  }
  return pts;
})();

const Vertebra = ({x, y, rot, w, h}: {x: number; y: number; rot: number; w: number; h: number}) => (
  <g transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.42} fill="url(#g8-bone)" stroke={NAVY} strokeOpacity={0.4} strokeWidth={4} />
    <rect x={-w / 2 + 6} y={-h / 2 + 4} width={w * 0.5} height={h * 0.28} rx={h * 0.14} fill="#fff" fillOpacity={0.75} />
    <rect x={w / 2 - 14} y={-h / 2 - 8} width={11} height={h + 16} rx={5} fill="#EFD9AE" stroke={NAVY} strokeOpacity={0.3} strokeWidth={3} />
  </g>
);

export const Body = ({t}: {t: number}) => {
  const breathe = 1 + 0.012 * Math.sin(t * 1.5);
  // đốt sống dọc theo dây thần kinh (cổ -> lưng) rồi nối phần dưới
  const verts: {x: number; y: number; rot: number; w: number; h: number}[] = [];
  const uTop = U_SEG[3] - 30;
  for (let u = U_SEG[1]; u < uTop; u += 36) {
    const p = pathAt(u);
    const k = (u - U_SEG[1]) / (uTop - U_SEG[1]);
    verts.push({x: p.x + 34, y: p.y, rot: (Math.atan2(p.ty, p.tx) * 180) / Math.PI + 90, w: 66 - 18 * k, h: 30 - 6 * k});
  }
  return (
    <g mask="url(#g8-bodymask)">
      {/* quầng sáng ngoài */}
      <path d={BODY} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={30} strokeLinejoin="round" filter="url(#g8-soft)" />
      <path d={BODY} fill="url(#g8-body)" />
      <g clipPath="url(#g8-bodyclip)">
        {/* viền sáng bên trong: dải sáng phía trước, bóng nhẹ phía lưng */}
        <path d={BODY} fill="none" stroke="#CFE0FB" strokeOpacity={0.8} strokeWidth={46} />
        <path d={BODY} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={16} transform="translate(8 6)" />
        <path d="M 760 520 C 840 700 830 1000 800 1300 L 900 1300 L 900 520 Z" fill="#8FA9D8" fillOpacity={0.2} />
        {/* sọ */}
        <ellipse cx={520} cy={240} rx={158} ry={158} fill="#fff" fillOpacity={0.35} stroke="#fff" strokeOpacity={0.7} strokeWidth={6} />
        {/* xương sườn */}
        <g fill="none" strokeLinecap="round">
          {RIBS.map((d, i) => (
            <g key={i}>
              <path d={d} stroke="#8FA9D8" strokeOpacity={0.3} strokeWidth={19} />
              <path d={d} stroke="#fff" strokeOpacity={0.8} strokeWidth={11} />
            </g>
          ))}
          <path d="M 332 676 C 322 760 332 860 358 920" stroke="#8FA9D8" strokeOpacity={0.3} strokeWidth={24} />
          <path d="M 332 676 C 322 760 332 860 358 920" stroke="#fff" strokeOpacity={0.85} strokeWidth={15} />
        </g>
        {/* phổi (nhịp thở nhẹ) */}
        <g transform={`translate(520 770) scale(${breathe.toFixed(4)}) translate(-520 -770)`}>
          <path d="M 440 640 C 520 600 640 640 668 760 C 690 860 640 930 560 920 C 470 910 420 800 440 640 Z" fill="#FFD3DE" fillOpacity={0.55} stroke="#E79AB2" strokeOpacity={0.6} strokeWidth={6} />
          <path d="M 560 700 C 540 760 548 820 566 870 M 560 770 C 590 780 620 800 636 830 M 556 740 C 520 740 494 760 486 790" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* ruột cuộn trong bụng */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
          {[1010, 1096, 1182, 1268].map((y, i) => {
            const d = `M 300 ${y} C 380 ${y - 36} 470 ${y + 36} 560 ${y} C 620 ${y - 26} 650 ${y + 8} 650 ${y + 44}`;
            return (
              <g key={i}>
                <path d={d} stroke="#E889A2" strokeOpacity={0.5} strokeWidth={50} />
                <path d={d} stroke="#F6B9C8" strokeOpacity={0.6} strokeWidth={36} />
                <path d={d} stroke="#fff" strokeOpacity={0.55} strokeWidth={9} transform="translate(0 -9)" strokeDasharray="44 70" strokeDashoffset={-t * 14 + i * 20} />
              </g>
            );
          })}
        </g>
        {/* khung chậu */}
        <path d="M 270 1500 C 330 1580 520 1620 780 1560 M 250 1420 C 300 1500 440 1540 520 1540" fill="none" stroke="#8FA9D8" strokeOpacity={0.3} strokeWidth={34} strokeLinecap="round" />
        <path d="M 270 1500 C 330 1580 520 1620 780 1560 M 250 1420 C 300 1500 440 1540 520 1540" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={20} strokeLinecap="round" />
        {/* cột sống */}
        {SPINE_LOW.map((p, i) => (
          <Vertebra key={`l${i}`} x={p.x + 34 - i * 0.6} y={p.y} rot={i * 4 + 2} w={74 + i * 1.5} h={32} />
        ))}
        {verts.map((v, i) => (
          <Vertebra key={i} {...v} />
        ))}
      </g>
      {/* viền ngoài: hai lớp (xanh đậm mờ + trắng) */}
      <path d={BODY} fill="none" stroke={NAVY} strokeOpacity={0.35} strokeWidth={7} strokeLinejoin="round" />
      <path d={BODY} fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={3} strokeLinejoin="round" transform="translate(-3 -2)" />
    </g>
  );
};

/* ---------- não (tổng đài): ánh sáng cam khi tín hiệu tới, xanh dịu khi cơn đau đã hạ ---------- */
const BRAIN_C = {x: 500, y: 236};
const LOBES: [number, number, number][] = [
  [-72, -6, 60],
  [-24, -44, 66],
  [42, -42, 62],
  [86, 6, 56],
  [62, 48, 56],
  [0, 54, 56],
  [-58, 42, 50],
  [10, 4, 64],
];
export const Brain = ({t, glow, calm}: {t: number; glow: number; calm: number}) => (
  <g transform={`translate(${BRAIN_C.x} ${BRAIN_C.y}) scale(${(1 + 0.012 * Math.sin(t * 1.8)).toFixed(4)})`}>
    {glow > 0.01 && <circle r={170 + 26 * Math.sin(t * 6)} fill="url(#g8-glow)" opacity={glow} />}
    {calm > 0.01 && <circle r={168 + 8 * Math.sin(t * 1.4)} fill="url(#g8-calm)" opacity={calm} />}
    <g>
      {LOBES.map((l, i) => (
        <circle key={`o${i}`} cx={l[0]} cy={l[1] + 6} r={l[2] + 6} fill={NAVY} opacity={0.18} />
      ))}
      {LOBES.map((l, i) => (
        <circle key={`n${i}`} cx={l[0]} cy={l[1]} r={l[2] + 5} fill={NAVY} />
      ))}
      {LOBES.map((l, i) => (
        <circle key={`f${i}`} cx={l[0]} cy={l[1]} r={l[2]} fill="url(#g8-brain)" />
      ))}
      <g fill="none" stroke="#D56F8E" strokeWidth={6} strokeLinecap="round" opacity={0.85}>
        <path d="M -100 -14 Q -76 -46 -48 -22 T -4 -40" />
        <path d="M -46 -80 Q -20 -52 8 -74 T 56 -60" />
        <path d="M 30 -22 Q 56 -52 86 -26 T 122 -6" />
        <path d="M -64 36 Q -34 14 -8 34 T 40 20" />
        <path d="M 20 66 Q 44 40 70 62 T 100 40" />
        <path d="M -20 -8 Q 0 -26 22 -8" />
      </g>
      <g fill="#fff" opacity={0.7}>
        <ellipse cx={-46} cy={-66} rx={22} ry={9} transform="rotate(-24 -46 -66)" />
        <ellipse cx={62} cy={-62} rx={18} ry={7} transform="rotate(-18 62 -62)" />
        <ellipse cx={-86} cy={-18} rx={13} ry={6} transform="rotate(-50 -86 -18)" />
      </g>
    </g>
  </g>
);

/* ---------- dây thần kinh + xung sáng (cường độ theo độ to của cơn đau) ---------- */
const TWIGS = [
  'M 470 1118 C 440 1170 470 1230 520 1260',
  'M 560 1118 C 600 1180 580 1240 540 1290',
  'M 708 940 C 640 930 600 900 560 930',
  'M 722 800 C 660 790 620 770 590 790',
  'M 716 660 C 650 650 610 640 570 660',
  'M 648 440 C 600 450 560 470 540 500',
];
export const Nerve = ({t, vol}: {t: number; vol: number}) => {
  const len = 34 + 44 * vol;
  const gap = 150 + 120 * (1 - vol);
  const speed = 130 + 160 * vol;
  const w = 7 + 11 * vol;
  const hot = vol > 0.45 ? '#FF5A1F' : '#FFB347';
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {TWIGS.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={NAVY} strokeOpacity={0.35} strokeWidth={9} />
          <path d={d} stroke="#FFE58A" strokeWidth={5} />
        </g>
      ))}
      <path d={NERVE_D} stroke={NAVY} strokeWidth={34} />
      <path d={NERVE_D} stroke="url(#g8-nerve)" strokeWidth={22} />
      <path d={NERVE_D} stroke="#FFF7D0" strokeWidth={8} transform="translate(-3 -3)" opacity={0.9} />
      <path d={NERVE_D} stroke="#D89A1E" strokeOpacity={0.5} strokeWidth={22} strokeDasharray="2 22" strokeLinecap="butt" />
      {/* xung chạy lên: quầng + lõi */}
      <path d={NERVE_D} stroke={hot} strokeOpacity={0.35} strokeWidth={w + 12} strokeDasharray={`${len} ${gap}`} strokeDashoffset={-t * speed} />
      <path d={NERVE_D} stroke={hot} strokeWidth={w} strokeDasharray={`${len} ${gap}`} strokeDashoffset={-t * speed} />
      <path d={NERVE_D} stroke="#fff" strokeOpacity={0.9} strokeWidth={w * 0.4} strokeDasharray={`${len * 0.55} ${gap + len * 0.45}`} strokeDashoffset={-t * speed - len * 0.15} />
    </g>
  );
};

/* ---------- dây cáp từ não ra bảng tổng đài ---------- */
export const Cable = ({t}: {t: number}) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={CABLE_D} stroke={NAVY} strokeWidth={34} />
    <path d={CABLE_D} stroke="#58C7D8" strokeWidth={22} />
    <path d={CABLE_D} stroke="#A8EEF4" strokeWidth={8} transform="translate(0 -5)" />
    <path d={CABLE_D} stroke={NAVY} strokeOpacity={0.45} strokeWidth={22} strokeDasharray="3 22" strokeLinecap="butt" />
    <path d={CABLE_D} stroke="#fff" strokeOpacity={0.7} strokeWidth={5} strokeDasharray="10 150" strokeDashoffset={t * 60} />
  </g>
);

/* ---------- chỗ đau: chấm cam sáng, nhịp đập và vòng sóng lan ra (nhỏ lại, dịu đi khi cơn đau hạ) ---------- */
export const PAIN = {x: 360, y: 1080};
export const PainSpot = ({t, vol}: {t: number; vol: number}) => {
  const beat = 1 + 0.09 * vol * Math.sin(t * 7.5) + 0.03 * Math.sin(t * 2);
  const R = 24 + 14 * vol;
  const col = vol > 0.45 ? '#FF7A2B' : '#FFB36B';
  return (
    <g transform={`translate(${PAIN.x} ${PAIN.y})`}>
      <circle r={96 + 70 * vol} fill="url(#g8-glow)" opacity={0.55 + 0.4 * vol} />
      {[0, 1, 2].map((i) => {
        const k = ((t * (0.55 + 0.7 * vol) + i / 3) % 1 + 1) % 1;
        return <circle key={i} r={R + 10 + k * (60 + 50 * vol)} fill="none" stroke={col} strokeWidth={7 * (1 - k) + 1} opacity={(1 - k) * (0.35 + 0.55 * vol)} />;
      })}
      <g transform={`scale(${beat.toFixed(3)})`}>
        <g opacity={0.5 + 0.5 * vol}>
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2 + t * 0.35;
            const r0 = R + 9;
            const r1 = R + 16 + 14 * vol * (i % 2 ? 1 : 0.55);
            return <path key={i} d={`M ${f1(Math.cos(a) * r0)} ${f1(Math.sin(a) * r0)} L ${f1(Math.cos(a) * r1)} ${f1(Math.sin(a) * r1)}`} stroke={col} strokeWidth={7} strokeLinecap="round" />;
          })}
        </g>
        <circle r={R + 4} fill={NAVY} />
        <circle r={R} fill={col} />
        <circle r={R * 0.58} cx={-R * 0.12} cy={-R * 0.12} fill="#FFE1B8" opacity={0.9} />
        <circle r={R * 0.2} cx={-R * 0.4} cy={-R * 0.42} fill="#fff" />
      </g>
    </g>
  );
};

export {clamp01, smooth, loud};
