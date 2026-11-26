/* Lớp phủ 2D của V011: nhãn có đường chỉ tới đúng bộ phận, chữ lớn cam viền trắng (như video mẫu), nét chém khi "cắt", phụ đề, watermark, màn kết.
   Mọi nhãn nằm trong vùng an toàn Reels (y 230–1100, lề 24px), nằm trên phụ đề. */
import * as THREE from 'three';
import {AbsoluteFill, spring} from 'remotion';
import {FPS} from '../../src/timeline';
import {Captions, Outro, Watermark, FONT, layoutLabel} from '../../src/common/overlays';
import {Mix, type Sfx} from '../../src/common/mix';
import {ARTERY, BILE, HEPATIC, HEX_R, LL, LOB_POS, PORTAL, GB_CENTER, INTESTINE, LIVER_C, V, lobePoint, triadPos, hexCorner} from './giai-phau';
import {project} from './may-quay';
import {T, W, E, clamp01, timeline} from './moc';

const NAVY = '#123b63';
const ORANGE = '#FF8A1F';

/* ---------- nhãn có đường chỉ ---------- */
type Pill = {text: string; from: number; to: number; at: () => THREE.Vector3; side: 1 | -1; dy?: number; bg: string};
const lob = (v: THREE.Vector3) => v.clone().add(LOB_POS);
const top = (v: THREE.Vector3, y = 0.8) => lob(V(v.x, y, v.z));
const PORTAL_C = '#6C5CE7';
const ARTERY_C = '#E5313A';
const HEP_C = '#1F8FE8';
const BILE_C = '#1FAE6A';
const LOBE_C = '#C4503A';

export const PILLS: Pill[] = [
  {text: 'THÙY TRÁI', from: W(2, 'hai') + 0.35, to: E(2) + 1.2, at: () => lobePoint('L', 0.35, 0.55), side: 1, dy: -40, bg: LOBE_C},
  {text: 'THÙY PHẢI', from: W(2, 'thùy', 1), to: E(2) + 1.2, at: () => lobePoint('R', -0.45, 0.6), side: -1, dy: -40, bg: LOBE_C},
  {text: 'TĨNH MẠCH CỬA', from: W(3, 'tĩnh'), to: E(3) + 1.4, at: () => PORTAL[0].curve.getPointAt(0.45), side: -1, dy: 30, bg: PORTAL_C},
  {text: 'ĐỘNG MẠCH GAN', from: W(4, 'động'), to: E(4) + 0.5, at: () => ARTERY[0].curve.getPointAt(0.5), side: 1, dy: 30, bg: ARTERY_C},
  {text: 'TĨNH MẠCH GAN', from: W(5, 'tĩnh'), to: E(5) + 0.4, at: () => HEPATIC[1].curve.getPointAt(0.55), side: 1, dy: -30, bg: HEP_C},
  {text: 'TIỂU THÙY', from: W(6, 'tiểu'), to: E(6) + 0.2, at: () => top(V(0, 0, -HEX_R * 0.4), 0.7), side: -1, dy: -150, bg: '#E8743B'},
  {text: 'TĨNH MẠCH CỬA', from: T.triadV, to: T.triadV + 1.9, at: () => lob(triadPos(1, 'v')).add(V(0, 0.75, 0)), side: -1, dy: -170, bg: PORTAL_C},
  {text: 'ĐỘNG MẠCH', from: T.triadA, to: T.triadA + 1.6, at: () => lob(triadPos(1, 'a')).add(V(0, 0.75, 0)), side: 1, dy: -250, bg: ARTERY_C},
  {text: 'ỐNG MẬT', from: T.triadB, to: T.triadB + 1.6, at: () => lob(triadPos(1, 'b')).add(V(0, 0.75, 0)), side: -1, dy: -300, bg: BILE_C},
  {text: 'TĨNH MẠCH TRUNG TÂM', from: T.center, to: E(7) + 0.6, at: () => lob(V(0, 1.0, 0)), side: 1, dy: -190, bg: HEP_C},
  {text: 'KHO ĐƯỜNG', from: T.sugar, to: T.sugar + 1.9, at: () => lob(V(-0.6, 0.5, 1.1)), side: -1, dy: -210, bg: '#D99A00'},
  {text: 'BỘ LỌC', from: T.filter + 0.1, to: E(8) + 0.4, at: () => lob(hexCorner(1, 1.35).add(V(0, 0.5, 0))), side: 1, dy: -200, bg: '#7B4FE0'},
  {text: 'DỊCH MẬT', from: T.bile, to: T.bile + 1.7, at: () => lob(hexCorner(2, 1.2).add(V(0, 0.1, 0))), side: -1, dy: -210, bg: BILE_C},
  {text: 'ỐNG MẬT', from: T.ducts, to: T.gb + 0.4, at: () => BILE[0].curve.getPointAt(0.35), side: 1, dy: 60, bg: BILE_C},
  {text: 'TÚI MẬT', from: T.gb, to: T.gb + 2.4, at: () => GB_CENTER, side: -1, dy: 40, bg: BILE_C},
  {text: 'RUỘT NON', from: W(10, 'ruột'), to: E(10) + 0.9, at: () => INTESTINE.getPointAt(0.12), side: 1, dy: 50, bg: '#E58A7B'},
  {text: 'KHOẢNG 3 THÁNG', from: T.months, to: T.months + 1.9, at: () => LIVER_C.clone().add(V(0, 1.2, 1.2)), side: 1, dy: -220, bg: '#E8743B'},
  {text: 'TIÊM NGỪA VIÊM GAN B', from: W(12, 'viêm') - 0.1, to: E(12) - 0.1, at: () => LL.c.clone().add(V(1.0, 1.0, 0.8)), side: 1, dy: -180, bg: BILE_C},
  {text: 'HẠN CHẾ RƯỢU BIA', from: T.alcohol + 0.15, to: E(12) - 0.1, at: () => LIVER_C.clone().add(V(-4.0, 1.0, 0.5)), side: -1, dy: -150, bg: BILE_C},
];

