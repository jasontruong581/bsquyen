/* Lính gác: tế bào miễn dịch đội mũ, lém lỉnh, cầm tờ "truy nã". Gốc tọa độ cục bộ ở giữa hai bàn chân (đứng trên mặt tường tại y = SURF),
   thân cao ~330. Tông theo docs/video-giong-dieu.md: trong hai cảnh [N] và ±2 giây quanh mọi chữ "ung thư" mặt không cười, chỉ gật đầu hoặc nghiêm mặt. */
import {NAVY, FONT} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {E, S, W} from './timeline';
import {SURF} from './World';

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type Mood = 'calm' | 'stern' | 'smirk' | 'serious' | 'relief' | 'smile' | 'happy';
/** Các mặt vui (có nụ cười): chỉ được dùng ngoài vùng nghiêm */
export const CHEERFUL: Mood[] = ['smirk', 'relief', 'smile', 'happy'];

export const moodAt = (t: number): Mood => {
  if (t < S(2) + 0.2) return 'calm'; // cảnh 1: chỉ gật đầu
  if (t < W(3, 'xem')) return 'stern'; // cảnh 2 và đầu cảnh 3: khoanh tay, nghiêm; ±2 giây quanh "ung thư" của cảnh 2 hết ở ~9,9s
  if (t < S(4)) return 'smirk'; // "xem mặt vi-rút": lém lỉnh, bắt quả tang
  if (t < W(5, 'Người') - 1.2) return 'serious'; // cảnh 4 và ±2 giây quanh "ung thư gan" (hết ~20,7s)
  if (t < W(6, 'tốt')) return 'calm'; // biểu đồ
  if (t < S(7)) return 'relief'; // cảnh 6: thở phào, mỉm cười nhẹ
  if (t < W(8, 'Tuổi') + 0.8) return 'serious'; // cảnh 7 và ±2 giây quanh hai chữ "ung thư" (hết ~40,7s)
  if (t < W(8, 'tiêm') + 0.5) return 'calm'; // gật đầu, trả lại tông ấm
  if (t < W(10, 'Follow')) return 'smile';
  return 'happy';
};

/* ---------- vị trí đứng theo thời gian (đi dọc tường cùng camera) ---------- */
type Key = [number, number];
const trackX = (keys: Key[], t: number) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
  }
  return keys[keys.length - 1][1];
};
const X_KEYS: Key[] = [
  [0, 215],
  [S(2) + 0.1, 215],
  [S(2) + 1.3, 345],
  [E(3), 345],
  [S(4) + 0.5, 330],
  [S(5) + 0.2, 330],
  [S(5) + 2.0, 640],
  [S(6) + 0.3, 640],
  [S(6) + 2.2, 395],
  [S(7) + 0.2, 395],
  [S(7) + 2.0, 745],
  [S(8) + 0.2, 745],
  [S(8) + 1.8, 1010],
  [S(9) + 0.5, 1010],
  [S(10) + 0.2, 1010],
  [S(10) + 2.2, 300],
];
export const linhX = (t: number) => trackX(X_KEYS, t);
/** vận tốc (px/s) để biết khi nào đang đi */
const speed = (t: number) => Math.abs(linhX(t + 0.04) - linhX(t - 0.04)) / 0.08;

/** Các lần gật đầu (0..1 mỗi lần) */
const NODS = [0.35, 2.25, W(8, 'tiêm') + 0.1, S(9) + 0.15, W(10, 'Xét') + 0.2];
const nodAmt = (t: number) => NODS.reduce((a, n) => a + Math.sin(Math.PI * clamp01((t - n) / 0.5)) ** 2 * (t >= n && t <= n + 0.5 ? 1 : 0), 0);

