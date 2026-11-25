/* Thế giới B: lát cắt thành dạ dày phóng to — axit (trên), lớp nhầy "áo mưa", hàng tế bào niêm mạc, lớp dưới.
   Nhân vật HP, giọt axit nảy khỏi lớp nhầy, lớp kiềm đẩy axit thấm vào ra xa. */
import {interpolateColors} from 'remotion';
import {Cloud, HP, Rod, type Mood} from './Bacteria';
import {P, lerp} from '../../src/timeline';
import {S, W} from './timeline';

export const MUCUS_TOP = 760;
const CELL_BOTTOM = 1380;
const CELLS = 7;
const CW = 1080 / CELLS;
const SICK = 4; // tế bào duy nhất biến đổi ở cảnh 6

const waveTop = (x: number, t: number) => MUCUS_TOP + 14 * Math.sin(x / 90 + t * 1.2);

export type Bug = {x: number; y: number; angle: number; scale: number; cloud: number; mood: Mood};

/** Thời điểm HP bắt đầu bị diệt (cảnh 7), so le theo từng con */
const killAt = (i: number) => W(7, 'diệt') + 0.4 + i * 0.15;

/** Vị trí các con HP theo thời gian (dùng chung để biết chỗ đặt bong bóng thoại và lớp kiềm) */
export const bugsAt = (t: number): Bug[] => {
  const enter = W(3, 'kẻ') - 0.2;
  const turn = P(t, W(4, 'xoáy') - 0.2, 0.8);
  const diveStart = W(4, 'xoáy') + 0.1;
  const dive = P(t, diveStart, W(4, 'nhầy') + 0.3 - diveStart);
  const yIn = lerp(-200, 520, P(t, enter, 1.5));
  const gone = (i: number) => 1 - P(t, killAt(i), 0.35);
  /* vui chỉ ở phần cơ chế; từ lúc mô bắt đầu đỏ thì lém lỉnh nhẹ; từ "chỉ một số ít" tới khi bị diệt (có chữ ung thư, tế bào đổi) thì mặt lo */
  const moodOf = (): Mood =>
    t >= W(7, 'diệt') ? 'la' : t >= W(6, 'chỉ') - 0.2 ? 'lo' : t >= W(5, 'viêm') - 0.2 ? 'gian' : t >= S(5) ? 'vui' : 'gian';
  const main: Bug = {
    x: 540 + 10 * Math.sin(t * 2) + 46 * Math.sin(t * 9) * Math.sin(Math.PI * dive),
    y: lerp(yIn, 960, dive),
    angle: lerp(-20 + 10 * Math.sin(t * 1.5), 90, turn),
    scale: (t < enter ? 0 : 1.15) * gone(0),
    cloud: P(t, W(4, 'kiềm') - 0.2, 0.8) * gone(0),
    mood: moodOf(),
  };
  const spots = [
    [170, 900, 70],
    [360, 990, 105],
    [740, 910, 80],
    [920, 1000, 100],
  ];
  const extra = spots.map(([x, y, a], i): Bug => {
    const born = P(t, S(5) + 0.1 + i * 0.3, 0.5);
    return {x: x + 8 * Math.sin(t * 2 + i), y: y + 6 * Math.cos(t * 1.7 + i), angle: a, scale: 0.95 * born * gone(i + 1), cloud: born * gone(i + 1), mood: moodOf()};
  });
  return [main, ...extra];
};

/* ---------- giọt axit: rơi, chạm lớp nhầy rồi bật ra ---------- */
const DROPS = 16;
const FALL = 0.62;
const drop = (i: number) => ({x: 70 + ((i * 197) % 940), period: 1.5 + (i % 5) * 0.22, off: (i * 0.53) % 1.7, dir: i % 2 ? 1 : -1});

/** Các thời điểm giọt axit chạm lớp nhầy trong [from, to] — dùng để gắn tiếng ping; chỉ lấy một phần giọt cho đỡ rối tai */
export const acidImpacts = (from: number, to: number, minGap = 0.4) => {
  const times: number[] = [];
  for (let i = 0; i < DROPS; i += 5) {
    const d = drop(i);
    for (let k = Math.floor((from + d.off) / d.period) - 1; ; k++) {
      const tHit = (k + FALL) * d.period - d.off;
      if (tHit > to) break;
      if (tHit >= from) times.push(tHit);
    }
  }
  times.sort((a, b) => a - b);
  return times.filter((x, i) => i === 0 || x - times[i - 1] >= minGap);
};