const PILL_H = 74;
const FS = 40;
const PillLabel = ({p, t, frame}: {p: Pill; t: number; frame: number}) => {
  if (t < p.from - 0.05 || t > p.to + 0.3) return null;
  const s = spring({frame: frame - Math.round(p.from * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
  const out = clamp01((t - p.to) / 0.25);
  const a = project(t, p.at());
  const w = p.text.length * FS * 0.66 + 64;
  const cx = Math.max(w / 2 + 24, Math.min(1056 - w / 2, a.x + p.side * (170 + w / 2)));
  const cy = Math.max(235, Math.min(1090, a.y + (p.dy ?? 0)));
  const ex = a.x < cx - w / 2 ? cx - w / 2 : a.x > cx + w / 2 ? cx + w / 2 : a.x;
  const ey = ex === cx - w / 2 || ex === cx + w / 2 ? cy : a.y < cy ? cy - PILL_H / 2 : cy + PILL_H / 2;
  const sc = Math.min(1.08, s) * (1 - out);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
        <g opacity={Math.min(1, s)}>
          <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
          <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke={NAVY} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={a.x} cy={a.y} r={14} fill="#fff" stroke={NAVY} strokeWidth={4.5} />
        </g>
      </svg>
      <div style={{position: 'absolute', left: cx - w / 2, top: cy - PILL_H / 2, width: w, height: PILL_H, transform: `scale(${sc})`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, border: '5px solid #fff', borderRadius: 38, boxShadow: '0 6px 0 rgba(18,59,99,0.35)', fontFamily: FONT, fontWeight: 900, fontSize: FS, color: '#fff', whiteSpace: 'nowrap', letterSpacing: 1, textShadow: '0 2px 0 rgba(0,0,0,0.28)'}}>
        {p.text}
      </div>
    </>
  );
};

/* ---------- chữ lớn cam viền trắng ---------- */
type Big = {text: string; from: number; to: number; size?: number; y?: number};
export const BIGS: Big[] = [
  {text: 'HÀNG TRĂM VIỆC', from: W(1, 'hàng') - 0.1, to: W(1, 'mà') + 0.2},
  {text: 'TỰ TÁI TẠO!', from: T.regen - 0.1, to: T.cut - 0.5},
  {text: 'CHÚC MỪNG!', from: W(13, 'CHÚC') - 0.05, to: E(13) + 0.9},
  {text: 'BẠN VỪA LẮP XONG MỘT LÁ GAN!', from: W(13, 'Bạn') - 0.05, to: E(13) + 0.9, size: 46, y: 405},
];
const BigText = ({b, t, frame}: {b: Big; t: number; frame: number}) => {
  if (t < b.from - 0.05 || t > b.to + 0.3) return null;
  const s = spring({frame: frame - Math.round(b.from * FPS), fps: FPS, config: {damping: 10, stiffness: 150}});
  const out = clamp01((t - b.to) / 0.3);
  const {lines, size} = layoutLabel(b.text, b.size);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: b.y ?? 270, display: 'flex', justifyContent: 'center', transform: `scale(${Math.min(1.08, s) * (1 - out * 0.3)}) rotate(-3deg)`, opacity: 1 - out}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.18, textAlign: 'center', whiteSpace: 'nowrap', color: ORANGE, WebkitTextStroke: '16px #fff', paintOrder: 'stroke fill', letterSpacing: 1, textShadow: '0 10px 0 rgba(18,59,99,0.3)'}}>
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

