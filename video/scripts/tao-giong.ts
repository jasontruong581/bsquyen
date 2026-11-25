/* Tạo giọng đọc VieNeu cho từng cảnh trong <slug>/script.json và ghi public/<slug>/timeline.json
   gồm mốc thời gian từng chữ để làm phụ đề và hẹn giờ nhãn.
   Dùng: npm run voice -- <slug>   (cảnh nào đã có giọng cùng lời đọc + giọng thì dùng lại, không tạo lại) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runVieneu} from './vieneu-job';

type Word = {text: string; t0: number; t1: number};
type Voice = {dur: number; words: Word[]};
type Spec = {tts: {engine: 'vieneu'; voice: string}; gap: number; scenes: {id: string; text: string; labels: {at: string; text: string}[]}[]};

const slug = process.argv[2];
if (!slug) throw new Error('Dùng: npm run voice -- <slug>');
const ROOT = path.resolve(import.meta.dirname, '..');
const specFile = path.join(ROOT, slug, 'script.json');
if (!fs.existsSync(specFile)) throw new Error(`Không thấy ${specFile}`);
const spec: Spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const pubDir = path.join(ROOT, 'public', slug);
const audioDir = path.join(pubDir, 'audio');
fs.mkdirSync(audioDir, {recursive: true});

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}/]/gu, '');

// Mỗi cảnh: tên file theo hash của giọng + lời đọc, nên đổi giọng hay sửa lời thì tự tạo lại đúng cảnh đó
const jobs = spec.scenes.map((s) => {
  const key = crypto.createHash('sha1').update(`${spec.tts.voice}|${s.text}`).digest('hex').slice(0, 8);
  const base = path.join(audioDir, `${s.id}-${key}`);
  return {id: s.id, narration: s.text, out_wav: `${base}.wav`, out_json: `${base}.json`};
});
const missing = jobs.filter((j) => !fs.existsSync(j.out_wav) || !fs.existsSync(j.out_json));
console.log(`Giọng "${spec.tts.voice}": ${jobs.length - missing.length} cảnh có sẵn, ${missing.length} cảnh cần tạo`);
runVieneu(spec.tts.voice, missing);

let t = 0.4; // khoảng lặng nhỏ đầu video
const scenes = [];
for (const [i, s] of spec.scenes.entries()) {
  const j = jobs[i];
  const v: Voice = JSON.parse(fs.readFileSync(j.out_json, 'utf8'));
  const words = v.words.map((w) => ({text: w.text, t0: +(t + w.t0).toFixed(3), t1: +(t + w.t1).toFixed(3)}));
  const labels = s.labels.map((l) => {
    const w = words.find((x) => norm(x.text).startsWith(norm(l.at)));
    if (!w) throw new Error(`Cảnh ${s.id}: không tìm thấy chữ "${l.at}" để gắn nhãn "${l.text}"`);
    return {text: l.text, t: w.t0};
  });
  scenes.push({id: s.id, start: +t.toFixed(3), dur: +v.dur.toFixed(3), audio: `${slug}/audio/${path.basename(j.out_wav)}`, words, labels});
  console.log(`${s.id}: ${v.dur.toFixed(1)}s, ${words.length} chữ`);
  t += v.dur + spec.gap;
}
const total = +(t + 2.6).toFixed(3); // chừa chỗ cho màn kết
fs.writeFileSync(path.join(pubDir, 'timeline.json'), JSON.stringify({total, scenes}, null, 1));
console.log(`Tổng: ${total.toFixed(1)}s`);
if (total > 90) console.warn('CẢNH BÁO: tổng thời lượng vượt 90 giây, quá giới hạn Reels');
