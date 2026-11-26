/* Thế giới của V007: MỘT đoạn đại tràng cắt dọc (lòng ruột nhìn ngang), camera bay liên tục dọc theo nó và xoay theo hướng ống.
   Các lớp: nền gradient + hạt bay (màn hình) -> thân người mờ (thế giới, thị sai) -> thành ruột nhiều lớp (viền, thành, lòng chuyển màu đậm-nhạt,
   mạch máu, nếp gấp, gờ nếp ở mép cắt) -> polyp nhỏ nằm im -> nhân vật/đạo cụ do index.tsx truyền vào. */
import {NAVY} from '../../src/common/overlays';
import {P, lerp} from '../../src/timeline';
import {E, S} from './timeline';
import {ANUS, D, PATH_LEN, R_L, U_DESC, U_POLYP, U_SIGMA, offsetD, pathAt, uNear, U_RECTUM} from './Path';
import {clamp01, gapAt, smooth} from './Motion';

export const SCY = 700;

/* ---------- máy quay: mốc [t, tâm x, tâm y, độ phóng, góc xoay độ], nội suy Hermite (vận tốc liên tục, không khựng ở mốc) + rung nhẹ ---------- */
export type Cam = {x: number; y: number; s: number; rot: number};
type Key = [number, number, number, number, number];

const pc = (du: number, dy = -70): [number, number] => {
  const p = pathAt(U_POLYP + du);
  return [p.x, p.y + dy];
};
const camDu = (t: number) => 0.55 * gapAt(t) - 38;
const OV: [number, number] = [615, 1040]; // tâm khung nhìn toàn bộ đại tràng (z = 0,5 đặt đại tràng ở nửa trên màn hình)
const sg = pathAt(U_SIGMA);
const rc = pathAt(U_RECTUM - 160); // tâm cảnh trực tràng

const KEYS: Key[] = [
  [0, ...pc(camDu(0)), 1.6, 0],
  [S(2) + 1.2, ...pc(camDu(S(2) + 1.2)), 1.68, 0],
  [E(2), ...pc(camDu(E(2))), 1.74, 0],
  [S(3) + 1, ...pc(camDu(S(3) + 1)), 1.8, 0],
  [S(4), ...pc(camDu(S(4))), 1.86, 0],
  [S(5) + 0.5, ...pc(camDu(S(5) + 0.5) - 10), 1.94, 0],
  [E(5), ...pc(camDu(E(5)) - 10), 1.9, 0],
  [S(6) + 0.7, ...pc(40), 1.3, 0],
  [S(6) + 1.5, OV[0], OV[1], 0.53, 0],
  [E(6), OV[0], OV[1], 0.53, 0],
  [S(7) + 3.5, OV[0] + 6, OV[1] - 8, 0.545, 0],
  [E(7) + 0.1, OV[0] + 10, OV[1] - 14, 0.56, 0],
  [S(8) + 1.7, sg.x + 70, sg.y, 1.5, 0],
  [E(8) + 0.2, sg.x + 50, sg.y, 1.55, 0],
  [S(9) + 1.6, rc.x + 63, rc.y - 21, 1.5, -72],
  [E(9) + 0.3, rc.x + 71, rc.y - 21, 1.55, -72],
  [S(10) + 2.4, sg.x + 40, sg.y, 1.25, 0],
  [E(10) + 1.0, sg.x + 40, sg.y - 10, 1.2, 0],
];

