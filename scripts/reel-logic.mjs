// Logic thuần của job đăng Reels: dò video mới, dựng caption, dựng bình luận, ghép Reel với bài.
// Tách khỏi dang-reel.mjs / binh-luan-reel.mjs để test được mà không gọi Facebook hay GitHub.
import { existsSync, readFileSync, readdirSync } from "node:fs";

import { HASHTAG, gonCaption } from "./caption-facebook.mjs";
import { TOI_DA_MS, TOI_DA_NGAY, tinhGioDang } from "./gio-dang.mjs";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export const ID_RE = /^V\d{3,}$/;

const gonKhoangTrang = (s) => String(s).replace(/\s+/g, " ").trim();

/** `khoa` để tra video: slug (hp-va-da-day) hoặc id (V001). */
export const laKhoaVideo = (khoa) => SLUG_RE.test(khoa) || ID_RE.test(khoa);

/**
 * Mỗi video nằm trong thư mục `video/<V001 - YYYY-MM-DD - slug>/` (tên có dấu cách) với post.json
 * bên trong. Slug và id luôn lấy từ NỘI DUNG post.json, không suy từ tên thư mục.
 *
 * Video "mới xuất bản" = video/<thư mục>/post.json được THÊM ở commit cuối. `out` là đầu ra của
 * `git diff -z --name-only --diff-filter=A HEAD^ HEAD` (đường dẫn cách nhau bằng NUL, không bị
 * git bọc nháy/escape). Trả về tên thư mục; dòng không đúng dạng video/<thư mục>/post.json
 * (kể cả thư mục lồng sâu hơn) bị bỏ.
 */
export function thuMucMoiTuDiff(out) {
  return String(out)
    .split(/[\0\n]/)
    .map((l) => /^video\/([^/]+)\/post\.json$/.exec(l.replace(/\r$/, ""))?.[1])
    .filter(Boolean);
}

/** Đọc `<videoDir>/<thuMuc>/post.json`: `{ thuMuc, duongDan, post }`, hoặc `{ ..., loi }` nếu JSON hỏng; null nếu không có file. */
export function docPostVideo(videoDir, thuMuc) {
  const duongDan = `${videoDir}/${thuMuc}/post.json`;
  if (!existsSync(duongDan)) return null;
  try {
    // Bỏ BOM: PowerShell 5.1 (Set-Content -Encoding utf8) ghi kèm BOM, JSON.parse không nhận.
    const text = readFileSync(duongDan, "utf8").replace(/^﻿/, "");
    return { thuMuc, duongDan, post: JSON.parse(text) };
  } catch (e) {
    return { thuMuc, duongDan, loi: `không đọc được JSON: ${e.message}` };
  }
}

/** Quét mọi thư mục con của `videoDir` có post.json. */
export function docThuMucVideo(videoDir = "video") {
  if (!existsSync(videoDir)) return [];
  return readdirSync(videoDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => docPostVideo(videoDir, e.name))
    .filter(Boolean);
}

/**
 * Tra video theo slug hoặc id trong kết quả của docThuMucVideo. Không thấy → undefined;
 * trùng ở nhiều thư mục → ném lỗi (đăng nhầm video tệ hơn không đăng).
 */
export function timVideo(muc, khoa) {
  const k = String(khoa).trim();
  const khop = muc.filter((m) => m.post && (m.post.slug === k || m.post.id === k));
  if (khop.length > 1) throw new Error(`"${k}" trùng ở ${khop.length} thư mục: ${khop.map((m) => m.thuMuc).join(" | ")}`);
  return khop[0];
}

