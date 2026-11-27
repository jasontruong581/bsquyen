/* Hình học V013 (lắp tử cung và buồng trứng), sinh hoàn toàn bằng code từ khối cơ bản, không tải mô hình ngoài.
   Toàn bộ là hình vẽ minh hoạ đơn giản hóa (lát cắt phẳng dày, quả bầu dục, ống), không có hình dáng người; chỉ có khung chậu mờ làm nền.
   Hệ toạ độ: y hướng lên, z hướng về người xem. Nhìn từ phía trước nên "bên phải" của hình là x dương.
   - Tử cung: lát cắt dọc dạng quả lê, thành cơ dày có khoang rỗng; lớp lót (nội mạc) là một vành trong khoang, có hai mức dày.
   - Cổ tử cung: khối thon phía dưới có rãnh ống hẹp.
   - Buồng trứng: bầu dục nhấp nhô nhẹ; nang trứng là các bóng nhỏ.
   - Vòi trứng: ống cong có bán kính đổi dọc theo ống, loe thành phễu ở đầu; tua vòi là các ngón thon xếp quạt quanh miệng phễu. */
import * as THREE from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {Pipe, V, mulberry} from '../../V012 - 2026-11-27 - lap-tieu-hoa/canh-3d/giai-phau';

export {Pipe, V, mulberry};

const sstep = (a: number, b: number, x: number) => {
  const p = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return p * p * (3 - 2 * p);
};

type P2 = [number, number];
/** Điểm trên nửa phải, đi từ đỉnh xuống; lấy đối xứng sang trái rồi nối thành vòng kín */
const mirrorBack = (right: P2[]): P2[] => right.slice(1).reverse().map(([x, y]) => [-x, y] as P2);
const loop = (pts: P2[], n = 150) => {
  const c = new THREE.CatmullRomCurve3(pts.map(([x, y]) => V(x, y, 0)), true, 'centripetal');
  return c.getSpacedPoints(n).slice(0, -1).map((p) => new THREE.Vector2(p.x, p.y));
};
const scaleAbout = (pts: P2[], k: number, cx: number, cy: number): P2[] => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k] as P2);

/** Tấm dày có bo mép: vòng ngoài, có thể có lỗ; kích thước ngoài cùng đúng bằng đường vẽ */
const slab = (outer: P2[], holes: P2[][], depth: number, bevelT: number, bevelS: number, zCenter = 0) => {
  const s = new THREE.Shape(loop(outer));
  holes.forEach((h) => s.holes.push(new THREE.Path(loop(h))));
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bevelT, bevelSize: bevelS, bevelOffset: -bevelS, bevelSegments: 5, curveSegments: 1, steps: 1});
  g.translate(0, 0, zCenter - depth / 2);
  g.deleteAttribute('uv');
  return g;
};

/* ---------------- tử cung ---------------- */
const UT_RIGHT: P2[] = [[0, 1.74], [0.8, 1.72], [1.4, 1.48], [1.76, 0.95], [1.8, 0.3], [1.58, -0.4], [1.18, -1.05], [0.85, -1.6], [0.66, -2.1]];
const UT_OUTER: P2[] = [...UT_RIGHT, [0.4, -2.36], [-0.4, -2.36], ...mirrorBack(UT_RIGHT)];
const CAV_RIGHT: P2[] = [[0, 0.98], [0.6, 1.02], [1.08, 0.88], [1.14, 0.4], [0.86, -0.2], [0.5, -0.95], [0.26, -1.5], [0.15, -1.9]];
const CAV: P2[] = [...CAV_RIGHT, [0, -2.0], ...mirrorBack(CAV_RIGHT)];
/** Nửa bề rộng khoang tử cung ở độ cao y (xấp xỉ), để rải các mảnh lớp lót bên trong khoang */
export const cavityHalf = (y: number) => 0.15 + 0.95 * Math.max(0, Math.min(1, (y + 2.0) / 2.9));
export const UT_TOP = 1.74;
export const CAV_C = V(0, -0.3, 0);

/** Thành cơ dày, có khoang rỗng xuyên qua */
export const buildUterusWall = () => slab(UT_OUTER, [CAV], 0.9, 0.22, 0.14);
/** Nền khoang phía sau */
export const buildCavityBack = () => slab(scaleAbout(CAV, 1.04, 0, -0.3), [], 0.1, 0.03, 0.03, 0.28);
/** Lớp lót: vành trong khoang; k là tỉ lệ lỗ giữa (nhỏ = lớp lót dày) */
export const LINING_THIN = 0.9;
export const LINING_THICK = 0.64;
export const buildLining = (k: number) => slab(scaleAbout(CAV, 0.98, 0, -0.3), [scaleAbout(CAV, k, 0, -0.3)], 0.3, 0.06, 0.05, 0.38);

/* ---------------- cổ tử cung ---------------- */
const CERV: P2[] = [[-0.6, -1.9], [0.6, -1.9], [0.7, -2.5], [0.62, -3.2], [0.3, -3.52], [-0.3, -3.52], [-0.62, -3.2], [-0.7, -2.5]];
export const buildCervix = () => slab(CERV, [], 0.74, 0.18, 0.12, -0.04);
const CANAL: P2[] = [[-0.1, -2.1], [0.1, -2.1], [0.11, -2.9], [0.1, -3.54], [-0.1, -3.54], [-0.11, -2.9]];
export const buildCanal = () => slab(CANAL, [], 0.08, 0.03, 0.03, 0.54);
export const CERVIX_C = V(0, -2.75, 0.4);
export const CANAL_PATH = new THREE.CatmullRomCurve3([V(0, -1.9, 0.5), V(0, -2.5, 0.6), V(0, -3.2, 0.6), V(0, -3.75, 0.6), V(0, -4.5, 0.6)]);

