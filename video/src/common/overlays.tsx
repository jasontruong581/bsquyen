/* Lớp phủ dùng chung cho mọi video: phụ đề, nhãn lớn, watermark, màn kết. */
import {spring} from 'remotion';
import {FPS, P, type Timeline, type Word} from '../timeline';

export const FONT = "'Be Vietnam Pro', sans-serif";
export const NAVY = '#123b63';
export const ORANGE = '#f26e21';

/** Mốc kết thúc lời đọc của cảnh cuối */
export const endOf = (tl: Timeline) => {
  const last = tl.scenes[tl.scenes.length - 1];
  return last.start + last.dur;
};

/* ---------- phụ đề theo cụm 2–4 chữ, chữ đang đọc tô cam ---------- */
type Chunk = {words: Word[]; from: number; to: number};
const makeChunks = (tl: Timeline): Chunk[] => {
  const out: Chunk[] = [];
  for (const sc of tl.scenes) {
    let cur: Chunk | null = null;
    sc.words.forEach((w, i) => {
      const prev = sc.words[i - 1];
      const breakHere = !cur || cur.words.length >= 4 || (prev && w.t0 - prev.t1 > 0.25);
      if (breakHere) {
        cur = {words: [], from: w.t0 - 0.05, to: 0};
        out.push(cur);
      }
      cur!.words.push(w);
    });
  }
  out.forEach((c, i) => {
    const last = c.words[c.words.length - 1].t1 + 0.35;
    c.to = out[i + 1] ? Math.min(out[i + 1].from, last) : last;
  });
  return out;
};

const chunkCache = new WeakMap<Timeline, Chunk[]>();
const chunksOf = (tl: Timeline) => {
  let c = chunkCache.get(tl);
  if (!c) chunkCache.set(tl, (c = makeChunks(tl)));
  return c;
};

export const Captions = ({t, tl}: {t: number; tl: Timeline}) => {
  const c = chunksOf(tl).find((x) => t >= x.from && t < x.to);
  if (!c) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1530, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(255,255,255,0.94)', borderRadius: 28, padding: '18px 34px', boxShadow: '0 8px 30px rgba(18,59,99,0.18)', fontFamily: FONT, fontWeight: 800, fontSize: 62, lineHeight: 1.25, textAlign: 'center', color: NAVY}}>
        {c.words.map((w, i) => (
          <span key={i} style={{color: t >= w.t0 ? (t < w.t1 + 0.08 ? ORANGE : NAVY) : '#8796A5'}}>
            {w.text}
            {i < c.words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------- nhãn lớn vàng viền xanh, bật lên đúng lúc đọc tới ---------- */
export const Labels = ({t, frame, tl}: {t: number; frame: number; tl: Timeline}) => {
  const labels = tl.scenes.flatMap((s) => s.labels);
  return (
    <>
      {labels.map((l, i) => {
        const next = labels[i + 1]?.t ?? Infinity;
        const end = Math.min(l.t + 2.6, next - 0.1);
        if (t < l.t - 0.05 || t > end + 0.3) return null;
        const s = spring({frame: frame - Math.round(l.t * FPS), fps: FPS, config: {damping: 11, stiffness: 160}});
        const out = P(t, end, 0.3);
        return (
          <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', justifyContent: 'center', transform: `scale(${s * (1 - out)}) rotate(-3deg)`, opacity: 1 - out}}>
            <span style={{fontFamily: FONT, fontWeight: 900, fontSize: Math.min(104, Math.floor(1500 / l.text.length)), whiteSpace: 'nowrap', color: '#FFC93C', WebkitTextStroke: `14px ${NAVY}`, paintOrder: 'stroke fill', letterSpacing: 1, textShadow: '0 10px 0 rgba(18,59,99,0.25)'}}>{l.text}</span>
          </div>
        );
      })}
    </>
  );
};

/* ---------- màn kết ---------- */
export const Outro = ({t, tl}: {t: number; tl: Timeline}) => {
  const p = P(t, endOf(tl) + 0.4, 0.6);
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, background: `rgba(255,249,244,${0.96 * p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30, opacity: p}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 96, color: NAVY, transform: `translateY(${(1 - p) * 40}px)`}}>Hiểu Đúng Y Khoa</div>
      <div style={{width: 140, height: 10, borderRadius: 5, background: ORANGE}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 48, color: NAVY, textAlign: 'center', lineHeight: 1.35}}>
        Bài đầy đủ ở phần bình luận
        <br />
        Theo dõi để hiểu đúng mỗi ngày
      </div>
      <div style={{position: 'absolute', bottom: 120, left: 80, right: 80, fontFamily: FONT, fontWeight: 500, fontSize: 30, color: '#5b6b7b', textAlign: 'center'}}>
        Thông tin tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ.
      </div>
    </div>
  );
};

export const Watermark = ({t, tl}: {t: number; tl: Timeline}) => (
  <div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 34, color: NAVY, opacity: 0.55 * (1 - P(t, endOf(tl) + 0.4, 0.4)), letterSpacing: 2}}>
    HIỂU ĐÚNG Y KHOA
  </div>
);
