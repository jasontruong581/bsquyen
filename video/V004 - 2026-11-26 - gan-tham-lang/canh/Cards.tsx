/* Hai thẻ duy nhất của V004 (toạ độ màn hình 1080x1920, nằm trong y 410-1130, lề phải 160):
   Thẻ 1 (cảnh 7): ba nhóm nguy cơ + "6 tháng". Thẻ 2 (cảnh 10): ba bước hành động. */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {LIVER_D} from './World';
import {Virus} from './Props';
import {E, S, W} from './timeline';

const smooth = (p: number) => p * p * (3 - 2 * p);
const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});

const Frame = ({x, y, w, h, a}: {x: number; y: number; w: number; h: number; a: number}) => (
  <g opacity={a}>
    <rect x={x + 6} y={y + 12} width={w} height={h} rx={44} fill={NAVY} opacity={0.14} />
    <rect x={x} y={y} width={w} height={h} rx={44} fill="rgba(255,255,255,0.95)" stroke={NAVY} strokeWidth={6} />
  </g>
);

/* ---------- Thẻ 1 ---------- */
const C1 = {x: 56, y: 410, w: 864, h: 256};
export const Card1 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(7, 'Với') - 0.25;
  const a1 = S(8) + 0.05;
  if (t < a0 - 0.05 || t > a1 + 0.5) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, a1, 0.4));
  const cols = [
    {at: W(7, 'xơ'), name: 'Xơ gan'},
    {at: W(7, 'viêm'), name: 'Viêm gan B mạn'},
    {at: W(7, 'hoặc') + 0.2, name: 'Viêm gan C mạn'},
  ];
  const six = sp(frame, W(7, '6') - 0.05, 8);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * -60})`} opacity={Math.min(1, inn)}>
        <Frame x={C1.x} y={C1.y} w={C1.w} h={C1.h} a={1} />
        <text x={C1.x + 40} y={C1.y + 52} fontFamily={FONT} fontWeight={800} fontSize={28} fill="#5b6b7b" letterSpacing={2}>
          NHÓM NGUY CƠ
        </text>
        {cols.map((c, i) => {
          const cx = C1.x + 150 + i * 280;
          const s = sp(frame, c.at, 10);
          return (
            <g key={i} transform={`translate(${cx} ${C1.y + 146}) scale(${s})`}>
              {i === 0 && (
                <g transform="scale(0.2)">
                  <path d={LIVER_D} fill="#A8473A" stroke={NAVY} strokeWidth={26} strokeLinejoin="round" />
                  {[[-160, -80], [-60, -150], [60, -100], [-220, 20], [-110, 40], [0, 20], [110, 40], [220, -10], [-60, 140], [80, 110]].map(([bx, by], k) => (
                    <circle key={k} cx={bx} cy={by} r={34} fill="#C86A58" stroke="#5E2323" strokeWidth={6} />
                  ))}
                </g>
              )}
              {i === 1 && <Virus x={0} y={0} tag="B" body="#7E57C2" spike="#B39DDB" t={0} talk={false} scale={1} letter="B" />}
              {i === 2 && <Virus x={0} y={0} tag="C" body="#2BA39B" spike="#8FE0D5" t={0} talk={false} scale={1} letter="C" />}
              <text x={0} y={96} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={NAVY}>
                {c.name}
              </text>
            </g>
          );
        })}
        {/* lịch 6 tháng */}
        <g transform={`translate(${C1.x + C1.w - 112} ${C1.y + 52}) scale(${six * 0.8}) rotate(3)`}>
          <rect x={-80} y={-48} width={160} height={104} rx={20} fill="#fff" stroke={NAVY} strokeWidth={6} />
          <path d="M -80 -48 H 80 V -12 H -80 Z" fill={ORANGE} stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={NAVY}>
            6 tháng
          </text>
        </g>
      </g>
    </svg>
  );
};

/* ---------- Thẻ 2 ---------- */
const C2 = {x: 56, y: 680, w: 864, h: 440};
const ROW_H = 128;
export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = S(10) - 0.15;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const rows = [
    {at: S(10) + 0.05, text: ['Xét nghiệm viêm gan', 'B, C một lần']},
    {at: S(10) + 0.4, text: ['Siêu âm đều nếu thuộc', 'nhóm nguy cơ']},
    {at: S(10) + 0.75, text: ['Hạn chế rượu bia,', 'tiêm vắc-xin viêm gan B']},
  ];
  const out = smooth(P(t, E(10) + 0.02, 0.35));
  const hot = smooth(P(t, W(10, 'Hạn'), 0.3)) * (1 - smooth(P(t, E(10) - 2.6, 0.4)));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 70})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame x={C2.x} y={C2.y} w={C2.w} h={C2.h} a={1} />
        {/* đường nối các bước */}
        <path d={`M ${C2.x + 92} ${C2.y + 78} V ${C2.y + 78 + ROW_H * 2}`} stroke={NAVY} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" opacity={0.6} />
        {rows.map((r, i) => {
          const s = sp(frame, r.at, 11);
          const y = C2.y + 78 + i * ROW_H;
          const lit = i === 2 ? hot : 0;
          return (
            <g key={i} transform={`translate(0 ${y})`} opacity={Math.min(1, s)}>
              {lit > 0.01 && <rect x={C2.x + 20} y={-54} width={C2.w - 40} height={108} rx={30} fill="#FFE9D6" opacity={lit} />}
              <circle cx={C2.x + 92} cy={0} r={34} fill={ORANGE} stroke={NAVY} strokeWidth={6} transform={`scale(${s})`} style={{transformOrigin: `${C2.x + 92}px 0px`}} />
              <text x={C2.x + 92} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill="#fff" stroke={NAVY} strokeWidth={5} paintOrder="stroke">
                {i + 1}
              </text>
              <g transform={`translate(${C2.x + 200} 0)`}>
                {i === 0 && (
                  <g transform="rotate(16)">
                    <rect x={-17} y={-44} width={34} height={88} rx={17} fill="#fff" stroke={NAVY} strokeWidth={5} />
                    <rect x={-14} y={-8} width={28} height={50} rx={14} fill="#D63A3A" />
                    <rect x={-20} y={-54} width={40} height={16} rx={7} fill={ORANGE} stroke={NAVY} strokeWidth={4} />
                  </g>
                )}
                {i === 1 && (
                  <g>
                    <rect x={-20} y={-46} width={40} height={52} rx={14} fill="#EDF2F8" stroke={NAVY} strokeWidth={5} />
                    <rect x={-28} y={4} width={56} height={16} rx={8} fill="#51647A" stroke={NAVY} strokeWidth={5} />
                    <path d="M 0 22 L -34 52 A 40 40 0 0 0 34 52 Z" fill="#3A4656" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" opacity={0.9} />
                  </g>
                )}
                {i === 2 && (
                  <g>
                    <path d="M -10 -44 H 10 V -24 L 22 -4 V 40 H -22 V -4 L -10 -24 Z" fill="#F2C94C" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                    <path d="M -34 -34 L 34 34 M 34 -34 L -34 34" stroke="#D63A3A" strokeWidth={9} strokeLinecap="round" />
                  </g>
                )}
              </g>
              <text x={C2.x + 280} y={i === 2 ? -6 : -6} fontFamily={FONT} fontWeight={800} fontSize={33} fill={NAVY}>
                {r.text[0]}
              </text>
              <text x={C2.x + 280} y={34} fontFamily={FONT} fontWeight={800} fontSize={33} fill={NAVY}>
                {r.text[1]}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
