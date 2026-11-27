/* Gan: bác công nhân chịu khó. Chính lá gan là thân, mặt vẽ trên thùy phải, đội mũ bảo hộ, hai tay nhỏ.
   Tọa độ cục bộ của lá gan (gốc ở tâm gan), vẽ làm `children` của <Liver>.
   Tông theo docs/video-giong-dieu.md: từ đầu cảnh 4 tới hết cảnh 6 (và ±2 giây quanh chữ "ung thư") mặt trung tính, không cười. */
import {NAVY} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {E, S, SMILE_AT} from './timeline';

export const FACE = {x: -130, y: -30};
const SKIN = '#FFE2D0';
const SKIN_D = '#F2B9A0';
const smooth = (p: number) => p * p * (3 - 2 * p);

export type Mood = 'tired' | 'worry' | 'wonder' | 'neutral' | 'smile' | 'tickle' | 'happy';
export const moodAt = (t: number): Mood => {
  if (t < S(3) - 0.15) return 'tired'; // cảnh 1-2: mắt mệt nhưng cố cười
  if (t < S(4)) return 'worry'; // cảnh 3: nhìn sang bên, hơi lo
  if (t < S(5)) return 'wonder'; // cảnh 4: nhìn xuống tay, không đùa
  if (t < SMILE_AT) return 'neutral'; // cảnh 5-6 (và hết ±2 giây quanh "ung thư"): mặt trung tính
  if (t < E(7)) return 'neutral';
  if (t < S(8) + 0.7) return 'smile';
  if (t < E(8) - 0.25) return 'tickle';
  return 'happy';
};

