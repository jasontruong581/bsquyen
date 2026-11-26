/* Đường tâm của đại tràng (toạ độ thế giới = toạ độ màn hình 1080x1920 khi camera ở (540, 700) phóng 1), theo chiều từ manh tràng tới hậu môn.
   Hình dáng: manh tràng + đại tràng lên (trái màn hình), đại tràng ngang ở trên, đại tràng xuống (phải màn hình), đại tràng sigma, trực tràng.
   Mọi thứ vẽ theo đường này (thành ruột, nếp gấp, polyp, ống soi) đều lấy điểm và pháp tuyến từ `pathAt`. */

export const D = 250; // đường kính ngoài của ống
export const R_L = 91; // bán kính lòng ruột (phần còn lại là thành ruột dày ~34)

const START: [number, number] = [190, 920];
const SEGS: number[][] = [
  [190, 800, 190, 640, 190, 540], // đại tràng lên
  [190, 440, 270, 395, 380, 402], // góc gan
  [520, 412, 700, 452, 860, 402], // đại tràng ngang
  [960, 372, 1040, 430, 1040, 540], // góc lách
  [1040, 680, 1040, 780, 1040, 880], // đại tràng xuống
  [1040, 1010, 990, 1090, 880, 1090], // sigma
  [780, 1090, 660, 1090, 560, 1090],
  [470, 1090, 420, 1150, 440, 1220],
  [460, 1290, 540, 1290, 540, 1370], // trực tràng
  [540, 1410, 540, 1450, 540, 1500],
];

const STEP = 6;
type Sample = {x: number; y: number};

const cubic = (p0: number[], c: number[]): Sample[] => {
  const out: Sample[] = [];
  const n = 64;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push({
      x: m * m * m * p0[0] + 3 * m * m * t * c[0] + 3 * m * t * t * c[2] + t * t * t * c[4],
      y: m * m * m * p0[1] + 3 * m * m * t * c[1] + 3 * m * t * t * c[3] + t * t * t * c[5],
    });
  }
  return out;
};

const raw: Sample[] = [{x: START[0], y: START[1]}];
{
  let p0 = [START[0], START[1]];
  for (const s of SEGS) {
    raw.push(...cubic(p0, s));
    p0 = [s[4], s[5]];
  }
}
// độ dài tích luỹ
const cum: number[] = [0];
for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
export const PATH_LEN = cum[cum.length - 1];

// lấy mẫu đều mỗi STEP đơn vị
const N = Math.floor(PATH_LEN / STEP);
const PX: number[] = [];
const PY: number[] = [];
{
  let j = 0;
  for (let k = 0; k <= N; k++) {
    const u = (k * PATH_LEN) / N;
    while (j < cum.length - 2 && cum[j + 1] < u) j++;
    const f = (u - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
    PX.push(raw[j].x + (raw[j + 1].x - raw[j].x) * f);
    PY.push(raw[j].y + (raw[j + 1].y - raw[j].y) * f);
  }
}
const US = PATH_LEN / N;

export type PathPt = {x: number; y: number; tx: number; ty: number; nx: number; ny: number};
/** Điểm trên đường tâm tại độ dài u; (tx,ty) là hướng đi về phía hậu môn, (nx,ny) = (-ty,tx) là pháp tuyến (với ống nằm ngang, hướng xuống màn hình) */
export const pathAt = (u: number): PathPt => {
  const f = Math.max(0, Math.min(N - 0.001, u / US));
  const i = Math.floor(f);
  const a = f - i;
  const x = PX[i] + (PX[i + 1] - PX[i]) * a;
  const y = PY[i] + (PY[i + 1] - PY[i]) * a;
  const i0 = Math.max(0, i - 2);
  const i1 = Math.min(N, i + 3);
  let tx = PX[i1] - PX[i0];
  let ty = PY[i1] - PY[i0];
  const l = Math.hypot(tx, ty) || 1;
  tx /= l;
  ty /= l;
  return {x, y, tx, ty, nx: -ty, ny: tx};
};

/** Độ dài u của điểm đường tâm gần (x, y) nhất */
export const uNear = (x: number, y: number) => {
  let best = 0;
  let bd = Infinity;
  for (let k = 0; k <= N; k++) {
    const d = (PX[k] - x) ** 2 + (PY[k] - y) ** 2;
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best * US;
};

const f1 = (n: number) => n.toFixed(1);
/** Chuỗi path của đường song song cách đường tâm v (dương = phía pháp tuyến), từ độ dài u0 tới u1 */
export const offsetD = (v: number, u0 = 0, u1 = PATH_LEN, step = 1) => {
  const k0 = Math.max(0, Math.floor(u0 / US));
  const k1 = Math.min(N, Math.ceil(u1 / US));
  let d = '';
  for (let k = k0; k <= k1; k += step) {
    const p = pathAt(k * US);
    d += `${k === k0 ? 'M' : 'L'} ${f1(p.x + p.nx * v)} ${f1(p.y + p.ny * v)} `;
  }
  return d;
};

/** Hậu môn: điểm cuối của đường tâm */
export const ANUS = pathAt(PATH_LEN);

// vài mốc dùng chung
export const U_POLYP = uNear(600, 440);
export const U_SIGMA = uNear(720, 1090);
export const U_DESC = uNear(1040, 800);
export const U_RECTUM = uNear(540, 1380);
