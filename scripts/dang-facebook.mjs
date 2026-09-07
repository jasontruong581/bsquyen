#!/usr/bin/env node
// Đăng bài Kiến thức mới lên Facebook Page dưới dạng bài ảnh đã hẹn giờ.
//
//   node scripts/dang-facebook.mjs                 # dò bài mới thêm ở commit cuối
//   node scripts/dang-facebook.mjs --slug=<slug>   # chỉ định bài
//   node scripts/dang-facebook.mjs --dry-run       # in payload, KHÔNG gọi Facebook
//
// Trong GitHub Actions hai tuỳ chọn trên đọc từ env INPUT_SLUG / INPUT_DRY_RUN, không
// nội suy vào dòng lệnh shell — input của workflow_dispatch là chuỗi người dùng nhập.
//
// Env bắt buộc khi đăng thật: FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN
// Env có mặc định: SITE_URL, FB_API_VERSION, DELAY_PHUT
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import matter from "gray-matter";

const SITE_URL = (process.env.SITE_URL || "https://bsquyen.vercel.app").replace(/\/$/, "");
const API = `https://graph.facebook.com/${process.env.FB_API_VERSION || "v26.0"}`;
const DELAY_PHUT = Number(process.env.DELAY_PHUT || 120);
const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

// Suy hashtag từ `tags`. Bộ tag cố định nằm ở _data/chuDe.js — đổi ở đó thì sửa cả đây.
// Tag không có trong bảng bị bỏ qua kèm cảnh báo, không làm job fail.
const HASHTAG = {
  "Tầm soát": "#TamSoatUngThu",
  "Dấu hiệu": "#DauHieuCanhBao",
  "Chăm sóc giảm nhẹ": "#ChamSocGiamNhe",
  "Điều trị": "#DieuTriUngThu",
  "Dinh dưỡng": "#DinhDuongUngThu",
  "Phòng ngừa": "#PhongNguaUngThu",
};
const HASHTAG_CO_DINH = "#BSCKIHanhQuyen";

const argv = process.argv.slice(2);
const cliSlug = argv.find((a) => a.startsWith("--slug="))?.slice(7);
const slugChiDinh = (cliSlug || process.env.INPUT_SLUG || "").trim();
const dryRun = argv.includes("--dry-run") || process.env.INPUT_DRY_RUN === "true";

const log = (...a) => console.log(...a);
const chet = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

