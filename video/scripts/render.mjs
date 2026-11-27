/* Render một video ra <thư mục video>/out/<slug>.mp4: dựng hình bằng Remotion rồi chuẩn hoá âm lượng bằng ffmpeg.
   Dùng: npm run render -- <slug hoặc id>   (vd hp-va-da-day hoặc V001; cần chạy npm run voice -- <...> trước)
   Video có nhiều bản cùng kịch bản (V005): npm run render -- V005 --ban 3d  →  out/phoi-3d.mp4 (composition "phoi-3d", dùng WebGL --gl=angle)
                                            npm run render -- V005 --ban 2d  →  out/phoi-2d.mp4 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {findVideo, VIDEO_ROOT} from './tim-video.mjs';

const args = process.argv.slice(2);
const banAt = args.indexOf('--ban');
const ban = banAt >= 0 ? args[banAt + 1] : null;
if (banAt >= 0) args.splice(banAt, 2);

let video;
try {
  video = findVideo(args[0]);
} catch (e) {
  console.error(`${e.message}\nDùng: npm run render -- <slug hoặc id> [--ban 3d|2d]`);
  process.exit(1);
}
const {slug, dir} = video;
if (!fs.existsSync(path.join(VIDEO_ROOT, 'public', slug, 'timeline.json'))) {
  console.error(`Chưa có giọng đọc: chạy "npm run voice -- ${slug}" trước.`);
  process.exit(1);
}
// Bản riêng: id composition = <từ đầu của slug>-<bản> (V005: phoi-3d, phoi-2d); tên file và ảnh thêm hậu tố bản
const compId = ban ? `${slug.split('-')[0]}-${ban}` : slug;
const suffix = ban ? `-${ban}` : '';
const outDir = path.join(dir, 'out');
fs.mkdirSync(outDir, {recursive: true});
const raw = path.join(outDir, `${compId}.raw.mp4`);
const final = path.join(outDir, `${compId}.mp4`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {cwd: VIDEO_ROOT, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Gọi thẳng CLI của Remotion bằng node, tránh phải chạy qua shell trên Windows
const remotionCli = path.join(path.dirname(createRequire(import.meta.url).resolve('@remotion/cli/package.json')), 'remotion-cli.js');
const t0 = Date.now();
run(process.execPath, [remotionCli, 'render', 'src/index.ts', compId, raw, ...(ban === '3d' ? ['--gl=angle'] : [])]);
console.log(`Dựng hình ${compId}: ${((Date.now() - t0) / 60000).toFixed(1)} phút`);
run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', final]);
fs.rmSync(raw, {force: true});

// Ảnh cho trang duyệt: khung-hinh.jpg (mỗi 3 giây một khung, lưới 6 cột) và poster.jpg (khung giây 1, rộng 720px)
const total = JSON.parse(fs.readFileSync(path.join(VIDEO_ROOT, 'public', slug, 'timeline.json'), 'utf8')).total;
const rows = Math.ceil(total / 3 / 6);
run('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=1/3,scale=240:-1,tile=6x${rows}`, '-frames:v', '1', '-q:v', '3', path.join(outDir, `khung-hinh${suffix}.jpg`)]);
run('ffmpeg', ['-v', 'error', '-y', '-ss', '1', '-i', final, '-frames:v', '1', '-vf', 'scale=720:-1', '-q:v', '3', path.join(outDir, `poster${suffix}.jpg`)]);
console.log(`Xong: ${final}`);
