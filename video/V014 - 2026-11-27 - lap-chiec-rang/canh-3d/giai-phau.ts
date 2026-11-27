/* Hình học V014 (lắp chiếc răng), sinh hoàn toàn bằng code, không tải mô hình ngoài.
   Cách làm: mô tả chiếc răng hàm dưới bằng hàm khoảng cách có dấu (SDF: thân răng bo tròn, bốn mũi nhai, rãnh nhai, hai chân thon),
   lấy mẫu một lần lên lưới rồi dựng mặt bằng marching cubes. Các lớp (men, ngà, tủy, xê măng, dây chằng, xương hàm, nướu) là các miền
   xếp khít nhau cắt ra từ cùng một trường, nên cắt bỏ một góc (x>0 và z>0) là thấy đúng lát cắt nhiều lớp có độ dày thật.
   Hệ toạ độ: y hướng lên (thân răng ở trên, chân răng cắm xuống), z hướng về người xem, x là hướng gần-xa của hàm. */
import * as THREE from 'three';
import {edgeTable as edgeTableRaw, triTable as triTableRaw} from 'three/examples/jsm/objects/MarchingCubes.js';
import {Pipe, V, mulberry} from '../../V012 - 2026-11-27 - lap-tieu-hoa/canh-3d/giai-phau';

export {Pipe, V, mulberry};

/** Hai bảng marching cubes của three, thực chất là mảng phẳng (256 và 256x16 phần tử); kiểu khai báo của thư viện ghi sai */
const edgeTable = edgeTableRaw as unknown as Int32Array;
const triTable = triTableRaw as unknown as Int32Array;

const sstep = (a: number, b: number, x: number) => {
  const p = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return p * p * (3 - 2 * p);
};
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

