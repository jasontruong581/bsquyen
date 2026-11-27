/* Camera một mạch của bản 3D (hàm thuần theo thời gian t, dùng cho cả dựng hình lẫn quy chiếu lớp phủ 2D):
   1. Bay xuống khí quản, qua ngã ba, vào phế quản phải, xuống thuỳ dưới tới một chùm phế nang (cảnh 1-2).
   2. Dừng lại ở chùm phế nang, rồi lùi thẳng ra qua thành phổi tới tầm nhìn hai lá phổi (đầu cảnh 3).
   3. Quay quanh hai phổi, chậm và liên tục (cảnh 3-7).
   4. Lùi ra xa thấy cả thân người mờ (cảnh 8-9), rồi quay về gần cho cảnh cuối (cảnh 10). */
import * as THREE from 'three';
import {P} from '../../src/timeline';
import {S, clamp01, smooth} from '../chung/timeline';
import {TREE} from './giai-phau';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ---------- đường bay trong ống ---------- */
const hero = TREE.hero;
const heroLen = hero.getLength();
const EXT = 0.16;
export const PATH_LEN = heroLen + EXT;
const tipPt = hero.getPointAt(1);
const endDir = hero.getTangentAt(1).normalize();
const pathAt = (s: number) => (s <= heroLen ? hero.getPointAt(Math.max(0, s) / heroLen) : tipPt.clone().addScaledVector(endDir, s - heroLen));

// hướng "lên" của màn hình, chuyển song song dọc đường bay; đầu đường nhìn xuống khí quản với phía sau ở trên màn hình
const N_UP = 700;
const ups: THREE.Vector3[] = [];
{
  let up = V(0, 0, -1);
  for (let k = 0; k <= N_UP; k++) {
    const s = (PATH_LEN * k) / N_UP;
    const f = pathAt(Math.min(s + 0.02, PATH_LEN + 1)).sub(pathAt(s)).normalize();
    up = up.sub(f.clone().multiplyScalar(up.dot(f))).normalize();
    ups.push(up.clone());
  }
}
const upAt = (s: number) => {
  const x = clamp01(s / PATH_LEN) * N_UP;
  const i = Math.min(N_UP - 1, Math.floor(x));
  return ups[i].clone().lerp(ups[i + 1], x - i).normalize();
};

/* ---------- mốc thời gian ---------- */
export const T_IN_END = 6.0;
export const T_EXIT0 = 8.3;
export const T_EXIT1 = 10.9;
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export type Cam = {eye: THREE.Vector3; quat: THREE.Quaternion; fov: number};

const lookQuat = (eye: THREE.Vector3, target: THREE.Vector3, up: THREE.Vector3) => {
  const m = new THREE.Matrix4().lookAt(eye, target, up);
  return new THREE.Quaternion().setFromRotationMatrix(m);
};

const FOV_IN = 66;
const FOV_OUT = 32;

const inside = (t: number): Cam => {
  const s = PATH_LEN * ease(clamp01(t / T_IN_END));
  const eye = pathAt(s);
  const target = pathAt(s + 1.0);
  const f = target.clone().sub(eye).normalize();
  const w = smooth(clamp01((s - 2.4) / (PATH_LEN - 2.4)));
  let up = upAt(s).lerp(V(0, 1, 0), w);
  up = up.sub(f.clone().multiplyScalar(up.dot(f))).normalize();
  const drift = t > T_IN_END ? 0.012 : 0;
  eye.add(V(Math.sin(t * 1.3) * drift, Math.cos(t * 1.1) * drift, 0));
  return {eye, quat: lookQuat(eye, target, up), fov: FOV_IN};
};

/* ---------- vòng quanh phổi ---------- */
const AZ0 = THREE.MathUtils.degToRad(-16);
const AZ1 = THREE.MathUtils.degToRad(40);
const T_AZ_END = 52;
export const az = (t: number) => {
  const a = AZ0 + (AZ1 - AZ0) * clamp01((t - T_EXIT1) / (T_AZ_END - T_EXIT1));
  return a + (THREE.MathUtils.degToRad(2) - AZ1) * smooth(P(t, T_AZ_END, 3.6, (x) => x));
};
const dist = (t: number) => {
  const far = smooth(P(t, S(8) + 0.1, 5.0, (x) => x));
  const back = smooth(P(t, S(10) - 0.6, 3.6, (x) => x));
  return 16.5 + 13.5 * far - 11.0 * back;
};
const targetY = (t: number) => {
  const far = smooth(P(t, S(8) + 0.1, 5.0, (x) => x));
  const back = smooth(P(t, S(10) - 0.6, 3.6, (x) => x));
  return -1.5 + 0.9 * far - 0.5 * back;
};

const overview = (t: number): Cam => {
  const a = az(t);
  const el = THREE.MathUtils.degToRad(13);
  const d = dist(t);
  const target = V(0, targetY(t), 0);
  const eye = target.clone().add(V(Math.sin(a) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(a) * Math.cos(el) * d));
  return {eye, quat: lookQuat(eye, target, V(0, 1, 0)), fov: FOV_OUT};
};

export const cameraAt = (t: number): Cam => {
  if (t < T_EXIT0) return inside(t);
  if (t >= T_EXIT1) return overview(t);
  const e = ease(clamp01((t - T_EXIT0) / (T_EXIT1 - T_EXIT0)));
  const a = inside(T_EXIT0);
  const b = overview(T_EXIT1);
  return {eye: a.eye.clone().lerp(b.eye, e), quat: a.quat.clone().slerp(b.quat, e), fov: a.fov + (b.fov - a.fov) * e};
};

/** Đèn pin trong lòng ống tắt dần khi camera lùi ra ngoài */
export const lampAt = (t: number) => 1 - smooth(clamp01((t - T_EXIT0 - 0.4) / 1.8));

/* ---------- chiếu một điểm 3D lên màn hình 1080x1920 (cho lớp phủ 2D) ---------- */
const projCam = new THREE.PerspectiveCamera(FOV_OUT, 1080 / 1920, 0.03, 90);
export type Screen = {x: number; y: number; /** điểm ảnh trên một đơn vị độ dài tại độ sâu của điểm */ ppu: number; behind: boolean};
export const project = (t: number, p: THREE.Vector3): Screen => {
  const c = cameraAt(t);
  projCam.position.copy(c.eye);
  projCam.quaternion.copy(c.quat);
  projCam.fov = c.fov;
  projCam.updateProjectionMatrix();
  projCam.updateMatrixWorld(true);
  const local = p.clone().applyMatrix4(projCam.matrixWorldInverse);
  const depth = -local.z;
  const v = p.clone().project(projCam);
  return {x: (v.x * 0.5 + 0.5) * 1080, y: (1 - (v.y * 0.5 + 0.5)) * 1920, ppu: 960 / Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) / Math.max(0.01, depth), behind: depth <= 0};
};
