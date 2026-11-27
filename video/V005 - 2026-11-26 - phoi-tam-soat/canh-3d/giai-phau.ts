/* Hình học giải phẫu của bản 3D, sinh hoàn toàn bằng code (không tải mô hình ngoài).
   Hệ toạ độ: y hướng lên, z hướng về phía người xem. Phổi phải của bệnh nhân nằm bên trái màn hình (x âm).
   - Khí quản: ống có vòng sụn chữ C (hở phía sau), kết thúc ở ngã ba (carina).
   - Cây phế quản: ống thon dần, phân nhánh bằng cách chia cụm các "điểm đầu mút" trong từng thuỳ; đầu mút có chùm phế nang.
   - Hai phổi: 5 thuỳ (phải 3, trái 2) là các khối bo mềm. */
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------------- ống thon dần theo đường cong ---------------- */
export const taperedTube = (curve: THREE.Curve<THREE.Vector3>, u0: number, u1: number, tubular: number, radial: number, r0: number, r1: number) => {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  let prev: THREE.Vector3 | null = null;
  for (let i = 0; i <= tubular; i++) {
    const u = u0 + ((u1 - u0) * i) / tubular;
    const p = curve.getPointAt(u);
    const tg = curve.getTangentAt(u).normalize();
    let n: THREE.Vector3;
    if (!prev) {
      const ref = Math.abs(tg.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0);
      n = ref.sub(tg.clone().multiplyScalar(ref.dot(tg))).normalize();
    } else n = prev.clone().sub(tg.clone().multiplyScalar(prev.dot(tg))).normalize();
    prev = n;
    const b = new THREE.Vector3().crossVectors(tg, n);
    const r = r0 + ((r1 - r0) * i) / tubular;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = n.x * c + b.x * s;
      const ny = n.y * c + b.y * s;
      const nz = n.z * c + b.z * s;
      pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r);
      nor.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
};

const sphereAt = (p: THREE.Vector3, r: number, wSeg = 12, hSeg = 9) => {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg).translate(p.x, p.y, p.z);
  g.deleteAttribute('uv');
  return g;
};

/* ---------------- các thuỳ phổi ---------------- */
export type Lobe = {id: string; side: 'R' | 'L'; c: [number, number, number]; r: [number, number, number]; leaves: number};
export const LOBES: Lobe[] = [
  {id: 'ru', side: 'R', c: [-1.0, 0.95, -0.05], r: [0.85, 1.0, 0.75], leaves: 6},
  {id: 'rm', side: 'R', c: [-0.95, -0.05, 0.25], r: [0.8, 0.58, 0.6], leaves: 4},
  {id: 'rl', side: 'R', c: [-1.05, -1.2, -0.2], r: [0.85, 1.15, 0.95], leaves: 6},
  {id: 'lu', side: 'L', c: [1.0, 0.75, 0], r: [0.82, 1.35, 0.72], leaves: 7},
  {id: 'll', side: 'L', c: [1.05, -1.25, -0.1], r: [0.82, 1.1, 0.85], leaves: 6},
];
/** Toạ độ y của đỉnh và đáy phổi, dùng để đặt vòng CT và nốt */
export const LUNG_TOP = 2.0;
export const LUNG_BOTTOM = -2.35;

/* ---------------- khí quản ---------------- */
export const TRACHEA_R = 0.3;
export const CARINA_Y = 0.74;
export const TRACHEA_TOP = 3.4;

export const buildTracheaMembrane = () => new THREE.CylinderGeometry(TRACHEA_R, TRACHEA_R, TRACHEA_TOP - CARINA_Y, 28, 1, true).translate(0, (TRACHEA_TOP + CARINA_Y) / 2, 0);

/** Vòng sụn chữ C, hở về phía sau (z âm) */
export const buildCartilageRings = () => {
  const arc = Math.PI * 1.92;
  const geos: THREE.BufferGeometry[] = [];
  for (let y = CARINA_Y + 0.2; y < TRACHEA_TOP - 0.05; y += 0.2) {
    const g = new THREE.TorusGeometry(TRACHEA_R + 0.012, 0.05, 10, 30, arc);
    g.rotateX(Math.PI / 2);
    g.rotateY(arc / 2 - Math.PI / 2);
    g.translate(0, y, 0);
    geos.push(g);
  }
  return mergeGeometries(geos)!;
};

