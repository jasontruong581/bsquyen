/* Tìm thư mục của một video từ slug ("hp-va-da-day") hoặc id ("V001") bằng cách đọc các video/*\/post.json.
   Thư mục video có tên dạng "V001 - 2026-11-25 - hp-va-da-day" nên không đoán được từ slug. */
import fs from 'node:fs';
import path from 'node:path';

export const VIDEO_ROOT = path.resolve(import.meta.dirname, '..');

/** Liệt kê mọi video: {dir, slug, id} */
export function listVideos() {
  const out = [];
  for (const e of fs.readdirSync(VIDEO_ROOT, {withFileTypes: true})) {
    if (!e.isDirectory()) continue;
    const file = path.join(VIDEO_ROOT, e.name, 'post.json');
    if (!fs.existsSync(file)) continue;
    const post = JSON.parse(fs.readFileSync(file, 'utf8'));
    out.push({dir: path.join(VIDEO_ROOT, e.name), slug: post.slug, id: post.id ?? ''});
  }
  return out;
}

/** Tìm video theo slug hoặc id (không phân biệt hoa thường); không thấy thì báo lỗi kèm danh sách */
export function findVideo(arg) {
  const videos = listVideos();
  const key = String(arg ?? '').toLowerCase();
  const hit = key && videos.find((v) => v.slug.toLowerCase() === key || v.id.toLowerCase() === key);
  if (!hit) {
    const list = videos.map((v) => `${v.id || '?'} (${v.slug})`).join(', ') || 'chưa có video nào';
    throw new Error(`Không thấy video "${arg ?? ''}". Các video hiện có: ${list}`);
  }
  return hit;
}
