#!/usr/bin/env node
// Đăng video Kiến thức lên Facebook Page dưới dạng Reel hẹn giờ.
//
//   node scripts/dang-reel.mjs                 # dò video mới thêm ở commit cuối
//   node scripts/dang-reel.mjs --slug=<slug|V001>   # chỉ định video theo slug hoặc id trong post.json
//   node scripts/dang-reel.mjs --dry-run       # in caption, giờ hẹn, bình luận; KHÔNG tải video, KHÔNG gọi Facebook
//
// Trong GitHub Actions các tuỳ chọn đọc từ env INPUT_SLUG / INPUT_GIO_HEN / INPUT_DRY_RUN,
// không nội suy vào dòng lệnh shell — input của workflow_dispatch là chuỗi người dùng nhập.
//
// Env bắt buộc khi đăng thật: FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, GH_TOKEN (tải mp4 từ Release)
// Env có mặc định: SITE_URL, FB_API_VERSION, GIO_DANG, DELAY_PHUT
//
// Video nằm ở video/<V001 - YYYY-MM-DD - slug>/post.json; slug lấy từ nội dung post.json, không từ tên thư mục.
// mp4 không nằm trong git: `node scripts/tai-video-len-release.mjs <slug|V001>` đẩy nó lên GitHub
// Release `video-<slug>` (asset `<slug>.mp4`), script này tải về bằng `gh` rồi tải lên Facebook.
// Link bài không đặt trong caption mà trong bình luận đầu tiên: Facebook không cho bình luận
// lên Reel đang hẹn giờ nên việc đó do binh-luan-reel.mjs làm sau giờ đăng.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import matter from "gray-matter";

import { SITE_URL } from "./caption-facebook.mjs";
import { hienGioVN } from "./gio-dang.mjs";
import {
  docPostVideo,
  docThuMucVideo,
  kiemTraPostReel,
  laKhoaVideo,
  taoBinhLuan,
  taoCaptionReel,
  thuMucMoiTuDiff,
  timVideo,
  tinhGioDangReel,
} from "./reel-logic.mjs";

const VER = process.env.FB_API_VERSION || "v26.0";
const API = `https://graph.facebook.com/${VER}`;
const NGUON_LICH = {
  gio_hen: "gio_hen (input workflow)",
  ngay_dang: "ngay_dang (post.json)",
  mac_dinh: "mặc định (GIO_DANG / DELAY_PHUT)",
};
// Thứ tự ưu tiên: INPUT_GIO_HEN > ngay_dang trong post.json > GIO_DANG > DELAY_PHUT.
const LICH = {
  gioHen: process.env.INPUT_GIO_HEN || "",
  gioCoDinh: process.env.GIO_DANG || "",
  delayPhut: process.env.DELAY_PHUT || 120,
};
const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

const argv = process.argv.slice(2);
const khoaChiDinh = (argv.find((a) => a.startsWith("--slug="))?.slice(7) || process.env.INPUT_SLUG || "").trim();
const dryRun = argv.includes("--dry-run") || process.env.INPUT_DRY_RUN === "true";

const log = (...a) => console.log(...a);
const chet = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/** Trả về [{ thuMuc, duongDan, post | loi }] — video chỉ định (slug hoặc id) hoặc video mới thêm ở commit cuối. */
function doVideoMoi() {
  if (khoaChiDinh) {
    if (!laKhoaVideo(khoaChiDinh)) chet(`slug/id không hợp lệ: "${khoaChiDinh}" (vd hp-va-da-day hoặc V001)`);
    let muc;
    try {
      muc = timVideo(docThuMucVideo("video"), khoaChiDinh);
    } catch (e) {
      chet(e.message);
    }
    if (!muc) chet(`Không thấy video "${khoaChiDinh}" trong video/*/post.json (khớp theo slug hoặc id trong post.json).`);
    return [muc];
  }
  let out;
  try {
    // -z: đường dẫn cách nhau bằng NUL, git không bọc nháy/escape tên thư mục có dấu cách hay tiếng Việt.
    out = execFileSync("git", ["diff", "-z", "--name-only", "--diff-filter=A", "HEAD^", "HEAD", "--", "video/*/post.json"], {
      encoding: "utf8",
    });
  } catch {
    chet("Không đọc được lịch sử git — checkout cần fetch-depth ≥ 2.");
  }
  return thuMucMoiTuDiff(out).map((thuMuc) => docPostVideo("video", thuMuc));
}

