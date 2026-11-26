/* Hai thẻ duy nhất của V007, cùng nằm ở dải dưới (y 940–1135, lề phải 160) dưới đại tràng đang lùi ra toàn cảnh:
   Thẻ 1 (cảnh 6): "45 tuổi" lớn + hai nhóm cần bắt đầu sớm hơn. Thẻ 2 (cảnh 7): hai ô song song FIT / nội soi. */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {smooth} from './Motion';
import {E, S, W} from './timeline';

const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});
const C = {x: 56, y: 940, w: 864, h: 195};

const Frame = () => (
  <g>
    <rect x={C.x + 6} y={C.y + 12} width={C.w} height={C.h} rx={40} fill={NAVY} opacity={0.14} />
    <rect x={C.x} y={C.y} width={C.w} height={C.h} rx={40} fill="rgba(255,255,255,0.96)" stroke={NAVY} strokeWidth={6} />
  </g>
);

const PeopleIcon = () => (
  <g>
    <circle cx={-9} cy={-9} r={8} fill="#FFD2B8" stroke={NAVY} strokeWidth={3.5} />
    <path d="M -22 14 C -22 0 -2 0 -2 14 Z" fill="#7FB5EA" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
    <circle cx={10} cy={-6} r={7} fill="#FFD2B8" stroke={NAVY} strokeWidth={3.5} />
    <path d="M -1 14 C -1 2 19 2 19 14 Z" fill="#F29BB0" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
  </g>
);
const PolypIcon = () => (
  <g>
    <path d="M -17 12 C -17 -14 17 -14 17 12 Z" fill="url(#g7-poly)" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M -22 12 H 22" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
  </g>
);

