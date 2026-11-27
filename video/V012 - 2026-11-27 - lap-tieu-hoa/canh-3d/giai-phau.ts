/* Hình học giải phẫu của V012 (lắp hệ tiêu hóa), sinh hoàn toàn bằng code từ khối cơ bản, không tải mô hình ngoài.
   Hệ toạ độ: y hướng lên, z hướng về phía người xem; nhìn từ phía trước nên gan (bên phải bệnh nhân) nằm bên trái màn hình (x âm).
   - Pipe: ống có bán kính đổi theo từng điểm và theo thời gian (nhu động, ngăn phình của ruột già), cập nhật tại chỗ mỗi khung hình.
   - Thực quản, dạ dày hình chữ J, ruột non cuộn nhiều vòng, ruột già làm khung bao quanh, trực tràng.
   - Gan, tụy, túi mật, ống mật; miệng (môi, răng, lưỡi); thân người mờ và cột sống làm bối cảnh.
   - Nhung mao: lăng trụ tròn thon, gom theo hàng để đung đưa. */
import * as THREE from 'three';
import {mergeGeometries, mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const mulberry = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const sstep = (a: number, b: number, x: number) => {
  const p = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return p * p * (3 - 2 * p);
};
/** Gợn hình chuông tại u = c, rộng w (dùng cho sóng nhu động) */
export const bump = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));

/* ---------------- ống có bán kính đổi theo thời gian ---------------- */
export class Pipe {
  readonly geometry = new THREE.BufferGeometry();
  readonly length: number;
  private P: THREE.Vector3[] = [];
  private N: THREE.Vector3[] = [];
  private B: THREE.Vector3[] = [];
  private pos: Float32Array;
  private cos: number[] = [];
  private sin: number[] = [];

  constructor(readonly curve: THREE.Curve<THREE.Vector3>, private tubular: number, private radial: number) {
    this.length = curve.getLength();
    let prev: THREE.Vector3 | null = null;
    for (let i = 0; i <= tubular; i++) {
      const u = i / tubular;
      const p = curve.getPointAt(u);
      const tg = curve.getTangentAt(u).normalize();
      let n: THREE.Vector3;
      if (!prev) {
        const ref = Math.abs(tg.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0);
        n = ref.sub(tg.clone().multiplyScalar(ref.dot(tg))).normalize();
      } else n = prev.clone().sub(tg.clone().multiplyScalar(prev.dot(tg))).normalize();
      prev = n;
      this.P.push(p);
      this.N.push(n);
      this.B.push(new THREE.Vector3().crossVectors(tg, n));
    }
    for (let j = 0; j < radial; j++) {
      this.cos.push(Math.cos((j / radial) * Math.PI * 2));
      this.sin.push(Math.sin((j / radial) * Math.PI * 2));
    }
    this.pos = new Float32Array((tubular + 1) * radial * 3);
    const idx: number[] = [];
    for (let i = 0; i < tubular; i++)
      for (let j = 0; j < radial; j++) {
        const j2 = (j + 1) % radial;
        const a = i * radial + j;
        const b = (i + 1) * radial + j;
        const a2 = i * radial + j2;
        const b2 = (i + 1) * radial + j2;
        idx.push(a, a2, b, a2, b2, b);
      }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.pos.length), 3));
    this.geometry.setIndex(idx);
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -1, 0), 60);
    this.geometry.boundingBox = new THREE.Box3(V(-60, -60, -60), V(60, 60, 60));
  }

  /** Điểm trên thành ống ở vị trí u, góc ang (rad), bán kính rr; trả thêm hướng pháp tuyến ra ngoài */
  surface(u: number, ang: number, rr: number) {
    const i = Math.max(0, Math.min(this.tubular, Math.round(u * this.tubular)));
    const dir = this.N[i].clone().multiplyScalar(Math.cos(ang)).addScaledVector(this.B[i], Math.sin(ang));
    return {p: this.P[i].clone().addScaledVector(dir, rr), dir};
  }

  /** Ghi lại vị trí các đỉnh theo bán kính r(u) và tính lại pháp tuyến */
  update(r: (u: number) => number) {
    const {tubular, radial, pos} = this;
    let k = 0;
    for (let i = 0; i <= tubular; i++) {
      const rr = Math.max(0.0005, r(i / tubular));
      const p = this.P[i];
      const n = this.N[i];
      const b = this.B[i];
      for (let j = 0; j < radial; j++) {
        const c = this.cos[j] * rr;
        const s = this.sin[j] * rr;
        pos[k++] = p.x + n.x * c + b.x * s;
        pos[k++] = p.y + n.y * c + b.y * s;
        pos[k++] = p.z + n.z * c + b.z * s;
      }
    }
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.geometry.computeVertexNormals();
    return this;
  }
}

