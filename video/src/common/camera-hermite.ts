/* Camera một mạch cho video 3D: spline Hermite (cardinal) qua các mốc, không khựng ở mốc, chậm và liên tục.
   Hàm thuần theo thời gian t, dùng cho cả dựng hình lẫn quy chiếu lớp phủ 2D (nhãn có đường chỉ).
   Mỗi mốc: [t, phương vị (độ), góc nâng (độ), khoảng cách, x, y, z của điểm nhìn]. */
import * as THREE from 'three';

export type CamKey = [number, number, number, number, number, number, number];
export type Cam = {eye: THREE.Vector3; quat: THREE.Quaternion; fov: number};

export const makeCamera = (keys: CamKey[], fov = 32, lift = 0.26) => {
  const n = keys.length;
  const spline = (t: number): number[] => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
    let i = 0;
    while (t > keys[i + 1][0]) i++;
    const k0 = keys[Math.max(0, i - 1)];
    const k1 = keys[i];
    const k2 = keys[i + 1];
    const k3 = keys[Math.min(n - 1, i + 2)];
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

  /** `lift` đẩy điểm nhìn lên cao (theo nửa chiều cao khung) để mô hình nằm trong vùng y 250–1150, trên phụ đề */
  const cameraAt = (t: number): Cam => {
    const [az, el, d, tx, ty, tz] = spline(t);
    const a = THREE.MathUtils.degToRad(az);
    const e = THREE.MathUtils.degToRad(el);
    const target = new THREE.Vector3(tx, ty, tz);
    const eye = target.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d));
    const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, target, new THREE.Vector3(0, 1, 0)));
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    eye.addScaledVector(up, -lift * d * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    return {eye, quat, fov};
  };

  /** Chiếu một điểm 3D lên màn hình 1080x1920 (cho lớp phủ 2D) */
  const projCam = new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.03, 120);
  const project = (t: number, p: THREE.Vector3) => {
    const c = cameraAt(t);
    projCam.position.copy(c.eye);
    projCam.quaternion.copy(c.quat);
    projCam.updateMatrixWorld(true);
    const v = p.clone().project(projCam);
    return {x: (v.x * 0.5 + 0.5) * 1080, y: (1 - (v.y * 0.5 + 0.5)) * 1920};
  };

  return {cameraAt, project};
};
