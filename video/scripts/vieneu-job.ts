/* Gọi scripts/vieneu_tts.py (VieNeu, chạy offline) cho một lô lời đọc. Python có VieNeu là biến môi trường VIENEU_PYTHON (3.10+). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export type VieneuItem = {id: string; narration: string; out_wav: string; out_json: string};

export function runVieneu(voice: string, items: VieneuItem[]) {
  if (!items.length) return;
  const py = process.env.VIENEU_PYTHON;
  if (!py) throw new Error('Chưa đặt biến môi trường VIENEU_PYTHON (đường dẫn python.exe đã cài vieneu, Python 3.10+).');
  const jobFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vieneu-job-')), 'job.json');
  fs.writeFileSync(jobFile, JSON.stringify({engine: 'vieneu', voice, items}), 'utf8');
  const script = path.resolve(import.meta.dirname, 'vieneu_tts.py');
  const r = spawnSync(py, [script, jobFile], {stdio: 'inherit', env: {...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'}});
  if (r.error) throw new Error(`Không chạy được "${py}": ${r.error.message}`);
  if (r.status !== 0) throw new Error(`vieneu_tts.py lỗi (mã ${r.status}), xem log phía trên`);
}
