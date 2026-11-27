/* Thế giới của V004: MỘT lá gan (nhìn từ phía trước) làm mô hình duy nhất của cả video, camera bay liên tục quanh nó.
   Tọa độ thế giới = tọa độ màn hình 1080x1920 khi camera ở (540, 700) phóng 1. Lá gan nằm ở tâm (540, 720), rộng ~760.
   Các lớp: nền gradient + hạt bay (màn hình) -> thân người mờ (thế giới, thị sai 0,5) -> ánh sáng -> gan (viền, mảng chuyển màu, bóng,
   tiểu thùy, mạch, túi mật) -> nhân vật/đạo cụ do index.tsx truyền vào làm `children`. */
import {NAVY} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {E, S, W} from './timeline';

export const LIVER_C = {x: 540, y: 720};
export const SCY = 700;

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng], nội suy Hermite (không dừng giữa các mốc) + rung nhẹ liên tục ---------- */
export type Cam = {x: number; y: number; s: number};
const WIDE = 0.93;
const KEYS: [number, number, number, number][] = [
  [0, 540, 700, WIDE],
  [1.6, 530, 668, 0.97],
  [S(2), 520, 640, 1.0],
  [S(2) + 2.6, 510, 612, 1.0],
  [S(3) - 0.2, 480, 650, 1.15],
  [S(3) + 1.3, 455, 692, 1.9], // lao vào bề mặt, sát mặt Gan
  [S(4), 452, 700, 2.0],
  [S(4) + 2.4, 440, 706, 2.1],
  [S(5), 408, 690, 1.95],
  [S(5) + 1.6, 420, 680, 1.62],
  [E(5), 440, 700, 1.5],
  [S(6) + 0.4, 500, 722, 1.05],
  [S(6) + 1.2, 540, 722, 0.9], // kéo ra thấy cả lá gan và thân mờ
  [E(6), 540, 722, 0.9],
  [S(7), 540, 600, 0.95],
  [S(7) + 1.2, 540, 500, 0.9], // gan tụt xuống thấp để chừa chỗ cho thẻ 1
  [E(7), 540, 500, 0.9],
  [S(8), 540, 610, 0.92],
  [E(8), 540, 660, 0.95],
  [S(9), 530, 700, 1.0],
  [E(9), 530, 760, 0.98],
  [S(10) + 0.5, 540, 970, 0.86], // gan lên cao, thẻ 2 ở nửa dưới
  [E(10) + 1.0, 540, 980, 0.86],
];
/** Hermite theo mốc thời gian với tiếp tuyến hữu hạn: vận tốc liên tục, camera không bao giờ "đứng khựng" ở mốc */
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
  // rung nhẹ, luôn có chuyển động
  return {x: base.x + 7 * Math.sin(t * 0.8), y: base.y + 6 * Math.cos(t * 0.6), s: base.s * (1 + 0.007 * Math.sin(t * 1.1))};
};
export const viewTransform = (c: Cam) => `translate(${540 - c.x * c.s} ${SCY - c.y * c.s}) scale(${c.s})`;
export const toScreen = (wx: number, wy: number, c: Cam) => ({x: 540 + (wx - c.x) * c.s, y: SCY + (wy - c.y) * c.s});
/** Máy quay "xa" cho lớp nền (thị sai): trôi chậm hơn lớp gan */
const parallax = (c: Cam, k: number): Cam => ({x: lerp(540, c.x, k), y: lerp(720, c.y, k), s: 1 + (c.s - 1) * k * 0.8});

/* ---------- bộ số giả ngẫu nhiên có hạt giống ---------- */
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash2 = (a: number, b: number) => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/* ---------- hình lá gan (tọa độ cục bộ, gốc ở tâm): thùy phải to bên trái màn hình, thùy trái thon bên phải, khuyết dây chằng tròn ở dưới ---------- */
export const LIVER_D =
  'M -378 34 C -394 -118 -272 -246 -92 -256 C 84 -266 250 -226 346 -122 C 388 -72 394 -16 372 34 C 340 108 232 150 124 150 Q 84 148 56 128 Q 42 150 34 176 C 4 224 -68 252 -172 250 C -292 248 -364 152 -378 34 Z';