const catmull = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');

/* ---------------- thực quản ---------------- */
export const ESO_CURVE = catmull([V(0, 4.4, -0.1), V(-0.06, 3.8, -0.2), V(0.04, 3.3, -0.15), V(0.3, 2.95, -0.02), V(0.75, 2.62, 0.1)]);
export const ESO_R = 0.19;

/* ---------------- dạ dày hình chữ J ---------------- */
export const STO_CURVE = catmull([V(1.15, 2.95, 0.1), V(1.25, 2.5, 0.1), V(1.35, 1.7, 0.1), V(1.4, 1.0, 0.1), V(1.15, 0.45, 0.1), V(0.55, 0.2, 0.1), V(-0.05, 0.25, 0.08), V(-0.5, 0.3, 0.05)]);
const STO_PROFILE: [number, number][] = [[0.1, 0.72], [0.3, 0.9], [0.5, 0.88], [0.7, 0.66], [0.88, 0.42], [1, 0.27]];
/** Bán kính dạ dày dọc theo đường tâm: vòm đáy tròn ở đầu, to nhất ở thân, nhỏ dần về môn vị */
export const stomachRadius = (u: number) => {
  if (u < STO_PROFILE[0][0]) return STO_PROFILE[0][1] * Math.sqrt(Math.max(0, 1 - (1 - u / STO_PROFILE[0][0]) ** 2));
  for (let i = 0; i < STO_PROFILE.length - 1; i++) {
    const [a, ra] = STO_PROFILE[i];
    const [b, rb] = STO_PROFILE[i + 1];
    if (u <= b) return ra + (rb - ra) * sstep(a, b, u);
  }
  return STO_PROFILE[STO_PROFILE.length - 1][1];
};

/* ---------------- ruột non: tá tràng rồi cuộn thành bốn hàng ---------------- */
export const SI_ROWS = [-1.95, -2.45, -2.95, -3.45];
const buildSmallIntestinePath = () => {
  const pts: THREE.Vector3[] = [V(-0.5, 0.3, 0.05), V(-0.95, 0.0, 0.0), V(-1.28, -0.6, -0.05), V(-1.25, -1.25, 0.0), V(-1.3, -1.7, 0.05)];
  const s = SI_ROWS[0] - SI_ROWS[1];
  SI_ROWS.forEach((y, k) => {
    const ltr = k % 2 === 0;
    const a = 1.25 + 0.12 * Math.sin(k * 2.1);
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const x = (ltr ? -a + 2 * a * f : a - 2 * a * f);
      pts.push(V(x, y + 0.09 * Math.sin(2.3 * x + k * 1.7), 0.22 * Math.sin(1.4 * x + k * 2.2)));
    }
    if (k < SI_ROWS.length - 1) {
      const cx = ltr ? a : -a;
      const sgn = ltr ? 1 : -1;
      for (const ang of [-55, 0, 55]) {
        const r = (ang * Math.PI) / 180;
        pts.push(V(cx + sgn * (s / 2) * 1.05 * Math.cos(r), y - s / 2 - (s / 2) * Math.sin(r), 0.05));
      }
    }
  });
  pts.push(V(-1.8, SI_ROWS[3] - 0.08, 0.1), V(-2.15, SI_ROWS[3] - 0.1, 0.12));
  return catmull(pts);
};
export const SI_CURVE = buildSmallIntestinePath();
export const SI_R = 0.235;
/** Đoạn ruột non (theo u): tá tràng, hỗng tràng, hồi tràng */
export const SI_PARTS = {duo: [0, 0.14], jej: [0.14, 0.58], ile: [0.58, 1]} as const;

