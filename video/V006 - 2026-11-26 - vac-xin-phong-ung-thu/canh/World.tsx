/* Thế giới của V006: MỘT đoạn thành mô cắt ngang (hàng tế bào có nhân, màng đáy, rãnh cổng thông xuống bên trong cơ thể),
   camera chạy dọc tường liên tục. Tọa độ thế giới = tọa độ màn hình 1080x1920 khi camera ở (540, 700) phóng 1.
   Trên mặt tường (y = SURF) là bên ngoài: tháp cổng có đồng hồ ở giữa (x = GATE_X), Lính gác và vi-rút đứng trên mặt tường.
   Dưới tường (y > INNER_TOP) là bên trong cơ thể: các huy hiệu cơ quan nằm thành hàng theo x (xem Props.tsx), camera trượt dọc theo hàng đó.
   Lớp: nền gradient + hạt (màn hình) -> thành phố xa mờ (thị sai 0,35) -> bóng tế bào lơ lửng (0,65) -> thành mô/tháp/bên trong (chính). */
import {NAVY} from '../../src/common/overlays';
import {lerp} from '../../src/timeline';
import {S, W, E, timeline} from './timeline';

export const SURF = 780; // mặt trên thành mô (bên ngoài ở trên)
export const ROW1_BOT = 940; // hết hàng tế bào cao
export const INNER_TOP = 1010; // hết thành mô, bắt đầu bên trong cơ thể
export const GATE_X = 540;
export const CH_HALF = 66; // nửa bề rộng rãnh cổng
export const SCY = 700;
export const MEDAL_Y = 1170; // tâm các huy hiệu bên trong
export const MEDAL_X = {liver: 250, baby: 540, cervix: 850, female: 1100, male: 1290};

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const f1 = (n: number) => n.toFixed(1);

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng], nội suy Hermite (vận tốc liên tục, không dừng khựng) + rung nhẹ ---------- */
export type Cam = {x: number; y: number; s: number};
const KEYS: [number, number, number, number][] = [
  [0, 575, 705, 0.96],
  [S(2), 560, 700, 1.0],
  [S(2) + 3, 600, 690, 1.04],
  [E(2), 620, 680, 1.05],
  [S(3) + 1.0, 610, 660, 1.06],
  [W(3, 'xem'), 605, 650, 1.06],
  [E(3), 590, 690, 1.04],
  [S(4) + 1.5, 450, 800, 1.0],
  [S(4) + 3.0, 345, 840, 1.0], // nhìn cả Lính gác và huy hiệu gan bên dưới
  [E(4) + 0.1, 350, 840, 1.0],
  [S(5) + 2.0, 965, 598, 1.2], // dolly sang bảng biểu đồ
  [E(5), 965, 592, 1.2],
  [S(6) + 0.8, 780, 740, 1.05],
  [S(6) + 2.5, 545, 835, 0.98], // tháp đồng hồ ở trên, em bé ở dưới
  [E(6), 548, 845, 0.98],
  [S(7) + 1.5, 700, 850, 0.98],
  [S(7) + 3.5, 835, 850, 0.98], // huy hiệu cổ tử cung
  [E(7), 870, 850, 0.98],
  [S(8) + 1.0, 1010, 850, 0.98],
  [E(8), 1150, 805, 0.97],
  [S(9) + 0.5, 1150, 775, 0.96],
  [E(9), 1100, 775, 0.96],
  [S(10) + 2.0, 540, 865, 0.86], // lùi ra xa: cổng + Lính gác ở trên, thẻ ở dưới
  [timeline.total, 540, 860, 0.84],
];
const hermite = (v: number[], ts: number[], i: number, u: number) => {
  // tiếp tuyến đơn điệu: đứng yên ở mốc giữ nguyên (không vọt quá), vẫn liên tục vận tốc ở mọi mốc đang chuyển động
  const m = (k: number) => {
    const last = v.length - 1;
    if (k === 0) return (v[1] - v[0]) / (ts[1] - ts[0]);
    if (k === last) return (v[last] - v[last - 1]) / (ts[last] - ts[last - 1]);
    const d0 = (v[k] - v[k - 1]) / (ts[k] - ts[k - 1]);
    const d1 = (v[k + 1] - v[k]) / (ts[k + 1] - ts[k]);
    return d0 * d1 <= 0 ? 0 : (2 * d0 * d1) / (d0 + d1);
  };
  const h = ts[i + 1] - ts[i];
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * v[i + 1] + (u3 - u2) * h * m(i + 1);
};
const KT = KEYS.map((k) => k[0]);
const KX = KEYS.map((k) => k[1]);
const KY = KEYS.map((k) => k[2]);
const KS = KEYS.map((k) => Math.log(k[3]));
export const camera = (t: number): Cam => {
  let base: Cam;
  if (t <= KT[0]) base = {x: KX[0], y: KY[0], s: Math.exp(KS[0])};
  else if (t >= KT[KT.length - 1]) base = {x: KX[KX.length - 1], y: KY[KY.length - 1], s: Math.exp(KS[KS.length - 1])};
  else {
    let i = 0;
    while (t >= KT[i + 1]) i++;
    const u = (t - KT[i]) / (KT[i + 1] - KT[i]);
    base = {x: hermite(KX, KT, i, u), y: hermite(KY, KT, i, u), s: Math.exp(hermite(KS, KT, i, u))};
  }
  return {x: base.x + 7 * Math.sin(t * 0.8), y: base.y + 6 * Math.cos(t * 0.6), s: base.s * (1 + 0.006 * Math.sin(t * 1.1))};
};
export const viewTransform = (c: Cam) => `translate(${540 - c.x * c.s} ${SCY - c.y * c.s}) scale(${c.s})`;
export const toScreen = (wx: number, wy: number, c: Cam) => ({x: 540 + (wx - c.x) * c.s, y: SCY + (wy - c.y) * c.s});
/** Máy quay "xa" cho lớp nền (thị sai): k nhỏ thì trôi chậm hơn lớp chính */
const parallax = (c: Cam, k: number): Cam => ({x: lerp(540, c.x, k), y: lerp(700, c.y, k), s: 1 + (c.s - 1) * k * 0.8});