/* ---------------- khối cơ bản (SDF) ---------------- */
const roundBox = (x: number, y: number, z: number, hx: number, hy: number, hz: number, r: number) => {
  const qx = Math.abs(x) - hx + r;
  const qy = Math.abs(y) - hy + r;
  const qz = Math.abs(z) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
};
const sphere = (x: number, y: number, z: number, cx: number, cy: number, cz: number, r: number) => Math.hypot(x - cx, y - cy, z - cz) - r;
const capsule = (x: number, y: number, z: number, a: number[], b: number[], r: number) => {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const pax = x - a[0];
  const pay = y - a[1];
  const paz = z - a[2];
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
};
/** Nón cụt có hai đầu tròn (chân răng thon dần), công thức chính xác của Inigo Quilez */
const roundCone = (a: number[], b: number[], r1: number, r2: number) => {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  return (x: number, y: number, z: number) => {
    const pax = x - a[0];
    const pay = y - a[1];
    const paz = z - a[2];
    const yy = pax * bax + pay * bay + paz * baz;
    const zz = yy - l2;
    const qx = pax * l2 - bax * yy;
    const qy = pay * l2 - bay * yy;
    const qz = paz * l2 - baz * yy;
    const x2 = qx * qx + qy * qy + qz * qz;
    const y2 = yy * yy * l2;
    const z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
};

/* ---------------- chiếc răng hàm ---------------- */
/** Ranh giới men - xê măng ở cổ răng (nướu che phía trên một chút) */
export const NECK_Y = 0.1;
export const CROWN_TOP = 2.7;
export const VALLEY_Y = 2.2;
/** Bề dày men (mỏng ở cổ răng, dày ở mũi nhai) và bề dày xê măng */
const enamelThick = (y: number) => 0.1 + 0.26 * sstep(0.1, 1.8, y);
const taper = (y: number) => 0.84 + 0.16 * sstep(0, 1.6, y);

const ROOT_M: number[][] = [[-0.95, 0.2, 0], [-1.08, -1.3, 0], [-1.3, -2.45, 0]];
const ROOT_D: number[][] = [[0.95, 0.2, 0], [1.05, -1.25, 0], [1.22, -2.4, 0]];
export const ROOT_TIP_Y = -2.6;
const rootCones = [
  roundCone(ROOT_M[0], ROOT_M[1], 0.8, 0.6),
  roundCone(ROOT_M[1], ROOT_M[2], 0.6, 0.17),
  roundCone(ROOT_D[0], ROOT_D[1], 0.8, 0.58),
  roundCone(ROOT_D[1], ROOT_D[2], 0.58, 0.17),
];
const CUSPS = [[-0.95, 1.95, -0.72], [0.95, 1.95, -0.72], [-0.95, 1.95, 0.72], [0.95, 1.95, 0.72]];
const G1A = [-2.1, 2.5, 0];
const G1B = [2.1, 2.5, 0];
const G2A = [0, 2.5, -1.7];
const G2B = [0, 2.5, 1.7];

/** Mặt ngoài của cả chiếc răng (thân + hai chân); âm là bên trong */
export const toothOuter = (x: number, y: number, z: number) => {
  const f = taper(y);
  let d = roundBox(x / f, y - 1.1, z / f, 1.85, 1.25, 1.5, 0.65) * f;
  for (const c of CUSPS) d = smin(d, sphere(x, y, z, c[0], c[1], c[2], 0.75), 0.45);
  d = smax(d, -capsule(x, y, z, G1A, G1B, 0.34), 0.25);
  d = smax(d, -capsule(x, y, z, G2A, G2B, 0.34), 0.25);
  for (const rc of rootCones) d = smin(d, rc(x, y, z), 0.5);
  return d;
};

const canalCones = [
  roundCone([-0.95, 0.75, 0], [-1.08, -1.3, 0], 0.3, 0.17),
  roundCone([-1.08, -1.3, 0], [-1.28, -2.35, 0], 0.17, 0.07),
  roundCone([0.95, 0.75, 0], [1.05, -1.25, 0], 0.3, 0.17),
  roundCone([1.05, -1.25, 0], [1.2, -2.3, 0], 0.17, 0.07),
];
const HORNS = [[-0.95, 1.62, -0.6], [0.95, 1.62, -0.6], [-0.95, 1.62, 0.6], [0.95, 1.62, 0.6]];
/** Tủy răng: buồng tủy có bốn sừng dưới bốn mũi nhai, hai ống tủy chạy xuống hai chân */
export const pulpField = (x: number, y: number, z: number) => {
  let d = roundBox(x, y - 1.0, z, 0.98, 0.5, 0.8, 0.35);
  for (const h of HORNS) d = smin(d, sphere(x, y, z, h[0], h[1], h[2], 0.34), 0.3);
  for (const c of canalCones) d = smin(d, c(x, y, z), 0.25);
  return d;
};

/** Thần kinh (vàng) lên tới sừng tủy dưới mũi nhai, mạch máu (đỏ) toả vào buồng tủy; cả hai chạy xuống ống tủy chân bên phải rồi ra khỏi chóp chân vào xương hàm */
const LOWER: [number, number, number][] = [[0.95, 0.6, 0], [1.0, -0.6, 0], [1.04, -1.4, 0], [1.2, -2.5, 0], [1.28, -3.3, 0]];
export const NERVE_R = new THREE.CatmullRomCurve3([V(0.9, 1.78, 0), V(0.95, 1.2, 0), ...LOWER.map((p) => V(...p))], false, 'centripetal');
export const VESSEL_R = new THREE.CatmullRomCurve3([V(0.3, 1.32, 0), V(0.7, 0.95, 0), ...LOWER.map((p) => V(...p))], false, 'centripetal');

/* ---------------- lưới lấy mẫu và marching cubes ---------------- */
type Grid = {x0: number; y0: number; z0: number; h: number; nx: number; ny: number; nz: number; i0: number; k0: number};
const makeGrid = (xr: number, y0: number, y1: number, zr: number, h = 0.04): Grid => {
  const nx = Math.round((2 * xr) / h) + 1;
  const ny = Math.round((y1 - y0) / h) + 1;
  const nz = Math.round((2 * zr) / h) + 1;
  return {x0: -xr, y0, z0: -zr, h, nx, ny, nz, i0: Math.round(xr / h), k0: Math.round(zr / h)};
};
const GRID_TOOTH = makeGrid(2.2, -2.8, 2.84, 1.92);
const GRID_JAW = makeGrid(3.24, -3.52, 0.72, 2.12);
/** Nửa bề rộng khối hàm (xương và nướu) */
export const JAW_HALF = 3.0;

const sample = (g: Grid, fn: (x: number, y: number, z: number) => number) => {
  const out = new Float32Array(g.nx * g.ny * g.nz);
  let n = 0;
  for (let k = 0; k < g.nz; k++) {
    const z = g.z0 + k * g.h;
    for (let j = 0; j < g.ny; j++) {
      const y = g.y0 + j * g.h;
      for (let i = 0; i < g.nx; i++) out[n++] = fn(g.x0 + i * g.h, y, z);
    }
  }
  return out;
};
/** Ghép từng điểm lưới của vài trường thành một trường mới */
const combine = (g: Grid, fn: (x: number, y: number, z: number, n: number) => number) => {
  const out = new Float32Array(g.nx * g.ny * g.nz);
  let n = 0;
  for (let k = 0; k < g.nz; k++) {
    const z = g.z0 + k * g.h;
    for (let j = 0; j < g.ny; j++) {
      const y = g.y0 + j * g.h;
      for (let i = 0; i < g.nx; i++, n++) out[n] = fn(g.x0 + i * g.h, y, z, n);
    }
  }
  return out;
};

const CORNER = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
const EDGE_LOW = [0, 1, 3, 0, 4, 5, 7, 4, 0, 1, 2, 3];
const EDGE_UP = [1, 2, 2, 3, 5, 6, 6, 7, 4, 5, 6, 7];
const EDGE_AXIS = [0, 1, 0, 1, 0, 1, 0, 1, 2, 2, 2, 2];

/** Dựng mặt từ trường f (âm = bên trong). `cut`: bỏ góc x>0, z>0 (mặt cắt nằm đúng trên mặt phẳng x=0 và z=0 của lưới). Pháp tuyến lấy từ trường chưa cắt. */
const polygonise = (g: Grid, field: Float32Array, cut: boolean) => {
  const {nx, ny, nz, h} = g;
  const N = nx * ny * nz;
  const f = field.slice();
  if (cut) {
    for (let k = g.k0; k < nz; k++)
      for (let j = 0; j < ny; j++) {
        const base = nx * (j + ny * k);
        for (let i = g.i0; i < nx; i++) if (f[base + i] < 1e-6) f[base + i] = 1e-6;
      }
  }
  const cache = new Int32Array(N * 3).fill(-1);
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const grad = (i: number, j: number, k: number, out: number[]) => {
    const ia = Math.max(0, i - 1);
    const ib = Math.min(nx - 1, i + 1);
    const ja = Math.max(0, j - 1);
    const jb = Math.min(ny - 1, j + 1);
    const ka = Math.max(0, k - 1);
    const kb = Math.min(nz - 1, k + 1);
    out[0] = field[ib + nx * (j + ny * k)] - field[ia + nx * (j + ny * k)];
    out[1] = field[i + nx * (jb + ny * k)] - field[i + nx * (ja + ny * k)];
    out[2] = field[i + nx * (j + ny * kb)] - field[i + nx * (j + ny * ka)];
  };
  const gl = [0, 0, 0];
  const gu = [0, 0, 0];
  const cv = new Float64Array(8);
  const cn = new Int32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let ci = 0;
        for (let c = 0; c < 8; c++) {
          const o = CORNER[c];
          const n = i + o[0] + nx * (j + o[1] + ny * (k + o[2]));
          cn[c] = n;
          cv[c] = f[n];
          if (cv[c] < 0) ci |= 1 << c;
        }
        const bits = edgeTable[ci];
        if (bits === 0) continue;
        const ids = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let e = 0; e < 12; e++) {
          if (!(bits & (1 << e))) continue;
          const lo = EDGE_LOW[e];
          const up = EDGE_UP[e];
          const key = cn[lo] * 3 + EDGE_AXIS[e];
          let id = cache[key];
          if (id < 0) {
            const vl = cv[lo];
            const vu = cv[up];
            const t = Math.abs(vl - vu) < 1e-12 ? 0.5 : vl / (vl - vu);
            const ol = CORNER[lo];
            const ou = CORNER[up];
            const px = g.x0 + (i + ol[0] + (ou[0] - ol[0]) * t) * h;
            const py = g.y0 + (j + ol[1] + (ou[1] - ol[1]) * t) * h;
            const pz = g.z0 + (k + ol[2] + (ou[2] - ol[2]) * t) * h;
            grad(i + ol[0], j + ol[1], k + ol[2], gl);
            grad(i + ou[0], j + ou[1], k + ou[2], gu);
            let nxv = gl[0] + (gu[0] - gl[0]) * t;
            let nyv = gl[1] + (gu[1] - gl[1]) * t;
            let nzv = gl[2] + (gu[2] - gl[2]) * t;
            if (cut) {
              // đỉnh nằm đúng trên mặt cắt: pháp tuyến vuông góc với mặt cắt
              if (Math.abs(px) < 1e-3 && pz > 1e-3) [nxv, nyv, nzv] = [1, 0, 0];
              else if (Math.abs(pz) < 1e-3 && px > 1e-3) [nxv, nyv, nzv] = [0, 0, 1];
              else if (Math.abs(px) < 1e-3 && Math.abs(pz) < 1e-3) [nxv, nyv, nzv] = [0.7, 0, 0.7];
            }
            const l = Math.hypot(nxv, nyv, nzv) || 1;
            id = pos.length / 3;
            pos.push(px, py, pz);
            nor.push(nxv / l, nyv / l, nzv / l);
            cache[key] = id;
          }
          ids[e] = id;
        }
        for (let m = 0; triTable[ci * 16 + m] !== -1; m += 3) {
          const a = ids[triTable[ci * 16 + m]];
          const b = ids[triTable[ci * 16 + m + 1]];
          const c = ids[triTable[ci * 16 + m + 2]];
          if (a === b || b === c || a === c) continue;
          // cho mặt quay đúng chiều pháp tuyến
          const e1x = pos[b * 3] - pos[a * 3];
          const e1y = pos[b * 3 + 1] - pos[a * 3 + 1];
          const e1z = pos[b * 3 + 2] - pos[a * 3 + 2];
          const e2x = pos[c * 3] - pos[a * 3];
          const e2y = pos[c * 3 + 1] - pos[a * 3 + 1];
          const e2z = pos[c * 3 + 2] - pos[a * 3 + 2];
          const fx = e1y * e2z - e1z * e2y;
          const fy = e1z * e2x - e1x * e2z;
          const fz = e1x * e2y - e1y * e2x;
          const d = fx * (nor[a * 3] + nor[b * 3] + nor[c * 3]) + fy * (nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1]) + fz * (nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]);
          if (d >= 0) idx.push(a, b, c);
          else idx.push(a, c, b);
        }
      }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
};

