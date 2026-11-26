/* Thế giới của V010: hoàng hôn ấm, MỘT con đường hai làn (xanh = điều trị, cam = chăm sóc giảm nhẹ) nhìn từ trên cao hơi nghiêng; máy quay bay dọc theo.
   Phép chiếu phối cảnh thật (không phải thủ thuật co giãn): điểm thế giới (x, y, z) -> màn hình qua proj(). Vật dựng đứng là "biển" (sprite) co giãn theo độ sâu
   và được vẽ từ xa tới gần. Lớp dưới cùng: bầu trời, mặt trời, đồi xa, mây; rồi mặt đất, nền đường, hai làn, vạch kẻ chạy; rồi cột đèn, bụi cây, cây ven đường. */
import type {ReactNode} from 'react';
import {NAVY} from '../../src/common/overlays';
import {BLUE_END, HOUSE, bend, duskProgress, orangeGlow, type Cam} from './Motion';

export const F = 620;
export const SCY = 800;

export const proj = (c: Cam, x: number, y: number, z: number) => {
  const s = Math.sin(c.pitch);
  const co = Math.cos(c.pitch);
  const dx = x - c.x;
  const dy = y - c.h;
  const dz = z - c.z;
  const depth = -dy * s + dz * co;
  const up = dy * co + dz * s;
  const k = F / depth;
  return {sx: 540 + dx * k, sy: SCY - up * k, k, depth};
};
export const horizonY = (c: Cam) => SCY - F * Math.tan(c.pitch);

export type Sprite = {depth: number; el: ReactNode};
/** Đặt một "biển" tại điểm thế giới (gốc cục bộ ở điểm đó, y âm là hướng lên); trả về null nếu ngoài khung hoặc sau máy quay */
export const sprite = (cam: Cam, x: number, y: number, z: number, key: string, children: ReactNode, scale = 1): Sprite | null => {
  const p = proj(cam, x, y, z);
  if (p.depth < 90 || p.k < 0.05) return null;
  // xếp vẽ theo khoảng cách của điểm chạm đất (không theo độ cao), để vật cao ở xa không bị vẽ đè lên vật thấp ở gần
  const ground = cam.h * Math.sin(cam.pitch) + (z - cam.z) * Math.cos(cam.pitch);
  if (p.sx < -900 || p.sx > 1980 || p.sy > 3200 || p.sy < -900) return null;
  return {
    depth: ground,
    el: (
      <g key={key} transform={`translate(${p.sx.toFixed(1)} ${p.sy.toFixed(1)}) scale(${(p.k * scale).toFixed(4)})`}>
        {children}
      </g>
    ),
  };
};

