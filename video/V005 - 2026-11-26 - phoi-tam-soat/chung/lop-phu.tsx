/* Lớp phủ 2D dùng chung cho bản 3D và bản 2D của V005: nhãn, phụ đề, hai thẻ (cảnh 4 và 9), hai ô X-quang/CT (cảnh 6),
   khuôn mặt máy CT, bong bóng, nhãn "sẹo cũ", khuôn mặt phổi ở cảnh cuối, màn kết, âm thanh.
   Mỗi bản dựng cảnh nền riêng và chỉ cần cung cấp các điểm neo (`Anchors`) để lớp phủ bám vào đúng chỗ trên màn hình. */
import {AbsoluteFill, spring} from 'remotion';
import {BigLabel, Captions, FONT, NAVY, ORANGE, Outro, Watermark} from '../../src/common/overlays';
import {RIGHT_EDGE, SAFE} from '../../src/common/layout';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P} from '../../src/timeline';
import {CARD1, CARD2, CT_LINES, NODE_NEUTRAL_AT, PANELS, SCAR, T_NODE, W, WE, E, S, clamp01, ctMood, quiet, smooth, timeline, type CtMood} from './timeline';

/* ---------- điểm neo do cảnh nền cung cấp ---------- */
export type Pt = {x: number; y: number};
export type Anchors = {
  /** Tâm mặt máy CT, `u` = điểm ảnh trên một đơn vị (1 đơn vị = nửa chiều cao dải máy khoảng 0,78); null = máy CT không hiện */
  ct: (Pt & {u: number}) | null;
  /** Vị trí nốt phổi trên màn hình (null = ngoài khung) */
  nodule: (Pt & {u: number}) | null;
  /** Mắt trái, mắt phải, miệng của khuôn mặt phổi ở cảnh cuối */
  face: {eyeL: Pt; eyeR: Pt; mouth: Pt; u: number} | null;
  /** Tâm hai phổi trên màn hình, để đặt dấu tích */
  lungs: Pt & {u: number};
};

const WHITE = '#ffffff';
const GOLD = '#FFC93C';
const TEAL = '#1FAE9B';

/** Độ mờ phần cảnh nền khi có thẻ hoặc ô so sánh đang hiện (0..1) */
export const dimAt = (t: number) => {
  const pulse = (from: number, to: number) => smooth(P(t, from, 0.35, (x) => x)) * (1 - smooth(P(t, to - 0.3, 0.35, (x) => x)));
  return Math.max(pulse(CARD1.from, CARD1.to), pulse(CARD2.from, CARD2.to), pulse(PANELS.from, PANELS.to));
};

/* Cỡ chữ nhãn lớn vừa khung: chữ in hoa viền dày rộng khoảng 0,8 × cỡ chữ mỗi ký tự; giữ bề ngang ≤ 940px (lề ≥ 70px mỗi bên) */
const fitSize = (text: string, max = 104) => Math.min(max, Math.floor(940 / (text.length * 0.8)));

