/* Các bảng hình toàn khung (toạ độ màn hình 1080x1920) của V003:
   Swarm (cảnh 2: bầy hạt hoá chất), Cell (cảnh 4-5: tế bào, sợi ADN, Thợ sửa, lịch), Icons (cảnh 7: ba cách hút),
   Finale (cảnh 8-10: lá phổi, thanh thời gian, thẻ tổng đài, màn kết). Mỗi bảng tự nhận độ đặc `a` do index.tsx tính. */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P, lerp} from '../../src/timeline';
import {Khoi, Lung, ThoSua} from './Characters';
import {E, S, SMILE_AT, W, WE, khoiMood} from './timeline';

const GREEN = '#2E9E6A';
const RUST = '#C2410C';
const GRAY_P = '#8D98A5';
const smooth = (p: number) => p * p * (3 - 2 * p);
const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 170}});
const rgb = (a: [number, number, number], b: [number, number, number], p: number) => `rgb(${Math.round(lerp(a[0], b[0], p))},${Math.round(lerp(a[1], b[1], p))},${Math.round(lerp(a[2], b[2], p))})`;

/* =============== Cảnh 2: bầy hạt hoá chất, 69 hạt đổi màu cam =============== */
const SW = {cx: 480, cy: 775, R: 290};

/** 69 vị trí cố định (sinh bằng bộ số giả ngẫu nhiên có hạt giống), cách nhau tối thiểu 40px, nằm trong vòng tròn */
const ORANGE_DOTS = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const out: {x: number; y: number}[] = [];
  let guard = 0;
  while (out.length < 69 && guard++ < 50000) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * (SW.R - 34);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (out.every((o) => Math.hypot(o.x - x, o.y - y) > 40)) out.push({x, y});
  }
  return out;
})();

export const Swarm = ({t, frame, a}: {t: number; frame: number; a: number}) => {
  if (a <= 0.001) return null;
  const grow = smooth(P(t, S(2) + 0.4, 1.1));
  const khoiIn = smooth(P(t, S(2) - 0.25, 0.4));
  const khoiOut = smooth(P(t, S(2) + 0.55, 1.0));
  const t69 = W(2, '69');
  const pill = sp(frame, t69, 10);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      <defs>
        <pattern id="v3-dotsA" width={28} height={28} patternUnits="userSpaceOnUse" patternTransform={`translate(${t * 7} ${-t * 5})`}>
          <circle cx={7} cy={7} r={5.4} fill="#6F7C8A" />
          <circle cx={21} cy={19} r={3.8} fill="#6F7C8A" />
        </pattern>
        <pattern id="v3-dotsB" width={41} height={41} patternUnits="userSpaceOnUse" patternTransform={`translate(${-t * 6} ${t * 8})`}>
          <circle cx={11} cy={29} r={4.6} fill="#8D98A5" />
          <circle cx={31} cy={10} r={3.4} fill="#8D98A5" />
        </pattern>
      </defs>
      <g transform={`translate(${SW.cx} ${SW.cy})`}>
        <circle r={SW.R * grow} fill="rgba(255,255,255,0.65)" />
        <circle r={SW.R * grow} fill="url(#v3-dotsA)" opacity={0.95} />
        <circle r={SW.R * grow} fill="url(#v3-dotsB)" opacity={0.9} />
        <circle r={SW.R * grow} fill="none" stroke={NAVY} strokeWidth={9} />
        {ORANGE_DOTS.map((d, i) => {
          const p = P(t, t69 + i * 0.011, 0.25);
          if (p <= 0) return null;
          const s = p < 1 ? 0.3 + 0.7 * p + 0.4 * Math.sin(p * Math.PI) : 1;
          return (
            <g key={i} transform={`translate(${d.x} ${d.y}) scale(${s})`}>
              <circle r={15} fill={ORANGE} opacity={0.25} />
              <circle r={10.5} fill={ORANGE} stroke="#d85a10" strokeWidth={3} />
            </g>
          );
        })}
      </g>
      <Khoi x={SW.cx} y={SW.cy - 10} scale={lerp(0.6, 2.1, khoiIn) * (1 - 0.85 * khoiOut)} opacity={khoiIn * (1 - khoiOut)} mood={khoiMood(t)} t={t} />
      <g transform={`translate(700 1000) scale(${pill})`}>
        <rect x={-150} y={-42} width={300} height={84} rx={42} fill={ORANGE} stroke="#fff" strokeWidth={6} />
        <text x={0} y={19} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff">
          69 chất
        </text>
      </g>
      <text x={SW.cx} y={1112} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={28} fill="#5b6b7b">
        Nguồn: CDC
      </text>
    </svg>
  );
};