/* ---------- tay: mốc [t, x, y] cục bộ ---------- */
type HK = [number, number, number];
const trackH = (keys: HK[], t: number): [number, number] => {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t < keys[i + 1][0]) {
      const p = smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
      return [lerp(keys[i][1], keys[i + 1][1], p), lerp(keys[i][2], keys[i + 1][2], p)];
    }
  }
  const l = keys[keys.length - 1];
  return [l[1], l[2]];
};
const POSTER_UP = W(3, 'tờ') - 0.25;
const POSTER_DOWN = E(3) - 0.15; // hạ tờ truy nã trước khi sang cảnh 4
// bàn tay trái (bên trái màn hình): khoanh tay cảnh 2, đặt hông, chỉ biểu đồ, đặt ngực khi thở phào, chắp tay cảnh 7
const L_KEYS: HK[] = [
  [0, -126, -104],
  [S(2) + 0.2, -126, -104],
  [S(2) + 0.8, 56, -122], // khoanh tay: bàn trái sang bên phải ngực
  [POSTER_UP - 0.1, 56, -122],
  [POSTER_UP + 0.4, -128, -92], // thả ra, chống hông
  [S(5) + 0.4, -128, -92],
  [W(6, 'giờ') - 0.3, -126, -100],
  [W(6, 'giờ') + 0.2, -34, -124], // đặt tay lên ngực: thở phào
  [E(6) - 0.2, -34, -124],
  [S(7) + 0.5, -26, -98], // chắp tay (nghiêm)
  [W(8, 'tiêm') - 0.2, -26, -98],
  [W(8, 'tiêm') + 0.5, -126, -104],
];
const R_KEYS: HK[] = [
  [0, 126, -104],
  [S(2) + 0.2, 126, -104],
  [S(2) + 0.8, -56, -128], // khoanh tay: bàn phải sang bên trái ngực
  [POSTER_UP - 0.15, -56, -128],
  [POSTER_UP + 0.35, 158, -150], // giơ tờ truy nã
  [W(3, 'xem') - 0.1, 158, -150],
  [W(3, 'xem') + 0.35, 190, -160], // chìa tờ về phía vi-rút
  [POSTER_DOWN, 190, -160],
  [POSTER_DOWN + 0.6, 128, -100],
  [S(5) + 1.6, 128, -100],
  [S(5) + 2.3, 150, -232], // chỉ vào biểu đồ
  [E(5) + 0.1, 150, -232],
  [S(6) + 0.6, 128, -100],
  [S(7) + 0.5, 26, -98], // chắp tay
  [W(8, 'tiêm') - 0.2, 26, -98],
  [W(8, 'tiêm') + 0.4, 150, -84], // chỉ về phía huy hiệu
  [S(10), 150, -84],
  [S(10) + 1.4, 126, -104],
];

const BODY = '#BEDCFB';
const BODY_D = '#7FAEE8';
const BODY_L = '#F2F8FF';

const Mitt = ({x, y, rot = 0}: {x: number; y: number; rot?: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={25} fill={BODY} stroke={NAVY} strokeWidth={6} />
    <circle cx={-8} cy={-9} r={7} fill="#fff" fillOpacity={0.7} />
    <path d="M -2 10 Q 8 4 16 -2" fill="none" stroke={BODY_D} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Arm = ({from, to, side}: {from: [number, number]; to: [number, number]; side: 1 | -1}) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (nx * side < 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = Math.min(46, len * 0.25);
  const d = `M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2 + nx * k} ${(from[1] + to[1]) / 2 + ny * k} ${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={NAVY} strokeWidth={30} strokeLinecap="round" />
      <path d={d} fill="none" stroke={BODY} strokeWidth={18} strokeLinecap="round" />
    </g>
  );
};

/* ---------- mặt ---------- */
const Eye = ({x, y, mood, look, blink}: {x: number; y: number; mood: Mood; look: [number, number]; blink: boolean}) => {
  if (mood === 'happy' || mood === 'relief') return <path d={`M ${x - 22} ${y + 6} Q ${x} ${y - 18} ${x + 22} ${y + 6}`} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />;
  if (blink) return <path d={`M ${x - 22} ${y + 2} H ${x + 22}`} stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
  const lid = mood === 'stern' || mood === 'serious' ? 0.2 : mood === 'smirk' ? 0.28 : 0;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={27} ry={30} fill="#fff" stroke={NAVY} strokeWidth={5.5} />
      <circle cx={x + look[0] * 10} cy={y + look[1] * 11} r={14.5} fill={NAVY} />
      <circle cx={x + look[0] * 10 + 5} cy={y + look[1] * 11 - 6} r={5} fill="#fff" />
      {lid > 0 && <path d={`M ${x - 27} ${y - 31 + lid * 62} Q ${x} ${y - 36 + lid * 62} ${x + 27} ${y - 31 + lid * 62} V ${y - 33} H ${x - 27} Z`} fill={BODY} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />}
    </g>
  );
};

const Mouth = ({x, y, mood}: {x: number; y: number; mood: Mood}) => {
  switch (mood) {
    case 'calm':
      return <path d={`M ${x - 14} ${y + 4} Q ${x} ${y + 10} ${x + 14} ${y + 4}`} fill="none" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
    case 'stern':
    case 'serious':
      return <path d={`M ${x - 15} ${y + 6} H ${x + 15}`} stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
    case 'smirk':
      return <path d={`M ${x - 18} ${y + 8} Q ${x + 6} ${y + 14} ${x + 24} ${y - 6}`} fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
    case 'relief':
      return <path d={`M ${x - 17} ${y + 2} Q ${x} ${y + 16} ${x + 17} ${y + 2}`} fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
    case 'smile':
      return <path d={`M ${x - 22} ${y} Q ${x} ${y + 22} ${x + 22} ${y}`} fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
    case 'happy':
      return (
        <g>
          <path d={`M ${x - 26} ${y - 4} Q ${x} ${y + 34} ${x + 26} ${y - 4} Z`} fill="#7A1F2B" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M ${x - 13} ${y + 12} Q ${x} ${y + 5} ${x + 13} ${y + 12} Q ${x} ${y + 23} ${x - 13} ${y + 12} Z`} fill="#F07A8A" />
        </g>
      );
  }
};

