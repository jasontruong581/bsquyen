/* Soi: ống soi mềm tròn có mắt, nhân vật dẫn chuyện (trấn an). Khung cục bộ của đầu: gốc ở tâm đầu, mặt quay sang trái, mũi soi (đèn + thòng lọng) ở x = -112,
   dây mềm phía sau chạy dọc đường tâm đại tràng tới hậu môn. Tông theo docs/video-giong-dieu.md: chỉ cười khi `soiMood` cho phép (ngoài vùng nghiêm). */
import {NAVY} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {PATH_LEN, ANUS, pathAt} from './Path';
import {SoiMood, clamp01, smooth, track} from './Motion';
import {E, S, W} from './timeline';

export const TIP = {x: -112, y: 0};
const SHELL_D = '#1B6E9E';
const GLOVE = '#FFFFFF';
const GLOVE_D = '#BFE3F2';

/* ---------- dây mềm: đi từ cổ của đầu soi dọc đường tâm tới hậu môn rồi ra ngoài ---------- */
export const Cord = ({t, u}: {t: number; u: number}) => {
  const u0 = Math.min(PATH_LEN, u + 78);
  let d = '';
  let n = 0;
  for (let q = u0; q <= PATH_LEN; q += 10) {
    const p = pathAt(q);
    const w = 6 * Math.sin(q * 0.05 - t * 2.4) * clamp01((q - u0) / 80);
    d += `${n++ === 0 ? 'M' : 'L'} ${(p.x + p.nx * w).toFixed(1)} ${(p.y + p.ny * w).toFixed(1)} `;
  }
  // phần đã ra khỏi hậu môn: kéo thẳng theo hướng cuối
  d += `L ${(ANUS.x + ANUS.tx * 90).toFixed(1)} ${(ANUS.y + ANUS.ty * 90).toFixed(1)} L ${(ANUS.x + ANUS.tx * 480).toFixed(1)} ${(ANUS.y + ANUS.ty * 480).toFixed(1)}`;
  if (u0 >= PATH_LEN) d = `M ${(ANUS.x + ANUS.tx * 4).toFixed(1)} ${(ANUS.y + ANUS.ty * 4).toFixed(1)} L ${(ANUS.x + ANUS.tx * 480).toFixed(1)} ${(ANUS.y + ANUS.ty * 480).toFixed(1)}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={NAVY} strokeWidth={40} />
      <path d={d} stroke="#2A8FBE" strokeWidth={28} />
      <path d={d} stroke="#6FD0EA" strokeWidth={14} transform="translate(0 -4)" />
      <path d={d} stroke={NAVY} strokeOpacity={0.55} strokeWidth={28} strokeDasharray="3 26" strokeLinecap="butt" />
      <path d={d} stroke="#fff" strokeOpacity={0.6} strokeWidth={4} transform="translate(0 -9)" />
    </g>
  );
};

/* ---------- thòng lọng (cảnh 5) ---------- */
export type Pt = {x: number; y: number};
export const T_SNARE = {
  out: W(5, 'nội') - 0.1,
  reach: W(5, 'polyp') - 0.1,
  slide: W(5, 'ngay') - 0.05,
  snip: W(5, 'soi', 1) + 0.05,
  retract: W(5, 'soi', 1) + 0.3,
  gone: W(5, 'soi', 1) + 1.2,
  back: E(5) + 0.2,
};
export type SnareState = {
  /** tâm thòng lọng (toạ độ cục bộ của Soi), bán kính, độ đặc; null nếu chưa ra */
  loop: {x: number; y: number; rx: number; ry: number; a: number} | null;
  /** đầu polyp đã bị cắt và đang được kéo về (toạ độ cục bộ của Soi), thu nhỏ s */
  carry: {x: number; y: number; s: number} | null;
  /** phần dây thòng lọng đã kéo lại về mũi (0 = còn nguyên) */
  snip: boolean;
  flash: number;
};
export const snareState = (t: number, head: Pt, neck: Pt): SnareState => {
  const T = T_SNARE;
  if (t < T.out || t > T.back) return {loop: null, carry: null, snip: false, flash: 0};
  const tipC = {x: TIP.x - 14, y: TIP.y + 6};
  let c: Pt;
  let rx: number;
  let ry: number;
  let a = 1;
  let carry: SnareState['carry'] = null;
  const hr = 62;
  if (t < T.reach) {
    const p = smooth(clamp01((t - T.out) / (T.reach - T.out)));
    c = {x: lerp(tipC.x, head.x, p), y: lerp(tipC.y, head.y, p) + 12 * Math.sin(p * Math.PI)};
    rx = lerp(8, hr, p);
    ry = lerp(8, hr - 4, p);
    a = clamp01((t - T.out) / 0.15);
  } else if (t < T.slide) {
    c = {x: head.x + 3 * Math.sin(t * 6), y: head.y + 2 * Math.cos(t * 5)};
    rx = hr;
    ry = hr - 4;
  } else if (t < T.snip) {
    const p = smooth(clamp01((t - T.slide) / (T.snip - T.slide)));
    c = {x: lerp(head.x, neck.x, p), y: lerp(head.y, neck.y, p)};
    rx = lerp(hr, 20, p);
    ry = lerp(hr - 4, 9, p);
  } else if (t < T.retract) {
    c = {x: neck.x, y: neck.y};
    rx = 11;
    ry = 6;
    carry = {x: head.x, y: head.y - 2 * smooth(clamp01((t - T.snip) / 0.2)) * 0, s: 1};
  } else {
    const p = smooth(clamp01((t - T.retract) / (T.gone - T.retract)));
    c = {x: lerp(neck.x, tipC.x, p), y: lerp(neck.y, tipC.y, p) - 18 * Math.sin(p * Math.PI)};
    rx = lerp(11, 9, p);
    ry = lerp(6, 8, p);
    const sc = 1 - 0.78 * p;
    carry = {x: c.x - 4, y: c.y - 8 * sc, s: t < T.gone ? sc : 0};
    if (t >= T.gone) {
      carry = null;
      a = 1 - smooth(clamp01((t - T.gone) / (T.back - T.gone)));
    }
  }
  return {loop: {x: c.x, y: c.y, rx, ry, a}, carry, snip: t >= T.snip, flash: Math.max(0, 1 - Math.abs(t - T.snip - 0.08) / 0.28)};
};

const Snare = ({loop}: {loop: NonNullable<SnareState['loop']>}) => {
  const ax = loop.x + loop.rx; // điểm gắn dây vào vòng (phía mũi soi)
  const ay = loop.y;
  const cx = (TIP.x + ax) / 2;
  const cy = (TIP.y + ay) / 2 + 26;
  const d = `M ${TIP.x + 8} ${TIP.y + 4} Q ${cx} ${cy} ${ax} ${ay}`;
  return (
    <g opacity={loop.a}>
      <path d={d} fill="none" stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#E7EEF4" strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={loop.x} cy={loop.y} rx={Math.max(4, loop.rx)} ry={Math.max(4, loop.ry)} fill="none" stroke={NAVY} strokeWidth={9} />
      <ellipse cx={loop.x} cy={loop.y} rx={Math.max(4, loop.rx)} ry={Math.max(4, loop.ry)} fill="none" stroke="#F4F8FB" strokeWidth={4.5} />
    </g>
  );
};

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
const L_REST: [number, number] = [-34, 76];
const R_REST: [number, number] = [34, 78];
const L_KEYS: HK[] = [
  [0, ...L_REST],
  [S(4) - 0.4, ...L_REST],
  [S(4) + 0.3, -8, 70], // nghiêm: chắp tay
  [E(4) + 0.1, -8, 70],
  [T_SNARE.out - 0.2, ...L_REST],
  [T_SNARE.out + 0.4, -78, 62], // điều khiển thòng lọng
  [T_SNARE.back, -78, 62],
  [S(6), ...L_REST],
  [S(8) + 0.2, ...L_REST],
  [S(9) + 0.4, -8, 70], // nghiêm: chắp tay
  [E(9) + 0.2, -8, 70],
  [S(10) + 0.3, ...L_REST],
];
const R_KEYS: HK[] = [
  [0, ...R_REST],
  [S(4) - 0.4, ...R_REST],
  [S(4) + 0.3, 8, 72],
  [E(4) + 0.1, 8, 72],
  [T_SNARE.out - 0.2, ...R_REST],
  [T_SNARE.out + 0.5, -6, 70],
  [T_SNARE.back, -6, 70],
  [S(6), ...R_REST],
  [S(8) + 0.1, ...R_REST],
  [S(8) + 0.5, 4, 40], // "Mình lo hết": tay lên ngực
  [W(8, 'ngủ') - 0.2, 4, 40],
  [W(8, 'ngủ') + 0.3, ...R_REST],
  [S(9) - 0.3, ...R_REST],
  [S(9) + 0.4, 8, 72],
  [E(9) + 0.2, 8, 72],
  [S(10) + 0.9, ...R_REST],
  [S(10) + 1.8, -104, 26], // giơ ngón cái trước mũi soi
];
export const thumbsUp = (t: number) => t >= S(10) + 1.9;

const Mitt = ({x, y, thumb = false}: {x: number; y: number; thumb?: boolean}) => (
  <g transform={`translate(${x} ${y})`}>
    {thumb && <rect x={-10} y={-56} width={22} height={40} rx={11} fill={GLOVE} stroke={NAVY} strokeWidth={5.5} />}
    <circle r={25} fill={GLOVE} stroke={NAVY} strokeWidth={6} />
    <circle cx={-8} cy={-9} r={6} fill="#fff" />
    <path d="M -6 12 Q 6 6 15 -2" fill="none" stroke={GLOVE_D} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Arm = ({from, to}: {from: [number, number]; to: [number, number]}) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = Math.min(30, len * 0.22);
  const d = `M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2 + nx * k} ${(from[1] + to[1]) / 2 + ny * k} ${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={NAVY} strokeWidth={26} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#9FDCEE" strokeWidth={14} strokeLinecap="round" />
    </g>
  );
};

