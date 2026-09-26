// Tạo ảnh bài đăng Facebook 1080x1080 cho bài Kiến thức.
//
//   node tao-anh-facebook.mjs <slug> "<dòng tiêu đề 1>" "<dòng 2 nhấn màu>"
//
// Ví dụ:
//   node tao-anh-facebook.mjs vac-xin-phong-ung-thu "Hai loại vắc-xin" "giúp phòng ung thư"
//
// Hình minh họa và chip chủ đề tự lấy từ frontmatter của bài (`thumb`, tag đầu tiên),
// nên mỗi bài ra một ảnh khác nhau thay vì cùng một template chỉ đổi chữ.
// Xuất: assets/kien-thuc/<slug>-fb.png — scripts/dang-facebook.mjs đăng đúng file này.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

import { fontOptions, loadResvg } from "./svg-fonts.mjs";

const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error('Dùng: node tao-anh-facebook.mjs <slug> "<dòng tiêu đề 1>" "<dòng 2 nhấn màu>"');
  process.exit(2);
}
const [slug, t1, t2] = args;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..", "..", "..");
const TEMPLATE = resolve(SCRIPT_DIR, "..", "templates", "facebook-template.svg");
const OUT_PNG = join(REPO_ROOT, "assets", "kien-thuc", `${slug}-fb.png`);

const AVAIL = 920; // px ngang cho tiêu đề, từ x=80 tới lề phải

function fit(text, ideal, factor, floor) {
  return Math.max(floor, Math.min(ideal, Math.trunc(AVAIL / (text.length * factor))));
}

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bỏ thẻ <svg> ngoài cùng, giữ phần ruột để lồng vào khung của template. */
function ruotSvg(svg) {
  const mo = svg.indexOf(">", svg.indexOf("<svg"));
  const dong = svg.lastIndexOf("</svg>");
  if (mo < 0 || dong < 0) throw new Error("File thumb không phải SVG hợp lệ.");
  return svg.slice(mo + 1, dong);
}

try {
  const mdPath = join(REPO_ROOT, "kien-thuc", `${slug}.md`);
  if (!existsSync(mdPath)) throw new Error(`Không thấy ${mdPath}`);
  const { data } = matter(readFileSync(mdPath, "utf8"));

  if (!data.thumb) throw new Error(`${slug}.md thiếu thumb — ảnh Facebook dùng hình minh họa đó.`);
  const thumbPath = join(REPO_ROOT, data.thumb.replace(/^\//, ""));
  if (!existsSync(thumbPath)) throw new Error(`Không thấy ${data.thumb}`);
  const chuDe = String((data.tags || [])[0] || "Kiến thức").toUpperCase();

  // Hai dòng dùng chung một cỡ để giữ nhịp thị giác, như ảnh OG
  const titleSize = Math.min(fit(t1, 78, 0.56, 46), fit(t2, 78, 0.56, 46));
  const chipW = Math.round(chuDe.length * 24 * 0.68 + 62);

  let svg = readFileSync(TEMPLATE, "utf8");
  for (const [ph, val] of [
    ["{{TITLE_1}}", escapeXml(t1)],
    ["{{TITLE_2}}", escapeXml(t2)],
    ["{{TITLE_SIZE}}", String(titleSize)],
    ["{{TITLE_2_Y}}", String(Math.round(252 + titleSize * 1.18))],
    ["{{CHU_DE}}", escapeXml(chuDe)],
    ["{{CHIP_W}}", String(chipW)],
    ["{{MINH_HOA}}", ruotSvg(readFileSync(thumbPath, "utf8"))],
  ]) {
    svg = svg.replaceAll(ph, val);
  }

  if (titleSize < 56) {
    console.error(`  ⚠ Tiêu đề phải thu nhỏ còn ${titleSize}px — nên rút ngắn để đọc được trên điện thoại.`);
  }

  const Resvg = await loadResvg();
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: fontOptions() })
    .render()
    .asPng();

  mkdirSync(dirname(OUT_PNG), { recursive: true });
  writeFileSync(OUT_PNG, png);

  const sizeKb = Math.round(png.length / 1024);
  console.log(`✓ ${OUT_PNG} (${sizeKb}KB)`);
  if (sizeKb > 200) console.error("  ⚠ >200KB — nén lại trước khi commit.");
  console.log("  Read file PNG trên để xác nhận (một lần là đủ).");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
