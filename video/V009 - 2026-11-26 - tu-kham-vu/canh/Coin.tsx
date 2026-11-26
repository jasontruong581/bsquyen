/* Mô hình chính của V009: "đĩa mặt đồng hồ". Nhìn từ trên là mặt đồng hồ (vạch giờ, các vòng đồng tâm, mô tuyến vẽ như cánh hoa);
   nghiêng dần thì lộ thành khối ba lớp (da, mô tuyến và mỡ, thành ngực); nhìn ngang thì là mặt cắt để ba ngón ấn xuống.
   Chỉ là sơ đồ: vòng tròn, cánh hoa, lớp phẳng. Không vẽ thân hình hay chi tiết giải phẫu bên ngoài. */
import {FONT, NAVY, ORANGE} from '../../src/common/overlays';
import {CLAV, GL, H, LUMP, LUMP_ANG, LUMP_R, OFFS, PRESS_X, R, SK, SPIRAL, TAIL_ANG, TAIL_B, TAIL_RC, TAIL_A, onTop, pol, type Geom} from './Geo';
import {T, clamp01, lumpAlpha, ramp, spiralU} from './Motion';
import {E, S} from './timeline';

const f1 = (n: number) => n.toFixed(1);
const XS = Array.from({length: 57}, (_, i) => -R + (2 * R * i) / 56);

/* ---------- cánh hoa (mô tuyến) ---------- */
const petal = (a: number) => {
  const r1 = 0.27 * R;
  const r2 = 0.9 * R;
  const p1 = pol(r1, a - 9);
  const p2 = pol(r2, a - 13);
  const p3 = pol(r2, a + 13);
  const p4 = pol(r1, a + 9);
  const c = pol(r2 * 1.09, a);
  const c2 = pol(r1 * 0.88, a);
  return `M ${f1(p1.x)} ${f1(p1.y)} L ${f1(p2.x)} ${f1(p2.y)} Q ${f1(c.x)} ${f1(c.y)} ${f1(p3.x)} ${f1(p3.y)} L ${f1(p4.x)} ${f1(p4.y)} Q ${f1(c2.x)} ${f1(c2.y)} ${f1(p1.x)} ${f1(p1.y)} Z`;
};
const PETALS = Array.from({length: 12}, (_, i) => petal(i * 30 + 15));

/* ---------- các cục nhỏ trong lớp mô tuyến và mỡ (nhìn mặt cắt thấy lổn nhổn) ---------- */
type Blob = {x: number; v: number; r: number; lobe: boolean; ph: number};
const BLOBS: Blob[] = (() => {
  const out: Blob[] = [];
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r < 3; r++) {
      const x = -288 + c * 64 + (r % 2) * 22 + (rnd() - 0.5) * 16;
      const v = 0.2 + r * 0.3 + (rnd() - 0.5) * 0.08;
      if (Math.abs(x - LUMP.x) < 62 && v > 0.25 && v < 0.78) continue; // chừa chỗ cho khối nhỏ
      out.push({x, v, r: 17 + rnd() * 11, lobe: (c + r) % 2 === 0, ph: rnd() * 6.28});
    }
  }
  return out;
})();

type CoinProps = {t: number; g: Geom; psi: number; swell: number; dent: number[]; sweep: number; hubSink: number; dim: number};

