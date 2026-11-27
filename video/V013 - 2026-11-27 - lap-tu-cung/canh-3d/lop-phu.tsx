/* Lớp phủ 2D của V013: nhãn có đường chỉ tới đúng bộ phận, chữ lớn cam viền trắng, phụ đề, watermark, màn kết.
   Nhãn nằm trong vùng an toàn Reels (y 235–1090, lề 24px), trên phụ đề. Nhãn bám theo mốc lời đọc (moc.ts). */
import * as THREE from 'three';
import {AbsoluteFill, spring} from 'remotion';
import {FPS} from '../../src/timeline';
import {Captions, Outro, Watermark, FONT, layoutLabel} from '../../src/common/overlays';
import {Mix, type Sfx} from '../../src/common/mix';
import {FOLLICLE_W, FUNNEL, PELVIS_LABEL, V, tubeCurve} from './giai-phau';
import {eggAt} from './hanh-trinh';
import {project} from './may-quay';
import {T, E, clamp01, timeline} from './moc';

const NAVY = '#123b63';
const ORANGE = '#FF8A1F';
const PINK = '#E04B73';
const ORG = '#E5780F';
const GREEN = '#1FA865';
const BLUE = '#3F82E0';
const YEL = '#C98E00';
const PURPLE = '#7B4FE0';
const LIME = '#7FA81F';

type Pill = {text: string; from: number; to: number; at: (t: number) => THREE.Vector3; side: 1 | -1; dy?: number; bg: string};
const OV_R = V(4.0, -0.7, 0.7);
const OV_L = V(-3.9, -0.7, 0.7);
const TUBE_R = tubeCurve(1);
const TUBE_L = tubeCurve(-1);
const K = (v: THREE.Vector3) => () => v;

export const PILLS: Pill[] = [
  {text: 'QUẢ LÊ', from: T.pearLabel, to: T.pearLabel + 1.8, at: K(V(0.8, 0.2, 0.5)), side: 1, dy: -150, bg: LIME},
  {text: 'KHUNG CHẬU', from: T.pelvis, to: T.pelvis + 1.0, at: K(PELVIS_LABEL), side: -1, dy: -170, bg: BLUE},
  {text: 'TỬ CUNG', from: T.uterusName, to: T.uterusName + 2.3, at: K(V(-1.55, 0.9, 0.65)), side: -1, dy: -120, bg: PINK},
  {text: 'LỚP CƠ DÀY', from: T.muscle, to: T.muscle + 1.8, at: K(V(1.55, 0.3, 0.65)), side: 1, dy: -130, bg: PINK},
  {text: 'CO BÓP', from: T.squeeze, to: T.squeeze + 1.4, at: K(V(-1.55, -0.2, 0.65)), side: -1, dy: 110, bg: PINK},
  {text: 'NỘI MẠC TỬ CUNG', from: T.liningName, to: T.liningName + 2.4, at: K(V(0.95, 0.1, 0.4)), side: 1, dy: -150, bg: '#D8306B'},
  {text: 'DÀY LÊN', from: T.liningThick, to: T.liningThick + 1.9, at: K(V(-0.85, -0.5, 0.4)), side: -1, dy: 130, bg: '#D8306B'},
  {text: 'BUỒNG TRỨNG', from: T.ovaries, to: T.ovaries + 2.0, at: K(OV_L), side: -1, dy: -230, bg: ORG},
  {text: 'CỠ QUẢ ÓC CHÓ', from: T.walnut, to: T.walnut + 1.9, at: K(OV_R), side: 1, dy: -230, bg: ORG},
  {text: 'HORMONE', from: T.hormone, to: T.hormone + 1.6, at: K(OV_R), side: -1, dy: 190, bg: YEL},
  {text: 'NANG TRỨNG', from: T.follicleName, to: T.follicleName + 2.0, at: () => FOLLICLE_W, side: 1, dy: -250, bg: ORG},
  {text: 'VÒI TRỨNG', from: T.tubes, to: T.tubes + 2.0, at: () => TUBE_L.getPointAt(0.45), side: -1, dy: -130, bg: GREEN},
  {text: 'DÀI 10–13 CM', from: T.length, to: T.length + 2.0, at: () => TUBE_R.getPointAt(0.5), side: 1, dy: -150, bg: GREEN},
  {text: 'TUA VÒI', from: T.fingersName, to: T.fingersName + 2.0, at: () => FUNNEL(1).add(V(-0.1, -0.5, 0.3)), side: -1, dy: 170, bg: GREEN},
  {text: 'NANG PHỒNG LÊN', from: T.bulge, to: T.bulge + 1.9, at: () => FOLLICLE_W, side: -1, dy: 190, bg: ORG},
  {text: 'RỤNG TRỨNG', from: T.burst, to: T.burst + 2.0, at: () => FOLLICLE_W, side: -1, dy: -230, bg: ORG},
  {text: 'TUA VÒI ĐÓN TRỨNG', from: T.catch, to: T.catch + 1.7, at: () => FUNNEL(1).add(V(0, -0.4, 0.3)), side: -1, dy: 190, bg: GREEN},
  {text: 'ĐI DỌC VÒI', from: T.travel + 0.4, to: T.travel + 2.3, at: (t) => eggAt(t).p, side: -1, dy: 190, bg: GREEN},
  {text: 'NƠI THỤ TINH', from: T.meet - 0.1, to: T.meet + 2.0, at: (t) => eggAt(t).p, side: -1, dy: 190, bg: YEL},
  {text: 'SẴN SÀNG NUÔI PHÔI', from: T.ready, to: T.ready + 2.0, at: K(V(-0.85, 0.1, 0.4)), side: -1, dy: -240, bg: '#D8306B'},
  {text: 'BONG RA', from: T.shed, to: T.shed + 1.4, at: K(V(0.9, 0.2, 0.4)), side: 1, dy: -160, bg: '#D8306B'},
  {text: 'KỲ KINH', from: T.period, to: T.period + 2.0, at: K(V(-0.85, -0.3, 0.4)), side: -1, dy: -150, bg: PINK},
  {text: 'CỔ TỬ CUNG', from: T.cervix, to: T.cervix + 1.9, at: K(V(0.62, -2.5, 0.62)), side: 1, dy: -200, bg: PURPLE},
  {text: 'ỐNG HẸP', from: T.canal, to: T.canal + 2.0, at: K(V(0, -3.05, 0.66)), side: -1, dy: 20, bg: PURPLE},
  {text: 'TẦM SOÁT ĐỊNH KỲ', from: T.screening, to: T.screening + 3.4, at: K(V(0.6, -2.9, 0.62)), side: 1, dy: 190, bg: PURPLE},
];