const FALC = 'M 44 -258 C 64 -150 22 -30 48 128';
/** Cạnh trên của gan theo x cục bộ (để đặt đầu dò sát mép gan) */
export const topAt = (x: number) => {
  const pts: [number, number][] = [[-330, -170], [-250, -228], [-92, -256], [60, -258], [200, -226], [300, -160], [360, -90]];
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};

/* ---------- tiểu thùy: lưới lục giác méo, chia sẻ đỉnh để các cạnh khít nhau ---------- */
const RH = 38;
type Cell = {c: [number, number]; v: [number, number][]};
const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  const dx = Math.sqrt(3) * RH;
  const dy = 1.5 * RH;
  const jit = (x: number, y: number): [number, number] => {
    const kx = Math.round((x + 0.37) / 6);
    const ky = Math.round((y + 0.21) / 6);
    return [(hash2(kx, ky) - 0.5) * RH * 0.5, (hash2(ky + 91, kx - 17) - 0.5) * RH * 0.5];
  };
  for (let r = -8; r <= 8; r++) {
    for (let c = -13; c <= 13; c++) {
      const cx = c * dx + (Math.abs(r) % 2 ? dx / 2 : 0);
      const cy = r * dy;
      if (Math.abs(cx) > 410 || Math.abs(cy) > 285) continue;
      const v: [number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const a = ((30 + 60 * k) * Math.PI) / 180;
        const x = cx + RH * Math.cos(a);
        const y = cy + RH * Math.sin(a);
        const j = jit(x, y);
        v.push([x + j[0], y + j[1]]);
      }
      const mx = v.reduce((s, p) => s + p[0], 0) / 6;
      const my = v.reduce((s, p) => s + p[1], 0) / 6;
      out.push({c: [mx, my], v});
    }
  }
  return out;
})();
const f1 = (n: number) => n.toFixed(1);
const EDGES = CELLS.map((c) => `M ${c.v.map((p) => `${f1(p[0])} ${f1(p[1])}`).join(' L ')} Z`).join(' ');
const VEINS = CELLS.map((c) => `M ${f1(c.c[0] - 3.2)} ${f1(c.c[1])} a 3.2 3.2 0 1 0 6.4 0 a 3.2 3.2 0 1 0 -6.4 0`).join(' ');
const SPOKES = CELLS.map((c) => [0, 2, 4].map((k) => `M ${f1(c.c[0])} ${f1(c.c[1])} L ${f1(lerp(c.c[0], c.v[k][0], 0.7))} ${f1(lerp(c.c[1], c.v[k][1], 0.7))}`).join(' ')).join(' ');
const NODULES = CELLS.map((c) => `M ${c.v.map((p) => `${f1(lerp(c.c[0], p[0], 0.62))} ${f1(lerp(c.c[1], p[1], 0.62))}`).join(' L ')} Z`).join(' ');
const NODULE_HI = CELLS.map((c) => `M ${f1(c.c[0] - 14)} ${f1(c.c[1] - 12)} a 8 5 -30 1 0 12 -6 a 8 5 -30 1 0 -12 6`).join(' ');

/* ---------- mạch máu nổi trên mặt gan (thị giác, không phải giải phẫu chính xác) ---------- */
const SURFACE_VESSELS = [
  'M 50 140 C 30 60 -40 20 -120 -20 C -180 -50 -230 -110 -262 -170',
  'M 50 140 C 20 90 -60 90 -150 60 C -230 30 -300 40 -340 20',
  'M 56 120 C 90 40 150 10 230 -20 C 290 -45 330 -80 350 -118',
  'M 58 124 C 110 100 190 110 260 80 C 310 60 340 30 360 20',
  'M -120 -20 C -110 -90 -96 -150 -80 -226',
  'M 150 0 C 160 -70 170 -130 190 -200',
];