/* ---------- tay: mốc [t, x, y] theo toạ độ cục bộ của gan, nội suy mượt ---------- */
type Key = [number, number, number];
const track = (keys: Key[], t: number): [number, number] => {
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

export const BAR_X = -130;
export const barY = (t: number) => -372 + 18 * Math.sin((t - S(2)) * 2.7);
export const BAR_IN = S(2) + 0.15;
export const BAR_OUT = E(2) + 0.1;
const gripL = (t: number): Key => [t, BAR_X - 188, barY(t)];
const gripR = (t: number): Key => [t, BAR_X + 190, barY(t)];

const L_KEYS: Key[] = [
  [0, -318, 150],
  [2.4, -322, 156],
  [S(2) + 0.3, -328, -120],
  [S(2) + 0.7, BAR_X - 188, -372],
  [E(2) - 0.2, BAR_X - 188, -372],
  [E(2) + 0.4, -334, 120],
  [S(3) + 1.0, -334, 124],
  [S(4) + 0.3, -190, 126],
  [S(5) - 0.5, -190, 126],
  [S(5) + 0.6, -338, 150],
  [S(7), -336, 150],
  [S(8) + 0.2, -268, 150],
  [E(8) - 0.2, -268, 150],
  [S(9), -336, 140],
  [S(10) + 0.6, -352, -30],
  [S(10) + 2.4, -352, -30],
];
const R_KEYS: Key[] = [
  [0, 4, 150],
  [2.4, 4, 156],
  [S(2) + 0.3, 20, -150],
  [S(2) + 0.7, BAR_X + 190, -372],
  [E(2) - 0.2, BAR_X + 190, -372],
  [E(2) + 0.4, 0, 176],
  [S(3) + 1.0, 0, 176],
  [S(5) + 0.6, 0, 176],
  [S(8) + 0.2, -8, 140],
  [E(8) - 0.2, -8, 140],
  [S(9) + 0.3, 30, -20], // cảnh 9: giơ ngón cái
  [S(10) + 2.4, 30, -20],
];

const Mitt = ({x, y, thumb = 0, rot = 0, s = 1}: {x: number; y: number; thumb?: number; rot?: number; s?: number}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {thumb > 0.5 ? (
      <g>
        <rect x={-11} y={-66} width={24} height={52} rx={12} fill={SKIN} stroke={NAVY} strokeWidth={5.5} />
        <circle cx={0} cy={0} r={31} fill={SKIN} stroke={NAVY} strokeWidth={6} />
        <path d="M -20 8 Q 0 18 20 8 M -20 -2 Q 0 8 20 -2" fill="none" stroke={SKIN_D} strokeWidth={3.5} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <circle cx={-22} cy={-8} r={13} fill={SKIN} stroke={NAVY} strokeWidth={5.5} />
        <circle cx={0} cy={0} r={31} fill={SKIN} stroke={NAVY} strokeWidth={6} />
        <path d="M -4 -14 Q 6 -4 -4 8 M 10 -12 Q 20 -2 10 10" fill="none" stroke={SKIN_D} strokeWidth={3.5} strokeLinecap="round" />
      </g>
    )}
  </g>
);

const Arm = ({from, to, side}: {from: [number, number]; to: [number, number]; side: 1 | -1}) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
  } else if (nx * side < 0) {
    nx = -nx;
    ny = -ny;
  }
  const k = Math.min(70, len * 0.22);
  const cx = (from[0] + to[0]) / 2 + nx * k;
  const cy = (from[1] + to[1]) / 2 + ny * k;
  const d = `M ${from[0]} ${from[1]} Q ${cx} ${cy} ${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} fill="none" stroke={NAVY} strokeWidth={26} strokeLinecap="round" />
      <path d={d} fill="none" stroke={SKIN} strokeWidth={14} strokeLinecap="round" />
    </g>
  );
};

/* ---------- gương mặt ---------- */
const Eye = ({x, y, mood, look, blink}: {x: number; y: number; mood: Mood; look: [number, number]; blink: boolean}) => {
  const happyShut = mood === 'tickle' || mood === 'happy';
  if (happyShut) return <path d={`M ${x - 22} ${y + 6} Q ${x} ${y - 20} ${x + 22} ${y + 6}`} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />;
  if (blink) return <path d={`M ${x - 22} ${y + 2} H ${x + 22}`} stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
  const lid = mood === 'tired' ? 0.42 : mood === 'smile' ? 0.12 : 0;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={31} ry={35} fill="#fff" stroke={NAVY} strokeWidth={5.5} />
      <circle cx={x + look[0] * 11} cy={y + look[1] * 12} r={16} fill={NAVY} />
      <circle cx={x + look[0] * 11 + 5} cy={y + look[1] * 12 - 6} r={5.5} fill="#fff" />
      {lid > 0 && (
        <g>
          <path d={`M ${x - 31} ${y - 4 - 70 * (0.5 - lid)} H ${x + 31} V ${y - 40} H ${x - 31} Z`} fill={SKIN} />
          <path d={`M ${x - 30} ${y - 4 - 70 * (0.5 - lid)} H ${x + 30}`} stroke={NAVY} strokeWidth={5.5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

const Mouth = ({x, y, mood}: {x: number; y: number; mood: Mood}) => {
  switch (mood) {
    case 'tired':
      return <path d={`M ${x - 28} ${y + 2} q 7 -9 14 0 t 14 0 t 14 0 t 14 0`} fill="none" stroke={NAVY} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />;
    case 'worry':
      return <path d={`M ${x - 17} ${y + 6} q 8.5 -8 17 0 t 17 0`} fill="none" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
    case 'wonder':
      return <ellipse cx={x} cy={y + 4} rx={9} ry={11} fill="#7A1F2B" stroke={NAVY} strokeWidth={5} />;
    case 'neutral':
      return <path d={`M ${x - 14} ${y + 6} H ${x + 14}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />;
    case 'smile':
      return <path d={`M ${x - 24} ${y - 2} Q ${x} ${y + 22} ${x + 24} ${y - 2}`} fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" />;
    case 'tickle':
      return (
        <g>
          <path d={`M ${x - 30} ${y - 6} Q ${x} ${y + 46} ${x + 30} ${y - 6} Z`} fill="#7A1F2B" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M ${x - 15} ${y + 22} Q ${x} ${y + 12} ${x + 15} ${y + 22} Q ${x} ${y + 34} ${x - 15} ${y + 22} Z`} fill="#F07A8A" />
        </g>
      );
    case 'happy':
      return (
        <g>
          <path d={`M ${x - 28} ${y - 4} Q ${x} ${y + 36} ${x + 28} ${y - 4} Z`} fill="#7A1F2B" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M ${x - 14} ${y + 14} Q ${x} ${y + 6} ${x + 14} ${y + 14} Q ${x} ${y + 26} ${x - 14} ${y + 14} Z`} fill="#F07A8A" />
        </g>
      );
  }
};

const brow = (mood: Mood, x: number, y: number, side: 1 | -1) => {
  const o = side; // -1 trái, +1 phải
  switch (mood) {
    case 'tired':
    case 'worry':
      return `M ${x + o * 30} ${y - 6} L ${x - o * 28} ${y - 22}`; // đầu trong nhướn lên
    case 'wonder':
      return `M ${x - 28} ${y - 14} Q ${x} ${y - 24} ${x + 28} ${y - 14}`;
    case 'neutral':
      return `M ${x - 28} ${y - 14} L ${x + 28} ${y - 14}`;
    case 'smile':
      return `M ${x - 28} ${y - 10} Q ${x} ${y - 24} ${x + 28} ${y - 10}`;
    default:
      return `M ${x - 28} ${y - 18} Q ${x} ${y - 36} ${x + 28} ${y - 18}`;
  }
};

/** Hướng nhìn của mắt (-1..1): cảnh 3 nhìn sang phải về phía vi-rút, cảnh 4 nhìn xuống tay */
const lookAt = (t: number): [number, number] => {
  if (t >= S(3) - 0.1 && t < S(4)) return [0.85 * smooth(P(t, S(3) - 0.1, 0.4)), 0.1];
  if (t >= S(4) && t < S(5)) return [-0.15, 0.9 * smooth(P(t, S(4) + 0.1, 0.4))];
  if (t < 2.8) return [0, 0.15];
  return [0.15 * Math.sin(t * 0.7), 0];
};