const hermite = (v: number[], ts: number[], i: number, u: number) => {
  const m = (k: number) => {
    const a = Math.max(0, k - 1);
    const b = Math.min(v.length - 1, k + 1);
    return (v[b] - v[a]) / (ts[b] - ts[a]);
  };
  const h = ts[i + 1] - ts[i];
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v[i] + (u3 - 2 * u2 + u) * h * m(i) + (-2 * u3 + 3 * u2) * v[i + 1] + (u3 - u2) * h * m(i + 1);
};
const KT = KEYS.map((k) => k[0]);
const KX = KEYS.map((k) => k[1]);
const KY = KEYS.map((k) => k[2]);
const KS = KEYS.map((k) => Math.log(k[3]));
const KR = KEYS.map((k) => k[4]);
export const camera = (t: number): Cam => {
  let base: Cam;
  if (t <= KT[0]) base = {x: KX[0], y: KY[0], s: Math.exp(KS[0]), rot: KR[0]};
  else if (t >= KT[KT.length - 1]) base = {x: KX[KX.length - 1], y: KY[KY.length - 1], s: Math.exp(KS[KS.length - 1]), rot: KR[KR.length - 1]};
  else {
    let i = 0;
    while (t >= KT[i + 1]) i++;
    const u = (t - KT[i]) / (KT[i + 1] - KT[i]);
    base = {x: hermite(KX, KT, i, u), y: hermite(KY, KT, i, u), s: Math.exp(hermite(KS, KT, i, u)), rot: hermite(KR, KT, i, u)};
  }
  // rung nhẹ: luôn có chuyển động
  return {x: base.x + 6 * Math.sin(t * 0.8), y: base.y + 5 * Math.cos(t * 0.6), s: base.s * (1 + 0.006 * Math.sin(t * 1.1)), rot: base.rot + 0.9 * Math.sin(t * 0.45)};
};
export const viewTransform = (c: Cam) => `translate(540 ${SCY}) rotate(${c.rot.toFixed(3)}) scale(${c.s.toFixed(4)}) translate(${-c.x.toFixed(2)} ${-c.y.toFixed(2)})`;
export const toScreen = (wx: number, wy: number, c: Cam) => {
  const r = (c.rot * Math.PI) / 180;
  const dx = (wx - c.x) * c.s;
  const dy = (wy - c.y) * c.s;
  return {x: 540 + dx * Math.cos(r) - dy * Math.sin(r), y: SCY + dx * Math.sin(r) + dy * Math.cos(r)};
};
/** Máy quay cho lớp nền xa: khi zoom gần trôi chậm hơn (thị sai), khi lùi ra toàn cảnh thì khớp hẳn với đại tràng */
const farCam = (c: Cam): Cam => {
  const ov = clamp01((1.0 - c.s) / 0.45);
  const k = 0.55 + 0.45 * ov;
  return {x: lerp(615, c.x, k), y: lerp(900, c.y, k), s: Math.exp(Math.log(c.s) * k), rot: c.rot * k};
};

/* ---------- số giả ngẫu nhiên có hạt giống ---------- */
const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const f1 = (n: number) => n.toFixed(1);
export const LUMEN_W = 2 * R_L;

/* ---------- định nghĩa dùng chung ---------- */
export const Defs = () => (
  <defs>
    <linearGradient id="g7-poly" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stopColor="#E4CBF7" />
      <stop offset="0.55" stopColor="#C29BEA" />
      <stop offset="1" stopColor="#9569CC" />
    </linearGradient>
    <linearGradient id="g7-bump" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F4A4AB" />
      <stop offset="1" stopColor="#DB7480" />
    </linearGradient>
    <linearGradient id="g7-scope" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7FDAF0" />
      <stop offset="0.55" stopColor="#35AFD3" />
      <stop offset="1" stopColor="#1D7FAF" />
    </linearGradient>
    <radialGradient id="g7-bokeh" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
      <stop offset="0.7" stopColor="#fff" stopOpacity="0.45" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="g7-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
      <stop offset="0.5" stopColor="#FFE7D2" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FFE7D2" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="g7-beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFF3B8" stopOpacity="0.95" />
      <stop offset="0.5" stopColor="#FFF3B8" stopOpacity="0.4" />
      <stop offset="1" stopColor="#FFF3B8" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="g7-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
      <stop offset="0.2" stopColor="#FFFFFF" stopOpacity="0.5" />
      <stop offset="1" stopColor="#FFE3E6" stopOpacity="0.4" />
    </linearGradient>
    <filter id="g7-soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="4" />
    </filter>
  </defs>
);

