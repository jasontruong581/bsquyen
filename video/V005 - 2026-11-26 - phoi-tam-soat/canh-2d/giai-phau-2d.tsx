/* Hình vẽ SVG của bản 2D (toạ độ thế giới: gốc ở giữa hai phổi, y hướng xuống, đơn vị điểm ảnh ở độ phóng 1).
   Mỗi cơ quan vẽ nhiều lớp: viền, mảng chuyển màu, nếp/thớ bên trong, vùng sáng. */
import {NAVY} from '../../src/common/overlays';

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const SK = {pink: '#FF86AB', pinkL: '#FFC3D4', pinkD: '#E5608E', tube: '#FF9C6B', tubeL: '#FFD3B8', cream: '#FFF1D6', peach: '#F7B9A3', alv: '#FF5C8A', nerve: '#FFD23C'};

/* ---------- hình dáng hai phổi (phổi phải của bệnh nhân nằm bên trái màn hình) ---------- */
export const LUNG_R = 'M -150 -340 C -235 -340 -305 -235 -332 -60 C -362 120 -342 292 -262 336 C -200 362 -62 352 -30 300 C -8 245 -22 150 -42 60 C -62 -22 -42 -122 -62 -205 C -78 -285 -100 -340 -150 -340 Z';
export const LUNG_L = 'M 150 -340 C 232 -340 302 -235 328 -60 C 356 120 336 292 258 336 C 196 362 96 352 66 300 C 44 270 74 210 78 150 C 82 85 36 20 40 -70 C 44 -170 58 -250 70 -290 C 88 -330 112 -340 150 -340 Z';
/* đường khe liên thuỳ: phải có 2 khe (3 thuỳ), trái có 1 khe (2 thuỳ) */
const FISSURES = [
  'M -334 -20 C -260 -50 -150 -70 -50 -150',
  'M -330 70 C -260 50 -160 40 -42 62',
  'M 326 -10 C 250 20 150 20 56 -100',
];

/* ---------- cây phế quản: chia cụm các đầu mút trong từng thuỳ ---------- */
type Seg = {a: [number, number]; b: [number, number]; c: [number, number]; w: number};
type Leaf = {x: number; y: number; dx: number; dy: number};
const segs: Seg[] = [];
const leaves: Leaf[] = [];
{
  const rand = mulberry(11);
  const seg = (a: [number, number], b: [number, number], w: number, bend = 0.1) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const k = (rand() - 0.5) * 2 * bend * len;
    segs.push({a, b, c: [(a[0] + b[0]) / 2 - (dy / len) * k, (a[1] + b[1]) / 2 + (dx / len) * k], w});
  };
  const grow = (o: [number, number], pts: [number, number][], w: number) => {
    if (pts.length === 1) {
      seg(o, pts[0], w, 0.14);
      const dx = pts[0][0] - o[0];
      const dy = pts[0][1] - o[1];
      const l = Math.hypot(dx, dy) || 1;
      leaves.push({x: pts[0][0], y: pts[0][1], dx: dx / l, dy: dy / l});
      return;
    }
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const hx = cx - o[0];
    const hy = cy - o[1];
    const sorted = [...pts].sort((p, q) => (p[0] - o[0]) * hy - (p[1] - o[1]) * hx - ((q[0] - o[0]) * hy - (q[1] - o[1]) * hx));
    const node: [number, number] = [o[0] + hx * 0.5, o[1] + hy * 0.5];
    seg(o, node, w, 0.06);
    const half = Math.ceil(sorted.length / 2);
    grow(node, sorted.slice(0, half), w * 0.8);
    grow(node, sorted.slice(half), w * 0.8);
  };
  // phế quản chính
  const carina: [number, number] = [0, -108];
  const hilumR: [number, number] = [-150, -22];
  const hilumL: [number, number] = [138, -22];
  seg(carina, hilumR, 32, 0.08);
  seg(carina, hilumL, 28, 0.08);
  type Box = {id: string; hilum: [number, number]; x: [number, number]; y: [number, number]; n: number; entry: [number, number]};
  const boxes: Box[] = [
    {id: 'ru', hilum: hilumR, x: [-300, -110], y: [-290, -110], n: 5, entry: [-190, -90]},
    {id: 'rm', hilum: hilumR, x: [-310, -130], y: [-70, 20], n: 3, entry: [-200, -15]},
    {id: 'rl', hilum: hilumR, x: [-300, -90], y: [90, 300], n: 6, entry: [-170, 60]},
    {id: 'lu', hilum: hilumL, x: [100, 290], y: [-290, -40], n: 6, entry: [175, -90]},
    {id: 'll', hilum: hilumL, x: [100, 290], y: [90, 300], n: 6, entry: [160, 60]},
  ];
  const placed: [number, number][] = [];
  for (const b of boxes) {
    const pts: [number, number][] = [];
    let tries = 0;
    while (pts.length < b.n && tries++ < 300) {
      const p: [number, number] = [b.x[0] + rand() * (b.x[1] - b.x[0]), b.y[0] + rand() * (b.y[1] - b.y[0])];
      if (placed.some((o) => Math.hypot(o[0] - p[0], o[1] - p[1]) < 58)) continue;
      pts.push(p);
      placed.push(p);
    }
    seg(b.hilum, b.entry, 22, 0.05);
    grow(b.entry, pts, 17);
  }
}
/** Vị trí các nhánh (cho cảnh zoom vào phế nang): đầu mút thuỳ dưới phổi phải gần nhất điểm (-250, 190) */
export const HERO_LEAF = leaves.reduce((m, l) => (Math.hypot(l.x + 250, l.y - 190) < Math.hypot(m.x + 250, m.y - 190) ? l : m), leaves[0]);

