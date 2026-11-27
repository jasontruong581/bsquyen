/* Lớp phủ 2D của V012: nhãn có đường chỉ tới đúng bộ phận, chữ lớn cam viền trắng (như video mẫu), phụ đề, watermark, màn kết.
   Mọi nhãn nằm trong vùng an toàn Reels (y 235–1090, lề 24px), nằm trên phụ đề. */
import * as THREE from 'three';
import {AbsoluteFill, spring} from 'remotion';
import {FPS} from '../../src/timeline';
import {Captions, Outro, Watermark, FONT, layoutLabel} from '../../src/common/overlays';
import {Mix, type Sfx} from '../../src/common/mix';
import {ANUS_POS, COLON_CURVE, ESO_CURVE, GB_CENTER, LIVER_C, MOUTH_C, SI_CURVE, STO_CURVE, V} from './giai-phau';
import {project} from './may-quay';
import {heroWorld, stageWorld} from './san-khau';
import {T, W, E, clamp01, timeline} from './moc';

const NAVY = '#123b63';
const ORANGE = '#FF8A1F';

type Pill = {text: string; from: number; to: number; at: () => THREE.Vector3; side: 1 | -1; dy?: number; bg: string};
const PINK = '#E04B73';
const ESO_C = '#E07B12';
const STO_C = '#D9553A';
const SI_C = '#1FA865';
const COL_C = '#3F82E0';
const YEL = '#D99A00';
const PURPLE = '#7B4FE0';
const LIV_C = '#B8482E';
const BLOOD = '#D9323F';
const m = (v: THREE.Vector3, dx = 0, dy = 0, dz = 0) => v.clone().add(V(dx, dy, dz));

