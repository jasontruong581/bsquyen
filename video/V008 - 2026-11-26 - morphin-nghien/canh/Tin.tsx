/* Tin: chú đưa tin nhỏ hình tia chớp có mắt, lo lắng và nhanh nhẹn. Khung cục bộ: gốc ở chân (mũi tia chớp), mặt quay sang phải, cao khoảng 116.
   Tông nghiêm ấm: chỉ lo, nhìn chăm chú, rồi nghỉ ngơi dịu dàng khi âm lượng hạ; không bao giờ cười tươi hay làm trò. */
import {NAVY} from '../../src/common/overlays';
import {clamp01} from './Motion';
import type {TinPose} from './Motion';

const BODY_D = 'M -30 -116 L 40 -116 L 16 -70 L 46 -70 L -18 0 L -4 -46 L -42 -46 Z';

const Eye = ({x, y, closed, look, rx = 10.5, ry = 12.5}: {x: number; y: number; closed: number; look: [number, number]; rx?: number; ry?: number}) => {
  if (closed > 0.55) {
    return <path d={`M ${x - rx} ${y + 1} Q ${x} ${y + 9} ${x + rx} ${y + 1}`} fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />;
  }
  const h = ry * (1 - closed * 1.6);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={h} fill="#fff" stroke={NAVY} strokeWidth={4} />
      <circle cx={x + look[0] * 3.4} cy={y + look[1] * 3.4} r={5.6} fill={NAVY} />
      <circle cx={x + look[0] * 3.4 - 1.8} cy={y + look[1] * 3.4 - 2} r={1.9} fill="#fff" />
    </g>
  );
};

const Zig = ({x, y, s = 1, rot = 0, a = 1}: {x: number; y: number; s?: number; rot?: number; a?: number}) => (
  <path d="M 0 -10 L 5 -2 L -1 -1 L 4 9" transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill="none" stroke="#FFB02E" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={a} />
);

type TinProps = {t: number; pose: TinPose; worry: number; /** mắt nhìn: -1..1 */ look?: [number, number]};

export const Tin = ({t, pose, worry, look = [0.7, 0.1]}: TinProps) => {
  const w = clamp01(worry);
  const sleeping = pose === 'sleep';
  const sitting = pose === 'sit' || sleeping;
  const running = pose === 'run';
  const calm = sitting ? 1 : 0;
  const bob = running ? -5 * Math.abs(Math.sin(t * 13)) : sleeping ? 1.6 * Math.sin(t * 1.5) : -2.2 * Math.sin(t * 3.1);
  const lean = running ? 13 : sleeping ? -9 : 0;
  const swing = running ? Math.sin(t * 13) : 0.15 * Math.sin(t * 3);

  const closed = sleeping ? 1 : sitting ? 0.9 : Math.max(0, Math.sin(t * 0.9) > 0.985 ? 1 : 0);
  const eyeY = -94;
  // dáng đứng / nghỉ / ngủ
  const body = (
    <g>
      {/* tay sau */}
      <g fill="none" strokeLinecap="round">
        <path d={sitting ? 'M 30 -84 Q 44 -62 22 -52' : `M 36 -98 Q ${52 + 6 * swing} ${-84 + 6 * swing} ${54 + 8 * swing} ${-66 + 6 * swing}`} stroke={NAVY} strokeWidth={14} />
        <path d={sitting ? 'M 30 -84 Q 44 -62 22 -52' : `M 36 -98 Q ${52 + 6 * swing} ${-84 + 6 * swing} ${54 + 8 * swing} ${-66 + 6 * swing}`} stroke="#FFC93C" strokeWidth={6.5} />
      </g>
      <path d={BODY_D} fill="url(#g8-tin)" stroke={NAVY} strokeWidth={8.5} strokeLinejoin="round" />
      {/* ánh sáng và bóng trên thân */}
      <path d="M -24 -108 L 30 -108 L 22 -92 L -30 -92 Z" fill="#fff" opacity={0.55} />
      <path d="M 12 -58 L 38 -60 L -14 -12 L -2 -50 Z" fill="#E88F10" opacity={0.28} />
      {/* mặt */}
      <Eye x={-8} y={eyeY} closed={closed} look={look} />
      <Eye x={17} y={eyeY} closed={closed} look={look} />
      {closed < 0.5 && (
        <g fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round">
          <path d={`M -22 ${-110 - 3 * w} L -3 ${-110 - 8 * w}`} />
          <path d={`M 12 ${-110 - 8 * w} L 30 ${-110 - 3 * w}`} />
        </g>
      )}
      <path d={w > 0.5 && !calm ? 'M -6 -73 Q 3 -78 12 -73' : 'M -6 -75 Q 3 -70 12 -75'} fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
      {calm === 1 && <ellipse cx={-17} cy={-80} rx={5.5} ry={3.4} fill="#FF9DB0" opacity={0.7} />}
      {/* tay trước */}
      <g fill="none" strokeLinecap="round">
        <path d={sitting ? 'M -36 -80 Q -24 -60 2 -58' : `M -40 -78 Q ${-54 - 6 * swing} ${-66 - 5 * swing} ${-58 - 8 * swing} ${-50 - 4 * swing}`} stroke={NAVY} strokeWidth={14} />
        <path d={sitting ? 'M -36 -80 Q -24 -60 2 -58' : `M -40 -78 Q ${-54 - 6 * swing} ${-66 - 5 * swing} ${-58 - 8 * swing} ${-50 - 4 * swing}`} stroke="#FFC93C" strokeWidth={6.5} />
      </g>
    </g>
  );

  const zk = (t * 0.45) % 1;
  return (
    <g>
      <circle cy={-60} r={74} fill="url(#g8-glow)" opacity={0.22 + 0.12 * Math.sin(t * 2)} />
      <ellipse cx={-6} cy={4} rx={36} ry={7} fill={NAVY} opacity={0.18} />
      {running && (
        <g>
          {[0, 1, 2, 3].map((i) => {
            const k = (t * 3.2 + i / 4) % 1;
            return <Zig key={i} x={-52 - 34 * k - i * 6} y={-30 - 54 * (i % 2) - 10 * i} s={0.9 - 0.4 * k} rot={-20} a={1 - k} />;
          })}
        </g>
      )}
      {w > 0.35 && !running && <Zig x={-52} y={-112} s={0.85 + 0.15 * Math.sin(t * 9)} rot={-18} a={0.4 + 0.5 * w} />}
      <g transform={`translate(0 ${bob.toFixed(2)}) rotate(${lean})`}>{body}</g>
      {sleeping &&
        [0, 1, 2].map((i) => {
          const k = (zk + i / 3) % 1;
          return (
            <text key={i} x={58 + 22 * k} y={-128 - 60 * k} fontFamily="'Be Vietnam Pro', sans-serif" fontWeight={900} fontSize={26 + 14 * k} fill="#fff" stroke={NAVY} strokeWidth={6} paintOrder="stroke" opacity={Math.sin(Math.PI * k)} textAnchor="middle">
              z
            </text>
          );
        })}
      {w > 0.65 && !running && (
        <path d="M 52 -118 C 44 -104 42 -98 48 -92 C 56 -92 58 -104 52 -118 Z" fill="#8FD0FF" stroke={NAVY} strokeWidth={3} strokeLinejoin="round" transform={`translate(0 ${(5 * Math.sin(t * 4)).toFixed(1)})`} />
      )}
    </g>
  );
};
