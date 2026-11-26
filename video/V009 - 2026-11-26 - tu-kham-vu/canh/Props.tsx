/* Đạo cụ của V009: trăng, tờ lịch, sổ ghi, hình người que, đồng xu, đầu dò siêu âm, phim nhũ ảnh, kim sinh thiết, biển phòng khám, tờ kết quả.
   Tất cả là biểu tượng đơn giản dạng sơ đồ; không có hình cơ thể. */
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {lerp} from '../../src/timeline';
import {LUMP} from './Geo';
import {T, clamp01, ramp, smooth} from './Motion';
import {E, S} from './timeline';

const f1 = (n: number) => n.toFixed(1);

/* ---------- trăng: p = 0 trăng non, 0,5 trăng tròn, 1 trăng non ---------- */
export const Moon = ({x, y, r, p, a = 1}: {x: number; y: number; r: number; p: number; a?: number}) => {
  const pp = p < 0.5 ? p : 1 - p;
  const c = Math.cos(2 * Math.PI * pp);
  const rx = Math.abs(c) * r;
  const lit = `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${f1(rx)} ${r} 0 0 ${c > 0 ? 0 : 1} 0 ${-r} Z`;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)})`} opacity={a}>
      <circle r={r} fill="#A9B6E4" stroke={NAVY} strokeWidth={4.5} />
      <g transform={p < 0.5 ? undefined : 'scale(-1 1)'}>
        <path d={lit} fill="#FFF3B8" />
      </g>
      <circle r={r} fill="none" stroke={NAVY} strokeWidth={4.5} />
    </g>
  );
};

/* ---------- dấu hỏi, dấu tích ---------- */
export const Question = ({x, y, a, t}: {x: number; y: number; a: number; t: number}) => {
  if (a < 0.01) return null;
  return (
    <g transform={`translate(${f1(x)} ${f1(y + 7 * Math.sin(t * 3.4))}) scale(${(0.7 + 0.3 * a).toFixed(3)})`} opacity={a}>
      <text textAnchor="middle" y={34} fontFamily={FONT} fontWeight={900} fontSize={104} fill="#fff" stroke={NAVY} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
        ?
      </text>
    </g>
  );
};

export const Check = ({x, y, r = 26, a = 1, color = '#4CC9A6'}: {x: number; y: number; r?: number; a?: number; color?: string}) => {
  if (a < 0.01) return null;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${(0.6 + 0.4 * a).toFixed(3)})`} opacity={a}>
      <circle r={r} fill={color} stroke={NAVY} strokeWidth={5} />
      <path d={`M ${-r * 0.42} ${r * 0.02} L ${-r * 0.1} ${r * 0.34} L ${r * 0.46} ${-r * 0.3}`} fill="none" stroke="#fff" strokeWidth={r * 0.28} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/* ---------- huy hiệu số 1 2 3 (cảnh 1) ---------- */