/* ---------- nét chém khi cắt ---------- */
const Slash = ({t}: {t: number}) => {
  const p = (t - T.cut) / 0.35;
  if (p < 0 || p > 1.6) return null;
  const draw = clamp01(p);
  const fade = 1 - clamp01((p - 0.7) / 0.9);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: fade}}>
      <line x1={120} y1={330} x2={120 + 840 * draw} y2={330 + 640 * draw} stroke="#fff" strokeWidth={26} strokeLinecap="round" />
      <line x1={120} y1={330} x2={120 + 840 * draw} y2={330 + 640 * draw} stroke={ORANGE} strokeWidth={12} strokeLinecap="round" />
    </svg>
  );
};

/* ---------- nền: hạt tròn trôi chậm, tạo không gian ---------- */
const BUBBLES = Array.from({length: 16}, (_, i) => ({x: (i * 173) % 1000, y: (i * 311) % 1920, r: 8 + ((i * 37) % 26), sp: 10 + ((i * 13) % 17), ph: i}));
export const Bubbles = ({t}: {t: number}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    {BUBBLES.map((b, i) => (
      <circle key={i} cx={b.x + 28 * Math.sin(t * 0.5 + b.ph)} cy={(((b.y - t * b.sp) % 1920) + 1920) % 1920} r={b.r} fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
    ))}
  </svg>
);

/* ---------- âm thanh ---------- */
export const sfxList = (): Sfx[] => [
  {t: 0.3, src: 'sfx/whoosh-02.wav', v: 0.22},
  ...[0, 2, 4, 6].map((i) => ({t: T.ribs0 + 0.28 * i + 0.3, src: 'sfx/click-01.wav', v: 0.18})),
  {t: T.liverDrop + 0.3, src: 'sfx/pop-03.wav', v: 0.4},
  {t: T.leftLobe + 0.3, src: 'sfx/pop-01.wav', v: 0.35},
  {t: T.portal, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.artery, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.hepatic, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.zoomIn, src: 'sfx/riser-01.wav', v: 0.2},
  {t: T.gb, src: 'sfx/pop-03.wav', v: 0.4},
  {t: T.cut, src: 'sfx/splash-01.wav', v: 0.3},
  {t: T.regrow, src: 'sfx/ding-01.wav', v: 0.3},
  {t: T.party, src: 'sfx/ding-01.wav', v: 0.35},
  ...PILLS.map((p) => ({t: p.from, src: 'sfx/pop-01.wav', v: 0.3})),
];

export const GanOverlay = ({t, frame}: {t: number; frame: number}) => (
  <AbsoluteFill>
    <Slash t={t} />
    {PILLS.map((p, i) => (
      <PillLabel key={i} p={p} t={t} frame={frame} />
    ))}
    {BIGS.map((b, i) => (
      <BigText key={i} b={b} t={t} frame={frame} />
    ))}
    <Captions t={t} tl={timeline} />
    <Watermark t={t} tl={timeline} />
    <Outro t={t} tl={timeline} />
    <Mix tl={timeline} sfx={sfxList()} />
  </AbsoluteFill>
);