/* =============== Cảnh 4-5: tế bào, sợi ADN, Khói, Thợ sửa =============== */
const CELL = {cx: 440, cy: 800, r: 250};
const STRAND = {x: 440, y0: 620, y1: 980, amp: 30, period: 96};

type Brk = {y: number; at: number; fix: number; w: number};
/** Chỗ đứt của sợi ADN: cảnh 4 một chỗ, được Thợ sửa nối lại; cảnh 5 nhiều chỗ dần lên, chỉ hai chỗ đầu kịp sửa */
export const FIX_AT = W(4, 'thì') + 0.12;
export const BREAK_AT = W(4, 'hỏng') + 0.1;
const BREAKS: Brk[] = [
  {y: 800, at: BREAK_AT, fix: FIX_AT, w: 40},
  ...[775, 865, 690, 910, 820, 650, 730, 950].map((y, i): Brk => ({y, at: S(5) + 0.5 + i * 0.6, fix: i < 2 ? S(5) + 0.5 + i * 0.6 + 1.2 : Infinity, w: 28})),
];
const brkAmount = (b: Brk, t: number) => P(t, b.at, 0.12) * (Number.isFinite(b.fix) ? 1 - P(t, b.fix, 0.3) : 1);

const helixX = (y: number, sign: number) => STRAND.x + sign * STRAND.amp * Math.sin(((y - STRAND.y0) / STRAND.period) * 2 * Math.PI);

/** Các đoạn liền của sợi ADN sau khi trừ các chỗ đứt đang hở */
const solidRanges = (t: number): [number, number][] => {
  const gaps = BREAKS.map((b) => [b.y - (b.w / 2) * brkAmount(b, t), b.y + (b.w / 2) * brkAmount(b, t), brkAmount(b, t)] as const)
    .filter((g) => g[2] > 0.02)
    .sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let cur = STRAND.y0;
  for (const g of gaps) {
    if (g[0] > cur) out.push([cur, g[0]]);
    cur = Math.max(cur, g[1]);
  }
  if (cur < STRAND.y1) out.push([cur, STRAND.y1]);
  return out;
};

const strandPath = (a: number, b: number, sign: number) => {
  let d = '';
  for (let y = a; y < b; y += 4) d += `${d ? 'L' : 'M'} ${helixX(y, sign).toFixed(1)} ${y.toFixed(1)} `;
  return d + `L ${helixX(b, sign).toFixed(1)} ${b.toFixed(1)}`;
};

const Star = ({x, y, s, color = '#FFC93C'}: {x: number; y: number; s: number; color?: string}) => (
  <path d={`M ${x} ${y - 26 * s} Q ${x + 4 * s} ${y - 4 * s} ${x + 26 * s} ${y} Q ${x + 4 * s} ${y + 4 * s} ${x} ${y + 26 * s} Q ${x - 4 * s} ${y + 4 * s} ${x - 26 * s} ${y} Q ${x - 4 * s} ${y - 4 * s} ${x} ${y - 26 * s} Z`} fill={color} stroke={NAVY} strokeWidth={3} strokeLinejoin="round" />
);

const Strand = ({t}: {t: number}) => {
  const ranges = solidRanges(t);
  const rungs: number[] = [];
  for (let y = STRAND.y0 + 6; y < STRAND.y1; y += 18) if (ranges.some(([a, b]) => y > a + 3 && y < b - 3)) rungs.push(y);
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {rungs.map((y) => (
        <path key={y} d={`M ${helixX(y, 1)} ${y} L ${helixX(y, -1)} ${y}`} stroke="rgba(18,59,99,0.55)" strokeWidth={4} />
      ))}
      {ranges.map(([a, b], i) => (
        <g key={i}>
          <path d={strandPath(a, b, 1)} stroke={NAVY} strokeWidth={14} />
          <path d={strandPath(a, b, -1)} stroke={NAVY} strokeWidth={14} />
        </g>
      ))}
      {ranges.map(([a, b], i) => (
        <g key={i}>
          <path d={strandPath(a, b, 1)} stroke="#2F6FD0" strokeWidth={7} />
          <path d={strandPath(a, b, -1)} stroke="#E0508F" strokeWidth={7} />
        </g>
      ))}
    </g>
  );
};