/* ---------- nền màn hình: gradient + ánh sáng + hạt bay chậm ---------- */
type Particle = {x: number; y: number; r: number; vx: number; vy: number; d: number; a: number; kind: number; ph: number};
const PARTICLES: Particle[] = (() => {
  const rnd = mulberry(707);
  return Array.from({length: 54}, (_, i) => ({
    x: rnd() * 1080,
    y: rnd() * 1500,
    r: 4 + rnd() * rnd() * 34,
    vx: (rnd() - 0.5) * 14,
    vy: -4 - rnd() * 12,
    d: 0.15 + rnd() * 0.7,
    a: 0.25 + rnd() * 0.45,
    kind: i % 9 === 0 ? 1 : 0,
    ph: rnd() * 6.28,
  }));
})();
const wrap = (v: number, m: number) => ((v % m) + m) % m;

export const Backdrop = ({t, cam}: {t: number; cam: Cam}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFF3EE 0%, #FFDDD6 36%, #F9BFC4 72%, #EB9CB0 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 760px 620px at ${540 + 30 * Math.sin(t * 0.3)}px ${760 + 20 * Math.cos(t * 0.4)}px, rgba(255,255,255,0.65), rgba(255,255,255,0) 70%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Defs />
      {PARTICLES.map((p, i) => {
        const camx = (cam.x - 540) * p.d * 0.3;
        const camy = (cam.y - 720) * p.d * 0.3;
        const x = wrap(p.x + p.vx * t - camx, 1160) - 40;
        const y = wrap(p.y + p.vy * t - camy, 1560) - 40;
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.9 + p.ph);
        if (p.kind === 1) {
          const r = 9 + p.r * 0.3;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${t * 10 + p.ph * 20})`} opacity={p.a * 0.8}>
              <path d={`M ${-r} 0 H ${r} M 0 ${-r} V ${r}`} stroke="#F26E21" strokeWidth={r * 0.55} strokeLinecap="round" />
            </g>
          );
        }
        return <circle key={i} cx={x} cy={y} r={p.r} fill="url(#g7-bokeh)" opacity={p.a * pulse} />;
      })}
    </svg>
  </>
);

/** Phủ mờ ngoài vùng đang nói tới (độ mờ khoảng 30–40%): tâm/bán kính theo toạ độ thế giới, a = độ đặc 0..1 */
export const Focus = ({cam, x, y, r, a}: {cam: Cam; x: number; y: number; r: number; a: number}) => {
  if (a <= 0.01) return null;
  const s = toScreen(x, y, cam);
  const R = r * cam.s;
  return <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle ${R * 1.7}px at ${s.x}px ${s.y}px, rgba(250,225,230,0) ${R * 0.7}px, rgba(250,220,226,${0.42 * a}) ${R * 1.7}px)`}} />;
};

/* ---------- thân người mờ phía sau: xương sườn, gan, dạ dày, ruột non, mạch lớn, khung chậu ---------- */
const BODY =
  'M 330 60 C 120 90 -70 260 -100 560 C -120 820 -60 1000 -90 1260 C -110 1460 -70 1660 -50 1900 L 1290 1900 C 1310 1660 1350 1460 1330 1260 C 1300 1000 1360 820 1340 560 C 1310 260 1130 90 900 60 Z';
