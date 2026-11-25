/* Bong bóng thoại của nhân vật: hiện (nảy) tại mốc `at`, giữ `dur` giây, đuôi chỉ về điểm neo (toạ độ màn hình).
   Hộp được kẹp trong vùng an toàn Reels: không chạm lề phải, không đè lên khu nhãn lớn ở trên. */
import {spring} from 'remotion';
import {FPS, P} from '../timeline';
import {FONT, NAVY} from './overlays';
import {RIGHT_EDGE, SAFE} from './layout';

/** `size`: hệ số thu phóng quanh đầu đuôi (mặc định 1; bong bóng phụ như tiếng la thì nhỏ hơn) */
export type BubbleSpec = {at: number; dur: number; text: string; size?: number};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const Bubble = ({t, frame, at, dur, text, size = 1, x, y}: BubbleSpec & {t: number; frame: number; x: number; y: number}) => {
  if (t < at - 0.02 || t > at + dur + 0.25) return null;
  const s = spring({frame: frame - Math.round(at * FPS), fps: FPS, config: {damping: 10, stiffness: 190}});
  const out = P(t, at + dur, 0.25);
  const w = Math.round(text.length * 25 + 90);
  const h = 104;
  const bx = clamp(x - w / 2, 50, RIGHT_EDGE - w);
  const by = Math.max(SAFE.labelTop + 160, y - 80 - h);
  const tipY = Math.max(by + h + 24, y - 6);
  const tailX = clamp(x, bx + 46, bx + w - 46);
  const r = 34;
  const d = `M ${bx + r} ${by} H ${bx + w - r} Q ${bx + w} ${by} ${bx + w} ${by + r} V ${by + h - r} Q ${bx + w} ${by + h} ${bx + w - r} ${by + h} H ${tailX + 22} L ${x} ${tipY} L ${tailX - 22} ${by + h} H ${bx + r} Q ${bx} ${by + h} ${bx} ${by + h - r} V ${by + r} Q ${bx} ${by} ${bx + r} ${by} Z`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out, transformOrigin: `${x}px ${tipY}px`, transform: `scale(${s * size * (1 - 0.2 * out)})`}}>
      <path d={d} fill="#fff" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
      <text x={bx + w / 2} y={by + h / 2 + 16} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={46} fill={NAVY}>
        {text}
      </text>
    </svg>
  );
};
