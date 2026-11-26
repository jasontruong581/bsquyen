/* Hai thẻ duy nhất của V010, cùng nằm ở dải dưới (y tới 1135, lề phải 160), nguồn ghi ngay trên thẻ:
   Thẻ 1 (cảnh 6): thử nghiệm NEJM 2010 ở ung thư phổi di căn -> chất lượng sống tốt hơn, ít triệu chứng trầm cảm hơn (không khái quát cho mọi ung thư).
   Thẻ 2 (cảnh 7): một thanh 100 chấm, 14 chấm sáng: chỉ khoảng 14% người cần chăm sóc giảm nhẹ được tiếp cận (WHO). */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {T, smooth} from './Motion';
import {E} from './timeline';

const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});
const C = {x: 56, y: 900, w: 864, h: 235};

const Frame = () => (
  <g>
    <rect x={C.x + 6} y={C.y + 12} width={C.w} height={C.h} rx={40} fill={NAVY} opacity={0.14} />
    <rect x={C.x} y={C.y} width={C.w} height={C.h} rx={40} fill="rgba(255,255,255,0.97)" stroke={NAVY} strokeWidth={6} />
  </g>
);

const Sun = () => (
  <g>
    <circle r={17} fill="#FFC93C" stroke={NAVY} strokeWidth={4.5} />
    {Array.from({length: 8}, (_, i) => (
      <path key={i} d="M 0 -26 V -34" stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${i * 45})`} />
    ))}
  </g>
);
const Cloud = () => (
  <g>
    <path d="M -26 14 C -40 14 -40 -6 -24 -6 C -22 -24 8 -26 14 -8 C 34 -10 40 14 24 14 Z" fill="#DCE6F7" stroke={NAVY} strokeWidth={4.5} strokeLinejoin="round" />
    <path d="M -10 -26 L -2 -36 M 8 -28 L 12 -38" stroke="#FFC93C" strokeWidth={4.5} strokeLinecap="round" />
  </g>
);
const Arrow = ({up, color}: {up: boolean; color: string}) => (
  <path d={up ? 'M 0 14 V -14 M -12 -2 L 0 -14 L 12 -2' : 'M 0 -14 V 14 M -12 2 L 0 14 L 12 2'} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
);

/* ---------- Thẻ 1 ---------- */
export const Card1 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = T.card1;
  if (t < a0 - 0.05) return null;
  const inn = Math.min(1, sp(frame, a0, 13));
  const out = smooth(P(t, E(6) - 0.05, 0.35)); // tắt hẳn trước khi cảnh 7 bắt đầu
  if (out >= 1) return null;
  const cw = (C.w - 60) / 2;
  const cells = [
    {title: 'CHẤT LƯỢNG SỐNG', sub: 'tốt hơn', at: T.card1a, art: <Sun />, arrow: true, color: '#2FA37F'},
    {title: 'TRẦM CẢM', sub: 'ít triệu chứng hơn', at: T.card1b, art: <Cloud />, arrow: false, color: '#2FA37F'},
  ];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - inn) * 80})`} opacity={inn * (1 - out)}>
        <Frame />
        <text x={C.x + C.w / 2} y={C.y + 46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={29} fill="#4A5D70">
          Thử nghiệm NEJM 2010 · ung thư phổi di căn
        </text>
        {cells.map((c, i) => {
          const s = Math.min(1, t >= c.at - 0.05 ? sp(frame, c.at, 11) : 0);
          const hot = t >= c.at && (i === 1 || t < cells[1].at);
          return (
            <g key={i} transform={`translate(${C.x + 20 + i * (cw + 20)} ${C.y + 68})`} opacity={0.3 + 0.7 * s}>
              <rect x={0} y={0} width={cw} height={112} rx={26} fill={hot ? '#E6F7EF' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
              <g transform="translate(54 56)">
                <circle r={38} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
                <g transform="scale(0.85)">{c.art}</g>
              </g>
              <text x={106} y={46} fontFamily={FONT} fontWeight={900} fontSize={32} fill={NAVY}>
                {c.title}
              </text>
              <g transform="translate(120 82)">
                <g transform="scale(0.55)">
                  <Arrow up={c.arrow} color={c.color} />
                </g>
              </g>
              <text x={142} y={92} fontFamily={FONT} fontWeight={900} fontSize={i === 0 ? 34 : 30} fill={c.color}>
                {c.sub}
              </text>
            </g>
          );
        })}
        <text x={C.x + C.w / 2} y={C.y + C.h - 18} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={25} fill="#4A5D70">
          so với nhóm chỉ điều trị thông thường
        </text>
      </g>
    </svg>
  );
};

/* ---------- Thẻ 2 ---------- */
export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = T.card2;
  if (t < a0 - 0.05) return null;
  const inn = Math.min(1, sp(frame, a0, 13));
  const out = smooth(P(t, E(7) - 0.05, 0.35)); // tắt hẳn trước khi cảnh 8 bắt đầu
  if (out >= 1) return null;
  const lit = Math.round(14 * smooth(P(t, T.dots, 1.1)));
  const num = Math.round(14 * smooth(P(t, T.dots, 1.1)));
  const dx = 16.4;
  const x0 = C.x + (C.w - 49 * dx) / 2;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - inn) * 80})`} opacity={inn * (1 - out)}>
        <Frame />
        <text x={C.x + 40} y={C.y + 108} fontFamily={FONT} fontWeight={900} fontSize={104} fill={ORANGE}>
          {num}%
        </text>
        <text x={C.x + 280} y={C.y + 66} fontFamily={FONT} fontWeight={800} fontSize={33} fill={NAVY}>
          người cần chăm sóc giảm nhẹ
        </text>
        <text x={C.x + 280} y={C.y + 108} fontFamily={FONT} fontWeight={800} fontSize={33} fill={NAVY}>
          trên thế giới được tiếp cận
        </text>
        {Array.from({length: 100}, (_, i) => {
          const row = Math.floor(i / 50);
          const col = i % 50;
          const on = i < lit;
          const hot = i < 14 && i >= lit - 3 && on && t < T.dots + 1.6;
          return <circle key={i} cx={x0 + col * dx} cy={C.y + 150 + row * 22} r={on ? 7.6 : 6.4} fill={on ? '#FFA84A' : '#DCE3EE'} stroke={on ? NAVY : 'none'} strokeWidth={2.5} opacity={hot ? 1 : 0.95} />;
        })}
        <text x={C.x + C.w - 30} y={C.y + C.h - 16} textAnchor="end" fontFamily={FONT} fontWeight={700} fontSize={24} fill="#4A5D70">
          Nguồn: WHO · mỗi chấm là 1%
        </text>
      </g>
    </svg>
  );
};
