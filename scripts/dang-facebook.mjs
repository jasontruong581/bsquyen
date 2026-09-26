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
// Env có mặc định: SITE_URL, FB_API_VERSION, GIO_DANG, DELAY_PHUT
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import matter from "gray-matter";

import { taoCaption } from "./caption-facebook.mjs";
import { hienGioVN, tinhGioDang } from "./gio-dang.mjs";

const SITE_URL = (process.env.SITE_URL || "https://bsquyen.vercel.app").replace(/\/$/, "");
const API = `https://graph.facebook.com/${process.env.FB_API_VERSION || "v26.0"}`;
// GIO_DANG (HH:MM giờ VN) thắng DELAY_PHUT; để trống thì đăng sau DELAY_PHUT phút.
const LICH = { gioCoDinh: process.env.GIO_DANG || "", delayPhut: process.env.DELAY_PHUT || 120 };
const PAGE_ID = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

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
  // Ảnh riêng cho Facebook, không dùng ảnh OG: ảnh OG làm cho website nên có tên bác
  // sĩ, và mọi bài dùng chung một template. Không fallback về ảnh OG — thiếu thì fail.
  const anhFb = `assets/kien-thuc/${slug}-fb.png`;
  if (!existsSync(anhFb)) {
    chet(
      `Thiếu ${anhFb}. Tạo bằng:\n` +
        `  node .claude/skills/bai-kien-thuc/scripts/tao-anh-facebook.mjs ${slug} "<dòng 1>" "<dòng 2>"`
    );
  }

  // Tag không có trong bảng hashtag bị bỏ qua kèm cảnh báo, không làm job fail.
  const { caption, linkBai, tagLa } = taoCaption(data, slug, SITE_URL);
  tagLa.forEach((t) => console.warn(`⚠ Tag "${t}" chưa có hashtag trong bảng — bỏ qua.`));

  return { slug, title: data.title, linkBai, linkAnh: `${SITE_URL}/${anhFb}`, caption };
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

  // Kiểm tra cấu hình lịch ngay đầu, kể cả dry run: GIO_DANG gõ sai thì biết trước
  // khi tải ảnh lên. Giờ thật tính lại sát lúc gọi Facebook, sau khi chờ deploy.
  try {
    log(`Lịch dự kiến: ${hienGioVN(tinhGioDang(Date.now(), LICH))} (giờ VN)`);
  } catch (e) {
    chet(e.message);
  }

  if (!dryRun) {
    if (!PAGE_ID || !TOKEN) chet("Thiếu secret FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN.");
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

    const gioDang = tinhGioDang(Date.now(), LICH);
    const post = await goiFB(`${PAGE_ID}/feed`, {
      message: bai.caption,
      "attached_media[0]": JSON.stringify({ media_fbid: anh.id }),
      published: "false",
      scheduled_publish_time: String(gioDang),
    });

    log(
      `✓ Đã hẹn lịch: post ${post.id} — tự đăng lúc ${hienGioVN(gioDang)}.\n` +
        `  Sửa hoặc huỷ trong Meta Business Suite → Nội dung → Đã lên lịch.`
    );
  }
}

await main();