/* ---------------- ruột già: khung bao quanh ruột non, rồi trực tràng ---------------- */
export const COLON_CURVE = catmull([
  V(-2.35, -3.95, 0.12),
  V(-2.4, -3.4, 0.12),
  V(-2.36, -2.4, 0.1),
  V(-2.35, -1.7, 0.1),
  V(-2.3, -1.3, 0.12),
  V(-2.0, -1.12, 0.14),
  V(-1.2, -1.25, 0.2),
  V(-0.4, -1.38, 0.24),
  V(0.5, -1.35, 0.2),
  V(1.4, -1.2, 0.16),
  V(2.1, -1.1, 0.12),
  V(2.38, -1.4, 0.1),
  V(2.4, -2.2, 0.1),
  V(2.36, -3.0, 0.1),
  V(2.25, -3.6, 0.12),
  V(1.8, -4.0, 0.14),
  V(1.2, -3.85, 0.14),
  V(0.7, -4.2, 0.12),
  V(0.35, -4.6, 0.1),
  V(0.0, -4.95, 0.05),
  V(0.0, -5.5, 0.0),
]);
export const COLON_LEN = COLON_CURVE.getLength();
/** Ngăn phình (haustra): bán kính thắt lại đều đặn dọc ruột; đầu manh tràng bo tròn, trực tràng trơn và nhỏ hơn */
export const colonRadius = (u: number) => {
  const s = u * COLON_LEN;
  const rectum = sstep(0.8, 0.9, u);
  const hau = 0.29 + 0.1 * Math.pow(Math.abs(Math.sin((Math.PI * s) / 0.72)), 0.55);
  let r = hau * (1 - rectum) + 0.27 * rectum;
  const cap = 0.04;
  if (u < cap) r *= Math.sqrt(Math.max(0, 1 - (1 - u / cap) ** 2));
  if (u > 0.985) r *= 1 - sstep(0.985, 1, u) * 0.6;
  return r;
};
export const ANUS_POS = COLON_CURVE.getPointAt(1);

/* ---------------- gan, túi mật, tụy, ống ---------------- */
export const LIVER_C = V(-1.1, 1.5, -0.4);
/** Gan: khối bo mềm hình nêm, thuỳ phải to dày, thuỳ trái thon dần về phía dạ dày; mặt dưới lõm, có rãnh trên mặt chia hai thuỳ */
export const buildLiver = () => {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 72, 52);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const {x: ux, y: uy, z: uz} = v;
    const taper = 1 - 0.55 * sstep(0.0, 1, ux);
    const left = ux < 0 ? 1 + 0.12 * Math.abs(ux) : 1;
    let y = uy > 0 ? uy * 1.0 * taper : uy * 0.42 * (0.55 + 0.45 * taper);
    // rãnh trên mặt (dây chằng liềm) và chỗ lõm phía dưới đặt túi mật
    y -= 0.2 * Math.exp(-(((ux - 0.3) / 0.08) ** 2)) * Math.max(0, uy);
    if (uy < 0) y -= 0.1 * Math.exp(-(((ux + 0.35) / 0.3) ** 2) - (uz / 0.5) ** 2) * uy;
    v.set(ux * 1.85 * left, y, uz * 0.98 * (1 - 0.3 * sstep(0, 1, ux)));
    pos.setXYZ(i, v.x + LIVER_C.x, v.y + LIVER_C.y, v.z + LIVER_C.z);
  }
  g.computeVertexNormals();
  return g;
};