function docVideo({ duongDan, post, loi: loiDoc }) {
  if (loiDoc) chet(`${duongDan}: ${loiDoc}`);
  const loi = kiemTraPostReel(post);
  if (loi.length) chet(`${duongDan} chưa đạt:\n  - ${loi.join("\n  - ")}`);
  const slug = post.slug;

  const baiMd = `kien-thuc/${post.article}.md`;
  if (!existsSync(baiMd)) chet(`${duongDan} trỏ tới bài "${post.article}" nhưng không thấy ${baiMd}`);
  const { data } = matter(readFileSync(baiMd, "utf8"));

  const { caption, tagLa } = taoCaptionReel(post, data.tags);
  tagLa.forEach((t) => console.warn(`⚠ Tag "${t}" chưa có hashtag trong bảng — bỏ qua.`));
  return { slug, caption, binhLuan: taoBinhLuan(post.article, SITE_URL) };
}

/** Tải mp4 từ GitHub Release `video-<slug>` về thư mục tạm, trả về đường dẫn file. */
function taiMp4(slug) {
  const dir = mkdtempSync(join(tmpdir(), "reel-"));
  log(`Tải ${slug}.mp4 từ GitHub Release video-${slug}…`);
  try {
    execFileSync("gh", ["release", "download", `video-${slug}`, "--pattern", `${slug}.mp4`, "--dir", dir, "--clobber"], {
      stdio: "inherit",
    });
  } catch {
    chet(`Không tải được release video-${slug}. Chạy \`node scripts/tai-video-len-release.mjs ${slug}\` để đẩy video lên trước.`);
  }
  const file = join(dir, `${slug}.mp4`);
  if (!existsSync(file) || statSync(file).size === 0) chet(`Release video-${slug} không có file ${slug}.mp4 (hoặc file rỗng).`);
  return file;
}

async function doiJson(res) {
  const text = await res.text().catch(() => "");
  try {
    return JSON.parse(text);
  } catch {
    return text ? { phan_hoi_khong_phai_json: text.slice(0, 500) } : {};
  }
}

/** Lỗi ở bước đăng có thể đã tạo bài rồi nên không tự thử lại. */
async function goiFB(url, init, mota) {
  const res = await fetch(url, init);
  const json = await doiJson(res);
  if (!res.ok || json.error) chet(`Facebook API lỗi ở ${mota} (HTTP ${res.status}):\n${JSON.stringify(json, null, 2)}`);
  return json;
}

const form = (params) => new URLSearchParams({ ...params, access_token: TOKEN });

async function choTrangThai(videoId, xong, mota, giayToiDa) {
  const han = Date.now() + giayToiDa * 1000;
  let cuoi = {};
  while (Date.now() < han) {
    const res = await fetch(`${API}/${videoId}?fields=status&access_token=${TOKEN}`);
    cuoi = (await doiJson(res)).status || {};
    const kq = xong(cuoi);
    if (kq === true) return cuoi;
    if (typeof kq === "string") chet(`${mota}: ${kq}\n${JSON.stringify(cuoi, null, 2)}`);
    await ngu(5000);
  }
  log(`  … ${mota}: chưa xác nhận sau ${giayToiDa}s (${JSON.stringify(cuoi)})`);
  return null;
}

/** Ghi log các bài đang hẹn giờ trên page: chạy lại sau lỗi thì biết Reel đã lên lịch chưa, khỏi đăng trùng. */
async function lietKeBaiHenGio() {
  try {
    const res = await fetch(`${API}/${PAGE_ID}/scheduled_posts?fields=message,scheduled_publish_time&limit=25&access_token=${TOKEN}`);
    const kq = await doiJson(res);
    if (!res.ok || !Array.isArray(kq.data)) {
      log(`(Không đọc được danh sách bài hẹn giờ: HTTP ${res.status})`);
      return;
    }
    log(`Bài đang hẹn giờ trên page: ${kq.data.length}`);
    for (const p of kq.data) {
      const gio = typeof p.scheduled_publish_time === "number" ? hienGioVN(p.scheduled_publish_time) : String(p.scheduled_publish_time);
      log(`  · ${gio} — ${(p.message || "").replace(/\s+/g, " ").slice(0, 70)}`);
    }
  } catch (e) {
    log(`(Không đọc được danh sách bài hẹn giờ: ${e.message})`);
  }
}