/* ---------- Thẻ 1 ---------- */
export const Card1 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(6, 'từ') - 0.1;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(6) + 0.1, 0.35));
  if (out >= 1) return null;
  const big = sp(frame, W(6, '45') - 0.1, 9);
  const rows = [
    {at: W(6, 'Có'), label: 'Người thân từng mắc', icon: <PeopleIcon />},
    {at: W(6, 'hoặc'), label: 'Từng có polyp', icon: <PolypIcon />},
  ];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame />
        <text x={C.x + 150} y={C.y + 42} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#4A5D70">
          Nguy cơ trung bình
        </text>
        <g transform={`translate(${C.x + 22} ${C.y + 150}) scale(${Math.min(1.1, Math.max(0.01, big))})`} opacity={Math.min(1, big)}>
          <text x={0} y={0} fontFamily={FONT} fontWeight={900} fontSize={118} fill={ORANGE}>
            45
          </text>
          <text x={158} y={0} fontFamily={FONT} fontWeight={800} fontSize={44} fill={NAVY}>
            tuổi
          </text>
        </g>
        <path d={`M ${C.x + 300} ${C.y + 26} V ${C.y + C.h - 26}`} stroke={NAVY} strokeWidth={4} strokeDasharray="3 12" strokeLinecap="round" opacity={0.45} />
        <text x={C.x + 330} y={C.y + 52} fontFamily={FONT} fontWeight={800} fontSize={31} fill={NAVY} opacity={Math.min(1, sp(frame, W(6, 'Có') - 0.2, 14))}>
          Nên bắt đầu sớm hơn, hỏi bác sĩ:
        </text>
        {rows.map((r, i) => {
          const s = Math.min(1, t >= r.at - 0.05 ? sp(frame, r.at, 11) : 0);
          const y = C.y + 70 + i * 60;
          return (
            <g key={i} transform={`translate(${C.x + 330} ${y}) scale(${Math.max(0.01, s)})`} opacity={s} style={{transformBox: 'fill-box'}}>
              <rect x={0} y={0} width={480} height={50} rx={25} fill="#FFE9D6" stroke={NAVY} strokeWidth={4.5} />
              <g transform="translate(34 25)">
                <circle r={20} fill="#fff" stroke={NAVY} strokeWidth={3.5} />
                <g transform="scale(0.62)">{r.icon}</g>
              </g>
              <text x={68} y={35} fontFamily={FONT} fontWeight={800} fontSize={30} fill={NAVY}>
                {r.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------- Thẻ 2 ---------- */
export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = S(7) + 0.05;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(7) + 0.4, 0.4));
  if (out >= 1) return null;
  const w = (C.w - 60) / 2;
  const fit = Math.min(1, sp(frame, S(7) + 0.25, 11));
  const scope = 0.32 + 0.68 * Math.min(1, t >= W(7, 'Cách', 1) - 0.2 ? sp(frame, W(7, 'Cách', 1) - 0.15, 11) : 0);
  const hotFit = smooth(P(t, W(7, 'FIT') - 0.1, 0.3)) * (1 - smooth(P(t, W(7, 'Cách', 1) - 0.1, 0.3)));
  const hotScope = smooth(P(t, W(7, 'Cách', 1) - 0.1, 0.3));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame />
        {/* ô FIT */}
        <g transform={`translate(${C.x + 20} ${C.y + 18})`} opacity={fit} style={{transformBox: 'fill-box'}}>
          <rect x={0} y={0} width={w} height={C.h - 36} rx={28} fill={hotFit > 0.05 ? '#FFE9D6' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
          {/* nhà + ống mẫu */}
          <g transform="translate(66 78)">
            <path d="M -40 -4 L 0 -38 L 40 -4 V 40 H -40 Z" fill="#fff" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
            <path d="M -48 -2 L 0 -44 L 48 -2" fill="none" stroke="#E0705A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            <rect x={-8} y={4} width={16} height={36} rx={8} fill="#E8F3FB" stroke={NAVY} strokeWidth={4} />
            <rect x={-6} y={18} width={12} height={20} rx={6} fill="#7FB5EA" />
          </g>
          <text x={128} y={66} fontFamily={FONT} fontWeight={900} fontSize={58} fill={ORANGE}>
            FIT
          </text>
          <text x={128} y={106} fontFamily={FONT} fontWeight={800} fontSize={29} fill={NAVY}>
            mỗi năm · tại nhà
          </text>
          <text x={24} y={146} fontFamily={FONT} fontWeight={700} fontSize={26} fill="#4A5D70">
            Dương tính thì nội soi
          </text>
        </g>
        {/* ô nội soi */}
        <g transform={`translate(${C.x + 40 + w} ${C.y + 18})`} opacity={scope} style={{transformBox: 'fill-box'}}>
          <rect x={0} y={0} width={w} height={C.h - 36} rx={28} fill={hotScope > 0.05 ? '#FFE9D6' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
          <g transform="translate(66 78)">
            <rect x={-40} y={-26} width={62} height={52} rx={22} fill="url(#g7-scope)" stroke={NAVY} strokeWidth={5} />
            <rect x={-52} y={-14} width={20} height={28} rx={8} fill="#264B66" stroke={NAVY} strokeWidth={4} />
            <circle cx={-44} cy={0} r={6} fill="#FFE98A" />
            <path d="M 22 0 C 40 0 44 24 40 40" fill="none" stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
            <path d="M 22 0 C 40 0 44 24 40 40" fill="none" stroke="#2A8FBE" strokeWidth={8} strokeLinecap="round" />
            <circle cx={-20} cy={-6} r={4} fill={NAVY} />
            <circle cx={-4} cy={-6} r={4} fill={NAVY} />
          </g>
          <text x={128} y={72} fontFamily={FONT} fontWeight={900} fontSize={46} fill={NAVY}>
            Nội soi
          </text>
          <text x={128} y={112} fontFamily={FONT} fontWeight={900} fontSize={38} fill={ORANGE}>
            ~10 năm
          </text>
          <text x={24} y={146} fontFamily={FONT} fontWeight={700} fontSize={26} fill="#4A5D70">
            nếu bình thường
          </text>
        </g>
      </g>
    </svg>
  );
};