/* ---------- mặt ---------- */
const Eye = ({x, y, mood, look, blink}: {x: number; y: number; mood: SoiMood; look: [number, number]; blink: boolean}) => {
  if (mood === 'happy') return <path d={`M ${x - 17} ${y + 6} Q ${x} ${y - 16} ${x + 17} ${y + 6}`} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />;
  if (blink) return <path d={`M ${x - 17} ${y + 2} H ${x + 17}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={19} ry={22} fill="#fff" stroke={NAVY} strokeWidth={5} />
      <circle cx={x + look[0] * 7} cy={y + look[1] * 8} r={10.5} fill={NAVY} />
      <circle cx={x + look[0] * 7 + 4} cy={y + look[1] * 8 - 5} r={3.8} fill="#fff" />
      {mood === 'serious' && <path d={`M ${x - 19} ${y - 24} Q ${x} ${y - 30} ${x + 19} ${y - 24} V ${y - 22} Q ${x} ${y - 14} ${x - 19} ${y - 22} Z`} fill="#4FB8DC" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />}
    </g>
  );
};
const Mouth = ({x, y, mood}: {x: number; y: number; mood: SoiMood}) => {
  switch (mood) {
    case 'calm':
      return <path d={`M ${x - 12} ${y + 5} Q ${x} ${y + 6} ${x + 12} ${y + 5}`} fill="none" stroke={NAVY} strokeWidth={5.5} strokeLinecap="round" />;
    case 'serious':
      return <path d={`M ${x - 13} ${y + 5} H ${x + 13}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
    case 'smile':
      return <path d={`M ${x - 18} ${y} Q ${x} ${y + 20} ${x + 18} ${y}`} fill="none" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
    case 'happy':
      return (
        <g>
          <path d={`M ${x - 22} ${y - 3} Q ${x} ${y + 30} ${x + 22} ${y - 3} Z`} fill="#7A1F2B" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${x - 11} ${y + 10} Q ${x} ${y + 4} ${x + 11} ${y + 10} Q ${x} ${y + 20} ${x - 11} ${y + 10} Z`} fill="#F07A8A" />
        </g>
      );
  }
};

export type SoiProps = {
  t: number;
  mood: SoiMood;
  /** 0..1 độ sáng của đèn */
  light: number;
  /** hướng quét của tia sáng (độ) */
  sweep: number;
  /** ánh nhìn (-1..1) */
  look: [number, number];
  snare: SnareState;
  /** polyp đã cắt đang được kéo về: vẽ ở đây để nằm đúng trên thòng lọng */
  children?: React.ReactNode;
};

export const Soi = ({t, mood, light, sweep, look, snare, children}: SoiProps) => {
  const blink = t % 3.4 > 3.3;
  const L = trackH(L_KEYS, t);
  const R = trackH(R_KEYS, t);
  const thumb = thumbsUp(t);
  const ey = -6;
  return (
    <g>
      {/* tia sáng từ mũi soi (vẽ trước để nằm sau thân) */}
      {light > 0.01 && (
        <g transform={`translate(${TIP.x - 4} 0) rotate(${sweep}) scale(-1 1)`} opacity={light}>
          <path d="M 0 -10 L 380 -118 L 380 118 L 0 10 Z" fill="url(#g7-beam)" opacity={0.3} />
          <path d="M 0 -6 L 240 -62 L 240 62 L 0 6 Z" fill="url(#g7-beam)" opacity={0.34} />
        </g>
      )}
      {/* tay phía sau thân */}
      <Arm from={[-22, 46]} to={L} />
      <Arm from={[22, 46]} to={R} />
      {/* cổ nối dây mềm */}
      <rect x={56} y={-36} width={34} height={72} rx={12} fill="#145B86" stroke={NAVY} strokeWidth={6} />
      <path d="M 66 -30 V 30 M 78 -30 V 30" stroke="#6FD0EA" strokeOpacity={0.5} strokeWidth={3} />
      {/* thân đầu */}
      <rect x={-82} y={-60} width={146} height={120} rx={50} fill="url(#g7-scope)" stroke={NAVY} strokeWidth={7} />
      <path d="M -60 -40 C -50 -52 -20 -54 10 -52" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={8} strokeLinecap="round" />
      <path d="M -70 44 C -40 54 10 56 50 46" fill="none" stroke={SHELL_D} strokeOpacity={0.55} strokeWidth={8} strokeLinecap="round" />
      {/* mũi soi: ống kính và hai đèn LED */}
      <rect x={-118} y={-34} width={44} height={68} rx={16} fill="#264B66" stroke={NAVY} strokeWidth={6} />
      <circle cx={-104} cy={0} r={15} fill="#0E2A4A" stroke="#7FDAF0" strokeWidth={3.5} />
      <circle cx={-108} cy={-5} r={4.5} fill="#fff" />
      <circle cx={-96} cy={-24} r={6} fill="#FFE98A" opacity={0.55 + 0.45 * light} />
      <circle cx={-96} cy={24} r={6} fill="#FFE98A" opacity={0.55 + 0.45 * light} />
      {/* bàn tay vẽ trước thân để thấy rõ ngón cái */}
      <Mitt x={L[0]} y={L[1]} />
      <Mitt x={R[0]} y={R[1]} thumb={thumb} />
      {/* mặt */}
      <circle cx={-52} cy={20} r={10} fill="#F28FA8" opacity={0.45} />
      <circle cx={30} cy={20} r={10} fill="#F28FA8" opacity={0.45} />
      <Eye x={-32} y={ey} mood={mood} look={look} blink={blink} />
      <Eye x={14} y={ey} mood={mood} look={look} blink={blink} />
      <Mouth x={-9} y={26} mood={mood} />
      {/* thòng lọng + polyp được kéo về */}
      {snare.loop && <Snare loop={snare.loop} />}
      {children}
    </g>
  );
};
