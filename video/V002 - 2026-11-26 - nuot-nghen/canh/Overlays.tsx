/* Lớp phủ riêng của video V002: câu mở đầu, hai ô so sánh (cảnh 6), tích xanh "lành tính" (cảnh 7), bậc thang nghẹn tăng dần (cảnh 8),
   đồng hồ và tích "biết chắc" của nội soi (cảnh 9), cốc trà nguội dần (cảnh 10). Toạ độ là toạ độ màn hình 1080x1920. */
import {spring} from 'remotion';
import {BigLabel, FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P, lerp} from '../../src/timeline';
import {Com} from './Com';
import {tubeD} from './geometry';
import {SKIN} from './World';
import {S, W, WE} from './timeline';

const LUMEN = '#F9C6C6';
const GREEN = '#2E9E6A';
const RUST = '#C2410C';
const sp = (frame: number, at: number, damping = 12) => spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping, stiffness: 170}});

/* ---------- chữ lớn ngay khung đầu (spring chạy trước vài khung nên khung 0 đã hiện) ---------- */
export const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = S(2) - 0.45;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="NUỐT = VƯỢT CHƯỚNG NGẠI" size={56} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

/* ---------- nền mờ phủ lên thế giới giải phẫu khi có thẻ/bảng ---------- */
export const Veil = ({t}: {t: number}) => {
  const a = Math.max(
    P(t, S(6) - 0.15, 0.3) * (1 - P(t, S(7) - 0.25, 0.25)),
    P(t, S(8) - 0.2, 0.3) * (1 - P(t, S(9) - 0.35, 0.3)),
    P(t, S(10) - 0.15, 0.35),
  );
  if (a <= 0.001) return null;
  return <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)', opacity: 0.97 * a}} />;
};

/* ---------- cảnh 6: hai ô so sánh ---------- */
const Card = ({x, spr, title, children}: {x: number; spr: number; title: string; children: React.ReactNode}) => (
  <div style={{position: 'absolute', left: x, top: 430, width: 420, height: 690, transform: `scale(${spr}) translateY(${(1 - spr) * 60}px)`, transformOrigin: '50% 50%', opacity: Math.min(1, spr * 1.4)}}>
    <svg width={420} height={690} viewBox="0 0 420 690">
      <rect x={0} y={0} width={420} height={690} rx={38} fill="#fff" opacity={0.97} />
      <text x={210} y={68} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={NAVY}>
        {title}
      </text>
      {children}
    </svg>
  </div>
);

export const Cards = ({t, frame}: {t: number; frame: number}) => {
  const a = S(6) + 0.1;
  const end = S(7) - 0.3;
  if (t < a - 0.05 || t > end + 0.3) return null;
  const out = 1 - P(t, end, 0.25);
  const s1 = sp(frame, a) * out;
  const s2 = sp(frame, a + 0.25) * out;
  // cơm bên trái: trượt xuống đều đều, không vướng
  const cyc = ((t - a) % 2.4) / 2.2;
  const cy = lerp(175, 505, Math.min(1, Math.max(0, cyc)) ** 0.85);
  const wob = Math.sin(t * 20) * 3;
  return (
    <>
      <Card x={60} spr={s1} title="VƯỚNG Ở CỔ">
        <rect x={90} y={105} width={240} height={470} rx={36} fill={SKIN} stroke={NAVY} strokeWidth={6} />
        <path d={tubeD(210, 118, 562, [], 58, 6)} fill={LUMEN} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={300} cy={205} r={34} fill="rgba(138,111,209,0.22)" stroke="#8A6FD1" strokeWidth={5} strokeDasharray="9 9" />
        <path d="M 288 205 q 6 -10 12 0 t 12 0" fill="none" stroke="#8A6FD1" strokeWidth={5} strokeLinecap="round" />
        <Com x={210} y={cy} scale={0.85} mood="vui" t={t} />
        <rect x={50} y={606} width={320} height={58} rx={29} fill="#E3F5EC" />
        <text x={210} y={646} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={GREEN}>
          ✓ Ăn vẫn trôi
        </text>
      </Card>
      <Card x={500} spr={s2} title="NGHẸN THẬT">
        <rect x={90} y={105} width={240} height={470} rx={36} fill={SKIN} stroke={NAVY} strokeWidth={6} />
        <path d={tubeD(210, 118, 562, [{y: 420, k: 0.72, s: 32}, {y: 250, k: 0.3, s: 40}], 58, 6)} fill={LUMEN} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
        <Com x={210 + wob} y={352} scale={0.85} mood="lo" t={t} rot={wob * 0.8} />
        <rect x={50} y={606} width={320} height={58} rx={29} fill="#FBE4D6" />
        <text x={210} y={646} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={RUST}>
          ✕ Cơm bị kẹt
        </text>
      </Card>
    </>
  );
};