/* ---------- số giả ngẫu nhiên có hạt giống ---------- */
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const wrap = (v: number, m: number) => ((v % m) + m) % m;

/** Gradient, filter dùng chung: đặt một lần trong <svg> gốc (Backdrop cũng dùng) */
export const Defs = () => (
  <defs>
    <linearGradient id="v6-cell1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFDCCB" />
      <stop offset="0.55" stopColor="#F9AFA2" />
      <stop offset="1" stopColor="#E9857F" />
    </linearGradient>
    <linearGradient id="v6-cell2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#EE958D" />
      <stop offset="1" stopColor="#C85F66" />
    </linearGradient>
    <radialGradient id="v6-nuc" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stopColor="#B79CF0" />
      <stop offset="0.6" stopColor="#7F5BCB" />
      <stop offset="1" stopColor="#5A3C9E" />
    </radialGradient>
    <linearGradient id="v6-channel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#4A3A78" />
      <stop offset="0.6" stopColor="#A56C8E" />
      <stop offset="1" stopColor="#FFE7B8" />
    </linearGradient>
    <linearGradient id="v6-inner" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFD2C4" />
      <stop offset="0.25" stopColor="#F0958F" />
      <stop offset="0.65" stopColor="#C4546F" />
      <stop offset="1" stopColor="#7E2D5B" />
    </linearGradient>
    <linearGradient id="v6-beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.8" />
      <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="v6-tower" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFF4E2" />
      <stop offset="1" stopColor="#F1CFA6" />
    </linearGradient>
    <radialGradient id="v6-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
      <stop offset="0.5" stopColor="#FFF0D6" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FFF0D6" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="v6-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.45" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <filter id="v6-soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="v6-blur8" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
  </defs>
);

