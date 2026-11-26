/* Đèn: chiếc đèn lồng nhỏ mặt hiền, bay cùng người xem dọc hai làn đường. Khung cục bộ: tâm ở thân đèn, cao ~250 (kể cả chóp và tua), nhìn thẳng ra màn hình.
   Tông nghiêm ấm: mặc định mặt ân cần (mày hơi nhướng, miệng khép); chỉ mỉm cười nhẹ khi mood = 1; không bao giờ cười tươi hay làm trò. */
import {NAVY} from '../../src/common/overlays';
import {clamp01} from './Motion';

const RED = '#E85D3F';

const Eye = ({x, y, closed, look}: {x: number; y: number; closed: number; look: [number, number]}) => {
  if (closed > 0.55) return <path d={`M ${x - 13} ${y + 2} Q ${x} ${y + 11} ${x + 13} ${y + 2}`} fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={13.5} ry={16 * (1 - closed)} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
      <circle cx={x + look[0] * 4} cy={y + look[1] * 4} r={7.4} fill={NAVY} />
      <circle cx={x + look[0] * 4 - 2.4} cy={y + look[1] * 4 - 2.8} r={2.6} fill="#fff" />
    </g>
  );
};

export const Den = ({t, mood, look = [0, -0.25], glow = 1}: {t: number; mood: number; look?: [number, number]; glow?: number}) => {
  const m = clamp01(mood);
  const phase = t % 3.7;
  const closed = phase > 3.55 ? 1 : 0;
  const sway = 9 * Math.sin(t * 2.1);
  const arm = 7 * Math.sin(t * 2.6);
  const mouth = m > 0.5 ? `M -17 34 Q 0 ${52 + 3 * m} 17 34` : 'M -12 40 Q 0 44 12 40';
  return (
    <g>
      <circle r={200} fill="url(#g10-halo)" opacity={glow * (0.62 + 0.1 * Math.sin(t * 2.3))} />
      {/* tua dưới: ba sợi mảnh bay nhẹ */}
      <g>
        {[-11, 0, 11].map((dx, i) => {
          const d = `M ${dx * 0.4} 104 Q ${dx * 1.3 + sway * 0.45} 132 ${dx * 1.8 + sway * (0.8 + 0.1 * i)} ${158 - Math.abs(dx) * 0.6}`;
          return (
            <g key={i} fill="none" strokeLinecap="round">
              <path d={d} stroke={NAVY} strokeWidth={10} />
              <path d={d} stroke={i === 1 ? '#FFC93C' : RED} strokeWidth={4.5} />
            </g>
          );
        })}
        <circle cx={0} cy={106} r={8} fill="#FFC93C" stroke={NAVY} strokeWidth={4.5} />
      </g>
      {/* tay sau */}
      <path d={`M 70 8 Q ${96 + arm} ${14 - arm} ${104 + arm} ${34 - arm}`} fill="none" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
      <path d={`M 70 8 Q ${96 + arm} ${14 - arm} ${104 + arm} ${34 - arm}`} fill="none" stroke="#FFC93C" strokeWidth={7} strokeLinecap="round" />
      {/* nắp dưới, thân, nắp trên, móc */}
      <rect x={-28} y={82} width={56} height={20} rx={8} fill={RED} stroke={NAVY} strokeWidth={7} />
      <ellipse cx={0} cy={0} rx={82} ry={88} fill="url(#g10-den)" stroke={NAVY} strokeWidth={8.5} />
      <path d="M 0 -87 C -54 -42 -54 42 0 87 M 0 -87 C 54 -42 54 42 0 87" fill="none" stroke="#E58A1F" strokeWidth={5} opacity={0.4} />
      <ellipse cx={-34} cy={-44} rx={20} ry={30} fill="#fff" opacity={0.42} transform="rotate(24 -34 -44)" />
      <rect x={-28} y={-104} width={56} height={22} rx={8} fill={RED} stroke={NAVY} strokeWidth={7} />
      <path d="M -14 -104 C -14 -128 14 -128 14 -104" fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
      {/* mặt */}
      <Eye x={-27} y={-8} closed={closed} look={look} />
      <Eye x={27} y={-8} closed={closed} look={look} />
      {closed < 1 && (
        <g fill="none" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round">
          <path d={`M -43 ${-30 + 3 * m} Q -28 ${-40 + 4 * m} -13 ${-37 + 2 * m}`} />
          <path d={`M 13 ${-37 + 2 * m} Q 28 ${-40 + 4 * m} 43 ${-30 + 3 * m}`} />
        </g>
      )}
      <ellipse cx={-48} cy={22} rx={11} ry={7} fill="#FF9DB0" opacity={0.65} />
      <ellipse cx={48} cy={22} rx={11} ry={7} fill="#FF9DB0" opacity={0.65} />
      <path d={mouth} fill="none" stroke={NAVY} strokeWidth={4.6} strokeLinecap="round" />
      {/* tay trước */}
      <path d={`M -70 10 Q ${-96 - arm} ${18 + arm} ${-104 - arm} ${38 + arm}`} fill="none" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
      <path d={`M -70 10 Q ${-96 - arm} ${18 + arm} ${-104 - arm} ${38 + arm}`} fill="none" stroke="#FFC93C" strokeWidth={7} strokeLinecap="round" />
    </g>
  );
};
