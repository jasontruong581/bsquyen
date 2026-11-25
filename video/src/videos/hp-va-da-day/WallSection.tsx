/* Thế giới B: lát cắt thành dạ dày phóng to — acid (trên), lớp nhầy, hàng tế bào niêm mạc, lớp dưới. */
import {interpolateColors} from 'remotion';
import {Cloud, HP, Rod} from './Bacteria';
import {P, lerp} from '../../timeline';
import {E, S, W} from './timeline';

const MUCUS_TOP = 760;
const CELL_BOTTOM = 1380;
const CELLS = 7;
const CW = 1080 / CELLS;

export type Bug = {x: number; y: number; angle: number; scale: number; cloud: number};

/** Vị trí các con HP theo thời gian (dùng chung để acid biết chỗ nào có mây kiềm) */
export const bugsAt = (t: number): Bug[] => {
  const enter = W(3, 'loài');
  const hpWord = W(3, 'hp');
  const turn = P(t, S(4), 0.8);
  const dive = P(t, S(4) + 0.7, W(4, 'nhầy') + 0.4 - (S(4) + 0.7));
  const yIn = lerp(-200, 520, P(t, enter - 0.3, hpWord - enter + 0.5));
  const gone = (i: number) => 1 - P(t, S(7) + 0.5 + i * 0.18, 0.35);
  const main: Bug = {
    x: 540 + 10 * Math.sin(t * 2),
    y: lerp(yIn, 960, dive),
    angle: lerp(-20 + 10 * Math.sin(t * 1.5), 90, turn),
    scale: (t < enter - 0.3 ? 0 : 1) * gone(0),
    cloud: P(t, W(4, 'kiềm') - 0.2, 0.8) * gone(0),
  };
  const spots = [
    [170, 900, 70],
    [360, 990, 105],
    [740, 910, 80],
    [920, 1000, 100],
  ];
  const extra = spots.map(([x, y, a], i): Bug => {
    const born = P(t, S(5) + 0.1 + i * 0.3, 0.5);
    return {x: x + 8 * Math.sin(t * 2 + i), y: y + 6 * Math.cos(t * 1.7 + i), angle: a, scale: 0.85 * born * gone(i + 1), cloud: born * gone(i + 1)};
  });
  return [main, ...extra];
};