/** Sàn ngã ba: đĩa có hai lỗ là miệng hai phế quản chính */
export const MOUTH_R = {x: -0.15, r: 0.135};
export const MOUTH_L = {x: 0.15, r: 0.125};
export const buildCarinaFloor = () => {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, TRACHEA_R + 0.01, 0, Math.PI * 2, false);
  for (const m of [MOUTH_R, MOUTH_L]) {
    const h = new THREE.Path();
    h.absarc(m.x, 0, m.r, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  const g = new THREE.ShapeGeometry(shape, 28);
  g.rotateX(-Math.PI / 2);
  g.translate(0, CARINA_Y, 0);
  const ridge = new THREE.CapsuleGeometry(0.035, 0.34, 4, 8).rotateX(Math.PI / 2).translate(0, CARINA_Y + 0.01, 0);
  return mergeGeometries([g.toNonIndexed(), ridge.toNonIndexed()])!;
};

/* ---------------- cây phế quản ---------------- */
export type Leaf = {tip: THREE.Vector3; dir: THREE.Vector3; r: number; hero: boolean};
export type Tree = {tubes: THREE.BufferGeometry; rings: THREE.BufferGeometry; alveoli: THREE.BufferGeometry; leaves: Leaf[]; hero: THREE.CatmullRomCurve3; heroU: {mouth: number; tip: number}; nerves: THREE.BufferGeometry};

/* Đường đi của camera: từ giữa khí quản, qua ngã ba, vào phế quản phải, xuống thuỳ dưới, đến một chùm phế nang ở sau phổi.
   Ống "anh hùng" cũng chạy theo đúng đường cong này nên camera luôn nằm giữa lòng ống. */
const HERO_PTS: THREE.Vector3[] = [
  V(0, 3.0, 0),
  V(0, 2.2, 0),
  V(0, 1.3, 0),
  V(MOUTH_R.x, CARINA_Y + 0.22, 0),
  V(MOUTH_R.x, CARINA_Y - 0.12, 0),
  V(-0.22, 0.4, 0),
  V(-0.52, 0.02, 0),
  V(-0.95, -0.3, 0),
  V(-1.05, -0.8, -0.05),
  V(-1.2, -1.07, -0.17),
  V(-1.3, -1.25, -0.4),
  V(-1.4, -1.38, -0.66),
];

export const buildTree = (): Tree => {
  const rand = mulberry(7);
  const tubeGeos: THREE.BufferGeometry[] = [];
  const alvGeos: THREE.BufferGeometry[] = [];
  const leaves: Leaf[] = [];

  const hero = new THREE.CatmullRomCurve3(HERO_PTS, false, 'centripetal');
  const total = hero.getLength();
  // điểm trên đường cong chạm sàn ngã ba (y = CARINA_Y): chỗ ống phế quản bắt đầu
  let mouthU = 0;
  while (mouthU < 1 && hero.getPointAt(mouthU).y > CARINA_Y) mouthU += 0.0005;
  const heroU = {mouth: mouthU, tip: 1};
  tubeGeos.push(taperedTube(hero, heroU.mouth, 1, 64, 14, MOUTH_R.r, 0.072));
  tubeGeos.push(sphereAt(HERO_PTS[HERO_PTS.length - 1], 0.072, 14, 10));
  leaves.push({tip: HERO_PTS[HERO_PTS.length - 1].clone(), dir: HERO_PTS[HERO_PTS.length - 1].clone().sub(HERO_PTS[HERO_PTS.length - 2]).normalize(), r: 0.072, hero: true});

  // vòng sụn mảnh dọc phế quản chính (cho thấy chiều sâu khi camera bay trong ống)
  const ringGeos: THREE.BufferGeometry[] = [];
  for (let s = total * mouthU + 0.12; s < total - 0.1; s += 0.15) {
    const u = s / total;
    const p = hero.getPointAt(u);
    const tg = hero.getTangentAt(u).normalize();
    const r = MOUTH_R.r + (0.072 - MOUTH_R.r) * ((u - mouthU) / (1 - mouthU));
    const g = new THREE.TorusGeometry(r * 1.0, Math.max(0.014, r * 0.2), 8, 22, Math.PI * 1.85);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), tg));
    g.translate(p.x, p.y, p.z);
    ringGeos.push(g);
  }

  const seg = (pts: THREE.Vector3[], r0: number, r1: number, bend = 0.1) => {
    const a = pts[0];
    const b = pts[pts.length - 1];
    let ctrl = pts;
    if (pts.length === 2) {
      const mid = a.clone().lerp(b, 0.5);
      const d = b.clone().sub(a);
      const perp = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).cross(d).normalize().multiplyScalar(bend * d.length());
      ctrl = [a, mid.add(perp), b];
    }
    const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    tubeGeos.push(taperedTube(curve, 0, 1, 10, 10, r0, r1));
    tubeGeos.push(sphereAt(b, r1 * 1.02));
  };

  const grow = (origin: THREE.Vector3, pts: THREE.Vector3[], r: number) => {
    if (pts.length === 1) {
      const tip = pts[0];
      seg([origin, tip], r, r * 0.8);
      leaves.push({tip: tip.clone(), dir: tip.clone().sub(origin).normalize(), r: r * 0.8, hero: false});
      return;
    }
    const centroid = pts.reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / pts.length);
    // trục chia: từ điểm xa tâm nhất tới điểm xa nó nhất
    const a = pts.reduce((m, p) => (p.distanceTo(centroid) > m.distanceTo(centroid) ? p : m), pts[0]);
    const b = pts.reduce((m, p) => (p.distanceTo(a) > m.distanceTo(a) ? p : m), pts[0]);
    const axis = b.clone().sub(a).normalize();
    const sorted = [...pts].sort((p, q) => p.dot(axis) - q.dot(axis));
    const half = Math.ceil(sorted.length / 2);
    const node = origin.clone().lerp(centroid, 0.5);
    seg([origin, node], r, r * 0.84, 0.06);
    grow(node, sorted.slice(0, half), r * 0.84);
    grow(node, sorted.slice(half), r * 0.84);
  };

  const hilumR = HERO_PTS[7];
  const hilumL = V(1.0, -0.25, 0);
  // phế quản chính trái
  const leftMain = new THREE.CatmullRomCurve3([V(MOUTH_L.x, CARINA_Y + 0.0, 0), V(0.21, 0.42, 0), V(0.58, 0.06, 0), hilumL], false, 'centripetal');
  tubeGeos.push(taperedTube(leftMain, 0, 1, 24, 12, MOUTH_L.r, 0.1));
  tubeGeos.push(sphereAt(hilumL, 0.1));
  tubeGeos.push(sphereAt(hilumR, 0.118));

  const placed: THREE.Vector3[] = [HERO_PTS[HERO_PTS.length - 1]];
  for (const lobe of LOBES) {
    const c = V(...lobe.c);
    const hilum = lobe.side === 'R' ? hilumR : hilumL;
    const entry = hilum.clone().lerp(c, lobe.id === 'rl' ? 0.62 : 0.45);
    const pts: THREE.Vector3[] = [];
    let tries = 0;
    while (pts.length < lobe.leaves && tries++ < 400) {
      const q = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
      if (q.lengthSq() > 1) continue;
      const p = V(c.x + q.x * lobe.r[0] * 0.72, c.y + q.y * lobe.r[1] * 0.72, c.z + q.z * lobe.r[2] * 0.72);
      if (placed.some((o) => o.distanceTo(p) < 0.55) || p.distanceTo(entry) < 0.5) continue;
      pts.push(p);
      placed.push(p);
    }
    if (lobe.id !== 'rl') seg([hilum, entry], 0.1, 0.085, 0.05);
    grow(entry, pts, 0.085);
  }

  // chùm phế nang ở mỗi đầu mút (cầu nhỏ phập phồng; aCenter/aPhase phục vụ hiệu ứng phồng xẹp trong shader)
  for (const lf of leaves) {
    const big = lf.hero;
    const off = big ? 0.62 : 0.26;
    const ringR = big ? 0.2 : 0.15;
    const sr = big ? 0.052 : 0.065;
    const c = lf.tip.clone().add(lf.dir.clone().multiplyScalar(off));
    const ref = Math.abs(lf.dir.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
    const e1 = new THREE.Vector3().crossVectors(lf.dir, ref).normalize();
    const e2 = new THREE.Vector3().crossVectors(lf.dir, e1).normalize();
    const centers: THREE.Vector3[] = [c.clone().add(lf.dir.clone().multiplyScalar(ringR * 0.5))];
    const n = big ? 12 : 5;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rand() * 0.5;
      centers.push(c.clone().add(e1.clone().multiplyScalar(Math.cos(a) * ringR)).add(e2.clone().multiplyScalar(Math.sin(a) * ringR)).sub(lf.dir.clone().multiplyScalar(ringR * 0.2)));
    }
    if (big) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + 0.4;
        centers.push(c.clone().add(e1.clone().multiplyScalar(Math.cos(a) * ringR * 0.5)).add(e2.clone().multiplyScalar(Math.sin(a) * ringR * 0.5)).add(lf.dir.clone().multiplyScalar(ringR * 0.55)));
      }
    }
    for (const p of centers) {
      const g = new THREE.SphereGeometry(sr * (0.9 + rand() * 0.25), 14, 10).translate(p.x, p.y, p.z);
      const count = g.getAttribute('position').count;
      const ac = new Float32Array(count * 3);
      const ap = new Float32Array(count);
      const ph = rand() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        ac.set([p.x, p.y, p.z], i * 3);
        ap[i] = ph;
      }
      g.setAttribute('aCenter', new THREE.BufferAttribute(ac, 3));
      g.setAttribute('aPhase', new THREE.BufferAttribute(ap, 1));
      g.deleteAttribute('uv');
      alvGeos.push(g);
    }
  }

  // vài sợi thần kinh mảnh, thưa, quanh chùm phế nang của ống anh hùng
  const hl = leaves[0];
  const hc = hl.tip.clone().add(hl.dir.clone().multiplyScalar(0.62));
  const nerveGeos: THREE.BufferGeometry[] = [];
  const nerveDirs = [V(0.9, 0.3, -0.35), V(-0.7, 0.6, -0.4), V(0.2, -0.9, -0.3), V(-0.3, 0.1, -0.95)];
  nerveDirs.forEach((d, k) => {
    const dir = d.clone().normalize();
    const start = hc.clone().add(dir.clone().multiplyScalar(0.28));
    const pts = [start];
    for (let i = 1; i <= 4; i++) {
      pts.push(start.clone().add(dir.clone().multiplyScalar(i * 0.3)).add(V(Math.sin(i * 1.7 + k) * 0.09, Math.cos(i * 1.3 + k * 2) * 0.09, Math.sin(i * 0.9 + k) * 0.06)));
    }
    nerveGeos.push(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 1, 24, 6, 0.014, 0.008));
  });

  const tubes = mergeGeometries(tubeGeos)!;
  const alveoli = mergeGeometries(alvGeos)!;
  const nerves = mergeGeometries(nerveGeos)!;
  return {tubes, rings: mergeGeometries(ringGeos)!, alveoli, leaves, hero, heroU, nerves};
};

