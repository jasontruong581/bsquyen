/* Ba nhân vật của V003. Tọa độ cục bộ, gốc ở giữa thân; vẽ bằng SVG, đặt vào <g> của khung hình.
   - Khói: cụm khói xám. 'lem' = lém lỉnh (chỉ dùng ở phần cơ chế), 'tn' = trung tính (đoạn nặng).
   - Thợ sửa ADN: robot nhỏ màu cam cầm cờ lê. 'vui', 'met' (mệt, toát mồ hôi, không cười), 'tn'.
   - Phổi: lá phổi có mặt; tone 0 xám -> 1 hồng, smile 0..1 (0 = mặt trung tính). */
import {NAVY} from '../../src/common/overlays';
import {lerp} from '../../src/timeline';

/* ---------------- Khói ---------------- */
export type KhoiMood = 'lem' | 'tn';
const PUFFS: [number, number, number][] = [
  [-36, 8, 27],
  [0, -8, 36],
  [36, 8, 27],
  [16, 24, 26],
  [-20, 26, 25],
];
/** Bề ngang của Khói ở tỉ lệ 1 (để quy đổi ra điểm ảnh) */
export const KHOI_W = 128;

type KhoiProps = {x: number; y: number; scale?: number; rot?: number; mood: KhoiMood; t: number; look?: number; opacity?: number};