/** Vị trí Khói trong tế bào (cảnh 4: lao tới sợi ADN rồi lùi lại; cảnh 5: đứng yên ở góc, trung tính) */
export const khoiCell = (t: number) => {
  const keys: [number, number, number][] = [
    [S(4) + 0.5, 190, 600],
    [BREAK_AT - 0.45, 330, 790],
    [BREAK_AT - 0.05, 392, 800],
    [BREAK_AT + 0.25, 300, 770],
    [BREAK_AT + 1.5, 300, 690],
    [S(5), 300, 690],
    [S(5) + 0.7, 250, 640],
  ];
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const p = smooth(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
  return {x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p), scale: 1.0 * smooth(P(t, S(4) + 0.5, 0.4))};
};

/** Thợ sửa: bước vào từ phải, đứng bên phải sợi ADN và quay mặt về phía nó */
export const THO = {x: 600, y: 850, scale: 1.45};
export const thoPose = (t: number) => {
  const enter = smooth(P(t, FIX_AT - 1.0, 0.7));
  const fixing = P(t, FIX_AT - 0.4, 0.1) * (1 - P(t, FIX_AT + 0.05, 0.1));
  const tired = smooth(P(t, E(4) - 0.4, 0.6));
  const tap = BREAKS.slice(1, 3).reduce((s, b) => s + P(t, b.fix - 0.45, 0.1) * (1 - P(t, b.fix + 0.05, 0.1)), 0);
  const arm = lerp(-28 + 11 * fixing * Math.sin(t * 30), 52 + 5 * Math.sin(t * 1.8) - 20 * tap * Math.sin(t * 14), tired);
  return {x: lerp(1450, THO.x, enter), y: THO.y, arm, mood: t < S(5) - 0.05 ? ('vui' as const) : ('met' as const)};
};

const Calendar = ({t}: {t: number}) => {
  const a0 = S(5) - 0.1;
  if (t < a0) return null;
  const r = sp(Math.round(t * FPS), a0, 12);
  const step = 0.26;
  const k = (t - S(5)) / step;
  const idx = Math.max(0, Math.floor(k));
  const f = Math.max(0, k - idx);
  const num = (i: number) => (i % 31) + 1;
  return (
    <g transform={`translate(800 525) scale(${r})`}>
      <rect x={-95} y={-95} width={190} height={190} rx={22} fill="#fff" stroke={NAVY} strokeWidth={6} />
      <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill={NAVY}>
        {num(idx + 1)}
      </text>
      <g transform={`translate(0 -95) scale(1 ${1 - f})`}>
        <rect x={-95} y={0} width={190} height={190} rx={22} fill="#fff" stroke={NAVY} strokeWidth={6} />
        <text x={0} y={147} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill={NAVY}>
          {num(idx)}
        </text>
      </g>
      <path d="M -95 -73 Q -95 -95 -73 -95 H 73 Q 95 -95 95 -73 V -50 H -95 Z" fill={ORANGE} stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={-48} cy={-98} r={8} fill={NAVY} />
      <circle cx={48} cy={-98} r={8} fill={NAVY} />
    </g>
  );
};