/* ---------- nền màn hình: gradient trời + ánh sáng + hạt bay chậm ---------- */
type Particle = {x: number; y: number; r: number; vx: number; vy: number; d: number; a: number; kind: number; ph: number};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry(606);
  return Array.from({length: 52}, (_, i) => ({
    x: rnd() * 1080,
    y: rnd() * 1500,
    r: 4 + rnd() * rnd() * 34,
    vx: (rnd() - 0.5) * 14,
    vy: -4 - rnd() * 12,
    d: 0.15 + rnd() * 0.7,
    a: 0.25 + rnd() * 0.45,
    kind: i % 9 === 0 ? 1 : i % 7 === 0 ? 2 : 0,
    ph: rnd() * 6.28,
  }));
})();

export const Backdrop = ({t, cam}: {t: number; cam: Cam}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #BFE6FA 0%, #D9F0FC 30%, #EEF8FF 52%, #FFEBD8 70%, #F6B9AE 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 800px 560px at ${560 + 30 * Math.sin(t * 0.3)}px ${520 + 20 * Math.cos(t * 0.4)}px, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Defs />
      {PARTICLES.map((p, i) => {
        const camx = (cam.x - 540) * p.d * 0.5;
        const camy = (cam.y - 720) * p.d * 0.5;
        const x = wrap(p.x + p.vx * t - camx, 1160) - 40;
        const y = wrap(p.y + p.vy * t - camy, 1560) - 40;
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.9 + p.ph);
        if (p.kind === 1) {
          const r = 9 + p.r * 0.3;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${t * 10 + p.ph * 20})`} opacity={p.a * 0.8}>
              <path d={`M ${-r} 0 H ${r} M 0 ${-r} V ${r}`} stroke="#F26E21" strokeWidth={r * 0.55} strokeLinecap="round" />
            </g>
          );
        }
        if (p.kind === 2) {
          const r = 10 + p.r * 0.5;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${t * 6 + p.ph * 30})`} opacity={p.a * 0.7}>
              <path d={`M 0 ${-r} C ${r * 0.8} ${-r * 0.2} ${r * 0.7} ${r * 0.8} 0 ${r * 0.9} C ${-r * 0.7} ${r * 0.8} ${-r * 0.8} ${-r * 0.2} 0 ${-r} Z`} fill="#8CCBEE" fillOpacity={0.6} />
            </g>
          );
        }
        return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#v6-bokeh)" opacity={p.a * pulse} />;
      })}
    </svg>
  </>
);