/** `ngay_dang` tùy chọn: bỏ trống (undefined/null) là hợp lệ; còn lại phải là ngày có thật dạng YYYY-MM-DD. Trả về chuỗi lỗi hoặc null. */
export function kiemTraNgayDang(ngayDang) {
  if (ngayDang === undefined || ngayDang === null) return null;
  const m = typeof ngayDang === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngayDang) : null;
  const sai = `ngay_dang "${ngayDang}" sai dạng — dùng YYYY-MM-DD, vd 2026-12-01`;
  if (!m) return sai;
  const [nam, thang, ngay] = m.slice(1).map(Number);
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  const coThat = d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
  return coThat ? null : `ngay_dang "${ngayDang}" không phải ngày có thật`;
}

/**
 * Giờ hẹn của một Reel. Ưu tiên: `lich.gioHen` (input workflow_dispatch) > `ngayDang` (post.json) > quy tắc
 * mặc định của gio-dang.mjs. Trả về `{ gio (unix giây), nguon: "gio_hen" | "ngay_dang" | "mac_dinh", canhBao: [] }`.
 * - ngày sai dạng, hoặc xa hơn giới hạn hẹn giờ của Facebook → ném lỗi;
 * - giờ 19:30 của ngày đó đã qua / còn dưới 10 phút → quay về quy tắc mặc định kèm cảnh báo, không lỗi.
 */
export function tinhGioDangReel(nowMs, lich, ngayDang) {
  const canhBao = [];
  if (lich.gioHen && lich.gioHen.trim()) {
    return { gio: tinhGioDang(nowMs, lich), nguon: "gio_hen", canhBao };
  }
  const macDinh = () => ({ gio: tinhGioDang(nowMs, lich), nguon: "mac_dinh", canhBao });

  const loiNgay = kiemTraNgayDang(ngayDang);
  if (loiNgay) throw new Error(loiNgay);
  if (ngayDang === undefined || ngayDang === null) return macDinh();

  const gioCoDinh = (lich.gioCoDinh || "").trim();
  if (!gioCoDinh) throw new Error(`ngay_dang "${ngayDang}" cần GIO_DANG (HH:MM) để biết hẹn lúc mấy giờ, nhưng GIO_DANG đang trống.`);
  macDinh(); // kiểm GIO_DANG hợp lệ trước, để lỗi của nó không bị nhầm với "giờ đã qua"

  let gio;
  try {
    gio = tinhGioDang(nowMs, { gioHen: `${ngayDang} ${gioCoDinh}` });
  } catch {
    const kq = macDinh();
    kq.canhBao.push(
      `ngay_dang "${ngayDang}" ${gioCoDinh} đã qua hoặc cách hiện tại dưới 10 phút — dùng quy tắc mặc định thay thế.`
    );
    return kq;
  }
  if (gio * 1000 - nowMs > TOI_DA_MS) {
    throw new Error(`ngay_dang "${ngayDang}" xa quá ${TOI_DA_NGAY} ngày kể từ bây giờ — Facebook không nhận giờ hẹn xa vậy. Merge PR muộn hơn hoặc chọn ngày gần hơn.`);
  }
  return { gio, nguon: "ngay_dang", canhBao };
}

/** Trả về danh sách lỗi (rỗng = hợp lệ). */
export function kiemTraPostReel(post) {
  const loi = [];
  if (!post || typeof post !== "object") return ["post.json không phải object"];
  if (typeof post.id !== "string" || !ID_RE.test(post.id)) loi.push(`id thiếu hoặc sai dạng: "${post.id}" (vd V001)`);
  if (typeof post.slug !== "string" || !SLUG_RE.test(post.slug)) loi.push(`slug thiếu hoặc sai dạng: "${post.slug}" (vd hp-va-da-day)`);
  if (typeof post.article !== "string" || !SLUG_RE.test(post.article)) {
    loi.push(`article thiếu hoặc sai dạng: "${post.article}" (slug bài Kiến thức, vd vi-khuan-hp-va-ung-thu-da-day)`);
  }
  if (typeof post.caption !== "string" || !gonCaption(post.caption)) loi.push("caption trống");
  const loiNgay = kiemTraNgayDang(post.ngay_dang);
  if (loiNgay) loi.push(loiNgay);
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
