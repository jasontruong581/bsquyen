/* Ba ngón tay hoạt hình: Nhẹ (xanh bạc hà, mảnh), Vừa (vàng), Mạnh (cam san hô, chắc). Mỗi bạn là một viên thuốc tròn có mặt.
   Khung cục bộ: gốc ở giữa bụng ngón (chỗ ấn xuống), thân vươn lên trên. Không có tay hay thân người. */
import {NAVY, ORANGE} from '../../src/common/overlays';
import type {Mood} from './Motion';

const W_ = [84, 100, 120];
const H_ = [168, 190, 208];

const Eye = ({x, y, closed, look, r = 9}: {x: number; y: number; closed: boolean; look: [number, number]; r?: number}) => {
  if (closed) return <path d={`M ${x - r} ${y + 1} Q ${x} ${y + 8} ${x + r} ${y + 1}`} fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.2} fill="#fff" stroke={NAVY} strokeWidth={3.5} />
      <circle cx={x + look[0] * 3.2} cy={y + look[1] * 3.2} r={r * 0.56} fill={NAVY} />
      <circle cx={x + look[0] * 3.2 - 1.7} cy={y + look[1] * 3.2 - 2} r={1.8} fill="#fff" />
    </g>
  );
};

type FingerProps = {kind: 0 | 1 | 2; x: number; y: number; s: number; rot: number; mood: Mood; look: [number, number]; t: number; glow?: number; press?: number};

export const Finger = ({kind, x, y, s, rot, mood, look, t, glow = 0, press = 0}: FingerProps) => {
  const w = W_[kind];
  const h = H_[kind];
  const fy = -h * 0.6;
  const ex = w * 0.2;
  const closed = (t + kind * 1.3) % 3.4 > 3.28;
  const hard = kind === 2 && (mood === 'serious' || press > 0.4);
  const sy = 1 - 0.06 * press;
  const sx = 1 + 0.04 * press;
  const body = `M ${-w / 2} ${-w / 2} A ${w / 2} ${w / 2} 0 0 0 ${w / 2} ${-w / 2} V ${-h + w / 2} A ${w / 2} ${w / 2} 0 0 0 ${-w / 2} ${-h + w / 2} Z`;
  const brow = (dir: number) => {
    const bx = dir * ex;
    if (mood === 'serious' || hard) return <path d={`M ${bx - dir * 11} ${fy - 21 + (hard ? 0 : 3)} L ${bx + dir * 9} ${fy - 15 - (hard ? 0 : 0)}`} stroke={NAVY} strokeWidth={kind === 2 ? 6 : 4.5} strokeLinecap="round" />;
    if (mood === 'think') return <path d={`M ${bx - 10} ${fy - (dir < 0 ? 29 : 24)} Q ${bx} ${fy - (dir < 0 ? 35 : 28)} ${bx + 10} ${fy - (dir < 0 ? 27 : 22)}`} fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />;
    return <path d={`M ${bx - 9} ${fy - 24} Q ${bx} ${fy - 30} ${bx + 9} ${fy - 24}`} fill="none" stroke={NAVY} strokeWidth={3.6} strokeLinecap="round" opacity={0.8} />;
  };
  const mouthY = fy + 28;
  const mouth =
    mood === 'grin' ? (
      <path d={`M ${-w * 0.15} ${mouthY} Q 0 ${mouthY + 20} ${w * 0.15} ${mouthY} Z`} fill="#7A2A3A" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
    ) : mood === 'think' ? (
      <ellipse cx={w * 0.02} cy={mouthY + 6} rx={5} ry={6} fill="none" stroke={NAVY} strokeWidth={3.6} />
    ) : mood === 'serious' ? (
      <path d={`M ${-w * 0.11} ${mouthY + 6} L ${w * 0.11} ${mouthY + 6}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
    ) : (
      <path d={`M ${-w * 0.13} ${mouthY} Q 0 ${mouthY + 12} ${w * 0.13} ${mouthY}`} fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
    );
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(s * sx).toFixed(3)} ${(s * sy).toFixed(3)})`}>
      {glow > 0.01 && <ellipse cy={-w * 0.12} rx={w * 0.95} ry={w * 0.5} fill="url(#gv-glow)" opacity={glow} />}
      <path d={body} fill={`url(#gv-fg${kind})`} stroke={NAVY} strokeWidth={7.5} strokeLinejoin="round" />
      {/* ánh sáng và bóng */}
      <path d={`M ${-w * 0.3} ${-h + w * 0.55} Q ${-w * 0.36} ${-h * 0.6} ${-w * 0.3} ${-h * 0.3}`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.55} />
      <ellipse cy={-w * 0.17} rx={w * 0.34} ry={w * 0.15} fill={glow > 0.01 ? ORANGE : '#fff'} opacity={glow > 0.01 ? 0.35 + 0.4 * glow : 0.35} />
      {/* nếp khớp ngón */}
      <path d={`M ${-w * 0.2} ${-h * 0.34} Q 0 ${-h * 0.34 + 7} ${w * 0.2} ${-h * 0.34}`} fill="none" stroke={NAVY} strokeWidth={3.6} strokeLinecap="round" opacity={0.28} />
      <path d={`M ${-w * 0.16} ${-h * 0.27} Q 0 ${-h * 0.27 + 6} ${w * 0.16} ${-h * 0.27}`} fill="none" stroke={NAVY} strokeWidth={3.2} strokeLinecap="round" opacity={0.22} />
      {/* mặt */}
      <Eye x={-ex} y={fy} closed={closed} look={look} r={kind === 0 ? 8.4 : 9.4} />
      <Eye x={ex} y={fy} closed={closed} look={look} r={kind === 0 ? 8.4 : 9.4} />
      {!closed && brow(-1)}
      {!closed && brow(1)}
      {mouth}
      <ellipse cx={-w * 0.3} cy={fy + 20} rx={7} ry={4.4} fill="#FF9DB0" opacity={mood === 'serious' ? 0.25 : 0.65} />
      <ellipse cx={w * 0.3} cy={fy + 20} rx={7} ry={4.4} fill="#FF9DB0" opacity={mood === 'serious' ? 0.25 : 0.65} />
    </g>
  );
};