export const Tree = ({opacity = 1}: {opacity?: number}) => (
  <g opacity={opacity} strokeLinecap="round" fill="none">
    {segs.map((s, i) => (
      <path key={`o${i}`} d={`M ${s.a[0]} ${s.a[1]} Q ${s.c[0]} ${s.c[1]} ${s.b[0]} ${s.b[1]}`} stroke={NAVY} strokeWidth={s.w + 7} />
    ))}
    {segs.map((s, i) => (
      <path key={`f${i}`} d={`M ${s.a[0]} ${s.a[1]} Q ${s.c[0]} ${s.c[1]} ${s.b[0]} ${s.b[1]}`} stroke={SK.tube} strokeWidth={s.w} />
    ))}
    {segs.map((s, i) => (
      <path key={`h${i}`} d={`M ${s.a[0] - s.w * 0.18} ${s.a[1] - s.w * 0.18} Q ${s.c[0] - s.w * 0.18} ${s.c[1] - s.w * 0.18} ${s.b[0] - s.w * 0.18} ${s.b[1] - s.w * 0.18}`} stroke={SK.tubeL} strokeWidth={Math.max(2, s.w * 0.28)} opacity={0.75} />
    ))}
  </g>
);

/** Chùm phế nang ở đầu mút (phập phồng nhẹ) */
export const Alveoli = ({t}: {t: number}) => (
  <g>
    {leaves.map((l, i) => {
      const cx = l.x + l.dx * 16;
      const cy = l.y + l.dy * 16;
      const pulse = 1 + 0.09 * Math.sin(t * 5.2 + i * 1.7);
      return (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${pulse})`}>
          {[[-9, 4, 11], [9, 4, 11], [0, -9, 12], [0, 11, 9]].map(([x, y, r], k) => (
            <g key={k}>
              <circle cx={x} cy={y} r={r + 3} fill={NAVY} />
              <circle cx={x} cy={y} r={r} fill={SK.alv} />
              <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.32} fill="#fff" opacity={0.6} />
            </g>
          ))}
        </g>
      );
    })}
  </g>
);

/* ---------- khí quản ---------- */
export const Trachea = () => {
  const rings: number[] = [];
  for (let y = -740; y < -118; y += 36) rings.push(y);
  return (
    <g>
      <rect x={-40} y={-780} width={80} height={680} rx={14} fill={NAVY} />
      <rect x={-34} y={-780} width={68} height={680} rx={10} fill="url(#gTube)" />
      <rect x={-22} y={-780} width={11} height={680} fill="#fff" opacity={0.35} />
      {rings.map((y) => (
        <g key={y}>
          <rect x={-45} y={y - 1} width={90} height={22} rx={11} fill={NAVY} />
          <rect x={-41} y={y + 2} width={82} height={16} rx={8} fill={SK.cream} />
          <rect x={-30} y={y + 4} width={44} height={4} rx={2} fill="#fff" opacity={0.8} />
          <rect x={-41} y={y + 13} width={82} height={5} rx={2.5} fill="#E6C9A0" opacity={0.7} />
        </g>
      ))}
    </g>
  );
};

/* ---------- một lá phổi: viền, mảng chuyển màu, bóng, vùng sáng ---------- */
const Lung = ({d, sheen}: {d: string; sheen: string}) => (
  <g>
    <path d={d} fill="url(#gLung)" stroke={NAVY} strokeWidth={9} strokeLinejoin="round" />
    <path d={d} fill="url(#gLungShade)" />
    <path d={sheen} fill="#fff" opacity={0.32} />
  </g>
);

/** Hai phổi + cây phế quản + khí quản; `breath` = hệ số phập phồng quanh 1 */
export const Lungs = ({t, treeOpacity = 0.95}: {t: number; treeOpacity?: number}) => {
  const b = Math.sin((2 * Math.PI * t) / 3.4);
  return (
    <g transform={`scale(${1 + 0.012 * b} ${1 + 0.022 * b})`}>
      <Trachea />
      <Lung d={LUNG_R} sheen="M -235 -300 C -280 -230 -300 -150 -306 -90 C -250 -150 -200 -230 -150 -318 C -185 -322 -215 -314 -235 -300 Z" />
      <Lung d={LUNG_L} sheen="M 235 -300 C 280 -230 296 -150 300 -90 C 244 -150 196 -230 150 -318 C 185 -322 215 -314 235 -300 Z" />
      {FISSURES.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke={NAVY} strokeWidth={8} opacity={0.55} />
          <path d={d} stroke={SK.pinkL} strokeWidth={3} transform="translate(0 -4)" opacity={0.8} />
        </g>
      ))}
      <Tree opacity={treeOpacity} />
      <Alveoli t={t} />
    </g>
  );
};

/* ---------- thân người mờ phía sau (viền mờ của cơ thể) ---------- */
export const Body = ({opacity = 1}: {opacity?: number}) => (
  <g opacity={opacity}>
    <circle cx={0} cy={-930} r={150} fill="rgba(18,59,99,0.05)" stroke="rgba(18,59,99,0.16)" strokeWidth={7} />
    <path d="M -60 -790 L -60 -700 C -330 -690 -560 -640 -600 -420 L -640 560 C -640 760 -560 900 -520 1000 L 520 1000 C 560 900 640 760 640 560 L 600 -420 C 560 -640 330 -690 60 -700 L 60 -790 Z" fill="rgba(18,59,99,0.05)" stroke="rgba(18,59,99,0.16)" strokeWidth={7} strokeLinejoin="round" />
    <path d="M -520 -420 C -700 -380 -760 -120 -740 300 M 520 -420 C 700 -380 760 -120 740 300" fill="none" stroke="rgba(18,59,99,0.12)" strokeWidth={7} strokeLinecap="round" />
  </g>
);

/* ---------- máy CT: dải trụ rỗng nhìn nghiêng; phần sau vẽ dưới phổi, phần trước vẽ đè lên phổi ---------- */
export const RING = {rx: 430, ry: 92, ri: 352, rj: 74, h: 172};
const ell = (rx: number, ry: number) => `M ${-rx} 0 A ${rx} ${ry} 0 1 0 ${rx} 0 A ${rx} ${ry} 0 1 0 ${-rx} 0 Z`;

export const RingBack = ({y, k}: {y: number; k: number}) => {
  const {rx, ry, ri, rj, h} = RING;
  return (
    <g transform={`translate(0 ${y}) scale(${k})`}>
      <path d={`M ${-ri} 0 A ${ri} ${rj} 0 0 1 ${ri} 0 L ${ri} ${h} A ${ri} ${rj} 0 0 0 ${-ri} ${h} Z`} fill="#C9D3DE" stroke={NAVY} strokeWidth={7} />
      <path d={`${ell(rx, ry)} ${ell(ri, rj)}`} fillRule="evenodd" fill="#fff" stroke={NAVY} strokeWidth={8} />
    </g>
  );
};

export const RingSlice = ({y, k, a}: {y: number; k: number; a: number}) => (
  <g transform={`translate(0 ${y}) scale(${k})`} opacity={a}>
    <ellipse cx={0} cy={RING.h * 0.4} rx={RING.ri - 10} ry={RING.rj - 8} fill="#9BE7FF" opacity={0.3} stroke="#5CC8EC" strokeWidth={4} />
  </g>
);

export const RingFront = ({y, k}: {y: number; k: number}) => {
  const {rx, ry, ri, rj, h} = RING;
  return (
    <g transform={`translate(0 ${y}) scale(${k})`}>
      <path d={`M ${-rx} 0 A ${rx} ${ry} 0 0 0 ${rx} 0 L ${rx} ${h} A ${rx} ${ry} 0 0 1 ${-rx} ${h} Z`} fill="#F4F6FA" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M ${-rx + 6} ${h * 0.2} A ${rx - 6} ${ry - 4} 0 0 0 ${rx - 6} ${h * 0.2}`} fill="none" stroke="#1FAE9B" strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${-rx + 40} ${h * 0.85} A ${rx - 40} ${ry - 10} 0 0 0 ${-rx + 150} ${h * 0.88 + 28}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.9} />
      <path d={`M ${-rx} 0 A ${rx} ${ry} 0 0 0 ${rx} 0 L ${ri} 0 A ${ri} ${rj} 0 0 1 ${-ri} 0 Z`} fill="#fff" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
    </g>
  );
};

