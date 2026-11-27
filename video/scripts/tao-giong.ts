/* Tạo giọng đọc VieNeu cho từng cảnh trong script.json của một video và ghi public/<slug>/timeline.json
   gồm mốc thời gian từng chữ để làm phụ đề và hẹn giờ nhãn.
   Dùng: npm run voice -- <slug hoặc id>   (vd hp-va-da-day hoặc V001)
   Cảnh nào đã có giọng cùng lời đọc + giọng thì dùng lại, không tạo lại.
   Khối "phat_am" trong script.json: chữ hiển thị -> phiên âm gửi cho TTS; mốc các âm tiết được gộp về một chữ hiển thị. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runVieneu} from './vieneu-job';
import {findVideo, VIDEO_ROOT} from './tim-video.mjs';
import {buildPhatAm, mergePhatAm} from './phat-am.mjs';

type Word = {text: string; t0: number; t1: number};
type Voice = {dur: number; words: Word[]};
type Spec = {
  tts: {engine: 'vieneu'; voice: string};
  gap: number;
  phat_am?: Record<string, string>;
  scenes: {id: string; text: string; labels: {at: string; text: string}[]}[];
};

const video = findVideo(process.argv[2]);
const specFile = path.join(video.dir, 'script.json');
const spec: Spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const slug = video.slug;
const pubDir = path.join(VIDEO_ROOT, 'public', slug);
const audioDir = path.join(pubDir, 'audio');
fs.mkdirSync(audioDir, {recursive: true});

const norm = (s: string) => s.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}/]/gu, '');

// Mỗi cảnh: tên file theo hash của giọng + câu gửi TTS (đã phiên âm), nên đổi giọng, sửa lời hay sửa phát âm thì tự tạo lại đúng cảnh đó
const jobs = spec.scenes.map((s) => {
  const {ttsText, tokens} = buildPhatAm(s.text, spec.phat_am);
  const key = crypto.createHash('sha1').update(`${spec.tts.voice}|${ttsText}`).digest('hex').slice(0, 8);
  const base = path.join(audioDir, `${s.id}-${key}`);
  return {id: s.id, narration: ttsText, tokens, out_wav: `${base}.wav`, out_json: `${base}.json`};
});
const missing = jobs.filter((j) => !fs.existsSync(j.out_wav) || !fs.existsSync(j.out_json));
console.log(`${video.id || slug} - giọng "${spec.tts.voice}": ${jobs.length - missing.length} cảnh có sẵn, ${missing.length} cảnh cần tạo`);
runVieneu(spec.tts.voice, missing);

let t = 0; // giọng bắt đầu ngay giây 0, không chừa khoảng lặng đầu
const scenes = [];
for (const [i, s] of spec.scenes.entries()) {
  const j = jobs[i];
  const v: Voice = JSON.parse(fs.readFileSync(j.out_json, 'utf8'));
  const words = mergePhatAm(v.words, j.tokens).map((w) => ({text: w.text, t0: +(t + w.t0).toFixed(3), t1: +(t + w.t1).toFixed(3)}));
  const labels = s.labels.map((l) => {
    const w = words.find((x) => norm(x.text).startsWith(norm(l.at)));
    if (!w) throw new Error(`Cảnh ${s.id}: không tìm thấy chữ "${l.at}" để gắn nhãn "${l.text}"`);
    return {text: l.text, t: w.t0};
  });
  scenes.push({id: s.id, start: +t.toFixed(3), dur: +v.dur.toFixed(3), audio: `${slug}/audio/${path.basename(j.out_wav)}`, words, labels});
  console.log(`${s.id}: ${v.dur.toFixed(1)}s, ${words.length} chữ`);
  t += v.dur + spec.gap;
}
const total = +(t - spec.gap + 2.4).toFixed(3); // sau lời đọc cuối còn màn kết ~2,4 giây
fs.writeFileSync(path.join(pubDir, 'timeline.json'), JSON.stringify({total, scenes}, null, 1));
console.log(`Tổng: ${total.toFixed(1)}s`);
if (total > 90) console.log('Lưu ý: dài hơn 90 giây, job đăng sẽ đăng qua /videos thay cho API Reels');
else if (total < 40 || total > 55) console.warn('LƯU Ý: tổng thời lượng ngoài khoảng 40-55 giây theo đặc tả');
