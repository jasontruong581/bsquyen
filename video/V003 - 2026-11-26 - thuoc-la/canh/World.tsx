/* Dáng người nhìn thẳng làm bản đồ (toạ độ lấy theo hình minh hoạ 1 của bài: viewBox 760x440, người ở giữa x=440).
   Dùng cho cảnh 1 (điếu thuốc, khói vào miệng), cảnh 3 (khói theo máu, gan - thận - bàng quang) và cảnh 6 (các chấm cam).
   Máy quay (camera) biến toạ độ thế giới thành toạ độ màn hình 1080x1920. */
import {P, lerp} from '../../src/timeline';
import {NAVY} from '../../src/common/overlays';
import {KHOI_W, Khoi} from './Characters';
import {E, S, W, khoiMood} from './timeline';

export const SKIN = '#f2a56e';
const SKIN_D = '#e08b4f';
const ORANGE = '#f26e21';
const GRAY_P = '#8D98A5';

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng], nội suy mượt giữa hai mốc ---------- */
export type Cam = {x: number; y: number; s: number};
const CAM_KEYS: [number, number, number, number][] = [
  [0, 385, 100, 3.4],
  [1.9, 392, 102, 3.3],
  [3.4, 440, 195, 2.4],
  [S(3) - 0.3, 440, 227, 1.8],
  [S(4) - 0.4, 440, 227, 1.8],
  [S(4) + 0.3, 440, 300, 6],
  [S(4) + 0.8, 440, 300, 6],
  [S(4) + 0.9, 440, 227, 1.8], // nhảy về toàn thân khi cả khung đang bị bảng tế bào che kín
];
export const camera = (t: number): Cam => {
  const k = CAM_KEYS;
  if (t <= k[0][0]) return {x: k[0][1], y: k[0][2], s: k[0][3]};
  for (let i = 0; i < k.length - 1; i++) {
    if (t < k[i + 1][0]) {
      const p = smooth((t - k[i][0]) / (k[i + 1][0] - k[i][0]));
      return {x: lerp(k[i][1], k[i + 1][1], p), y: lerp(k[i][2], k[i + 1][2], p), s: lerp(k[i][3], k[i + 1][3], p)};
    }
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], s: l[3]};
};
export const viewTransform = (c: Cam) => `translate(${540 - c.x * c.s} ${760 - c.y * c.s}) scale(${c.s})`;
export const toScreen = (wx: number, wy: number, c: Cam) => ({x: 540 + (wx - c.x) * c.s, y: 760 + (wy - c.y) * c.s});

/* ---------- Khói trong thế giới: cảnh 1 bay từ đầu điếu thuốc vào miệng, cảnh 3 cưỡi dòng máu ---------- */
const LOOP = {cx: 440, cy: 255, rx: 78, ry: 132};
const loopPos = (a: number) => ({x: LOOP.cx + LOOP.rx * Math.cos(a), y: LOOP.cy + LOOP.ry * Math.sin(a)});
const LOOP_T0 = 9.4;
const LOOP_W = 1.1;
const N_PART = 14;

const khoi1: [number, number, number, number][] = [
  [0, 346, 98, 0.25],
  [0.35, 350, 88, 1],
  [1.0, 372, 70, 1],
  [1.6, 414, 78, 1],
  [2.0, 436, 94, 0.8],
  [2.3, 441, 100, 0],
];
export type KhoiPose = {x: number; y: number; px: number; o: number};
/** Vị trí Khói trong thế giới (px = bề ngang trên màn hình, o = độ đặc); null nếu Khói không ở trong thế giới lúc này */
export const khoiWorld = (t: number): KhoiPose | null => {
  if (t < 2.3) {
    let i = 0;
    while (i < khoi1.length - 2 && t >= khoi1[i + 1][0]) i++;
    const a = khoi1[i];
    const b = khoi1[i + 1];
    const p = smooth(clamp01((t - a[0]) / (b[0] - a[0])));
    return {x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p), px: 170 * lerp(a[3], b[3], p), o: 1};
  }
  if (t >= S(3) && t < S(4) - 0.3) {
    const th = Math.PI * 0.55 + LOOP_W * Math.max(0, t - LOOP_T0);
    const from = {x: 440, y: 205};
    const b = smooth(P(t, S(3) + 0.05, 0.8));
    const l = loopPos(th);
    return {x: lerp(from.x, l.x, b), y: lerp(from.y, l.y, b), px: 130 * smooth(P(t, S(3), 0.3)), o: 1};
  }
  // cảnh 6: Khói đứng im bên trái dáng người, mặt trung tính, mờ dần
  if (t >= S(6) && t < S(7)) {
    return {x: 292, y: 300, px: 120, o: 0.85 * (1 - smooth(P(t, S(6) + 0.3, E(6) - S(6) - 0.2)))};
  }
  return null;
};