/** Định nghĩa gradient/clip dùng chung, đặt một lần trong <svg> gốc */
export const Defs = () => (
  <defs>
    <linearGradient id="g4-liver" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor="#F4A08A" />
      <stop offset="0.42" stopColor="#DD6C57" />
      <stop offset="1" stopColor="#A8433A" />
    </linearGradient>
    <radialGradient id="g4-hi" cx="0.3" cy="0.25" r="0.6">
      <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
      <stop offset="0.6" stopColor="#fff" stopOpacity="0.12" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g4-under" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stopColor="#6E2428" stopOpacity="0" />
      <stop offset="1" stopColor="#6E2428" stopOpacity="0.55" />
    </linearGradient>
    <radialGradient id="g4-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
      <stop offset="0.5" stopColor="#FFE3CF" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FFE3CF" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g4-heat" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FF5A3C" stopOpacity="0.75" />
      <stop offset="1" stopColor="#FF5A3C" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g4-gall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#9BE0A8" />
      <stop offset="1" stopColor="#3E9E62" />
    </linearGradient>
    <linearGradient id="g4-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
      <stop offset="0.18" stopColor="#FFFFFF" stopOpacity="0.5" />
      <stop offset="1" stopColor="#FFE9DC" stopOpacity="0.42" />
    </linearGradient>
    <radialGradient id="g4-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.45" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <filter id="g4-soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
    <filter id="g4-blur8" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <clipPath id="g4-clip">
      <path d={LIVER_D} />
    </clipPath>
  </defs>
);

/* ---------- thân người mờ phía sau (thị sai), có xương sườn, dạ dày, ruột ---------- */
const BODY =
  'M 392 120 L 392 190 C 300 205 150 215 95 290 C 58 345 70 520 95 700 C 122 900 175 1100 190 1300 C 200 1500 150 1700 140 1900 L 940 1900 C 930 1700 880 1500 890 1300 C 905 1100 958 900 985 700 C 1010 520 1022 345 985 290 C 930 215 780 205 688 190 L 688 120 Z';
const RIBS = Array.from({length: 8}, (_, i) => {
  const y = 330 + i * 62;
  const w = 330 + Math.min(i, 4) * 18 - Math.max(0, i - 4) * 26;
  return `M 540 ${y - 10} C ${540 - w * 0.45} ${y - 44} ${540 - w} ${y - 10} ${540 - w - 10} ${y + 90} M 540 ${y - 10} C ${540 + w * 0.45} ${y - 44} ${540 + w} ${y - 10} ${540 + w + 10} ${y + 90}`;
}).join(' ');

