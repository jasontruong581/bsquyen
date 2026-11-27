/* Camera một mạch của V013: toàn cảnh khung chậu → áp sát tử cung → sang hai buồng trứng → vòi trứng → phóng to nang trứng,
   rồi bám theo quả trứng dọc vòi vào khoang tử cung, xuống cổ tử cung và lùi ra toàn cảnh.
   Mỗi mốc: [t, phương vị (độ), góc nâng (độ), khoảng cách, x, y, z của điểm nhìn]. Ở đoạn bám trứng, điểm nhìn lấy từ vị trí trứng. */
import {makeCamera, type CamKey} from '../../src/common/camera-hermite';
import {eggAt} from './hanh-trinh';

const at = (t: number, az: number, el: number, d: number, dx = 0, dy = 0, dz = 0): CamKey => {
  const p = eggAt(t).p;
  return [t, az, el, d, p.x + dx, p.y + dy, p.z + dz];
};

const KEYS: CamKey[] = [
  [0, -10, 7, 33, 0, -0.4, 0],
  [3.5, -6, 7, 34, 0, -0.3, 0],
  [6, 0, 8, 35, 0, -0.3, 0],
  [9.3, 14, 10, 30, 0, -0.5, 0],
  [11.5, 18, 13, 26, 0, -0.8, 0],
  [15.5, -4, 13, 26, 0, -0.8, 0],
  [19, -18, 13, 26, 0, -0.8, 0],
  [23.5, -10, 11, 26, 0, -0.8, 0],
  [26.2, 0, 8, 35, 0, -0.3, 0],
  [29.5, 6, 8, 33, 0.6, -0.3, 0],
  [32.3, 8, 8, 22, 2.6, -0.4, 0.3],
  [33.6, 6, 8, 22, 2.6, -0.4, 0.3],
  [35.2, -4, 8, 35, 0, -0.3, 0],
  [39.6, -10, 8, 35, 0, -0.3, 0],
  [41.6, 4, 8, 21, 3.7, 0.5, 0.3],
  [47.2, 8, 8, 21, 3.7, 0.5, 0.3],
  [49.2, 4, 8, 11, 3.0, -0.1, 0.4],
  [52.4, 2, 9, 10.5, 3.1, 0.1, 0.4],
  [54.4, 0, 8, 11, 3.4, 0.5, 0.3],
  at(57.2, -2, 6, 16),
  at(59.9, 4, 7, 16),
  at(63.0, 6, 8, 18),
  [64.6, 4, 8, 22, 0.9, 0.9, 0.3],
  [66.4, -14, 12, 26, 0, -0.8, 0],
  [70, 12, 12, 26, 0, -0.6, 0],
  [72.6, 8, 9, 22, 0, -1.4, 0.2],
  [74.2, 8, 8, 24, 0, -1.3, 0.3],
  [78, 4, 8, 24, 0, -1.3, 0.3],
  [81, 0, 8, 36, 0, -0.3, 0],
  [84, 0, 8, 38, 0, 0.9, 0],
  [92, 0, 8, 38, 0, 0.9, 0],
];

export const {cameraAt, project} = makeCamera(KEYS, 32, 0.26);

