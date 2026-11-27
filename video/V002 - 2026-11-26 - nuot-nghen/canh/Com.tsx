/* Nhân vật Cơm: nắm cơm nhỏ có mặt. Biểu cảm: vui (cười), lo (hơi lo, có giọt mồ hôi), tn (trung tính, dùng ở đoạn nặng: không cười, không thoại).
   band = băng đô vận động viên (cảnh khởi động). */
import {NAVY} from '../../src/common/overlays';

export type ComMood = 'vui' | 'lo' | 'tn';

const BODY = 'M 0 -52 C 14 -52 30 -28 46 14 C 52 30 46 42 30 42 H -30 C -46 42 -52 30 -46 14 C -30 -28 -14 -52 0 -52 Z';
const DARK = '#7a1f2a';

const Dot = ({cx, cy, blink, look}: {cx: number; cy: number; blink: boolean; look: number}) =>
  blink ? (
    <path d={`M ${cx - 6} ${cy} H ${cx + 6}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
  ) : (
    <g>
      <circle cx={cx + look * 2} cy={cy} r={6.5} fill={NAVY} />
      <circle cx={cx + look * 2 + 2} cy={cy - 2.5} r={2} fill="#fff" />
    </g>
  );

type Props = {x: number; y: number; scale?: number; rot?: number; sx?: number; sy?: number; mood: ComMood; t: number; band?: boolean; look?: number; opacity?: number};

export const Com = ({x, y, scale = 1, rot = 0, sx = 1, sy = 1, mood, t, band = false, look = 0, opacity = 1}: Props) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const blink = t % 3.4 > 3.28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale * sx} ${scale * sy})`} opacity={opacity}>
      <path d={BODY} fill="#FFFFFF" />
      <path d="M 14 -24 C 30 -2 44 14 44 28 C 44 38 36 42 28 42 H 6 C 22 32 24 0 14 -24 Z" fill="#E7EDF5" />
      <path d="M -46 18 H 46 C 50 30 44 42 30 42 H -30 C -44 42 -50 30 -46 18 Z" fill="#2F3D45" />
      <path d="M -14 -34 q 4 -4 8 0 M 8 -38 q 4 -3 7 1 M -30 -8 q 3 -4 7 -1 M 28 4 q 4 -3 7 0 M -4 24 l 0 0" fill="none" stroke="#C5CFDA" strokeWidth={3} strokeLinecap="round" />
      <path d={BODY} fill="none" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      {band && (
        <g>
          <path d="M -27 -30 Q 0 -42 27 -30 L 28 -21 Q 0 -33 -28 -21 Z" fill="#E04B4B" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -27 -26 L -44 -35 L -41 -23 Z M -27 -26 L -43 -20 L -38 -15 Z" fill="#E04B4B" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
      <g transform="translate(0 -2)">
        {mood === 'tn' && (
          <>
            <Dot cx={-13} cy={-7} blink={blink} look={look} />
            <Dot cx={13} cy={-7} blink={blink} look={look} />
            <path d="M -7 12 H 7" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          </>
        )}
        {mood === 'vui' && (
          <>
            <path d="M -20 -5 Q -13 -17 -6 -5 M 6 -5 Q 13 -17 20 -5" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
            <path d="M -11 6 Q 0 28 11 6 Z" fill={DARK} stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={-26} cy={8} r={6} fill="#FF8FA3" opacity={0.7} />
            <circle cx={26} cy={8} r={6} fill="#FF8FA3" opacity={0.7} />
          </>
        )}
        {mood === 'lo' && (
          <>
            <Dot cx={-13} cy={-6} blink={blink} look={look - 1} />
            <Dot cx={13} cy={-6} blink={blink} look={look - 1} />
            <path d="M -22 -17 L -6 -24 M 22 -17 L 6 -24" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
            <path d="M -9 15 Q -4 9 0 14 Q 4 19 9 13" fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
            <path d="M 32 -24 Q 38 -12 32 -7 Q 26 -12 32 -24 Z" fill="#BFE3FA" stroke="#5B9FD6" strokeWidth={2.5} strokeLinejoin="round" />
          </>
        )}
      </g>
    </g>
  );
};