/** Đường viền của lớp trên mặt cắt (marching squares) làm thành dải mỏng màu tối: kẻ ranh giới giữa các lớp, vì viền đen của vật không vẽ được trên mặt cắt. */
const seam = (g: Grid, field: Float32Array, plane: 'z' | 'x', width = 0.04, lift = 0.014) => {
  const {nx, ny, nz, h} = g;
  const at = (a: number, j: number) => (plane === 'z' ? field[a + nx * (j + ny * g.k0)] : field[g.i0 + nx * (j + ny * a)]);
  const aMin = plane === 'z' ? g.i0 : g.k0;
  const aMax = plane === 'z' ? nx - 1 : nz - 1;
  const coord = (a: number, j: number): [number, number, number] =>
    plane === 'z' ? [g.x0 + a * h, g.y0 + j * h, lift] : [lift, g.y0 + j * h, g.z0 + a * h];
  const lerpP = (p: number[], q: number[], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const verts: number[] = [];
  const quad = (p: number[], q: number[]) => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const dz = q[2] - p[2];
    const l = Math.hypot(dx, dy, dz) || 1;
    // vuông góc trong mặt cắt: trục thứ hai của mặt cắt là y; trục thứ nhất là x (mặt z) hoặc z (mặt x)
    const ax = plane === 'z' ? 0 : 2;
    const u = [0, 0, 0];
    const dir = [dx / l, dy / l, dz / l];
    // vector pháp tuyến trong mặt phẳng: xoay 90 độ trong (trục ax, y)
    u[ax] = -dir[1] * 0.5 * width;
    u[1] = dir[ax] * 0.5 * width;
    const e = [dir[0] * 0.02, dir[1] * 0.02, dir[2] * 0.02];
    const a = [p[0] - u[0] - e[0], p[1] - u[1] - e[1], p[2] - u[2] - e[2]];
    const b = [p[0] + u[0] - e[0], p[1] + u[1] - e[1], p[2] + u[2] - e[2]];
    const c = [q[0] + u[0] + e[0], q[1] + u[1] + e[1], q[2] + u[2] + e[2]];
    const d = [q[0] - u[0] + e[0], q[1] - u[1] + e[1], q[2] - u[2] + e[2]];
    verts.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  for (let j = 0; j < ny - 1; j++)
    for (let a = aMin; a < aMax; a++) {
      const v = [at(a, j), at(a + 1, j), at(a + 1, j + 1), at(a, j + 1)];
      const pts = [coord(a, j), coord(a + 1, j), coord(a + 1, j + 1), coord(a, j + 1)];
      const cross: number[][] = [];
      for (let e = 0; e < 4; e++) {
        const s = e;
        const t = (e + 1) % 4;
        if (v[s] < 0 !== v[t] < 0) cross.push(lerpP(pts[s], pts[t], v[s] / (v[s] - v[t])));
      }
      if (cross.length === 2) quad(cross[0], cross[1]);
      else if (cross.length === 4) {
        quad(cross[0], cross[1]);
        quad(cross[2], cross[3]);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeBoundingSphere();
  return geo;
};

/* ---------------- các lớp của chiếc răng ---------------- */
export type Layer = {body: THREE.BufferGeometry; seamZ: THREE.BufferGeometry; seamX: THREE.BufferGeometry};
const makeLayer = (g: Grid, field: Float32Array): Layer => ({
  body: polygonise(g, field, true),
  seamZ: seam(g, field, 'z'),
  seamX: seam(g, field, 'x'),
});

const buildTooth = () => {
  const g = GRID_TOOTH;
  const T = sample(g, toothOuter);
  const P = sample(g, pulpField);
  const enamel = combine(g, (_x, y, _z, n) => Math.max(T[n], -(T[n] + enamelThick(y)), NECK_Y - y));
  const cement = combine(g, (_x, y, _z, n) => Math.max(T[n], -(T[n] + 0.1), y - NECK_Y));
  const dentin = combine(g, (_x, y, _z, n) => Math.max(T[n] + enamelThick(y), -P[n]));
  const crown = combine(g, (_x, y, _z, n) => Math.max(T[n], NECK_Y - y));
  const root = combine(g, (_x, y, _z, n) => Math.max(T[n], y - NECK_Y));
  return {
    pulp: makeLayer(g, P),
    dentin: makeLayer(g, dentin),
    enamel: makeLayer(g, enamel),
    cement: makeLayer(g, cement),
    crownWhole: polygonise(g, crown, false),
    rootWhole: polygonise(g, root, false),
  };
};

/** Phần cứng của hàm: xương hàm (có ổ răng), dây chằng quanh chân và nướu ôm cổ răng */
const buildJaw = () => {
  const g = GRID_JAW;
  const T = sample(g, toothOuter);
  const BONE_TOP = -0.7;
  const GAP = 0.12;
  const bone = combine(g, (x, y, z, n) => Math.max(roundBox(x, y + 2.1, z, JAW_HALF, 1.4, 2.0, 0.55), -(T[n] - GAP)));
  const ligament = combine(g, (x, y, z, n) => Math.max(-T[n], T[n] - GAP, roundBox(x, y + 2.1, z, JAW_HALF, 1.4, 2.0, 0.55), y - BONE_TOP - 0.15));
  const gum = combine(g, (x, y, z, n) => {
    const base = roundBox(x, y + 0.35, z, JAW_HALF, 0.35, 2.0, 0.34);
    const collar = roundBox(x, y - 0.0, z, 1.78, 0.3, 1.5, 0.45);
    return Math.max(smin(base, collar, 0.5), -T[n]);
  });
  return {bone: makeLayer(g, bone), ligament: makeLayer(g, ligament), gum: makeLayer(g, gum)};
};

let cache: ReturnType<typeof buildTooth> & ReturnType<typeof buildJaw>;
export const tooth = () => (cache ??= {...buildTooth(), ...buildJaw()});

/* ---------------- ống thần kinh và mạch máu trong ống tủy, nằm trên mặt cắt z=0 ---------------- */
export const buildVessel = (curve: THREE.CatmullRomCurve3, side: 1 | -1, r: number) => {
  const pts = curve.getSpacedPoints(70).map((p, i, a) => {
    const u = i / (a.length - 1);
    // hai ống đi song song trong ống tủy rồi nhập lại gần chóp chân
    const off = side * 0.075 * sstep(0.25, 0.4, u) * (1 - sstep(0.6, 0.9, u));
    return V(p.x + off, p.y, 0.03);
  });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, r, 8, false);
};

/** Điểm trên mặt thân răng theo hướng dir tính từ tâm thân răng, kèm pháp tuyến ngoài (để đặt vi khuẩn, mảnh vỡ) */
export const CROWN_C = V(0, 1.3, 0);
export const crownSurface = (dir: THREE.Vector3) => {
  const d = dir.clone().normalize();
  let lo = 0;
  let hi = 5;
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2;
    if (toothOuter(CROWN_C.x + d.x * m, CROWN_C.y + d.y * m, CROWN_C.z + d.z * m) > 0) hi = m;
    else lo = m;
  }
  const p = CROWN_C.clone().addScaledVector(d, lo);
  const e = 0.01;
  const n = V(
    toothOuter(p.x + e, p.y, p.z) - toothOuter(p.x - e, p.y, p.z),
    toothOuter(p.x, p.y + e, p.z) - toothOuter(p.x, p.y - e, p.z),
    toothOuter(p.x, p.y, p.z + e) - toothOuter(p.x, p.y, p.z - e),
  ).normalize();
  return {p, n};
};

/** Đường đi của lỗ sâu trên mặt cắt: từ rãnh nhai xuống men, ngà, tới tủy */
export const DECAY_X = 0.62;
export const DECAY_PATH = new THREE.CatmullRomCurve3([V(DECAY_X, 2.32, 0), V(DECAY_X + 0.02, 1.95, 0), V(DECAY_X, 1.55, 0), V(DECAY_X - 0.04, 1.2, 0), V(DECAY_X - 0.08, 0.95, 0)]);
export const decayRadius = (u: number, grow: number) => {
  // miệng lỗ hẹp trong men, phình rộng ở ngà (sâu răng "đào hầm" dưới men), đầu tròn
  const prof = 0.17 + 0.2 * sstep(0.28, 0.6, u) + 0.04 * Math.sin(u * 9);
  const reach = grow * 1.12;
  if (u > reach) return 0.0006;
  const tip = Math.sqrt(Math.max(0, 1 - ((u - (reach - 0.18)) / 0.18) ** 2));
  return prof * (u > reach - 0.18 ? tip : 1);
};