/* ---------- câu mở đầu: hiện ngay khung đầu ---------- */
const HOOK = 'PHỔI KHÔNG BÁO ĐAU';
const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = E(1) + 0.15;
  if (t > end) return null;
  const s = spring({frame: frame + 10, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  return <BigLabel text={HOOK} size={fitSize(HOOK)} scale={s * (1 - out) * (1 + 0.02 * Math.sin(t * 9))} opacity={1 - out} />;
};

/* ---------- nhãn lớn theo kịch bản: cùng nhịp với Labels dùng chung nhưng cỡ chữ vừa khung ---------- */
const FitLabels = ({t, frame}: {t: number; frame: number}) => {
  const labels = timeline.scenes.flatMap((s) => s.labels.map((l) => ({...l, sceneEnd: s.start + s.dur})));
  return (
    <>
      {labels.map((l, i) => {
        const next = labels[i + 1]?.t ?? Infinity;
        const end = Math.min(l.t + 2.6, next - 0.1, l.sceneEnd + 0.2);
        if (t < l.t - 0.05 || t > end) return null;
        const s = spring({frame: frame - Math.round(l.t * FPS), fps: FPS, config: {damping: 11, stiffness: 160}});
        const out = P(t, end - 0.25, 0.25);
        return <BigLabel key={i} text={l.text} size={fitSize(l.text)} scale={s * (1 - out)} opacity={1 - out} />;
      })}
    </>
  );
};

/* ---------- công thức gói-năm nổi trong cảnh (cảnh 3) ---------- */
const Pill = ({children, y, a, size = 54}: {children: React.ReactNode; y: number; a: number; size?: number}) => (
  <div style={{position: 'absolute', left: 60, right: SAFE.rightMargin, top: y, display: 'flex', justifyContent: 'center', opacity: a, transform: `translateY(${(1 - a) * 24}px) scale(${0.9 + 0.1 * a})`}}>
    <div style={{background: 'rgba(255,255,255,0.96)', border: `6px solid ${NAVY}`, borderRadius: 40, padding: '14px 34px', fontFamily: FONT, fontWeight: 900, fontSize: size, color: NAVY, boxShadow: '0 10px 28px rgba(18,59,99,0.25)', whiteSpace: 'nowrap'}}>{children}</div>
  </div>
);
const Equation = ({t}: {t: number}) => {
  const a1 = smooth(P(t, W(3, 'số'), 0.3, (x) => x)) * (1 - smooth(P(t, W(3, 'Một') - 0.15, 0.3, (x) => x)));
  const a2 = smooth(P(t, W(3, 'Một'), 0.3, (x) => x));
  const a3 = smooth(P(t, W(3, '20', 1), 0.3, (x) => x));
  const gone = 1 - smooth(P(t, E(3) + 0.15, 0.35, (x) => x));
  return (
    <>
      <Pill y={470} a={a1 * gone} size={46}>
        <span style={{color: ORANGE}}>bao/ngày</span> × <span style={{color: ORANGE}}>số năm hút</span>
      </Pill>
      <Pill y={470} a={a2 * gone} size={56}>
        1 bao × 20 năm
      </Pill>
      <Pill y={620} a={a3 * gone} size={62}>
        = <span style={{color: ORANGE}}>20 gói-năm</span>
      </Pill>
    </>
  );
};

/* ---------- biểu tượng nhỏ cho thẻ ---------- */
const Ic = ({kind}: {kind: 'lich' | 'bao' | 'thuoc' | 'ho' | 'mau' | 'tho'}) => {
  const c = {fill: 'none', stroke: NAVY, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={44} cy={44} r={40} fill={kind === 'mau' ? '#FFD9D4' : '#FFF1D6'} stroke={NAVY} strokeWidth={5} />
      {kind === 'lich' && (
        <g {...c}>
          <rect x={24} y={28} width={40} height={36} rx={7} fill="#fff" />
          <path d="M24 40 H64 M35 22 V32 M53 22 V32" />
          <circle cx={36} cy={52} r={2.5} fill={NAVY} />
          <circle cx={52} cy={52} r={2.5} fill={NAVY} />
        </g>
      )}
      {kind === 'bao' && (
        <g {...c}>
          <rect x={27} y={26} width={34} height={42} rx={6} fill="#fff" />
          <path d="M27 40 H61" />
          <path d="M36 50 H52 M36 58 H46" />
        </g>
      )}
      {kind === 'thuoc' && (
        <g {...c}>
          <rect x={20} y={39} width={36} height={11} rx={4} fill="#fff" />
          <path d="M56 39 V50" stroke={ORANGE} />
          <path d="M64 38 C 70 32 62 28 68 22 M70 44 C 78 38 70 34 76 28" />
        </g>
      )}
      {kind === 'ho' && (
        <g {...c}>
          <path d="M30 50 C 30 34 52 34 52 50 C 52 62 40 66 34 60" fill="#fff" />
          <path d="M58 32 L66 26 M60 44 H70 M58 56 L66 62" />
        </g>
      )}
      {kind === 'mau' && (
        <g {...c}>
          <path d="M44 20 C 56 36 62 44 62 54 A18 18 0 0 1 26 54 C 26 44 32 36 44 20 Z" fill="#E4453C" />
        </g>
      )}
      {kind === 'tho' && (
        <g {...c}>
          <path d="M32 30 C 22 40 20 58 28 66 C 36 70 40 62 40 54 V32 Z" fill="#fff" />
          <path d="M56 30 C 66 40 68 58 60 66 C 52 70 48 62 48 54 V32 Z" fill="#fff" />
          <path d="M44 22 V44" />
        </g>
      )}
    </svg>
  );
};

type Row = {icon: Parameters<typeof Ic>[0]['kind']; text: string; sub?: string; at: number};
const Card = ({t, frame, from, to, title, rows, foot}: {t: number; frame: number; from: number; to: number; title: string; rows: Row[]; foot?: string}) => {
  if (t < from - 0.05 || t > to + 0.1) return null;
  const a = smooth(P(t, from, 0.35, (x) => x)) * (1 - smooth(P(t, to - 0.3, 0.35, (x) => x)));
  return (
    <div style={{position: 'absolute', left: 70, width: RIGHT_EDGE - 70, top: 520, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, background: 'rgba(255,255,255,0.97)', border: `7px solid ${NAVY}`, borderRadius: 44, padding: '24px 30px 22px', boxShadow: '0 16px 40px rgba(18,59,99,0.28)'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, color: ORANGE, letterSpacing: 1, marginBottom: 10}}>{title}</div>
      {rows.map((r, i) => {
        const s = spring({frame: frame - Math.round(r.at * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
        const on = t >= r.at ? 1 : 0;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '10px 0', opacity: 0.25 + 0.75 * on, transform: `scale(${on ? 0.9 + 0.1 * s : 0.96})`, transformOrigin: 'left center'}}>
            <Ic kind={r.icon} />
            <div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: NAVY, lineHeight: 1.12}}>{r.text}</div>
              {r.sub && <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 27, color: '#5b6b7b', marginTop: 4}}>{r.sub}</div>}
            </div>
          </div>
        );
      })}
      {foot && <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#5b6b7b', marginTop: 8}}>{foot}</div>}
    </div>
  );
};