export const NumBadge = ({x, y, n, a}: {x: number; y: number; n: number; a: number}) => {
  if (a < 0.01) return null;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${(0.4 + 0.6 * a).toFixed(3)})`} opacity={a}>
      <circle r={30} fill={NAVY} stroke="#fff" strokeWidth={6} />
      <text textAnchor="middle" y={13} fontFamily={FONT} fontWeight={900} fontSize={38} fill="#fff">
        {n}
      </text>
    </g>
  );
};

/* ---------- tờ lịch (cảnh 4): vài ngày sau sạch kinh, hoặc một ngày cố định khi mãn kinh ---------- */
const CAL = {x: 60, y: 0, w: 540, h: 520};
const cell = (d: number) => {
  const i = d - 1 + 2; // ngày 1 rơi vào thứ Tư
  return {x: -245 + 35 + (i % 7) * 70, y: -118 + 36 + Math.floor(i / 7) * 72};
};
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const Calendar = ({t}: {t: number}) => {
  const inn = ramp(t, S(4) - 0.05, 0.45);
  const out = ramp(t, E(4) + 0.02, 0.3);
  const a = inn * (1 - out);
  if (a < 0.01) return null;
  const period = ramp(t, T.period, 0.4) * (1 - ramp(t, T.menopause, 0.3));
  const ringDraw = ramp(t, T.calCircle, 0.5);
  // vòng khoanh: ngày 18 (bất kỳ) -> ngày 11 (sau sạch kinh) -> ngày 1 (mãn kinh, cố định)
  const h1 = ramp(t, T.clean, 0.4);
  const h2 = ramp(t, T.menopause + 0.2, 0.4);
  const c0 = cell(18);
  const c1 = cell(11);
  const c2 = cell(1);
  const rx = lerp(lerp(c0.x, c1.x, h1), c2.x, h2);
  const ry = lerp(lerp(c0.y, c1.y, h1), c2.y, h2);
  const pin = ramp(t, T.fixed, 0.3);
  const days = Array.from({length: 31}, (_, i) => i + 1);
  return (
    <g transform={`translate(${CAL.x} ${CAL.y + (1 - inn) * 60 + out * 30}) scale(${(0.86 + 0.14 * a).toFixed(3)})`} opacity={a}>
      <rect x={-CAL.w / 2 + 8} y={-CAL.h / 2 + 14} width={CAL.w} height={CAL.h} rx={44} fill={NAVY} opacity={0.14} />
      <rect x={-CAL.w / 2} y={-CAL.h / 2} width={CAL.w} height={CAL.h} rx={44} fill="#fff" stroke={NAVY} strokeWidth={7} />
      <path d={`M ${-CAL.w / 2 + 3.5} ${-CAL.h / 2 + 90} V ${-CAL.h / 2 + 44} A 40.5 40.5 0 0 1 ${-CAL.w / 2 + 44} ${-CAL.h / 2 + 3.5} H ${CAL.w / 2 - 44} A 40.5 40.5 0 0 1 ${CAL.w / 2 - 3.5} ${-CAL.h / 2 + 44} V ${-CAL.h / 2 + 90} Z`} fill={ORANGE} />
      <text x={-30} y={-CAL.h / 2 + 62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#fff" letterSpacing={2}>
        MỘT THÁNG
      </text>
      <Moon x={150} y={-CAL.h / 2 + 46} r={22} p={(t * 0.2) % 1} />
      {DAYS.map((d, i) => (
        <text key={d} x={-245 + 35 + i * 70} y={-136} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={26} fill="#6B7C90">
          {d}
        </text>
      ))}
      {/* ngày kinh: tô nhạt */}
      {period > 0.01 &&
        [3, 4, 5, 6, 7].map((d) => {
          const c = cell(d);
          return <rect key={d} x={c.x - 33} y={c.y - 33} width={66} height={66} rx={20} fill="#FFC9D8" opacity={0.85 * period} />;
        })}
      {days.map((d) => {
        const c = cell(d);
        return (
          <text key={d} x={c.x} y={c.y + 11} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill={NAVY} fillOpacity={0.85}>
            {d}
          </text>
        );
      })}
      {/* vòng khoanh */}
      {ringDraw > 0.01 && (
        <circle cx={rx} cy={ry} r={34} fill="none" stroke={ORANGE} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${f1(214 * ringDraw)} 220`} transform={`rotate(-90 ${f1(rx)} ${f1(ry)})`} />
      )}
      {h1 > 0.05 && h1 < 0.98 && h2 < 0.01 && (
        <path d={`M ${f1(cell(7).x + 40)} ${f1(cell(7).y)} Q ${f1(cell(9).x)} ${f1(cell(9).y - 56)} ${f1(rx - 40)} ${f1(ry - 6)}`} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="3 12" strokeLinecap="round" />
      )}
      {pin > 0.01 && (
        <g transform={`translate(${f1(c2.x + 22)} ${f1(c2.y - 34 - (1 - pin) * 30)})`} opacity={pin}>
          <path d="M 0 0 L -14 22" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
          <circle r={13} fill={ORANGE} stroke={NAVY} strokeWidth={4.5} />
          <circle cx={-3} cy={-3} r={4} fill="#fff" opacity={0.7} />
        </g>
      )}
    </g>
  );
};

