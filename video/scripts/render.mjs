/* Render một video ra out/<slug>.mp4: dựng hình bằng Remotion rồi chuẩn hoá âm lượng bằng ffmpeg.
   Dùng: npm run render -- <slug>   (cần chạy npm run voice -- <slug> trước) */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const slug = process.argv[2];
if (!slug) {
  console.error('Dùng: npm run render -- <slug>');
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '..');
if (!fs.existsSync(path.join(root, 'public', slug, 'timeline.json'))) {
  console.error(`Chưa có giọng đọc: chạy "npm run voice -- ${slug}" trước.`);
  process.exit(1);
}
fs.mkdirSync(path.join(root, 'out'), {recursive: true});
const raw = path.join('out', `${slug}.raw.mp4`);
const final = path.join('out', `${slug}.mp4`);

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {cwd: root, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// Gọi thẳng CLI của Remotion bằng node, tránh phải chạy qua shell trên Windows
const remotionCli = path.join(path.dirname(createRequire(import.meta.url).resolve('@remotion/cli/package.json')), 'remotion-cli.js');
run(process.execPath, [remotionCli, 'render', 'src/index.ts', slug, raw]);
run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', final]);
fs.rmSync(path.join(root, raw), {force: true});
console.log(`Xong: ${path.join(root, final)}`);
