// Tạo ảnh og:image 1200x630 cho bài Kiến thức từ template, tự canh cỡ chữ.
//
//   node tao-anh-og.mjs <slug> "<dòng tiêu đề 1>" "<dòng 2 nhấn màu>" "<phụ đề>"
//
// Ví dụ:
//   node tao-anh-og.mjs tam-soat-ung-thu-vu "Tầm soát ung thư" "vú" "Ai nên tầm soát và từ tuổi nào?"
//
// Xuất: assets/kien-thuc/<slug>-og.png  (1200x630)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fontOptions, loadResvg } from "./svg-fonts.mjs";

const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error(
    'Dùng: node tao-anh-og.mjs <slug> "<dòng tiêu đề 1>" "<dòng 2 nhấn màu>" "<phụ đề>"'
  );
  process.exit(2);
}
const [slug, t1, t2, sub] = args;

// Chạy được từ bất kỳ đâu — mọi đường dẫn tính từ gốc repo
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..", "..", "..");
const TEMPLATE = resolve(SCRIPT_DIR, "..", "templates", "og-template.svg");
const OUT_DIR = join(REPO_ROOT, "assets", "kien-thuc");
const OUT_PNG = join(OUT_DIR, `${slug}-og.png`);

const AVAIL = 790; // px trống từ x=70 tới mép khối minh hoạ

/** Cỡ chữ lớn nhất (<= ideal) mà dòng vẫn nằm trong AVAIL. */
function fit(text, ideal, factor, floor) {
  if (!text) return ideal;
  return Math.max(floor, Math.min(ideal, Math.trunc(AVAIL / (text.length * factor))));
}

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Hai dòng tiêu đề dùng chung một cỡ để giữ nhịp thị giác
const titleSize = Math.min(fit(t1, 62, 0.58, 34), fit(t2, 62, 0.58, 34));
const subSize = fit(sub, 32, 0.5, 20);

try {
  let svg = readFileSync(TEMPLATE, "utf8");
  for (const [ph, val] of [
    ["{{TITLE_1}}", escapeXml(t1)],
    ["{{TITLE_2}}", escapeXml(t2)],
    ["{{SUBTITLE}}", escapeXml(sub)],
    ["{{TITLE_SIZE}}", String(titleSize)],
    ["{{SUB_SIZE}}", String(subSize)],
  ]) {
    svg = svg.replaceAll(ph, val);
  }

  if (titleSize < 44 || subSize < 24) {
    console.error(
      `  ⚠ Chữ phải thu nhỏ (tiêu đề ${titleSize}px, phụ đề ${subSize}px) ` +
        `— nên rút ngắn để dễ đọc khi share.`
    );
  }

  const Resvg = await loadResvg();
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: fontOptions(),
  })
    .render()
    .asPng();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PNG, png);

  const sizeKb = Math.round(png.length / 1024);
  console.log(`✓ ${OUT_PNG} (${sizeKb}KB)`);
  if (sizeKb > 200) console.error("  ⚠ >200KB — nén lại trước khi commit.");
  console.log(`  Frontmatter:  image: /assets/kien-thuc/${slug}-og.png`);
  console.log("  Read file PNG trên để xác nhận (một lần là đủ).");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
