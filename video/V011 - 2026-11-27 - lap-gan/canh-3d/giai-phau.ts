/* Hình học giải phẫu của V011 (lắp ráp lá gan), sinh hoàn toàn bằng code từ khối cơ bản, không tải mô hình ngoài.
   Hệ toạ độ: y hướng lên, z hướng về phía người xem; nhìn từ phía trước nên thuỳ phải của bệnh nhân nằm bên trái màn hình (x âm).
   - Hai thuỳ gan: hai khối ellipsoid bo mềm. Thuỳ phải to hơn.
   - Bốn hệ ống: tĩnh mạch cửa, động mạch gan, ống mật (đi kèm nhau thành "bộ ba" ở rốn gan) và tĩnh mạch gan (thoát lên tĩnh mạch chủ).
   - Túi mật, ống mật chủ, đoạn ruột non; khung sườn mờ.
   - Tiểu thuỳ lục giác: lăng trụ sáu cạnh, tĩnh mạch trung tâm, sáu "bộ ba" ở sáu góc, các hàng tế bào gan xếp toả tròn. */
import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {taperedTube} from '../../V005 - 2026-11-26 - phoi-tam-soat/canh-3d/giai-phau';

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const sphereAt = (p: THREE.Vector3, r: number, w = 12, h = 9) => {
  const g = new THREE.SphereGeometry(r, w, h).translate(p.x, p.y, p.z);
  g.deleteAttribute('uv');
  return g;
};

/* ---------------- hai thuỳ gan ---------------- */
export type Lobe = {c: THREE.Vector3; r: THREE.Vector3};
export const RL: Lobe = {c: V(-0.9, 0.1, 0), r: V(2.4, 1.85, 1.9)};
export const LL: Lobe = {c: V(2.3, -0.05, 0.1), r: V(1.75, 1.2, 1.35)};
export const LIVER_C = V(0.3, -0.1, 0);

/** Biến dạng điểm trên cầu đơn vị thành dáng thuỳ (đáy phẳng hơn đỉnh; thuỳ trái thon dần về đầu mút) */
const deform = (kind: 'R' | 'L', p: THREE.Vector3) => {
  if (kind === 'R') {
    if (p.y < 0) p.y *= 0.6;
  } else {
    p.y *= p.y < 0 ? 0.55 : 0.85;
    p.z *= 0.62 + 0.38 * ((1 - p.x) / 2);
  }
  return p;
};

export const buildLobe = (kind: 'R' | 'L') => {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 64, 44);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    deform(kind, v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

/** Điểm trên mặt thuỳ ở vị trí (ux, uy) của cầu đơn vị nhìn từ phía trước (dùng đặt mặt) */
export const lobePoint = (kind: 'R' | 'L', ux: number, uy: number) => {
  const lobe = kind === 'R' ? RL : LL;
  const uz = Math.sqrt(Math.max(0, 1 - ux * ux - uy * uy));
  const p = deform(kind, V(ux, uy, uz));
  return V(lobe.c.x + p.x * lobe.r.x, lobe.c.y + p.y * lobe.r.y, lobe.c.z + p.z * lobe.r.z);
};

const insideLiver = (p: THREE.Vector3, k = 0.84) =>
  [RL, LL].some((l) => {
    const dy = (p.y - l.c.y) / (l.r.y * k * (p.y < l.c.y ? (l === RL ? 0.6 : 0.55) : 1));
    return ((p.x - l.c.x) / (l.r.x * k)) ** 2 + dy ** 2 + ((p.z - l.c.z) / (l.r.z * k)) ** 2 < 1;
  });

/* ---------------- khung sườn ---------------- */
export const RIB_COUNT = 8;
export const buildRibs = () => {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < RIB_COUNT; i++) {
    const y0 = -1.0 + 0.58 * i;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 30; k++) {
      const a = THREE.MathUtils.degToRad(-142 + (284 * k) / 30);
      pts.push(V(0.3 + 4.9 * Math.sin(a), y0 + 0.36 * (1 - Math.cos(a)) - 0.2, 3.4 * Math.cos(a) - 0.2));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.17, 10, false);
    g.deleteAttribute('uv');
    out.push(g);
  }
  return out;
};

