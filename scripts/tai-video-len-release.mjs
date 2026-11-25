#!/usr/bin/env node
// Tải video đã render lên GitHub Release để job đăng Reels lấy về.
//
//   node scripts/tai-video-len-release.mjs <slug|V001>
//
// Cần: video/<V001 - YYYY-MM-DD - slug>/out/<slug>.mp4 (đã render), post.json cùng thư mục,
// `gh` đã đăng nhập. Tra thư mục theo slug hoặc id trong post.json (không theo tên thư mục).
// Tạo (hoặc cập nhật) Release `video-<slug>` với asset `<slug>.mp4`. Chạy ở máy local,
// TRƯỚC khi merge PR video: merge là lúc job đăng, nó cần mp4 đã có trên Release.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { docThuMucVideo, kiemTraPostReel, laKhoaVideo, timVideo } from "./reel-logic.mjs";

const goc = dirname(dirname(fileURLToPath(import.meta.url)));

const chet = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
const gh = (args, nuot = false) =>
  spawnSync("gh", args, { cwd: goc, encoding: "utf8", stdio: nuot ? "pipe" : ["ignore", "inherit", "inherit"] });

const khoa = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!khoa || !laKhoaVideo(khoa)) chet("Cách dùng: node scripts/tai-video-len-release.mjs <slug|V001>");

let muc;
try {
  muc = timVideo(docThuMucVideo(join(goc, "video")), khoa);
} catch (e) {
  chet(e.message);
}
if (!muc) chet(`Không thấy video "${khoa}" trong video/*/post.json (khớp theo slug hoặc id trong post.json) — Release không có post.json thì job đăng cũng không chạy.`);
if (muc.loi) chet(`${muc.thuMuc}/post.json: ${muc.loi}`);
const loiPost = kiemTraPostReel(muc.post);
if (loiPost.length) chet(`video/${muc.thuMuc}/post.json chưa đạt:\n  - ${loiPost.join("\n  - ")}`);

const slug = muc.post.slug;
const mp4 = join(goc, "video", muc.thuMuc, "out", `${slug}.mp4`);
if (!existsSync(mp4)) chet(`Thiếu video/${muc.thuMuc}/out/${slug}.mp4 — chạy render trước.`);

const tag = `video-${slug}`;
const probe = gh(["--version"], true);
if (probe.error) chet("Không chạy được `gh` — cài GitHub CLI và đăng nhập (`gh auth login`).");

const coRelease = gh(["release", "view", tag], true).status === 0;
console.log(coRelease ? `Cập nhật release ${tag}…` : `Tạo release ${tag}…`);
const kq = coRelease
  ? gh(["release", "upload", tag, mp4, "--clobber"])
  : gh(["release", "create", tag, mp4, "--title", `Video ${slug}`, "--notes", "Bản render dùng để đăng Reels lên Facebook."]);
if (kq.status !== 0) chet("Không đẩy được release (gh đã đăng nhập chưa, có quyền ghi repo chưa?).");

console.log(`\n✓ Đã đẩy ${slug}.mp4 lên release ${tag}. Giờ có thể mở PR video; merge PR là job đăng Reel tự chạy.`);
