/* Polyp: cục tròn nhỏ lành tính, chậm rì, mọc trên cuống ở thành ruột. Khung toạ độ cục bộ: gốc ở mặt thành trong, -y chỉ vào lòng ruột.
   Tông theo docs/video-giong-dieu.md: mặt chỉ cười ở cảnh 2–3 (trước "hoá ác") và lúc tạm biệt ở cảnh 5; còn lại trung tính. */
import {NAVY} from '../../src/common/overlays';
import {U_POLYP} from './Path';
import {wallFrame} from './World';

export type PolypMood = 'calm' | 'smile' | 'quiet';
const BLUSH = '#F28FA8';

export const POLYP_FRAME = wallFrame(U_POLYP, 1, 3);
/** Hệ số phóng của cả polyp (để dễ đọc mặt) */
export const POLYP_SCALE = 1.16;
export const STALK_H = 30;
/** bán kính đầu polyp theo mức lớn 0..1 */
export const headR = (grow: number) => 38 + 12 * grow;
/** y (cục bộ) của tâm đầu polyp */
export const headY = (grow: number) => -(STALK_H + headR(grow) * 0.82);

const Face = ({r, mood, t, look}: {r: number; mood: PolypMood; t: number; look: [number, number]}) => {
  const blink = Math.sin(t * 1.7 + 0.6) > 0.985 || (t % 3.7 > 3.6 && mood !== 'quiet');
  const ex = r * 0.4;
  const ey = -r * 0.08;
  const eye = (sx: number) => {
    if (mood === 'smile') return <path key={sx} d={`M ${sx * ex - 9} ${ey + 3} Q ${sx * ex} ${ey - 11} ${sx * ex + 9} ${ey + 3}`} fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />;
    if (blink) return <path key={sx} d={`M ${sx * ex - 8} ${ey + 1} H ${sx * ex + 8}`} stroke={NAVY} strokeWidth={5} strokeLinecap="round" />;
    return (
      <g key={sx}>
        <ellipse cx={sx * ex} cy={ey} rx={9.5} ry={11} fill="#fff" stroke={NAVY} strokeWidth={4} />
        <circle cx={sx * ex + look[0] * 3.5} cy={ey + look[1] * 3.5} r={5.2} fill={NAVY} />
        <circle cx={sx * ex + look[0] * 3.5 + 2} cy={ey + look[1] * 3.5 - 2.4} r={1.9} fill="#fff" />
        {mood === 'quiet' && <path d={`M ${sx * ex - 10.5} ${ey - 4} H ${sx * ex + 10.5} V ${ey - 14} H ${sx * ex - 10.5} Z`} fill="#B58BE0" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />}
      </g>
    );
  };
  return (
    <g>
      <circle cx={-r * 0.62} cy={r * 0.2} r={r * 0.15} fill={BLUSH} opacity={0.55} />
      <circle cx={r * 0.62} cy={r * 0.2} r={r * 0.15} fill={BLUSH} opacity={0.55} />
      {eye(-1)}
      {eye(1)}
      {mood === 'smile' && <path d={`M -9 ${r * 0.22} Q 0 ${r * 0.22 + 12} 9 ${r * 0.22}`} fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />}
      {mood === 'calm' && <path d={`M -6 ${r * 0.28} H 6`} stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />}
      {mood === 'quiet' && <path d={`M -7 ${r * 0.28} H 7`} stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />}
    </g>
  );
};

export type PolypProps = {
  t: number;
  mood: PolypMood;
  /** 0..1: mức lớn của đầu polyp */
  grow: number;
  opacity?: number;
  /** 0..1: đã bị cắt (còn lại gốc cuống nhẵn) */
  cut?: number;
  /** vị trí đầu polyp sau khi cắt, toạ độ cục bộ, và hệ số thu nhỏ */
  carry?: {x: number; y: number; s: number; rot?: number};
  look?: [number, number];
};

export const Polyp = ({t, mood, grow, opacity = 1, cut = 0, carry, look = [0.8, 0.1]}: PolypProps) => {
  const r = headR(grow);
  const hy = headY(grow);
  const sway = 1.2 * Math.sin(t * 1.3);
  const detached = cut > 0.5 && carry;
  return (
    <g transform={`translate(${POLYP_FRAME.x.toFixed(1)} ${POLYP_FRAME.y.toFixed(1)}) rotate(${POLYP_FRAME.rot.toFixed(2)}) scale(${POLYP_SCALE})`}>
      {/* gốc cuống: còn lại nhẵn sau khi cắt */}
      {cut > 0.5 && (
        <g>
          <path d="M -20 6 C -18 -6 -12 -12 0 -12 C 12 -12 18 -6 20 6 Z" fill="#EE9096" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
          <path d="M -9 -4 Q 0 -8 9 -4" fill="none" stroke="#FFD9D2" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      )}
      <g opacity={opacity}>
        {/* bóng dưới chân */}
        {cut <= 0.5 && <ellipse cx={0} cy={4} rx={34} ry={7} fill="#C95C6B" opacity={0.3} />}
        <g transform={detached ? `translate(${carry!.x} ${carry!.y}) rotate(${carry!.rot ?? 0}) scale(${carry!.s}) translate(0 ${-hy})` : undefined}>
          <g>
            {/* cuống */}
            <path d={`M -17 4 C -15 -8 -13 ${-STALK_H + 8} -12 ${hy + r * 0.5} L 12 ${hy + r * 0.5} C 13 ${-STALK_H + 8} 15 -8 17 4 Z`} fill="#C7A1EC" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" transform={cut > 0.5 ? `translate(0 -2)` : undefined} />
            <path d={`M -7 -2 C -6 -10 -5 ${-STALK_H + 6} -5 ${hy + r * 0.55}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
            {/* đầu */}
            <g transform={`translate(0 ${hy}) rotate(${sway})`}>
              <ellipse cx={0} cy={r * 0.1} rx={r} ry={r * 0.95} fill="#7A4BB0" opacity={0.25} transform="translate(3 6)" />
              <ellipse cx={0} cy={0} rx={r} ry={r * 0.94} fill="url(#g7-poly)" stroke={NAVY} strokeWidth={6.5} />
              <path d={`M ${-r * 0.7} ${-r * 0.25} C ${-r * 0.62} ${-r * 0.7} ${-r * 0.25} ${-r * 0.86} ${r * 0.1} ${-r * 0.82}`} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={r * 0.12} strokeLinecap="round" />
              <circle cx={r * 0.62} cy={-r * 0.4} r={r * 0.07} fill="#7B52B8" opacity={0.45} />
              <circle cx={-r * 0.1} cy={r * 0.68} r={r * 0.06} fill="#7B52B8" opacity={0.45} />
              <Face r={r} mood={mood} t={t} look={look} />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
