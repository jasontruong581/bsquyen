/* Đạo cụ của V007: lịch lật + khung cửa sổ vàng (cảnh 3), ba biểu tượng triệu chứng (cảnh 4), ánh chớp cắt, trăng ngủ + đồng hồ + cốc thuốc (cảnh 8),
   giọt đỏ + dấu hỏi + biển "ĐI KHÁM" (cảnh 9). Thế giới: toạ độ thế giới; huy hiệu: toạ độ màn hình (y 960–1130, lề phải 160). */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P} from '../../src/timeline';
import {R_L, U_POLYP, pathAt} from './Path';
import {clamp01, smooth} from './Motion';
import {E, S, W} from './timeline';

const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 150}});

/* ---------- ngôi sao lấp lánh ---------- */
export const Sparkle = ({x, y, r, rot = 0, fill = '#FFE266', a = 1}: {x: number; y: number; r: number; rot?: number; fill?: string; a?: number}) => (
  <path
    d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`}
    transform={`translate(${x} ${y}) rotate(${rot})`}
    fill={fill}
    stroke={NAVY}
    strokeWidth={3.5}
    strokeLinejoin="round"
    opacity={a}
  />
);

/* ---------- cảnh 3: lịch lật + cửa sổ vàng ---------- */
export const CAL = (() => {
  const p = pathAt(U_POLYP - 140);
  return {x: p.x, y: p.y - 6};
})();
const FLIP_START = S(3) + 0.25;
const FLIP_END = W(3, 'Khoảng') - 0.3;
const FLIP_N = 5;
const FLIP_DUR = 0.55;

const PageFace = ({mark}: {mark: number}) => (
  <g>
    <rect x={-56} y={-58} width={112} height={126} rx={12} fill="#fff" stroke={NAVY} strokeWidth={6} />
    <path d="M -56 -58 H 56 V -26 H -56 Z" fill={ORANGE} stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
    <text x={0} y={-33} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={25} fill="#fff" letterSpacing={2}>
      NĂM
    </text>
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => {
        const idx = r * 4 + c;
        const on = idx === mark;
        return <rect key={idx} x={-44 + c * 23} y={-12 + r * 26} width={17} height={17} rx={4} fill={on ? '#F26E21' : '#DDE6EE'} />;
      }),
    )}
  </g>
);

export const Calendar = ({t}: {t: number}) => {
  const a = smooth(P(t, S(3) + 0.05, 0.5)) * (1 - smooth(P(t, S(4) - 0.15, 0.4)));
  if (a < 0.01) return null;
  const span = FLIP_END - FLIP_START;
  const k = Math.min(FLIP_N - 1, Math.max(0, Math.floor(((t - FLIP_START) / span) * FLIP_N)));
  const local = ((t - FLIP_START) / span) * FLIP_N - k;
  const flipping = t >= FLIP_START && local < FLIP_DUR / (span / FLIP_N);
  const pf = clamp01(local / (FLIP_DUR / (span / FLIP_N)));
  const done = Math.min(FLIP_N, Math.max(0, Math.floor(((t - FLIP_START) / span) * FLIP_N + 1e-6)));
  const bob = 3 * Math.sin(t * 1.9);
  return (
    <g transform={`translate(${CAL.x.toFixed(1)} ${(CAL.y + bob).toFixed(1)}) scale(${0.6 + 0.4 * a})`} opacity={a}>
      <rect x={-56} y={-50} width={112} height={126} rx={12} fill={NAVY} opacity={0.2} transform="translate(7 10)" />
      {/* trang bên dưới (đã lộ ra) */}
      <PageFace mark={(done + (flipping ? 1 : 0)) % 12} />
      {/* trang đang lật lên bản lề phía trên */}
      {flipping && t >= FLIP_START && (
        <g transform={`translate(0 -58) scale(1 ${Math.max(0.02, Math.cos(pf * Math.PI * 0.5)).toFixed(3)}) translate(0 58)`} opacity={1 - pf * 0.4}>
          <PageFace mark={(done) % 12} />
        </g>
      )}
      {/* hai khuyên treo */}
      {[-26, 26].map((x) => (
        <rect key={x} x={x - 6} y={-70} width={12} height={26} rx={6} fill="#E7EEF4" stroke={NAVY} strokeWidth={5} />
      ))}
    </g>
  );
};

/** Khung "cửa sổ vàng" bao quanh đoạn lịch + polyp, sáng dần ở cuối cảnh 3 */
export const GoldWindow = ({t}: {t: number}) => {
  const a = smooth(P(t, W(3, 'Khoảng') - 0.1, 0.9)) * (1 - smooth(P(t, S(4) + 0.4, 0.8)));
  if (a < 0.01) return null;
  const pc = pathAt(U_POLYP - 62);
  const w = 276;
  const h = 2 * R_L - 6;
  const pulse = 1 + 0.03 * Math.sin(t * 5);
  return (
    <g transform={`translate(${pc.x.toFixed(1)} ${pc.y.toFixed(1)}) scale(${pulse})`} opacity={a}>
      <ellipse cx={0} cy={0} rx={w * 0.75} ry={h * 0.85} fill="url(#g7-glow)" opacity={0.9} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#FFE98A" fillOpacity={0.16} stroke={NAVY} strokeWidth={15} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="none" stroke="#FFC93C" strokeWidth={9} />
      <path d={`M 0 ${-h / 2 + 4} V ${h / 2 - 4} M ${-w / 2 + 4} 0 H ${w / 2 - 4}`} stroke="#FFC93C" strokeOpacity={0.55} strokeWidth={6} strokeLinecap="round" />
      <Sparkle x={-w / 2 + 8} y={-h / 2 + 4} r={20 + 4 * Math.sin(t * 6)} rot={t * 20} />
      <Sparkle x={w / 2 - 6} y={h / 2 - 10} r={16 + 4 * Math.sin(t * 6 + 2)} rot={-t * 20} />
      <Sparkle x={w / 2 - 20} y={-h / 2 + 2} r={11} rot={30} />
    </g>
  );
};

/* ---------- ánh chớp khi thòng lọng cắt ---------- */
export const SnipFlash = ({x, y, k}: {x: number; y: number; k: number}) => {
  if (k <= 0.01) return null;
  return (
    <g opacity={k}>
      <Sparkle x={x} y={y} r={26 + 26 * (1 - k)} rot={45 * (1 - k)} fill="#fff" />
      <Sparkle x={x - 34} y={y - 22} r={13} rot={20} />
      <Sparkle x={x + 30} y={y - 30} r={10} rot={-15} />
    </g>
  );
};

/* ---------- huy hiệu tròn (toạ độ màn hình) ---------- */
const Badge = ({x, y, label, show, children, r = 62}: {x: number; y: number; label: string; show: number; children: React.ReactNode; r?: number}) => {
  if (show <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.min(1.08, show)})`} opacity={Math.min(1, show)}>
      <circle r={r} fill="#fff" fillOpacity={0.96} stroke={NAVY} strokeWidth={6.5} />
      {children}
      <rect x={-84} y={r + 8} width={168} height={42} rx={21} fill="#fff" fillOpacity={0.94} stroke={NAVY} strokeWidth={4} />
      <text x={0} y={r + 38} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={NAVY}>
        {label}
      </text>
    </g>
  );
};

