/* Lớp phủ riêng của video HP: câu mở đầu, dấu hỏi, nút chai, biểu đồ, khung test hơi thở, các bước cuối. */
import {spring} from 'remotion';
import {BigLabel, FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {FPS, P, lerp} from '../../src/timeline';
import {HP, hpHead} from './Bacteria';
import {E, S, W} from './timeline';

/* ---------- chữ lớn ngay khung đầu (spring chạy trước vài khung nên khung 0 đã hiện) ---------- */
export const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = S(2) - 0.45;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  return <BigLabel text="NGÂM AXIT CẢ NGÀY" size={84} scale={s * (1 - out) * (1 + 0.025 * Math.sin(t * 9))} opacity={1 - out} />;
};

/* ---------- dấu hỏi bật ra từ dạ dày ---------- */
export const Question = ({t, frame}: {t: number; frame: number}) => {
  const a = W(1, 'sao');
  if (t < a || t > S(2) - 0.1) return null;
  const s = spring({frame: frame - Math.round(a * FPS), fps: FPS, config: {damping: 9}});
  return (
    <div style={{position: 'absolute', left: 700, top: 440, fontFamily: FONT, fontWeight: 900, fontSize: 250, color: ORANGE, WebkitTextStroke: `12px ${NAVY}`, paintOrder: 'stroke fill', transform: `scale(${s}) rotate(${8 * Math.sin(t * 3)}deg)`}}>?</div>
  );
};

/* ---------- cái mở nút chai thật, xoáy theo lời "xoáy như cái mở nút chai" ---------- */
export const Corkscrew = ({t, frame}: {t: number; frame: number}) => {
  const a = W(4, 'mở') - 0.1;
  const end = a + 1.9;
  if (t < a || t > end) return null;
  const s = spring({frame: frame - Math.round(a * FPS), fps: FPS, config: {damping: 11}});
  const out = P(t, end - 0.3, 0.3);
  const pts: string[] = [];
  for (let y = 84; y <= 250; y += 4) pts.push(`${y === 84 ? 'M' : 'L'}${(85 + 42 * Math.sin(((y - 84) / 34) * Math.PI * 2 - t * 9)).toFixed(1)} ${y}`);
  const spiral = pts.join(' ');
  return (
    <svg width={170} height={270} viewBox="0 0 170 270" style={{position: 'absolute', left: 70, top: 440, transform: `scale(${s * (1 - out)}) rotate(-12deg)`, opacity: 1 - out}}>
      <path d={spiral} fill="none" stroke={NAVY} strokeWidth={17} strokeLinecap="round" />
      <path d={spiral} fill="none" stroke="#C9D3DD" strokeWidth={8} strokeLinecap="round" />
      <rect x={76} y={36} width={18} height={52} fill="#C9D3DD" stroke={NAVY} strokeWidth={6} />
      <rect x={8} y={8} width={154} height={30} rx={15} fill="#FFC93C" stroke={NAVY} strokeWidth={6} />
    </svg>
  );
};

