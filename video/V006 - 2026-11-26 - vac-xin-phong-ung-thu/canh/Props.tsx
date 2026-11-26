/* Đạo cụ của V006 (đều gắn vào cùng một cảnh, không phải thẻ): khiên cam có ống tiêm (kèm dải chữ), huy hiệu cơ quan bên trong
   (gan, em bé, cổ tử cung, nữ, nam), kính lúp tầm soát. Tọa độ thế giới (xem World.tsx). */
import {NAVY, FONT} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {S, W, E} from './timeline';
import {MEDAL_X, MEDAL_Y} from './World';

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* =============== Khiên ===============
   Mốc [t, tâm x, tâm y, hệ số, độ đặc]: cảnh 1 to giữa khung, cảnh 2 đứng chắn trước cổng, cảnh 3 thu nhỏ rồi mờ đi,
   cảnh 6 bao quanh em bé, cảnh 8 "mở rộng" che nữ và nam, cảnh 9 phủ gần hết, cảnh 10 gắn lên tháp. */
type SK = [number, number, number, number, number];
const SHIELD_KEYS: SK[] = [
  [0, 610, 700, 1.0, 1],
  [S(2) - 0.15, 610, 700, 1.0, 1],
  [S(2) + 1.0, 600, 545, 0.62, 1],
  [S(3) + 0.5, 600, 545, 0.62, 1],
  [S(3) + 1.4, 560, 470, 0.3, 0],
  [S(6) + 1.2, 540, MEDAL_Y + 12, 0.4, 0],
  [S(6) + 1.9, 540, MEDAL_Y + 12, 0.62, 1],
  [S(7) + 0.3, 540, MEDAL_Y + 12, 0.62, 1],
  [S(7) + 1.0, 540, MEDAL_Y + 12, 0.62, 0],
  [W(8, 'Tuổi') - 0.2, 1195, MEDAL_Y + 25, 0.45, 0],
  [W(8, 'Tuổi') + 0.4, 1195, MEDAL_Y + 25, 0.66, 1],
  [S(9) + 0.3, 1195, MEDAL_Y + 25, 0.66, 1],
  [S(9) + 1.3, 1160, MEDAL_Y + 25, 0.7, 1],
  [S(10), 1160, MEDAL_Y + 25, 0.7, 1],
  [S(10) + 2.2, 540, 405, 0.36, 1],
];
export const shieldAt = (t: number) => {
  const k = SHIELD_KEYS;
  if (t <= k[0][0]) return {x: k[0][1], y: k[0][2], s: k[0][3], a: k[0][4]};
  for (let i = 0; i < k.length - 1; i++) {
    if (t < k[i + 1][0]) {
      const p = smooth((t - k[i][0]) / (k[i + 1][0] - k[i][0]));
      return {x: lerp(k[i][1], k[i + 1][1], p), y: lerp(k[i][2], k[i + 1][2], p), s: lerp(k[i][3], k[i + 1][3], p), a: lerp(k[i][4], k[i + 1][4], p)};
    }
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], s: l[3], a: l[4]};
};

const SH = 'M -300 -330 Q 0 -404 300 -330 L 300 10 C 300 190 160 320 0 392 C -160 320 -300 190 -300 10 Z';
const RIBBON_W = 560;

type Ribbon = {lines: string[]; size: number; p: number; y: number};