/** Cảnh 4: ba biểu tượng triệu chứng hiện lần lượt rồi mờ. Giọt đỏ nhỏ, không có khối u, không có phân. */
export const SymptomBadges = ({t, frame}: {t: number; frame: number}) => {
  const out = smooth(P(t, E(4) - 0.5, 0.45));
  const items = [
    {x: 250, at: W(4, 'máu'), label: 'Ra máu'},
    {x: 480, at: W(4, 'đau'), label: 'Đau bụng'},
    {x: 710, at: W(4, 'sụt'), label: 'Sụt cân'},
  ];
  const y = 1000;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g opacity={1 - out}>
        {items.map((it, i) => {
          const s = t >= it.at - 0.05 ? sp(frame, it.at, 11) : 0;
          return (
            <Badge key={i} x={it.x} y={y} label={it.label} show={s}>
              {i === 0 && (
                <g>
                  <path d="M 0 -34 C 14 -12 26 0 26 14 C 26 30 14 38 0 38 C -14 38 -26 30 -26 14 C -26 0 -14 -12 0 -34 Z" fill="#D63A3A" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                  <path d="M -12 8 Q -14 22 -4 28" fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={5} strokeLinecap="round" />
                </g>
              )}
              {i === 1 && (
                <g>
                  <path d="M -30 -14 C -30 -34 30 -34 30 -14 C 40 6 28 34 6 36 C -16 38 -38 26 -30 -14 Z" fill="#FFD2B8" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                  <path d="M -12 -4 Q 0 -14 12 -4 M -14 10 Q 0 0 14 10 M -10 22 Q 0 14 10 22" fill="none" stroke="#E0705A" strokeWidth={4.5} strokeLinecap="round" />
                </g>
              )}
              {i === 2 && (
                <g>
                  <rect x={-32} y={-26} width={64} height={52} rx={12} fill="#DDE6EE" stroke={NAVY} strokeWidth={5} />
                  <path d="M -16 -12 A 18 18 0 0 1 16 -12" fill="#fff" stroke={NAVY} strokeWidth={4} />
                  <path d="M 0 -12 L 8 -22" stroke="#D63A3A" strokeWidth={4.5} strokeLinecap="round" />
                  <path d="M 0 36 V 60 M -10 50 L 0 60 L 10 50" transform="translate(0 -20)" fill="none" stroke={ORANGE} strokeWidth={0} />
                </g>
              )}
            </Badge>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------- cảnh 8: trăng ngủ, đồng hồ, cốc làm sạch ruột (toạ độ màn hình) ---------- */
export const SleepBadges = ({t, frame}: {t: number; frame: number}) => {
  const out = smooth(P(t, E(8) - 0.3, 0.4));
  const y = 1000;
  const items = [
    {x: 250, at: W(8, 'ngủ') - 0.1, label: 'Ngủ nhẹ'},
    {x: 480, at: W(8, 'khoảng') - 0.1, label: '20–30 phút'},
    {x: 710, at: W(8, 'thuốc') - 0.1, label: 'Làm sạch ruột'},
  ];
  const ring = smooth(P(t, items[1].at + 0.2, 1.3));
  const zf = (i: number) => (t * 0.9 + i * 0.33) % 1;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g opacity={1 - out}>
        {items.map((it, i) => {
          const s = t >= it.at - 0.05 ? sp(frame, it.at, 11) : 0;
          return (
            <Badge key={i} x={it.x} y={y} label={it.label} show={s}>
              {i === 0 && (
                <g>
                  <path d="M 6 -34 A 34 34 0 1 0 30 18 A 28 28 0 1 1 6 -34 Z" fill="#FFC93C" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                  {[0, 1, 2].map((k) => {
                    const f = zf(k);
                    return (
                      <text key={k} x={22 + k * 12} y={-12 - f * 30 - k * 8} fontFamily={FONT} fontWeight={900} fontSize={18 + k * 6} fill={NAVY} opacity={1 - f}>
                        z
                      </text>
                    );
                  })}
                </g>
              )}
              {i === 1 && (
                <g>
                  <circle r={38} fill="#fff" stroke={NAVY} strokeWidth={5} />
                  <path d={`M 0 -30 A 30 30 0 ${ring * 360 > 180 ? 1 : 0} 1 ${(30 * Math.sin(ring * Math.PI * 1.0)).toFixed(2)} ${(-30 * Math.cos(ring * Math.PI * 1.0)).toFixed(2)}`} fill="none" stroke={ORANGE} strokeWidth={9} strokeLinecap="round" opacity={ring > 0.02 ? 1 : 0} />
                  <path d="M 0 0 V -22 M 0 0 L 14 8" stroke={NAVY} strokeWidth={5} strokeLinecap="round" />
                  <circle r={4} fill={NAVY} />
                </g>
              )}
              {i === 2 && (
                <g>
                  <path d="M -24 -30 H 24 L 18 32 Q 17 38 11 38 H -11 Q -17 38 -18 32 Z" fill="#E6F6FB" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
                  <path d="M -21 -6 H 21 L 18 32 Q 17 38 11 38 H -11 Q -17 38 -18 32 Z" fill="#8FD8EE" />
                  <path d="M 6 -32 L 16 -50" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
                </g>
              )}
            </Badge>
          );
        })}
      </g>
    </svg>
  );
};

/* ---------- cảnh 9: giọt đỏ đơn giản + dấu hỏi (toạ độ màn hình), biển ĐI KHÁM ---------- */
export const Drop = ({x, y, show, t}: {x: number; y: number; show: number; t: number}) => {
  if (show <= 0.01) return null;
  const s = Math.min(1.05, show) * (1 + 0.03 * Math.sin(t * 4));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, show)}>
      <path d="M 0 -44 C 18 -16 34 0 34 20 C 34 40 18 52 0 52 C -18 52 -34 40 -34 20 C -34 0 -18 -16 0 -44 Z" fill="#D63A3A" stroke={NAVY} strokeWidth={6.5} strokeLinejoin="round" />
      <path d="M -17 12 Q -20 30 -6 38" fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

export const QuestionMark = ({x, y, show, t}: {x: number; y: number; show: number; t: number}) => {
  if (show <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y + 4 * Math.sin(t * 3)}) scale(${Math.min(1.05, show)})`} opacity={Math.min(1, show)}>
      <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={96} fill="#FFC93C" stroke={NAVY} strokeWidth={13} paintOrder="stroke" strokeLinejoin="round">
        ?
      </text>
    </g>
  );
};

/** Biển "ĐI KHÁM" cắm trong lòng ruột (toạ độ màn hình) */
export const Sign = ({x, y, show, t}: {x: number; y: number; show: number; t: number}) => {
  if (show <= 0.01) return null;
  const s = Math.min(1.06, show);
  return (
    <g transform={`translate(${x} ${y + 3 * Math.sin(t * 2.6)}) scale(${s})`} opacity={Math.min(1, show)}>
      <rect x={-12} y={34} width={24} height={70} rx={8} fill="#B97B4B" stroke={NAVY} strokeWidth={6} />
      <rect x={-124} y={-40} width={248} height={86} rx={22} fill={ORANGE} stroke={NAVY} strokeWidth={7} />
      <rect x={-112} y={-30} width={224} height={66} rx={16} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} strokeDasharray="10 8" />
      <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#fff" stroke={NAVY} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
        ĐI KHÁM
      </text>
    </g>
  );
};

/** Ô nguyên nhân có thể (cảnh 9): pill + biểu tượng nhỏ + đường nét đứt tới giọt đỏ */
export const CausePill = ({x, y, w, label, show, to, icon}: {x: number; y: number; w: number; label: string; show: number; to: [number, number]; icon: 'tri' | 'khoi'}) => {
  if (show <= 0.01) return null;
  const a = Math.min(1, show);
  const line = clamp01((show - 0.15) / 0.8);
  const x1 = x + w / 2;
  const y1 = y - 4;
  const ex = x1 + (to[0] - x1) * line;
  const ey = y1 + (to[1] - y1) * line;
  return (
    <g opacity={a}>
      <path d={`M ${x1} ${y1} L ${ex} ${ey}`} stroke={NAVY} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" fill="none" />
      <g transform={`translate(${x} ${y}) scale(${Math.min(1.05, show)})`}>
        <rect x={0} y={0} width={w} height={84} rx={42} fill="#fff" fillOpacity={0.96} stroke={NAVY} strokeWidth={6} />
        <circle cx={44} cy={42} r={30} fill="#FFE9E6" stroke={NAVY} strokeWidth={4.5} />
        {icon === 'tri' && (
          <g>
            <circle cx={36} cy={46} r={10} fill="#E98F9A" stroke={NAVY} strokeWidth={3.5} />
            <circle cx={52} cy={46} r={10} fill="#E98F9A" stroke={NAVY} strokeWidth={3.5} />
            <path d="M 28 34 H 60" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        {icon === 'khoi' && (
          <g>
            <path d="M 28 52 C 28 28 60 28 60 52 Z" fill="url(#g7-poly)" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
            <path d="M 24 52 H 64" stroke={NAVY} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        <text x={88} y={54} fontFamily={FONT} fontWeight={800} fontSize={32} fill={NAVY}>
          {label}
        </text>
      </g>
    </g>
  );
};