/* ---------------- các hệ ống ---------------- */
export type Seg = {curve: THREE.CatmullRomCurve3; r0: number; r1: number; depth: number};

const randPerp = (d: THREE.Vector3, rand: () => number) => {
  const r = V(rand() - 0.5, rand() - 0.5, rand() - 0.5);
  return r.sub(d.clone().multiplyScalar(r.dot(d))).normalize();
};

const grow = (segs: Seg[], rand: () => number, a: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, depth: number, maxD: number, bias: THREE.Vector3) => {
  const d = dir.clone().normalize();
  let L = len;
  let b = a.clone().addScaledVector(d, L);
  for (let k = 0; k < 5 && !insideLiver(b); k++) {
    L *= 0.72;
    b = a.clone().addScaledVector(d, L);
  }
  if (!insideLiver(b) || L < 0.2) return;
  const mid = a.clone().lerp(b, 0.5).addScaledVector(randPerp(d, rand), L * 0.1);
  segs.push({curve: new THREE.CatmullRomCurve3([a.clone(), mid, b.clone()]), r0: r, r1: r * 0.76, depth});
  if (depth >= maxD) return;
  for (let s = -1; s <= 1; s += 2) {
    const nd = d.clone().applyAxisAngle(randPerp(d, rand), s * (0.5 + 0.35 * rand())).addScaledVector(bias, 0.2).normalize();
    grow(segs, rand, b, nd, L * 0.8, r * 0.7, depth + 1, maxD, bias);
  }
};

const seg = (pts: THREE.Vector3[], r0: number, r1: number, depth = 0): Seg => ({curve: new THREE.CatmullRomCurve3(pts), r0, r1, depth});

/** Rốn gan: chỗ tĩnh mạch cửa, động mạch gan và ống mật vào/ra, ở đáy gan */
export const HILUM = V(-0.2, -1.0, 0.42);
/** Đầu trên ruột non, nơi ống mật chủ đổ vào */
export const DUODENUM = V(-0.95, -2.7, 0.55);

const buildPortal = () => {
  const segs: Seg[] = [seg([V(-0.4, -3.85, 0.8), V(-0.35, -2.9, 0.75), V(-0.28, -1.9, 0.6), HILUM.clone()], 0.34, 0.3)];
  const rand = mulberry(21);
  const bias = V(0, 0.15, 0);
  grow(segs, rand, HILUM, V(-1, 0.25, -0.05), 1.7, 0.25, 1, 4, bias);
  grow(segs, rand, HILUM, V(1, 0.25, 0), 1.5, 0.22, 1, 4, bias);
  return segs;
};
export const PORTAL = buildPortal();

/** Đường đi kèm: tịnh tiến mỗi đoạn của cây tĩnh mạch cửa sang một bên, vuông góc với đoạn, theo bán kính tại chỗ */
const alongside = (segs: Seg[], side: number, radiusK: number, skipTrunk: boolean): Seg[] =>
  segs
    .filter((s) => !(skipTrunk && s.depth === 0))
    .map((s) => {
      const tg = s.curve.getTangentAt(0.5).normalize();
      let n = new THREE.Vector3().crossVectors(tg, V(0, 0, 1));
      if (n.lengthSq() < 0.05) n = new THREE.Vector3().crossVectors(tg, V(1, 0, 0));
      n.normalize();
      const pts = [0, 0.5, 1].map((u) => {
        const r = s.r0 + (s.r1 - s.r0) * u;
        return s.curve.getPointAt(u).addScaledVector(n, side * r * 1.7);
      });
      return {curve: new THREE.CatmullRomCurve3(pts), r0: s.r0 * radiusK, r1: s.r1 * radiusK, depth: s.depth};
    });

export const ARTERY = alongside(PORTAL, 1, 0.42, false);
const bileBranches = alongside(PORTAL, -1, 0.5, true);

