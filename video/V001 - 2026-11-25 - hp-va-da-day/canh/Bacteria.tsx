/* Nhân vật vi khuẩn HP (phản diện dễ thương): thân xoắn uốn sóng, đuôi có roi, đầu tròn có mặt luôn thẳng đứng
   dù thân xoay. Biểu cảm: gian (cười gian), vui, lo (mặt lo, nhìn sang bên — dùng khi có chữ ung thư hoặc tế bào bất thường),
   la (la hét), an (nhai), o (ợ). */
import {NAVY} from '../../src/common/overlays';

export type Mood = 'gian' | 'vui' | 'lo' | 'la' | 'an' | 'o';
const L = 150;
const DARK = '#7a1f2a';

/** Toạ độ tâm đầu HP (hệ toạ độ của thẻ svg cha), để các hiệu ứng khác bay tới/ra từ miệng */
export const hpHead = ({x, y, angle = 0, scale = 1, t, spin = 10}: {x: number; y: number; angle?: number; scale?: number; t: number; spin?: number}) => {
  const a = (angle * Math.PI) / 180;
  const lx = (L / 2) * scale;
  const ly = 16 * Math.sin(-t * spin) * scale;
  return {x: x + lx * Math.cos(a) - ly * Math.sin(a), y: y + lx * Math.sin(a) + ly * Math.cos(a)};
};

const Eye = ({cx, cy, r, blink, look = [0, 1]}: {cx: number; cy: number; r: number; blink: boolean; look?: [number, number]}) =>
  blink ? (
    <path d={`M ${cx - r} ${cy} H ${cx + r}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
  ) : (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={NAVY} strokeWidth={3} />
      <circle cx={cx + look[0] * 3} cy={cy + look[1] * 2} r={r * 0.5} fill={NAVY} />
    </g>
  );

const Face = ({mood, t}: {mood: Mood; t: number}) => {
  const blink = t % 3.3 > 3.18;
  return (
    <g>
      {(mood === 'gian' || mood === 'an') && (
        <>
          <Eye cx={-12} cy={-5} r={10} blink={blink} look={[1, 0]} />
          <Eye cx={12} cy={-5} r={10} blink={blink} look={[1, 0]} />
          <path d="M -24 -21 L -4 -14 M 24 -21 L 4 -14" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {mood === 'lo' && (
        <>
          <Eye cx={-12} cy={-5} r={10} blink={blink} look={[-1.5, 0.5]} />
          <Eye cx={12} cy={-5} r={10} blink={blink} look={[-1.5, 0.5]} />
          <path d="M -24 -14 L -6 -22 M 24 -14 L 6 -22" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <path d="M -11 19 Q 0 12 11 19" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {mood === 'vui' && <path d="M -21 -2 Q -12 -15 -3 -2 M 3 -2 Q 12 -15 21 -2" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />}
      {mood === 'la' && <path d="M -22 -14 L -6 -6 L -22 2 M 22 -14 L 6 -6 L 22 2" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
      {mood === 'o' && (
        <>
          <path d="M -20 -6 H -4 M 4 -6 H 20" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <circle cx={-25} cy={10} r={7} fill="#FF8FA3" opacity={0.7} />
          <circle cx={25} cy={10} r={7} fill="#FF8FA3" opacity={0.7} />
        </>
      )}
      {mood === 'gian' && (
        <>
          <path d="M -15 11 Q 0 25 17 7" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <path d="M 8 14 L 13 21 L 15 12 Z" fill="#fff" stroke={NAVY} strokeWidth={2} strokeLinejoin="round" />
        </>
      )}
      {mood === 'vui' && <path d="M -15 9 Q 0 33 15 9 Z" fill={DARK} stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />}
      {mood === 'la' && (
        <>
          <ellipse cx={0} cy={17} rx={12} ry={14} fill={DARK} stroke={NAVY} strokeWidth={4} />
          <ellipse cx={0} cy={23} rx={7} ry={5} fill="#FF8FA3" />
        </>
      )}
      {mood === 'an' && <ellipse cx={0} cy={14} rx={10} ry={4 + 8 * Math.abs(Math.sin(t * 14))} fill={DARK} stroke={NAVY} strokeWidth={4} />}
      {mood === 'o' && <ellipse cx={0} cy={16} rx={9 + 2 * Math.sin(t * 20)} ry={12} fill={DARK} stroke={NAVY} strokeWidth={4} />}
    </g>
  );
};

export const HP = ({x, y, angle = 0, scale = 1, t, spin = 10, opacity = 1, mood = 'gian'}: {x: number; y: number; angle?: number; scale?: number; t: number; spin?: number; opacity?: number; mood?: Mood}) => {
  if (scale <= 0.001 || opacity <= 0.001) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const px = -L / 2 + (L * i) / 40;
    const py = 16 * Math.sin((2 * Math.PI * 2.5 * i) / 40 - t * spin);
    pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const body = pts.join(' ');
  const headY = 16 * Math.sin(-t * spin);
  const flag = (k: number) => {
    const d: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const px = -L / 2 - 6 - i * 5;
      const py = headY + (k - 1.5) * 9 + 8 * Math.sin(i * 0.7 - t * 14 + k);
      d.push(`${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return d.join(' ');
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={flag(k)} fill="none" stroke="#2F6B1F" strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={body} fill="none" stroke="#2F6B1F" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#7CC04B" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke="#B5E58C" strokeWidth={6} strokeLinecap="round" opacity={0.7} transform="translate(0 -5)" />
      {/* đầu tròn có mặt, luôn thẳng đứng */}
      <g transform={`translate(${L / 2} ${headY}) rotate(${-angle})`}>
        <circle r={33} fill="#7CC04B" stroke="#2F6B1F" strokeWidth={6} />
        <path d="M -20 -20 Q -8 -30 6 -28" fill="none" stroke="#B5E58C" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <Face mood={mood} t={t} />
      </g>
    </g>
  );
};

/* Vi khuẩn thường (hình que xám) — rơi vào axit thì hoảng rồi tan */
export const Rod = ({x, y, angle, scale, opacity}: {x: number; y: number; angle: number; scale: number; opacity: number}) =>
  scale <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      <rect x={-55} y={-20} width={110} height={40} rx={20} fill="#B8C2CC" stroke="#6B7785" strokeWidth={5} />
      <g transform={`rotate(${-angle})`}>
        <circle cx={-9} cy={-3} r={8} fill="#fff" stroke="#6B7785" strokeWidth={3} />
        <circle cx={9} cy={-3} r={8} fill="#fff" stroke="#6B7785" strokeWidth={3} />
        <circle cx={-9} cy={-2} r={3.5} fill="#3a4654" />
        <circle cx={9} cy={-2} r={3.5} fill="#3a4654" />
        <ellipse cx={0} cy={12} rx={5} ry={6} fill="#6B7785" />
      </g>
    </g>
  );

/* Lớp kiềm quanh HP */
export const Cloud = ({x, y, r, opacity}: {x: number; y: number; r: number; opacity: number}) =>
  r <= 1 ? null : (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill="url(#kiem)" />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#7E9CF0" strokeWidth={5} strokeDasharray="10 12" opacity={0.7} />
    </g>
  );