/* ---------- lớp xa (thị sai 0,35): cụm tháp cổng mờ + tường nối, và lớp giữa (0,65): bóng tế bào lơ lửng ---------- */
const FAR_TOWERS = [-160, 300, 880, 1340, 1820];
export const FarLayer = ({cam, t}: {cam: Cam; t: number}) => {
  const c = parallax(cam, 0.35);
  const m = parallax(cam, 0.68);
  return (
    <>
      <g transform={viewTransform(c)} filter="url(#v6-soft)">
        <rect x={-900} y={770} width={3000} height={70} fill="#B5D6EA" opacity={0.7} />
        {FAR_TOWERS.map((x, i) => {
          const h = 150 + (i % 3) * 30;
          return (
            <g key={i} opacity={0.55}>
              <rect x={x - 70} y={770 - h} width={140} height={h + 10} rx={10} fill="#BFDDF0" stroke="#fff" strokeWidth={5} />
              {[-50, -16, 18].map((dx, k) => (
                <rect key={k} x={x + dx} y={770 - h - 26} width={30} height={30} rx={6} fill="#BFDDF0" stroke="#fff" strokeWidth={4} />
              ))}
              <circle cx={x} cy={770 - h * 0.55} r={26} fill="#E9F5FD" stroke="#fff" strokeWidth={5} />
              <path d={`M ${x} ${770 - h * 0.55} L ${x + 12 * Math.cos(t * 0.5 + i)} ${770 - h * 0.55 + 12 * Math.sin(t * 0.5 + i)}`} stroke="#9DC3DC" strokeWidth={5} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
      <g transform={viewTransform(m)} filter="url(#v6-soft)">
        {BUBBLES.map((b, i) => {
          const y = b.y + 12 * Math.sin(t * 0.6 + b.ph);
          return (
            <g key={i} transform={`translate(${b.x + 10 * Math.cos(t * 0.4 + b.ph)} ${y})`} opacity={b.a}>
              <circle r={b.r} fill="#fff" fillOpacity={0.4} stroke="#fff" strokeOpacity={0.8} strokeWidth={6} />
              <ellipse cx={b.r * 0.12} cy={b.r * 0.1} rx={b.r * 0.38} ry={b.r * 0.3} fill="#CDBBF2" fillOpacity={0.55} />
              <circle cx={-b.r * 0.4} cy={-b.r * 0.4} r={b.r * 0.14} fill="#fff" fillOpacity={0.7} />
            </g>
          );
        })}
      </g>
    </>
  );
};
const BUBBLES = (() => {
  const rnd = mulberry(77);
  return Array.from({length: 15}, (_, i) => ({x: -140 + i * 150 + (rnd() - 0.5) * 70, y: 300 + rnd() * 340, r: 40 + rnd() * 70, a: 0.45 + rnd() * 0.35, ph: rnd() * 6.28}));
})();

/* ---------- thành mô: hai hàng tế bào, rãnh cổng ở giữa ---------- */
type Cell = {x0: number; w: number; k: number};
const buildRow = (seed: number, wBase: number, jitter: number): Cell[] => {
  const rnd = mulberry(seed);
  const out: Cell[] = [];
  let x = GATE_X + CH_HALF;
  while (x < 2200) {
    const w = wBase + (rnd() - 0.5) * jitter;
    out.push({x0: x, w, k: rnd()});
    x += w;
  }
  x = GATE_X - CH_HALF;
  while (x > -1000) {
    const w = wBase + (rnd() - 0.5) * jitter;
    out.push({x0: x - w, w, k: rnd()});
    x -= w;
  }
  return out;
};
const ROW1 = buildRow(11, 134, 22);
const ROW2 = buildRow(23, 196, 40);

const Row1Cell = ({c, t}: {c: Cell; t: number}) => {
  const yt = SURF + (c.k - 0.5) * 10;
  const yb = ROW1_BOT;
  const r = Math.min(34, c.w / 3);
  const xc = c.x0 + c.w / 2;
  const d = `M ${f1(c.x0)} ${yb} L ${f1(c.x0)} ${f1(yt + r)} Q ${f1(c.x0)} ${f1(yt)} ${f1(c.x0 + r)} ${f1(yt)} L ${f1(c.x0 + c.w - r)} ${f1(yt)} Q ${f1(c.x0 + c.w)} ${f1(yt)} ${f1(c.x0 + c.w)} ${f1(yt + r)} L ${f1(c.x0 + c.w)} ${yb} Z`;
  const nx = xc + (c.k - 0.5) * 20;
  const ny = lerp(yt + 80, yb - 50, c.k);
  // vi nhung mao ở mặt trên: lắc nhẹ liên tục
  const hairs = Array.from({length: 6}, (_, i) => {
    const hx = c.x0 + 14 + i * ((c.w - 28) / 5);
    const h = 16 + ((i * 7 + Math.floor(c.k * 10)) % 3) * 6;
    const sw = 5 * Math.sin(t * 1.9 + c.k * 9 + i);
    return `M ${f1(hx)} ${f1(yt + 3)} Q ${f1(hx + sw * 0.4)} ${f1(yt - h * 0.5)} ${f1(hx + sw)} ${f1(yt - h)}`;
  }).join(' ');
  return (
    <g>
      <path d={hairs} fill="none" stroke="#E0786D" strokeWidth={4.5} strokeLinecap="round" />
      <path d={d} fill="url(#v6-cell1)" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${f1(c.x0 + 12)} ${f1(yt + r + 24)} V ${f1(yt + r + 14)} Q ${f1(c.x0 + 12)} ${f1(yt + 12)} ${f1(c.x0 + r + 6)} ${f1(yt + 12)}`} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${f1(c.x0 + c.w - 8)} ${yb - 8} V ${f1(yt + 60)}`} fill="none" stroke="#C9645F" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
      <ellipse cx={nx} cy={ny} rx={31} ry={36} fill="url(#v6-nuc)" stroke={NAVY} strokeWidth={4.5} />
      <circle cx={nx + 7} cy={ny + 6} r={9} fill="#4A2F8A" opacity={0.7} />
      <circle cx={nx - 10} cy={ny - 13} r={6} fill="#fff" opacity={0.7} />
      <circle cx={xc - 32 + c.k * 14} cy={ny - 52 - c.k * 10} r={4.5} fill="#fff" opacity={0.55} />
      <circle cx={xc + 28} cy={ny + 54 - c.k * 12} r={5.5} fill="#fff" opacity={0.45} />
      <circle cx={xc - 30} cy={ny + 40} r={4} fill="#C85F66" opacity={0.55} />
    </g>
  );
};

const Row2Cell = ({c}: {c: Cell}) => {
  const yt = ROW1_BOT;
  const yb = INNER_TOP;
  const d = `M ${f1(c.x0)} ${yt} H ${f1(c.x0 + c.w)} V ${yb - 20} Q ${f1(c.x0 + c.w)} ${yb} ${f1(c.x0 + c.w - 20)} ${yb} H ${f1(c.x0 + 20)} Q ${f1(c.x0)} ${yb} ${f1(c.x0)} ${yb - 20} Z`;
  const xc = c.x0 + c.w / 2;
  return (
    <g>
      <path d={d} fill="url(#v6-cell2)" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={xc + (c.k - 0.5) * 30} cy={yt + 36} rx={38} ry={17} fill="url(#v6-nuc)" stroke={NAVY} strokeWidth={4} />
      <circle cx={xc - 60 + c.k * 20} cy={yt + 22} r={4} fill="#fff" opacity={0.5} />
      <path d={`M ${f1(c.x0 + 14)} ${yt + 14} H ${f1(c.x0 + 50)}`} stroke="#fff" strokeOpacity={0.4} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const RBC = (() => {
  const rnd = mulberry(909);
  return Array.from({length: 40}, () => ({x: rnd() * 3200 - 1000, y: 1050 + rnd() * 560, r: 16 + rnd() * 22, v: 8 + rnd() * 22, a: 0.4 + rnd() * 0.4, rot: rnd() * 90}));
})();
/** cơ quan mờ phía sau (khối mềm làm mờ) để bên trong cơ thể có chiều sâu */
const ORGANS = [
  {cx: -300, cy: 1290, rx: 260, ry: 130, c: '#A93F6C', rot: -8},
  {cx: 120, cy: 1330, rx: 230, ry: 110, c: '#C0587A', rot: 6},
  {cx: 700, cy: 1310, rx: 300, ry: 120, c: '#A93F6C', rot: -4},
  {cx: 1280, cy: 1340, rx: 260, ry: 120, c: '#C0587A', rot: 7},
  {cx: 1800, cy: 1300, rx: 300, ry: 130, c: '#A93F6C', rot: -6},
];
const wave = (y: number, amp: number, x0: number, x1: number, ph: number) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 120) pts.push(`${x === x0 ? 'M' : 'L'} ${x} ${f1(y + amp * Math.sin(x * 0.006 + ph))}`);
  return pts.join(' ');
};

/** Bên trong cơ thể: nền ấm chuyển sắc, tia sáng từ rãnh cổng, mao mạch có hạt chạy, hồng cầu trôi */
const Inner = ({t, cam}: {t: number; cam: Cam}) => {
  const x0 = cam.x - 700 / cam.s;
  const x1 = cam.x + 700 / cam.s;
  return (
    <g>
      <rect x={-1000} y={INNER_TOP - 2} width={3300} height={1500} fill="url(#v6-inner)" />
      <g filter="url(#v6-blur8)" opacity={0.42}>
        {ORGANS.map((o, i) => (
          <g key={i} transform={`translate(${o.cx} ${o.cy + 6 * Math.sin(t * 0.7 + i)}) rotate(${o.rot})`}>
            <ellipse rx={o.rx} ry={o.ry} fill={o.c} />
            <ellipse cx={-o.rx * 0.25} cy={-o.ry * 0.3} rx={o.rx * 0.5} ry={o.ry * 0.3} fill="#FFD3C8" opacity={0.5} />
          </g>
        ))}
      </g>
      {/* ánh sáng tràn xuống từ rãnh cổng */}
      <path d={`M ${GATE_X - CH_HALF + 10} ${INNER_TOP} L ${GATE_X + CH_HALF - 10} ${INNER_TOP} L ${GATE_X + 420} 1700 L ${GATE_X - 420} 1700 Z`} fill="url(#v6-beam)" opacity={0.75 + 0.12 * Math.sin(t * 1.7)} />
      {/* mao mạch: động mạch đỏ và tĩnh mạch xanh, hạt trắng chạy theo dòng */}
      {[
        {y: 1440, c: '#E2574F', dir: 1, ph: 0.4},
        {y: 1560, c: '#6C8FD8', dir: -1, ph: 2.1},
      ].map((v, i) => {
        const d = wave(v.y, 26, -900, 2200, v.ph);
        return (
          <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke={NAVY} strokeOpacity={0.35} strokeWidth={46} />
            <path d={d} stroke={v.c} strokeOpacity={0.7} strokeWidth={34} />
            <path d={d} stroke="#fff" strokeOpacity={0.35} strokeWidth={8} transform="translate(0 -9)" />
            <path d={d} stroke="#fff" strokeOpacity={0.85} strokeWidth={9} strokeDasharray="2 58" strokeDashoffset={v.dir * t * 100} />
          </g>
        );
      })}
      {/* hồng cầu trôi chậm */}
      {RBC.map((r, i) => {
        const x = wrap(r.x + r.v * t + 1000, 3200) - 1000;
        if (x < x0 - 80 || x > x1 + 80) return null;
        const y = r.y + 10 * Math.sin(t * 0.8 + i);
        return (
          <g key={i} transform={`translate(${f1(x)} ${f1(y)}) rotate(${r.rot + t * 12})`} opacity={r.a}>
            <ellipse rx={r.r} ry={r.r * 0.78} fill="#E04B58" stroke="#8F2030" strokeWidth={3} />
            <ellipse rx={r.r * 0.45} ry={r.r * 0.34} fill="#B63546" />
            <ellipse cx={-r.r * 0.3} cy={-r.r * 0.3} rx={r.r * 0.22} ry={r.r * 0.12} fill="#fff" fillOpacity={0.6} />
          </g>
        );
      })}
    </g>
  );
};

/* ---------- tháp cổng: tường gạch, 5 răng cưa, đồng hồ 24 vạch, cửa vòm, cờ ---------- */
export const TOWER = {x0: 380, x1: 700, top: 520, bot: SURF};
export const CLOCK = {x: GATE_X, y: 618, r: 66};
export const Tower = ({t, hand}: {t: number; hand: number}) => {
  const {x0, x1, top, bot} = TOWER;
  const cx = (x0 + x1) / 2;
  const flag = (k: number) => 8 * Math.sin(t * 4 + k);
  // góc kim: chạy chậm liên tục; `hand` (>0) là số vòng thêm vào khi quét 24 giờ
  const ang = (t * 6 + hand * 360) % 360;
  return (
    <g>
      {/* cột cờ và cờ cam có giọt trắng, phấp phới */}
      <path d={`M ${cx} ${top - 28} V ${top - 130}`} stroke={NAVY} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${cx + 4} ${top - 126} C ${cx + 50} ${top - 140 + flag(0)} ${cx + 80} ${top - 112 + flag(1)} ${cx + 128} ${top - 122 + flag(2)} L ${cx + 106} ${top - 96 + flag(3)} L ${cx + 128} ${top - 72 + flag(2)} C ${cx + 80} ${top - 62 + flag(1)} ${cx + 50} ${top - 86 + flag(0)} ${cx + 4} ${top - 76} Z`} fill="#F26E21" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M ${cx + 40} ${top - 112} c 8 12 12 18 0 24 c -12 -6 -8 -12 0 -24 Z`} fill="#fff" fillOpacity={0.9} />
      {/* răng cưa */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x0 + 6 + i * 62} y={top - 34} width={46} height={44} rx={8} fill="url(#v6-tower)" stroke={NAVY} strokeWidth={6} />
      ))}
      {/* thân tháp */}
      <rect x={x0} y={top} width={x1 - x0} height={bot - top + 4} rx={14} fill="url(#v6-tower)" stroke={NAVY} strokeWidth={7} />
      {/* gạch */}
      <g stroke="#D9B58A" strokeOpacity={0.7} strokeWidth={3} fill="none" strokeLinecap="round">
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <path d={`M ${x0 + 8} ${top + 48 + r * 46} H ${x1 - 8}`} />
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M ${x0 + 40 + k * 80 + (r % 2) * 40} ${top + 48 + r * 46} v 46`} />
            ))}
          </g>
        ))}
      </g>
      <path d={`M ${x0 + 14} ${top + 16} H ${x0 + 14} V ${bot - 20}`} stroke="#fff" strokeOpacity={0.7} strokeWidth={8} strokeLinecap="round" fill="none" />
      <rect x={x1 - 38} y={top + 10} width={26} height={bot - top - 14} fill="#D9B58A" opacity={0.35} />
      {/* đồng hồ: 24 vạch, kim */}
      <g transform={`translate(${CLOCK.x} ${CLOCK.y})`}>
        <circle r={CLOCK.r + 10} fill="#F26E21" stroke={NAVY} strokeWidth={6} />
        <circle r={CLOCK.r} fill="#fff" stroke={NAVY} strokeWidth={5} />
        {Array.from({length: 24}, (_, i) => (
          <path key={i} d={`M 0 ${-CLOCK.r + 6} v ${i % 6 === 0 ? 14 : 7}`} stroke={NAVY} strokeWidth={i % 6 === 0 ? 5 : 3} strokeLinecap="round" transform={`rotate(${i * 15})`} />
        ))}
        <path d={`M 0 8 L 0 ${-CLOCK.r + 20}`} stroke={NAVY} strokeWidth={7} strokeLinecap="round" transform={`rotate(${ang})`} />
        <path d={`M 0 0 L 0 ${-CLOCK.r + 34}`} stroke="#F26E21" strokeWidth={8} strokeLinecap="round" transform={`rotate(${(ang / 12) % 360})`} />
        <circle r={7} fill={NAVY} />
      </g>
      {/* cửa vòm: hai cánh mở ra hai bên */}
      <g>
        <path d={`M ${GATE_X - 50} ${bot} V ${bot - 52} Q ${GATE_X - 50} ${bot - 98} ${GATE_X} ${bot - 98} Q ${GATE_X + 50} ${bot - 98} ${GATE_X + 50} ${bot - 52} V ${bot} Z`} fill="url(#v6-channel)" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M ${GATE_X - 50} ${bot} V ${bot - 70} L ${GATE_X - 86} ${bot - 62} V ${bot - 6} Z`} fill="#B97B4B" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M ${GATE_X + 50} ${bot} V ${bot - 70} L ${GATE_X + 86} ${bot - 62} V ${bot - 6} Z`} fill="#B97B4B" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M ${GATE_X - 70} ${bot - 50} V ${bot - 14} M ${GATE_X + 70} ${bot - 50} V ${bot - 14}`} stroke="#E3B07C" strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** Thành mô + rãnh cổng + bên trong + tháp; `children` vẽ phía trên cùng (huy hiệu, nhân vật, đạo cụ) */
