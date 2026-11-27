/* Camera một mạch của V011: một đường cong trơn (spline Hermite qua các mốc, không khựng ở mốc) quanh mô hình, chậm và liên tục.
   Hàm thuần theo thời gian t, dùng cho cả dựng hình lẫn quy chiếu lớp phủ 2D (nhãn có đường chỉ).
   Mỗi mốc: [t, phương vị (độ), góc nâng (độ), khoảng cách, x, y, z của điểm nhìn]. */
import * as THREE from 'three';

type Key = [number, number, number, number, number, number, number];
const KEYS: Key[] = [
  [0, -30, 12, 28, 0.3, 0, 0],
  [4.5, -22, 13, 26.5, 0.3, 0, 0],
  [11, -8, 12, 26.5, 0.3, 0, 0],
  [14.5, 4, 8, 27.5, 0, -1.2, 0],
  [19, 14, 12, 27, 0, -1.0, 0],
  [24, 24, 16, 27, 0.2, -0.6, 0],
  [27, 32, 20, 28, 0.2, 0.4, -0.3],
  [29.4, 38, 24, 27, 0.3, 0, 0],
  [32.5, 44, 38, 17, 0.3, 0, 0],
  [37, 54, 34, 16.5, 0.3, 0, 0],
  [42, 66, 30, 14.5, 0.3, 0, 0],
  [47, 78, 28, 15.5, 0.3, 0, 0],
  [50.4, 82, 26, 16.5, 0.3, 0, 0],
  [53, 34, 16, 27, 0, -1.0, 0.3],
  [56, 22, 11, 26.5, -0.3, -1.1, 0.5],
  [59, 12, 10, 27, 0.2, -0.8, 0],
  [60.5, 4, 10, 27.5, 0.3, -0.6, 0],
  [64, -8, 11, 27, 0.3, -0.6, 0],
  [68, -16, 12, 26.5, 0.3, -0.6, 0],
  [74, -6, 12, 27.5, 0.3, 0.7, 0],
  [79.5, 8, 11, 27.5, 0.3, 0.7, 0],
  [90, 14, 11, 27.5, 0.3, 0.7, 0],
];

const FOV = 32;
/** Phần nửa chiều cao khung đẩy điểm nhìn lên cao, để mô hình nằm trong vùng y 250–1150, trên phụ đề */
const LIFT = 0.26;

/** Spline Hermite có tiếp tuyến hữu hạn (cardinal), không khựng ở mốc */
const spline = (t: number): number[] => {
  const n = KEYS.length;
  if (t <= KEYS[0][0]) return KEYS[0].slice(1);
  if (t >= KEYS[n - 1][0]) return KEYS[n - 1].slice(1);
  let i = 0;
  while (t > KEYS[i + 1][0]) i++;
  const k0 = KEYS[Math.max(0, i - 1)];
  const k1 = KEYS[i];
  const k2 = KEYS[i + 1];
  const k3 = KEYS[Math.min(n - 1, i + 2)];
  const h = k2[0] - k1[0];
  const u = (t - k1[0]) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  const out: number[] = [];
  for (let c = 1; c <= 6; c++) {
    const m1 = (k2[c] - k0[c]) / (k2[0] - k0[0]);
    const m2 = (k3[c] - k1[c]) / (k3[0] - k1[0]);
    out.push(h00 * k1[c] + h10 * h * m1 + h01 * k2[c] + h11 * h * m2);
  }
  return out;
};

export type Cam = {eye: THREE.Vector3; quat: THREE.Quaternion; fov: number};

export const cameraAt = (t: number): Cam => {
  const [az, el, d, tx, ty, tz] = spline(t);
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  const target = new THREE.Vector3(tx, ty, tz);
  const eye = target.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d));
  const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, target, new THREE.Vector3(0, 1, 0)));
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
  eye.addScaledVector(up, -LIFT * d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
  return {eye, quat, fov: FOV};
};

/* ---------- chiếu một điểm 3D lên màn hình 1080x1920 (cho lớp phủ 2D) ---------- */
const projCam = new THREE.PerspectiveCamera(FOV, 1080 / 1920, 0.03, 120);
export const project = (t: number, p: THREE.Vector3) => {
  const c = cameraAt(t);
  projCam.position.copy(c.eye);
  projCam.quaternion.copy(c.quat);
  projCam.updateMatrixWorld(true);
  const v = p.clone().project(projCam);
  return {x: (v.x * 0.5 + 0.5) * 1080, y: (1 - (v.y * 0.5 + 0.5)) * 1920};
};