/* ---------- sổ ghi (cảnh 8) ---------- */
const NB = {x: 150, y: 285, w: 336, h: 240};
export const Notebook = ({t}: {t: number}) => {
  const inn = ramp(t, T.note, 0.4);
  const out = ramp(t, E(8) + 0.05, 0.3);
  const a = inn * (1 - out);
  if (a < 0.01) return null;
  const lines = [
    {txt: 'Vị trí: 10 giờ', at: T.note + 0.35, size: 38, y: -22, fill: NAVY, w: 0},
    {txt: 'cách tâm 2 đốt ngón', at: T.note + 1.1, size: 25, y: 28, fill: NAVY, w: 0},
    {txt: 'kích cỡ · cứng hay mềm', at: T.note + 1.9, size: 20, y: 72, fill: '#5B6B7B', w: 0},
  ];
  return (
    <g transform={`translate(${NB.x} ${NB.y + (1 - inn) * 50}) rotate(${(5 - 3 * (1 - inn)).toFixed(2)}) scale(${(0.8 + 0.2 * a).toFixed(3)})`} opacity={a}>
      <rect x={-NB.w / 2 + 8} y={-NB.h / 2 + 12} width={NB.w} height={NB.h} rx={26} fill={NAVY} opacity={0.14} />
      <rect x={-NB.w / 2} y={-NB.h / 2} width={NB.w} height={NB.h} rx={26} fill="#FFFDF2" stroke={NAVY} strokeWidth={6} />
      {[-96, -48, 0, 48, 96].map((x) => (
        <g key={x}>
          <rect x={x - 6} y={-NB.h / 2 - 16} width={12} height={32} rx={6} fill="#C9D3E6" stroke={NAVY} strokeWidth={4} />
        </g>
      ))}
      {[16, 62, 108].map((y) => (
        <path key={y} d={`M ${-NB.w / 2 + 26} ${y} H ${NB.w / 2 - 26}`} stroke="#B9C7E2" strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
      ))}
      {lines.map((l, i) => {
        const k = ramp(t, l.at, 0.5);
        return (
          <g key={i} opacity={k}>
            <text x={-NB.w / 2 + 28} y={l.y} fontFamily={FONT} fontWeight={i === 0 ? 900 : 800} fontSize={l.size} fill={l.fill}>
              {l.txt}
            </text>
          </g>
        );
      })}
      {/* bút */}
      <g transform={`translate(${f1(60 + 40 * clamp01((t - T.note) / 2))} ${f1(60 - 6 * Math.sin(t * 5))}) rotate(40)`} opacity={ramp(t, T.note + 0.1, 0.3) * (1 - ramp(t, T.note + 2.3, 0.4))}>
        <rect x={-7} y={-62} width={14} height={62} rx={5} fill="#FFC93C" stroke={NAVY} strokeWidth={4} />
        <path d="M -7 0 L 0 16 L 7 0 Z" fill="#FFE8B0" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------- hình người que cho ba tư thế đứng trước gương (cảnh 5): tay xuôi, chống hông, giơ cao ---------- */
const Pictogram = ({kind}: {kind: 0 | 1 | 2}) => {
  const arms =
    kind === 0
      ? ['M 0 -8 L -22 20', 'M 0 -8 L 22 20']
      : kind === 1
        ? ['M 0 -8 L -26 6 L -14 20', 'M 0 -8 L 26 6 L 14 20']
        : ['M 0 -8 L -24 -38', 'M 0 -8 L 24 -38'];
  return (
    <g fill="none" stroke={NAVY} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 4)">
      <circle cy={-28} r={10} fill={NAVY} />
      <path d="M 0 -16 L 0 22 M 0 22 L -13 48 M 0 22 L 13 48" />
      {arms.map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  );
};
export const PoseBadge = ({x, y, kind, t}: {x: number; y: number; kind: 0 | 1 | 2; t: number}) => {
  const k = ramp(t, T.pose[kind], 0.3) * (1 - ramp(t, E(5) + 0.05, 0.3));
  if (k < 0.01) return null;
  const active = t >= T.pose[kind] && t < (kind < 2 ? T.pose[kind + 1] : T.pose[2] + 0.8);
  return (
    <g transform={`translate(${f1(x)} ${f1(y + (1 - k) * 22)}) scale(${(0.5 + 0.5 * k).toFixed(3)})`} opacity={k}>
      <circle r={56} fill={active ? '#FFE9D6' : '#fff'} stroke={active ? ORANGE : NAVY} strokeWidth={active ? 8 : 5} />
      <Pictogram kind={kind} />
    </g>
  );
};

/* ---------- đồng xu (cảnh 6): vòng tròn nhỏ cỡ đồng xu ---------- */
export const CoinIcon = ({x, y, a}: {x: number; y: number; a: number}) => {
  if (a < 0.01) return null;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${(0.6 + 0.4 * a).toFixed(3)})`} opacity={a}>
      <circle r={28} fill="#FFD66B" stroke={NAVY} strokeWidth={5} />
      <circle r={19} fill="none" stroke="#E9A92D" strokeWidth={3.5} />
      <path d="M -9 -4 L 0 -13 L 9 -4 M 0 -12 V 12" fill="none" stroke="#E9A92D" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M -14 -14 Q -6 -20 2 -20" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

/* ---------- cảnh 9: đầu dò siêu âm, phim nhũ ảnh, kim, thuốc tê, tờ kết quả ---------- */
export const Probe = ({t}: {t: number}) => {
  const a = ramp(t, T.probe, 0.25) * (1 - ramp(t, T.film + 0.9, 0.3));
  if (a < 0.01) return null;
  const k = (t * 1.1) % 1;
  return (
    <g transform={`translate(${f1(LUMP.x)} ${f1(-4 + 6 * Math.sin(t * 6))})`} opacity={a}>
      {[0, 1, 2].map((i) => {
        const q = (k + i / 3) % 1;
        const r = 26 + 80 * q;
        return <path key={i} d={`M ${-r} ${6 + r * 0.25} A ${r} ${r} 0 0 0 ${r} ${6 + r * 0.25}`} fill="none" stroke="#7F6EE6" strokeWidth={6} strokeLinecap="round" opacity={(1 - q) * 0.9} transform="translate(0 0)" />;
      })}
      <path d="M -26 -86 H 26 L 20 -20 H -20 Z" fill="#6F8FD8" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-36} y={-24} width={72} height={26} rx={12} fill="#A5BCF0" stroke={NAVY} strokeWidth={5} />
      <path d="M 0 -86 C 0 -130 50 -120 60 -160" fill="none" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

export const Film = ({t}: {t: number}) => {
  const a = ramp(t, T.film, 0.3) * (1 - ramp(t, T.needle - 0.4, 0.3));
  if (a < 0.01) return null;
  const scan = ((t - T.film) * 0.9) % 1;
  return (
    <g transform={`translate(150 -128) rotate(${(-5 + 2 * Math.sin(t * 2)).toFixed(2)}) scale(${(0.8 + 0.2 * a).toFixed(3)})`} opacity={a}>
      <rect x={-84} y={-62} width={168} height={124} rx={16} fill="#2D3C6B" stroke={NAVY} strokeWidth={6} />
      <circle r={40} fill="#8D8FD8" opacity={0.55} />
      <circle r={40} fill="none" stroke="#C9CBF4" strokeWidth={4} />
      <circle r={22} fill="none" stroke="#C9CBF4" strokeWidth={3} strokeDasharray="2 8" />
      <circle cx={-18} cy={-12} r={7} fill="#FFF3B8" />
      <path d={`M -72 ${f1(-50 + 100 * scan)} H 72`} stroke="#7CF0D0" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      <path d="M -72 -50 V -34 M -72 -50 H -56 M 72 -50 V -34 M 72 -50 H 56 M -72 50 V 34 M -72 50 H -56 M 72 50 V 34 M 72 50 H 56" stroke="#C9CBF4" strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/** Kim nhỏ đi nghiêng từ trên xuống tới khối trong mặt cắt; gây tê tại chỗ là quầng xanh nhạt trên da */
export const Needle = ({t}: {t: number}) => {
  const p = ramp(t, T.needle + 0.45, 0.8);
  const a = ramp(t, T.needle + 0.2, 0.3) * (1 - ramp(t, E(9) + 0.05, 0.4));
  if (a < 0.01) return null;
  const tgt = {x: LUMP.x + 6, y: 64};
  const dir = {x: 0.42, y: 0.91};
  const len = 140;
  const tip = {x: lerp(tgt.x - dir.x * 120, tgt.x, p), y: lerp(tgt.y - dir.y * 120, tgt.y, p)};
  const tail = {x: tip.x - dir.x * len, y: tip.y - dir.y * len};
  const entry = {x: lerp(tgt.x, tgt.x - dir.x * (tgt.y / dir.y), 1), y: 0};
  const numb = ramp(t, T.numb, 0.4) * (1 - ramp(t, T.answer - 0.1, 0.4));
  return (
    <g>
      {numb > 0.01 && (
        <g opacity={numb}>
          <ellipse cx={entry.x} cy={12} rx={68} ry={30} fill="url(#gv-mint)" />
          {[0, 1, 2].map((i) => {
            const k = (t * 1.3 + i / 3) % 1;
            return <path key={i} d="M 0 -10 C 7 0 8 5 0 9 C -8 5 -7 0 0 -10 Z" transform={`translate(${f1(entry.x - 32 + i * 30)} ${f1(-52 + 56 * k)})`} fill="#7FDCCB" stroke={NAVY} strokeWidth={3} opacity={Math.sin(Math.PI * k) * 0.95} />;
          })}
        </g>
      )}
      <g opacity={a}>
        <path d={`M ${f1(tail.x)} ${f1(tail.y)} L ${f1(tip.x)} ${f1(tip.y)}`} stroke={NAVY} strokeWidth={10} strokeLinecap="round" />
        <path d={`M ${f1(tail.x)} ${f1(tail.y)} L ${f1(tip.x)} ${f1(tip.y)}`} stroke="#E6EDF9" strokeWidth={4.5} strokeLinecap="round" />
        <g transform={`translate(${f1(tail.x)} ${f1(tail.y)}) rotate(${(Math.atan2(dir.y, dir.x) * 180) / Math.PI - 90})`}>
          <rect x={-13} y={-34} width={26} height={34} rx={8} fill="#7FDCCB" stroke={NAVY} strokeWidth={5} />
        </g>
      </g>
    </g>
  );
};

export const ResultCard = ({t}: {t: number}) => {
  const k = ramp(t, T.answer, 0.4) * (1 - ramp(t, E(9) + 0.1, 0.4));
  if (k < 0.01) return null;
  return (
    <g transform={`translate(70 -135) rotate(-4) scale(${(0.7 + 0.3 * k).toFixed(3)})`} opacity={k}>
      <rect x={-62} y={-80} width={124} height={160} rx={18} fill="#fff" stroke={NAVY} strokeWidth={6} />
      <rect x={-26} y={-92} width={52} height={24} rx={9} fill="#C9D3E6" stroke={NAVY} strokeWidth={5} />
      {[-30, -2].map((y) => (
        <path key={y} d={`M -36 ${y} H 36`} stroke="#B9C7E2" strokeWidth={6} strokeLinecap="round" />
      ))}
      <Check x={0} y={42} r={26} a={smooth(clamp01((t - T.answer - 0.3) / 0.3))} />
    </g>
  );
};

/* ---------- cảnh 8: biển phòng khám ---------- */
export const ClinicSign = ({t, x, y}: {t: number; x: number; y: number}) => {
  const k = ramp(t, T.clinic, 0.35) * (1 - ramp(t, E(8) + 0.1, 0.4));
  if (k < 0.01) return null;
  return (
    <g transform={`translate(${f1(x)} ${f1(y)}) scale(${(0.5 + 0.5 * k).toFixed(3)})`} opacity={k}>
      <rect x={-56} y={-52} width={112} height={112} rx={28} fill="#46C2B0" stroke={NAVY} strokeWidth={6.5} />
      <path d="M -20 4 H 20 M 0 -16 V 24" stroke="#fff" strokeWidth={17} strokeLinecap="round" />
      <path d="M -56 -52 L 0 -92 L 56 -52" fill="#FFF1CF" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" />
    </g>
  );
};