export const Gan = ({t}: {t: number}) => {
  const mood = moodAt(t);
  const look = lookAt(t);
  const blink = t % 3.3 > 3.18 && mood !== 'tickle';
  const sweat = (t * 0.8) % 1;
  const showSweat = mood === 'tired' || mood === 'worry';
  const rock = mood === 'tickle' ? 3 * Math.sin(t * 26) : 0;
  const hatRot = -7 + 2 * Math.sin(t * 2.3) + rock;
  const grabbing = t > S(2) + 0.1 && t < E(2);
  // tay
  const mouthHand = P(t, 0.0, 0.01) * (1 - P(t, 2.55, 0.5));
  const lk = track(L_KEYS, t);
  // cảnh 1: tay trái che miệng
  const lPos: [number, number] = [lerp(lk[0], FACE.x - 6, mouthHand), lerp(lk[1], FACE.y + 52, mouthHand)];
  const rk = track(R_KEYS, t);
  const lAt = grabbing && t > S(2) + 0.7 ? ([gripL(t)[1], gripL(t)[2]] as [number, number]) : lPos;
  const rAt = grabbing && t > S(2) + 0.7 ? ([gripR(t)[1], gripR(t)[2]] as [number, number]) : rk;
  const jitter = mood === 'tickle' ? 5 * Math.sin(t * 30) : 0;
  const thumb = t >= S(9) + 0.4 ? 1 : 0;
  const fx = FACE.x;
  const fy = FACE.y;
  return (
    <g>
      {/* mũ bảo hộ */}
      <g transform={`translate(${fx - 8} -246) rotate(${hatRot})`}>
        <path d="M -66 4 C -66 -50 -36 -74 0 -74 C 36 -74 66 -50 66 4 Z" fill="#FFC93C" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" />
        <path d="M -12 -72 V 2 M 12 -72 V 2" stroke="#F5A81E" strokeWidth={9} />
        <path d="M -44 -30 C -38 -48 -24 -58 -10 -62" fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={7} strokeLinecap="round" />
        <rect x={-84} y={0} width={168} height={17} rx={8.5} fill="#F5A81E" stroke={NAVY} strokeWidth={6} />
      </g>
      {/* mặt */}
      <g transform={`rotate(${rock * 0.4} ${fx} ${fy})`}>
        <circle cx={fx - 80} cy={fy + 34} r={18} fill="#FF8F8F" opacity={mood === 'neutral' || mood === 'wonder' ? 0.0 : 0.5} />
        <circle cx={fx + 80} cy={fy + 34} r={18} fill="#FF8F8F" opacity={mood === 'neutral' || mood === 'wonder' ? 0.0 : 0.5} />
        <path d={brow(mood, fx - 42, fy - 22, -1)} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
        <path d={brow(mood, fx + 42, fy - 22, 1)} fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
        <Eye x={fx - 42} y={fy - 4} mood={mood} look={look} blink={blink} />
        <Eye x={fx + 42} y={fy - 4} mood={mood} look={look} blink={blink} />
        {mouthHand < 0.5 && <Mouth x={fx} y={fy + 52} mood={mood} />}
        {showSweat && (
          <g transform={`translate(${fx + 98} ${fy - 58 + 40 * sweat})`} opacity={1 - sweat * 0.7}>
            <path d="M 0 -17 C 11 -2 11 11 0 12 C -11 11 -11 -2 0 -17 Z" fill="#9FD8FF" stroke={NAVY} strokeWidth={4} />
          </g>
        )}
      </g>
      {/* cảnh 4: dấu hỏi lơ lửng (không đùa) */}
      {t >= S(4) + 0.3 && t < S(5) - 0.2 && (
        <g opacity={smooth(P(t, S(4) + 0.3, 0.3)) * (1 - smooth(P(t, S(5) - 0.5, 0.3)))}>
          {[
            [fx - 165, fy - 100, 72, 0],
            [fx - 190, fy + 10, 52, 1.6],
          ].map(([qx, qy, fs, ph], i) => (
            <text key={i} x={qx} y={qy + 8 * Math.sin(t * 2.6 + ph)} textAnchor="middle" fontFamily="'Be Vietnam Pro', sans-serif" fontWeight={900} fontSize={fs} fill="#FFC93C" stroke={NAVY} strokeWidth={9} paintOrder="stroke">
              ?
            </text>
          ))}
        </g>
      )}
      {/* tay: vẽ sau mặt để tay che miệng nằm trên mặt */}
      <Arm from={[-334, -58]} to={lAt} side={-1} />
      <Arm from={[14, -84]} to={[rAt[0] + jitter * 0.4, rAt[1]]} side={1} />
      <Mitt x={lAt[0]} y={lAt[1] + jitter * 0.3} rot={mouthHand > 0.5 ? -20 : 0} />
      <Mitt x={rAt[0] + jitter * 0.4} y={rAt[1]} thumb={thumb} rot={thumb ? 8 : 0} s={thumb ? 1.3 : 1} />
    </g>
  );
};

/** Vị trí đỉnh đầu Gan (toạ độ cục bộ) để neo bong bóng thoại */
export const ganHead = () => ({x: FACE.x + 150, y: FACE.y - 70});
