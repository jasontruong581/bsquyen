/* Vật kể chuyện trên đường của V010: cổng "chẩn đoán", ba biểu tượng bớt đau / bớt khó chịu / được nâng đỡ, hai chùm sáng (khối u là điểm trừu tượng, không vẽ khối u),
   hạt sáng chảy từ làn cam sang làn xanh, cổng "~8 tuần", ngôi nhà sáng đèn + túi bác sĩ, ba biển hiệu ven đường, cổng cuối làn xanh. Mỗi hàm trả về các "biển" để xếp theo độ sâu. */
import type {ReactNode} from 'react';
import {FONT, NAVY} from '../../src/common/overlays';
import {Den} from './Den';
import {BLUE_END, HOUSE, SIGNS, T, signZ, bend, clamp01, lerpPos, mood, ramp, smooth, type Cam, type LanternState} from './Motion';
import {BLUE, ORANGE, sprite, type Sprite} from './World';
import {S} from './timeline';

/** Nảy ra từ 0 tới 1 (hơi vượt rồi về), bắt đầu tại mốc at */
export const pop = (t: number, at: number, d = 0.5) => {
  const p = clamp01((t - at) / d);
  if (p <= 0) return 0;
  return 1 - Math.pow(1 - p, 3) + 0.14 * Math.sin(p * Math.PI);
};
const fade = (t: number, a: number, d: number) => 1 - ramp(t, a, d);

/* ---------- cổng "chẩn đoán" ---------- */
const CREAM = '#FFF3DC';
const Arch = () => (
  <g>
    <ellipse cx={0} cy={6} rx={330} ry={26} fill="#3A2F6E" opacity={0.2} />
    {[-276, 276].map((x) => (
      <rect key={x} x={x - 15} y={-350} width={30} height={352} rx={10} fill={CREAM} stroke={NAVY} strokeWidth={7} />
    ))}
    <rect x={-322} y={-402} width={644} height={92} rx={30} fill={CREAM} stroke={NAVY} strokeWidth={8} />
    <text x={0} y={-337} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={58} fill={NAVY} letterSpacing={3}>
      CHẨN ĐOÁN
    </text>
    {[-250, -166, -83, 0, 83, 166, 250].map((x, i) => (
      <circle key={i} cx={x} cy={-300} r={7} fill="#FFC93C" stroke={NAVY} strokeWidth={3} />
    ))}
    {/* hai bảng treo: làn xanh và làn cam */}
    {[-120, 120].map((x) => (
      <g key={x}>
        <path d={`M ${x - 62} -310 V -270 M ${x + 62} -310 V -270`} stroke={NAVY} strokeWidth={5} />
      </g>
    ))}
    <rect x={-222} y={-270} width={204} height={84} rx={22} fill="#59A8F3" stroke={NAVY} strokeWidth={7} />
    <text x={-120} y={-212} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#fff" stroke={NAVY} strokeWidth={9} paintOrder="stroke" letterSpacing={1}>
      ĐIỀU TRỊ
    </text>
    <rect x={18} y={-270} width={204} height={102} rx={22} fill="#FFA84A" stroke={NAVY} strokeWidth={7} />
    <text x={120} y={-228} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff" stroke={NAVY} strokeWidth={8} paintOrder="stroke">
      CHĂM SÓC
    </text>
    <text x={120} y={-188} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff" stroke={NAVY} strokeWidth={8} paintOrder="stroke">
      GIẢM NHẸ
    </text>
  </g>
);

