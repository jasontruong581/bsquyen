/* Hai thẻ duy nhất của V008, cùng nằm ở dải dưới (y tới 1135, lề phải 160):
   Thẻ 1 (cảnh 7): hai ô "quen thuốc" -> bác sĩ chỉnh liều; "lệ thuộc thể chất" -> giảm từ từ, không tự ngưng.
   Thẻ 2 (cảnh 10): ba ô thang 0–10, uống đúng giờ, không tự đổi liều, kèm dòng "theo chỉ định của bác sĩ". */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {SignIconSvg} from './Props';
import {smooth} from './Motion';
import {E, S, W} from './timeline';

const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});

const Frame = ({x, y, w, h}: {x: number; y: number; w: number; h: number}) => (
  <g>
    <rect x={x + 6} y={y + 12} width={w} height={h} rx={40} fill={NAVY} opacity={0.14} />
    <rect x={x} y={y} width={w} height={h} rx={40} fill="rgba(255,255,255,0.96)" stroke={NAVY} strokeWidth={6} />
  </g>
);

/* ---------- Thẻ 1 ---------- */
const C1 = {x: 56, y: 922, w: 864, h: 213};

export const Card1 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(7, 'Quen') - 0.1;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(7) - 0.05, 0.35)); // tắt hẳn trước khi cảnh 8 bắt đầu
  if (out >= 1) return null;
  const w = (C1.w - 60) / 2;
  const cells = [
    {icon: 'bars' as const, title: 'QUEN THUỐC', sub: 'đáp ứng kém dần', act: 'Bác sĩ chỉnh liều', act2: '', from: a0, to: W(7, 'Lệ') - 0.1, actAt: W(7, 'nên')},
    {icon: 'chain' as const, title: 'LỆ THUỘC', sub: 'thể chất', act: 'Giảm từ từ', act2: 'không tự ngưng', from: W(7, 'Lệ') - 0.15, to: Infinity, actAt: W(7, 'nên', 1)},
  ];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame {...C1} />
        {cells.map((c, i) => {
          const s = Math.min(1, t >= c.from - 0.05 ? sp(frame, c.from, 11) : i === 0 ? 1 : 0);
          const hot = t >= c.from && t < c.to;
          const act = Math.min(1, t >= c.actAt - 0.1 ? sp(frame, c.actAt - 0.05, 12) : 0);
          return (
            <g key={i} transform={`translate(${C1.x + 20 + i * (w + 20)} ${C1.y + 18})`} opacity={0.35 + 0.65 * s}>
              <rect x={0} y={0} width={w} height={C1.h - 36} rx={28} fill={hot ? '#FFE9D6' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
              <g transform="translate(58 56)">
                <circle r={40} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
                <g transform="scale(0.9)">
                  <SignIconSvg icon={c.icon} t={t} />
                </g>
              </g>
              <text x={112} y={52} fontFamily={FONT} fontWeight={900} fontSize={37} fill={NAVY}>
                {c.title}
              </text>
              <text x={112} y={86} fontFamily={FONT} fontWeight={700} fontSize={27} fill="#4A5D70">
                {c.sub}
              </text>
              <path d={`M 18 104 H ${w - 18}`} stroke={NAVY} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" opacity={0.4} />
              <g opacity={act} transform={`translate(${(1 - act) * 24} 0)`}>
                <path d="M 24 128 H 52 M 42 116 L 54 128 L 42 140" fill="none" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                <text x={68} y={139} fontFamily={FONT} fontWeight={900} fontSize={33} fill={ORANGE}>
                  {c.act}
                </text>
                {c.act2 && (
                  <text x={68} y={169} fontFamily={FONT} fontWeight={800} fontSize={27} fill={NAVY}>
                    {c.act2}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------- Thẻ 2 ---------- */
const C2 = {x: 56, y: 913, w: 864, h: 222};

const ScaleIcon = ({t}: {t: number}) => {
  const k = 0.5 + 0.5 * Math.sin(t * 1.6);
  return (
    <g>
      <rect x={-52} y={-8} width={104} height={16} rx={8} fill="url(#g8-pain-scale)" stroke={NAVY} strokeWidth={4} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M ${-46 + i * 18.4} 12 V 20`} stroke={NAVY} strokeWidth={3} strokeLinecap="round" />
      ))}
      <circle cx={-46 + 92 * k} cy={0} r={11} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
    </g>
  );
};
const ClockIcon = ({t}: {t: number}) => (
  <g>
    <circle r={30} fill="#fff" stroke={NAVY} strokeWidth={5} />
    {[0, 90, 180, 270].map((a) => (
      <path key={a} d="M 0 -25 V -20" stroke={NAVY} strokeWidth={3.5} strokeLinecap="round" transform={`rotate(${a})`} />
    ))}
    <path d="M 0 0 V -17" stroke={NAVY} strokeWidth={5} strokeLinecap="round" transform={`rotate(${(t * 40) % 360})`} />
    <path d="M 0 0 V -23" stroke={ORANGE} strokeWidth={4} strokeLinecap="round" transform={`rotate(${(t * 240) % 360})`} />
    <circle r={4} fill={NAVY} />
  </g>
);
const LockIcon = () => (
  <g>
    <path d="M -13 -4 V -16 C -13 -34 13 -34 13 -16 V -4" fill="none" stroke={NAVY} strokeWidth={7} strokeLinecap="round" />
    <rect x={-22} y={-6} width={44} height={34} rx={9} fill="#FFC93C" stroke={NAVY} strokeWidth={5} />
    <circle cy={9} r={5} fill={NAVY} />
  </g>
);

export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(10, 'nói') - 0.15;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(10) - 0.05, 0.35)); // tắt hẳn trước khi cảnh 11 bắt đầu
  if (out >= 1) return null;
  const w = (C2.w - 32 - 28) / 3;
  const cells = [
    {title: 'THANG 0–10', sub: 'nói đúng mức đau', at: a0, to: W(10, 'uống') - 0.15},
    {title: 'ĐÚNG GIỜ', sub: 'uống theo giờ', at: W(10, 'uống') - 0.15, to: W(10, 'và') - 0.05},
    {title: 'KHÔNG TỰ ĐỔI', sub: 'tăng, giảm, ngưng', at: W(10, 'và') - 0.05, to: Infinity},
  ];
  const line = Math.min(1, t >= W(10, 'tăng') - 0.1 ? sp(frame, W(10, 'tăng') - 0.05, 12) : 0);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="g8-pain-scale" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9BE3C4" />
          <stop offset="0.5" stopColor="#FFD86B" />
          <stop offset="1" stopColor="#FF7D5A" />
        </linearGradient>
      </defs>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame {...C2} />
        {cells.map((c, i) => {
          const s = Math.min(1, t >= c.at - 0.05 ? sp(frame, c.at, 11) : 0);
          const hot = t >= c.at && t < c.to;
          return (
            <g key={i} transform={`translate(${C2.x + 16 + i * (w + 14)} ${C2.y + 14}) translate(${w / 2} 66) scale(${0.92 + 0.08 * s}) translate(${-w / 2} -66)`} opacity={0.3 + 0.7 * s}>
              <rect x={0} y={0} width={w} height={138} rx={28} fill={hot ? '#FFE9D6' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
              <g transform={`translate(${w / 2} 38)`}>{i === 0 ? <ScaleIcon t={t} /> : i === 1 ? <ClockIcon t={t} /> : <LockIcon />}</g>
              <text x={w / 2} y={i === 0 ? 100 : 94} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={NAVY}>
                {c.title}
              </text>
              <text x={w / 2} y={i === 0 ? 126 : 122} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={23} fill="#4A5D70">
                {c.sub}
              </text>
            </g>
          );
        })}
        <g opacity={line} transform={`translate(0 ${(1 - line) * 12})`}>
          <text x={C2.x + C2.w / 2} y={C2.y + C2.h - 18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={31} fill={ORANGE}>
            theo chỉ định của bác sĩ
          </text>
        </g>
      </g>
    </svg>
  );
};