export const WallSection = ({t}: {t: number}) => {
  const bugs = bugsAt(t);

  /* acid: các hạt "+" trôi xuống, chạm lớp nhầy thì tan; gần mây kiềm thì mờ đi */
  const acid = Array.from({length: 22}, (_, i) => {
    const speed = 70 + (i % 6) * 14;
    const cyc = (t * speed + i * 173) % 900;
    const x = 40 + ((i * 211) % 1000) + 14 * Math.sin(t + i);
    const y = MUCUS_TOP - 900 + cyc;
    let o = Math.min(1, (MUCUS_TOP - y) / 70);
    for (const b of bugs) {
      const r = 150 * b.cloud;
      if (r > 1 && Math.hypot(x - b.x, y - b.y) < r + 60) o *= 0.15;
    }
    return {x, y, o};
  });

  /* vi khuẩn thường rơi vào rồi bị acid phá */
  const rods = [0, 1, 2].map((i) => {
    const a = S(3) + 0.1 + i * 0.35;
    const fall = P(t, a, 1.0);
    const die = P(t, a + 1.0, 0.7);
    return {x: 260 + i * 280, y: lerp(-150, 380 + (i % 2) * 120, fall), angle: 20 + i * 50 + t * 40, scale: t < a ? 0 : 1 - die, opacity: 1 - die * 0.6};
  });

  /* trạng thái tế bào */
  const inflame = P(t, W(5, 'viêm') - 0.2, 1.6) * (1 - 0.65 * P(t, S(7) + 1.2, 2));
  const thin = P(t, W(6, 'mỏng') - 0.1, 1.4);
  const metaT = W(6, 'biến');
  const cancer = P(t, W(6, 'ung') - 0.1, 0.9);
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  const h = lerp(300, 175, thin);

  const waveTop = (x: number) => MUCUS_TOP + 14 * Math.sin(x / 90 + t * 1.2);
  let mucus = `M -400 ${waveTop(-400)}`;
  for (let x = -390; x <= 1480; x += 15) mucus += ` L ${x} ${waveTop(x).toFixed(1)}`;
  mucus += ` L 1480 ${CELL_BOTTOM} L -400 ${CELL_BOTTOM} Z`;

  return (
    <g>
      <defs>
        <linearGradient id="acid-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1BF" />
          <stop offset="1" stopColor="#FFD970" />
        </linearGradient>
        <linearGradient id="nhay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9BE0D2" />
          <stop offset="1" stopColor="#5DBFAE" />
        </linearGradient>
        <radialGradient id="kiem">
          <stop offset="0" stopColor="#C9D6FF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#9DB4FF" stopOpacity={0.15} />
        </radialGradient>
      </defs>
      <rect x={-600} y={-900} width={2280} height={MUCUS_TOP + 960} fill="url(#acid-bg)" />
      <rect x={-600} y={CELL_BOTTOM - 10} width={2280} height={1500} fill="#F9D5CB" />
      {/* mạch máu lớp dưới */}
      <path d={`M -400 1560 C 200 1500, 600 1640, 1480 1540`} fill="none" stroke="#D9534F" strokeWidth={34} strokeLinecap="round" opacity={0.8} />
      <path d={`M -400 1700 C 300 1760, 700 1660, 1480 1740`} fill="none" stroke="#5B7FC7" strokeWidth={28} strokeLinecap="round" opacity={0.7} />
      <path d={mucus} fill="url(#nhay)" opacity={0.9} />
      <path d={mucus} fill="none" stroke="#3E9C8C" strokeWidth={6} />
      {/* bọt trong lớp nhầy */}
      {Array.from({length: 12}, (_, i) => (
        <circle key={i} cx={(i * 97 + 30) % 1080} cy={800 + ((i * 53) % 220)} r={6 + (i % 3) * 3} fill="#D6F5EE" opacity={0.6} />
      ))}
      {/* tế bào niêm mạc */}
      {Array.from({length: CELLS}, (_, i) => {
        const meta = [1, 4, 5].includes(i) ? P(t, metaT + i * 0.12, 0.8) : 0;
        const dark = i === 4 ? cancer : 0;
        const red = Math.min(1, inflame * (0.85 + 0.15 * pulse));
        let fill = interpolateColors(red, [0, 1], ['#F7C1B2', '#EE6B5B']);
        if (meta > 0) fill = interpolateColors(meta, [0, 1], [fill, '#B79CDB']);
        if (dark > 0) fill = interpolateColors(dark, [0, 1], [fill, '#5A2448']);
        const x = i * CW + 5;
        const y = CELL_BOTTOM - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={CW - 10} height={h} rx={30} fill={fill} stroke="#A94C47" strokeWidth={6} />
            {meta > 0.05 && <ellipse cx={x + (CW - 10) / 2} cy={y + h * 0.3} rx={34 * meta} ry={26 * meta} fill="#EDE3FA" stroke="#8D6CC0" strokeWidth={4} />}
            <circle cx={x + (CW - 10) / 2} cy={y + h * 0.68} r={lerp(26, 40, dark)} fill={interpolateColors(dark, [0, 1], ['#8E3A4D', '#1E0B19'])} />
            {dark > 0.5 && (
              <rect x={x - 12} y={y - 12} width={CW + 14} height={h + 24} rx={40} fill="none" stroke="#FF7A2F" strokeWidth={8} opacity={(dark - 0.5) * 2 * (0.5 + 0.5 * pulse)} />
            )}
          </g>
        );
      })}
      {/* quầng viêm */}
      <rect x={-600} y={CELL_BOTTOM - h - 40} width={2280} height={h + 60} fill="#FF5A4A" opacity={0.18 * inflame * pulse} />
      {/* acid */}
      {acid.map((a, i) => (
        <g key={i} transform={`translate(${a.x} ${a.y})`} opacity={a.o}>
          <circle r={22} fill="#FF9F43" stroke="#E0761E" strokeWidth={4} />
          <path d="M -10 0 H 10 M 0 -10 V 10" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {rods.map((r, i) => (
        <Rod key={i} {...r} />
      ))}
      {bugs.map((b, i) => (
        <Cloud key={`c${i}`} x={b.x} y={b.y} r={150 * b.cloud * b.scale} opacity={0.9} />
      ))}
      {bugs.map((b, i) => (
        <HP key={i} x={b.x} y={b.y} angle={b.angle} scale={b.scale} t={t + i} spin={t > S(4) && t < E(4) ? 16 : 9} />
      ))}
      {/* tia lấp lánh khi HP bị diệt */}
      {bugs.map((b, i) => {
        const a = S(7) + 0.5 + i * 0.18;
        const p = P(t, a, 0.6);
        if (p <= 0 || p >= 1) return null;
        return (
          <g key={`s${i}`} transform={`translate(${b.x} ${b.y})`} opacity={1 - p}>
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <line key={d} x1={0} y1={0} x2={0} y2={-40 - 70 * p} transform={`rotate(${d})`} stroke="#FFC93C" strokeWidth={10} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </g>
  );
};
