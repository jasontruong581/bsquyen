/* Lớp phủ riêng của video HP: dấu hỏi mở đầu, biểu đồ, khung test hơi thở, các bước cuối. */
import {spring} from 'remotion';
import {FONT, NAVY, ORANGE} from '../../common/overlays';
import {FPS, P, lerp} from '../../timeline';
import {HP} from './Bacteria';
import {E, S, W} from './timeline';

/* ---------- dấu hỏi ở cảnh mở đầu ---------- */
export const Question = ({t, frame}: {t: number; frame: number}) => {
  const a = W(1, 'sao');
  if (t < a || t > S(2)) return null;
  const s = spring({frame: frame - Math.round(a * FPS), fps: FPS, config: {damping: 9}});
  return (
    <div style={{position: 'absolute', left: 760, top: 420, fontFamily: FONT, fontWeight: 900, fontSize: 260, color: ORANGE, WebkitTextStroke: `12px ${NAVY}`, paintOrder: 'stroke fill', transform: `scale(${s}) rotate(${8 * Math.sin(t * 3)}deg)`}}>?</div>
  );
};

/* ---------- biểu đồ "giảm gần một nửa" (Cochrane 2020: nguy cơ tương đối ~0,54) ---------- */
export const Chart = ({t}: {t: number}) => {
  const a = W(7, 'giảm') - 0.3;
  const show = P(t, a, 0.5) * (1 - P(t, S(8) - 0.3, 0.4));
  if (show <= 0) return null;
  const g1 = P(t, a + 0.3, 0.7);
  const g2 = P(t, a + 1.0, 0.9);
  const H = 300;
  const bar = (x: number, h: number, color: string, label: string, val: string) => (
    <g>
      <rect x={x} y={H + 40 - h} width={170} height={h} rx={18} fill={color} />
      <text x={x + 85} y={H + 25 - h} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill={NAVY} opacity={h > 20 ? 1 : 0}>{val}</text>
      <text x={x + 85} y={H + 100} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={38} fill={NAVY}>{label}</text>
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 140, top: 380, width: 800, opacity: show, transform: `translateY(${(1 - show) * 60}px)`}}>
      <svg width={800} height={560} viewBox="0 0 800 560">
        <rect x={0} y={0} width={800} height={560} rx={36} fill="#fff" opacity={0.96} />
        <g transform="translate(0 60)">
          <text x={400} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#5b6b7b">Số ca ung thư dạ dày về sau</text>
          <g transform="translate(0 20)">
            {bar(150, H * g1, '#9AA7B4', 'Không điều trị', '')}
            {bar(480, H * 0.54 * g2, ORANGE, 'Đã diệt HP', 'gần ½')}
          </g>
        </g>
        <text x={400} y={540} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={24} fill="#8796A5">Nguồn: tổng hợp Cochrane 2020</text>
      </svg>
    </div>
  );
};