/* ---------- hai ô so sánh X-quang / CT (cảnh 6) ---------- */
const Panels = ({t, frame}: {t: number; frame: number}) => {
  if (t < PANELS.from - 0.05 || t > PANELS.to + 0.2) return null;
  const a = smooth(P(t, PANELS.from, 0.4, (x) => x)) * (1 - smooth(P(t, PANELS.to - 0.1, 0.3, (x) => x)));
  const hideAt = W(6, 'tim');
  const hid = smooth(P(t, hideAt - 0.1, 0.5, (x) => x));
  const ctHi = smooth(P(t, W(6, 'CT'), 0.4, (x) => x));
  const pulse = 1 + 0.12 * Math.sin(t * 6);
  const R = 190;
  const circle = (cx: number, key: string, kids: React.ReactNode, label: string) => (
    <g key={key} transform={`translate(${cx} 880)`}>
      <circle r={R + 12} fill="#fff" stroke={NAVY} strokeWidth={7} />
      <clipPath id={`cp-${key}`}>
        <circle r={R} />
      </clipPath>
      <g clipPath={`url(#cp-${key})`}>{kids}</g>
      <rect x={-170} y={R + 30} width={340} height={52} rx={26} fill="#fff" stroke={NAVY} strokeWidth={5} />
      <text y={R + 67} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={29} fill={NAVY}>
        {label}
      </text>
    </g>
  );
  /* X-quang: phim phẳng, xương sườn và tim chồng lên nốt nhỏ */
  const ribs = [-120, -80, -40, 0, 40, 80, 120].map((y, i) => (
    <g key={i} fill="none" stroke="#d8dde3" strokeWidth={14} strokeLinecap="round" opacity={0.55 + 0.35 * hid}>
      <path d={`M -150 ${y + 28} Q -85 ${y - 12} -20 ${y + 12}`} />
      <path d={`M 150 ${y + 28} Q 85 ${y - 12} 20 ${y + 12}`} />
    </g>
  ));
  const xray = (
    <>
      <rect x={-R} y={-R} width={2 * R} height={2 * R} fill="#2b3340" />
      <ellipse cx={-80} cy={-5} rx={80} ry={140} fill="#46505f" />
      <ellipse cx={80} cy={-5} rx={80} ry={140} fill="#46505f" />
      <rect x={-12} y={-170} width={24} height={340} fill="#9aa3ad" opacity={0.5} />
      {ribs}
      <ellipse cx={-20} cy={55} rx={70} ry={78} fill="#aab2bc" opacity={0.35 + 0.5 * hid} />
      <circle cx={-90} cy={55} r={10 * pulse} fill={ORANGE} opacity={0.9 - 0.7 * hid} />
    </>
  );
  /* CT: lát cắt ngang, nốt hiện rõ */
  const ct = (
    <>
      <rect x={-R} y={-R} width={2 * R} height={2 * R} fill="#1c222b" />
      <ellipse cx={0} cy={0} rx={165} ry={120} fill="#4a525c" stroke="#9aa3ad" strokeWidth={8} />
      <ellipse cx={-78} cy={-4} rx={68} ry={92} fill="#0d1117" />
      <ellipse cx={78} cy={-4} rx={68} ry={92} fill="#0d1117" />
      <ellipse cx={-4} cy={18} rx={34} ry={44} fill="#7b8590" />
      <circle cx={0} cy={86} r={13} fill="#c9d0d7" />
      <circle cx={-95} cy={32} r={(8 + 4 * ctHi) * pulse} fill={ORANGE} />
      <circle cx={-95} cy={32} r={(22 + 8 * ctHi) * pulse} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.4 + 0.5 * ctHi} />
    </>
  );
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a, transform: `scale(${0.92 + 0.08 * a})`, transformOrigin: '490px 880px'}}>
      {circle(270, 'xq', xray, 'X-quang: chồng lớp')}
      {circle(690, 'ct', ct, 'CT: từng lát cắt')}
    </svg>
  );
};