/* ---------- hình dáng người và các cơ quan ---------- */
const LUNG_L = 'M400 168 q-30 6 -32 50 q-2 44 22 50 q22 4 24 -20 V176 Q414 166 400 168 Z';
const LUNG_R = 'M480 168 q30 6 32 50 q2 44 -22 50 q-22 4 -24 -20 V176 Q466 166 480 168 Z';
const LIVER = 'M378 276 Q396 262 428 270 Q442 274 438 288 Q420 300 398 296 Q376 292 378 276 Z';
const BLADDER = 'M440 372 Q454 386 447 396 Q440 403 433 396 Q426 386 440 372 Z';

const Organ = ({d, lit, t}: {d: string; lit: number; t: number}) => (
  <g transform={`translate(0 0)`}>
    <path d={d} fill={lit > 0.01 ? `rgba(249,160,95,${0.25 + 0.75 * lit})` : '#fdeee2'} stroke={lit > 0.01 ? ORANGE : SKIN_D} strokeWidth={2.5 + 1.5 * lit} strokeLinejoin="round" opacity={lit > 0.01 ? 1 : 0.9} />
    {lit > 0.01 && <path d={d} fill="none" stroke={ORANGE} strokeWidth={2} opacity={0.5 * lit * (0.5 + 0.5 * Math.sin(t * 8))} transform="translate(0 0)" />}
  </g>
);

const Tag = ({x, y, anchor, text, lit, tx, ty}: {x: number; y: number; anchor: 'start' | 'end'; text: string; lit: number; tx: number; ty: number}) => {
  if (lit <= 0.01) return null;
  const w = text.length * 8.4 + 14;
  const bx = anchor === 'end' ? x - w : x;
  return (
    <g opacity={lit}>
      <path d={`M ${anchor === 'end' ? x : x} ${y} L ${tx} ${ty}`} stroke={NAVY} strokeWidth={1.6} strokeDasharray="3 3" />
      <rect x={bx} y={y - 11} width={w} height={22} rx={11} fill="#fff" stroke={NAVY} strokeWidth={2} />
      <text x={bx + w / 2} y={y + 5} textAnchor="middle" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight={800} fontSize={13} fill={NAVY}>
        {text}
      </text>
    </g>
  );
};

/* ---------- các chấm cam của cảnh 6 (theo hình minh hoạ 1): miệng, họng, phổi, thực quản, dạ dày, gan, tụy, thận, đại tràng, bàng quang ---------- */
const DOTS: [number, number, number][] = [
  [440, 98, 10],
  [440, 128, 9],
  [394, 214, 12],
  [486, 226, 12],
  [440, 196, 8],
  [470, 286, 10],
  [404, 282, 10],
  [440, 304, 8],
  [372, 318, 8],
  [508, 318, 8],
  [440, 346, 9],
  [440, 386, 10],
];
const DOT_T0 = W(6, 'hơn');
const DOT_STEP = 0.2;

type WorldProps = {t: number; cam: Cam};

