/* Đạo cụ của V004 (đều là một phần của mô hình, không phải thẻ): tạ, hai vi-rút, ba biểu tượng triệu chứng + mũi tên "đi trước",
   đầu dò siêu âm kèm hình quạt siêu âm, ống máu xét nghiệm. Tọa độ cục bộ của lá gan trừ khi ghi khác. */
import {spring} from 'remotion';
import {NAVY, ORANGE, FONT} from '../../src/common/overlays';
import {FPS, P, lerp} from '../../src/timeline';
import {topAt} from './World';
import {BAR_IN, BAR_OUT, BAR_X, barY} from './Gan';
import {E, S, W} from './timeline';

const smooth = (p: number) => p * p * (3 - 2 * p);
const sp = (frame: number, at: number, damping = 11) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 170}});
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* =============== Cảnh 2: tạ =============== */
export const Barbell = ({t, frame}: {t: number; frame: number}) => {
  if (t < BAR_IN - 0.05 || t > BAR_OUT + 0.5) return null;
  const s = sp(frame, BAR_IN, 9) * (1 - smooth(P(t, BAR_OUT, 0.35)));
  const y = barY(t);
  const strain = Math.sin((t - S(2)) * 2.7);
  return (
    <g transform={`translate(${BAR_X} ${y}) scale(${s})`}>
      <path d="M -250 0 H 250" stroke={NAVY} strokeWidth={22} strokeLinecap="round" />
      <path d="M -250 0 H 250" stroke="#C9D2DC" strokeWidth={11} strokeLinecap="round" />
      <path d="M -250 -3 H 250" stroke="#fff" strokeOpacity={0.7} strokeWidth={3} />
      {[-1, 1].map((k) => (
        <g key={k} transform={`translate(${k * 222} 0)`}>
          <rect x={-22} y={-78} width={44} height={156} rx={14} fill="#6E7F93" stroke={NAVY} strokeWidth={7} />
          <rect x={k * -2 - 10} y={-52} width={20} height={104} rx={8} fill="#8FA1B4" stroke={NAVY} strokeWidth={4} />
          <path d={`M ${-14} -64 V 60`} stroke="#fff" strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
          <rect x={k * 30 - 8} y={-18} width={16} height={36} rx={5} fill="#F26E21" stroke={NAVY} strokeWidth={5} />
        </g>
      ))}
      {/* vạch rung khi gắng sức */}
      {[-1, 1].map((k) => (
        <g key={k} opacity={0.4 + 0.4 * Math.abs(strain)} stroke={NAVY} strokeWidth={5} strokeLinecap="round">
          <path d={`M ${k * 290} -40 l ${k * 22} -14 M ${k * 296} 0 l ${k * 26} 0 M ${k * 290} 40 l ${k * 22} 14`} />
        </g>
      ))}
    </g>
  );
};

/* =============== Cảnh 3-4: hai vi-rút =============== */
export const VIRUS_FROM = S(3) + 0.15;
export const VIRUS_ARRIVE = S(3) + 1.25;
export const VIRUS_GONE = E(4) + 0.4;
export const VIRUS_SPOT = {b: {x: 98, y: -82}, c: {x: 104, y: 76}};
export const virusPos = (t: number, which: 'b' | 'c') => {
  const to = VIRUS_SPOT[which];
  const from = which === 'b' ? {x: 330, y: -430} : {x: 400, y: -250};
  const p = smooth(P(t, VIRUS_FROM + (which === 'c' ? 0.2 : 0), VIRUS_ARRIVE - VIRUS_FROM));
  const arc = Math.sin(p * Math.PI) * (which === 'b' ? 60 : -50);
  const bob = p >= 1 ? 3 * Math.sin(t * 2.4 + (which === 'b' ? 0 : 2)) : 0;
  return {x: lerp(from.x, to.x, p) + arc, y: lerp(from.y, to.y, p) + bob, p};
};
/** độ đậm vi-rút: hiện lúc bay vào, mờ 55% ở cảnh 4 (không ai biết), tắt hẳn trước đoạn nghiêm */
export const virusAlpha = (t: number) => smooth(P(t, VIRUS_FROM - 0.05, 0.2)) * (1 - 0.45 * smooth(P(t, S(4) - 0.2, 0.6))) * (1 - smooth(P(t, E(4) - 0.2, 0.6)));