const RIBS = Array.from({length: 6}, (_, i) => {
  const y = 150 + i * 54;
  const w = 560 + Math.min(i, 3) * 40 - Math.max(0, i - 3) * 50;
  return `M 615 ${y - 10} C ${615 - w * 0.45} ${y - 50} ${615 - w} ${y - 14} ${615 - w - 20} ${y + 130} M 615 ${y - 10} C ${615 + w * 0.45} ${y - 50} ${615 + w} ${y - 14} ${615 + w + 20} ${y + 130}`;
}).join(' ');
// ruột non cuộn trong khung đại tràng: một đường ngoằn ngoèo liên tục
const SMALL_INTESTINE = (() => {
  const rows = [580, 662, 744, 826, 908, 990, 1072, 1154];
  let d = 'M 300 580';
  rows.forEach((y, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const x0 = dir === 1 ? 300 : 960;
    const x1 = dir === 1 ? 960 : 300;
    const mid1 = lerp(x0, x1, 0.33);
    const mid2 = lerp(x0, x1, 0.66);
    d += ` C ${mid1} ${y - 30} ${mid2} ${y + 30} ${x1} ${y}`;
    if (i < rows.length - 1) d += ` C ${x1 + dir * 52} ${y + 12} ${x1 + dir * 52} ${y + 70} ${x1} ${y + 82}`;
  });
  return d;
})();
export const GhostBody = ({cam, t}: {cam: Cam; t: number}) => {
  const c = farCam(cam);
  return (
    <g transform={viewTransform(c)}>
      <g filter="url(#g7-soft)">
        <path d={BODY} fill="url(#g7-body)" stroke="#fff" strokeOpacity={0.75} strokeWidth={10} />
        <path d={RIBS} fill="none" stroke="#F2AFA6" strokeOpacity={0.6} strokeWidth={16} strokeLinecap="round" />
        {/* gan (bên trái màn hình), dạ dày (bên phải), lách */}
        <path d="M -40 230 C 120 170 360 190 470 300 C 520 350 470 440 370 470 C 250 500 90 470 10 400 C -50 350 -70 280 -40 230 Z" fill="#E88D84" fillOpacity={0.42} stroke="#D9746C" strokeOpacity={0.45} strokeWidth={8} />
        <path d="M 800 250 C 900 210 1060 240 1090 330 C 1115 420 1020 470 930 440 C 840 410 760 330 800 250 Z" fill="#F0A296" fillOpacity={0.42} stroke="#E08B80" strokeOpacity={0.45} strokeWidth={8} />
        {/* ruột non */}
        <path d={SMALL_INTESTINE} fill="none" stroke="#C4566A" strokeOpacity={0.85} strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" />
        <path d={SMALL_INTESTINE} fill="none" stroke="#EE8E9A" strokeOpacity={0.9} strokeWidth={52} strokeLinecap="round" strokeLinejoin="round" />
        <path d={SMALL_INTESTINE} fill="none" stroke="#FBD0CC" strokeOpacity={0.8} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -8)" />
        <path d={SMALL_INTESTINE} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60 90" strokeDashoffset={-t * 26} />
        {/* mạch lớn: động mạch chủ (đỏ) và tĩnh mạch chủ dưới (xanh), hạt trắng chạy theo dòng máu */}
        {[
          {d: 'M 700 70 C 706 400 690 800 686 1200 C 684 1400 650 1560 620 1760', c: '#E5675A', dir: 1},
          {d: 'M 520 560 C 514 800 526 1100 530 1300 C 534 1450 560 1580 580 1760', c: '#6C8FD8', dir: -1},
        ].map((v, i) => (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={v.d} stroke={v.c} strokeOpacity={0.5} strokeWidth={28} />
            <path d={v.d} stroke="#fff" strokeOpacity={0.7} strokeWidth={7} strokeDasharray="2 44" strokeDashoffset={v.dir * t * 90} />
          </g>
        ))}
        {/* khung chậu và bàng quang */}
        <path d="M 120 1380 C 150 1560 330 1660 560 1700 M 1110 1380 C 1080 1560 900 1660 670 1700" fill="none" stroke="#EFB3A8" strokeOpacity={0.6} strokeWidth={34} strokeLinecap="round" />
        <path d="M 520 1640 C 500 1560 720 1560 700 1640 C 690 1720 530 1720 520 1640 Z" fill="#F3A99C" fillOpacity={0.4} stroke="#E88F82" strokeOpacity={0.45} strokeWidth={7} />
        <ellipse cx={615} cy={780 + 6 * Math.sin(t * 2.2)} rx={640} ry={560} fill="none" stroke="#fff" strokeOpacity={0.1} strokeWidth={30} />
      </g>
    </g>
  );
};

/* ---------- đại tràng ---------- */
const CENTER = offsetD(0);
const OUT_TOP = offsetD(-(R_L + 17));
const OUT_BOT = offsetD(R_L + 17);
const SHEEN = offsetD(-(R_L + 26), 0, PATH_LEN, 2);