/** Ống mật chủ: từ rốn gan xuống đoạn ruột non; ống túi mật nối vào giữa đường */
export const COMMON_DUCT_JOIN = V(-0.85, -1.9, 0.5);
const bileTrunk = seg([V(-0.7, -1.0, 0.4), V(-0.78, -1.45, 0.46), COMMON_DUCT_JOIN.clone(), DUODENUM.clone()], 0.15, 0.15);
/* Nhánh ống mật trong gan: bắt đầu từ độ dày của chính nhánh nên giữ depth ≥ 1 */
export const BILE = [bileTrunk, ...bileBranches];

/* tĩnh mạch chủ dưới và ba tĩnh mạch gan */
export const CAVA_BASE = V(0.2, 0.8, -0.9);
const buildHepatic = () => {
  const segs: Seg[] = [seg([CAVA_BASE.clone(), V(0.2, 2.1, -1.0), V(0.2, 3.3, -1.0)], 0.34, 0.34)];
  const rand = mulberry(5);
  const bias = V(0, -0.1, 0);
  const root = V(0.2, 0.9, -0.85);
  grow(segs, rand, root, V(-1, -0.35, 0.35), 1.7, 0.27, 1, 3, bias);
  grow(segs, rand, root, V(1, -0.3, 0.3), 1.5, 0.23, 1, 3, bias);
  grow(segs, rand, root, V(0, -0.6, 1), 1.5, 0.22, 1, 3, bias);
  return segs;
};
export const HEPATIC = buildHepatic();

export const MAX_DEPTH = 4;

/** Gộp các đoạn theo độ sâu (cấp 0 là thân, cấp càng cao càng nhỏ), thêm khớp cầu ở đầu mút để chỗ nối liền */
export const levelGeoms = (segs: Seg[]): (THREE.BufferGeometry | null)[] => {
  const out: (THREE.BufferGeometry | null)[] = [];
  for (let d = 0; d <= MAX_DEPTH; d++) {
    const gs: THREE.BufferGeometry[] = [];
    for (const s of segs.filter((x) => x.depth === d)) {
      gs.push(taperedTube(s.curve, 0, 1, 10, 8, s.r0, s.r1));
      gs.push(sphereAt(s.curve.getPointAt(1), s.r1, 10, 8));
    }
    out.push(gs.length ? mergeGeometries(gs) : null);
  }
  return out;
};

/* ---------------- túi mật, ruột non ---------------- */
export const GB_NECK = V(-1.4, -1.35, 0.65);
export const GB_DIR = V(-0.85, -0.35, 0.5).normalize();
export const GB_LEN = 2.2;
export const GB_CENTER = GB_NECK.clone().addScaledVector(GB_DIR, GB_LEN * 0.6);
export const buildGallbladder = () => {
  const prof = [
    [0.0, 0.0],
    [0.1, 0.05],
    [0.15, 0.4],
    [0.27, 0.8],
    [0.47, 1.25],
    [0.54, 1.6],
    [0.46, 2.0],
    [0.2, 2.25],
    [0.0, 2.3],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, 28);
  g.deleteAttribute('uv');
  return g;
};
export const GB_QUAT = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), GB_DIR);

export const CYSTIC_CURVE = new THREE.CatmullRomCurve3([GB_NECK.clone(), V(-1.15, -1.6, 0.6), COMMON_DUCT_JOIN.clone()]);
export const buildCystic = () => taperedTube(CYSTIC_CURVE, 0, 1, 12, 8, 0.12, 0.12);

/** Đường mật chảy từ túi mật xuống ruột non (hạt xanh ở cảnh 10) */
export const GB_FLOW = new THREE.CatmullRomCurve3([GB_NECK.clone(), V(-1.15, -1.6, 0.6), COMMON_DUCT_JOIN.clone(), V(-0.9, -2.3, 0.55), DUODENUM.clone()]);