/* ---------- cảnh 7: tích xanh "lành tính" ---------- */
export const GoodBadge = ({t, frame}: {t: number; frame: number}) => {
  const a = W(7, 'lành') - 0.05;
  const end = S(8) - 0.35;
  if (t < a || t > end + 0.3) return null;
  const s = sp(frame, a, 10) * (1 - P(t, end, 0.25));
  return (
    <div style={{position: 'absolute', left: 60, top: 450, display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 40, padding: '14px 34px 14px 18px', boxShadow: '0 8px 26px rgba(18,59,99,0.18)', transform: `scale(${s})`, transformOrigin: '0 50%'}}>
      <div style={{width: 68, height: 68, borderRadius: 34, background: GREEN, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: GREEN}}>lành tính</div>
    </div>
  );
};

/* ---------- cảnh 8: ba biểu tượng lần lượt bị chặn theo bậc thang tăng dần ---------- */
const COLS = [
  {cx: 300, step: 960, pinch: 38, fill: '#FBE3D1', name: 'Thịt', at: () => W(8, 'thịt'), rest: 80},
  {cx: 530, step: 900, pinch: 24, fill: '#F2B98C', name: 'Cơm mềm', at: () => W(8, 'cơm'), rest: 68},
  {cx: 760, step: 840, pinch: 10, fill: '#E8A06A', name: 'Cháo', at: () => W(8, 'cháo'), rest: 56},
] as const;

const Meat = () => (
  <g>
    <path d="M -45 -10 C -45 -40 -10 -38 10 -36 C 40 -34 48 -8 44 14 C 40 38 10 40 -14 36 C -40 32 -46 14 -45 -10 Z" fill="#C46A4E" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -24 -10 q 14 12 30 2 M -14 14 q 14 6 28 -4" fill="none" stroke="#F2B9A6" strokeWidth={6} strokeLinecap="round" />
  </g>
);
const RiceLump = () => (
  <g fill="#fff" stroke={NAVY} strokeWidth={4.5}>
    <circle cx={-18} cy={6} r={25} />
    <circle cx={18} cy={8} r={25} />
    <circle cx={0} cy={-14} r={25} />
    <path d="M -22 4 q 3 -4 7 0 M 14 8 q 3 -4 7 0 M -4 -16 q 3 -4 7 0" fill="none" stroke="#C5CFDA" strokeWidth={3.5} strokeLinecap="round" />
  </g>
);
const Porridge = () => (
  <g stroke={NAVY} strokeWidth={4.5}>
    <path d="M -40 12 C -40 -14 -16 -26 0 -26 C 18 -26 40 -14 40 12 C 40 24 -40 24 -40 12 Z" fill="#F1DFB8" />
    <path d="M -14 -4 q 4 -3 8 0 M 8 -8 q 4 -3 8 1 M 14 6 q 4 -3 8 0" fill="none" stroke="#D9C28E" strokeWidth={3.5} strokeLinecap="round" />
    <ellipse cx={-6} cy={-38} rx={5} ry={7} fill="#F1DFB8" strokeWidth={3} />
    <ellipse cx={14} cy={-46} rx={4} ry={6} fill="#F1DFB8" strokeWidth={3} />
  </g>
);

export const Stairs = ({t, frame}: {t: number; frame: number}) => {
  const a = S(8) + 0.05;
  const end = S(9) - 0.35;
  if (t < a - 0.05 || t > end + 0.35) return null;
  const out = 1 - P(t, end, 0.3);
  const panel = sp(frame, a, 14) * out;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: Math.min(1, panel * 1.3)}}>
      <g transform={`translate(540 765) scale(${0.9 + 0.1 * panel}) translate(-540 -765)`}>
        <rect x={40} y={420} width={890} height={690} rx={44} fill="#fff" opacity={0.97} />
        {COLS.map((c, i) => {
          const bottom = c.step - 16;
          const top = bottom - 330;
          const yp = top + 200;
          const land = c.at() + 0.2;
          const start = c.at() - 0.45;
          const drop = P(t, start, land - start, (x) => x * x);
          const restY = yp - c.rest;
          const foodY = lerp(top + 30, restY, drop) - 8 * Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - land) / 0.35)) * Math.PI));
          const badge = sp(frame, land + 0.05, 9);
          const show = P(t, a + i * 0.1, 0.3);
          return (
            <g key={c.name} opacity={show}>
              <path d={`M ${c.cx - 115} 1060 V ${c.step + 28} Q ${c.cx - 115} ${c.step} ${c.cx - 87} ${c.step} H ${c.cx + 87} Q ${c.cx + 115} ${c.step} ${c.cx + 115} ${c.step + 28} V 1060 Z`} fill={c.fill} stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
              <text x={c.cx} y={c.step + 62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={NAVY}>
                {c.name}
              </text>
              <rect x={c.cx - 72} y={top} width={144} height={bottom - top} rx={32} fill="#EBA8A8" stroke={NAVY} strokeWidth={6} />
              <path d={tubeD(c.cx, top + 14, bottom - 14, [{y: yp, k: 1 - c.pinch / 52, s: 38}], 52, 6)} fill="#FCE6E6" stroke={NAVY} strokeWidth={4} strokeLinejoin="round" />
              {t >= start && (
                <g transform={`translate(${c.cx} ${foodY})`}>
                  {i === 0 && <Meat />}
                  {i === 1 && <RiceLump />}
                  {i === 2 && <Porridge />}
                </g>
              )}
              {t >= land && (
                <g transform={`translate(${c.cx + 78} ${yp - 36}) scale(${badge})`}>
                  <circle r={25} fill={RUST} stroke="#fff" strokeWidth={4} />
                  <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
                </g>
              )}
            </g>
          );
        })}
        {/* Cơm đứng cạnh bậc thang: mặt trung tính, không cười, không thoại */}
        <Com x={108} y={1010} scale={1} mood="tn" t={t} look={1} />
      </g>
    </svg>
  );
};