export const GB_NECK = V(-1.3, 0.9, 0.2);
export const GB_DIR = V(-0.5, -0.86, 0.1).normalize();
export const GB_LEN = 1.35;
export const buildGallbladder = () => {
  const prof = [[0, 0], [0.06, 0.04], [0.1, 0.2], [0.2, 0.4], [0.3, 0.6], [0.34, 0.78], [0.3, 0.92], [0.16, 1.0], [0, 1.03]].map(([x, y]) => new THREE.Vector2(x * 1.55, y * GB_LEN));
  const g = new THREE.LatheGeometry(prof, 24);
  g.deleteAttribute('uv');
  return g;
};
export const GB_QUAT = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), GB_DIR);
export const GB_CENTER = GB_NECK.clone().addScaledVector(GB_DIR, GB_LEN * 0.6);

/** Ống mật từ túi mật (và gan) xuống tá tràng */
export const BILE_CURVE = catmull([V(-1.3, 0.78, 0.1), V(-1.32, 0.35, 0.05), V(-1.35, -0.1, 0.0), V(-1.3, -0.5, -0.05)]);
export const buildPancreas = () => {
  const curve = catmull([V(-1.0, -0.55, -0.1), V(-0.3, -0.6, -0.1), V(0.5, -0.5, -0.18), V(1.3, -0.4, -0.25), V(2.0, -0.2, -0.3)]);
  const pipe = new Pipe(curve, 48, 14);
  pipe.update((u) => {
    const base = (0.26 + 0.1 * (1 - u)) * (1 + 0.14 * Math.sin(u * 41) + 0.06 * Math.sin(u * 97));
    return base * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 6));
  });
  return {pipe, curve};
};
export const PANC_DUCT = catmull([V(-0.95, -0.55, -0.05), V(-1.1, -0.55, -0.03), V(-1.27, -0.55, -0.02)]);

/* ---------------- miệng ---------------- */
export const MOUTH_C = V(0, 5.05, 0.95);
export const MOUTH_CAVITY = MOUTH_C.clone().add(V(0, 0, -0.1));
export const THROAT = V(0, 4.45, 0.0);
export const buildTeethRow = (upper: boolean) => {
  const gs: THREE.BufferGeometry[] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * 2 - 1;
    const g = new THREE.CapsuleGeometry(0.095, 0.1, 4, 10);
    g.scale(1, 1, 0.8);
    g.translate(0, upper ? -0.14 : 0.14, 0);
    g.rotateZ(f * 0.12);
    g.translate(f * 0.82, (upper ? 1 : -1) * (0.56 - 0.2 * f * f), 0.02 + 0.04 * (1 - Math.abs(f)));
    g.deleteAttribute('uv');
    gs.push(g);
  }
  return mergeGeometries(gs)!;
};

/* ---------------- thân người mờ, cột sống ---------------- */
export const buildTorso = () => {
  const half: [number, number][] = [[0, 6.65], [0.9, 6.3], [1.3, 5.4], [1.08, 4.55], [0.58, 4.1], [0.55, 3.75], [1.6, 3.5], [3.0, 3.15], [3.5, 2.2], [3.38, 0.0], [3.12, -2.0], [3.22, -4.0], [3.0, -5.6], [2.2, -6.3], [0, -6.45]];
  const right = new THREE.SplineCurve(half.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(160);
  const left = right.slice(1, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y));
  const shape = new THREE.Shape([...right, ...left]);
  const g = new THREE.ExtrudeGeometry(shape, {depth: 1.0, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 4, curveSegments: 4});
  g.translate(0, 0, -2.4);
  g.deleteAttribute('uv');
  return g;
};
export const buildSpine = () => {
  const gs: THREE.BufferGeometry[] = [];
  for (let y = 4.1, i = 0; y > -5.6; y -= 0.46, i++) {
    const w = 0.42 + 0.14 * sstep(3.8, -4.5, y);
    const g = new THREE.CylinderGeometry(w * 0.85, w, 0.34, 12);
    g.translate(0, y, -1.15);
    g.deleteAttribute('uv');
    gs.push(g);
  }
  return mergeGeometries(gs)!;
};