/** Cây phế quản dùng chung (sinh một lần khi nạp module) */
export const TREE = buildTree();

/* ---------------- máy CT: khối trụ rỗng bo tròn (xoay quanh trục y) ---------------- */
export const CT_RING = {ri: 1.95, ro: 2.5, h: 0.78, cr: 0.3};
export const buildCtRing = () => {
  const {ri, ro, h, cr} = CT_RING;
  const pts: THREE.Vector2[] = [];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    for (let i = 0; i <= 8; i++) {
      const a = a0 + ((a1 - a0) * i) / 8;
      pts.push(new THREE.Vector2(cx + cr * Math.cos(a), cy + cr * Math.sin(a)));
    }
  };
  // đi ngược chiều kim đồng hồ trong mặt phẳng (bán kính, y): ngoài-dưới -> ngoài-trên -> trong-trên -> trong-dưới
  arc(ro - cr, -h + cr, -Math.PI / 2, 0);
  arc(ro - cr, h - cr, 0, Math.PI / 2);
  arc(ri + cr, h - cr, Math.PI / 2, Math.PI);
  arc(ri + cr, -h + cr, Math.PI, Math.PI * 1.5);
  const g = new THREE.LatheGeometry(pts, 72);
  return g;
};

/** Dải sáng quanh mặt trước của máy CT (đầu dò), nằm lệch lên trên một chút */
export const buildCtStripe = () => {
  const {ro} = CT_RING;
  const g = new THREE.CylinderGeometry(ro + 0.03, ro + 0.03, 0.14, 72, 1, true);
  g.translate(0, 0.42, 0);
  return g;
};

/* ---------------- thân người mờ ---------------- */
export const buildBody = () => {
  const torso = new THREE.CapsuleGeometry(1, 6.0, 10, 28);
  torso.scale(2.55, 1, 1.3);
  torso.translate(0, -1.25, 0);
  const head = new THREE.SphereGeometry(1.25, 28, 20).translate(0, 4.75, 0);
  const neck = new THREE.CylinderGeometry(0.62, 0.7, 1.4, 20).translate(0, 3.2, 0);
  const armL = new THREE.CapsuleGeometry(0.55, 4.6, 8, 16).rotateZ(0.12).translate(3.2, -1.2, 0);
  const armR = new THREE.CapsuleGeometry(0.55, 4.6, 8, 16).rotateZ(-0.12).translate(-3.2, -1.2, 0);
  return [torso, head, neck, armL, armR].map((g) => g);
};