export const GhostBody = ({cam, dim = 1, t}: {cam: Cam; dim?: number; t: number}) => {
  const c = parallax(cam, 0.55);
  return (
    <g transform={viewTransform(c)} opacity={dim}>
      <g filter="url(#g4-soft)">
        <path d={BODY} fill="url(#g4-body)" stroke="#fff" strokeOpacity={0.75} strokeWidth={9} />
        <path d="M 392 205 C 440 250 500 262 540 262 C 580 262 640 250 688 205" fill="none" stroke="#F1B7A2" strokeOpacity={0.5} strokeWidth={12} strokeLinecap="round" />
        <path d={RIBS} fill="none" stroke="#F0B39C" strokeOpacity={0.55} strokeWidth={15} strokeLinecap="round" />
        <path d="M 540 262 V 760" stroke="#F0B39C" strokeOpacity={0.3} strokeWidth={22} strokeLinecap="round" />
        {/* mạch lớn: động mạch chủ (đỏ) và tĩnh mạch chủ dưới (xanh), hạt trắng chạy theo dòng máu */}
        {[
          {d: 'M 618 330 C 628 600 612 900 606 1250 C 602 1420 566 1560 528 1700', c: '#E5675A', dir: 1},
          {d: 'M 462 640 C 456 900 470 1100 478 1300 C 484 1450 506 1580 528 1700', c: '#6C8FD8', dir: -1},
        ].map((v, i) => (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={v.d} stroke={v.c} strokeOpacity={0.62} strokeWidth={30} />
            <path d={v.d} stroke="#fff" strokeOpacity={0.75} strokeWidth={8} strokeDasharray="2 46" strokeDashoffset={v.dir * t * 90} />
          </g>
        ))}
        {/* thận, lách, tim đập nhẹ */}
        <path d="M 372 1010 C 330 1010 318 1080 350 1130 C 376 1160 420 1130 410 1070 C 404 1036 392 1010 372 1010 Z" fill="#D9776B" fillOpacity={0.5} stroke="#C85F55" strokeOpacity={0.45} strokeWidth={7} />
        <path d="M 708 1010 C 750 1010 762 1080 730 1130 C 704 1160 660 1130 670 1070 C 676 1036 688 1010 708 1010 Z" fill="#D9776B" fillOpacity={0.5} stroke="#C85F55" strokeOpacity={0.45} strokeWidth={7} />
        <path d="M 905 760 C 950 740 975 800 950 860 C 930 905 890 880 888 830 C 887 800 890 770 905 760 Z" fill="#B7728A" fillOpacity={0.35} stroke="#A55E78" strokeOpacity={0.4} strokeWidth={7} />
        <g transform={`translate(660 380) scale(${1 + 0.05 * Math.max(0, Math.sin(t * 5.2)) ** 2})`}>
          <path d="M 0 60 C -90 0 -60 -70 -6 -40 C 20 -76 100 -50 70 20 C 50 60 20 90 0 110 C -10 96 -24 80 0 60 Z" fill="#E5675A" fillOpacity={0.4} stroke="#C94C45" strokeOpacity={0.45} strokeWidth={7} strokeLinejoin="round" />
        </g>
        {/* dạ dày */}
        <path d="M 640 930 C 760 900 860 960 840 1060 C 820 1150 700 1170 650 1110 C 610 1060 600 960 640 930 Z" fill="#F3A28F" fillOpacity={0.42} stroke="#E88A76" strokeOpacity={0.5} strokeWidth={7} />
        {/* quai ruột */}
        <path d="M 250 1230 C 330 1160 430 1260 520 1210 C 610 1160 700 1260 800 1200 C 880 1160 900 1290 820 1340 C 720 1400 620 1320 540 1380 C 450 1440 360 1360 280 1400 C 210 1430 190 1290 250 1230 Z" fill="none" stroke="#EFA08C" strokeOpacity={0.55} strokeWidth={26} strokeLinejoin="round" />
        <path d="M 330 1330 C 420 1290 470 1380 560 1350" fill="none" stroke="#EFA08C" strokeOpacity={0.3} strokeWidth={20} strokeLinecap="round" />
        {/* nhịp thở nhẹ của thân */}
        <ellipse cx={540} cy={560 + 6 * Math.sin(t * 2.2)} rx={410} ry={330} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={26} />
      </g>
    </g>
  );
};

/* ---------- nền màn hình: gradient + ánh sáng + hạt bay chậm ---------- */
type Particle = {x: number; y: number; r: number; vx: number; vy: number; d: number; a: number; kind: number; ph: number};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry(404);
  return Array.from({length: 54}, (_, i) => ({
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
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Backdrop = ({t, cam}: {t: number; cam: Cam}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFF6EC 0%, #FFE2CE 38%, #F8C4AE 74%, #F2A892 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 760px 620px at ${540 + 30 * Math.sin(t * 0.3)}px ${760 + 20 * Math.cos(t * 0.4)}px, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)`}} />
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
              <ellipse rx={r} ry={r * 0.78} fill="#E9705F" fillOpacity={0.55} />
              <ellipse rx={r * 0.45} ry={r * 0.34} fill="#F7B3A4" fillOpacity={0.8} />
            </g>
          );
        }
        return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#g4-bokeh)" opacity={p.a * pulse} />;
      })}
    </svg>
  </>
);

