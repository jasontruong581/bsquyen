/* Render một video ra <thư mục video>/out/<slug>.mp4: dựng hình bằng Remotion rồi chuẩn hoá âm lượng bằng ffmpeg.
   Dùng: npm run render -- <slug hoặc id>   (vd hp-va-da-day hoặc V001; cần chạy npm run voice -- <...> trước) */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {findVideo, VIDEO_ROOT} from './tim-video.mjs';

let video;
try {
  video = findVideo(process.argv[2]);
} catch (e) {
  console.error(`${e.message}\nDùng: npm run render -- <slug hoặc id>`);
  process.exit(1);
}
const {slug, dir} = video;
if (!fs.existsSync(path.join(VIDEO_ROOT, 'public', slug, 'timeline.json'))) {
  console.error(`Chưa có giọng đọc: chạy "npm run voice -- ${slug}" trước.`);
  process.exit(1);
}
const outDir = path.join(dir, 'out');
fs.mkdirSync(outDir, {recursive: true});
const raw = path.join(outDir, `${slug}.raw.mp4`);
const final = path.join(outDir, `${slug}.mp4`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {cwd: VIDEO_ROOT, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Gọi thẳng CLI của Remotion bằng node, tránh phải chạy qua shell trên Windows
const remotionCli = path.join(path.dirname(createRequire(import.meta.url).resolve('@remotion/cli/package.json')), 'remotion-cli.js');
run(process.execPath, [remotionCli, 'render', 'src/index.ts', slug, raw]);
run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', final]);
fs.rmSync(raw, {force: true});

// Ảnh cho trang duyệt: khung-hinh.jpg (mỗi 3 giây một khung, lưới 6 cột) và poster.jpg (khung giây 1, rộng 720px)
const total = JSON.parse(fs.readFileSync(path.join(VIDEO_ROOT, 'public', slug, 'timeline.json'), 'utf8')).total;
const rows = Math.ceil(total / 3 / 6);
run('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=1/3,scale=240:-1,tile=6x${rows}`, '-frames:v', '1', '-q:v', '3', path.join(outDir, 'khung-hinh.jpg')]);
run('ffmpeg', ['-v', 'error', '-y', '-ss', '1', '-i', final, '-frames:v', '1', '-vf', 'scale=720:-1', '-q:v', '3', path.join(outDir, 'poster.jpg')]);
console.log(`Xong: ${final}`);
