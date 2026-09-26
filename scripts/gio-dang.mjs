// Tính giờ hẹn đăng Facebook (unix giây).
//
// Hai chế độ:
//   gioCoDinh "19:30" — đăng lúc 19:30 giờ Việt Nam cùng ngày; quá muộn thì dời sang hôm sau
//   delayPhut 120     — đăng sau N phút, dùng khi không đặt giờ cố định
//
// Tách khỏi dang-facebook.mjs để test được mà không gọi Facebook.

// Việt Nam UTC+7 quanh năm, không có giờ mùa hè — lệch cố định là đủ. Máy chạy
// GitHub Actions ở UTC, tính theo giờ máy thì bài lên lúc 2g30 sáng.
const LECH_VN_MS = 7 * 3600 * 1000;
// Facebook không nhận giờ hẹn gần hơn 10 phút.
const TOI_THIEU_MS = 10 * 60 * 1000;
const MOT_NGAY_MS = 24 * 3600 * 1000;

export function tinhGioDang(nowMs, { gioCoDinh, delayPhut }) {
  if (gioCoDinh && gioCoDinh.trim()) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(gioCoDinh.trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
      throw new Error(`GIO_DANG "${gioCoDinh}" không hợp lệ — dùng dạng HH:MM, vd 19:30.`);
    }
    // Lấy ngày hôm nay theo lịch Việt Nam, rồi đặt giờ phút theo GIO_DANG
    const vn = new Date(nowMs + LECH_VN_MS);
    let dich =
      Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate(), Number(m[1]), Number(m[2])) -
      LECH_VN_MS;
    // Merge muộn (đã qua giờ, hoặc còn dưới 10 phút) thì dời sang cùng giờ hôm sau,
    // để giờ đăng luôn cố định thay vì lệch đi.
    if (dich - nowMs < TOI_THIEU_MS) dich += MOT_NGAY_MS;
    return Math.floor(dich / 1000);
  }

  const phut = Number(delayPhut);
  if (!(phut >= 10)) {
    throw new Error("DELAY_PHUT phải ≥ 10 — Facebook không nhận lịch gần hơn 10 phút.");
  }
  return Math.floor(nowMs / 1000) + phut * 60;
}

export function hienGioVN(unixGiay) {
  return new Date(unixGiay * 1000).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