/* ---------- khuôn mặt máy CT: vẽ theo đơn vị thế giới (u = điểm ảnh/đơn vị), gốc ở tâm dải máy ---------- */
const CtFace = ({t, p, mood}: {t: number; p: Anchors['ct']; mood: CtMood}) => {
  if (!p) return null;
  const blink = t % 3.3 > 3.18;
  const look = mood === 'tn' ? 0.1 : 0;
  const stroke = {fill: 'none', stroke: NAVY, strokeWidth: 0.075, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  const Eye = ({x}: {x: number}) =>
    blink ? (
      <path d={`M ${x - 0.2} 0 H ${x + 0.2}`} {...stroke} />
    ) : (
      <g>
        <ellipse cx={x} cy={0} rx={0.25} ry={0.29} fill="#fff" stroke={NAVY} strokeWidth={0.07} />
        <circle cx={x + (mood === 'lem' ? 0.05 : 0)} cy={look} r={0.14} fill={NAVY} />
        <circle cx={x + 0.05} cy={look - 0.06} r={0.045} fill="#fff" />
      </g>
    );
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.u})`}>
      <g transform="translate(0 -0.12)">
        <Eye x={-0.55} />
        <Eye x={0.55} />
        {mood === 'lem' && <path d="M -0.8 -0.4 L -0.35 -0.34 M 0.35 -0.42 Q 0.55 -0.55 0.8 -0.4" {...stroke} />}
        {mood === 'tn' && <path d="M -0.8 -0.36 L -0.32 -0.4 M 0.32 -0.4 L 0.8 -0.36" {...stroke} />}
      </g>
      {mood === 'lem' && <path d="M -0.3 0.3 Q 0 0.58 0.3 0.28" {...stroke} />}
      {mood === 'cuoi' && <path d="M -0.34 0.26 Q 0 0.66 0.34 0.26" {...stroke} fill="#fff" />}
      {mood === 'tn' && <path d="M -0.2 0.36 H 0.2" {...stroke} />}
      {mood !== 'tn' && (
        <g opacity={0.6}>
          <circle cx={-0.85} cy={0.22} r={0.11} fill="#FF8FA3" />
          <circle cx={0.85} cy={0.22} r={0.11} fill="#FF8FA3" />
        </g>
      )}
    </g>
  );
};

/** Bong bóng của máy CT nằm dưới dải máy, đuôi chỉ lên mặt */
const CtBubble = ({t, frame, p}: {t: number; frame: number; p: Anchors['ct']}) => {
  if (!p) return null;
  return (
    <>
      {CT_LINES.map((l, i) => {
        if (t < l.at - 0.02 || t > l.at + l.dur + 0.25) return null;
        const s = spring({frame: frame - Math.round(l.at * FPS), fps: FPS, config: {damping: 10, stiffness: 190}});
        const out = P(t, l.at + l.dur, 0.25);
        const w = Math.round(l.text.length * 25 + 90);
        const h = 104;
        const bx = Math.max(50, Math.min(RIGHT_EDGE - w, p.x - w / 2));
        const by = p.y + p.u * 0.95 + 40;
        const tailX = Math.max(bx + 46, Math.min(bx + w - 46, p.x));
        const r = 34;
        const tipY = by - 36;
        const d = `M ${bx + r} ${by} H ${tailX - 22} L ${tailX} ${tipY} L ${tailX + 22} ${by} H ${bx + w - r} Q ${bx + w} ${by} ${bx + w} ${by + r} V ${by + h - r} Q ${bx + w} ${by + h} ${bx + w - r} ${by + h} H ${bx + r} Q ${bx} ${by + h} ${bx} ${by + h - r} V ${by + r} Q ${bx} ${by} ${bx + r} ${by} Z`;
        return (
          <svg key={i} width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out, transformOrigin: `${tailX}px ${tipY}px`, transform: `scale(${s * (l.size ?? 1) * (1 - 0.2 * out)})`}}>
            <path d={d} fill="#fff" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
            <text x={bx + w / 2} y={by + h / 2 + 16} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={46} fill={NAVY}>
              {l.text}
            </text>
          </svg>
        );
      })}
    </>
  );
};

/* ---------- nốt phổi: vầng sáng nhỏ ở lát cắt (cảnh 5), nhãn "sẹo cũ" + lịch hẹn (cảnh 7) ---------- */
export const NODULE_ORANGE = '#FF8A1F';
export const NODULE_NEUTRAL = '#9FB0C0';

const ScarTag = ({t, frame, p}: {t: number; frame: number; p: Anchors['nodule']}) => {
  if (!p || t < SCAR.from - 0.05 || t > SCAR.to + 0.1) return null;
  const a = smooth(P(t, SCAR.from, 0.35, (x) => x)) * (1 - smooth(P(t, SCAR.to - 0.2, 0.3, (x) => x)));
  const at = W(7, 'sẹo');
  const s = spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
  // hai nhãn nằm phía trên nốt (phía dưới là phụ đề); "sẹo cũ" sát nốt, "hẹn chụp lại" nằm trên nó
  const x1 = Math.max(60, Math.min(RIGHT_EDGE - 340, p.x - 60));
  const y1 = p.y - 250;
  const lich = spring({frame: frame - Math.round(W(7, 'hẹn') * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      <path d={`M ${p.x} ${p.y - 18} L ${x1 + 60} ${y1 + 92 + 64 + 4}`} stroke={NAVY} strokeWidth={4} strokeDasharray="8 8" />
      <g transform={`translate(${x1} ${y1 + 92}) scale(${t >= at ? 0.85 + 0.15 * s : 0.001})`}>
        <rect x={0} y={0} width={270} height={64} rx={32} fill="#fff" stroke={NAVY} strokeWidth={5} />
        <text x={135} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={NAVY}>
          sẹo cũ
        </text>
      </g>
      <g transform={`translate(${x1} ${y1}) scale(${t >= W(7, 'hẹn') ? 0.85 + 0.15 * lich : 0.001})`}>
        <rect x={0} y={0} width={340} height={64} rx={32} fill="#fff" stroke={NAVY} strokeWidth={5} />
        <g transform="translate(14 8)" fill="none" stroke={NAVY} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <rect x={4} y={8} width={38} height={34} rx={7} fill="#fff" />
          <path d="M4 20 H42 M14 4 V12 M32 4 V12" />
          <path d="M14 32 L20 38 L32 25" stroke={TEAL} />
        </g>
        <text x={200} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill={NAVY}>
          hẹn chụp lại
        </text>
      </g>
    </svg>
  );
};

/* ---------- khuôn mặt phổi ở cảnh cuối ---------- */
const LungFace = ({t, p}: {t: number; p: Anchors['face']}) => {
  const a = smooth(P(t, S(10) + 0.5, 0.6, (x) => x)) * (1 - smooth(P(t, E(10) + 0.2, 0.4, (x) => x)));
  if (!p || a <= 0.01) return null;
  const blink = t % 3.4 > 3.28;
  const stroke = {fill: 'none', stroke: NAVY, strokeWidth: 0.07, strokeLinecap: 'round' as const};
  const eye = (q: Pt, k: string) => (
    <g key={k} transform={`translate(${q.x} ${q.y}) scale(${p.u})`}>
      {blink ? (
        <path d="M -0.2 0 H 0.2" {...stroke} />
      ) : (
        <>
          <ellipse cx={0} cy={0} rx={0.22} ry={0.27} fill="#fff" stroke={NAVY} strokeWidth={0.06} />
          <circle cx={0.03} cy={0.03} r={0.13} fill={NAVY} />
          <circle cx={0.08} cy={-0.03} r={0.04} fill="#fff" />
        </>
      )}
    </g>
  );
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: a}}>
      {eye(p.eyeL, 'l')}
      {eye(p.eyeR, 'r')}
      <g transform={`translate(${p.mouth.x} ${p.mouth.y}) scale(${p.u})`}>
        <path d="M -0.42 0 Q 0 0.5 0.42 0" {...stroke} fill="#fff" />
        <circle cx={-0.95} cy={-0.05} r={0.13} fill="#FF6F91" opacity={0.7} />
        <circle cx={0.95} cy={-0.05} r={0.13} fill="#FF6F91" opacity={0.7} />
      </g>
    </svg>
  );
};

/* ---------- dấu tích (cảnh 8): "đúng người, đúng nhịp" ---------- */
const Tick = ({t, frame, p}: {t: number; frame: number; p: Anchors['lungs']}) => {
  const at = W(8, 'Hãy') - 0.15;
  const end = E(8) + 0.1;
  if (t < at || t > end + 0.4) return null;
  const s = spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping: 11, stiffness: 160}});
  const out = smooth(P(t, end, 0.35, (x) => x));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <g transform={`translate(${p.x + 250} ${p.y - 120}) scale(${s})`}>
        <circle r={62} fill={TEAL} stroke={NAVY} strokeWidth={7} />
        <path d="M -26 2 L -8 22 L 28 -20" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/* ---------- âm thanh: im lặng quanh nốt phổi (xem QUIET) ---------- */
export const sfxList = (extra: Sfx[]): Sfx[] => {
  const all: Sfx[] = [
    {t: 0.4, src: 'sfx/whoosh-02.wav', v: 0.22},
    {t: S(3) - 0.2, src: 'sfx/riser-01.wav', v: 0.18},
    {t: CARD1.from, src: 'sfx/whoosh-02.wav', v: 0.25},
    {t: W(4, '50'), src: 'sfx/click-01.wav', v: 0.25},
    {t: W(4, '20'), src: 'sfx/click-01.wav', v: 0.25},
    {t: W(4, 'đang'), src: 'sfx/click-01.wav', v: 0.25},
    {t: S(5) + 0.1, src: 'sfx/whoosh-02.wav', v: 0.28},
    {t: T_NODE, src: 'sfx/ping-01.wav', v: 0.18},
    {t: NODE_NEUTRAL_AT, src: 'sfx/ping-01.wav', v: 0.2},
    {t: E(7) + 0.2, src: 'sfx/ding-01.wav', v: 0.3},
    {t: W(8, 'Hãy') - 0.1, src: 'sfx/ding-01.wav', v: 0.3},
    {t: CARD2.from, src: 'sfx/whoosh-02.wav', v: 0.25},
    {t: S(10) + 0.5, src: 'sfx/pop-03.wav', v: 0.4},
    ...CT_LINES.map((l) => ({t: l.at, src: 'sfx/pop-03.wav', v: 0.4})),
    ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
    ...extra,
  ];
  return all.filter((x) => !quiet(x.t, 0.1));
};

/* ---------- lớp phủ hoàn chỉnh ---------- */
export const PhoiOverlay = ({t, frame, a, sfx}: {t: number; frame: number; a: Anchors; sfx: Sfx[]}) => {
  const mood = ctMood(t);
  const dim = dimAt(t);
  const R1 = [
    {icon: 'lich', text: '50–80 tuổi', at: W(4, '50') - 0.1},
    {icon: 'bao', text: 'Từ 20 gói-năm trở lên', at: W(4, '20') - 0.1},
    {icon: 'thuoc', text: 'Đang hút hoặc đã bỏ thuốc', sub: 'USPSTF: chưa bỏ quá 15 năm', at: W(4, 'đang') - 0.1},
  ] as Row[];
  const R2 = [
    {icon: 'ho', text: 'Ho kéo dài trên 3 tuần', at: W(9, 'ho') - 0.05},
    {icon: 'mau', text: 'Ho ra máu', at: W(9, 'máu') - 0.3},
    {icon: 'tho', text: 'Khó thở hoặc đau ngực kéo dài', at: W(9, 'khám') - 0.2},
  ] as Row[];
  return (
    <AbsoluteFill>
      {dim > 0.001 && <div style={{position: 'absolute', inset: 0, background: `rgba(238,247,255,${0.5 * dim})`}} />}
      <Hook t={t} frame={frame} />
      <Equation t={t} />
      <Card t={t} frame={frame} from={CARD1.from} to={CARD1.to} title="NÊN CHỤP MỖI NĂM NẾU" rows={R1} foot="Nguồn: USPSTF 2021, ACS" />
      <Card t={t} frame={frame} from={CARD2.from} to={CARD2.to} title="ĐI KHÁM NGAY NẾU CÓ" rows={R2} foot="Đừng đợi tới lịch chụp" />
      <Panels t={t} frame={frame} />
      <ScarTag t={t} frame={frame} p={a.nodule} />
      <Tick t={t} frame={frame} p={a.lungs} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <CtFace t={t} p={a.ct} mood={mood} />
      </svg>
      <CtBubble t={t} frame={frame} p={a.ct} />
      <LungFace t={t} p={a.face} />
      <FitLabels t={t} frame={frame} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