// nếp gấp: vị trí theo độ dài đường tâm
const FOLDS = (() => {
  const rnd = mulberry(77);
  const out: {u: number; lean: number; ph: number}[] = [];
  for (let u = 70; u < PATH_LEN - 40; u += 118 + rnd() * 26) out.push({u, lean: 24 + rnd() * 16, ph: rnd() * 6.28});
  return out;
})();

// mạch máu nhỏ trên thành trong của lòng ruột
const VESSELS = (() => {
  const rnd = mulberry(1203);
  const out: string[] = [];
  const pt = (u: number, v: number) => {
    const p = pathAt(Math.max(0, Math.min(PATH_LEN, u)));
    return `${f1(p.x + p.nx * v)} ${f1(p.y + p.ny * v)}`;
  };
  for (let i = 0; i < 70; i++) {
    const u0 = rnd() * PATH_LEN;
    const side = rnd() < 0.5 ? -1 : 1;
    let u = u0;
    let v = side * (R_L - 4);
    let d = `M ${pt(u, v)}`;
    const steps = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < steps; k++) {
      const du = (rnd() - 0.3) * 54;
      const dv = -side * (14 + rnd() * 20);
      const cu = u + du * 0.5 + (rnd() - 0.5) * 24;
      const cv = v + dv * 0.3 + (rnd() - 0.5) * 12;
      u += du;
      v += dv;
      d += ` Q ${pt(cu, cv)} ${pt(u, v)}`;
    }
    out.push(d);
    if (rnd() < 0.5) {
      // nhánh phụ
      let bu = u0 + 14;
      let bv = side * (R_L - 24);
      let bd = `M ${pt(bu, bv)}`;
      for (let k = 0; k < 2; k++) {
        const du = 22 + rnd() * 20;
        const dv = -side * (8 + rnd() * 12);
        bd += ` Q ${pt(bu + du * 0.5, bv + dv * 0.2 + (rnd() - 0.5) * 8)} ${pt(bu + du, bv + dv)}`;
        bu += du;
        bv += dv;
      }
      out.push(bd);
    }
  }
  return out;
})();

/** Polyp nhỏ nằm im ở thành ruột: u theo đường tâm, side +1 = thành phía pháp tuyến (dưới màn hình với ống nằm ngang), r = bán kính */
type Decoy = {u: number; side: 1 | -1; r: number};
const DECOYS: Decoy[] = (() => {
  const rnd = mulberry(55);
  const near = (du: number, side: 1 | -1, r: number): Decoy => ({u: U_POLYP + du, side, r});
  const out: Decoy[] = [near(-95, -1, 17), near(-185, 1, 22), near(-300, -1, 24), near(-410, 1, 19), near(-170, -1, 14), near(-250, 1, 15)];
  for (let u = 100; u < PATH_LEN - 60; u += 150 + rnd() * 90) {
    if (Math.abs(u - U_POLYP) < 520) continue; // vùng gần polyp chính đã có polyp phụ đặt tay
    out.push({u, side: rnd() < 0.5 ? -1 : 1, r: 14 + rnd() * 12});
  }
  return out;
})();

/** Khung toạ độ ở thành ruột: gốc trên mặt thành trong, trục -y của khung chỉ vào lòng ruột */
export const wallFrame = (u: number, side: 1 | -1, inset = 0) => {
  const p = pathAt(u);
  const x = p.x + p.nx * side * (R_L - inset);
  const y = p.y + p.ny * side * (R_L - inset);
  const inx = -p.nx * side;
  const iny = -p.ny * side;
  return {x, y, rot: (Math.atan2(inx, -iny) * 180) / Math.PI};
};