/* ---------- cảnh 9: đồng hồ "vài phút" và tích "biết chắc" ---------- */
const Pill = ({top, spr, children}: {top: number; spr: number; children: React.ReactNode}) => (
  <div style={{position: 'absolute', left: 50, top, display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 40, padding: '14px 34px 14px 18px', boxShadow: '0 8px 26px rgba(18,59,99,0.18)', transform: `scale(${spr})`, transformOrigin: '0 50%'}}>{children}</div>
);

export const ScopePills = ({t, frame}: {t: number; frame: number}) => {
  const end = S(10) - 0.4;
  if (t < W(9, 'vài') || t > end + 0.3) return null;
  const out = 1 - P(t, end, 0.25);
  const a = W(9, 'vài') - 0.05;
  const b = W(9, 'biết') - 0.05;
  const hand = (t - a) * 2.4;
  return (
    <>
      <Pill top={430} spr={sp(frame, a, 10) * out}>
        <svg width={72} height={72} viewBox="-36 -36 72 72">
          <circle r={30} fill="#fff" stroke={NAVY} strokeWidth={6} />
          <path d={`M 0 0 L ${20 * Math.sin(hand)} ${-20 * Math.cos(hand)}`} stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
          <path d="M 0 0 L 0 -14" stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
        </svg>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: NAVY}}>vài phút</div>
      </Pill>
      {t >= b && (
        <Pill top={560} spr={sp(frame, b, 10) * out}>
          <div style={{width: 68, height: 68, borderRadius: 34, background: GREEN, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: GREEN}}>biết chắc</div>
        </Pill>
      )}
    </>
  );
};

/* ---------- cảnh 10: cốc trà bốc hơi nguội dần, Cơm cười lại ---------- */
export const Cup = ({t, frame}: {t: number; frame: number}) => {
  const a = S(10) + 0.05;
  if (t < a - 0.05) return null;
  const s = sp(frame, a, 12);
  const hot = 1 - P(t, W(10, 'để'), WE(10, 'uống') - W(10, 'để') + 0.2) * 0.88;
  const steam = [0, 1, 2].map((k) => {
    const p = (t * 0.7 + k / 3) % 1;
    const x = -46 + k * 46 + 10 * Math.sin(t * 3 + k * 2);
    return <path key={k} d={`M ${x} ${-110 - p * 80} q 14 -22 0 -44 t 0 -44`} fill="none" stroke="#9DB4D0" strokeWidth={9} strokeLinecap="round" opacity={hot * Math.min(1, p * 4) * (1 - p) * 1.25} />;
  });
  const cool = P(t, W(10, 'để'), 2.4);
  const tea = `rgb(${Math.round(lerp(217, 200, cool))},${Math.round(lerp(120, 134, cool))},${Math.round(lerp(40, 64, cool))})`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(380 760) scale(${1.45 * s})`}>
        <ellipse cx={0} cy={118} rx={160} ry={26} fill="#fff" stroke={NAVY} strokeWidth={7} />
        <path d="M 100 -20 q 70 -4 66 46 q -4 50 -64 44" fill="none" stroke={NAVY} strokeWidth={22} strokeLinecap="round" />
        <path d="M 100 -20 q 70 -4 66 46 q -4 50 -64 44" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
        <path d="M -104 -84 H 104 V 60 Q 104 118 46 118 H -46 Q -104 118 -104 60 Z" fill="#fff" stroke={NAVY} strokeWidth={8} strokeLinejoin="round" />
        <ellipse cx={0} cy={-84} rx={104} ry={24} fill={tea} stroke={NAVY} strokeWidth={7} />
        <path d="M -62 -24 q 14 -10 30 0" fill="none" stroke="#DCE6F2" strokeWidth={7} strokeLinecap="round" />
        {steam}
      </g>
      <g opacity={Math.min(1, s)}>
        <Com x={790} y={850 + 6 * Math.sin(t * 3)} scale={1.5 * Math.min(1, s)} mood="vui" t={t} rot={5 * Math.sin(t * 2.4)} />
      </g>
    </svg>
  );
};
