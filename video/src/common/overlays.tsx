/* Lớp phủ dùng chung cho mọi video: phụ đề, nhãn lớn, watermark, màn kết. Vị trí theo vùng an toàn Reels (layout.ts). */
import {spring} from 'remotion';
import {FPS, P, type Timeline, type Word} from '../timeline';
import {SAFE} from './layout';

export const FONT = "'Be Vietnam Pro', sans-serif";
export const NAVY = '#123b63';
export const ORANGE = '#f26e21';

/** Mốc kết thúc lời đọc của cảnh cuối */
export const endOf = (tl: Timeline) => {
  const last = tl.scenes[tl.scenes.length - 1];
  return last.start + last.dur;
};

/* ---------- phụ đề theo cụm 2–4 chữ (tối đa ~24 ký tự để vừa một dòng), chữ đang đọc tô cam ---------- */
type Chunk = {words: Word[]; from: number; to: number};
const MAX_CHARS = 24;
const makeChunks = (tl: Timeline): Chunk[] => {
  const out: Chunk[] = [];
  for (const sc of tl.scenes) {
    let cur: Chunk | null = null;
    let chars = 0;
    sc.words.forEach((w, i) => {
      const prev = sc.words[i - 1];
      const breakHere = !cur || cur.words.length >= 4 || chars + w.text.length + 1 > MAX_CHARS || (prev && w.t0 - prev.t1 > 0.25);
      if (breakHere) {
        cur = {words: [], from: w.t0 - 0.05, to: 0};
        out.push(cur);
        chars = 0;
      }
      cur!.words.push(w);
      chars += w.text.length + 1;
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
    <div style={{position: 'absolute', left: 50, right: SAFE.rightMargin, top: SAFE.captionTop, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(255,255,255,0.95)', borderRadius: 28, padding: '14px 30px', boxShadow: '0 8px 30px rgba(18,59,99,0.18)', fontFamily: FONT, fontWeight: 800, fontSize: 58, lineHeight: 1.22, textAlign: 'center', color: NAVY}}>
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

/* ---------- chữ lớn vàng viền xanh (dùng cho nhãn và câu mở đầu) ---------- */
export const BigLabel = ({text, scale = 1, opacity = 1, size}: {text: string; scale?: number; opacity?: number; size?: number}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.labelTop, display: 'flex', justifyContent: 'center', transform: `scale(${scale}) rotate(-3deg)`, opacity}}>
    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: size ?? Math.min(104, Math.floor(1400 / text.length)), whiteSpace: 'nowrap', color: '#FFC93C', WebkitTextStroke: `14px ${NAVY}`, paintOrder: 'stroke fill', letterSpacing: 1, textShadow: '0 10px 0 rgba(18,59,99,0.25)'}}>{text}</span>
  </div>
);

/* ---------- nhãn bật lên đúng lúc đọc tới; luôn tắt trước khi cảnh chứa nó kết thúc (+0,2s), không dính sang cảnh sau ---------- */
export const Labels = ({t, frame, tl}: {t: number; frame: number; tl: Timeline}) => {
  const labels = tl.scenes.flatMap((s) => s.labels.map((l) => ({...l, sceneEnd: s.start + s.dur})));
  return (
    <>
      {labels.map((l, i) => {
        const next = labels[i + 1]?.t ?? Infinity;
        const end = Math.min(l.t + 2.6, next - 0.1, l.sceneEnd + 0.2);
        if (t < l.t - 0.05 || t > end) return null;
        const s = spring({frame: frame - Math.round(l.t * FPS), fps: FPS, config: {damping: 11, stiffness: 160}});
        const out = P(t, end - 0.25, 0.25);
        return <BigLabel key={i} text={l.text} scale={s * (1 - out)} opacity={1 - out} />;
      })}
    </>
  );
};

/* ---------- màn kết ---------- */
export const Outro = ({t, tl}: {t: number; tl: Timeline}) => {
  const p = P(t, endOf(tl) + 0.4, 0.6);
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, background: `rgba(255,249,244,${0.96 * p})`, opacity: p}}>
      <div style={{position: 'absolute', left: 0, right: SAFE.rightMargin - 60, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 92, color: NAVY, transform: `translateY(${(1 - p) * 40}px)`, textAlign: 'center'}}>Hiểu Đúng Y Khoa</div>
        <div style={{width: 140, height: 10, borderRadius: 5, background: ORANGE}} />
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: NAVY, textAlign: 'center', lineHeight: 1.35}}>
          Bài đầy đủ ở phần bình luận
          <br />
          Follow để hiểu rõ hơn về cơ thể mình
        </div>
      </div>
      <div style={{position: 'absolute', top: 1180, left: 80, right: SAFE.rightMargin, fontFamily: FONT, fontWeight: 600, fontSize: 32, color: '#5b6b7b', textAlign: 'center', lineHeight: 1.3}}>
        Thông tin tham khảo, không thay thế chẩn đoán và điều trị của bác sĩ.
      </div>
    </div>
  );
};

export const Watermark = ({t, tl}: {t: number; tl: Timeline}) => (
  <div style={{position: 'absolute', top: SAFE.watermarkTop, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 34, color: NAVY, opacity: 0.6 * (1 - P(t, endOf(tl) + 0.4, 0.4)), letterSpacing: 2}}>
    HIỂU ĐÚNG Y KHOA
  </div>
);