const brow = (mood: Mood, x: number, y: number, side: 1 | -1) => {
  switch (mood) {
    case 'stern':
      return `M ${x - side * 28} ${y - 22} L ${x + side * 28} ${y - 6}`; // chau xuống phía trong
    case 'serious':
      return `M ${x + side * 28} ${y - 8} L ${x - side * 26} ${y - 20}`; // đầu trong nhướn lên: lo, nghiêm
    case 'smirk':
      return side === 1 ? `M ${x - 26} ${y - 6} Q ${x} ${y - 28} ${x + 26} ${y - 14}` : `M ${x - 26} ${y - 14} L ${x + 26} ${y - 4}`;
    case 'relief':
    case 'smile':
    case 'happy':
      return `M ${x - 26} ${y - 10} Q ${x} ${y - 26} ${x + 26} ${y - 10}`;
    default:
      return `M ${x - 26} ${y - 12} Q ${x} ${y - 18} ${x + 26} ${y - 12}`;
  }
};

/** Hướng nhìn của mắt (-1..1, x, y) */
const lookAt = (t: number): [number, number] => {
  if (t < S(2)) return [0.2, 0.05];
  if (t < S(4)) return [0.9, 0.05]; // nhìn sang phải về phía vi-rút
  if (t < S(5)) return [-0.4, 0.85]; // nhìn xuống huy hiệu gan
  if (t < S(6)) return [0.8, -0.2]; // nhìn biểu đồ
  if (t < S(7)) return [-0.1, 0.8]; // nhìn xuống em bé
  if (t < S(8)) return [0.6, 0.7]; // nhìn xuống huy hiệu cổ tử cung
  if (t < S(9)) return [0.4, 0.6];
  if (t < S(10)) return [0.8, 0.6]; // nhìn kính lúp
  return [0, 0.1];
};

/** Vị trí đầu Lính gác (toạ độ thế giới) để neo bong bóng */
export const linhHead = (t: number) => ({x: linhX(t) + 70, y: SURF - 300});

const Capped = ({dip, hat}: {dip: number; hat: number}) => (
  <g transform={`translate(0 ${dip * 8}) rotate(${hat + dip * 7} 0 -262)`}>
    <path d="M -76 -262 C -76 -322 -40 -344 0 -344 C 40 -344 76 -322 76 -262 Z" fill="#1F4F86" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -76 -262 H 76 V -280 H -76 Z" fill="#F26E21" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -50 -310 C -42 -328 -22 -336 -2 -338" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" />
    <path d="M -16 -258 H 112 Q 118 -258 116 -252 Q 112 -240 90 -240 H -16 Z" fill="#163A66" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 0 -322 L 8.5 -306 L 26 -304 L 13 -293 L 17 -276 L 0 -285 L -17 -276 L -13 -293 L -26 -304 L -8.5 -306 Z" fill="#FFC93C" stroke={NAVY} strokeWidth={4.5} strokeLinejoin="round" />
  </g>
);

