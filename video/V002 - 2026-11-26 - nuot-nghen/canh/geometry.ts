/* Hình học của giải phẫu (toạ độ thế giới): ống thực quản đi thẳng đứng, khí quản bên trái, dạ dày ở dưới. */
export const XE = 640; // trục thực quản
export const EH = 62; // nửa bề rộng lòng thực quản
export const XT = 500; // trục khí quản
export const Y_TOP = 985; // chỗ thực quản bắt đầu (dưới họng)
export const Y_VALVE = 2805; // van tâm vị
export const Y_END = 2845;

/** Chỗ ống bị bóp hẹp: y tâm, k = mức bóp (0..1), s = độ rộng vùng bóp */
export type Sq = {y: number; k: number; s: number};

export const halfAt = (y: number, sq: Sq[], base: number) => {
  let f = 1;
  for (const q of sq) f -= q.k * Math.exp(-(((y - q.y) / q.s) ** 2));
  return Math.max(4, base * Math.max(0.06, f));
};

/** Đường bao khép kín của một ống thẳng đứng có bề rộng thay đổi theo y */
export const tubeD = (cx: number, y0: number, y1: number, sq: Sq[], base: number, step = 8) => {
  const left: string[] = [];
  const right: string[] = [];
  for (let y = y0; y <= y1 + 0.01; y += step) {
    const h = halfAt(y, sq, base);
    left.push(`${(cx - h).toFixed(1)} ${y}`);
    right.push(`${(cx + h).toFixed(1)} ${y}`);
  }
  return `M ${left.join(' L ')} L ${right.reverse().join(' L ')} Z`;
};
