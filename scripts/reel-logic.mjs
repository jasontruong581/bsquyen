// Logic thuần của job đăng Reels: dò video mới, dựng caption, dựng bình luận, ghép Reel với bài.
// Tách khỏi dang-reel.mjs / binh-luan-reel.mjs để test được mà không gọi Facebook hay GitHub.
import { closeSync, existsSync, fstatSync, openSync, readFileSync, readSync, readdirSync } from "node:fs";

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
  // `article` tùy chọn (video không gắn bài, vd series 3D về cơ thể): bỏ trống hợp lệ, có thì phải đúng dạng slug.
  if (post.article !== undefined && post.article !== null && (typeof post.article !== "string" || !SLUG_RE.test(post.article))) {
    loi.push(`article sai dạng: "${post.article}" (slug bài Kiến thức, vd vi-khuan-hp-va-ung-thu-da-day; bỏ trường này nếu video không gắn bài)`);
  }
  if (typeof post.caption !== "string" || !gonCaption(post.caption)) loi.push("caption trống");
  const loiNgay = kiemTraNgayDang(post.ngay_dang);
  if (loiNgay) loi.push(loiNgay);
  return loi;
}

/** Hashtag cho video không gắn bài Kiến thức (không có `tags` để suy). */
export const HASHTAG_MAC_DINH = "#HieuDungYKhoa";

/**
 * Caption Reel = chữ trong post.json + hashtag suy từ `tags` của bài Kiến thức.
 * Video không có `article` thì không có tags để suy: dùng hashtag mặc định HASHTAG_MAC_DINH.
 * Không có link: link đi vào bình luận đầu tiên (xem taoBinhLuan). Không nêu tên bác sĩ.
 * Tag không có trong bảng hashtag được trả về ở `tagLa` để caller cảnh báo.
 */
export function taoCaptionReel({ caption, article }, tags) {
  const chu = gonCaption(caption || "");
  const tagLa = (tags || []).filter((t) => !HASHTAG[t]);
  const hashtags = article
    ? [...new Set((tags || []).map((t) => HASHTAG[t]).filter(Boolean))]
    : [HASHTAG_MAC_DINH];
  return { chu, hashtags, tagLa, caption: [chu, hashtags.join(" ")].filter(Boolean).join("\n\n") };
}

/**
 * Bình luận đầu tiên của Page, kèm UTM để Umami tách lượt đến từ Reels: link bài nếu video có `article`,
 * không thì link trang Kiến thức chung.
 */
export function taoBinhLuan(article, siteUrl) {
  if (!article) return `Thêm kiến thức dễ hiểu về cơ thể: ${siteUrl}/kien-thuc/?utm_source=facebook&utm_medium=reel`;
  return `Xem bài viết đầy đủ: ${siteUrl}/kien-thuc/${article}/?utm_source=facebook&utm_medium=reel`;
}

// ── Chọn đường đăng theo thời lượng ──────────────────────────────────────────────────────────

/** API Reels (/video_reels) chỉ nhận 3–90 giây; dài hơn thì đăng qua /videos. */
export const REEL_TOI_DA_GIAY = 90;

/** "reel" (≤ 90 s, /video_reels) hay "videos" (> 90 s, /videos). */
export const chonDuongDang = (giay) => (giay > REEL_TOI_DA_GIAY ? "videos" : "reel");

/**
 * Thời lượng (giây) của mp4 từ hộp moov/mvhd — không cần ffprobe.
 * `doc(offset, len)` trả Buffer (có thể ngắn hơn len nếu hết file); `tong` là tổng số byte.
 * Hộp: size(4) + type(4) [+ largesize(8) nếu size=1; size=0 nghĩa là tới hết file]. mvhd: version(1)
 * + flags(3), v0: ngày tạo(4) + ngày sửa(4) + timescale(4) + duration(4); v1: 8+8+4+8.
 */
export function thoiLuongMp4(doc, tong) {
  const timHop = (batDau, ketThuc, loai) => {
    for (let o = batDau; o + 8 <= ketThuc; ) {
      const h = doc(o, 16);
      if (h.length < 8) break;
      let size = h.readUInt32BE(0);
      let dauHop = 8;
      if (size === 1) {
        if (h.length < 16) break;
        size = Number(h.readBigUInt64BE(8));
        dauHop = 16;
      } else if (size === 0) {
        size = ketThuc - o;
      }
      if (size < dauHop || o + size > ketThuc) break; // hộp hỏng hoặc file bị cắt
      if (h.toString("latin1", 4, 8) === loai) return { dau: o + dauHop, cuoi: o + size };
      o += size;
    }
    return null;
  };

  const moov = timHop(0, tong, "moov");
  if (!moov) throw new Error("mp4 không có hộp moov (file hỏng hoặc bị cắt)");
  const mvhd = timHop(moov.dau, moov.cuoi, "mvhd");
  if (!mvhd) throw new Error("mp4 không có hộp mvhd");
  const b = doc(mvhd.dau, mvhd.cuoi - mvhd.dau);
  const v1 = b[0] === 1;
  if (b.length < (v1 ? 32 : 20)) throw new Error("hộp mvhd quá ngắn");
  const timescale = b.readUInt32BE(v1 ? 20 : 12);
  const duration = v1 ? Number(b.readBigUInt64BE(24)) : b.readUInt32BE(16);
  if (!timescale) throw new Error("mvhd có timescale = 0");
  return duration / timescale;
}

/** Thời lượng mp4 đang nằm trong bộ nhớ. */
export const thoiLuongMp4TuBuffer = (buf) => thoiLuongMp4((o, l) => buf.subarray(o, o + l), buf.length);

/** Thời lượng mp4 trên đĩa; chỉ đọc đầu các hộp và moov, không nạp cả file. */
export function thoiLuongMp4TuFile(duongDan) {
  const fd = openSync(duongDan, "r");
  try {
    return thoiLuongMp4((o, l) => {
      const b = Buffer.alloc(l);
      return b.subarray(0, readSync(fd, b, 0, l, o));
    }, fstatSync(fd).size);
  } finally {
    closeSync(fd);
  }
}

/**
 * Tìm bài tương ứng với một Reel đã đăng, dựa vào mô tả của Reel (bắt đầu bằng phần chữ
 * của caption). `posts`: [{ chu, ... }]. Không giữ trạng thái nào giữa lần đăng và lần bình luận.
 */
export function khopReel(moTa, posts) {
  const mo = gonKhoangTrang(moTa || "");
  return posts.find((p) => p.chu && mo.startsWith(gonKhoangTrang(p.chu)));
}
