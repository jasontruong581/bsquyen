// Render một SVG bất kỳ ra PNG để mắt thường kiểm tra (dùng cho ảnh minh hoạ).
//
//   node render-svg.mjs <vào.svg> <ra.png> [bề-rộng-px]
//
// Bỏ bề rộng thì giữ nguyên kích thước gốc của SVG.
// Ảnh OG dùng script riêng: tao-anh-og.mjs
import { readFileSync, writeFileSync } from "node:fs";

import { fontOptions, loadResvg } from "./svg-fonts.mjs";

const [input, output, widthArg] = process.argv.slice(2);
if (!input || !output) {
  console.error("Dùng: node render-svg.mjs <vào.svg> <ra.png> [bề-rộng-px]");
  process.exit(2);
}

const width = widthArg ? Number(widthArg) : null;
if (widthArg && !Number.isFinite(width)) {
  console.error(`Bề rộng không hợp lệ: ${widthArg}`);
  process.exit(2);
}

try {
  const Resvg = await loadResvg();
  const png = new Resvg(readFileSync(input), {
    fitTo: width ? { mode: "width", value: width } : { mode: "original" },
    font: fontOptions(),
  })
    .render()
    .asPng();
  writeFileSync(output, png);
  console.log(`✓ ${output} (${Math.round(png.length / 1024)}KB)`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