const f1 = (n: number) => n.toFixed(1);
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const mix = (a: string, b: string, p: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * p)).join(',')})`;
};

/* ---------- định nghĩa dùng chung ---------- */
export const Defs = () => (
  <defs>
    <linearGradient id="g10-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7C93DA" />
      <stop offset="0.42" stopColor="#B9A6E4" />
      <stop offset="0.78" stopColor="#F5BFC9" />
      <stop offset="1" stopColor="#FFD9A8" />
    </linearGradient>
    <linearGradient id="g10-ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#E6C3D6" />
      <stop offset="0.25" stopColor="#C7B3E0" />
      <stop offset="1" stopColor="#8F8FD2" />
    </linearGradient>
    <linearGradient id="g10-haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFE3C4" stopOpacity="0.9" />
      <stop offset="1" stopColor="#FFE3C4" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="g10-sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFF6CF" />
      <stop offset="0.38" stopColor="#FFE08E" />
      <stop offset="0.4" stopColor="#FFD27A" stopOpacity="0.5" />
      <stop offset="1" stopColor="#FFB070" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g10-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFE6A0" stopOpacity="0.95" />
      <stop offset="0.45" stopColor="#FFC066" stopOpacity="0.38" />
      <stop offset="1" stopColor="#FFB060" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g10-lamp" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFF0B8" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#FFC66B" stopOpacity="0.35" />
      <stop offset="1" stopColor="#FFC66B" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g10-den" cx="0.38" cy="0.3" r="0.85">
      <stop offset="0" stopColor="#FFF1A8" />
      <stop offset="0.55" stopColor="#FFC24D" />
      <stop offset="1" stopColor="#FF9438" />
    </radialGradient>
    <radialGradient id="g10-bush" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stopColor="#BDEBC9" />
      <stop offset="1" stopColor="#6FC0A0" />
    </radialGradient>
    <radialGradient id="g10-bloom" cx="0.4" cy="0.3" r="0.9">
      <stop offset="0" stopColor="#FFD9E2" />
      <stop offset="1" stopColor="#F29BB7" />
    </radialGradient>
    <radialGradient id="g10-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.35" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g10-beam-blue" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#7DBBFF" stopOpacity="0.95" />
      <stop offset="1" stopColor="#B5DAFF" stopOpacity="0.12" />
    </linearGradient>
    <linearGradient id="g10-beam-warm" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stopColor="#FFC25C" stopOpacity="0.95" />
      <stop offset="1" stopColor="#FFE2A8" stopOpacity="0.12" />
    </linearGradient>
    <linearGradient id="g10-pain" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FF7D5A" />
      <stop offset="1" stopColor="#3FB7A8" />
    </linearGradient>
    <filter id="g10-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" />
    </filter>
    <filter id="g10-blur2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" />
    </filter>
  </defs>
);

/* ---------- bầu trời, mặt trời, đồi xa, mây, hạt sáng ---------- */
const hills = (base: number, amp: number, ph: number, shift: number) => {
  let d = `M -40 ${f1(base + 80)}`;
  for (let x = -40; x <= 1120; x += 40) {
    const xx = x + shift;
    const y = base - amp * (0.55 + 0.45 * Math.sin(xx / 170 + ph) + 0.28 * Math.sin(xx / 71 + ph * 2.3));
    d += ` L ${x} ${f1(y)}`;
  }
  return `${d} L 1120 ${f1(base + 80)} Z`;
};
const CLOUDS = Array.from({length: 7}, (_, i) => ({x: hash(i + 3) * 1500, y: 0.12 + hash(i + 40) * 0.62, s: 0.7 + hash(i + 9) * 0.8, v: 3 + hash(i + 17) * 5}));
const PARTS = Array.from({length: 34}, (_, i) => ({x: hash(i + 100) * 1080, y: hash(i + 200) * 1500, r: 4 + hash(i + 300) * hash(i + 400) * 26, vx: (hash(i + 500) - 0.5) * 10, vy: -3 - hash(i + 600) * 9, a: 0.2 + hash(i + 700) * 0.4, ph: hash(i + 800) * 6.28}));
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Sky = ({t, cam}: {t: number; cam: Cam}) => {
  const hy = horizonY(cam);
  const dusk = duskProgress(t);
  const sunY = hy - 190 + 150 * dusk;
  return (
    <g>
      <rect x={-10} y={-10} width={1100} height={hy + 14} fill="url(#g10-sky)" />
      <rect x={-10} y={-10} width={1100} height={hy + 14} fill="#8B6FC4" opacity={0.2 * dusk} />
      <circle cx={360 - cam.x * 0.05} cy={sunY} r={430} fill="url(#g10-sun)" opacity={0.85} />
      {CLOUDS.map((c, i) => {
        const x = wrap(c.x + t * c.v - cam.x * 0.04, 1500) - 220;
        const y = hy * c.y;
        return (
          <g key={i} transform={`translate(${f1(x)} ${f1(y)}) scale(${c.s})`} opacity={0.62}>
            <ellipse cx={0} cy={0} rx={120} ry={26} fill="#FFE4E6" />
            <ellipse cx={-46} cy={-16} rx={52} ry={26} fill="#FFEFEA" />
            <ellipse cx={30} cy={-24} rx={62} ry={32} fill="#FFEFEA" />
          </g>
        );
      })}
      <path d={hills(hy + 6, 70, 1.0, -cam.x * 0.06)} fill="#B7A3DE" opacity={0.9} />
      <path d={hills(hy + 12, 44, 3.4, -cam.x * 0.12)} fill="#A28DD3" />
      <rect x={-10} y={hy + 8} width={1100} height={2000} fill="url(#g10-ground)" />
      <rect x={-10} y={hy + 8} width={1100} height={230} fill="url(#g10-haze)" />
    </g>
  );
};

export const Particles = ({t, cam}: {t: number; cam: Cam}) => (
  <g>
    {PARTS.map((p, i) => {
      const x = wrap(p.x + p.vx * t - cam.x * 0.1, 1160) - 40;
      const y = wrap(p.y + p.vy * t, 1560) - 40;
      return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#g10-bokeh)" opacity={p.a * (0.7 + 0.3 * Math.sin(t * 0.9 + p.ph))} />;
    })}
  </g>
);

/* ---------- mặt đất: nền đường, hai làn, vạch ---------- */
const ribbon = (cam: Cam, xl: number, xr: number, z0: number, z1: number, y = 0) => {
  const a = Math.max(z0, cam.z - 110);
  const b = Math.min(z1, cam.z + 4600);
  if (b <= a) return '';
  const n = 44;
  const zs = Array.from({length: n + 1}, (_, i) => a + (b - a) * Math.pow(i / n, 1.7));
  const L = zs.map((z) => proj(cam, bend(z) + xl, y, z));
  const R = zs.map((z) => proj(cam, bend(z) + xr, y, z)).reverse();
  return `M ${L.map((p) => `${f1(p.sx)} ${f1(p.sy)}`).join(' L ')} L ${R.map((p) => `${f1(p.sx)} ${f1(p.sy)}`).join(' L ')} Z`;
};
const quad = (cam: Cam, xl: number, xr: number, z0: number, z1: number) => {
  const pts = [proj(cam, bend(z0) + xl, 0, z0), proj(cam, bend(z0) + xr, 0, z0), proj(cam, bend(z1) + xr, 0, z1), proj(cam, bend(z1) + xl, 0, z1)];
  if (pts.some((p) => p.depth < 60)) return '';
  return `M ${pts.map((p) => `${f1(p.sx)} ${f1(p.sy)}`).join(' L ')} Z`;
};

export const BLUE = {l: -215, r: -25, c: -120};
export const ORANGE = {l: 25, r: 215, c: 120};
const FAR = 9000;
const DASH_GAP = 160;
const DASH_LEN = 62;
const DASH_SPEED = 110;

export const Ground = ({t, cam, week}: {t: number; cam: Cam; week: {z: number; a: number}}) => {
  const g = orangeGlow(t);
  const dashes: {blue: string; orange: string}[] = [];
  const first = Math.floor((cam.z - 100 - t * DASH_SPEED) / DASH_GAP);
  for (let i = first; i < first + 30; i++) {
    const z0 = i * DASH_GAP + t * DASH_SPEED;
    if (z0 < 0) continue;
    dashes.push({
      blue: z0 + DASH_LEN < BLUE_END ? quad(cam, BLUE.c - 7, BLUE.c + 7, z0, z0 + DASH_LEN) : '',
      orange: quad(cam, ORANGE.c - 7, ORANGE.c + 7, z0, z0 + DASH_LEN),
    });
  }
  const orangeFill = mix('#EFC9A0', '#FFA84A', g);
  return (
    <g>
      <path d={ribbon(cam, -268, 268, -3000, FAR)} fill="#9A9CD9" />
      <path d={ribbon(cam, -250, 250, -3000, FAR)} fill="#7578BA" />
      <path d={ribbon(cam, BLUE.l, BLUE.r, 0, BLUE_END)} fill="#59A8F3" />
      <path d={ribbon(cam, BLUE.l + 22, BLUE.r - 22, 0, BLUE_END)} fill="#8CC8FF" opacity={0.4} />
      <path d={ribbon(cam, ORANGE.l, ORANGE.r, 0, FAR)} fill={orangeFill} />
      <path d={ribbon(cam, ORANGE.l + 22, ORANGE.r - 22, 0, FAR)} fill="#FFD08A" opacity={0.18 + 0.5 * g} />
      {/* lằn sáng chạy trong làn cam khi làn sáng lên */}
      <g filter="url(#g10-blur)" opacity={0.55 * g}>
        <path d={ribbon(cam, ORANGE.l - 14, ORANGE.r + 14, 0, FAR)} fill="#FFC66B" />
      </g>
      {week.a > 0.01 && (
        <g opacity={week.a}>
          <path d={ribbon(cam, ORANGE.l, ORANGE.r, 0, week.z)} fill="#FFE9B0" opacity={0.75} />
          <g filter="url(#g10-blur)">
            <path d={ribbon(cam, ORANGE.l - 20, ORANGE.r + 20, 0, week.z)} fill="#FFD27A" opacity={0.8} />
          </g>
        </g>
      )}
      {[BLUE.l, BLUE.r].map((x, i) => (
        <path key={`b${i}`} d={ribbon(cam, x - 4, x + 4, 0, BLUE_END)} fill="#fff" opacity={0.9} />
      ))}
      {[ORANGE.l, ORANGE.r].map((x, i) => (
        <path key={`o${i}`} d={ribbon(cam, x - 4, x + 4, 0, FAR)} fill="#fff" opacity={0.9} />
      ))}
      {[-238, 238].map((x) => (
        <path key={`edge${x}`} d={ribbon(cam, x - 4, x + 4, -3000, FAR)} fill="#fff" opacity={0.45} />
      ))}
      {Array.from({length: 12}, (_, i) => {
        const z0 = (Math.floor((cam.z - 100 - t * DASH_SPEED) / DASH_GAP) + i) * DASH_GAP + t * DASH_SPEED;
        return z0 + DASH_LEN < 0 ? <path key={`pre${i}`} d={quad(cam, -9, 9, z0, z0 + DASH_LEN)} fill="#fff" opacity={0.6} /> : null;
      })}
      {dashes.map((d, i) => (
        <g key={i}>
          {d.blue && <path d={d.blue} fill="#fff" opacity={0.85} />}
          {d.orange && <path d={d.orange} fill="#fff" opacity={0.55 + 0.4 * g} />}
        </g>
      ))}
    </g>
  );
};

/* ---------- vật ven đường ---------- */
const Shadow = ({rx}: {rx: number}) => <ellipse cx={0} cy={4} rx={rx} ry={rx * 0.2} fill="#3A2F6E" opacity={0.22} />;

const Lamp = ({dusk}: {dusk: number}) => (
  <g>
    <Shadow rx={26} />
    <rect x={-5} y={-230} width={10} height={232} rx={4} fill="#4B4F8F" stroke={NAVY} strokeWidth={4} />
    <circle cy={-246} r={90 + 50 * dusk} fill="url(#g10-lamp)" opacity={0.5 + 0.4 * dusk} />
    <circle cy={-246} r={24} fill="#FFEFB0" stroke={NAVY} strokeWidth={6} />
    <rect x={-18} y={-226} width={36} height={12} rx={5} fill="#4B4F8F" stroke={NAVY} strokeWidth={4} />
  </g>
);

const Bush = ({s}: {s: number}) => (
  <g transform={`scale(${s})`}>
    <Shadow rx={84} />
    <g stroke={NAVY} strokeWidth={5.5} fill="url(#g10-bush)">
      <circle cx={-46} cy={-34} r={36} />
      <circle cx={46} cy={-32} r={34} />
      <circle cx={0} cy={-56} r={46} />
    </g>
    <circle cx={-14} cy={-68} r={12} fill="#fff" opacity={0.4} />
  </g>
);

const Tree = ({s, bloom}: {s: number; bloom: boolean}) => (
  <g transform={`scale(${s})`}>
    <Shadow rx={70} />
    <rect x={-11} y={-150} width={22} height={152} rx={8} fill="#C98A63" stroke={NAVY} strokeWidth={5.5} />
    <g stroke={NAVY} strokeWidth={5.5} fill={bloom ? 'url(#g10-bloom)' : 'url(#g10-bush)'}>
      <circle cx={-50} cy={-170} r={52} />
      <circle cx={52} cy={-176} r={48} />
      <circle cx={0} cy={-214} r={64} />
    </g>
    <circle cx={-16} cy={-236} r={16} fill="#fff" opacity={0.4} />
  </g>
);

/** Bên phải đường quanh ngôi nhà (cảnh 8) để trống cho máy quay và ngôi nhà */
const nearHouse = (z: number) => z > HOUSE.z - 380 && z < HOUSE.z + 260;

export const scenery = (cam: Cam, t: number): Sprite[] => {
  const out: Sprite[] = [];
  const dusk = duskProgress(t);
  const push = (s: Sprite | null) => s && out.push(s);
  // cột đèn hai bên mép đường, cách nhau 300
  const l0 = Math.floor((cam.z - 80) / 300);
  for (let i = l0; i < l0 + 16; i++) {
    const z = i * 300;
    if (z < 40) continue;
    for (const side of [-1, 1]) if (!(side === 1 && nearHouse(z))) push(sprite(cam, bend(z) + side * 305, 0, z, `lamp${i}_${side}`, <Lamp dusk={dusk} />));
  }
  // bụi cây và cây rải ngẫu nhiên hai bên, ngoài vùng làn
  const b0 = Math.floor((cam.z - 80) / 130);
  for (let i = b0; i < b0 + 36; i++) {
    const h1 = hash(i);
    const h2 = hash(i + 55);
    const side = h1 > 0.5 ? 1 : -1;
    const z = i * 130 + h2 * 90;
    if (side === 1 && nearHouse(z)) continue;
    const x = bend(z) + side * (330 + hash(i + 9) * 520);
    if (h2 > 0.45) push(sprite(cam, x, 0, z, `tree${i}`, <Tree s={0.8 + 0.5 * hash(i + 21)} bloom={hash(i + 33) > 0.5} />));
    else push(sprite(cam, x, 0, z, `bush${i}`, <Bush s={0.7 + 0.6 * hash(i + 21)} />));
  }
  return out;
};