/* ---------- biểu đồ "giảm gần một nửa" (Cochrane 2020: nguy cơ tương đối ~0,54) có chú thích "không về 0" ---------- */
export const Chart = ({t}: {t: number}) => {
  const a = W(7, 'giảm') + 0.05;
  const show = P(t, a, 0.5) * (1 - P(t, S(8) - 0.3, 0.4));
  if (show <= 0) return null;
  const g1 = P(t, a + 0.3, 0.7);
  const g2 = P(t, a + 1.0, 0.9);
  const note = P(t, W(7, 'không', 0), 0.4);
  const base = 470;
  const full = 300;
  const hOrange = full * 0.54;
  const bar = (x: number, h: number, color: string, label: string, val: string) => (
    <g>
      <rect x={x} y={base - h} width={150} height={h} rx={18} fill={color} />
      <text x={x + 75} y={base - h - 14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill={NAVY} opacity={h > 20 ? 1 : 0}>{val}</text>
      <text x={x + 75} y={base + 52} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill={NAVY}>{label}</text>
    </g>
  );
  return (
    <div style={{position: 'absolute', left: 120, top: 420, width: 800, opacity: show, transform: `translateY(${(1 - show) * 60}px)`}}>
      <svg width={800} height={620} viewBox="0 0 800 620">
        <rect x={0} y={0} width={800} height={620} rx={36} fill="#fff" opacity={0.97} />
        <text x={400} y={60} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={36} fill="#5b6b7b">Số ca ung thư dạ dày về sau</text>
        {bar(90, full * g1, '#9AA7B4', 'Không điều trị', '')}
        {bar(340, hOrange * g2, ORANGE, 'Đã diệt HP', 'gần ½')}
        <path d={`M 50 ${base} H 750`} stroke="#8796A5" strokeWidth={5} strokeLinecap="round" strokeDasharray="2 12" />
        <text x={40} y={base + 12} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#5b6b7b">0</text>
        <g opacity={note} transform={`translate(${(1 - note) * 30} 0)`}>
          <path d={`M 540 ${base - 6} V ${base - hOrange + 6}`} stroke="#C2410C" strokeWidth={7} strokeLinecap="round" />
          <path d={`M 528 ${base - hOrange + 20} L 540 ${base - hOrange + 4} L 552 ${base - hOrange + 20} M 528 ${base - 20} L 540 ${base - 4} L 552 ${base - 20}`} fill="none" stroke="#C2410C" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <text x={575} y={base - hOrange / 2 - 4} fontFamily={FONT} fontWeight={900} fontSize={44} fill="#C2410C">KHÔNG</text>
          <text x={575} y={base - hOrange / 2 + 44} fontFamily={FONT} fontWeight={900} fontSize={44} fill="#C2410C">VỀ 0</text>
        </g>
        <text x={400} y={592} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill="#4a5b6c">Nguồn: tổng hợp Cochrane 2020</text>
      </svg>
    </div>
  );
};

/* ---------- khung tròn phóng to: HP ăn urê, ợ ra khí CO₂ (bị lộ), rồi túi thổi test hơi thở ---------- */
export const BreathInset = ({t}: {t: number}) => {
  const show = P(t, S(8) - 0.1, 0.5) * (1 - P(t, S(9) - 0.4, 0.4));
  if (show <= 0) return null;
  const eat = W(8, 'ăn');
  const burp = W(8, 'ợ');
  const toBag = P(t, W(8, 'thổi') - 0.3, 0.6);
  const cx = 540;
  const cy = 760;
  const R = 360;
  const hp = {x: cx - 20, y: cy + 70, angle: 0, scale: 1.6, t, spin: 9};
  const head = hpHead(hp);
  const mood = t < eat ? 'gian' : t < burp ? 'an' : 'o';

  const urea = Array.from({length: 5}, (_, i) => {
    const arrive = eat + i * 0.14;
    const start = arrive - 0.95;
    if (t < start || t >= arrive) return null;
    const p = P(t, start, 0.95);
    const ang = (i / 5) * Math.PI * 1.1 - 0.2;
    const sx = cx + Math.cos(ang) * (R * 0.82);
    const sy = cy - 60 - Math.abs(Math.sin(ang)) * (R * 0.5);
    return {x: lerp(sx, head.x, p * p), y: lerp(sy, head.y, p * p), s: 1 - 0.5 * p};
  });
  const gas = Array.from({length: 5}, (_, i) => {
    const e = burp + i * 0.2;
    const p = (t - e) / 1.7;
    if (p <= 0 || p >= 1) return null;
    return {x: head.x + 60 + 20 * Math.sin(p * 7 + i) + i * 28 * p, y: head.y - p * 400, r: 12 + 34 * Math.min(1, p * 4), o: Math.min(1, (1 - p) * 4)};
  });
  const bagPulse = 0.5 + 0.5 * Math.sin(t * 3);

  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'rgba(12,42,72,0.55)', opacity: show}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: show}}>
        <defs>
          <clipPath id="khung-tron">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
          <radialGradient id="kiem2">
            <stop offset="0" stopColor="#C9D6FF" stopOpacity={0.85} />
            <stop offset="1" stopColor="#9DB4FF" stopOpacity={0.1} />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * show}) translate(${-cx} ${-cy})`}>
          <circle cx={cx} cy={cy} r={R} fill="#FFF9F4" />
          <g clipPath="url(#khung-tron)">
            <g opacity={1 - toBag}>
              <circle cx={cx} cy={cy + 70} r={210} fill="url(#kiem2)" />
              <HP {...hp} mood={mood} />
              {urea.map((m, i) =>
                m ? (
                  <g key={i} transform={`translate(${m.x} ${m.y}) scale(${m.s})`}>
                    <rect x={-56} y={-30} width={112} height={60} rx={30} fill="#FFE1C8" stroke={ORANGE} strokeWidth={5} />
                    <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#B4500E">urê</text>
                  </g>
                ) : null,
              )}
              {gas.map((g, i) =>
                g ? (
                  <g key={i} transform={`translate(${g.x} ${g.y})`} opacity={g.o}>
                    <circle r={g.r} fill="#E3F1FF" stroke="#5B8FD8" strokeWidth={5} />
                    {g.r > 38 && <text y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#2F5FA8">CO₂</text>}
                  </g>
                ) : null,
              )}
            </g>
            <g opacity={toBag}>
              {/* túi thổi test hơi thở */}
              <ellipse cx={cx} cy={cy - 20} rx={lerp(120, 170, bagPulse)} ry={lerp(160, 200, bagPulse)} fill="#DDEFFF" stroke="#5B8FD8" strokeWidth={8} />
              <rect x={cx - 26} y={cy - 310} width={52} height={130} rx={14} fill="#fff" stroke="#5B8FD8" strokeWidth={8} />
              {[0, 1, 2].map((k) => {
                const p = (t * 1.2 + k / 3) % 1;
                return <path key={k} d={`M ${cx - 40} ${cy - 330 - 60 * (1 - p)} q 40 -20 80 0`} fill="none" stroke="#5B8FD8" strokeWidth={7} strokeLinecap="round" opacity={1 - p} />;
              })}
              <text x={cx} y={cy + 235} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill={NAVY}>Thổi vào túi</text>
              <text x={cx} y={cy + 295} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={48} fill="#2E9E6A">không đau</text>
            </g>
          </g>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={ORANGE} strokeWidth={12} />
        </g>
      </svg>
    </>
  );
};

/* ---------- 3 bước ở cảnh cuối: đặt cao (y 300–800), chừa lề phải cho cột nút của Reels ---------- */
export const Steps = ({t, frame}: {t: number; frame: number}) => {
  if (t < S(9)) return null;
  const fade = 1 - P(t, E(9) + 0.3, 0.4);
  const steps = [
    {at: W(9, 'xét'), text: 'Xét nghiệm HP'},
    {at: W(9, 'điều'), text: 'Điều trị đủ đợt theo bác sĩ'},
    {at: W(9, 'kiểm'), text: 'Kiểm tra lại sau điều trị'},
  ];
  return (
    <div style={{position: 'absolute', left: 80, right: 170, top: 290, display: 'flex', flexDirection: 'column', gap: 22, opacity: fade}}>
      {steps.map((s, i) => {
        const sp = spring({frame: frame - Math.round((s.at - 0.1) * FPS), fps: FPS, config: {damping: 13}});
        const tick = P(t, s.at + 0.6, 0.35);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 24, background: '#fff', borderRadius: 30, padding: '20px 28px', boxShadow: '0 8px 26px rgba(18,59,99,0.16)', transform: `translateX(${(1 - sp) * -1100}px)`, opacity: t < s.at - 0.1 || sp < 0.01 ? 0 : 1}}>
            <div style={{width: 72, height: 72, flex: 'none', borderRadius: 36, background: tick > 0.5 ? '#2E9E6A' : ORANGE, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 42, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {tick > 0.5 ? '✓' : i + 1}
            </div>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, color: NAVY, lineHeight: 1.15}}>{s.text}</div>
          </div>
        );
      })}
    </div>
  );
};
