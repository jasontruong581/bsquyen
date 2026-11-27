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
const LABEL_STROKE = 14;
const LABEL_SPACING = 1;
const LABEL_TILT = 3; // độ nghiêng (xoay ngược chiều kim đồng hồ)
const LABEL_LINE_H = 1.2;
/** Hệ số phóng tối đa khi spring nảy quá đà; kích cỡ chữ được tính chừa sẵn chỗ cho hệ số này */
const LABEL_MAX_SCALE = 1.08;
const LABEL_MIN_SIZE = 30;
const LABEL_TWO_LINE_BELOW = 64; // 1 dòng bị ép nhỏ hơn cỡ này thì thử xuống 2 dòng
const LABEL_TWO_LINE_CAP = 84;

let measureCtx: CanvasRenderingContext2D | null | undefined;
const widthCache = new Map<string, number>();
/** Bề rộng chữ ở cỡ 100px, đo bằng canvas với đúng font đã tải (dự phòng: ước lượng theo số ký tự) */
const textWidth100 = (s: string) => {
  const hit = widthCache.get(s);
  if (hit !== undefined) return hit;
  if (measureCtx === undefined) measureCtx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  let w = s.length * 80;
  let loaded = false;
  if (measureCtx) {
    measureCtx.font = `900 100px ${FONT}`;
    w = measureCtx.measureText(s).width;
    // Chỉ nhớ kết quả khi font thật đã tải; trước đó canvas đo bằng font dự phòng nên số sẽ sai
    loaded = document.fonts.check(`900 100px "Be Vietnam Pro"`, s);
  }
  if (loaded) widthCache.set(s, w);
  return w;
};

const rad = (LABEL_TILT * Math.PI) / 180;
/** Bề rộng ngoài cùng của khối chữ sau khi xoay: gồm khoảng cách chữ, viền và độ nghiêng */
const boxWidth = (lines: string[], size: number) => {
  const w = Math.max(...lines.map((l) => (textWidth100(l) * size) / 100 + LABEL_SPACING * l.length)) + LABEL_STROKE;
  const h = size * LABEL_LINE_H * lines.length + LABEL_STROKE;
  return {w: w * Math.cos(rad) + h * Math.sin(rad), h: h * Math.cos(rad) + w * Math.sin(rad)};
};

/** Cỡ chữ lớn nhất (≤ cap) để khối chữ nằm trọn trong lề hai bên, kể cả lúc phóng to tối đa */
const fitSize = (lines: string[], cap: number) => {
  const avail = (1080 - 2 * SAFE.labelSideMargin) / LABEL_MAX_SCALE;
  let size = Math.floor(cap);
  while (size > LABEL_MIN_SIZE && boxWidth(lines, size).w > avail) size--;
  return size;
};

/** Tách thành 2 dòng cân đối nhất, chỉ ngắt ở khoảng trắng; ký hiệu như → dính với chữ đứng trước */
const splitTwoLines = (text: string): string[] | null => {
  const words: string[] = [];
  for (const tok of text.split(/\s+/).filter(Boolean)) {
    if (words.length && !/[\p{L}\p{N}]/u.test(tok)) words[words.length - 1] += ` ${tok}`;
    else words.push(tok);
  }
  if (words.length < 2) return null;
  let best: string[] | null = null;
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    // Ưu tiên ngắt ngay sau ký hiệu (vd "VIÊM → XƠ GAN →" / "UNG THƯ") cho dễ đọc theo ý
    const w = Math.max(...lines.map((l) => textWidth100(l))) * (/[^\p{L}\p{N}\s]$/u.test(lines[0]) ? 0.8 : 1);
    if (w < bestW) {
      bestW = w;
      best = lines;
    }
  }
  return best;
};

/** Chọn số dòng và cỡ chữ cho nhãn: ưu tiên 1 dòng, quá nhỏ thì xuống 2 dòng cân đối */
export const layoutLabel = (text: string, maxSize?: number) => {
  const cap = maxSize ?? Math.min(104, Math.floor(1400 / text.length));
  let lines = [text];
  let size = fitSize(lines, cap);
  // Chỉ khi 1 dòng bị ép nhỏ lại (không vừa) và đã nhỏ hơn ngưỡng mới thử xuống 2 dòng; nhãn vừa sẵn giữ nguyên
  if (size < cap && size < LABEL_TWO_LINE_BELOW) {
    const two = splitTwoLines(text);
    if (two) {
      const size2 = fitSize(two, Math.min(maxSize ?? LABEL_TWO_LINE_CAP, LABEL_TWO_LINE_CAP));
      if (size2 >= size * 1.2) {
        lines = two;
        size = size2;
      }
    }
  }
  return {lines, size};
};

export const BigLabel = ({text, scale = 1, opacity = 1, size}: {text: string; scale?: number; opacity?: number; size?: number}) => {
  const {lines, size: fontSize} = layoutLabel(text, size);
  const s = Math.min(scale, LABEL_MAX_SCALE);
  const box = boxWidth(lines, fontSize);  // Đẩy khối xuống đúng phần góc xoay + phóng to hất lên, để mép trên luôn ≥ SAFE.labelTop (không chạm watermark)
  const lift = (box.h - (fontSize * LABEL_LINE_H * lines.length + LABEL_STROKE)) / 2 + (box.h * (LABEL_MAX_SCALE - 1)) / 2;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.labelTop + lift, display: 'flex', justifyContent: 'center', transform: `scale(${s}) rotate(-${LABEL_TILT}deg)`, opacity}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize, lineHeight: LABEL_LINE_H, textAlign: 'center', whiteSpace: 'nowrap', color: '#FFC93C', WebkitTextStroke: `${LABEL_STROKE}px ${NAVY}`, paintOrder: 'stroke fill', letterSpacing: LABEL_SPACING, textShadow: '0 10px 0 rgba(18,59,99,0.25)'}}>
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

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

/* ---------- màn kết: phủ kín khung nên căn giữa đúng tâm ngang (x=540), không áp lề phải của vùng an toàn ---------- */
export const Outro = ({t, tl, note = 'Bài đầy đủ ở phần bình luận'}: {t: number; tl: Timeline; note?: string}) => {
  const p = P(t, endOf(tl) + 0.4, 0.6);
  if (p <= 0) return null;
  return (
    <div style={{position: 'absolute', inset: 0, background: `rgba(255,249,244,${0.96 * p})`, opacity: p}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 92, color: NAVY, transform: `translateY(${(1 - p) * 40}px)`, textAlign: 'center'}}>Hiểu Đúng Y Khoa</div>
        <div style={{width: 140, height: 10, borderRadius: 5, background: ORANGE}} />
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: NAVY, textAlign: 'center', lineHeight: 1.35}}>
          {note}
          <br />
          Follow để hiểu rõ hơn về cơ thể mình
        </div>
      </div>
      <div style={{position: 'absolute', top: 1180, left: 80, right: 80, fontFamily: FONT, fontWeight: 600, fontSize: 32, color: '#5b6b7b', textAlign: 'center', lineHeight: 1.3}}>
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