export const Khoi = ({x, y, scale = 1, rot = 0, mood, t, look = 0, opacity = 1}: KhoiProps) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const blink = t % 3.1 > 2.98;
  const bob = 3 * Math.sin(t * 3);
  const Eye = ({cx, cy}: {cx: number; cy: number}) =>
    blink ? (
      <path d={`M ${cx - 6} ${cy} H ${cx + 6}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
    ) : (
      <g>
        <circle cx={cx + look * 2} cy={cy} r={6.5} fill={NAVY} />
        <circle cx={cx + look * 2 + 2} cy={cy - 2.5} r={2} fill="#fff" />
      </g>
    );
  return (
    <g transform={`translate(${x} ${y + bob * scale}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
      {PUFFS.map(([cx, cy, r], i) => (
        <circle key={`o${i}`} cx={cx} cy={cy} r={r} fill={NAVY} stroke={NAVY} strokeWidth={12} />
      ))}
      <circle cx={-6} cy={52} r={9} fill={NAVY} stroke={NAVY} strokeWidth={10} />
      <circle cx={8} cy={68} r={6} fill={NAVY} stroke={NAVY} strokeWidth={9} />
      {PUFFS.map(([cx, cy, r], i) => (
        <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill="#D3D9E0" />
      ))}
      <circle cx={-6} cy={52} r={9} fill="#D3D9E0" />
      <circle cx={8} cy={68} r={6} fill="#D3D9E0" />
      <path d="M 14 8 C 44 14 52 40 28 46 C 40 30 34 18 14 8 Z" fill="#B7C0CA" opacity={0.7} />
      {mood === 'tn' && (
        <g transform="translate(0 -2)">
          <Eye cx={-14} cy={0} />
          <Eye cx={14} cy={0} />
          <path d="M -7 18 H 7" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
        </g>
      )}
      {mood === 'lem' && (
        <g transform="translate(0 -2)">
          <Eye cx={-14} cy={0} />
          {blink ? <path d="M 8 2 H 20" stroke={NAVY} strokeWidth={4} strokeLinecap="round" /> : (
            <g>
              <circle cx={14 + look * 2} cy={3} r={6.5} fill={NAVY} />
              <circle cx={14 + look * 2 + 2} cy={0.5} r={2} fill="#fff" />
              <path d="M 6 -3 H 23" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
            </g>
          )}
          <path d="M -23 -13 L -6 -10" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M 7 -18 Q 16 -25 25 -17" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M -9 17 Q 4 25 17 11" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

/* ---------------- Thợ sửa ADN ---------------- */
export type ThoMood = 'vui' | 'met' | 'tn';
type ThoProps = {x: number; y: number; scale?: number; mood: ThoMood; t: number; /** góc cánh tay phải (độ), 0 = chỉ ngang, dương = hạ xuống */ arm?: number; thumb?: boolean; flip?: boolean; opacity?: number};

const ORANGE_D = '#F26E21';
const ORANGE_L = '#F9A05F';

export const ThoSua = ({x, y, scale = 1, mood, t, arm = 20, thumb = false, flip = false, opacity = 1}: ThoProps) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const blink = t % 3.6 > 3.48;
  const sweat = (t * 0.9) % 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={opacity}>
      <rect x={-22} y={44} width={16} height={24} rx={6} fill="#7A8CA3" stroke={NAVY} strokeWidth={5} />
      <rect x={6} y={44} width={16} height={24} rx={6} fill="#7A8CA3" stroke={NAVY} strokeWidth={5} />
      {/* tay trái buông xuôi */}
      <path d="M -32 10 L -46 36" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
      <path d="M -32 10 L -46 36" stroke={ORANGE_L} strokeWidth={6} strokeLinecap="round" />
      <rect x={-32} y={-8} width={64} height={58} rx={16} fill={ORANGE_D} stroke={NAVY} strokeWidth={6} />
      <circle cx={0} cy={21} r={9} fill="#FFC93C" stroke={NAVY} strokeWidth={4} />
      <path d="M -3 16 L 3 21 L -3 26" fill="none" stroke={NAVY} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {/* đầu */}
      <path d="M 0 -68 V -58" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
      <circle cx={0} cy={-75} r={7} fill="#FFC93C" stroke={NAVY} strokeWidth={4} />
      <rect x={-40} y={-68} width={80} height={58} rx={18} fill={ORANGE_L} stroke={NAVY} strokeWidth={6} />
      <rect x={-29} y={-58} width={58} height={38} rx={11} fill="#FFF6EC" stroke={NAVY} strokeWidth={3.5} />
      {mood === 'vui' && (
        <g>
          {blink ? <path d="M -17 -42 h 12 M 5 -42 h 12" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" /> : <path d="M -17 -41 q 6 -10 12 0 M 5 -41 q 6 -10 12 0" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />}
          <path d="M -9 -31 q 9 10 18 0" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={-23} cy={-32} r={4.5} fill="#FF8FA3" opacity={0.7} />
          <circle cx={23} cy={-32} r={4.5} fill="#FF8FA3" opacity={0.7} />
        </g>
      )}
      {mood === 'tn' && (
        <g>
          <circle cx={-11} cy={-42} r={5} fill={NAVY} />
          <circle cx={11} cy={-42} r={5} fill={NAVY} />
          <path d="M -7 -29 H 7" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
        </g>
      )}
      {mood === 'met' && (
        <g>
          <path d="M -17 -41 h 12 M 5 -41 h 12" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M -20 -45 L -4 -51 M 20 -45 L 4 -51" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
          <path d="M -9 -28 q 4.5 -5 9 0 t 9 0" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <g transform={`translate(36 ${-62 + 12 * sweat})`} opacity={1 - sweat * 0.6}>
            <path d="M 0 -12 Q 7 -2 0 4 Q -7 -2 0 -12 Z" fill="#BFE3FA" stroke="#5B9FD6" strokeWidth={2.5} strokeLinejoin="round" />
          </g>
        </g>
      )}
      {/* tay phải: cầm cờ lê, hoặc giơ ngón cái */}
      <g transform={`translate(32 8) rotate(${thumb ? -40 : arm})`}>
        <path d="M 0 0 H 34" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
        <path d="M 0 0 H 34" stroke={ORANGE_L} strokeWidth={6} strokeLinecap="round" />
        {!thumb && (
          <g transform="translate(34 0)">
            <path d="M 0 0 H 46" stroke={NAVY} strokeWidth={13} strokeLinecap="round" />
            <path d="M 0 0 H 46" stroke="#CBD5E1" strokeWidth={6} strokeLinecap="round" />
            <circle cx={54} cy={0} r={13} fill="#CBD5E1" stroke={NAVY} strokeWidth={4} />
            <path d="M 54 -6 L 59 -3 V 3 L 54 6 L 49 3 V -3 Z" fill={NAVY} />
          </g>
        )}
        <circle cx={34} cy={0} r={10} fill="#FFF6EC" stroke={NAVY} strokeWidth={4} />
      </g>
      {/* ngón cái luôn chỉ thẳng lên, đặt ở đầu bàn tay (cánh tay nâng chếch -40 độ) */}
      {thumb && (
        <path
          transform={`translate(${32 + 34 * Math.cos((-40 * Math.PI) / 180)} ${8 + 34 * Math.sin((-40 * Math.PI) / 180)})`}
          d="M -5 -6 V -24 q 0 -8 7 -6 q 6 2 4 9 L 5 -6"
          fill="#FFF6EC"
          stroke={NAVY}
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

/* ---------------- Phổi ---------------- */
const LOBE = 'M -6 -70 C -36 -70 -70 -30 -72 16 C -74 56 -62 86 -36 86 C -14 86 -6 72 -6 56 Z';
const GRAY: [number, number, number] = [169, 176, 184];
const PINK: [number, number, number] = [246, 165, 181];
const mix = (a: [number, number, number], b: [number, number, number], p: number) => `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;

type LungProps = {x: number; y: number; scale?: number; tone: number; smile: number; t: number; opacity?: number};

export const Lung = ({x, y, scale = 1, tone, smile, t, opacity = 1}: LungProps) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const fill = mix(GRAY, PINK, tone);
  const blink = t % 3.3 > 3.18;
  const happy = smile > 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path d="M 0 -128 V -72" stroke={NAVY} strokeWidth={26} strokeLinecap="round" />
      <path d="M 0 -128 V -72" stroke="#F2C9CF" strokeWidth={14} strokeLinecap="round" />
      <path d="M 0 -76 Q -4 -52 -34 -34 M 0 -76 Q 4 -52 34 -34" fill="none" stroke={NAVY} strokeWidth={18} strokeLinecap="round" />
      <path d="M 0 -76 Q -4 -52 -34 -34 M 0 -76 Q 4 -52 34 -34" fill="none" stroke="#F2C9CF" strokeWidth={7} strokeLinecap="round" />
      <path d={LOBE} fill={fill} stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      <g transform="scale(-1 1)">
        <path d={LOBE} fill={fill} stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      </g>
      {/* vá khe giữa hai thùy để mặt không bị vạch cắt ngang */}
      <rect x={-9} y={-56} width={18} height={104} fill={fill} />
      <g opacity={(1 - tone) * 0.55} fill="#6B7480">
        <circle cx={-44} cy={-14} r={7} />
        <circle cx={-30} cy={58} r={9} />
        <circle cx={46} cy={-4} r={8} />
        <circle cx={34} cy={52} r={6} />
        <circle cx={-52} cy={30} r={5} />
      </g>
      <path d="M -52 -20 Q -46 -42 -30 -50" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      {/* mặt */}
      <g transform="translate(0 4)">
        {happy ? (
          <path d="M -34 -4 q 8 -12 16 0 M 18 -4 q 8 -12 16 0" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
        ) : blink ? (
          <path d="M -34 -4 h 16 M 18 -4 h 16" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
        ) : (
          <g>
            <circle cx={-26} cy={-4} r={6.5} fill={NAVY} />
            <circle cx={26} cy={-4} r={6.5} fill={NAVY} />
            <circle cx={-24} cy={-6.5} r={2} fill="#fff" />
            <circle cx={28} cy={-6.5} r={2} fill="#fff" />
          </g>
        )}
        <path d={`M -12 28 Q 0 ${28 + 18 * smile} 12 28`} fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
        <circle cx={-44} cy={22} r={7} fill="#FF8FA3" opacity={0.65 * smile} />
        <circle cx={44} cy={22} r={7} fill="#FF8FA3" opacity={0.65 * smile} />
      </g>
    </g>
  );
};
