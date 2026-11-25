#!/usr/bin/env node
// Tải video đã render lên GitHub Release để job đăng Reels lấy về.
//
//   node scripts/tai-video-len-release.mjs <slug>
//
// Cần: video/out/<slug>.mp4 (đã render), video/<slug>/post.json, `gh` đã đăng nhập.
// Tạo (hoặc cập nhật) Release `video-<slug>` với asset `<slug>.mp4`. Chạy ở máy local,
// TRƯỚC khi merge PR video: merge là lúc job đăng, nó cần mp4 đã có trên Release.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const goc = dirname(dirname(fileURLToPath(import.meta.url)));

const chet = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};
const gh = (args, nuot = false) =>
  spawnSync("gh", args, { cwd: goc, encoding: "utf8", stdio: nuot ? "pipe" : ["ignore", "inherit", "inherit"] });

const slug = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!slug || !SLUG_RE.test(slug)) chet("Cách dùng: node scripts/tai-video-len-release.mjs <slug>");

const mp4 = join(goc, "video", "out", `${slug}.mp4`);
const post = join(goc, "video", slug, "post.json");
if (!existsSync(post)) chet(`Thiếu video/${slug}/post.json (slug, article, caption) — Release không có post.json thì job đăng cũng không chạy.`);
if (!existsSync(mp4)) chet(`Thiếu video/out/${slug}.mp4 — chạy render trước (trong video/: npm run render -- ${slug}).`);

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