export const Cell = ({t, frame, a}: {t: number; frame: number; a: number}) => {
  if (a <= 0.001) return null;
  const zoom = 1 + 0.35 * (1 - smooth(P(t, S(4) - 0.3, 0.6)));
  const dark = smooth(P(t, S(5), E(5) - S(5)));
  const wob = 1 + 0.008 * Math.sin(t * 2);
  const kh = khoiCell(t);
  const tho = thoPose(t);
  const flash = BREAKS.slice(0, 1).map((b) => P(t, b.at, 0.05) * (1 - P(t, b.at + 0.05, 0.45)));
  const starP = P(t, FIX_AT, 0.12) * (1 - P(t, FIX_AT + 0.1, 0.45));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      <g transform={`translate(${CELL.cx} ${CELL.cy}) scale(${zoom}) translate(${-CELL.cx} ${-CELL.cy})`}>
        <g transform={`translate(${CELL.cx} ${CELL.cy}) scale(${wob}) translate(${-CELL.cx} ${-CELL.cy})`}>
          <circle cx={CELL.cx} cy={CELL.cy} r={CELL.r} fill={rgb([252, 227, 227], [227, 196, 196], dark)} stroke={NAVY} strokeWidth={8} />
          <circle cx={CELL.cx} cy={CELL.cy} r={190} fill={rgb([248, 208, 213], [222, 176, 184], dark)} stroke={NAVY} strokeWidth={4} strokeDasharray="12 10" opacity={0.9} />
          <circle cx={290} cy={950} r={22} fill="rgba(255,255,255,0.5)" />
          <circle cx={610} cy={660} r={16} fill="rgba(255,255,255,0.5)" />
          <Strand t={t} />
          {/* tia lửa lúc bị cắt đứt */}
          {flash.map((f, i) =>
            f > 0.01 ? (
              <g key={i} stroke="#FFC93C" strokeWidth={5} strokeLinecap="round" opacity={f}>
                {[0, 1, 2, 3, 4, 5].map((k) => {
                  const ang = (k / 6) * Math.PI * 2 + 0.4;
                  return <path key={k} d={`M ${STRAND.x + Math.cos(ang) * 30} ${BREAKS[0].y + Math.sin(ang) * 30} L ${STRAND.x + Math.cos(ang) * (46 + 24 * f)} ${BREAKS[0].y + Math.sin(ang) * (46 + 24 * f)}`} />;
                })}
              </g>
            ) : null,
          )}
          {starP > 0.01 && <Star x={STRAND.x} y={BREAKS[0].y} s={0.5 + 0.8 * starP} />}
        </g>
      </g>
      <Khoi x={kh.x} y={kh.y} scale={kh.scale} mood={khoiMood(t)} t={t} look={t < S(5) ? 1 : 0} opacity={0.95} />
      <ThoSua x={tho.x} y={tho.y} scale={THO.scale} mood={tho.mood} t={t} arm={tho.arm} flip />
      <Calendar t={t} />
    </svg>
  );
};

/* =============== Cảnh 7: ba cách hút, mỗi cách một dấu X nhẹ =============== */
const Cigarette = ({len = 150}: {len?: number}) => (
  <g>
    <rect x={-len / 2} y={-13} width={len} height={26} rx={7} fill="#fff" stroke="#5b6b7b" strokeWidth={4} />
    <rect x={-len / 2} y={-13} width={44} height={26} rx={7} fill="#FFD9A8" stroke="#e08b4f" strokeWidth={4} />
    <rect x={len / 2 - 14} y={-13} width={14} height={26} rx={5} fill={ORANGE} stroke="#d85a10" strokeWidth={3} />
  </g>
);

const IconStick = () => (
  <g>
    {[-46, 0, 46].map((dy, i) => (
      <g key={i} transform={`translate(${i * 4 - 4} ${dy}) rotate(-14)`}>
        <Cigarette len={170} />
      </g>
    ))}
    <path d="M 78 -86 q -14 -22 6 -40 q 18 -18 4 -40" fill="none" stroke="#5b6b7b" strokeWidth={7} strokeLinecap="round" opacity={0.35} />
  </g>
);

const IconPipe = () => (
  <g>
    <rect x={-20} y={-120} width={40} height={250} rx={14} fill="#D9BC7A" stroke={NAVY} strokeWidth={6} />
    {[-70, -10, 50, 100].map((y) => (
      <path key={y} d={`M -20 ${y} H 20`} stroke={NAVY} strokeWidth={4} />
    ))}
    <rect x={-44} y={-120} width={36} height={22} rx={8} fill="#C79B4F" stroke={NAVY} strokeWidth={5} />
    <path d="M 20 -30 H 46 L 54 -70 H 94 L 98 -30 H 74 V 8 H 20 Z" fill="#B9854A" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={74} cy={-78} r={9} fill={ORANGE} stroke="#d85a10" strokeWidth={3} />
    <path d="M 76 -96 q -14 -20 4 -36 q 16 -16 2 -36" fill="none" stroke="#5b6b7b" strokeWidth={7} strokeLinecap="round" opacity={0.35} />
  </g>
);