/** Bài "mới xuất bản" = file .md được THÊM ở commit cuối. Sửa bài cũ không tính. */
function doBaiMoi() {
  if (slugChiDinh) return [slugChiDinh];
  let out;
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=A", "HEAD^", "HEAD", "--", "kien-thuc/*.md"],
      { encoding: "utf8" }
    );
  } catch {
    chet("Không đọc được lịch sử git — checkout cần fetch-depth ≥ 2.");
  }
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => p.replace(/^kien-thuc\//, "").replace(/\.md$/, ""));
}

/**
 * Gộp dòng gãy thành đoạn liền. Nguồn hard-wrap ~76 ký tự theo quy ước của repo,
 * để nguyên thì Facebook hiện đúng những chỗ ngắt đó — câu cụt giữa chừng.
 * Dòng trống vẫn là ngắt đoạn thật.
 */
function gonCaption(raw) {
  return String(raw)
    .trim()
    .split(/\n{2,}/)
    .map((doan) => doan.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function docBai(slug) {
  const path = `kien-thuc/${slug}.md`;
  if (!existsSync(path)) chet(`Không thấy ${path}`);
  const { data } = matter(readFileSync(path, "utf8"));

  // Thiếu caption thì fail ồn ào — thà không đăng còn hơn đăng chữ chưa ai duyệt.
  if (!data.facebook || !String(data.facebook).trim()) {
    chet(
      `${path} thiếu field facebook. Bài vẫn lên web bình thường.\n` +
        `  Bổ sung caption rồi chạy lại job bằng tay với slug=${slug}.`
    );
  }
  if (!data.image) chet(`${path} thiếu image — bài đăng dạng ảnh cần ảnh OG.`);

  const hashtags = [
    ...new Set([
      ...(data.tags || []).map((t) => {
        if (!HASHTAG[t]) console.warn(`⚠ Tag "${t}" chưa có hashtag trong bảng — bỏ qua.`);
        return HASHTAG[t];
      }),
      HASHTAG_CO_DINH,
    ]),
  ].filter(Boolean);

  const linkBai = `${SITE_URL}/kien-thuc/${slug}/`;
  return {
    slug,
    title: data.title,
    linkBai,
    linkAnh: `${SITE_URL}${data.image}`,
    // Link và hashtag nối ở đây chứ không gõ trong frontmatter: đổi domain thì chỉ
    // sửa SITE_URL, thay vì sửa 50–100 file bài viết.
    caption: `${gonCaption(data.facebook)}\n\n${linkBai}\n\n${hashtags.join(" ")}`,
  };
}

/** Chờ URL trả 200. Đăng trước khi Vercel deploy xong thì link trong caption chết. */
async function choLive(url, giayToiDa) {
  const han = Date.now() + giayToiDa * 1000;
  let lanCuoi = "chưa gọi được";
  while (Date.now() < han) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (res.ok) return true;
      lanCuoi = `HTTP ${res.status}`;
    } catch (e) {
      lanCuoi = e.message;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  log(`  … ${url} chưa live sau ${giayToiDa}s (${lanCuoi})`);
  return false;
}

async function goiFB(duongDan, params) {
  const res = await fetch(`${API}/${duongDan}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: TOKEN }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) chet(`Facebook API lỗi ở ${duongDan}:\n${JSON.stringify(json, null, 2)}`);
  return json;
}

async function main() {
  const slugs = doBaiMoi();
  if (!slugs.length) {
    log("Không có bài Kiến thức nào mới ở commit này — không đăng gì.");
    return;
  }
  log(`Bài cần đăng: ${slugs.join(", ")}${dryRun ? "  (DRY RUN)" : ""}`);

  if (!dryRun) {
    if (!PAGE_ID || !TOKEN) chet("Thiếu secret FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN.");
    if (DELAY_PHUT < 10) chet("DELAY_PHUT phải ≥ 10 — Facebook không nhận lịch gần hơn 10 phút.");
    // Preflight: token hỏng thì biết ngay, trước khi tải ảnh lên.
    const res = await fetch(`${API}/${PAGE_ID}?fields=name&access_token=${TOKEN}`);
    const page = await res.json().catch(() => ({}));
    if (!res.ok) chet(`Token hoặc Page ID không dùng được:\n${JSON.stringify(page, null, 2)}`);
    log(`Page: ${page.name} (${PAGE_ID})`);
  }

  for (const slug of slugs) {
    const bai = docBai(slug);
    log(`\n─── ${bai.title}`);
    log(`Ảnh:  ${bai.linkAnh}`);
    log(`Caption (${bai.caption.length} ký tự):\n${bai.caption}\n`);

    if (dryRun) {
      // Vẫn thử poll để kiểm tra logic URL, nhưng không fail: chạy tay thì bài
      // thường chưa deploy.
      log("Kiểm tra URL (không bắt buộc trong dry run):");
      log(`  bài  → ${(await choLive(bai.linkBai, 20)) ? "live" : "chưa live"}`);
      log(`  ảnh  → ${(await choLive(bai.linkAnh, 20)) ? "live" : "chưa live"}`);
      log("\nDRY RUN — không gọi Facebook.");
      continue;
    }

    log("Chờ Vercel deploy xong…");
    if (!(await choLive(bai.linkBai, 300))) chet(`${bai.linkBai} không lên sau 5 phút.`);
    if (!(await choLive(bai.linkAnh, 60))) chet(`${bai.linkAnh} không lên sau 1 phút.`);

    // Hai bước: tải ảnh lên ở trạng thái chưa đăng, rồi gắn vào một bài hẹn giờ.
    // Gọi thẳng /photos kèm scheduled_publish_time là đường dễ gãy.
    const anh = await goiFB(`${PAGE_ID}/photos`, { url: bai.linkAnh, published: "false" });
    log(`Đã tải ảnh lên: media_fbid=${anh.id}`);

    const gioDang = Math.floor(Date.now() / 1000) + DELAY_PHUT * 60;
    const post = await goiFB(`${PAGE_ID}/feed`, {
      message: bai.caption,
      "attached_media[0]": JSON.stringify({ media_fbid: anh.id }),
      published: "false",
      scheduled_publish_time: String(gioDang),
    });

    const gioVN = new Date(gioDang * 1000).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    log(
      `✓ Đã hẹn lịch: post ${post.id} — tự đăng lúc ${gioVN}.\n` +
        `  Sửa hoặc huỷ trong Meta Business Suite → Nội dung → Đã lên lịch.`
    );
  }
}

await main();
