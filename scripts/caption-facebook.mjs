// Dựng caption bài đăng Facebook từ frontmatter bài viết.
//
// Dùng chung cho job đăng (dang-facebook.mjs) và bot tóm tắt duyệt PR (tom-tat-duyet.mjs),
// để thứ bác sĩ duyệt trên PR đúng từng chữ với thứ sẽ lên page.

// Domain đặt ở đúng một chỗ này (workflow ghi đè bằng env SITE_URL). Hai script mà mỗi
// bên giữ một giá trị mặc định thì đổi domain sót một bên là caption trên PR lệch với
// caption được đăng.
export const SITE_URL = (process.env.SITE_URL || "https://bsquyen.vercel.app").replace(/\/$/, "");

// Suy hashtag từ `tags`. Bộ tag cố định nằm ở _data/chuDe.js — đổi ở đó thì sửa cả đây.
// Không có hashtag cố định mang tên bác sĩ: page có thương hiệu riêng, bài đăng không nêu
// tên bác sĩ (cả caption lẫn ảnh).
export const HASHTAG = {
  "Tầm soát": "#TamSoatUngThu",
  "Dấu hiệu": "#DauHieuCanhBao",
  "Chăm sóc giảm nhẹ": "#ChamSocGiamNhe",
  "Điều trị": "#DieuTriUngThu",
  "Dinh dưỡng": "#DinhDuongUngThu",
  "Phòng ngừa": "#PhongNguaUngThu",
};

/**
 * Gộp dòng gãy thành đoạn liền. Nguồn hard-wrap ~76 ký tự theo quy ước của repo,
 * để nguyên thì Facebook hiện đúng những chỗ ngắt đó — câu cụt giữa chừng.
 * Dòng trống vẫn là ngắt đoạn thật.
 */
export function gonCaption(raw) {
  return String(raw)
    .trim()
    .split(/\n{2,}/)
    .map((doan) => doan.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Caption hoàn chỉnh: phần chữ trong frontmatter + link bài + hashtag.
 * Link và hashtag nối ở đây chứ không gõ trong frontmatter: đổi domain thì chỉ sửa
 * SITE_URL, thay vì sửa 50–100 file bài viết.
 * utm_source để Umami tách lượt đến từ page: trình duyệt trong app Facebook không phải lúc
 * nào cũng gửi referrer, thiếu UTM thì những lượt đó bị tính là "trực tiếp".
 */
export function taoCaption({ facebook, tags }, slug, siteUrl) {
  const tagLa = (tags || []).filter((t) => !HASHTAG[t]);
  const hashtags = [...new Set((tags || []).map((t) => HASHTAG[t]).filter(Boolean))];
  const linkBai = `${siteUrl}/kien-thuc/${slug}/`;
  const chu = gonCaption(facebook || "");
  return {
    chu,
    linkBai,
    hashtags,
    tagLa,
    caption: `${chu}\n\n${linkBai}?utm_source=facebook\n\n${hashtags.join(" ")}`,
  };
}