/* ---------- khung tròn phóng to: HP phân huỷ urê thành khí, rồi test hơi thở ---------- */
export const BreathInset = ({t}: {t: number}) => {
  const show = P(t, S(8) - 0.1, 0.5) * (1 - P(t, S(9) - 0.4, 0.4));
  if (show <= 0) return null;
  const ure = W(8, 'urê');
  const toBag = P(t, W(8, 'thổi') - 0.3, 0.6);
  const cx = 540;
  const cy = 760;
  const R = 360;
  const molecules = Array.from({length: 6}, (_, i) => {
    const ang = (i / 6) * Math.PI * 2 + 0.4;
    const start = ure - 1.2 + i * 0.22;
    const inP = P(t, start, 0.9);
    const outP = P(t, start + 0.9, 1.4);
    const sx = cx + Math.cos(ang) * (R + 40);
    const sy = cy + 40 + Math.sin(ang) * (R + 40);
    const x = lerp(sx, cx, inP) + Math.sin(i + t * 3) * 25 * outP;
    const y = lerp(sy, cy + 40, inP) - outP * 520;
    return {x, y, isGas: inP >= 1, o: t < start ? 0 : 1 - P(t, start + 2.0, 0.3)};
  });
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(12,42,72,0.55)', opacity: show}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: show}}>
        <defs>
          <clipPath id="khung-tron">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * show}) translate(${-cx} ${-cy})`}>
          <circle cx={cx} cy={cy} r={R} fill="#FFF9F4" />
          <g clipPath="url(#khung-tron)">
            <g opacity={1 - toBag}>
              <circle cx={cx} cy={cy + 40} r={150} fill="url(#kiem2)" />
              <HP x={cx} y={cy + 40} angle={-10} t={t} />
              {molecules.map((m, i) =>
                m.isGas ? (
                  <g key={i} transform={`translate(${m.x} ${m.y})`} opacity={m.o}>
                    <circle r={44} fill="#E3F1FF" stroke="#5B8FD8" strokeWidth={5} />
                    <text y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#2F5FA8">CO₂</text>
                  </g>
                ) : (
                  <g key={i} transform={`translate(${m.x} ${m.y})`} opacity={m.o}>
                    <rect x={-56} y={-30} width={112} height={60} rx={30} fill="#FFE1C8" stroke={ORANGE} strokeWidth={5} />
                    <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill="#B4500E">urê</text>
                  </g>
                ),
              )}
            </g>
            <g opacity={toBag}>
              {/* túi thổi test hơi thở */}
              <ellipse cx={cx} cy={cy - 10} rx={lerp(120, 170, 0.5 + 0.5 * Math.sin(t * 3))} ry={lerp(160, 200, 0.5 + 0.5 * Math.sin(t * 3))} fill="#DDEFFF" stroke="#5B8FD8" strokeWidth={8} />
              <rect x={cx - 26} y={cy - 300} width={52} height={130} rx={14} fill="#fff" stroke="#5B8FD8" strokeWidth={8} />
              {[0, 1, 2].map((k) => {
                const p = (t * 1.2 + k / 3) % 1;
                return <path key={k} d={`M ${cx - 40} ${cy - 330 - 60 * (1 - p)} q 40 -20 80 0`} fill="none" stroke="#5B8FD8" strokeWidth={7} strokeLinecap="round" opacity={1 - p} />;
              })}
              <text x={cx} y={cy + 255} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={42} fill={NAVY}>Thổi vào túi</text>
              <text x={cx} y={cy + 305} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#2E9E6A">không đau</text>
            </g>
          </g>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={ORANGE} strokeWidth={12} />
        </g>
        <defs>
          <radialGradient id="kiem2">
            <stop offset="0" stopColor="#C9D6FF" stopOpacity={0.85} />
            <stop offset="1" stopColor="#9DB4FF" stopOpacity={0.1} />
          </radialGradient>
        </defs>
      </svg>
    </>
  );
};

/* ---------- 3 bước ở cảnh cuối ---------- */
export const Steps = ({t, frame}: {t: number; frame: number}) => {
  if (t < S(9)) return null;
  const fade = 1 - P(t, E(9) + 0.3, 0.4);
  const steps = [
    {at: W(9, 'xét'), text: 'Xét nghiệm HP'},
    {at: W(9, 'điều'), text: 'Điều trị đủ đợt theo bác sĩ'},
    {at: W(9, 'kiểm'), text: 'Kiểm tra lại sau điều trị'},
  ];
  return (
    <div style={{position: 'absolute', left: 110, right: 110, top: 930, display: 'flex', flexDirection: 'column', gap: 26, opacity: fade}}>
      {steps.map((s, i) => {
        const sp = spring({frame: frame - Math.round((s.at - 0.1) * FPS), fps: FPS, config: {damping: 13}});
        const tick = P(t, s.at + 0.6, 0.35);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, background: '#fff', borderRadius: 30, padding: '22px 30px', boxShadow: '0 8px 26px rgba(18,59,99,0.16)', transform: `translateX(${(1 - sp) * -900}px)`, opacity: t < s.at - 0.1 ? 0 : 1}}>
            <div style={{width: 76, height: 76, flex: 'none', borderRadius: 38, background: tick > 0.5 ? '#2E9E6A' : ORANGE, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {tick > 0.5 ? '✓' : i + 1}
            </div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 50, color: NAVY, lineHeight: 1.15}}>{s.text}</div>
          </div>
        );
      })}
    </div>
  );
};