export const WallSection = ({t}: {t: number}) => {
  const bugs = bugsAt(t);
  const main = bugs[0];

  const acidDrops = Array.from({length: DROPS}, (_, i) => {
    const d = drop(i);
    const u = (t + d.off) / d.period;
    const p = u - Math.floor(u);
    const hit = waveTop(d.x, t) - 26;
    if (p < FALL) {
      const q = p / FALL;
      return {x: d.x, y: lerp(MUCUS_TOP - 560, hit, q * q), o: Math.min(1, q * 5), ring: 0, ringX: d.x};
    }
    if (p < 0.9) {
      const r = (p - FALL) / (0.9 - FALL);
      return {x: d.x + d.dir * 90 * r, y: hit - 130 * 4 * r * (1 - r), o: 1 - 0.7 * r, ring: p < FALL + 0.14 ? (p - FALL) / 0.14 : 0, ringX: d.x};
    }
    return {x: d.x, y: hit, o: 0, ring: 0, ringX: d.x};
  });

  /* axit thấm vào lớp nhầy ở cảnh 4, bị lớp kiềm đẩy vòng ra */
  const seepStart = W(4, 'chui') + 0.5;
  const seep = Array.from({length: 7}, (_, i) => {
    const a = seepStart + i * 0.4;
    const u = (t - a) / 1.9;
    if (u <= 0 || u >= 1) return null;
    const side = i % 2 ? 1 : -1;
    const yc = 960 + (i - 3) * 35;
    let x = 540 - side * 470 + side * 940 * u;
    let y = yc + 20 * Math.sin(u * 6);
    const R = 150 * main.cloud * (main.scale / 1.15) + 24;
    if (main.cloud > 0.05) {
      const dx = x - main.x;
      const dy = y - main.y;
      const dist = Math.hypot(dx, dy);
      if (dist < R) {
        x = main.x + (dx / dist) * R;
        y = main.y + (dy / dist) * R;
      }
    }
    return {x, y, o: Math.min(1, u * 6) * Math.min(1, (1 - u) * 6)};
  });

  /* vi khuẩn thường rơi vào axit thì hoảng rồi tan */
  const rods = [0, 1, 2].map((i) => {
    const a = W(3, 'rơi') - 0.3 + i * 0.3;
    const fall = P(t, a, 1.0);
    const dieAt = W(3, 'tan') - 0.15 + i * 0.1;
    const die = P(t, dieAt, 0.6);
    const x = 260 + i * 280;
    const y = lerp(-150, 380 + (i % 2) * 120, fall);
    return {x, y, angle: 20 + i * 50 + t * 40, scale: t < a ? 0 : 1 - die, opacity: 1 - die * 0.6, dieAt};
  });

  /* trạng thái tế bào */
  const inflame = P(t, W(5, 'viêm') - 0.2, 1.6) * (1 - 0.75 * P(t, W(6, 'đa') - 0.1, 0.8)) * (1 - 0.8 * P(t, W(7, 'diệt') + 0.5, 2));
  /* tế bào bất thường chỉ ở lại tới hết phần biểu đồ; trả về bình thường khi khung test hơi thở che nền, để không còn sót ở cảnh sau */
  const keep = 1 - P(t, S(8) + 0.3, 0.8);
  const meta = P(t, W(6, 'biến'), 0.8) * keep;
  const dark = P(t, W(6, 'ung') - 0.1, 0.9) * keep;
  const thinSick = P(t, W(6, 'niêm'), 1.2) * keep;
  const pulse = 0.5 + 0.5 * Math.sin(t * 6);
  const tickFade = 1 - P(t, W(6, 'ung') + 0.6, 0.4);

  const mucusPath = (() => {
    let m = `M -400 ${waveTop(-400, t)}`;
    for (let x = -390; x <= 1480; x += 15) m += ` L ${x} ${waveTop(x, t).toFixed(1)}`;
    return `${m} L 1480 ${CELL_BOTTOM} L -400 ${CELL_BOTTOM} Z`;
  })();

  const sparkleHeads = bugs.map((b, i) => ({b, a: killAt(i)}));

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
      <path d={mucusPath} fill="url(#nhay)" opacity={0.9} />
      <path d={mucusPath} fill="none" stroke="#3E9C8C" strokeWidth={6} />
      {/* ánh bóng như áo mưa */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M ${120 + i * 270} ${waveTop(120 + i * 270, t) + 22} q 60 -10 130 0`} fill="none" stroke="#E6FFF9" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      ))}
      {/* bọt trong lớp nhầy */}
      {Array.from({length: 12}, (_, i) => (
        <circle key={i} cx={(i * 97 + 30) % 1080} cy={800 + ((i * 53) % 220)} r={6 + (i % 3) * 3} fill="#D6F5EE" opacity={0.6} />
      ))}
      {/* tế bào niêm mạc */}
      {Array.from({length: CELLS}, (_, i) => {
        const sick = i === SICK;
        const h = sick ? lerp(300, 245, thinSick) : 300;
        const redBase = Math.min(1, inflame * (0.85 + 0.15 * pulse));
        const red = sick ? Math.max(redBase, 0.9 * P(t, W(6, 'niêm'), 0.6) * (1 - P(t, W(6, 'biến'), 0.8)) * keep) : redBase;
        let fill = interpolateColors(red, [0, 1], ['#F7C1B2', '#EE6B5B']);
        if (sick && meta > 0) fill = interpolateColors(meta, [0, 1], [fill, '#B79CDB']);
        if (sick && dark > 0) fill = interpolateColors(dark, [0, 1], [fill, '#5A2448']);
        const x = i * CW + 5;
        const y = CELL_BOTTOM - h;
        const tk = sick ? 0 : P(t, W(6, 'đa') + 0.1 + i * 0.12, 0.3) * tickFade;
        const d = sick ? dark : 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={CW - 10} height={h} rx={30} fill={fill} stroke="#A94C47" strokeWidth={6} />
            {sick && meta > 0.05 && <ellipse cx={x + (CW - 10) / 2} cy={y + h * 0.3} rx={34 * meta} ry={26 * meta} fill="#EDE3FA" stroke="#8D6CC0" strokeWidth={4} />}
            <circle cx={x + (CW - 10) / 2} cy={y + h * 0.68} r={lerp(26, 38, d)} fill={interpolateColors(d, [0, 1], ['#8E3A4D', '#1E0B19'])} />
            {tk > 0.02 && (
              <g transform={`translate(${x + (CW - 10) / 2} ${y + h * 0.3}) scale(${tk})`} opacity={tk}>
                <circle r={28} fill="#2E9E6A" stroke="#fff" strokeWidth={5} />
                <path d="M -11 0 L -3 9 L 12 -9" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        );
      })}
      {/* quầng viêm */}
      <rect x={-600} y={CELL_BOTTOM - 340} width={2280} height={400} fill="#FF5A4A" opacity={0.18 * inflame * pulse} />
      {/* vi khuẩn thường */}
      {rods.map((r, i) => (
        <Rod key={i} x={r.x} y={r.y} angle={r.angle} scale={r.scale} opacity={r.opacity} />
      ))}
      {/* khói tan khi vi khuẩn thường bị axit phá */}
      {rods.map((r, i) => {
        const p = P(t, r.dieAt, 0.7);
        if (p <= 0 || p >= 1) return null;
        return (
          <g key={`p${i}`} transform={`translate(${r.x} ${r.y})`} opacity={1 - p}>
            {[0, 1, 2, 3, 4].map((k) => (
              <circle key={k} cx={Math.cos(k * 1.9) * (20 + 70 * p)} cy={Math.sin(k * 1.9) * (14 + 50 * p) - 30 * p} r={10 + 14 * p} fill="#E4EAF0" stroke="#B8C2CC" strokeWidth={3} />
            ))}
          </g>
        );
      })}
      {/* giọt axit rơi và nảy khỏi lớp nhầy */}
      {acidDrops.map((a, i) => (
        <g key={i}>
          {a.ring > 0 && <ellipse cx={a.ringX} cy={waveTop(a.ringX, t) + 2} rx={20 + 50 * a.ring} ry={6 + 8 * a.ring} fill="none" stroke="#fff" strokeWidth={5} opacity={1 - a.ring} />}
          {a.o > 0.02 && (
            <g transform={`translate(${a.x} ${a.y})`} opacity={a.o}>
              <circle r={22} fill="#FF9F43" stroke="#E0761E" strokeWidth={4} />
              <path d="M -10 0 H 10 M 0 -10 V 10" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}
      {/* axit thấm vào lớp nhầy */}
      {seep.map((s, i) =>
        s ? (
          <g key={`s${i}`} transform={`translate(${s.x} ${s.y})`} opacity={s.o}>
            <circle r={17} fill="#FF9F43" stroke="#E0761E" strokeWidth={4} />
            <path d="M -7 0 H 7 M 0 -7 V 7" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : null,
      )}
      {bugs.map((b, i) => (
        <Cloud key={`c${i}`} x={b.x} y={b.y} r={150 * b.cloud * (b.scale / 1.15)} opacity={0.9} />
      ))}
      {bugs.map((b, i) => (
        <HP key={i} x={b.x} y={b.y} angle={b.angle} scale={b.scale} t={t + i} spin={t > S(4) && t < S(5) ? 16 : 9} mood={b.mood} />
      ))}
      {/* tia lấp lánh khi HP bị diệt */}
      {sparkleHeads.map(({b, a}, i) => {
        const p = P(t, a, 0.6);
        if (p <= 0 || p >= 1) return null;
        return (
          <g key={`k${i}`} transform={`translate(${b.x} ${b.y})`} opacity={1 - p}>
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <line key={d} x1={0} y1={0} x2={0} y2={-40 - 70 * p} transform={`rotate(${d})`} stroke="#FFC93C" strokeWidth={10} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </g>
  );
};
