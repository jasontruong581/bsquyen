"""
Giọng đọc offline bằng VieNeu-TTS (https://github.com/pnnbao97/VieNeu-TTS) hoặc file audio có sẵn.
Được scripts/prepare.ts gọi tự động — không cần chạy tay.

    python scripts/vieneu_tts.py <job.json>

job.json:
{
  "engine": "vieneu" | "files",
  "voice": "Hải Đăng",            # giọng có sẵn của VieNeu (tuỳ chọn)
  "ref_audio": "C:/.../giong.wav", # hoặc file mẫu 3–8 giây để nhân bản giọng
  "mode": null, "precision": null,
  "items": [{"id": "...", "narration": "...", "in_file": "...(files)", "out_wav": "...", "out_json": "..."}]
}

Mỗi item ghi ra out_wav (PCM16 mono) + out_json {"dur": giây, "words": [{"text","t0","t1"}]}.
Mốc thời gian từng chữ được ước lượng: mỗi câu được tổng hợp riêng nên biết đúng khoảng thời gian của câu;
trong câu, tìm khoảng lặng khớp với dấu phẩy rồi chia theo số âm tiết.
"""
import json
import os
import re
import sys
import tempfile
import wave

import numpy as np

# console Windows mặc định cp1252 -> lỗi khi in tên giọng có emoji / tiếng Việt
for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, 'reconfigure'):
        _s.reconfigure(encoding='utf-8', errors='replace')

GAP_BETWEEN_SENTENCES = 0.30  # giây chèn giữa các câu khi tự tổng hợp


def read_wav(path):
    try:
        import soundfile as sf

        x, sr = sf.read(path, dtype='float32', always_2d=True)
        return x.mean(axis=1), sr
    except ImportError:
        with wave.open(path, 'rb') as w:
            sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
            raw = w.readframes(n)
        if sw != 2:
            raise RuntimeError(f'{path}: cần WAV PCM 16-bit (hoặc cài soundfile: pip install soundfile)')
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        return x.reshape(-1, ch).mean(axis=1), sr


