/* Hai thẻ duy nhất của V009, cùng nằm ở dải dưới (y tới 1135, lề phải 160):
   Thẻ 1 (cảnh 9): hai ô theo tuổi (dưới 30: thường siêu âm trước; từ 40: nhũ ảnh chẩn đoán kèm siêu âm), nguồn ACR 2022 ghi nhỏ.
   Thẻ 2 (cảnh 10): "Từ khoảng 40 tuổi: hỏi bác sĩ về nhũ ảnh định kỳ". */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {T, smooth} from './Motion';
import {E, W} from './timeline';

const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});

const Frame = ({x, y, w, h}: {x: number; y: number; w: number; h: number}) => (
  <g>
    <rect x={x + 6} y={y + 12} width={w} height={h} rx={40} fill={NAVY} opacity={0.14} />
    <rect x={x} y={y} width={w} height={h} rx={40} fill="rgba(255,255,255,0.96)" stroke={NAVY} strokeWidth={6} />
  </g>
);

const WavesIcon = () => (
  <g fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round">
    <path d="M -10 -22 H 10 L 7 -6 H -7 Z" fill="#A5BCF0" strokeLinejoin="round" />
    {[12, 22, 32].map((r, i) => (
      <path key={r} d={`M ${-r} ${-2 + r * 0.25} A ${r} ${r} 0 0 0 ${r} ${-2 + r * 0.25}`} stroke="#7F6EE6" opacity={1 - i * 0.2} />
    ))}
  </g>
);
const FilmIcon = () => (
  <g>
    <rect x={-27} y={-22} width={54} height={44} rx={8} fill="#2D3C6B" stroke={NAVY} strokeWidth={4.5} />
    <circle r={13} fill="#8D8FD8" stroke="#C9CBF4" strokeWidth={3} />
    <circle cx={-5} cy={-4} r={3.5} fill="#FFF3B8" />
  </g>
);

/* ---------- Thẻ 1 ---------- */
const C1 = {x: 56, y: 913, w: 864, h: 222};

export const Card1 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(9, 'Bác') + 0.15;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(9) - 0.05, 0.35)); // tắt hẳn trước khi cảnh 10 bắt đầu
  if (out >= 1) return null;
  const w = (C1.w - 60) / 2;
  const cells = [
    {title: 'DƯỚI 30 TUỔI', sub: ['thường siêu âm', 'trước'], icon: <WavesIcon />, from: T.probe, to: T.film - 0.1},
    {title: 'TỪ 40 TUỔI', sub: ['nhũ ảnh chẩn đoán', 'kèm siêu âm'], icon: <FilmIcon />, from: T.film, to: Infinity},
  ];
  const note = Math.min(1, t >= a0 + 0.5 ? sp(frame, a0 + 0.5, 12) : 0);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame {...C1} />
        {cells.map((c, i) => {
          const s = Math.min(1, t >= c.from - 0.05 ? sp(frame, c.from, 11) : 0);
          const hot = t >= c.from && t < c.to;
          return (
            <g key={i} transform={`translate(${C1.x + 20 + i * (w + 20)} ${C1.y + 18})`} opacity={0.45 + 0.55 * s}>
              <rect x={0} y={0} width={w} height={C1.h - 62} rx={28} fill={hot ? '#FFE9D6' : '#F4F8FB'} stroke={NAVY} strokeWidth={4.5} />
              <g transform="translate(56 80)">
                <circle r={40} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
                <g transform="scale(0.95)">{c.icon}</g>
              </g>
              <text x={110} y={56} fontFamily={FONT} fontWeight={900} fontSize={34} fill={NAVY}>
                {c.title}
              </text>
              {c.sub.map((line, k) => (
                <text key={k} x={110} y={94 + k * 32} fontFamily={FONT} fontWeight={700} fontSize={27} fill={hot ? ORANGE : '#4A5D70'}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}
        <g opacity={note}>
          <text x={C1.x + C1.w / 2} y={C1.y + C1.h - 18} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={26} fill="#5B6B7B">
            Nguồn: Hội Điện quang Hoa Kỳ (ACR), 2022
          </text>
        </g>
      </g>
    </svg>
  );
};

/* ---------- Thẻ 2 ---------- */
const C2 = {x: 56, y: 913, w: 864, h: 222};

export const Card2 = ({t, frame}: {t: number; frame: number}) => {
  const a0 = T.card2;
  if (t < a0 - 0.05) return null;
  const inn = sp(frame, a0, 13);
  const out = smooth(P(t, E(10) + 0.3, 0.35)); // nhường chỗ cho màn kết
  if (out >= 1) return null;
  const k = Math.min(1, t >= W(10, 'hỏi') - 0.1 ? sp(frame, W(10, 'hỏi') - 0.05, 12) : 0);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(0 ${(1 - Math.min(1, inn)) * 80})`} opacity={Math.min(1, inn) * (1 - out)}>
        <Frame {...C2} />
        <g transform={`translate(${C2.x + 118} ${C2.y + C2.h / 2})`}>
          <circle r={74} fill="#FFF3F8" stroke={NAVY} strokeWidth={5} />
          <circle r={56} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
          <circle r={56} fill="none" stroke="#D8C9F3" strokeWidth={3} />
          {Array.from({length: 12}, (_, i) => (
            <path key={i} d="M 0 -64 V -56" stroke={NAVY} strokeWidth={4} strokeLinecap="round" transform={`rotate(${i * 30})`} opacity={0.55} />
          ))}
          <text textAnchor="middle" y={19} fontFamily={FONT} fontWeight={900} fontSize={58} fill={ORANGE} stroke="#fff" strokeWidth={9} paintOrder="stroke">
            40
          </text>
        </g>
        <text x={C2.x + 232} y={C2.y + 92} fontFamily={FONT} fontWeight={900} fontSize={44} fill={NAVY}>
          Từ khoảng 40 tuổi
        </text>
        <g opacity={k} transform={`translate(${(1 - k) * 30} 0)`}>
          <path d={`M ${C2.x + 234} ${C2.y + 130} H ${C2.x + 266} M ${C2.x + 254} ${C2.y + 118} L ${C2.x + 268} ${C2.y + 130} L ${C2.x + 254} ${C2.y + 142}`} fill="none" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          <text x={C2.x + 284} y={C2.y + 141} fontFamily={FONT} fontWeight={800} fontSize={31} fill={ORANGE}>
            hỏi bác sĩ về nhũ ảnh định kỳ
          </text>
        </g>
      </g>
    </svg>
  );
};