const PILL_H = 74;
const FS = 40;
const PillLabel = ({p, t, frame}: {p: Pill; t: number; frame: number}) => {
  if (t < p.from - 0.05 || t > p.to + 0.3) return null;
  const s = spring({frame: frame - Math.round(p.from * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
  const out = clamp01((t - p.to) / 0.25);
  const a = project(t, p.at(t));
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
  {text: 'BẰNG QUẢ LÊ?', from: 0.15, to: T.pearLabel + 1.4, y: 270},
  {text: 'KHÔNG DÍNH LIỀN!', from: T.notJoined - 0.1, to: T.notJoined + 2.2, y: 1025},
  {text: 'CHÚC MỪNG!', from: T.party + 0.1, to: E(15) + 0.9, y: 245},
  {text: 'BẠN VỪA LẮP XONG TỬ CUNG VÀ BUỒNG TRỨNG!', from: T.party + 0.9, to: E(15) + 0.9, size: 44, y: 365},
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

/* ---------- nền: hạt tròn trôi chậm ---------- */
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
  {t: 0.3, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.eggIn, src: 'sfx/pop-01.wav', v: 0.3},
  {t: T.pearAway, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.uterus, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.liningThin, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.liningThick, src: 'sfx/pop-01.wav', v: 0.22},
  {t: T.ovaries, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.follicles, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.tubes, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.fingersName, src: 'sfx/click-01.wav', v: 0.16},
  {t: T.zoom, src: 'sfx/riser-01.wav', v: 0.18},
  {t: T.burst, src: 'sfx/splash-01.wav', v: 0.2},
  {t: T.meet, src: 'sfx/ding-01.wav', v: 0.2},
  {t: T.ready, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.party, src: 'sfx/ding-01.wav', v: 0.35},
  ...PILLS.map((p) => ({t: p.from, src: 'sfx/pop-01.wav', v: 0.24})),
];

export const TuCungOverlay = ({t, frame}: {t: number; frame: number}) => (
  <AbsoluteFill>
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