export const Linh = ({t}: {t: number}) => {
  const x = linhX(t);
  const mood = moodAt(t);
  const look = lookAt(t);
  const sp = speed(t);
  const walking = sp > 12;
  const phase = (x / 34) * Math.PI;
  const bob = walking ? Math.abs(Math.sin(phase)) * 9 : 3 * Math.sin(t * 2.4);
  const nod = nodAmt(t);
  const blink = t % 3.4 > 3.28;
  const hat = 2 * Math.sin(t * 1.7);
  const lean = walking ? Math.sign(linhX(t + 0.04) - linhX(t - 0.04)) * 4 : 0;

  const lk = trackH(L_KEYS, t);
  const rk = trackH(R_KEYS, t);
  const sway = walking ? 10 * Math.sin(phase) : 3 * Math.sin(t * 1.9);
  const L: [number, number] = [lk[0], lk[1] + sway];
  const R: [number, number] = [rk[0], rk[1] - sway];

  // tờ truy nã: hiện lúc giơ lên, thu lại khi sang cảnh 4
  const posterS = smooth(P(t, POSTER_UP, 0.35)) * (1 - smooth(P(t, POSTER_DOWN, 0.3)));
  const thrust = smooth(P(t, W(3, 'xem') - 0.1, 0.4));
  const legA = walking ? 14 * Math.sin(phase) : 0;
  const legB = walking ? 14 * Math.sin(phase + Math.PI) : 0;
  const blush = mood === 'smile' || mood === 'happy' || mood === 'relief' ? 0.55 : mood === 'smirk' ? 0.35 : 0;
  const fy = -184;

  return (
    <g transform={`translate(${x} ${SURF})`}>
      {/* bóng đổ trên mặt tường */}
      <ellipse cx={0} cy={4} rx={112} ry={14} fill={NAVY} opacity={0.2} />
      {/* chân: hai ống chân ngắn và đôi ủng */}
      {[
        {k: -1, a: legA},
        {k: 1, a: legB},
      ].map(({k, a}) => (
        <g key={k} transform={`translate(${k * 44} ${-Math.max(0, a)})`}>
          <rect x={-17} y={-64} width={34} height={56} rx={14} fill={BODY} stroke={NAVY} strokeWidth={6} />
          <path d="M -34 -8 Q -34 -26 -10 -26 H 14 Q 40 -26 40 -8 Q 40 6 24 6 H -22 Q -34 6 -34 -8 Z" fill="#1F4F86" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -24 -16 H 8" stroke="#fff" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      <g transform={`translate(0 ${-bob}) rotate(${lean} 0 0)`}>
        {/* tay phải (bên phải màn hình) vẽ trước để tay khoanh chồng lên đúng thứ tự */}
        <Arm from={[98, -150]} to={R} side={1} />
        {/* thân: khối tròn xanh nhạt như bạch cầu */}
        <g transform={`translate(0 ${nod * 13}) rotate(${nod * 5} 0 -120)`}>
          <path d="M -108 -150 C -112 -246 -52 -276 0 -276 C 52 -276 112 -246 108 -150 C 106 -96 64 -54 0 -54 C -64 -54 -106 -96 -108 -150 Z" fill="url(#v6-linh)" stroke={NAVY} strokeWidth={7.5} strokeLinejoin="round" />
          {/* hạt đặc trưng của tế bào miễn dịch */}
          {[
            [-70, -110, 9],
            [-52, -88, 6],
            [66, -116, 8],
            [46, -86, 7],
            [-84, -170, 5],
            [86, -172, 6],
            [10, -78, 6],
          ].map(([gx, gy, gr], i) => (
            <circle key={i} cx={gx} cy={gy} r={gr} fill="#7E57C2" fillOpacity={0.5} />
          ))}
          <path d="M -88 -218 C -70 -248 -40 -262 -8 -266" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={9} strokeLinecap="round" />
          <path d="M 96 -120 C 90 -90 66 -68 36 -62" fill="none" stroke={BODY_D} strokeOpacity={0.55} strokeWidth={10} strokeLinecap="round" />
          {/* đai lưng và khoá cam */}
          <path d="M -100 -96 Q 0 -66 100 -96" fill="none" stroke={NAVY} strokeWidth={16} strokeLinecap="round" />
          <path d="M -100 -96 Q 0 -66 100 -96" fill="none" stroke="#1F4F86" strokeWidth={8} strokeLinecap="round" />
          <rect x={-17} y={-90} width={34} height={26} rx={7} fill="#F26E21" stroke={NAVY} strokeWidth={5} />
          {/* mặt */}
          <circle cx={-72} cy={fy + 36} r={16} fill="#FF8F8F" opacity={blush} />
          <circle cx={72} cy={fy + 36} r={16} fill="#FF8F8F" opacity={blush} />
          <path d={brow(mood, -40, fy - 30, -1)} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
          <path d={brow(mood, 40, fy - 30, 1)} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
          <Eye x={-40} y={fy} mood={mood} look={look} blink={blink} />
          <Eye x={40} y={fy} mood={mood} look={look} blink={blink} />
          <Mouth x={0} y={fy + 50} mood={mood} />
          <Capped dip={nod} hat={hat} />
        </g>
        {/* tay trái (bên trái màn hình) vẽ sau: khi khoanh tay nằm trên */}
        <Arm from={[-98, -150]} to={L} side={-1} />
        <Mitt x={R[0]} y={R[1]} rot={10} />
        <Mitt x={L[0]} y={L[1]} rot={-10} />
        {/* tờ truy nã cầm trên tay phải */}
        {posterS > 0.01 && (
          <g transform={`translate(${R[0] + 10 + thrust * 8} ${R[1] - 96 - thrust * 8}) rotate(${6 + 4 * Math.sin(t * 2.2)}) scale(${posterS * 1.2 * (1 + 0.08 * thrust)})`}>
            <Poster t={t} />
          </g>
        )}
      </g>
    </g>
  );
};

/** Tờ truy nã (gốc ở giữa tờ, rộng ~150, cao ~200) */
export const Poster = ({t}: {t: number}) => (
  <g>
    <path d="M -76 -104 L -50 -108 L -26 -102 L 0 -108 L 26 -102 L 52 -108 L 76 -102 V 100 L 52 106 L 26 100 L 0 106 L -26 100 L -50 106 L -76 100 Z" fill="#F4DDB0" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -64 -92 H 64 V -52 H -64 Z" fill="#B23A2E" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
    <text x={0} y={-62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill="#FFF4DA" letterSpacing={0}>
      TRUY NÃ
    </text>
    {/* chân dung vi-rút đeo kính đen */}
    <g transform="translate(0 20)">
      <circle r={42} fill="#B9A0E8" stroke={NAVY} strokeWidth={5} />
      {Array.from({length: 10}, (_, i) => (
        <circle key={i} cx={0} cy={-48} r={6} fill="#B9A0E8" stroke={NAVY} strokeWidth={3.5} transform={`rotate(${i * 36})`} />
      ))}
      <rect x={-32} y={-12} width={26} height={19} rx={8} fill="#1B1F3B" />
      <rect x={6} y={-12} width={26} height={19} rx={8} fill="#1B1F3B" />
      <path d="M -6 -5 H 6" stroke="#1B1F3B" strokeWidth={4} />
      <path d="M -13 20 H 13" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
    </g>
    <circle cx={-60} cy={-96} r={5} fill="#7A4B2A" />
    <circle cx={60} cy={-96} r={5} fill="#7A4B2A" />
    <path d="M -50 84 H 50" stroke="#B89A66" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    <path d="M -34 94 H 34" stroke="#B89A66" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
  </g>
);

/** Gradient riêng của Lính gác */
export const LinhDefs = () => (
  <linearGradient id="v6-linh" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0" stopColor={BODY_L} />
    <stop offset="0.5" stopColor={BODY} />
    <stop offset="1" stopColor={BODY_D} />
  </linearGradient>
);
