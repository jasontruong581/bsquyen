/* Hai vi-rút đeo kính đen: HBV (viêm gan B, hình cầu tím có gai ngắn) và HPV (khối nhiều mặt lục lam, như khối 20 mặt).
   Gốc tọa độ cục bộ ở giữa hai bàn chân (đứng trên mặt tường), thân tròn tâm (0, -98).
   Tông: chỉ lén lút/lì lợm khi nói cơ chế; trong hai cảnh [N] và ±2 giây quanh "ung thư" chỉ im lặng, miệng thẳng, không cười (xem index.tsx). */
import {NAVY, FONT} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {E, S, W} from './timeline';
import {SURF} from './World';

const smooth = (p: number) => p * p * (3 - 2 * p);

export type VMood = 'sneak' | 'frozen' | 'scared' | 'quiet';

const Glasses = ({y = -4, lift = 0}: {y?: number; lift?: number}) => (
  <g transform={`translate(0 ${y - lift})`}>
    <path d="M -40 -2 L -52 -8 M 40 -2 L 52 -8" stroke="#1B1F3B" strokeWidth={5} strokeLinecap="round" />
    <path d="M -6 -2 H 6" stroke="#1B1F3B" strokeWidth={6} strokeLinecap="round" />
    <rect x={-42} y={-14} width={37} height={27} rx={11} fill="#1B1F3B" stroke={NAVY} strokeWidth={3} />
    <rect x={5} y={-14} width={37} height={27} rx={11} fill="#1B1F3B" stroke={NAVY} strokeWidth={3} />
    <path d="M -36 -7 L -25 -9" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
    <path d="M 11 -7 L 22 -9" stroke="#fff" strokeOpacity={0.8} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Mouth = ({mood, t}: {mood: VMood; t: number}) => {
  if (mood === 'scared') {
    return (
      <g>
        <ellipse cx={0} cy={26} rx={10} ry={12 + 2 * Math.sin(t * 30)} fill="#2B1B3F" stroke={NAVY} strokeWidth={4} />
        <path d="M 46 -22 c 7 10 9 16 0 18 c -9 -2 -7 -8 0 -18 Z" fill="#9FD8FF" stroke={NAVY} strokeWidth={3} />
      </g>
    );
  }
  // lén lút: môi mím, hơi lệch; không có nụ cười
  return <path d={mood === 'quiet' ? 'M -11 26 H 11' : 'M -13 27 L -2 25 L 13 28'} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
};

type Common = {x: number; y?: number; t: number; mood: VMood; alpha?: number; flip?: boolean; scale?: number; phase?: number; moving?: boolean; tag?: boolean; lean?: number};

/** Chân ngắn và tay nhỏ đung đưa, dùng chung */
const Limbs = ({phase, moving, flip}: {phase: number; moving: boolean; flip: boolean}) => {
  const a = moving ? 12 * Math.sin(phase) : 0;
  const b = moving ? 12 * Math.sin(phase + Math.PI) : 0;
  return (
    <g>
      {[
        {k: -1, a},
        {k: 1, a: b},
      ].map(({k, a: lift}) => (
        <g key={k} transform={`translate(${k * 26} ${-Math.max(0, lift)})`}>
          <rect x={-8} y={-44} width={16} height={34} rx={8} fill="#2B2147" stroke={NAVY} strokeWidth={4} />
          <path d="M -18 -8 Q -18 -22 -4 -22 H 10 Q 24 -22 24 -8 Q 24 2 14 2 H -12 Q -18 2 -18 -8 Z" fill="#3B2F66" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
};

const Tag = ({text, wide, flip}: {text: string; wide?: boolean; flip?: boolean}) => (
  <g transform={`translate(58 -168) scale(${flip ? -1 : 1} 1)`}>
    <rect x={wide ? -44 : -24} y={-24} width={wide ? 88 : 48} height={46} rx={14} fill="#fff" stroke={NAVY} strokeWidth={5} />
    <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={wide ? 28 : 32} fill={NAVY}>
      {text}
    </text>
  </g>
);

export const Hbv = ({x, y = SURF, t, mood, alpha = 1, flip = false, scale = 1, phase = 0, moving = false, tag = true, lean = 0}: Common) => {
  const bump = Array.from({length: 14}, (_, i) => (i * 360) / 14);
  const hop = moving ? Math.abs(Math.sin(phase)) * 8 : 2.5 * Math.sin(t * 2.4);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={alpha}>
      <ellipse cx={0} cy={4} rx={70} ry={11} fill={NAVY} opacity={0.18} />
      <Limbs phase={phase} moving={moving} flip={flip} />
      <g transform={`translate(0 ${-hop}) rotate(${lean} 0 -40)`}>
        <g transform="translate(0 -98)">
          {bump.map((a, i) => (
            <g key={i} transform={`rotate(${a})`}>
              <circle cx={0} cy={-66} r={10} fill="#C9B3F3" stroke={NAVY} strokeWidth={4.5} />
            </g>
          ))}
          <circle r={62} fill="url(#v6-hbv)" stroke={NAVY} strokeWidth={6.5} />
          <path d="M -40 -30 C -32 -46 -14 -52 4 -50" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={7} strokeLinecap="round" />
          <path d="M 44 20 C 38 38 22 50 4 54" fill="none" stroke="#4A2F8A" strokeOpacity={0.4} strokeWidth={8} strokeLinecap="round" />
          <Glasses lift={mood === 'scared' ? 6 : 0} />
          <Mouth mood={mood} t={t} />
        </g>
        {tag && <Tag text="B" flip={flip} />}
      </g>
    </g>
  );
};

const HEX = Array.from({length: 6}, (_, i) => {
  const a = ((30 + 60 * i) * Math.PI) / 180;
  return [70 * Math.cos(a), 70 * Math.sin(a)] as [number, number];
});
const FACETS = ['#2BA39B', '#5FCFC4', '#1F8A86', '#3DB9AE', '#1F8A86', '#5FCFC4'];

export const Hpv = ({x, y = SURF, t, mood, alpha = 1, flip = false, scale = 1, phase = 0, moving = false, tag = true, lean = 0}: Common) => {
  const hop = moving ? Math.abs(Math.sin(phase)) * 8 : 2.5 * Math.sin(t * 2.4 + 1.6);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={alpha}>
      <ellipse cx={0} cy={4} rx={70} ry={11} fill={NAVY} opacity={0.18} />
      <Limbs phase={phase} moving={moving} flip={flip} />
      <g transform={`translate(0 ${-hop}) rotate(${lean} 0 -40)`}>
        <g transform="translate(0 -98)">
          {/* khối nhiều mặt: sáu tam giác chia sẻ tâm, đỉnh có núm */}
          {HEX.map((p, i) => {
            const q = HEX[(i + 1) % 6];
            return <path key={i} d={`M 0 0 L ${p[0]} ${p[1]} L ${q[0]} ${q[1]} Z`} fill={FACETS[i]} stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />;
          })}
          <path d={`M ${HEX.map((p) => `${p[0]} ${p[1]}`).join(' L ')} Z`} fill="none" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
          {HEX.map((p, i) => (
            <circle key={i} cx={p[0] * 1.12} cy={p[1] * 1.12} r={9} fill="#A8F0E6" stroke={NAVY} strokeWidth={4.5} />
          ))}
          <path d="M -38 -34 L -10 -52" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
          <Glasses lift={mood === 'scared' ? 6 : 0} />
          <Mouth mood={mood} t={t} />
        </g>
        {tag && <Tag text="HPV" wide flip={flip} />}
      </g>
    </g>
  );
};

/* ---------- đường đi: lén tới cổng (cảnh 2), đứng khựng (cảnh 3), bỏ chạy ngay sau "nhận ra" ---------- */
export const SNEAK_FROM = S(2) + 0.2;
export const SNEAK_TO = E(2) - 0.4;
export const FREEZE_AT = W(3, 'tờ'); // thấy tờ truy nã là khựng lại
export const FLEE_AT = W(3, 'nhận') - 0.1;
export const FLEE_END = S(4) + 0.5;
export const VIRUS_SPOT = {hbv: 835, hpv: 965};

export type VPose = {x: number; mood: VMood; moving: boolean; flip: boolean; phase: number; lean: number; alpha: number};
export const virusPose = (t: number, which: 'hbv' | 'hpv'): VPose => {
  const spot = VIRUS_SPOT[which];
  const from = which === 'hbv' ? 1250 : 1370;
  const lag = which === 'hbv' ? 0 : 0.25;
  const pIn = smooth(P(t, SNEAK_FROM + lag, SNEAK_TO - SNEAK_FROM - lag));
  const pOut = P(t, FLEE_AT + (which === 'hpv' ? 0.12 : 0), 1.3);
  let x = lerp(from, spot, pIn);
  if (t >= FLEE_AT) x = lerp(spot, 1800, pOut * pOut);
  const moving = (t > SNEAK_FROM && pIn < 0.999) || (t >= FLEE_AT && pOut < 1);
  const fleeing = t >= FLEE_AT + (which === 'hpv' ? 0.12 : 0);
  const sneakPhase = t * 7.5 + (which === 'hpv' ? 1 : 0);
  const mood: VMood = fleeing ? 'scared' : 'sneak';
  const alpha = smooth(P(t, 1.0, 0.4)) * (1 - smooth(P(t, FLEE_END - 0.5, 0.5)));
  return {x, mood, moving, flip: fleeing, phase: fleeing ? t * 18 : sneakPhase, lean: fleeing ? 10 : moving ? -7 : 0, alpha: t < SNEAK_FROM ? 0 : alpha};
};

/** gradient của HBV */
export const VirusDefs = () => (
  <radialGradient id="v6-hbv" cx="0.35" cy="0.3" r="0.85">
    <stop offset="0" stopColor="#B79CF0" />
    <stop offset="0.6" stopColor="#8160D4" />
    <stop offset="1" stopColor="#5E3FA8" />
  </radialGradient>
);
