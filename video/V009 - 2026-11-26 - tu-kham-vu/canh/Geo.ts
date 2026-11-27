/* Hình học của mô hình duy nhất trong V009: một "đĩa" tròn dạng mặt đồng hồ (nhìn từ trên xuống), nghiêng dần thành mặt cắt ba lớp.
   Hoàn toàn là sơ đồ trừu tượng: không có thân hình, không có chi tiết giải phẫu bên ngoài. Gốc toạ độ ở tâm đĩa, đơn vị = px khi phóng 1:1. */

/** Bán kính mặt đĩa */
export const R = 330;
/** Bề dày đĩa khi nhìn ngang (mặt cắt): da + mô tuyến và mỡ + thành ngực */
export const H = 190;
export const SK = 16; // lớp da
export const GL = 110; // lớp mô tuyến và mỡ
export const OFFS = [0, SK, SK + GL, H];

export const rad = (d: number) => (d * Math.PI) / 180;

/** Điểm trên mặt đĩa (phẳng): `ang` độ tính từ 12 giờ theo chiều kim đồng hồ, `r` cách tâm */
export const pol = (r: number, ang: number) => ({x: r * Math.sin(rad(ang)), y: -r * Math.cos(rad(ang))});

/** Khối nhỏ ở "10 giờ", cách tâm khoảng hai đốt ngón tay */
export const LUMP_ANG = -60;
export const LUMP_R = 155;
export const LUMP = pol(LUMP_R, LUMP_ANG);

/** Chỗ ba ngón tay ấn trên mặt cắt (x) và độ lún tối đa của từng mức lực: nhẹ, vừa, mạnh */
export const PRESS_X = [-200, 0, 200];
export const DEPTH = [14, 44, 82];

/** Phần mô kéo dài lên hố nách: hướng 10 giờ 30, đầu mút cách tâm 1,55 R */
export const TAIL_ANG = -58;
export const TAIL_RC = 1.22 * R;
export const TAIL_A = 0.33 * R; // nửa trục dọc
export const TAIL_B = 60; // nửa trục ngang
export const TAIL_TIP = pol(TAIL_RC + TAIL_A, TAIL_ANG);

/** Xương đòn vẽ như một thanh cong phía trên đĩa */
export const CLAV = {x0: -400, x1: 90, y: -398};

/** Đường đi tay xoắn từ ngoài vào trong: 3,4 vòng, bán kính 0,86 R về 0,2 R */
const SPIRAL_N = 220;
const SPIRAL_TURNS = 3.4;
export const SPIRAL = Array.from({length: SPIRAL_N + 1}, (_, i) => {
  const u = i / SPIRAL_N;
  return pol((0.86 - 0.66 * u) * R, -30 + u * SPIRAL_TURNS * 360);
});
export const spiralAt = (u: number) => {
  const f = Math.max(0, Math.min(1, u)) * SPIRAL_N;
  const i = Math.min(SPIRAL_N - 1, Math.floor(f));
  const k = f - i;
  return {x: SPIRAL[i].x + (SPIRAL[i + 1].x - SPIRAL[i].x) * k, y: SPIRAL[i].y + (SPIRAL[i + 1].y - SPIRAL[i].y) * k};
};

/** Hình học của đĩa theo độ nghiêng `tilt` (0 = nhìn từ trên xuống, 1 = nhìn ngang): ca = hệ số ép dọc mặt đĩa, sa = phần dày nhìn thấy */
export const geom = (t: number, tilt: number) => {
  const alpha = (tilt * Math.PI) / 2;
  const ca = Math.max(0.0008, Math.cos(alpha));
  const sa = Math.sin(alpha);
  return {ca, sa, ry: R * ca, h: H * sa, bob: 5 * Math.sin(t * 1.3)};
};
export type Geom = ReturnType<typeof geom>;

/** Điểm trên mặt đĩa sau khi nghiêng và xoay `psi`, giữ toạ độ thế giới (chưa cộng bob) */
export const onTop = (g: Geom, r: number, ang: number, psi = 0) => {
  const p = pol(r, ang + psi);
  return {x: p.x, y: p.y * g.ca};
};
