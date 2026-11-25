#!/usr/bin/env node
// Đăng bình luận đầu tiên (link bài Kiến thức) từ chính Page lên các Reel đã công khai mà Page chưa bình luận.
//
//   node scripts/binh-luan-reel.mjs --dry-run              # chỉ liệt kê Reel sẽ bình luận và nội dung
//   node scripts/binh-luan-reel.mjs [--ngay=60]            # đăng; chỉ xét Reel tải lên trong 60 ngày
//
// Vì sao tách khỏi job đăng: Facebook không cho bình luận lên Reel đang hẹn giờ, nên bình luận
// chỉ làm được sau giờ đăng. Script không giữ trạng thái:
//   - Reel được ghép với video/<slug>/post.json bằng phần chữ của caption (mô tả Reel bắt đầu bằng nó);
//     Reel không khớp video nào (Reel cũ, bài đăng khác) thì bỏ qua.
//   - Một Reel coi là xong khi đã có bình luận cấp 1 do chính Page đăng, nên chạy lại không bình luận lặp.
// Env: FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, FB_API_VERSION, SITE_URL, INPUT_DRY_RUN, INPUT_NGAY.
// Cần quyền pages_manage_engagement (xem docs/tu-dong-dang-facebook.md, mục Đăng Reels).
import { existsSync, readFileSync, readdirSync } from "node:fs";

import { SITE_URL, gonCaption } from "./caption-facebook.mjs";
import { SLUG_RE, khopReel, kiemTraPostReel, taoBinhLuan } from "./reel-logic.mjs";

const API = `https://graph.facebook.com/${process.env.FB_API_VERSION || "v26.0"}`;
const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run") || process.env.INPUT_DRY_RUN === "true";
// Tính theo ngày TẢI LÊN: Reel hẹn giờ giữ created_time lúc tải, nên cửa sổ phải rộng hơn thời gian hẹn tối đa.
const ngay = Number(argv.find((a) => a.startsWith("--ngay="))?.slice(7) || process.env.INPUT_NGAY || 60);

if (!PAGE_ID || !TOKEN) {
  console.error("✖ Thiếu FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN");
  process.exit(1);
}
if (!(ngay > 0)) {
  console.error(`✖ --ngay phải là số dương, nhận "${ngay}"`);
  process.exit(1);
}

/** Gom mọi video/<slug>/post.json hợp lệ; file hỏng chỉ cảnh báo, không chặn các video khác. */
function docMoiPost() {
  if (!existsSync("video")) return [];
  const posts = [];
  for (const ent of readdirSync("video", { withFileTypes: true })) {
    if (!ent.isDirectory() || !SLUG_RE.test(ent.name)) continue;
    const duongDan = `video/${ent.name}/post.json`;
    if (!existsSync(duongDan)) continue;
    try {
      const post = JSON.parse(readFileSync(duongDan, "utf8"));
      const loi = kiemTraPostReel(post, ent.name);
      if (loi.length) throw new Error(loi.join("; "));
      posts.push({ slug: ent.name, chu: gonCaption(post.caption), binhLuan: taoBinhLuan(post.article, SITE_URL) });
    } catch (e) {
      console.warn(`⚠ Bỏ qua ${duongDan}: ${e.message}`);
    }
  }
  return posts;
}

async function goi(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { phan_hoi_khong_phai_json: text.slice(0, 300) };
  }
  return { ok: res.ok && !json.error, status: res.status, json };
}

const posts = docMoiPost();
console.log(`Video có post.json: ${posts.length}`);

const ds = await goi(`${API}/${PAGE_ID}/video_reels?fields=id,created_time,published,description&limit=25&access_token=${TOKEN}`);
if (!ds.ok) {
  console.error(`✖ Không đọc được danh sách Reel (HTTP ${ds.status}): ${JSON.stringify(ds.json)}`);
  process.exit(1);
}
const tu = Date.now() - ngay * 864e5;
const xet = ds.json.data.filter((r) => r.published !== false && Date.parse(r.created_time) >= tu);
console.log(`Reel đã công khai trong ${ngay} ngày: ${xet.length}${dryRun ? "  (DRY RUN)" : ""}`);

let loi = 0;
for (const r of xet) {
  const video = khopReel(r.description, posts);
  const ten = (r.description || "").replace(/\s+/g, " ").slice(0, 50);
  if (!video) {
    console.log(`  · ${r.id} không khớp video nào trong video/ — bỏ qua — ${ten}`);
    continue;
  }
  const bl = await goi(`${API}/${r.id}/comments?fields=from{id},message&filter=toplevel&limit=100&access_token=${TOKEN}`);
  if (!bl.ok) {
    console.log(`  ✖ ${r.id} không đọc được bình luận (HTTP ${bl.status}): ${JSON.stringify(bl.json).slice(0, 200)}`);
    loi++;
    continue;
  }
  if (bl.json.data.some((c) => c.from?.id === PAGE_ID)) {
    console.log(`  · ${r.id} (${video.slug}) đã có bình luận của Page`);
    continue;
  }
  if (dryRun) {
    console.log(`  → ${r.id} (${video.slug}) SẼ bình luận: ${video.binhLuan}`);
    continue;
  }
  const kq = await goi(`${API}/${r.id}/comments`, { method: "POST", body: new URLSearchParams({ message: video.binhLuan, access_token: TOKEN }) });
  if (kq.ok) {
    console.log(`  ✓ ${r.id} (${video.slug}) đã bình luận (${kq.json.id})`);
  } else {
    loi++;
    const thieuQuyen = [10, 200, 283].includes(kq.json.error?.code);
    console.log(`  ✖ ${r.id} lỗi HTTP ${kq.status}: ${JSON.stringify(kq.json.error ?? kq.json).slice(0, 300)}`);
    if (thieuQuyen) console.log("    Token thiếu quyền pages_manage_engagement — xem docs/tu-dong-dang-facebook.md, mục Đăng Reels.");
  }
}
process.exit(loi ? 1 : 0);