const Syringe = ({t}: {t: number}) => {
  const push = 16 * Math.sin(t * 1.4);
  const drop = (t * 0.7) % 1;
  return (
    <g transform="translate(0 16) rotate(-24)">
      {/* tay đẩy và núm bấm */}
      <g transform={`translate(0 ${push})`}>
        <rect x={-13} y={-262} width={26} height={118} rx={8} fill="#CFD9E4" stroke={NAVY} strokeWidth={8} />
        <rect x={-72} y={-296} width={144} height={38} rx={19} fill="#fff" stroke={NAVY} strokeWidth={8} />
        <path d="M -52 -284 H -20" stroke="#BCD0E2" strokeWidth={7} strokeLinecap="round" />
      </g>
      {/* thân ống */}
      <rect x={-48} y={-156} width={96} height={282} rx={18} fill="#EAF6FF" stroke={NAVY} strokeWidth={9} />
      <rect x={-42} y={-6 + 5 * Math.sin(t * 3)} width={84} height={124} rx={14} fill="#3FB6F0" />
      <path d={`M -42 ${-6 + 5 * Math.sin(t * 3)} q 10.5 -9 21 0 t 21 0 t 21 0 t 21 0`} fill="#7ED3FA" />
      {Array.from({length: 7}, (_, i) => (
        <path key={i} d={`M 48 ${-124 + i * 36} h ${i % 2 ? -16 : -26}`} stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
      ))}
      <path d="M -32 -130 V 96" stroke="#fff" strokeOpacity={0.8} strokeWidth={9} strokeLinecap="round" />
      <rect x={-86} y={-170} width={172} height={24} rx={12} fill="#fff" stroke={NAVY} strokeWidth={8} />
      {/* đầu nối và kim */}
      <path d="M -26 124 H 26 L 16 156 H -16 Z" fill="#9FB6CB" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 0 156 V 262" stroke={NAVY} strokeWidth={12} strokeLinecap="round" />
      <path d="M 0 160 V 252" stroke="#E4EEF7" strokeWidth={5} strokeLinecap="round" />
      <path d={`M 0 ${262 + drop * 40} c 8 12 12 18 0 22 c -12 -4 -8 -10 0 -22 Z`} fill="#7ED3FA" stroke={NAVY} strokeWidth={4} opacity={1 - drop} />
    </g>
  );
};

export const Shield = ({t, glow = 0, ribbon, gap = 0, magnifierGlint = 0}: {t: number; glow?: number; ribbon?: Ribbon; gap?: number; magnifierGlint?: number}) => {
  const k = shieldAt(t);
  if (k.a < 0.01) return null;
  const float = 7 * Math.sin(t * 1.6);
  const sweep = ((t * 0.45) % 1) * 1100 - 560;
  const rp = ribbon ? smooth(ribbon.p) : 0;
  // trong lòng cơ thể (cảnh 6-9) khiên là tấm kính mờ để vẫn thấy huy hiệu bên dưới
  const glass = smooth(P(t, S(6) + 1.2, 0.5)) * (1 - smooth(P(t, S(10) + 0.2, 0.8)));
  return (
    <g transform={`translate(${k.x} ${k.y + float * k.s}) scale(${k.s * (1 + 0.012 * Math.sin(t * 3.2))})`}>
      <g opacity={k.a * (1 - 0.45 * glass)}>
      <defs>
        <clipPath id="v6-shield-clip">
          <path d={SH} />
        </clipPath>
        <linearGradient id="v6-sh-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE0A6" />
          <stop offset="1" stopColor="#F29A2E" />
        </linearGradient>
        <linearGradient id="v6-sh-body" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FFBE6B" />
          <stop offset="0.5" stopColor="#F77C25" />
          <stop offset="1" stopColor="#D9540F" />
        </linearGradient>
        {gap > 0.01 && (
          <mask id="v6-slit" maskUnits="userSpaceOnUse" x={-400} y={-450} width={800} height={900}>
            <rect x={-400} y={-450} width={800} height={900} fill="#fff" />
            <path d={`M ${196 - gap * 24} -130 L ${214 + gap * 6} -76 L ${190 - gap * 6} -30 L ${212 + gap * 12} 26 L ${194 - gap * 9} 84 L ${176 + gap * 24} 84 L ${196 - gap * 15} 26 L ${176 + gap * 6} -30 L ${198 - gap * 6} -76 Z`} fill="#000" />
          </mask>
        )}
      </defs>
      {/* quầng sáng ấm; sáng thêm khi `glow` > 0 (khiên "sáng lên" quanh em bé) */}
      <ellipse cx={0} cy={10} rx={430 + glow * 70} ry={470 + glow * 70} fill="url(#v6-glow)" opacity={0.55 + 0.4 * glow} />
      <g mask={gap > 0.01 ? 'url(#v6-slit)' : undefined}>
        <path d={SH} fill={NAVY} opacity={0.2} transform="translate(12 22)" />
        <path d={SH} fill="url(#v6-sh-rim)" stroke={NAVY} strokeWidth={13} strokeLinejoin="round" />
        <g transform="translate(0 12) scale(0.86)">
          <path d={SH} fill="url(#v6-sh-body)" stroke={NAVY} strokeWidth={10} strokeLinejoin="round" />
        </g>
        {/* đinh tán dọc viền */}
        {[
          [-262, -300],
          [0, -352],
          [262, -300],
          [-276, 20],
          [276, 20],
          [-200, 180],
          [200, 180],
        ].map(([rx, ry], i) => (
          <circle key={i} cx={rx} cy={ry} r={11} fill="#FFE9BE" stroke={NAVY} strokeWidth={5} />
        ))}
        <g clipPath="url(#v6-shield-clip)">
          <path d="M -300 -330 Q 0 -404 300 -330 L 300 -200 Q 0 -270 -300 -200 Z" fill="#fff" opacity={0.22} />
          <path d="M -250 -60 C -250 120 -150 260 0 330" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" />
          <g transform={`translate(${sweep} 0) rotate(18)`}>
            <rect x={-30} y={-600} width={64} height={1200} fill="#fff" opacity={0.3} />
            <rect x={44} y={-600} width={20} height={1200} fill="#fff" opacity={0.22} />
          </g>
        </g>
        <g opacity={1 - 0.55 * glass}>
          <Syringe t={t} />
        </g>
      </g>
      </g>
      {ribbon && rp > 0.01 && (
        <g transform={`translate(0 ${ribbon.y + (1 - rp) * 30}) scale(${0.7 + 0.3 * rp})`} opacity={rp * Math.max(k.a, 0.0)}>
          <path d={`M ${-RIBBON_W / 2 - 36} -50 L ${-RIBBON_W / 2 - 6} -50 V 130 L ${-RIBBON_W / 2 - 36} 130 L ${-RIBBON_W / 2 - 6} 80 Z`} fill="#D9A441" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
          <path d={`M ${RIBBON_W / 2 + 36} -50 L ${RIBBON_W / 2 + 6} -50 V 130 L ${RIBBON_W / 2 + 36} 130 L ${RIBBON_W / 2 + 6} 80 Z`} fill="#D9A441" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-RIBBON_W / 2} y={-62} width={RIBBON_W} height={ribbon.lines.length * ribbon.size * 1.12 + 40} rx={22} fill="#FFF6E5" stroke={NAVY} strokeWidth={9} />
          {ribbon.lines.map((l, i) => (
            <text key={i} x={0} y={-62 + 26 + ribbon.size * 0.86 + i * ribbon.size * 1.12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={ribbon.size} fill={NAVY}>
              {l}
            </text>
          ))}
        </g>
      )}
    </g>
  );
};