/* ---------------- buồng trứng và nang trứng ---------------- */
export const OVARY_C = V(3.4, -0.55, 0.1);
export const OVARY_R = V(1.0, 0.75, 0.65);
export const buildOvary = () => {
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, 44, 30);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const k = 1 + 0.018 * Math.sin(v.x * 3.1 + v.y * 2.3) * Math.sin(v.z * 3.2 + v.x * 2.1);
    pos.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  g.computeVertexNormals();
  return g;
};
/** Nang trứng nhỏ: toạ độ trong hệ buồng trứng (đơn vị bán kính); nang đầu tiên là nang sẽ lớn lên và rụng trứng */
export const FOLLICLES: {p: THREE.Vector3; r: number}[] = [
  {p: V(0.55, 0.45, 0.35), r: 0.3},
  {p: V(-0.45, 0.5, 0.45), r: 0.2},
  {p: V(0.1, 0.1, 0.62), r: 0.24},
  {p: V(-0.65, -0.1, 0.4), r: 0.18},
  {p: V(0.5, -0.4, 0.45), r: 0.22},
  {p: V(-0.2, -0.5, 0.45), r: 0.17},
  {p: V(0.85, 0.05, 0.1), r: 0.16},
];
/** Vị trí thế giới của tâm nang lớn của buồng trứng bên phải (x dương) */
export const FOLLICLE_W = OVARY_C.clone().add(V(FOLLICLES[0].p.x * OVARY_R.x, FOLLICLES[0].p.y * OVARY_R.y, FOLLICLES[0].p.z * OVARY_R.z));
/** Hướng ra ngoài mặt buồng trứng tại nang lớn */
export const FOLLICLE_DIR = V(FOLLICLES[0].p.x / OVARY_R.x, FOLLICLES[0].p.y / OVARY_R.y, FOLLICLES[0].p.z / OVARY_R.z).normalize();

/* ---------------- vòi trứng ---------------- */
/** Đường tâm vòi bên s (+1 = bên phải màn hình): từ góc trên tử cung, vòng lên cao rồi hạ xuống phía trên buồng trứng, kết thúc ở miệng phễu */
export const tubeCurve = (s: 1 | -1) =>
  new THREE.CatmullRomCurve3(
    [V(1.3, 1.05, 0), V(1.7, 1.9, 0.06), V(2.2, 2.55, 0.1), V(3.0, 2.78, 0.1), V(3.7, 2.3, 0.1), V(4.1, 1.62, 0.1), V(4.2, 1.02, 0.08)].map((p) => V(p.x * s, p.y, p.z)),
    false,
    'centripetal',
  );
export const TUBE_R = (u: number) => 0.15 + 0.1 * sstep(0.35, 0.8, u) + 0.26 * sstep(0.9, 1, u);
export const FUNNEL = (s: 1 | -1) => tubeCurve(s).getPointAt(1);
export const makeTubePipe = (s: 1 | -1) => new Pipe(tubeCurve(s), 100, 14).update(TUBE_R);

/** Tua vòi: ngón thon cong, chỉ về phía -y trong hệ của chính nó; xếp quạt quanh miệng phễu bằng phép xoay */
export const FINGER_N = 9;
export const FINGER_CURVE = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.02, -0.3, 0.02), V(0.14, -0.58, 0), V(0.32, -0.78, -0.02)]);
export const makeFingerGeometry = () => new Pipe(FINGER_CURVE, 14, 8).update((u) => 0.02 + 0.105 * Math.pow(1 - u, 0.75) + 0.012 * Math.sin(u * 9)).geometry;
/** Hướng nan quạt của tua thứ i: góc quanh trục z (rad) và độ xoay quanh trục y để các tua không nằm cùng một mặt phẳng */
export const finger = (i: number) => {
  const f = i / (FINGER_N - 1) - 0.5;
  return {fan: f * 2.3, tilt: Math.sin(i * 2.1) * 0.5, len: 0.78 + 0.22 * Math.cos(i * 1.7), ph: i * 0.9};
};

/* ---------------- khung chậu (bối cảnh mờ) ---------------- */
const PELVIS_RIGHT: P2[] = [[0, 3.8], [2.3, 3.7], [4.3, 3.1], [5.2, 1.8], [5.15, -0.3], [4.2, -2.4], [2.8, -3.9], [1.3, -4.4], [0, -4.5]];
const PELVIS: P2[] = [...PELVIS_RIGHT, ...mirrorBack(PELVIS_RIGHT)];
export const PELVIS_Z = -1.3;
export const buildPelvis = () => slab(PELVIS, [scaleAbout(PELVIS, 0.87, 0, -0.3)], 0.5, 0.25, 0.2, PELVIS_Z);
/** Điểm trên vành khung chậu để gắn nhãn (bên trái màn hình) */
export const PELVIS_LABEL = V(-4.75, 1.3, PELVIS_Z);

/* ---------------- quả lê (mở đầu: "nhỏ bằng quả lê") ---------------- */
export const buildPear = () => {
  const prof = [[0, 0], [0.42, 0.03], [0.8, 0.3], [0.96, 0.72], [0.88, 1.15], [0.62, 1.5], [0.4, 1.85], [0.3, 2.2], [0.18, 2.42], [0, 2.46]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 36);
  g.deleteAttribute('uv');
  return g;
};
export const buildStem = () => {
  const g = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 8);
  g.translate(0, 0.25, 0);
  g.deleteAttribute('uv');
  return g;
};
