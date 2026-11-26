/* Đường dây thần kinh của V008 (toạ độ thế giới): từ chỗ đau ở cột sống thắt lưng, chạy lên dọc cột sống, qua cổ tới não.
   Mỗi đoạn là một Bézier bậc ba; dựng bảng điểm theo độ dài cung để tra vị trí và hướng theo u (độ dài đã đi, tính từ chỗ đau). */

type Seg = [number, number, number, number, number, number, number, number];
const SEGS: Seg[] = [
  [746, 1134, 722, 1090, 704, 1040, 700, 990],
  [700, 990, 735, 880, 728, 720, 706, 600],
  [706, 600, 690, 500, 652, 452, 622, 392],
  [622, 392, 602, 352, 584, 330, 566, 292],
  [566, 292, 530, 262, 480, 228, 420, 205],
  [420, 205, 372, 186, 282, 196, 212, 208],
];

const dOf = (list: Seg[]) => list.map((s, i) => `${i === 0 ? `M ${s[0]} ${s[1]} ` : ''}C ${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]}`).join(' ');
/** Dây thần kinh (từ chỗ đau tới chân não) và dây cáp (từ não ra bảng tổng đài) */
export const NERVE_D = dOf(SEGS.slice(0, 4));
export const CABLE_D = dOf(SEGS.slice(5));

const bez = (s: Seg, k: number) => {
  const m = 1 - k;
  const a = m * m * m;
  const b = 3 * m * m * k;
  const c = 3 * m * k * k;
  const d = k * k * k;
  return {x: a * s[0] + b * s[2] + c * s[4] + d * s[6], y: a * s[1] + b * s[3] + c * s[5] + d * s[7]};
};

const PTS: {x: number; y: number; u: number}[] = [];
const SEG_START: number[] = [];
{
  let u = 0;
  let prev: {x: number; y: number} | null = null;
  SEGS.forEach((s, si) => {
    SEG_START.push(u);
    for (let i = si === 0 ? 0 : 1; i <= 80; i++) {
      const p = bez(s, i / 80);
      if (prev) u += Math.hypot(p.x - prev.x, p.y - prev.y);
      PTS.push({x: p.x, y: p.y, u});
      prev = p;
    }
  });
}
export const PATH_LEN = PTS[PTS.length - 1].u;
/** u tại đầu mỗi đoạn: 0 = chỗ đau, [1] = chỗ nối lên cột sống, [2] = cổ, [3] = chân não, [4] = vào não, [5] = dây cáp ra bảng tổng đài */
export const U_SEG = SEG_START;
/** u tại chân não (dây thần kinh kết thúc), đầu dây cáp, và đầu cắm vào bảng tổng đài */
export const U_BRAIN = SEG_START[4];
export const U_CABLE = SEG_START[5];

export type PathPt = {x: number; y: number; tx: number; ty: number; nx: number; ny: number};
export const pathAt = (uu: number): PathPt => {
  const u = Math.max(0, Math.min(PATH_LEN, uu));
  let lo = 0;
  let hi = PTS.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (PTS[mid].u <= u) lo = mid;
    else hi = mid;
  }
  const a = PTS[lo];
  const b = PTS[hi];
  const k = b.u === a.u ? 0 : (u - a.u) / (b.u - a.u);
  const x = a.x + (b.x - a.x) * k;
  const y = a.y + (b.y - a.y) * k;
  const p0 = PTS[Math.max(0, lo - 1)];
  const p1 = PTS[Math.min(PTS.length - 1, hi + 1)];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const l = Math.hypot(dx, dy) || 1;
  return {x, y, tx: dx / l, ty: dy / l, nx: -dy / l, ny: dx / l};
};

export const U_END = PATH_LEN;

/** u của điểm trên đường dây gần (x, y) nhất */
export const uNear = (x: number, y: number) => {
  let best = 0;
  let bd = Infinity;
  for (const p of PTS) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = p.u;
    }
  }
  return best;
};

/** Đoạn đường dây từ u0 đến u1 dưới dạng chuỗi path (để vẽ xung sáng chạy trên dây) */
export const subPath = (u0: number, u1: number, step = 12) => {
  let d = '';
  for (let u = u0; u < u1; u += step) {
    const p = pathAt(u);
    d += `${d ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  const e = pathAt(u1);
  return `${d}L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
};