const IconVape = () => (
  <g>
    <rect x={-28} y={-96} width={56} height={230} rx={26} fill="#7A8CA3" stroke={NAVY} strokeWidth={6} />
    <rect x={-14} y={-124} width={28} height={34} rx={10} fill="#CBD5E1" stroke={NAVY} strokeWidth={5} />
    <circle cx={0} cy={72} r={9} fill={ORANGE} stroke={NAVY} strokeWidth={3} />
    <path d="M -12 -40 H 12 M -12 -10 H 12" stroke="#CBD5E1" strokeWidth={5} strokeLinecap="round" />
    {[
      [-24, -150, 22],
      [10, -176, 26],
      [34, -138, 18],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#fff" stroke="#9DB4D0" strokeWidth={5} opacity={0.9} />
    ))}
  </g>
);

const CARDS = [
  {x: 60, title: ['Vài điếu'], icon: <IconStick />, at: () => W(7, 'Hút'), x_at: () => WE(7, 'ít') + 0.1},
  {x: 355, title: ['Điếu cày'], icon: <IconPipe />, at: () => W(7, 'thuốc', 0), x_at: () => WE(7, 'lào') + 0.1},
  {x: 650, title: ['Thuốc lá', 'điện tử'], icon: <IconVape />, at: () => W(7, 'thuốc', 1), x_at: () => WE(7, 'tử') + 0.1},
] as const;