/* ---------------- nhung mao ---------------- */
export const VILLUS_H = 1.05;
const villusProfile = () => [[0.17, 0], [0.15, 0.12], [0.135, 0.5], [0.135, 0.85], [0.1, 1.0], [0.04, 1.07], [0.0, 1.09]].map(([r, y]) => new THREE.Vector2(r, y));
export const buildVillus = () => {
  const g = new THREE.LatheGeometry(villusProfile(), 12);
  g.deleteAttribute('uv');
  return g;
};
export const VILLI_COLS = 11;
export const VILLI_ROWS = 11;
export const VILLI_STEP = 0.5;
/** Mỗi hàng nhung mao (cùng z) gộp thành một hình, gốc hàng nằm ở z của hàng để đung đưa như một dải */
export const buildVilliRows = () => {
  const rand = mulberry(7);
  const rows: THREE.BufferGeometry[] = [];
  for (let r = 0; r < VILLI_ROWS; r++) {
    const gs: THREE.BufferGeometry[] = [];
    for (let c = 0; c < VILLI_COLS; c++) {
      const g = buildVillus();
      const h = 0.78 + 0.45 * rand();
      g.scale(0.9 + 0.2 * rand(), h, 0.9 + 0.2 * rand());
      g.rotateX((rand() - 0.5) * 0.12);
      g.rotateZ((rand() - 0.5) * 0.12);
      const x = (c - (VILLI_COLS - 1) / 2) * VILLI_STEP + (r % 2 ? VILLI_STEP / 2 : 0) + (rand() - 0.5) * 0.08;
      g.translate(Math.max(-2.85, Math.min(2.85, x)), 0, 0);
      gs.push(g);
    }
    rows.push(mergeGeometries(gs)!);
  }
  return rows;
};
export const villiRowZ = (r: number) => (r - (VILLI_ROWS - 1) / 2) * VILLI_STEP - 0.3;

/** Tấm niêm mạc (mặt ruột) bo tròn, mặt trên ở y = 0 */
export const buildMucosa = () => {
  const w = 3.35;
  const d = 3.95;
  const rr = 0.5;
  const s = new THREE.Shape();
  s.moveTo(-w + rr, -d);
  s.lineTo(w - rr, -d);
  s.quadraticCurveTo(w, -d, w, -d + rr);
  s.lineTo(w, d - rr);
  s.quadraticCurveTo(w, d, w - rr, d);
  s.lineTo(-w + rr, d);
  s.quadraticCurveTo(-w, d, -w, d - rr);
  s.lineTo(-w, -d + rr);
  s.quadraticCurveTo(-w, -d, -w + rr, -d);
  const g = new THREE.ExtrudeGeometry(s, {depth: 0.6, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.14, bevelSegments: 3});
  g.rotateX(Math.PI / 2);
  g.translate(0, -0.14, 0);
  g.deleteAttribute('uv');
  return g;
};

/* ---------------- mạch máu của nhung mao "ngôi sao" ---------------- */
/** Gốc của "sân khấu" phóng to nhung mao, đặt phía trước bụng; HERO là nhung mao lớn có mạch máu, nằm ở mép trước tấm niêm mạc */
export const STAGE = V(0, -2.4, 3.0);
export const HERO = {x: 0.0, z: 3.2, s: 2.2};
/** Mạch máu lớn chạy dọc mép trước, dẫn máu ra ngoài khung */
export const VESSEL = catmull([V(-3.2, 0.2, 3.2), V(-1.6, 0.2, 3.2), V(0, 0.2, 3.2), V(1.6, 0.2, 3.2), V(3.6, 0.2, 3.2)]);
export const CAP_UP = catmull([V(-0.07, 0.02, 0), V(-0.07, 0.3, 0), V(-0.06, 0.78, 0), V(0, 0.98, 0)]);
export const CAP_DOWN = catmull([V(0, 0.98, 0), V(0.07, 0.78, 0), V(0.07, 0.3, 0), V(0.07, 0.02, 0)]);
export const buildTube = (curve: THREE.Curve<THREE.Vector3>, r: number, tubular = 40, radial = 8) => {
  const g = new THREE.TubeGeometry(curve, tubular, r, radial, false);
  g.deleteAttribute('uv');
  return g;
};
