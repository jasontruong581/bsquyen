// Logic thuần của job đăng Reels: dò video mới, dựng caption, dựng bình luận, ghép Reel với bài.
// Tách khỏi dang-reel.mjs / binh-luan-reel.mjs để test được mà không gọi Facebook hay GitHub.
import { HASHTAG, gonCaption } from "./caption-facebook.mjs";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

const gonKhoangTrang = (s) => String(s).replace(/\s+/g, " ").trim();

/**
 * Video "mới xuất bản" = video/<slug>/post.json được THÊM ở commit cuối.
 * `out` là đầu ra của `git diff --name-only --diff-filter=A HEAD^ HEAD`. Dòng không đúng
 * dạng video/<slug>/post.json (kể cả thư mục lồng sâu hơn) bị bỏ.
 */
export function slugMoiTuDiff(out) {
  return String(out)
    .split("\n")
    .map((l) => /^video\/([a-z0-9][a-z0-9-]*)\/post\.json$/.exec(l.trim())?.[1])
    .filter(Boolean);
}

/** Trả về danh sách lỗi (rỗng = hợp lệ). `slug` là tên thư mục chứa post.json. */
export function kiemTraPostReel(post, slug) {
  const loi = [];
  if (!post || typeof post !== "object") return ["post.json không phải object"];
  if (post.slug !== slug) loi.push(`slug trong post.json ("${post.slug}") không khớp tên thư mục ("${slug}")`);
  if (typeof post.article !== "string" || !SLUG_RE.test(post.article)) {
    loi.push(`article thiếu hoặc sai dạng: "${post.article}" (slug bài Kiến thức, vd vi-khuan-hp-va-ung-thu-da-day)`);
  }
  if (typeof post.caption !== "string" || !gonCaption(post.caption)) loi.push("caption trống");
  return loi;
}

/**
 * Caption Reel = chữ trong post.json + hashtag suy từ `tags` của bài Kiến thức.
 * Không có link: link đi vào bình luận đầu tiên (xem taoBinhLuan). Không nêu tên bác sĩ.
 * Tag không có trong bảng hashtag được trả về ở `tagLa` để caller cảnh báo.
 */
export function taoCaptionReel({ caption }, tags) {
  const chu = gonCaption(caption || "");
  const tagLa = (tags || []).filter((t) => !HASHTAG[t]);
  const hashtags = [...new Set((tags || []).map((t) => HASHTAG[t]).filter(Boolean))];
  return { chu, hashtags, tagLa, caption: [chu, hashtags.join(" ")].filter(Boolean).join("\n\n") };
}

/** Bình luận đầu tiên của Page: link bài, kèm UTM để Umami tách lượt đến từ Reels. */
export function taoBinhLuan(article, siteUrl) {
  return `Xem bài viết đầy đủ: ${siteUrl}/kien-thuc/${article}/?utm_source=facebook&utm_medium=reel`;
}

/**
 * Tìm bài tương ứng với một Reel đã đăng, dựa vào mô tả của Reel (bắt đầu bằng phần chữ
 * của caption). `posts`: [{ chu, ... }]. Không giữ trạng thái nào giữa lần đăng và lần bình luận.
 */
export function khopReel(moTa, posts) {
  const mo = gonKhoangTrang(moTa || "");
  return posts.find((p) => p.chu && mo.startsWith(gonKhoangTrang(p.chu)));
}