export const Icons = ({t, frame, a}: {t: number; frame: number; a: number}) => {
  if (a <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      {CARDS.map((c, i) => {
        const s = sp(frame, c.at(), 11);
        const xs = sp(frame, c.x_at(), 9);
        if (t < c.at() - 0.05) return null;
        return (
          <g key={i} transform={`translate(${c.x + 135} 720) scale(${s}) translate(-135 -250)`}>
            <rect x={0} y={0} width={270} height={500} rx={36} fill="#fff" opacity={0.97} />
            <g transform="translate(135 205) scale(0.95)">{c.icon}</g>
            {c.title.map((line, k) => (
              <text key={k} x={135} y={420 + k * 44 - (c.title.length - 1) * 22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={NAVY}>
                {line}
              </text>
            ))}
            {t >= c.x_at() && (
              <g transform={`translate(226 44) scale(${xs})`}>
                <circle r={30} fill={RUST} stroke="#fff" strokeWidth={5} opacity={0.92} />
                <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* =============== Cảnh 8-10: lá phổi, thanh thời gian, thẻ tổng đài, màn kết =============== */
const BAR = {x0: 110, x1: 850, y: 960};

/** Lá phổi đi suốt cảnh 8-10: giữa khung (cảnh 8) -> góc dưới trái (cảnh 9) -> giữa khung (cảnh 10) */
const lungPose = (t: number) => {
  const a = smooth(P(t, E(8) + 0.1, 0.65));
  const b = smooth(P(t, E(9) - 0.1, 0.7));
  const x = lerp(lerp(540, 255, a), 540, b);
  const y = lerp(lerp(625, 990, a), 710, b);
  const s = lerp(lerp(1.7, 0.85, a), 1.8, b);
  return {x, y, s};
};

const Tick = ({x, y, on}: {x: number; y: number; on: number}) => (
  <g transform={`translate(${x} ${y}) scale(${on})`}>
    <circle r={28} fill={GREEN} stroke="#fff" strokeWidth={5} />
    <path d="M -11 1 L -3 10 L 12 -9" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Finale = ({t, frame, a}: {t: number; frame: number; a: number}) => {
  if (a <= 0.001) return null;
  const lp = lungPose(t);
  const heal = smooth(P(t, W(8, 'Sau'), 3.6));
  const smile = smooth(P(t, SMILE_AT + 0.05, 0.4));
  const breathe = 1 + 0.025 * Math.sin(t * 2.6);
  const in8 = smooth(P(t, S(8) - 0.1, 0.4));
  const lungOp = in8;

  /* thanh thời gian + ghi chú nguồn (chỉ ở cảnh 8) */
  const barA = smooth(P(t, S(8) + 0.4, 0.4)) * (1 - smooth(P(t, E(8) + 0.0, 0.3)));
  const fill = smooth(P(t, W(8, 'Sau'), 3.4));
  const bx = (yr: number) => lerp(BAR.x0, BAR.x1, yr / 15);
  const chip = sp(frame, W(8, 'giảm'), 10) * (1 - smooth(P(t, E(8), 0.3)));

  /* thẻ tổng đài (cảnh 9) */
  const cardIn = sp(frame, S(9) + 0.1, 13);
  const cardOut = smooth(P(t, E(9) + 0.0, 0.3));
  const reading = t >= W(9, '1800') - 0.05 && t < E(9) + 0.1;
  const thoS = sp(frame, SMILE_AT + 0.05, 10) * (1 - cardOut);

  /* màn cuối (cảnh 10) */
  const fin = P(t, S(10) - 0.05, 0.4);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      {/* thanh thời gian */}
      {barA > 0.01 && (
        <g opacity={barA}>
          <text x={BAR.x0} y={BAR.y - 26} fontFamily={FONT} fontWeight={800} fontSize={34} fill={NAVY}>
            Sau khi bỏ thuốc
          </text>
          <rect x={BAR.x0} y={BAR.y} width={BAR.x1 - BAR.x0} height={28} rx={14} fill="#fff" stroke={NAVY} strokeWidth={5} />
          <rect x={bx(10)} y={BAR.y + 3} width={bx(15) - bx(10) - 3} height={22} rx={11} fill="#FDE3CC" />
          <rect x={BAR.x0 + 3} y={BAR.y + 3} width={Math.max(0, (BAR.x1 - BAR.x0 - 6) * fill)} height={22} rx={11} fill={ORANGE} />
          {[
            [0, '0'],
            [10, '10'],
            [15, '15 năm'],
          ].map(([yr, label]) => (
            <g key={label}>
              <path d={`M ${bx(yr as number)} ${BAR.y + 34} v 10`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
              <text x={bx(yr as number)} y={BAR.y + 84} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={NAVY}>
                {label}
              </text>
            </g>
          ))}
          <text x={BAR.x0} y={BAR.y + 128} fontFamily={FONT} fontWeight={600} fontSize={25} fill="#5b6b7b">
            *Phần nguy cơ ung thư phổi tăng thêm, so với người tiếp tục hút.
          </text>
          <text x={BAR.x0} y={BAR.y + 160} fontFamily={FONT} fontWeight={700} fontSize={25} fill="#5b6b7b">
            Nguồn: CDC
          </text>
        </g>
      )}
      {chip > 0.01 && (
        <g transform={`translate(540 860) scale(${chip})`}>
          <rect x={-310} y={-40} width={620} height={80} rx={40} fill={ORANGE} stroke="#fff" strokeWidth={6} />
          <text x={0} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#fff">
            Giảm khoảng một nửa*
          </text>
        </g>
      )}
      {/* thẻ tổng đài */}
      {cardIn > 0.01 && cardOut < 0.99 && (
        <g transform={`translate(0 ${(1 - cardIn) * 70})`} opacity={Math.min(1, cardIn * 1.3) * (1 - cardOut)}>
          <rect x={60} y={330} width={860} height={420} rx={44} fill="#fff" opacity={0.98} />
          <path d="M 60 374 Q 60 330 104 330 H 876 Q 920 330 920 374 V 392 H 60 Z" fill={ORANGE} />
          <text x={490} y={374} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff" letterSpacing={2}>
            GỌI MIỄN PHÍ
          </text>
          <text x={490} y={566} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={140} fill={reading ? ORANGE : NAVY} letterSpacing={2}>
            1800 6606
          </text>
          <text x={490} y={640} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={NAVY}>
            Tổng đài cai thuốc lá miễn phí
          </text>
          <text x={490} y={692} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#5b6b7b">
            (BV Bạch Mai)
          </text>
        </g>
      )}
      <ThoSua x={780} y={985} scale={1.6 * Math.max(0.001, thoS)} mood="vui" t={t} thumb opacity={Math.min(1, thoS)} />
      {/* lá phổi */}
      <Lung x={lp.x} y={lp.y} scale={lp.s * breathe * lungOp} tone={heal} smile={smile} t={t} />
      {/* màn kết: một hàng dấu tích, mỗi ngày một dấu */}
      {fin > 0 &&
        [0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Tick key={i} x={240 + i * 100} y={1040} on={sp(frame, S(10) + 0.2 + i * 0.38, 10)} />
        ))}
      {fin > 0 &&
        [
          [300, 520, 0.0],
          [800, 560, 0.7],
          [250, 800, 1.4],
          [830, 830, 2.1],
        ].map(([x, y, ph], i) => {
          const k = 0.5 + 0.5 * Math.sin(t * 3 + (ph as number) * 3);
          return <Star key={i} x={x as number} y={y as number} s={0.35 + 0.35 * k} />;
        })}
    </svg>
  );
};