export const Coin = ({t, g, psi, swell, dent, sweep, hubSink, dim}: CoinProps) => {
  const {ca, sa, ry, h} = g;
  const dentAt = (x: number) => dent.reduce((s, d, j) => s + d * Math.exp(-(((x - PRESS_X[j]) / 34) ** 2)), 0);
  const arc = (x: number) => ry * Math.sqrt(Math.max(0, 1 - (x / R) ** 2));
  const layer = (o0: number, o1: number, k0: number, k1: number) => {
    const top = XS.map((x) => `${f1(x)} ${f1(arc(x) + o0 * sa + k0 * dentAt(x))}`);
    const bot = [...XS].reverse().map((x) => `${f1(x)} ${f1(arc(x) + o1 * sa + k1 * dentAt(x))}`);
    return `M ${top.join(' L ')} L ${bot.join(' L ')} Z`;
  };
  const showSide = sa > 0.02;
  const sw = 1 + 0.045 * swell; // căng: mô nở ra
  const lumpA = lumpAlpha(t);
  const ang = (t * 55) % 360;
  const wedge = (w: number) => {
    const a0 = pol(0.86 * R, ang - w);
    const a1 = pol(0.86 * R, ang);
    return `M 0 0 L ${f1(a0.x)} ${f1(a0.y)} A ${0.86 * R} ${0.86 * R} 0 0 1 ${f1(a1.x)} ${f1(a1.y)} Z`;
  };
  const tip = pol(0.86 * R, ang);
  return (
    <g opacity={1 - 0.62 * dim}>
      {/* bóng đổ dưới đĩa */}
      <ellipse cx={0} cy={h + ry * 0.16 + 34} rx={R * 0.96} ry={ry * 0.3 + 20} fill={NAVY} opacity={0.13} />
      {showSide && (
        <g>
          {/* thành ngực */}
          <path d={layer(OFFS[2], OFFS[3], 0, 0)} fill="url(#gv-chest)" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          {[-232, -78, 78, 232].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={arc(x) + sa * (SK + GL + 33)} rx={34} ry={4 + 14 * sa} fill="#FFF6DE" stroke={NAVY} strokeWidth={4} opacity={0.95} />
              <ellipse cx={x - 8} cy={arc(x) + sa * (SK + GL + 33) - 3 * sa} rx={12} ry={2 + 4 * sa} fill="#fff" opacity={0.7} />
            </g>
          ))}
          {/* mô tuyến và mỡ */}
          <path d={layer(OFFS[1], OFFS[2], 1, 0)} fill="url(#gv-gland)" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
          {BLOBS.map((b, i) => {
            const thick = Math.max(0.12, (GL - dentAt(b.x)) / GL);
            const cy = arc(b.x) + sa * (SK + b.v * GL) + dentAt(b.x) * (1 - b.v);
            const k = sw * (1 + 0.025 * Math.sin(t * 1.7 + b.ph) + 0.03 * swell);
            const rx = b.r * k;
            const ryb = Math.max(2.5, (b.r * k) * (0.35 + 0.65 * sa) * thick);
            return <ellipse key={i} cx={b.x} cy={cy} rx={rx} ry={ryb} fill={b.lobe ? '#FFC9BB' : '#FFF2D8'} stroke={NAVY} strokeOpacity={0.45} strokeWidth={3.4} />;
          })}
          {lumpA > 0.01 && (
            <g opacity={lumpA}>
              {(() => {
                const cy = arc(LUMP.x) + sa * (SK + 0.5 * GL);
                const rr = 30 * (1 + 0.03 * Math.sin(t * 2.2));
                return (
                  <g>
                    <circle cx={LUMP.x} cy={cy} r={rr + 26} fill="url(#gv-mint)" opacity={0.55} />
                    <ellipse cx={LUMP.x} cy={cy} rx={rr} ry={Math.max(4, rr * (0.35 + 0.65 * sa))} fill="#BDAEFF" stroke={NAVY} strokeWidth={4.5} />
                    <ellipse cx={LUMP.x - 9} cy={cy - 8 * sa} rx={9} ry={Math.max(2, 5 * sa)} fill="#fff" opacity={0.7} />
                  </g>
                );
              })()}
            </g>
          )}
          {/* da */}
          <path d={layer(OFFS[0], OFFS[1], 1, 1)} fill="url(#gv-skin)" stroke={NAVY} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      {/* mặt đĩa (phẳng, ép theo độ nghiêng) */}
      <g transform={`scale(1 ${f1(ca)})`}>
        <circle r={R} fill="url(#gv-top)" />
        <g clipPath="url(#gv-coin-clip)">
          <g transform={`rotate(${f1(psi)})`}>
            <g transform={`scale(${sw.toFixed(3)})`}>
              {PETALS.map((p, i) => (
                <path key={i} d={p} fill="url(#gv-petal)" stroke="#fff" strokeOpacity={0.7} strokeWidth={4} strokeLinejoin="round" opacity={0.9} />
              ))}
            </g>
            {[0.3, 0.58, 0.86].map((k) => (
              <circle key={k} r={k * R} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={5} strokeDasharray={k > 0.8 ? '' : '2 14'} strokeLinecap="round" />
            ))}
            {Array.from({length: 60}, (_, i) => (
              <path key={i} d={`M 0 ${-R + 10} V ${-R + (i % 5 === 0 ? 40 : 24)}`} stroke={NAVY} strokeOpacity={i % 5 === 0 ? 0.7 : 0.4} strokeWidth={i % 5 === 0 ? 6 : 4} strokeLinecap="round" transform={`rotate(${i * 6})`} />
            ))}
          </g>
          {sweep > 0.01 && (
            <g opacity={sweep}>
              <path d={wedge(70)} fill="#fff" opacity={0.13} />
              <path d={wedge(40)} fill="#fff" opacity={0.15} />
              <path d={wedge(16)} fill="#fff" opacity={0.2} />
              <path d={`M 0 0 L ${f1(tip.x)} ${f1(tip.y)}`} stroke={NAVY} strokeWidth={6} strokeLinecap="round" />
              <circle cx={tip.x} cy={tip.y} r={11} fill={ORANGE} stroke={NAVY} strokeWidth={4} />
            </g>
          )}
          {/* quầng sáng trên mặt */}
          <path d={`M ${-R * 0.82} ${-R * 0.12} A ${R * 0.84} ${R * 0.84} 0 0 1 ${-R * 0.12} ${-R * 0.82}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={14} strokeLinecap="round" />
        </g>
        <g transform={`scale(${(1 - 0.4 * hubSink).toFixed(3)})`}>
          <circle r={26} fill="#fff" stroke={NAVY} strokeWidth={6} />
          <circle r={9} fill={hubSink > 0.2 ? ORANGE : NAVY} />
        </g>
      </g>
      <ellipse rx={R} ry={ry} fill="none" stroke={NAVY} strokeWidth={8} />
    </g>
  );
};

/* ---------- dấu hiệu vẽ trên mặt đĩa (toạ độ phẳng, ép theo độ nghiêng cùng mặt đĩa) ---------- */
const Arrow = ({a, b, c = ORANGE, w = 8}: {a: {x: number; y: number}; b: {x: number; y: number}; c?: string; w?: number}) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  return (
    <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M ${f1(a.x)} ${f1(a.y)} L ${f1(b.x)} ${f1(b.y)}`} />
      <path d={`M ${f1(b.x - ux * 20 - uy * 13)} ${f1(b.y - uy * 20 + ux * 13)} L ${f1(b.x)} ${f1(b.y)} L ${f1(b.x - ux * 20 + uy * 13)} ${f1(b.y - uy * 20 - ux * 13)}`} />
    </g>
  );
};