export const Wall = ({t, cam, hand = 0, children}: {t: number; cam: Cam; hand?: number; children?: React.ReactNode}) => {
  const x0 = cam.x - 640 / cam.s;
  const x1 = cam.x + 640 / cam.s;
  const vis = (c: Cell) => c.x0 + c.w >= x0 && c.x0 <= x1;
  const r1 = ROW1.filter(vis).sort((a, b) => a.x0 - b.x0);
  const r2 = ROW2.filter(vis).sort((a, b) => a.x0 - b.x0);
  const glowFlick = 0.8 + 0.2 * Math.sin(t * 3.1);
  return (
    <g>
      <Inner t={t} cam={cam} />
      {/* rãnh cổng thông xuống bên trong */}
      <g>
        <rect x={GATE_X - CH_HALF} y={SURF} width={CH_HALF * 2} height={INNER_TOP - SURF + 4} fill="url(#v6-channel)" />
        <ellipse cx={GATE_X} cy={INNER_TOP + 6} rx={CH_HALF + 10} ry={40} fill="url(#v6-glow)" opacity={glowFlick} />
        {Array.from({length: 7}, (_, i) => {
          const p = wrap(t * 0.45 + i / 7, 1);
          const x = GATE_X + 28 * Math.sin(i * 2.4 + t * 1.2);
          return <circle key={i} cx={x} cy={lerp(INNER_TOP, SURF + 20, p)} r={4 + (i % 3) * 1.6} fill="#FFF6DC" opacity={0.85 * Math.sin(Math.PI * p)} />;
        })}
        <path d={`M ${GATE_X - CH_HALF} ${SURF} V ${INNER_TOP} M ${GATE_X + CH_HALF} ${SURF} V ${INNER_TOP}`} stroke={NAVY} strokeWidth={6} />
        <path d={`M ${GATE_X - CH_HALF + 8} ${SURF + 10} V ${INNER_TOP - 14}`} stroke="#fff" strokeOpacity={0.18} strokeWidth={8} strokeLinecap="round" />
      </g>
      {r2.map((c, i) => (
        <Row2Cell key={`b${i}`} c={c} />
      ))}
      <path d={`M ${x0} ${ROW1_BOT} H ${GATE_X - CH_HALF} M ${GATE_X + CH_HALF} ${ROW1_BOT} H ${x1}`} stroke="#7A2C3A" strokeWidth={7} strokeLinecap="round" />
      {r1.map((c, i) => (
        <Row1Cell key={`a${i}`} c={c} t={t} />
      ))}
      <Tower t={t} hand={hand} />
      {children}
    </g>
  );
};

/** Phủ nhạt ngoài vùng đang nói tới (độ mờ khoảng 30–40%): tâm/bán kính theo tọa độ thế giới, a = độ đặc 0..1 */
export const Focus = ({cam, x, y, r, a}: {cam: Cam; x: number; y: number; r: number; a: number}) => {
  if (a <= 0.01) return null;
  const s = toScreen(x, y, cam);
  const R = r * cam.s;
  return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle ${R * 1.7}px at ${s.x}px ${s.y}px, rgba(236,244,250,0) ${R * 0.7}px, rgba(236,244,250,${0.46 * a}) ${R * 1.7}px)`}} />;
};