export const World = ({t, cam}: WorldProps) => {
  const kh = khoiWorld(t);
  const showOrgans = t > S(3) - 1;
  const liver = P(t, W(3, 'gan') - 0.1, 0.3) * (1 - P(t, S(4) - 0.35, 0.3));
  const kidney = P(t, W(3, 'thận') - 0.1, 0.3) * (1 - P(t, S(4) - 0.35, 0.3));
  const bladder = P(t, W(3, 'bàng') - 0.1, 0.3) * (1 - P(t, S(4) - 0.35, 0.3));
  const flow = P(t, S(3) - 0.2, 0.5) * (1 - P(t, S(4) - 0.4, 0.3));

  /* hạt theo máu (cảnh 3) */
  const parts = [];
  if (flow > 0.01) {
    const bl = (i: number) => smooth(P(t, S(3) + 0.05 + (i % 5) * 0.06, 0.8));
    for (let i = 1; i < N_PART; i++) {
      const th = (i * 2 * Math.PI) / N_PART + LOOP_W * Math.max(0, t - LOOP_T0);
      const o = {x: 440 + (i % 2 ? 34 : -34) + ((i * 13) % 7 - 3) * 4, y: 196 + ((i * 29) % 9) * 7};
      const l = loopPos(th);
      const b = bl(i);
      parts.push(<circle key={i} cx={lerp(o.x, l.x, b)} cy={lerp(o.y, l.y, b)} r={5.5} fill={i % 4 === 0 ? ORANGE : GRAY_P} stroke={NAVY} strokeWidth={1.8} opacity={flow} />);
    }
  }
  /* hạt đi từ thận xuống bàng quang */
  const toBladder = [];
  for (let k = 0; k < 8; k++) {
    const ts = W(3, 'thận') + 0.05 + k * 0.11;
    const p = (t - ts) / 0.95;
    if (p <= 0 || p >= 1) continue;
    const left = k % 2 === 0;
    const a = left ? {x: 372, y: 318} : {x: 508, y: 318};
    const m = left ? {x: 398, y: 362} : {x: 482, y: 362};
    const e = {x: 440, y: 388};
    const q = smooth(p);
    const pt = q < 0.55 ? {x: lerp(a.x, m.x, q / 0.55), y: lerp(a.y, m.y, q / 0.55)} : {x: lerp(m.x, e.x, (q - 0.55) / 0.45), y: lerp(m.y, e.y, (q - 0.55) / 0.45)};
    toBladder.push(<circle key={k} cx={pt.x} cy={pt.y} r={4.8} fill={k % 3 === 0 ? ORANGE : GRAY_P} stroke={NAVY} strokeWidth={1.6} opacity={Math.min(1, (1 - p) * 4)} />);
  }
  /* hạt đi xuống họng (cuối cảnh 1) */
  const throat = [];
  const TH: [number, number][] = [
    [441, 102],
    [440, 128],
    [440, 168],
    [432, 196],
  ];
  for (let k = 0; k < 6; k++) {
    const p = (t - (2.3 + k * 0.16)) / 0.95;
    if (p <= 0 || p >= 1) continue;
    const f = p * (TH.length - 1);
    const i = Math.min(TH.length - 2, Math.floor(f));
    const u = f - i;
    const side = k % 2 ? 1 : -1;
    const spread = P(p, 0.7, 0.3) * 22 * side;
    throat.push(<circle key={k} cx={lerp(TH[i][0], TH[i + 1][0], u) + spread} cy={lerp(TH[i][1], TH[i + 1][1], u)} r={4.4} fill={k % 3 === 0 ? ORANGE : GRAY_P} stroke={NAVY} strokeWidth={1.5} opacity={Math.min(1, (1 - p) * 3)} />);
  }

  /* khói bốc lên từ đầu điếu thuốc (cảnh 1) */
  const smokeA = t < 3.2 ? Math.min(1, (3.2 - t) / 0.6) : 0;
  const wisps = [0, 1, 2].map((k) => {
    const ph = (t * 0.6 + k / 3) % 1;
    const x0 = 347 + 2 * k;
    const sw = 6 * Math.sin(t * 3 + k * 2);
    return <path key={k} d={`M ${x0} ${92 - ph * 8} q ${10 + sw} -16 0 -30 t 0 -30`} fill="none" stroke="#5b6b7b" strokeWidth={3.2} strokeLinecap="round" opacity={0.4 * smokeA * Math.min(1, ph * 5) * (1 - ph)} transform={`translate(0 ${-ph * 18})`} />;
  });
  const ember = 0.65 + 0.35 * Math.sin(t * 9);

  return (
    <g>
      {/* người */}
      <g fill={SKIN} stroke={SKIN_D} strokeWidth={4} strokeLinejoin="round">
        <circle cx={440} cy={78} r={44} />
        <path d="M422 118 h36 v18 h-36 Z" />
        <path d="M360 140 Q440 124 520 140 Q548 148 548 180 V330 Q548 360 520 372 L500 420 H380 L360 372 Q332 360 332 330 V180 Q332 148 360 140 Z" />
      </g>
      {/* miệng */}
      <ellipse cx={440} cy={100} rx={10} ry={5.5} fill="#8f3b24" stroke={SKIN_D} strokeWidth={2} />
      {/* phổi và các cơ quan */}
      <g fill="#fdeee2" stroke={SKIN_D} strokeWidth={3}>
        <path d={LUNG_L} />
        <path d={LUNG_R} />
      </g>
      {showOrgans && (
        <g>
          <path d="M 440 126 V 198" stroke={SKIN_D} strokeWidth={5} strokeLinecap="round" opacity={0.5} />
          <ellipse cx={470} cy={286} rx={18} ry={14} transform="rotate(-20 470 286)" fill="#fdeee2" stroke={SKIN_D} strokeWidth={2.5} />
          <ellipse cx={440} cy={304} rx={22} ry={6} fill="#fdeee2" stroke={SKIN_D} strokeWidth={2.5} />
          <path d="M 400 334 H 480 V 360 H 400 Z" fill="none" stroke={SKIN_D} strokeWidth={5} strokeLinejoin="round" opacity={0.55} />
          <Organ d={LIVER} lit={liver} t={t} />
          <Organ d="M 372 303 C 384 303 384 333 372 333 C 360 333 360 303 372 303 Z" lit={kidney} t={t} />
          <Organ d="M 508 303 C 520 303 520 333 508 333 C 496 333 496 303 508 303 Z" lit={kidney} t={t} />
          <Organ d={BLADDER} lit={bladder} t={t} />
          <Tag x={326} y={284} anchor="end" text="Gan" lit={liver} tx={378} ty={284} />
          <Tag x={556} y={322} anchor="start" text="Thận" lit={kidney} tx={517} ty={320} />
          <Tag x={326} y={392} anchor="end" text="Bàng quang" lit={bladder} tx={433} ty={392} />
        </g>
      )}
      {/* dòng máu (cảnh 3) */}
      {flow > 0.01 && (
        <g opacity={flow}>
          <ellipse cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} fill="none" stroke="#E04B4B" strokeOpacity={0.28} strokeWidth={14} />
          <ellipse cx={LOOP.cx} cy={LOOP.cy} rx={LOOP.rx} ry={LOOP.ry} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={3} strokeDasharray="10 14" strokeDashoffset={-t * 40} />
        </g>
      )}
      {parts}
      {toBladder}
      {/* điếu thuốc (cảnh 1) */}
      {t < 3.4 && (
        <g opacity={Math.min(1, (3.4 - t) / 0.5)}>
          <rect x={350} y={94} width={74} height={11} rx={3} fill="#fff" stroke="#5b6b7b" strokeWidth={1.6} />
          <rect x={424} y={94} width={14} height={11} rx={3} fill="#FFD9A8" stroke="#e08b4f" strokeWidth={1.6} />
          <rect x={344} y={94} width={9} height={11} rx={3} fill={ORANGE} stroke="#d85a10" strokeWidth={1.6} />
          <circle cx={343} cy={99.5} r={4 + 1.5 * ember} fill="#FFD9BD" opacity={0.55 * ember} />
          {wisps}
        </g>
      )}
      {throat}
      {/* chấm cam (cảnh 6) */}
      {t >= DOT_T0 - 0.05 && t < S(7) &&
        DOTS.map(([x, y, r], i) => {
          const p = P(t, DOT_T0 + i * DOT_STEP, 0.3);
          if (p <= 0) return null;
          const s = p < 1 ? 0.4 + 0.6 * p + 0.35 * Math.sin(p * Math.PI) : 1;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
              <circle r={r + 5} fill={ORANGE} opacity={0.25} />
              <circle r={r} fill={ORANGE} stroke="#d85a10" strokeWidth={4} />
              <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.28} fill="#ffd9bd" />
            </g>
          );
        })}
      {/* Khói */}
      {kh && <Khoi x={kh.x} y={kh.y} scale={kh.px / (KHOI_W * cam.s)} mood={khoiMood(t)} t={t} look={t > 2.3 ? 0 : 1} opacity={kh.o} />}
    </g>
  );
};