export const INTESTINE = new THREE.CatmullRomCurve3([DUODENUM.clone().add(V(0, 0.25, 0)), V(-1.5, -3.3, 0.6), V(-0.4, -3.95, 0.8), V(1.5, -3.7, 0.7), V(2.6, -4.5, 0.6)]);
export const buildIntestine = () => {
  const g = new THREE.TubeGeometry(INTESTINE, 90, 0.42, 14, false);
  g.deleteAttribute('uv');
  return g;
};

/* ---------------- tiểu thuỳ lục giác ---------------- */
export const HEX_R = 2.0;
export const HEX_H = 1.2;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Góc thứ k của lăng trụ sáu cạnh (CylinderGeometry đặt đỉnh đầu tiên ở +z, quay về phía +x) */
export const hexCorner = (k: number, r = HEX_R) => V(r * Math.sin(rad(60 * k)), 0, r * Math.cos(rad(60 * k)));

export const buildHexWalls = () => {
  const g = new THREE.CylinderGeometry(HEX_R, HEX_R, HEX_H, 6, 1, true);
  g.deleteAttribute('uv');
  return g;
};

/** Khung lục giác phẳng (một vành dày) nằm ngang, dùng cho mép trên và mép dưới */
export const buildHexRing = (R: number, w = 0.13) => {
  const outer = new THREE.Shape();
  const inner = new THREE.Path();
  for (let k = 0; k < 6; k++) {
    const a = rad(60 * k);
    const f = k === 0 ? 'moveTo' : 'lineTo';
    outer[f](R * Math.sin(a), R * Math.cos(a));
    inner[f]((R - w) * Math.sin(a), (R - w) * Math.cos(a));
  }
  outer.closePath();
  inner.closePath();
  outer.holes.push(inner);
  const g = new THREE.ExtrudeGeometry(outer, {depth: 0.09, bevelEnabled: false});
  g.rotateX(Math.PI / 2);
  g.deleteAttribute('uv');
  return g;
};

/** Tâm tiểu thuỳ trong không gian cảnh (giữa gan) */
export const LOB_POS = V(0.3, 0, 0);
/** "Bộ ba" ở góc k: tĩnh mạch cửa, động mạch, ống mật (toạ độ so với tâm tiểu thuỳ) */
export type Part = 'v' | 'a' | 'b';
export const triadPos = (k: number, part: Part) => {
  const c = hexCorner(k, HEX_R * 0.96);
  const tg = V(Math.cos(rad(60 * k)), 0, -Math.sin(rad(60 * k)));
  const inward = c.clone().normalize().multiplyScalar(-0.12);
  if (part === 'v') return c;
  return c.add(inward).addScaledVector(tg, part === 'a' ? 0.3 : -0.3);
};
export const TRIAD_R = {v: 0.17, a: 0.1, b: 0.11};

/** Các hàng tế bào gan toả từ sáu góc về tâm; mỗi hàng có hai dãy tế bào hai bên một lòng mạch */
export const CELL_R = [0.62, 0.9, 1.18, 1.46, 1.74];
export const buildCells = () => {
  const gs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const dir = hexCorner(k, 1).normalize();
    const side = V(dir.z, 0, -dir.x);
    for (const r of CELL_R) for (const lat of [-0.23, 0.23]) for (const y of [-0.27, 0.27]) {
      const c = dir.clone().multiplyScalar(r).addScaledVector(side, lat);
      const g = new THREE.SphereGeometry(1, 10, 8);
      g.scale(0.2, 0.2, 0.17).rotateY(rad(60 * k)).translate(c.x, y, c.z);
      g.deleteAttribute('uv');
      gs.push(g);
    }
  }
  return mergeGeometries(gs)!;
};

/** Lòng mạch (xoang) ở giữa mỗi hàng: ống mảnh từ góc về tâm */
export const buildSinusoids = () => {
  const gs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) {
    const a = hexCorner(k, HEX_R * 0.9);
    const curve = new THREE.LineCurve3(a, V(0, 0, 0));
    const g = new THREE.TubeGeometry(curve, 8, 0.07, 6, false);
    g.deleteAttribute('uv');
    gs.push(g);
  }
  return mergeGeometries(gs)!;
};