async function dangReel(file, caption, gio) {
  const bat = await goiFB(`${API}/${PAGE_ID}/video_reels`, { method: "POST", body: form({ upload_phase: "start" }) }, "video_reels (start)");
  log(`Đã mở phiên Reel: video_id=${bat.video_id}`);

  const buf = readFileSync(file);
  const up = await goiFB(
    bat.upload_url || `https://rupload.facebook.com/video-upload/${VER}/${bat.video_id}`,
    { method: "POST", headers: { Authorization: `OAuth ${TOKEN}`, offset: "0", file_size: String(buf.length) }, body: buf },
    "rupload (tải file)"
  );
  if (up.success === false) chet(`rupload báo không thành công:\n${JSON.stringify(up)}`);
  log(`Đã tải ${(buf.length / 1e6).toFixed(1)} MB lên Facebook`);

  await choTrangThai(
    bat.video_id,
    (s) => {
      const v = s.video_status;
      if (v === "upload_failed" || v === "error") return `video_status=${v}`;
      return s.uploading_phase?.status === "complete" || ["upload_complete", "processing", "ready"].includes(v);
    },
    "Chờ tải lên xong",
    600
  );

  await goiFB(
    `${API}/${PAGE_ID}/video_reels`,
    {
      method: "POST",
      body: form({
        video_id: bat.video_id,
        upload_phase: "finish",
        video_state: "SCHEDULED",
        scheduled_publish_time: String(gio),
        description: caption,
      }),
    },
    "video_reels (finish)"
  );

  const tt = await choTrangThai(
    bat.video_id,
    (s) => (s.publishing_phase?.publish_status === "error" ? "publish_status=error" : s.publishing_phase?.publish_status === "scheduled"),
    "Chờ xác nhận hẹn giờ",
    180
  );
  return { id: bat.video_id, xacNhan: Boolean(tt) };
}

async function main() {
  const muc = doVideoMoi();
  if (!muc.length) {
    log("Không có video nào mới ở commit này — không đăng gì.");
    return;
  }
  log(`Video cần đăng: ${muc.map((m) => m.thuMuc).join(", ")}${dryRun ? "  (DRY RUN)" : ""}`);

  // Kiểm tra lịch của mọi video ngay đầu, kể cả dry run: GIO_DANG / gio_hen / ngay_dang sai thì biết trước khi đăng gì.
  for (const m of muc) {
    if (!m.post) continue; // JSON hỏng: docVideo báo lỗi ở vòng dưới
    try {
      const l = tinhGioDangReel(Date.now(), LICH, m.post.ngay_dang);
      log(`Lịch dự kiến ${m.thuMuc}: ${hienGioVN(l.gio)} (giờ VN)`);
    } catch (e) {
      chet(`${m.thuMuc}: ${e.message}`);
    }
  }

  if (!dryRun) {
    if (!PAGE_ID || !TOKEN) chet("Thiếu secret FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN.");
    // Preflight: token hỏng thì biết ngay, trước khi tải file nặng.
    const res = await fetch(`${API}/${PAGE_ID}?fields=name&access_token=${TOKEN}`);
    const page = await doiJson(res);
    if (!res.ok) chet(`Token hoặc Page ID không dùng được:\n${JSON.stringify(page, null, 2)}`);
    log(`Page: ${page.name} (${PAGE_ID})`);
    await lietKeBaiHenGio();
  }

  for (const m of muc) {
    const video = docVideo(m);
    const slug = video.slug;
    log(`\n─── ${slug} (${m.thuMuc})`);
    log(`Caption (${video.caption.length} ký tự):\n${video.caption}\n`);
    log(`Bình luận đầu tiên (đăng sau giờ đăng bởi binh-luan-reel):\n${video.binhLuan}\n`);

    // Giờ tính sát lúc gọi Facebook: gio_hen đã qua thì dừng ngay, chưa tải file nặng.
    let lich;
    try {
      lich = tinhGioDangReel(Date.now(), LICH, m.post.ngay_dang);
    } catch (e) {
      chet(`${slug}: ${e.message}`);
    }
    const gio = lich.gio;
    lich.canhBao.forEach((c) => console.warn(`⚠ ${slug}: ${c}`));
    log(`Lịch đăng: ${hienGioVN(gio)} (giờ VN) — nguồn: ${NGUON_LICH[lich.nguon]}`);

    if (dryRun) {
      log("DRY RUN — không tải video, không gọi Facebook.");
      continue;
    }

    const file = taiMp4(slug);
    const kq = await dangReel(file, video.caption, gio);
    log(
      `✓ ${kq.xacNhan ? "Đã hẹn lịch" : "Đã gửi (chưa xác nhận lịch — kiểm tra Business Suite)"}: Reel ${kq.id} — tự đăng lúc ${hienGioVN(gio)}.\n` +
        `  Sửa hoặc huỷ trong Meta Business Suite → Nội dung → Đã lên lịch.`
    );
  }
}

await main();