/** Phủ mờ ngoài vùng đang nói tới (độ mờ khoảng 30–40%): tâm/bán kính theo tọa độ thế giới, a = độ đặc 0..1 */
export const Focus = ({cam, x, y, r, a}: {cam: Cam; x: number; y: number; r: number; a: number}) => {
  if (a <= 0.01) return null;
  const s = toScreen(x, y, cam);
  const R = r * cam.s;
  return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle ${R * 1.7}px at ${s.x}px ${s.y}px, rgba(250,225,208,0) ${R * 0.7}px, rgba(250,222,205,${0.42 * a}) ${R * 1.7}px)`}} />;
};

/* ---------- lá gan ---------- */
export type LiverProps = {
  t: number;
  cam: Cam;
  /** 0..1: mức xơ (mặt gan mịn -> sần, sẫm màu) */
  fib: number;
  /** vị trí các ổ viêm nhẹ quanh vi-rút (tọa độ cục bộ) cùng độ đậm */
  heat?: {x: number; y: number; a: number}[];
  children?: React.ReactNode;
  /** 0..1: gan sáng khỏe lên (tin tốt) */
  glad?: number;
};

export const Liver = ({t, cam, fib, heat = [], children, glad = 0}: LiverProps) => {
  const breath = Math.sin(t * 2.3);
  const sx = 1 + 0.012 * breath;
  const sy = 1 + 0.02 * breath;
  const lob = 0.22 + 0.45 * clamp01((cam.s - 1) / 1.1);
  const fibStroke = 1 - 0.55 * fib;
  return (
    <g transform={`translate(${LIVER_C.x} ${LIVER_C.y})`}>
      <g transform={`scale(${sx} ${sy})`}>
        {/* ánh sáng nền phía sau gan */}
        <ellipse cx={0} cy={10} rx={560} ry={440} fill="url(#g4-glow)" opacity={0.8} />
        {/* mạch nối ở đỉnh và đáy (sau gan) */}
        <path d="M -30 -252 C -30 -300 -22 -330 -10 -360" fill="none" stroke={NAVY} strokeWidth={42} strokeLinecap="round" />
        <path d="M -30 -252 C -30 -300 -22 -330 -10 -360" fill="none" stroke="#6C8FD8" strokeWidth={28} strokeLinecap="round" />
        <path d="M -30 -252 C -30 -300 -22 -330 -10 -360" fill="none" stroke="#A9C1F2" strokeWidth={8} strokeLinecap="round" strokeDasharray="14 22" strokeDashoffset={-t * 40} />
        <path d="M 150 -246 C 170 -290 200 -318 236 -336" fill="none" stroke={NAVY} strokeWidth={30} strokeLinecap="round" />
        <path d="M 150 -246 C 170 -290 200 -318 236 -336" fill="none" stroke="#E5675A" strokeWidth={18} strokeLinecap="round" />
        {/* túi mật */}
        <g transform="translate(-92 222) rotate(18)">
          <path d="M -28 -40 C -52 -6 -50 54 -14 78 C 10 94 40 66 38 22 C 36 -14 22 -44 -28 -40 Z" fill="url(#g4-gall)" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -22 -16 C -34 10 -32 40 -18 56" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" />
          <path d="M 6 78 C 14 100 40 112 66 108" fill="none" stroke={NAVY} strokeWidth={13} strokeLinecap="round" />
          <path d="M 6 78 C 14 100 40 112 66 108" fill="none" stroke="#6DBE86" strokeWidth={6} strokeLinecap="round" />
        </g>
        {/* bóng đổ */}
        <path d={LIVER_D} fill="#7A2C2A" opacity={0.2} transform="translate(10 18)" />
        {/* thân gan: nền chuyển màu */}
        <path d={LIVER_D} fill="url(#g4-liver)" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
        <g clipPath="url(#g4-clip)">
          <rect x={-420} y={-300} width={840} height={600} fill="url(#g4-under)" />
          <ellipse cx={-170} cy={-110} rx={290} ry={170} fill="url(#g4-hi)" opacity={(1 - 0.75 * fib) * (0.9 + 0.1 * glad)} />
          {/* ổ viêm nhẹ */}
          {heat.map((h, i) => (h.a > 0.01 ? <circle key={i} cx={h.x} cy={h.y} r={72 + 12 * Math.sin(t * 5 + i)} fill="url(#g4-heat)" opacity={h.a * (0.7 + 0.3 * Math.sin(t * 4 + i * 2))} /> : null))}
          {/* tiểu thùy: viền lục giác, tĩnh mạch trung tâm, đường nan hoa */}
          <path d={EDGES} fill="none" stroke="#8C2F2C" strokeOpacity={lob * fibStroke} strokeWidth={2.2} strokeLinejoin="round" />
          <path d={SPOKES} fill="none" stroke="#C45A4B" strokeOpacity={lob * 0.9 * fibStroke} strokeWidth={1.6} strokeLinecap="round" />
          <path d={VEINS} fill="#7C2630" fillOpacity={lob * 1.1 * fibStroke} />
          {/* mạch trên mặt */}
          {SURFACE_VESSELS.map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" stroke="#8C2F2C" strokeOpacity={0.4} strokeWidth={9} strokeLinecap="round" />
              <path d={d} fill="none" stroke="#FFC9B8" strokeOpacity={0.35} strokeWidth={2.4} strokeLinecap="round" transform="translate(-2 -3)" />
            </g>
          ))}
          {/* xơ: dải mô sẹo nhạt giữa các cục sần, sẫm màu tổng thể */}
          {fib > 0.01 && (
            <g>
              <rect x={-420} y={-300} width={840} height={600} fill="#4A1F1C" opacity={0.3 * fib} />
              <path d={EDGES} fill="none" stroke="#EFD3B6" strokeOpacity={0.9 * fib} strokeWidth={5.5} strokeLinejoin="round" />
              <path d={NODULES} fill="#A8473A" stroke="#A8473A" strokeWidth={13} strokeLinejoin="round" opacity={fib} />
              <path d={NODULES} fill="none" stroke="#5E2323" strokeOpacity={0.5 * fib} strokeWidth={2} strokeLinejoin="round" transform="translate(2 3)" />
              <path d={NODULE_HI} fill="#FFE3D2" fillOpacity={0.5 * fib} />
            </g>
          )}
          {/* viền tối trong lòng đường biên cho cảm giác khối */}
          <path d={LIVER_D} fill="none" stroke="#6E2428" strokeOpacity={0.32} strokeWidth={34} strokeLinejoin="round" filter="url(#g4-blur8)" />
          <path d={LIVER_D} fill="none" stroke="#FFD2BF" strokeOpacity={0.35 * (1 - 0.7 * fib)} strokeWidth={5} strokeLinejoin="round" transform="translate(5 6)" />
        </g>
        {/* rãnh dây chằng liềm chia thùy phải/trái */}
        <path d={FALC} fill="none" stroke="#7E2B2B" strokeOpacity={0.55} strokeWidth={9} strokeLinecap="round" />
        <path d={FALC} fill="none" stroke="#FFD0BE" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" transform="translate(7 2)" />
        {/* bóng sáng cứng */}
        <path d="M -300 -140 C -270 -200 -200 -226 -130 -232" fill="none" stroke="#fff" strokeOpacity={0.6 * (1 - 0.8 * fib)} strokeWidth={14} strokeLinecap="round" />
        <path d="M 120 -226 C 190 -212 250 -178 296 -128" fill="none" stroke="#fff" strokeOpacity={0.4 * (1 - 0.8 * fib)} strokeWidth={9} strokeLinecap="round" />
        <path d={LIVER_D} fill="none" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
        {children}
      </g>
    </g>
  );
};

/** Tiến độ các lớp theo cảnh (dùng chung cho index.tsx) */
export const fibrosis = (t: number) => {
  const up = smooth(P(t, W(5, 'xơ') - 0.1, 2.2));
  const down = smooth(P(t, E(6) - 0.4, 1.6));
  return up * (1 - down);
};