/* =============== Huy hiệu cơ quan bên trong =============== */
export type MedalKind = 'liver' | 'baby' | 'cervix' | 'female' | 'male';
const LIVER_D =
  'M -378 34 C -394 -118 -272 -246 -92 -256 C 84 -266 250 -226 346 -122 C 388 -72 394 -16 372 34 C 340 108 232 150 124 150 Q 84 148 56 128 Q 42 150 34 176 C 4 224 -68 252 -172 250 C -292 248 -364 152 -378 34 Z';

export const Icon = ({kind, t}: {kind: MedalKind; t: number}) => {
  switch (kind) {
    case 'liver':
      return (
        <g transform="translate(-4 -6) scale(0.2)">
          <path d={LIVER_D} fill="url(#v6-organ-liver)" stroke={NAVY} strokeWidth={28} strokeLinejoin="round" />
          <path d="M 44 -258 C 64 -150 22 -30 48 128" fill="none" stroke="#7E2B2B" strokeOpacity={0.55} strokeWidth={22} strokeLinecap="round" />
          <path d="M -300 -140 C -270 -200 -200 -226 -130 -232" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={34} strokeLinecap="round" />
          <path d="M -120 -20 C -110 -90 -96 -150 -80 -226 M 150 0 C 160 -70 170 -130 190 -200" fill="none" stroke="#8C2F2C" strokeOpacity={0.4} strokeWidth={22} strokeLinecap="round" />
          <path d="M -92 222 C -130 240 -140 290 -110 316 C -80 330 -52 300 -58 262 Z" fill="#6DBE86" stroke={NAVY} strokeWidth={22} strokeLinejoin="round" />
        </g>
      );
    case 'baby': {
      const z = 1 + 0.03 * Math.sin(t * 2);
      return (
        <g transform={`translate(0 6) scale(${z})`}>
          <path d="M -58 20 C -62 -4 -40 -10 0 -10 C 40 -10 62 -4 58 20 C 60 62 40 88 0 90 C -40 88 -60 62 -58 20 Z" fill="#BFE3FF" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -46 34 Q 0 52 46 34 M -42 58 Q 0 76 42 58" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={6} strokeLinecap="round" />
          <circle cx={0} cy={-34} r={50} fill="#FFDCC4" stroke={NAVY} strokeWidth={6} />
          <circle cx={-50} cy={-30} r={10} fill="#FFDCC4" stroke={NAVY} strokeWidth={5} />
          <circle cx={50} cy={-30} r={10} fill="#FFDCC4" stroke={NAVY} strokeWidth={5} />
          <path d="M -8 -82 C -8 -100 8 -104 14 -90 C 6 -92 2 -88 2 -80" fill="none" stroke="#A66B3C" strokeWidth={7} strokeLinecap="round" />
          <path d="M -30 -34 Q -20 -44 -10 -34 M 10 -34 Q 20 -44 30 -34" fill="none" stroke={NAVY} strokeWidth={5.5} strokeLinecap="round" />
          <circle cx={-32} cy={-14} r={9} fill="#FF9AA0" opacity={0.6} />
          <circle cx={32} cy={-14} r={9} fill="#FF9AA0" opacity={0.6} />
          <path d="M -9 -8 Q 0 0 9 -8" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
        </g>
      );
    }
    case 'cervix':
      return (
        <g transform="translate(0 4)">
          <path d="M -30 -50 C -72 -70 -92 -44 -86 -12" fill="none" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
          <path d="M -30 -50 C -72 -70 -92 -44 -86 -12" fill="none" stroke="#D99AAE" strokeWidth={8} strokeLinecap="round" />
          <path d="M 30 -50 C 72 -70 92 -44 86 -12" fill="none" stroke={NAVY} strokeWidth={15} strokeLinecap="round" />
          <path d="M 30 -50 C 72 -70 92 -44 86 -12" fill="none" stroke="#D99AAE" strokeWidth={8} strokeLinecap="round" />
          <circle cx={-86} cy={-2} r={13} fill="#E7A9BB" stroke={NAVY} strokeWidth={5} />
          <circle cx={86} cy={-2} r={13} fill="#E7A9BB" stroke={NAVY} strokeWidth={5} />
          <path d="M -34 -54 C -64 -54 -70 -14 -50 26 C -40 48 -22 58 -14 84 H 14 C 22 58 40 48 50 26 C 70 -14 64 -54 34 -54 C 18 -62 -18 -62 -34 -54 Z" fill="#CC8AA2" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" />
          <path d="M -18 -30 C -28 -4 -20 22 0 36 C 20 22 28 -4 18 -30 C 8 -38 -8 -38 -18 -30 Z" fill="#E7B3C4" />
          <path d="M -44 -30 C -52 -8 -46 14 -36 28" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={7} strokeLinecap="round" />
        </g>
      );
    case 'female':
      return (
        <g transform="translate(0 6)">
          <path d="M 0 -26 L -44 62 H 44 Z" fill="#E0508A" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" />
          <path d="M -18 -26 H 18 L 16 -4 H -16 Z" fill="#E0508A" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={0} cy={-54} r={24} fill="#FFDCC4" stroke={NAVY} strokeWidth={6} />
          <path d="M -24 -58 C -26 -86 24 -88 24 -58 C 14 -70 -12 -70 -24 -58 Z" fill="#6B3E26" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -20 62 V 82 M 20 62 V 82" stroke={NAVY} strokeWidth={9} strokeLinecap="round" />
          <path d="M -20 62 V 80 M 20 62 V 80" stroke="#FFDCC4" strokeWidth={4} strokeLinecap="round" />
        </g>
      );
    case 'male':
      return (
        <g transform="translate(0 6)">
          <rect x={-26} y={-26} width={52} height={64} rx={16} fill="#3F8FDB" stroke={NAVY} strokeWidth={6.5} />
          <path d="M -26 -14 H -50 V 34 M 26 -14 H 50 V 34" fill="none" stroke={NAVY} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M -26 -14 H -50 V 32 M 26 -14 H 50 V 32" fill="none" stroke="#3F8FDB" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={0} cy={-54} r={24} fill="#FFDCC4" stroke={NAVY} strokeWidth={6} />
          <path d="M -24 -58 C -22 -84 22 -84 24 -58 C 10 -66 -10 -66 -24 -58 Z" fill="#3E2A1E" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -14 38 V 84 M 14 38 V 84" stroke={NAVY} strokeWidth={13} strokeLinecap="round" />
          <path d="M -14 38 V 82 M 14 38 V 82" stroke="#2E6FB0" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
  }
};

/** nền huy hiệu theo loại */
const BG: Record<MedalKind, [string, string]> = {
  liver: ['#FFF2E6', '#FFD7BE'],
  baby: ['#F3FAFF', '#CFE8FB'],
  cervix: ['#FFF0F5', '#F6CFDD'],
  female: ['#FFF0F6', '#F9CADF'],
  male: ['#EEF6FF', '#C6DDF8'],
};

/** huy hiệu đang được nói tới phóng to lên (nữ và nam đứng cạnh nhau nên giữ cỡ nhỏ) */
const medalScale = (kind: MedalKind, lit: number) => (kind === 'female' || kind === 'male' ? 0.8 : 0.8 + 0.4 * clamp01((lit - 0.2) / 0.8));

export const Medal = ({kind, t, show, lit, tone = 0}: {kind: MedalKind; t: number; show: number; lit: number; tone?: number}) => {
  const x = MEDAL_X[kind];
  const pop = 1 + 0.025 * Math.sin(t * 2.2 + x);
  const s = (0.86 + 0.14 * smooth(clamp01(show))) * pop * (1 + 0.04 * lit);
  const bg = BG[kind];
  const op = (0.42 + 0.58 * lit) * (0.5 + 0.5 * clamp01(show * 1.5));
  return (
    <g transform={`translate(${x} ${MEDAL_Y + 3 * Math.sin(t * 1.5 + x)}) scale(${s * medalScale(kind, lit)})`} opacity={op}>
      <defs>
        <radialGradient id={`v6-bg-${kind}`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </radialGradient>
        <clipPath id={`v6-md-${kind}`}>
          <circle r={108} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={134} rx={110} ry={14} fill={NAVY} opacity={0.2} />
      <circle r={150} fill="url(#v6-glow)" opacity={0.5 * lit} />
      <circle r={128} fill="#FFE9BE" stroke={NAVY} strokeWidth={8} />
      <circle r={108} fill={`url(#v6-bg-${kind})`} stroke={NAVY} strokeWidth={6} />
      <g clipPath={`url(#v6-md-${kind})`}>
        <Icon kind={kind} t={t} />
        {tone > 0.01 && <rect x={-110} y={-110} width={220} height={220} fill="#3B2B52" opacity={0.34 * tone} />}
      </g>
      <path d="M -82 -50 C -70 -80 -40 -98 -8 -102" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

export const OrganDefs = () => (
  <linearGradient id="v6-organ-liver" x1="0.1" y1="0" x2="0.9" y2="1">
    <stop offset="0" stopColor="#F4A08A" />
    <stop offset="0.45" stopColor="#DD6C57" />
    <stop offset="1" stopColor="#A8433A" />
  </linearGradient>
);

/** độ hiện, độ sáng, độ trầm của từng huy hiệu theo thời gian */
export const medalState = (t: number, kind: MedalKind): {show: number; lit: number; tone: number} => {
  const win = (a: number, b: number, up = 0.5, down = 0.6) => smooth(P(t, a, up)) * (1 - smooth(P(t, b, down)));
  const base = 0.2; // sáng nền khi không được nói tới
  switch (kind) {
    case 'liver': {
      const show = smooth(P(t, S(4) + 0.1, 0.6));
      const on = win(S(4), E(4) + 0.5);
      const tone = smooth(P(t, W(4, 'viêm', 1) - 0.4, 0.8)) * (1 - smooth(P(t, E(4) + 0.4, 1.0)));
      return {show, lit: Math.max(base, on), tone};
    }
    case 'baby': {
      const show = smooth(P(t, S(6) + 0.3, 0.6));
      return {show, lit: Math.max(base, win(S(6) + 0.3, E(6) + 0.5)), tone: 0};
    }
    case 'cervix': {
      const show = smooth(P(t, S(7) + 0.1, 0.6));
      const tone = smooth(P(t, S(7) + 0.3, 0.8)) * (1 - smooth(P(t, E(7) + 0.4, 1.0)));
      return {show, lit: Math.max(base, win(S(7), E(7) + 0.5), 0.55 * smooth(P(t, S(9), 0.6))), tone};
    }
    case 'female': {
      const show = smooth(P(t, W(8, 'cả') - 0.7, 0.5));
      return {show, lit: Math.max(base, win(W(8, 'cả') - 0.3, E(9))), tone: 0};
    }
    case 'male': {
      const show = smooth(P(t, W(8, 'nam') - 0.4, 0.5));
      return {show, lit: Math.max(base, win(W(8, 'cả') - 0.3, E(9))), tone: 0};
    }
  }
};

/* =============== Kính lúp tầm soát (cảnh 9) soi qua kẽ hở của khiên =============== */
export const GAP_WORLD = {x: 1160 + 195 * 0.7, y: MEDAL_Y + 25 - 23 * 0.7};
const HEX = Array.from({length: 6}, (_, i) => {
  const a = ((30 + 60 * i) * Math.PI) / 180;
  return [70 * Math.cos(a), 70 * Math.sin(a)] as [number, number];
});
const OtherVirus = () => (
  <g>
    {HEX.map((p, i) => (
      <path key={i} d={`M 0 0 L ${p[0]} ${p[1]} L ${HEX[(i + 1) % 6][0]} ${HEX[(i + 1) % 6][1]} Z`} fill={['#F2A93B', '#FFC96B', '#D98A1E'][i % 3]} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
    ))}
    {HEX.map((p, i) => (
      <circle key={i} cx={p[0] * 1.12} cy={p[1] * 1.12} r={9} fill="#FFE3A8" stroke={NAVY} strokeWidth={4.5} />
    ))}
  </g>
);

/** Virus "týp khác" nằm sau kẽ hở của khiên (vẽ dưới khiên để lộ ra qua kẽ) */
export const GapVirus = ({t, a}: {t: number; a: number}) => {
  if (a < 0.01) return null;
  return (
    <g transform={`translate(${GAP_WORLD.x + 4} ${GAP_WORLD.y + 34 + 6 * Math.sin(t * 1.8)}) scale(0.4) rotate(${t * 8})`} opacity={a}>
      <OtherVirus />
    </g>
  );
};

export const Magnifier = ({t, a}: {t: number; a: number}) => {
  if (a < 0.01) return null;
  const bob = 6 * Math.sin(t * 2.1);
  const x = GAP_WORLD.x - 8;
  const y = GAP_WORLD.y - 74 + bob;
  const slide = 1 - a;
  return (
    <g transform={`translate(${x + slide * 160} ${y - slide * 90})`} opacity={a}>
      <defs>
        <clipPath id="v6-lens">
          <circle r={74} />
        </clipPath>
      </defs>
      <path d="M 50 50 L 128 128" stroke={NAVY} strokeWidth={30} strokeLinecap="round" />
      <path d="M 52 52 L 126 126" stroke="#8A5A3C" strokeWidth={17} strokeLinecap="round" />
      <circle r={74} fill="#D8EEFF" fillOpacity={0.5} />
      <g clipPath="url(#v6-lens)">
        <g transform={`translate(0 ${-bob + 6 * Math.sin(t * 1.8)}) rotate(${t * 8}) scale(0.82)`}>
          <OtherVirus />
        </g>
      </g>
      <circle r={74} fill="none" stroke={NAVY} strokeWidth={15} />
      <circle r={74} fill="none" stroke="#C9D6E2" strokeWidth={6} />
      <path d="M -50 -26 C -42 -48 -26 -58 -6 -62" fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

export {E};
