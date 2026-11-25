/* Tạo file nghe thử: câu đầu tiên của cảnh s1 đọc bằng từng giọng, lưu ở out/mau-giong/<tên giọng>.wav.
   Dùng: npm run sample -- <slug> "Ngọc Huyền" "Hải Đăng" ...   (xem danh sách giọng: python scripts/vieneu_tts.py --list) */
import fs from 'node:fs';
import path from 'node:path';
import {runVieneu} from './vieneu-job';

const [slug, ...voices] = process.argv.slice(2);
if (!slug || !voices.length) throw new Error('Dùng: npm run sample -- <slug> "<giọng 1>" "<giọng 2>" ...');
const ROOT = path.resolve(import.meta.dirname, '..');
const spec = JSON.parse(fs.readFileSync(path.join(ROOT, slug, 'script.json'), 'utf8'));
const text: string = spec.scenes[0].text.split(/(?<=[.!?…])\s+/)[0];
const outDir = path.join(ROOT, 'out', 'mau-giong');
fs.mkdirSync(outDir, {recursive: true});

for (const voice of voices) {
  const wav = path.join(outDir, `${voice}.wav`);
  runVieneu(voice, [{id: 'mau', narration: text, out_wav: wav, out_json: wav.replace(/\.wav$/, '.json')}]);
  fs.rmSync(wav.replace(/\.wav$/, '.json'), {force: true});
  console.log(`-> ${wav}`);
}