const SPIKES = Array.from({length: 12}, (_, i) => (i * Math.PI * 2) / 12);
export const Virus = ({x, y, body, spike, t, talk, scale = 1, alpha = 1, rot = 0, letter}: {x: number; y: number; tag?: string; body: string; spike: string; t: number; talk: boolean; scale?: number; alpha?: number; rot?: number; letter?: string}) => {
  const blink = t % 2.9 > 2.8;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${rot + 6 * Math.sin(t * 1.3)})`} opacity={alpha}>
      {SPIKES.map((a, i) => (
        <g key={i} transform={`rotate(${(a * 180) / Math.PI})`}>
          <path d="M 0 -30 V -48" stroke={NAVY} strokeWidth={11} strokeLinecap="round" />
          <circle cx={0} cy={-52} r={9} fill={spike} stroke={NAVY} strokeWidth={5} />
        </g>
      ))}
      <circle r={36} fill={body} stroke={NAVY} strokeWidth={6.5} />
      <path d="M -24 -14 C -18 -26 -6 -30 6 -28" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
      {letter && (
        <text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#fff" stroke={NAVY} strokeWidth={6} paintOrder="stroke">
          {letter}
        </text>
      )}
      {/* mặt: lém lỉnh khi nói, rồi trung tính */}
      {!letter && (
      <g transform="translate(0 6)">
        {blink ? (
          <path d="M -17 -4 h 10 M 7 -4 h 10" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />
        ) : (
          <g>
            <ellipse cx={-12} cy={-4} rx={8.5} ry={9.5} fill="#fff" stroke={NAVY} strokeWidth={3} />
            <ellipse cx={12} cy={-4} rx={8.5} ry={9.5} fill="#fff" stroke={NAVY} strokeWidth={3} />
            <circle cx={-10 + (talk ? 2 : 0)} cy={-3} r={4.4} fill={NAVY} />
            <circle cx={14 + (talk ? 2 : 0)} cy={-3} r={4.4} fill={NAVY} />
          </g>
        )}
        {talk ? <path d="M -10 16 Q 0 24 12 12" fill="none" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" /> : <path d="M -8 17 H 8" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />}
      </g>
      )}
    </g>
  );
};

/** Thẻ chữ nhỏ gắn vào vi-rút ("B", "C") bằng đường chỉ, nằm ngay trên hình */
export const VirusTag = ({x, y, tag, alpha}: {x: number; y: number; tag: string; alpha: number}) => (
  <g opacity={alpha}>
    
    <circle cx={x + 52} cy={y - 54} r={25} fill="#fff" stroke={NAVY} strokeWidth={5} />
    <text x={x + 52} y={y - 43} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={NAVY}>
      {tag}
    </text>
  </g>
);

/* =============== Cảnh 6: ba biểu tượng triệu chứng + mũi tên "đi trước" (toạ độ thế giới) =============== */
const ICON_Y = 1020;
const ICON_X = [320, 540, 760];
const iconTimes = () => [W(6, 'đau'), W(6, 'vàng'), W(6, 'bụng')];
export const SymptomIcons = ({t, frame}: {t: number; frame: number}) => {
  if (t < S(6) - 0.1 || t > E(6) + 0.6) return null;
  const ts = iconTimes();
  const names = ['Đau tức', 'Vàng da', 'Bụng to'];
  const dimAt = W(6, 'tiến') + 0.2;
  const arrowT = W(6, 'đi') - 0.1;
  const arrowP = smooth(P(t, arrowT, 0.9));
  const ax = lerp(140, 1010, arrowP);
  return (
    <g>
      {ICON_X.map((x, i) => {
        const a = sp(frame, ts[i], 12);
        const lit = (1 - smooth(P(t, (ts[i + 1] ?? dimAt) + 0.25, 0.5))) * 0.75 + 0.25;
        const fade = 1 - 0.6 * smooth(P(t, arrowT + 0.2, 0.6));
        const op = (t < ts[i] - 0.05 ? 0 : 1) * lit * fade * (1 - smooth(P(t, E(6) + 0.1, 0.4)));
        return (
          <g key={i} transform={`translate(${x} ${ICON_Y}) scale(${a * (1 + 0.05 * Math.sin(t * 3 + i))})`} opacity={op}>
            <circle r={72} fill="#fff" stroke={NAVY} strokeWidth={6} />
            <circle r={72} fill="none" stroke={ORANGE} strokeWidth={5} opacity={0.9 * smooth(1 - P(t, ts[i], 0.9))} transform={`scale(${1 + P(t, ts[i], 0.9) * 0.4})`} />
            {i === 0 && (
              <g>
                <path d="M -30 -34 C -10 -44 22 -44 34 -30 C 42 -4 34 30 12 44 C -10 50 -34 30 -38 4 Z" fill="#F7B79F" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                <path d="M 6 -26 L -8 -2 L 6 -2 L -6 26 L 20 -8 L 6 -8 L 18 -26 Z" fill="#F26E21" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" />
              </g>
            )}
            {i === 1 && (
              <g>
                <path d="M -46 0 Q 0 -44 46 0 Q 0 44 -46 0 Z" fill="#fff" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                <circle r={22} fill="#F2C21A" stroke={NAVY} strokeWidth={4} />
                <circle r={9} fill={NAVY} />
                <circle cx={-7} cy={-8} r={4} fill="#fff" />
              </g>
            )}
            {i === 2 && (
              <g>
                <path d="M -42 -6 C -42 -44 42 -44 42 -6 C 52 28 12 52 0 52 C -12 52 -52 28 -42 -6 Z" fill="#F7B79F" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                <path d="M -10 6 q 10 12 20 0" fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
                <circle cx={0} cy={-4} r={4.5} fill={NAVY} />
              </g>
            )}
            <text x={0} y={108} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill={NAVY} stroke="#FFF0E6" strokeWidth={7} paintOrder="stroke">
              {names[i]}
            </text>
          </g>
        );
      })}
      {arrowP > 0.01 && t < E(6) + 0.6 && (
        <g opacity={smooth(Math.min(1, arrowP * 3)) * (1 - smooth(P(t, E(6) + 0.1, 0.4)))}>
          <path d={`M 120 ${ICON_Y - 4} H ${ax - 30}`} stroke={NAVY} strokeWidth={34} strokeLinecap="round" />
          <path d={`M 120 ${ICON_Y - 4} H ${ax - 30}`} stroke={ORANGE} strokeWidth={20} strokeLinecap="round" />
          <path d={`M ${ax - 52} ${ICON_Y - 52} L ${ax + 22} ${ICON_Y - 4} L ${ax - 52} ${ICON_Y + 44} Z`} fill={ORANGE} stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
          <text x={Math.max(250, ax - 200)} y={ICON_Y + 8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill="#fff" stroke={NAVY} strokeWidth={8} paintOrder="stroke">
            ĐI TRƯỚC
          </text>
        </g>
      )}
    </g>
  );
};

/* =============== Cảnh 8: đầu dò siêu âm và hình quạt =============== */
const PROBE_T0 = S(8) + 0.1;
const PROBE_T1 = E(8) - 0.15;
const SECTOR = (() => {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const speck = Array.from({length: 360}, () => ({r: 30 + rnd() * 390, a: (rnd() - 0.5) * 2, size: 1.4 + rnd() * 2.6, o: 0.25 + rnd() * 0.65, ph: rnd() * 6.28}));
  return speck;
})();
const THETA = (20 * Math.PI) / 180;
const BEAM = 470;

export const probeX = (t: number) => lerp(300, -5, smooth(P(t, PROBE_T0, PROBE_T1 - PROBE_T0)));
export const Probe = ({t, frame}: {t: number; frame: number}) => {
  if (t < PROBE_T0 - 0.4 || t > E(8) + 0.5) return null;
  const inn = sp(frame, PROBE_T0 - 0.35, 12);
  const out = smooth(P(t, E(8) - 0.05, 0.4));
  const x = probeX(t);
  const tip = topAt(x) + 6;
  const dy = -260 * (1 - Math.min(1, inn)) - 120 * out;
  const sc = scan(t);
  return (
    <g opacity={1 - out} transform={`translate(0 ${dy})`}>
      {/* hình quạt siêu âm */}
      <g opacity={0.92 * clamp01(inn)}>
        <path d={`M ${x} ${tip} L ${x - BEAM * Math.sin(THETA)} ${tip + BEAM * Math.cos(THETA)} A ${BEAM} ${BEAM} 0 0 0 ${x + BEAM * Math.sin(THETA)} ${tip + BEAM * Math.cos(THETA)} Z`} fill="url(#g4-us)" stroke="#B9CBE0" strokeWidth={4} strokeLinejoin="round" />
        {SECTOR.map((p, i) => {
          const a = p.a * THETA * 0.96;
          const px = x + p.r * Math.sin(a);
          const py = tip + p.r * Math.cos(a);
          const shimmer = 0.6 + 0.4 * Math.sin(t * 7 + p.ph);
          return <circle key={i} cx={px} cy={py} r={p.size} fill="#E3ECF6" opacity={p.o * shimmer} />;
        })}
        {/* cơ hoành sáng và hai mạch tối */}
        <path d={`M ${x - 80} ${tip + 60} Q ${x} ${tip + 36} ${x + 80} ${tip + 60}`} fill="none" stroke="#EAF1F8" strokeWidth={6} strokeLinecap="round" />
        <ellipse cx={x - 40} cy={tip + 200} rx={34} ry={14} fill="#10161E" opacity={0.7} />
        <ellipse cx={x + 52} cy={tip + 270} rx={42} ry={16} fill="#10161E" opacity={0.7} />
        <path d={`M ${x - BEAM * 0.96 * Math.sin(THETA) * sc} ${tip + BEAM * 0.96 * Math.cos(THETA) * sc} A ${BEAM * 0.96} ${BEAM * 0.96} 0 0 0 ${x + BEAM * 0.96 * Math.sin(THETA) * sc} ${tip + BEAM * 0.96 * Math.cos(THETA) * sc}`} fill="none" stroke="#9BF0D0" strokeOpacity={0.0} />
        <path d={`M ${x - sc * BEAM * Math.sin(THETA)} ${tip + sc * BEAM * Math.cos(THETA)} A ${sc * BEAM} ${sc * BEAM} 0 0 0 ${x + sc * BEAM * Math.sin(THETA)} ${tip + sc * BEAM * Math.cos(THETA)}`} fill="none" stroke="#9BF0D0" strokeOpacity={0.8} strokeWidth={4} />
      </g>
      {/* dây và thân đầu dò */}
      <path d={`M ${x} ${tip - 120} C ${x + 10} ${tip - 220} ${x + 150} ${tip - 260} ${x + 190} ${tip - 420}`} fill="none" stroke={NAVY} strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={x} cy={tip + 2} rx={66} ry={14} fill="#CFE8F5" opacity={0.85} />
      <g transform={`translate(${x} ${tip})`}>
        <rect x={-30} y={-122} width={60} height={106} rx={22} fill="#EDF2F8" stroke={NAVY} strokeWidth={7} />
        <rect x={-30} y={-92} width={60} height={14} fill="#B6C4D4" />
        <rect x={-30} y={-62} width={60} height={14} fill="#B6C4D4" />
        <rect x={-48} y={-24} width={96} height={26} rx={12} fill="#51647A" stroke={NAVY} strokeWidth={7} />
        <path d="M -16 -112 V -100" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  );
};
const scan = (t: number) => ((t * 1.1) % 1) * 0.9 + 0.08;

/* =============== Cảnh 9: ống máu xét nghiệm, dấu tích =============== */
export const BloodTube = ({t, frame}: {t: number; frame: number}) => {
  const a0 = W(9, 'xét') - 0.15;
  if (t < a0 || t > S(10) + 0.2) return null;
  const s = sp(frame, a0, 10);
  const out = smooth(P(t, S(10) - 0.05, 0.3));
  const fill = smooth(P(t, a0 + 0.2, 1.4));
  const tick = sp(frame, W(9, 'Làm') + 0.4, 8);
  const sway = 3 * Math.sin(t * 2.5);
  return (
    <g transform={`translate(330 -190) rotate(${16 + sway}) scale(${s * (1 - 0.3 * out)})`} opacity={1 - out}>
      <rect x={-34} y={-130} width={68} height={250} rx={34} fill="#F4FBFF" stroke={NAVY} strokeWidth={7} />
      <clipPath id="g4-tube">
        <rect x={-28} y={-124} width={56} height={238} rx={28} />
      </clipPath>
      <g clipPath="url(#g4-tube)">
        <rect x={-30} y={lerp(110, -20, fill) + 3 * Math.sin(t * 4)} width={60} height={160} fill="#D63A3A" />
        <path d={`M -30 ${lerp(110, -20, fill) + 3 * Math.sin(t * 4)} q 15 -9 30 0 t 30 0`} fill="#E86A60" />
        <path d="M -16 -96 V 90" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
      </g>
      <rect x={-42} y={-150} width={84} height={40} rx={14} fill="#F26E21" stroke={NAVY} strokeWidth={7} />
      <rect x={-34} y={-12} width={68} height={62} fill="#fff" stroke={NAVY} strokeWidth={4} />
      <text x={-17} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={NAVY}>
        B
      </text>
      <text x={17} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={NAVY}>
        C
      </text>
      <g transform={`translate(54 -86) scale(${tick})`}>
        <circle r={36} fill="#2E9E6A" stroke={NAVY} strokeWidth={6} />
        <path d="M -16 2 L -4 14 L 18 -12" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

/** Gradient riêng của hình siêu âm */
export const UsDefs = () => (
  <linearGradient id="g4-us" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stopColor="#7A8BA0" />
    <stop offset="0.45" stopColor="#4B5A6E" />
    <stop offset="1" stopColor="#27313E" />
  </linearGradient>
);
