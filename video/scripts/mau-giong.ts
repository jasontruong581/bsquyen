/* Tạo file nghe thử: câu đầu tiên của cảnh s1 đọc bằng từng giọng, lưu ở <thư mục video>/out/mau-giong/<tên giọng>.wav.
   Dùng: npm run sample -- <slug hoặc id> "Ngọc Linh" "Hải Đăng" ...   (xem danh sách giọng: python scripts/vieneu_tts.py --list) */
import fs from 'node:fs';
import path from 'node:path';
import {runVieneu} from './vieneu-job';
import {findVideo} from './tim-video.mjs';
import {buildPhatAm} from './phat-am.mjs';

const [arg, ...voices] = process.argv.slice(2);
if (!arg || !voices.length) throw new Error('Dùng: npm run sample -- <slug hoặc id> "<giọng 1>" "<giọng 2>" ...');
const video = findVideo(arg);
const spec = JSON.parse(fs.readFileSync(path.join(video.dir, 'script.json'), 'utf8'));
const first: string = spec.scenes[0].text.split(/(?<=[.!?…])\s+/)[0];
const text = buildPhatAm(first, spec.phat_am).ttsText;
const outDir = path.join(video.dir, 'out', 'mau-giong');
fs.mkdirSync(outDir, {recursive: true});

for (const voice of voices) {
  const wav = path.join(outDir, `${voice}.wav`);
  runVieneu(voice, [{id: 'mau', narration: text, out_wav: wav, out_json: wav.replace(/\.wav$/, '.json')}]);
  fs.rmSync(wav.replace(/\.wav$/, '.json'), {force: true});
  console.log(`-> ${wav}`);
}
