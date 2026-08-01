// Cấu hình font dùng chung cho mọi lần render SVG → PNG của bài Kiến thức.
//
// Chỉ nạp Be Vietnam Pro nhúng trong ../fonts/ và tắt hẳn font hệ thống, nên cùng
// một SVG luôn ra cùng một PNG trên mọi máy — Windows, Linux, hay CI. Trước đây
// bước này gọi rsvg-convert với font hệ thống: máy nào thiếu Be Vietnam Pro thì SVG
// âm thầm rơi xuống font dự phòng, ảnh OG ra khác font so với website.
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FONT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "fonts");

export function fontOptions() {
  const fontFiles = readdirSync(FONT_DIR)
    .filter((f) => f.endsWith(".ttf"))
    .map((f) => join(FONT_DIR, f));
  if (fontFiles.length === 0) {
    throw new Error(`Không thấy file .ttf nào trong ${FONT_DIR}`);
  }
  return { fontFiles, loadSystemFonts: false, defaultFontFamily: "Be Vietnam Pro" };
}

export async function loadResvg() {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    return Resvg;
  } catch {
    throw new Error("Thiếu @resvg/resvg-js — chạy `npm install` ở gốc repo.");
  }
}