const Decoys = ({t}: {t: number}) => (
  <g>
    {DECOYS.map((d, i) => {
      const f = wallFrame(d.u, d.side, 3);
      const r = d.r * (1 + 0.025 * Math.sin(t * 1.6 + i));
      const h = r * 1.05;
      return (
        <g key={i} transform={`translate(${f1(f.x)} ${f1(f.y)}) rotate(${f1(f.rot)})`}>
          <path d={`M ${-r - 8} 5 Q 0 -${r * 0.35} ${r + 8} 5 L ${r + 8} 14 L ${-r - 8} 14 Z`} fill="#C95C6B" opacity={0.35} />
          <path d={`M ${-r} 4 C ${-r} ${-h * 1.35} ${r} ${-h * 1.35} ${r} 4 Z`} fill="url(#g7-poly)" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M ${-r * 0.62} ${-h * 0.35} C ${-r * 0.55} ${-h * 0.8} ${-r * 0.1} ${-h * 0.95} ${r * 0.2} ${-h * 0.9}`} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={Math.max(3, r * 0.18)} strokeLinecap="round" />
          <circle cx={r * 0.35} cy={-h * 0.38} r={r * 0.1} fill="#7B52B8" opacity={0.5} />
          <circle cx={-r * 0.1} cy={-h * 0.18} r={r * 0.08} fill="#7B52B8" opacity={0.5} />
        </g>
      );
    })}
  </g>
);

type ColonProps = {t: number; /** biên độ sóng nhu động 0..1 */ wave?: number; /** bóng tối ở lòng ruột khi ánh đèn dịu (cảnh nghiêm) */ dim?: number};

export const Colon = ({t, wave = 0.25, dim = 0}: ColonProps) => {
  const caps = [
    {w: D + 14, c: NAVY},
    {w: D, c: '#F7BEB2'},
    {w: D - 16, c: '#EF9D98'},
    {w: LUMEN_W + 10, c: NAVY},
    {w: LUMEN_W, c: '#D4636F'},
    {w: LUMEN_W * 0.82, c: '#E07C86'},
    {w: LUMEN_W * 0.62, c: '#EB939A'},
    {w: LUMEN_W * 0.42, c: '#F4AAAB'},
    {w: LUMEN_W * 0.22, c: '#FBC3BB'},
  ];
  return (
    <g>
      {/* bóng đổ dưới ống */}
      <path d={CENTER} fill="none" stroke="#8E2F47" strokeOpacity={0.2} strokeWidth={D + 26} strokeLinecap="butt" strokeLinejoin="round" transform="translate(8 16)" />
      {caps.map((c, i) => (
        <g key={i}>
          <path d={CENTER} fill="none" stroke={c.c} strokeWidth={c.w} strokeLinecap="butt" strokeLinejoin="round" />
          {/* manh tràng: đầu cụt tròn */}
          <circle cx={190} cy={920} r={c.w / 2} fill={c.c} />
        </g>
      ))}
      {/* thớ cơ và ánh bóng trên thành ruột */}
      <path d={OUT_TOP} fill="none" stroke="#E27F85" strokeOpacity={0.6} strokeWidth={2.4} strokeDasharray="26 34" strokeLinecap="round" />
      <path d={OUT_BOT} fill="none" stroke="#E27F85" strokeOpacity={0.6} strokeWidth={2.4} strokeDasharray="34 26" strokeLinecap="round" strokeDashoffset={20} />
      <path d={SHEEN} fill="none" stroke="#FFF0EA" strokeOpacity={0.55} strokeWidth={6} strokeDasharray="80 150" strokeLinecap="round" />
      {/* ruột thừa nhỏ ở manh tràng */}
      <g transform="translate(120 1008) rotate(-30)">
        <path d="M -14 0 C -22 40 -6 78 18 90 C 38 98 50 72 36 56 C 22 40 20 20 16 0 Z" fill="#EF9D98" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
      </g>
      {/* mạch máu nhỏ */}
      {VESSELS.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round">
          <path d={d} stroke="#B93A4A" strokeOpacity={0.5} strokeWidth={4.6} />
          <path d={d} stroke="#FFC9C2" strokeOpacity={0.55} strokeWidth={1.5} transform="translate(-1.5 -1.5)" />
        </g>
      ))}
      {/* nếp gấp và gờ nếp ở mép cắt, trượt nhẹ như nhu động */}
      {FOLDS.map((f, k) => {
        const sh = (6 + 12 * wave) * Math.sin(t * 1.5 - f.u * 0.011 + f.ph) + 16 * wave * Math.sin(t * 0.9 - f.u * 0.006);
        const p = pathAt(f.u + sh);
        const depth = 32 * (1 + 0.28 * wave * Math.sin(t * 1.5 - f.u * 0.011 + f.ph));
        const tx = p.tx;
        const ty = p.ty;
        const nx = p.nx;
        const ny = p.ny;
        const A = {x: p.x - nx * R_L, y: p.y - ny * R_L};
        const B = {x: p.x + nx * R_L, y: p.y + ny * R_L};
        const q = {x: p.x + tx * f.lean * 1.6, y: p.y + ty * f.lean * 1.6};
        const band = `M ${f1(A.x)} ${f1(A.y)} Q ${f1(q.x)} ${f1(q.y)} ${f1(B.x)} ${f1(B.y)}`;
        const bump = (sgn: 1 | -1) => {
          const b = {x: p.x + nx * sgn * R_L, y: p.y + ny * sgn * R_L};
          const inx = -nx * sgn;
          const iny = -ny * sgn;
          const w = 40;
          const b0 = {x: b.x - tx * w, y: b.y - ty * w};
          const b1 = {x: b.x + tx * w, y: b.y + ty * w};
          const apex = {x: b.x + inx * depth, y: b.y + iny * depth};
          const dd = depth * 0.95;
          return `M ${f1(b0.x)} ${f1(b0.y)} C ${f1(b0.x + inx * dd)} ${f1(b0.y + iny * dd)} ${f1(apex.x - tx * 30)} ${f1(apex.y - ty * 30)} ${f1(apex.x)} ${f1(apex.y)} C ${f1(apex.x + tx * 30)} ${f1(apex.y + ty * 30)} ${f1(b1.x + inx * dd)} ${f1(b1.y + iny * dd)} ${f1(b1.x)} ${f1(b1.y)} Z`;
        };
        return (
          <g key={k}>
            <path d={band} fill="none" stroke="#C8586A" strokeOpacity={0.5} strokeWidth={22} strokeLinecap="round" />
            <path d={band} fill="none" stroke="#E5838D" strokeWidth={13} strokeLinecap="round" />
            <path d={band} fill="none" stroke="#FFD9CE" strokeOpacity={0.85} strokeWidth={4} strokeLinecap="round" transform={`translate(${f1(-tx * 6)} ${f1(-ty * 6)})`} />
            <path d={bump(-1)} fill="url(#g7-bump)" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
            <path d={bump(1)} fill="url(#g7-bump)" stroke={NAVY} strokeWidth={5} strokeLinejoin="round" />
          </g>
        );
      })}
      {/* hậu môn: vòng nếp ở đầu cuối */}
      <g transform={`translate(${f1(ANUS.x)} ${f1(ANUS.y)}) rotate(${f1((Math.atan2(ANUS.ty, ANUS.tx) * 180) / Math.PI)})`}>
        <path d={`M -2 ${-D / 2 - 6} C 38 ${-D / 2 - 6} 38 ${D / 2 + 6} -2 ${D / 2 + 6} Z`} fill="#E88C92" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M 4 ${-R_L} C 22 -40 22 40 4 ${R_L}`} fill="none" stroke="#C25A68" strokeWidth={9} strokeLinecap="round" />
      </g>
      <Decoys t={t} />
      {/* ánh dịu ở lòng ruột khi đèn dịu */}
      {dim > 0.01 && <path d={CENTER} fill="none" stroke="#8E2F57" strokeOpacity={0.22 * dim} strokeWidth={LUMEN_W} strokeLinecap="butt" strokeLinejoin="round" />}
    </g>
  );
};

/** Mốc dùng cho focus/đạo cụ: vị trí thế giới của điểm cách polyp `du` trên đường tâm */
export const atPolyp = (du: number) => pathAt(U_POLYP + du);
export {uNear, U_POLYP, U_SIGMA, U_DESC, U_RECTUM, P, clamp01, smooth};