/* ---------- biểu tượng trong huy hiệu tròn ---------- */
export type Glyph = 'pain' | 'breath' | 'support' | 'target' | 'person' | 'bowl' | 'battery';
const GlyphArt = ({kind, t}: {kind: Glyph; t: number}) => {
  const w = 3 * Math.sin(t * 3);
  switch (kind) {
    case 'pain':
      return <path d="M -42 4 L -34 -20 L -25 18 L -16 -16 L -8 10 C 2 2 8 -4 18 0 S 32 8 44 0" fill="none" stroke="url(#g10-pain)" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />;
    case 'breath':
      return (
        <g fill="none" stroke="#3FB7A8" strokeWidth={8} strokeLinecap="round">
          <path d={`M -40 -20 H 6 C ${30 + w} -20 ${30 + w} -44 10 -40`} />
          <path d={`M -40 2 H 24 C ${52 + w} 2 ${52 + w} -26 28 -22`} />
          <path d={`M -40 24 H -2 C ${20 + w} 24 ${20 + w} 4 -2 8`} />
        </g>
      );
    case 'support':
      return (
        <g>
          <path d="M -40 4 Q 0 46 40 4" fill="none" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
          <path d="M -40 4 Q 0 46 40 4" fill="none" stroke="#FFC93C" strokeWidth={3.5} strokeLinecap="round" />
          <path d={`M 0 ${10 + w * 0.3} C -30 -10 -24 -34 -8 -30 C -2 -29 0 -24 0 -20 C 0 -24 2 -29 8 -30 C 24 -34 30 -10 0 ${10 + w * 0.3} Z`} fill="#FF7C8F" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    case 'target':
      return (
        <g>
          <circle r={44} fill="#fff" stroke={NAVY} strokeWidth={6} />
          <circle r={28} fill="#9CC7F7" stroke={NAVY} strokeWidth={5} />
          <circle r={12} fill="#4A7BD0" stroke={NAVY} strokeWidth={4} />
          <path d="M -56 0 H -36 M 36 0 H 56 M 0 -56 V -36 M 0 36 V 56" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'person':
      return (
        <g>
          <circle cx={0} cy={-26} r={21} fill="#FFE0C2" stroke={NAVY} strokeWidth={5.5} />
          <path d="M -38 30 C -38 2 -20 -4 0 -4 C 20 -4 38 2 38 30 Z" fill="#FFB067" stroke={NAVY} strokeWidth={5.5} strokeLinejoin="round" />
          <path d={`M 0 22 C -16 10 -12 -2 -4 0 C -1 0 0 3 0 5 C 0 3 1 0 4 0 C 12 -2 16 10 0 22 Z`} fill="#FF7C8F" stroke={NAVY} strokeWidth={3.5} strokeLinejoin="round" transform={`scale(${1 + 0.06 * Math.sin(t * 3)})`} />
        </g>
      );
    case 'bowl':
      return (
        <g>
          <path d="M -40 -2 H 40 C 40 28 20 42 0 42 C -20 42 -40 28 -40 -2 Z" fill="#FFE9C9" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M -18 -16 C -26 -26 -10 -30 -18 -42 M 2 -16 C -6 -26 10 -30 2 -42 M 22 -16 C 14 -26 30 -30 22 -42`} fill="none" stroke="#9AA6C9" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        </g>
      );
    case 'battery':
      return (
        <g>
          <rect x={-42} y={-24} width={78} height={48} rx={12} fill="#fff" stroke={NAVY} strokeWidth={6} />
          <rect x={36} y={-10} width={10} height={20} rx={4} fill={NAVY} />
          <rect x={-35} y={-17} width={20} height={34} rx={6} fill="#FF7D5A" opacity={0.65 + 0.35 * Math.sin(t * 3)} />
        </g>
      );
  }
};

export const Badge = ({kind, t, r = 64}: {kind: Glyph; t: number; r?: number}) => (
  <g>
    <circle r={r + 34} fill="url(#g10-halo)" opacity={0.75} />
    <circle r={r} fill="rgba(255,255,255,0.97)" stroke={NAVY} strokeWidth={7} />
    <g transform={`scale(${r / 64})`}>
      <GlyphArt kind={kind} t={t} />
    </g>
  </g>
);

/* ---------- chùm sáng cho cảnh 3 ---------- */
const Beam = ({kind, glyph, t, at, badgeAt}: {kind: 'blue' | 'warm'; glyph: Glyph; t: number; at: number; badgeAt: number}) => {
  const g = ramp(t, at, 0.8);
  const bob = 8 * Math.sin(t * 2 + at);
  const top = 330;
  return (
    <g>
      <ellipse cx={0} cy={0} rx={130} ry={26} fill={kind === 'blue' ? '#8CC8FF' : '#FFD27A'} opacity={0.9 * g} />
      <path d={`M -34 0 L -20 ${-top} L 20 ${-top} L 34 0 Z`} fill="#fff" opacity={0.45 * g} transform={`scale(1 ${g})`} />
      <path d={`M -100 0 L -62 ${-top} L 62 ${-top} L 100 0 Z`} fill={kind === 'blue' ? 'url(#g10-beam-blue)' : 'url(#g10-beam-warm)'} opacity={g} transform={`scale(1 ${g})`} />
      <g transform={`translate(0 ${-top - 56 + bob}) scale(${pop(t, badgeAt)})`}>
        <Badge kind={glyph} t={t} r={74} />
      </g>
    </g>
  );
};

/* ---------- cổng "~8 tuần" ---------- */
export const WEEK_Z = 330;
const WeekGate = ({t}: {t: number}) => {
  const p = pop(t, T.week, 0.6);
  return (
    <g transform={`scale(${p * 1.6})`}>
      <ellipse cx={0} cy={6} rx={170} ry={18} fill="#3A2F6E" opacity={0.2} />
      {[-110, 110].map((x) => (
        <rect key={x} x={x - 12} y={-260} width={24} height={262} rx={8} fill={CREAM} stroke={NAVY} strokeWidth={6} />
      ))}
      <rect x={-150} y={-320} width={300} height={90} rx={26} fill="#FFA84A" stroke={NAVY} strokeWidth={7} />
      <text x={0} y={-255} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={58} fill="#fff" stroke={NAVY} strokeWidth={10} paintOrder="stroke">
        ~8 TUẦN
      </text>
    </g>
  );
};

/* ---------- vòng tia sáng bung ra ở đầu làn cam khi nói "bắt đầu sớm" ---------- */
const Burst = ({t}: {t: number}) => {
  const p = clamp01((t - T.early) / 1.4);
  if (p <= 0 || p >= 1) return null;
  const r = 40 + 190 * smooth(p);
  return (
    <g opacity={1 - p}>
      <ellipse cx={0} cy={-20} rx={r} ry={r * 0.32} fill="none" stroke="#FFE08E" strokeWidth={14} />
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <path key={i} d={`M ${Math.cos(a) * r * 0.5} ${-20 + Math.sin(a) * r * 0.16} L ${Math.cos(a) * r * 0.85} ${-20 + Math.sin(a) * r * 0.27}`} stroke="#FFD27A" strokeWidth={9} strokeLinecap="round" />;
      })}
    </g>
  );
};

/* ---------- ngôi nhà sáng đèn ---------- */
export const WINDOW = {x: -90, y: -130};
const House = ({t, inner}: {t: number; inner: ReactNode}) => {
  const family = ramp(t, T.family, 0.6);
  const puff = (i: number) => {
    const k = (t * 0.35 + i / 3) % 1;
    return <circle key={i} cx={-130 + 28 * k} cy={-408 - 120 * k} r={14 + 22 * k} fill="#fff" opacity={0.6 * Math.sin(Math.PI * k)} />;
  };
  return (
    <g>
      <ellipse cx={0} cy={6} rx={280} ry={26} fill="#3A2F6E" opacity={0.22} />
      <circle cx={-90} cy={-130} r={260} fill="url(#g10-lamp)" opacity={0.65} />
      <rect x={-150} y={-440} width={44} height={110} rx={8} fill="#E9805A" stroke={NAVY} strokeWidth={6} />
      {[0, 1, 2].map(puff)}
      <rect x={-200} y={-250} width={400} height={250} rx={16} fill={CREAM} stroke={NAVY} strokeWidth={7} />
      <path d="M -250 -244 L 0 -410 L 250 -244 Z" fill="#E9805A" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -190 -258 L 0 -384" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.3} />
      {/* cửa sổ: ánh đèn ấm, Đèn bay vào ở trong, bóng gia đình */}
      <rect x={-150} y={-190} width={120} height={120} rx={14} fill="#FFE29A" />
      <clipPath id="g10-win">
        <rect x={-150} y={-190} width={120} height={120} rx={14} />
      </clipPath>
      <g clipPath="url(#g10-win)">
        <circle cx={-90} cy={-130} r={70} fill="url(#g10-halo)" />
        <path d="M -90 -190 V -70 M -150 -130 H -30" stroke={NAVY} strokeWidth={5} opacity={0.55} />
        {family > 0.01 && (
          <g opacity={family} fill="#8A6AA6" transform={`translate(0 ${(1 - family) * 14})`}>
            <circle cx={-116} cy={-122} r={12} />
            <path d="M -134 -70 C -134 -98 -126 -106 -116 -106 C -106 -106 -98 -98 -98 -70 Z" />
            <circle cx={-72} cy={-124} r={12} />
            <path d="M -90 -70 C -90 -98 -82 -108 -72 -108 C -62 -108 -54 -98 -54 -70 Z" />
            <circle cx={-94} cy={-100} r={8} />
            <path d="M -104 -70 C -104 -88 -100 -92 -94 -92 C -88 -92 -84 -88 -84 -70 Z" />
          </g>
        )}
        {inner}
      </g>
      <rect x={-150} y={-190} width={120} height={120} rx={14} fill="none" stroke={NAVY} strokeWidth={7} />
      <rect x={50} y={-150} width={84} height={150} rx={12} fill="#C98A63" stroke={NAVY} strokeWidth={7} />
      <circle cx={112} cy={-72} r={6} fill="#FFC93C" stroke={NAVY} strokeWidth={3} />
      <path d="M 60 -150 V 0" stroke="#fff" strokeWidth={4} opacity={0.25} />
      <circle cx={92} cy={-176} r={9} fill="#FFEFB0" stroke={NAVY} strokeWidth={4} />
    </g>
  );
};

const Bag = () => (
  <g>
    <ellipse cx={0} cy={3} rx={44} ry={9} fill="#3A2F6E" opacity={0.22} />
    <path d="M -18 -46 C -18 -72 18 -72 18 -46" fill="none" stroke={NAVY} strokeWidth={8} strokeLinecap="round" />
    <rect x={-44} y={-50} width={88} height={52} rx={12} fill="#3FB7A8" stroke={NAVY} strokeWidth={6} />
    <rect x={-6} y={-42} width={12} height={36} rx={3} fill="#fff" />
    <rect x={-18} y={-30} width={36} height={12} rx={3} fill="#fff" />
  </g>
);

/* ---------- biển hiệu ven đường ---------- */
const SignBoard = ({kind, t, at}: {kind: 'pain' | 'meal' | 'family'; t: number; at: number}) => {
  const p = pop(t, at, 0.55) * 1.35;
  const glyph: Glyph = kind === 'pain' ? 'pain' : kind === 'meal' ? 'bowl' : 'battery';
  const text = kind === 'pain' ? 'ĐAU · KHÓ THỞ' : kind === 'meal' ? 'ĂN NGỦ KÉM' : 'QUÁ TẢI';
  return (
    <g transform={`scale(${p})`}>
      <ellipse cx={0} cy={5} rx={60} ry={12} fill="#3A2F6E" opacity={0.2} />
      <rect x={-7} y={-230} width={14} height={232} rx={5} fill="#7C7FBA" stroke={NAVY} strokeWidth={4} />
      <circle cy={-330} r={170} fill="url(#g10-lamp)" opacity={0.5} />
      <rect x={-130} y={-440} width={260} height={230} rx={28} fill={CREAM} stroke={NAVY} strokeWidth={8} />
      <g transform="translate(0 -350) scale(1.05)">
        <GlyphArt kind={glyph} t={t} />
      </g>
      <text x={0} y={-236} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={29} fill={NAVY}>
        {text}
      </text>
    </g>
  );
};

/* ---------- cổng ánh sáng cuối làn xanh ---------- */
const BlueGate = () => (
  <g>
    <ellipse cx={0} cy={5} rx={140} ry={20} fill="#8CC8FF" opacity={0.7} />
    {[-86, 86].map((x) => (
      <g key={x}>
        <rect x={x - 9} y={-190} width={18} height={192} rx={7} fill="#DCEEFF" stroke={NAVY} strokeWidth={5} />
        <circle cx={x} cy={-204} r={16} fill="#fff" stroke={NAVY} strokeWidth={5} />
      </g>
    ))}
    <path d="M -86 -190 Q 0 -250 86 -190" fill="none" stroke="#9CD0FF" strokeWidth={10} strokeLinecap="round" opacity={0.8} />
  </g>
);

/** Toàn bộ vật kể chuyện của một khung hình */
export const props = (cam: Cam, t: number, lant: LanternState): Sprite[] => {
  const out: Sprite[] = [];
  const push = (s: Sprite | null) => s && out.push(s);

  push(sprite(cam, 0, 0, 0, 'arch', <Arch />));
  push(sprite(cam, bend(BLUE_END) + BLUE.c, 0, BLUE_END, 'bluegate', <BlueGate />));

  // s3: hai chùm sáng, trái xanh (điều trị) -> điểm tượng trưng; phải cam (chăm sóc) -> người
  const beamFade = fade(t, S(4) - 0.2, 0.8);
  if (t > T.beams - 0.1 && beamFade > 0.01) {
    push(sprite(cam, bend(520) + BLUE.c, 0, 520, 'beam-blue', <g opacity={beamFade}><Beam kind="blue" glyph="target" t={t} at={T.beams} badgeAt={T.beams + 0.5} /></g>));
    push(sprite(cam, bend(520) + ORANGE.c, 0, 520, 'beam-warm', <g opacity={beamFade}><Beam kind="warm" glyph="person" t={t} at={T.beamCare} badgeAt={T.beamCare + 1.2} /></g>));
  }

  // s4: hạt sáng chảy từ làn cam sang làn xanh
  const flowOn = ramp(t, T.flow, 0.6) * fade(t, T.back0 - 0.3, 0.6);
  if (flowOn > 0.01) {
    for (let i = 0; i < 16; i++) {
      const p = ((t - T.flow) * 0.5 + i * 0.137) % 1;
      const e = smooth(p);
      const z = cam.z + 250 + i * 34;
      const x = bend(z) + ORANGE.c + (BLUE.c - ORANGE.c) * e;
      const y = 40 + 150 * Math.sin(Math.PI * e);
      const a = Math.sin(Math.PI * p) * flowOn;
      push(
        sprite(
          cam,
          x,
          y,
          z,
          `flow${i}`,
          <g opacity={a}>
            <circle r={70} fill="url(#g10-lamp)" />
            <circle r={19} fill="#FFF3C4" stroke="#FFB44D" strokeWidth={5} />
          </g>,
        ),
      );
    }
  }

  // s5: tia sáng ở cột mốc, cổng ~8 tuần
  if (t > T.early) push(sprite(cam, ORANGE.c, 0, 0, 'burst', <Burst t={t} />));
  if (t > T.week - 0.05) push(sprite(cam, bend(WEEK_Z) + ORANGE.c, 0, WEEK_Z, 'week', <WeekGate t={t} />));

  // s8: nhà sáng đèn, túi bác sĩ
  const inside = lant.inside > 0.5;
  const houseX = bend(HOUSE.z) + HOUSE.x;
  push(
    sprite(
      cam,
      houseX,
      0,
      HOUSE.z,
      'house',
      <House
        t={t}
        inner={
          inside ? (
            <g transform={`translate(${WINDOW.x} ${WINDOW.y}) scale(${0.8 * lant.scale})`}>
              <Den t={t} mood={mood(t)} look={[0.3, 0]} glow={0.6} />
            </g>
          ) : null
        }
      />,
    ),
  );
  if (t > T.bag - 0.1) {
    const k = ramp(t, T.bag, 1.5);
    const bz = lerpPos(HOUSE.z - 200, HOUSE.z - 22, k);
    const bx = lerpPos(bend(HOUSE.z - 200) + ORANGE.c, houseX + 92, k);
    const hop = 36 * Math.abs(Math.sin(k * Math.PI * 4)) * (k < 1 ? 1 : 0);
    const bagFade = fade(t, S(9) + 1.8, 0.8);
    push(sprite(cam, bx, hop, bz, 'bag', <g opacity={bagFade * pop(t, T.bag, 0.3)}><Bag /></g>, 1.1));
  }

  // s9: ba biển hiệu
  SIGNS.forEach((sg, i) => {
    const z = signZ(i);
    if (t > T.sign[i] - 0.1) push(sprite(cam, bend(z) + sg.x, 0, z, `sign${i}`, <g opacity={fade(t, S(10) + 0.2, 0.9)}><SignBoard kind={sg.kind} t={t} at={T.sign[i]} /></g>));
  });

  // Đèn và bóng của Đèn trên mặt đường
  push(sprite(cam, lant.x, 0, lant.z, 'den-shadow', <ellipse cx={0} cy={0} rx={70 * lant.scale} ry={15 * lant.scale} fill="#3A2F6E" opacity={0.28} />));
  if (!inside) {
    push(
      sprite(
        cam,
        lant.x,
        lant.y,
        lant.z,
        'den',
        <g transform={`rotate(${lant.tilt.toFixed(2)}) scale(${(0.8 * lant.scale).toFixed(3)})`}>
          <Den t={t} mood={mood(t)} look={t > T.ask - 0.5 && t < T.askEnd ? [0.0, 0.1] : [0.1, -0.3]} />
        </g>,
      ),
    );
  }
  return out;
};