export const PILLS: Pill[] = [
  {text: 'RĂNG', from: T.teeth, to: T.teeth + 1.9, at: () => m(MOUTH_C, 0.5, 0.45), side: -1, dy: -150, bg: PINK},
  {text: 'LƯỠI', from: T.tongue, to: T.tongue + 1.9, at: () => m(MOUTH_C, -0.3, -0.45), side: 1, dy: 150, bg: PINK},
  {text: 'NƯỚC BỌT', from: T.saliva, to: T.saliva + 2.2, at: () => m(MOUTH_C, -0.55, 0.0), side: -1, dy: 90, bg: '#2F9FD8'},
  {text: 'ENZYM', from: T.enzymeMouth, to: T.enzymeMouth + 1.9, at: () => m(MOUTH_C, 0.6, -0.05), side: 1, dy: -120, bg: YEL},
  {text: 'THỰC QUẢN', from: T.esoph, to: T.esoph + 2.0, at: () => ESO_CURVE.getPointAt(0.4), side: -1, dy: -20, bg: ESO_C},
  {text: 'CO BÓP TỪNG ĐỢT', from: W(3, 'co'), to: W(3, 'co') + 2.1, at: () => ESO_CURVE.getPointAt(0.75), side: 1, dy: 120, bg: ESO_C},
  {text: 'DẠ DÀY', from: T.stomach, to: T.stomach + 1.9, at: () => STO_CURVE.getPointAt(0.45), side: -1, dy: 60, bg: STO_C},
  {text: 'HÌNH CHỮ J', from: W(4, 'chữ'), to: W(4, 'chữ') + 1.9, at: () => STO_CURVE.getPointAt(0.8), side: 1, dy: 130, bg: STO_C},
  {text: 'TUYẾN', from: T.glands, to: T.glands + 1.6, at: () => STO_CURVE.getPointAt(0.4), side: -1, dy: -130, bg: '#E0628B'},
  {text: 'AXIT', from: T.acid, to: T.acid + 1.9, at: () => STO_CURVE.getPointAt(0.55), side: 1, dy: -150, bg: PURPLE},
  {text: 'ENZYM', from: T.enzymeSt, to: T.enzymeSt + 1.9, at: () => STO_CURVE.getPointAt(0.38), side: -1, dy: 110, bg: YEL},
  {text: 'RUỘT NON', from: T.smallInt, to: T.smallInt + 1.9, at: () => SI_CURVE.getPointAt(0.45), side: 1, dy: -60, bg: SI_C},
  {text: 'TÁ TRÀNG', from: T.duo, to: T.duo + 1.7, at: () => SI_CURVE.getPointAt(0.06), side: -1, dy: -70, bg: SI_C},
  {text: 'HỖNG TRÀNG', from: T.jej, to: T.jej + 1.5, at: () => SI_CURVE.getPointAt(0.35), side: 1, dy: 40, bg: SI_C},
  {text: 'HỒI TRÀNG', from: T.ile, to: T.ile + 1.5, at: () => SI_CURVE.getPointAt(0.85), side: -1, dy: 100, bg: SI_C},
  {text: 'TỤY', from: T.pancreas, to: T.pancreas + 2.2, at: () => V(0.5, -0.5, -0.1), side: 1, dy: 90, bg: YEL},
  {text: 'GAN', from: T.liver, to: T.liver + 1.9, at: () => LIVER_C.clone().add(V(-0.4, 0.3, 0.4)), side: -1, dy: -90, bg: LIV_C},
  {text: 'TÚI MẬT', from: T.gallbladder, to: T.gallbladder + 2.2, at: () => GB_CENTER, side: -1, dy: 90, bg: SI_C},
  {text: 'NHUNG MAO', from: T.villiName, to: T.villiName + 2.0, at: () => heroWorld(1.0), side: 1, dy: -150, bg: SI_C},
  {text: 'MAO MẠCH NHỎ XÍU', from: T.capillary, to: T.capillary + 2.0, at: () => heroWorld(0.55), side: 1, dy: -190, bg: BLOOD},
  {text: 'CHẤT DINH DƯỠNG', from: W(9, 'Chất'), to: W(9, 'Chất') + 2.0, at: () => heroWorld(0.65), side: -1, dy: -60, bg: YEL},
  {text: 'ĐI NUÔI CƠ THỂ', from: T.carried, to: T.carried + 1.8, at: () => stageWorld(V(1.0, 0.3, 3.2)), side: -1, dy: 130, bg: BLOOD},
  {text: 'RUỘT GIÀ', from: T.colon, to: T.colon + 2.3, at: () => COLON_CURVE.getPointAt(0.12), side: 1, dy: 70, bg: COL_C},
  {text: 'HÚT BỚT NƯỚC', from: T.water, to: T.water + 2.0, at: () => COLON_CURVE.getPointAt(0.4), side: -1, dy: -150, bg: '#2F9FD8'},
  {text: 'VI KHUẨN', from: T.bacteria, to: T.bacteria + 1.8, at: () => COLON_CURVE.getPointAt(0.62), side: -1, dy: -30, bg: COL_C},
  {text: 'TRỰC TRÀNG', from: T.rectum, to: T.rectum + 2.0, at: () => COLON_CURVE.getPointAt(0.93), side: 1, dy: -110, bg: '#9A6A4A'},
  {text: 'HẬU MÔN', from: T.anus, to: T.anus + 1.8, at: () => ANUS_POS.clone().add(V(0, 0, 0.1)), side: -1, dy: 80, bg: '#9A6A4A'},
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
/** Ở toàn cảnh, chữ lớn đặt thấp hơn mặc định để không che miệng ở đầu mô hình */
const BIG_LOW = 370;
export const BIGS: Big[] = [
  {text: 'HÀNH TRÌNH BỮA CƠM', from: 0.15, to: T.mouthIn + 0.2},
  {text: 'BỀ MẶT RỘNG RA!', from: T.surface, to: T.surface + 2.3},
  {text: 'NHU ĐỘNG', from: T.peristalsis - 0.1, to: T.peristalsis + 3.0, y: BIG_LOW},
  {text: 'DÀI VÀI MÉT!', from: T.meters - 0.1, to: E(13) + 0.2, y: BIG_LOW},
  {text: 'CHÚC MỪNG!', from: W(15, 'CHÚC') - 0.05, to: E(15) + 0.9, y: BIG_LOW},
  {text: 'BẠN VỪA LẮP XONG HỆ TIÊU HÓA!', from: W(15, 'Bạn') - 0.05, to: E(15) + 0.9, size: 44, y: BIG_LOW + 135},
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
  {t: T.mouthIn + 0.9, src: 'sfx/pop-03.wav', v: 0.35},
  {t: T.teeth + 0.1, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.teeth + 0.5, src: 'sfx/click-01.wav', v: 0.14},
  {t: T.esoph - 0.15, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.stomach - 0.2, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.smallInt - 0.2, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.liver - 0.2, src: 'sfx/pop-03.wav', v: 0.35},
  {t: T.pancreas - 0.2, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.zoomIn, src: 'sfx/riser-01.wav', v: 0.2},
  {t: T.colon - 0.2, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.exit + 0.9, src: 'sfx/ding-01.wav', v: 0.22},
  {t: T.peristalsis, src: 'sfx/riser-01.wav', v: 0.16},
  {t: T.party, src: 'sfx/ding-01.wav', v: 0.35},
  ...PILLS.map((p) => ({t: p.from, src: 'sfx/pop-01.wav', v: 0.26})),
];

export const TieuHoaOverlay = ({t, frame}: {t: number; frame: number}) => (
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