def write_wav(path, x, sr):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def envelope(x, sr):
    win = max(1, sr // 100)  # 10 ms
    n = len(x) // win
    env = np.abs(x[: n * win]).reshape(n, win).max(axis=1) if n else np.zeros(1)
    return env, win


def trim(x, sr):
    env, win = envelope(x, sr)
    th = max(0.015, float(env.max()) * 0.04)
    on = np.where(env > th)[0]
    if not len(on):
        return x
    a = max(0, on[0] - 2)
    b = min(len(env), on[-1] + 4)
    return x[a * win: b * win]


NUM_WORDS = {'không', 'một', 'mốt', 'hai', 'ba', 'bốn', 'tư', 'năm', 'lăm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mươi', 'trăm', 'nghìn', 'ngàn', 'triệu', 'tỷ', 'phẩy'}


def clause_weights(cl):
    """trọng số thời gian của từng chữ trong mệnh đề; dãy số đọc liền nhau được đọc nhanh hơn chữ thường"""
    base = [syllable_weight(t) for t in cl]
    low = [re.sub(r'[,.;:!?…]+$', '', t).lower() in NUM_WORDS for t in cl]
    return [0.6 if low[i] and ((i > 0 and low[i - 1]) or (i + 1 < len(cl) and low[i + 1])) else base[i] for i in range(len(cl))]


def syllable_weight(tok):
    digits = re.sub(r'\D', '', tok)
    if digits:  # số đọc dài hơn: "11,3" -> "mười một phẩy ba"
        return 1.6 * len(digits) + (1.5 if ',' in tok.strip(',.') else 0)
    return 1.0


def match_pauses(segs, clauses):
    """Ghép khoảng lặng thật (giữa các đoạn tiếng) với ranh giới mệnh đề (dấu phẩy/chấm) theo vị trí tương đối
    và độ dài khoảng lặng, thay vì gộp bừa; trả về (segs, clauses) cùng số phần tử."""
    S, B = len(segs) - 1, len(clauses) - 1
    if S <= 0 or B <= 0:
        if S == 0 and B > 0:
            return segs, [sum(clauses, [])]
        if B == 0 and S > 0:
            return [(segs[0][0], segs[-1][1])], clauses
        return segs, clauses
    dur = [e - b for b, e in segs]
    speech = sum(dur) or 1
    f = [sum(dur[: j + 1]) / speech for j in range(S)]
    gaplen = [(segs[j + 1][0] - segs[j][1]) / 100 for j in range(S)]
    wts = [sum(clause_weights(c)) for c in clauses]
    tot = sum(wts) or 1
    c = [sum(wts[: i + 1]) / tot for i in range(B)]
    m = min(S, B)
    INF = 1e9
    # dp[i][j][k]: chi phí nhỏ nhất dùng i ranh giới đầu, j khoảng lặng đầu, ghép k cặp
    dp = [[[INF] * (m + 1) for _ in range(S + 1)] for _ in range(B + 1)]
    bk = {}
    dp[0][0][0] = 0.0
    for i in range(B + 1):
        for j in range(S + 1):
            for k in range(m + 1):
                cur = dp[i][j][k]
                if cur >= INF:
                    continue
                if i < B and cur < dp[i + 1][j][k]:
                    dp[i + 1][j][k] = cur; bk[(i + 1, j, k)] = (i, j, k, None)
                if j < S and cur < dp[i][j + 1][k]:
                    dp[i][j + 1][k] = cur; bk[(i, j + 1, k)] = (i, j, k, None)
                if i < B and j < S and k < m:
                    # chỉ ghép khi vị trí khớp ranh giới mệnh đề hoặc khoảng lặng đủ dài (>= 0,3 s) để chắc là dấu câu
                    if abs(c[i] - f[j]) > 0.22 and gaplen[j] < 0.3:
                        continue
                    cost = cur + abs(c[i] - f[j]) - 0.5 * min(gaplen[j], 0.4) - 0.25
                    if cost < dp[i + 1][j + 1][k + 1]:
                        dp[i + 1][j + 1][k + 1] = cost; bk[(i + 1, j + 1, k + 1)] = (i, j, k, (i, j))
    kbest = min(range(m + 1), key=lambda k: dp[B][S][k])
    pairs, st = [], (B, S, kbest)
    while st != (0, 0, 0):
        pi, pj, pk, pr = bk[st]
        if pr:
            pairs.append(pr)
        st = (pi, pj, pk)
    pairs.reverse()
    mb = {i for i, _ in pairs}
    mg = {j for _, j in pairs}
    # gộp đoạn tiếng qua các khoảng lặng không được ghép; gộp mệnh đề qua các ranh giới không được ghép
    nsegs, cs = [], segs[0][0]
    for j in range(S):
        if j in mg:
            nsegs.append((cs, segs[j][1])); cs = segs[j + 1][0]
    nsegs.append((cs, segs[-1][1]))
    nclauses, cur = [], list(clauses[0])
    for i in range(B):
        if i in mb:
            nclauses.append(cur); cur = list(clauses[i + 1])
        else:
            cur += clauses[i + 1]
    nclauses.append(cur)
    return nsegs, nclauses


def align_clauses(narration, x, sr):
    """trả về [{"text","t0","t1"}] cho từng chữ của một câu/lời đọc ngắn (khớp khoảng lặng với dấu phẩy)"""
    env, _ = envelope(x, sr)
    th = max(0.015, float(env.max()) * 0.04)
    voiced = np.where(env > th)[0]
    first, last = (voiced[0], voiced[-1] + 1) if len(voiced) else (0, len(env))
    # các đoạn có tiếng, tách bởi khoảng lặng >= 100 ms
    segs, start, run = [], first, 0
    for k in range(first, last):
        if env[k] <= th:
            run += 1
        else:
            if run >= 10:
                segs.append((start, k - run))
                start = k
            run = 0
    segs.append((start, last))
    toks = narration.split()
    clauses, cur = [], []
    for tk in toks:
        cur.append(tk)
        if re.search(r'[,.;:!?…]$', tk):
            clauses.append(cur)
            cur = []
    if cur:
        clauses.append(cur)
    segs, clauses = match_pauses(segs, clauses)
    words = []
    for (s0, s1), cl in zip(segs, clauses):
        w = clause_weights(cl)
        tot = sum(w) or 1
        pos, span = s0 / 100, (s1 - s0) / 100
        for tk, wi in zip(cl, w):
            d = span * wi / tot
            words.append({'text': tk, 't0': round(pos, 3), 't1': round(pos + d, 3)})
            pos += d
    return words


SENT_SPLIT = r'(?<=[.!?…])\s+'


def align_sentences(narration, x, sr, spans):
    """Căn từng câu trong khoảng thời gian thật của câu đó (spans = [(giây đầu, giây cuối)] theo thứ tự câu),
    nên chữ không thể lệch ra ngoài câu của nó. Trong mỗi câu vẫn khớp khoảng lặng với dấu phẩy."""
    sents = [t.strip() for t in re.split(SENT_SPLIT, narration) if t.strip()]
    if len(sents) != len(spans):
        return align_clauses(narration, x, sr)
    words = []
    for st, (a, b) in zip(sents, spans):
        i0, i1 = int(a * sr), min(len(x), int(b * sr))
        ws = align_clauses(st, x[i0:i1], sr)
        for w in ws:
            words.append({'text': w['text'], 't0': round(w['t0'] + a, 3), 't1': round(w['t1'] + a, 3)})
    return words


def align(narration, x, sr, spans=None):
    return align_sentences(narration, x, sr, spans) if spans else align_clauses(narration, x, sr)


def resolve_voice(tts, name):
    """khớp tên giọng người dùng gõ với danh sách giọng có sẵn (không phân biệt hoa thường)"""
    try:
        presets = list(tts.list_preset_voices())
    except Exception:
        return name
    for label, vid in presets:
        if name.lower() in (str(label).lower(), str(vid).lower()):
            return vid
    names = ', '.join(str(l) for l, _ in presets)
    sys.exit(f'Không có giọng "{name}". Các giọng có sẵn: {names}\n(Hoặc dùng "refAudio" để nhân bản giọng từ file WAV.)')


def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--list':
        from vieneu import Vieneu

        for label, vid in Vieneu().list_preset_voices():
            print(f'{label}  ->  {vid}')
        return
    job = json.load(open(sys.argv[1], encoding='utf-8'))
    items = job['items']
    tts = None
    if job['engine'] == 'vieneu':
        try:
            from vieneu import Vieneu
        except ImportError:
            sys.exit('Chưa cài VieNeu cho Python. Chạy: pip install vieneu  (Python 3.10+)')
        kw = {}
        if job.get('mode'):
            kw['mode'] = job['mode']
        if job.get('precision'):
            kw['precision'] = job['precision']
        print('VieNeu: đang nạp model (lần đầu sẽ tải model, hơi lâu)...', flush=True)
        tts = Vieneu(**kw)
        if job.get('voice') and not job.get('ref_audio'):
            job['voice'] = resolve_voice(tts, job['voice'])
    tmpdir = tempfile.mkdtemp(prefix='vieneu_')
    for it in items:
        spans = None
        if job['engine'] == 'files':
            x, sr = read_wav(it['in_file'])
            x = trim(x, sr)
        else:
            sents = [s.strip() for s in re.split(SENT_SPLIT, it['narration']) if s.strip()]
            parts, sr, spans, pos = [], None, [], 0
            for i, s in enumerate(sents):
                kw = {}
                if job.get('ref_audio'):
                    kw['ref_audio'] = job['ref_audio']
                elif job.get('voice'):
                    kw['voice'] = job['voice']
                audio = tts.infer(s, **kw)
                tmp = os.path.join(tmpdir, f'{it["id"]}-{i}.wav')
                tts.save(audio, tmp)
                y, sr = read_wav(tmp)
                part = trim(y, sr)
                spans.append((pos / sr, (pos + len(part)) / sr))
                parts.append(part)
                pos += len(part)
                if i < len(sents) - 1:
                    gap = int(GAP_BETWEEN_SENTENCES * sr)
                    parts.append(np.zeros(gap, np.float32))
                    pos += gap
            x = np.concatenate(parts)
        # 80 ms lặng ở đầu cho đỡ "cụt"
        lead = np.zeros(int(0.08 * sr), np.float32)
        x = np.concatenate([lead, x])
        if spans:
            spans = [(a + 0.08, b + 0.08) for a, b in spans]
        peak = float(np.abs(x).max()) or 1
        x = x * min(1.0, 0.89 / peak)
        words = align(it['narration'], x, sr, spans)
        write_wav(it['out_wav'], x, sr)
        json.dump({'dur': round(len(x) / sr, 3), 'words': words}, open(it['out_json'], 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'  {it["id"]}: {len(x) / sr:.1f}s, {len(words)} chữ', flush=True)


if __name__ == '__main__':
    main()