/* ---------- lăng kính phóng đại phế nang (cảnh 2): vẽ theo toạ độ cục bộ, gốc ở tâm lăng kính ---------- */
const GRAPES: [number, number, number, number][] = [
  [0, 90, 118, 0.2],
  [-150, 40, 96, 1.4],
  [150, 50, 100, 2.5],
  [-80, 190, 92, 3.1],
  [86, 200, 96, 4.0],
  [-210, 170, 78, 0.9],
  [215, 180, 80, 5.2],
  [-20, -30, 84, 2.0],
  [-150, -110, 70, 3.6],
  [150, -100, 72, 4.6],
  [0, 300, 84, 1.1],
];
export const Lens = ({t, nerve}: {t: number; nerve: number}) => (
  <g>
    <rect x={-600} y={-700} width={1200} height={1400} fill="url(#gLensBg)" />
    {/* ống tiểu phế quản đi vào từ phía trên */}
    <path d="M -30 -520 C -40 -400 -20 -300 0 -220" stroke={NAVY} strokeWidth={104} strokeLinecap="round" fill="none" />
    <path d="M -30 -520 C -40 -400 -20 -300 0 -220" stroke={SK.tube} strokeWidth={90} strokeLinecap="round" fill="none" />
    <path d="M -50 -520 C -60 -400 -38 -300 -20 -230" stroke={SK.tubeL} strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.8} />
    {[-460, -390, -320, -260].map((y, i) => (
      <path key={y} d={`M ${-78 + i * 3} ${y} q 46 18 92 0`} stroke={NAVY} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.55} />
    ))}
    {/* vài sợi thần kinh mảnh, thưa */}
    <g opacity={nerve} fill="none" strokeLinecap="round">
      {['M 260 -120 C 330 -60 300 20 370 80', 'M -300 -40 C -360 40 -330 120 -400 180', 'M 120 380 C 200 420 260 400 330 450'].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={NAVY} strokeWidth={13} />
          <path d={d} stroke={SK.nerve} strokeWidth={6} />
        </g>
      ))}
    </g>
    {GRAPES.map(([x, y, r, ph], i) => {
      const s = 1 + 0.07 * Math.sin(t * 5.2 + ph);
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle r={r + 10} fill={NAVY} />
          <circle r={r} fill="url(#gAlv)" />
          <path d={`M ${-r * 0.7} ${r * 0.3} A ${r * 0.8} ${r * 0.8} 0 0 0 ${r * 0.5} ${r * 0.65}`} stroke="#C23C6A" strokeWidth={r * 0.1} fill="none" strokeLinecap="round" opacity={0.5} />
          <ellipse cx={-r * 0.34} cy={-r * 0.4} rx={r * 0.26} ry={r * 0.16} fill="#fff" opacity={0.65} transform={`rotate(-30 ${-r * 0.34} ${-r * 0.4})`} />
        </g>
      );
    })}
  </g>
);

export const Defs = () => (
  <defs>
    <linearGradient id="gLung" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#FFB3C7" />
      <stop offset="1" stopColor="#FF7FA6" />
    </linearGradient>
    <linearGradient id="gLungShade" x1="0.2" y1="0.3" x2="1" y2="1">
      <stop offset="0" stopColor="#E5608E" stopOpacity="0" />
      <stop offset="1" stopColor="#C23C6A" stopOpacity="0.45" />
    </linearGradient>
    <linearGradient id="gTube" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#F7B9A3" />
      <stop offset="1" stopColor="#E89A86" />
    </linearGradient>
    <radialGradient id="gLensBg" cx="0.5" cy="0.45" r="0.8">
      <stop offset="0" stopColor="#B44A63" />
      <stop offset="1" stopColor="#5E1E3A" />
    </radialGradient>
    <radialGradient id="gAlv" cx="0.35" cy="0.3" r="0.9">
      <stop offset="0" stopColor="#FFB3C7" />
      <stop offset="0.6" stopColor="#FF6F96" />
      <stop offset="1" stopColor="#E0426F" />
    </radialGradient>
  </defs>
);