export const TopMarks = ({t, psi}: {t: number; psi: number}) => {
  const hl = (a: number, b: number) => ramp(t, a, 0.25) * (1 - ramp(t, b, 0.3));
  const shape = hl(T.shape, T.dimple - 0.05);
  const dimple = hl(T.dimple, T.nipple - 0.05);
  const nip = hl(T.nipple, E(5) + 0.1);
  const lumpA = lumpAlpha(t);
  const u = spiralU(t);
  const trailN = Math.floor(u * (SPIRAL.length - 1));
  const trailA = (t < T.tail ? 1 : 0.5) * ramp(t, T.spiral0, 0.2) * (1 - ramp(t, E(7) + 0.1, 0.4));
  const tailK = ramp(t, T.tail, 0.7) * (1 - ramp(t, E(7) + 0.1, 0.4));
  const clavK = ramp(t, T.clav, 0.5) * (1 - ramp(t, E(7) + 0.1, 0.4));
  const forgot = ramp(t, T.forgot, 0.3) * (1 - ramp(t, E(7), 0.3));
  const ruler = ramp(t, T.ruler, 0.4) * (1 - ramp(t, T.moon8 + 0.2, 0.4));
  const lp = LUMP;
  const rimA = pol(R, 120 - 22);
  const rimB = pol(R, 120 + 22);
  return (
    <g>
      {/* s5: hình dạng, da lõm, núm tụt */}
      {shape > 0.01 && <circle r={R + 18} fill="none" stroke={ORANGE} strokeWidth={9} strokeDasharray="30 18" strokeDashoffset={-t * 40} opacity={shape} strokeLinecap="round" />}
      {dimple > 0.01 && (
        <g opacity={dimple} transform={`rotate(${psi})`}>
          <path d={`M ${f1(rimA.x)} ${f1(rimA.y)} A ${R} ${R} 0 0 1 ${f1(rimB.x)} ${f1(rimB.y)}`} fill="none" stroke={ORANGE} strokeWidth={13} strokeLinecap="round" />
          <Arrow a={pol(R + 92, 120 - 10)} b={pol(R + 8, 120 - 10)} />
          <Arrow a={pol(R + 92, 120 + 10)} b={pol(R + 8, 120 + 10)} />
        </g>
      )}
      {nip > 0.01 && (
        <g opacity={nip}>
          <circle r={48 + 3 * Math.sin(t * 5)} fill="none" stroke={ORANGE} strokeWidth={7} strokeDasharray="10 9" />
          {[45, 135, 225, 315].map((a) => (
            <Arrow key={a} a={pol(112, a)} b={pol(60, a)} w={7} />
          ))}
        </g>
      )}
      {/* s7: đường xoắn đi tay, phần mô kéo dài lên hố nách, xương đòn */}
      {trailA > 0.01 && trailN > 1 && (
        <g opacity={trailA} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M ${SPIRAL.slice(0, trailN + 1).map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')}`} stroke="#fff" strokeWidth={22} opacity={0.7} />
          <path d={`M ${SPIRAL.slice(0, trailN + 1).map((p) => `${f1(p.x)} ${f1(p.y)}`).join(' L ')}`} stroke={ORANGE} strokeWidth={10} />
        </g>
      )}
      {tailK > 0.01 && (
        <g transform={`rotate(${TAIL_ANG}) translate(0 ${-TAIL_RC})`} opacity={tailK}>
          <g transform={`scale(1 ${(0.2 + 0.8 * tailK).toFixed(3)})`}>
            <ellipse rx={TAIL_B} ry={TAIL_A} fill="url(#gv-petal)" opacity={0.6} />
            <ellipse rx={TAIL_B} ry={TAIL_A} fill="none" stroke={NAVY} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
          </g>
          {forgot > 0.01 && <circle cy={-TAIL_A} r={44 + 7 * Math.sin(t * 6)} fill="none" stroke={ORANGE} strokeWidth={8} opacity={forgot} />}
        </g>
      )}
      {clavK > 0.01 && (
        <g opacity={clavK}>
          <path d={`M ${CLAV.x0} ${CLAV.y} Q ${(CLAV.x0 + CLAV.x1) / 2} ${CLAV.y - 40} ${CLAV.x1} ${CLAV.y + 10}`} fill="none" stroke={NAVY} strokeWidth={34} strokeLinecap="round" />
          <path d={`M ${CLAV.x0} ${CLAV.y} Q ${(CLAV.x0 + CLAV.x1) / 2} ${CLAV.y - 40} ${CLAV.x1} ${CLAV.y + 10}`} fill="none" stroke="#FFF1CF" strokeWidth={22} strokeLinecap="round" />
          {[CLAV.x0, CLAV.x1].map((x, i) => (
            <circle key={i} cx={x} cy={i === 0 ? CLAV.y : CLAV.y + 10} r={24} fill="#FFF1CF" stroke={NAVY} strokeWidth={6} />
          ))}
        </g>
      )}
      {/* s8: thước hai đốt ngón tay từ tâm tới khối */}
      {ruler > 0.01 && (
        <g opacity={ruler} transform={`rotate(${LUMP_ANG})`}>
          {[0, 1].map((k) => {
            const seg = (LUMP_R - 36) / 2;
            const y0 = -(26 + k * (seg + 4));
            return <rect key={k} x={-13} y={y0 - seg} width={26} height={seg} rx={13} fill="#FFE49A" stroke={NAVY} strokeWidth={4.5} />;
          })}
        </g>
      )}
      {/* khối nhỏ ở 10 giờ (trên mặt đĩa) */}
      {lumpA > 0.01 && (
        <g opacity={lumpA}>
          <circle cx={lp.x} cy={lp.y} r={40 + 3 * Math.sin(t * 2.4)} fill="none" stroke="#7F6EE6" strokeWidth={4.5} strokeDasharray="5 10" strokeDashoffset={-t * 14} />
          <circle cx={lp.x} cy={lp.y} r={23} fill="#BDAEFF" stroke={NAVY} strokeWidth={4.5} />
          <circle cx={lp.x - 7} cy={lp.y - 7} r={6} fill="#fff" opacity={0.75} />
        </g>
      )}
    </g>
  );
};

/* ---------- chữ và biểu tượng đứng thẳng trên mặt đĩa (không bị ép khi nghiêng) ---------- */
export const Numerals = ({g, psi, t}: {g: Geom; psi: number; t: number}) => {
  const a = clamp01((g.ca - 0.12) / 0.4);
  if (a < 0.02) return null;
  const hot = t >= T.ruler && t < T.moon8 + 0.4 ? 10 : 0;
  return (
    <g opacity={a * (1 - 0.0)}>
      {Array.from({length: 12}, (_, i) => {
        const n = i + 1;
        const p = onTop(g, 0.76 * R, n * 30, psi);
        const hi = n === hot;
        return (
          <text key={n} x={p.x} y={p.y + 12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={hi ? 52 : 36} fill={hi ? ORANGE : NAVY} fillOpacity={hi ? 1 : 0.62} stroke="#fff" strokeWidth={hi ? 9 : 7} paintOrder="stroke">
            {n}
          </text>
        );
      })}
    </g>
  );
};

/* ---------- nhãn nhỏ ngay trên hình ---------- */
export const Chip = ({x, y, text, size = 26, a = 1, fill = 'rgba(255,255,255,0.95)', color = NAVY, tail}: {x: number; y: number; text: string; size?: number; a?: number; fill?: string; color?: string; tail?: {x: number; y: number}}) => {
  if (a < 0.01) return null;
  const w = text.length * size * 0.62 + 38;
  const h = size + 24;
  return (
    <g opacity={a} transform={`translate(${f1(x)} ${f1(y + (1 - a) * 10)})`}>
      {tail && <path d={`M 0 ${h / 2 - 2} L ${f1(tail.x - x)} ${f1(tail.y - y)}`} stroke={NAVY} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={NAVY} strokeWidth={4.5} />
      <text y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

export const SectionChips = ({t}: {t: number}) => {
  const a = ramp(t, T.press[0] - 0.3, 0.3) * (1 - ramp(t, T.release[0] - 0.2, 0.3)); // tắt hẳn trước khi đĩa lật lại thành mặt đồng hồ
  if (a < 0.01) return null;
  const names = ['NHẸ', 'VỪA', 'MẠNH'];
  const fills = ['#CFF5E6', '#FFF0B5', '#FFD3C6'];
  return (
    <g>
      <Chip x={-285} y={-44} text="DA" size={24} a={a} tail={{x: -285, y: 6}} />
      <Chip x={-170} y={70} text="MÔ TUYẾN + MỠ" size={24} a={a} />
      <Chip x={172} y={158} text="THÀNH NGỰC" size={24} a={a} />
      {names.map((n, j) => {
        const k = ramp(t, T.press[j] - 0.05, 0.2) * a;
        return <Chip key={n} x={PRESS_X[j]} y={-318} text={n} size={30} a={k} fill={fills[j]} />;
      })}
    </g>
  );
};
