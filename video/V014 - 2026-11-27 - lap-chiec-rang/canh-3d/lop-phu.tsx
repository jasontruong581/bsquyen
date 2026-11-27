/* Lớp phủ 2D của V014: nhãn có đường chỉ tới đúng bộ phận, chữ lớn cam viền trắng, phụ đề, watermark, màn kết.
   Nhãn nằm trong vùng an toàn Reels (y 235–1090, lề 24px), trên phụ đề. Nhãn bám theo mốc lời đọc (moc.ts). */
import * as THREE from 'three';
import {AbsoluteFill, spring} from 'remotion';
import {FPS} from '../../src/timeline';
import {Captions, Outro, Watermark, FONT, layoutLabel} from '../../src/common/overlays';
import {Mix, type Sfx} from '../../src/common/mix';
import {NERVE_R, V, VESSEL_R} from './giai-phau';
import {TUBE_POSE, mirrorAt} from './hanh-trinh';
import {project} from './may-quay';
import {T, E, S, clamp01, timeline} from './moc';

const NAVY = '#123b63';
const ORANGE = '#FF8A1F';
const PINK = '#E04B73';
const GUM = '#D8567F';
const BLUE = '#3F82E0';
const DENT = '#C99A12';
const MINT = '#1FA87D';
const PURPLE = '#7B4FE0';
const NERVE = '#C99E00';
const RED = '#D9323F';
const TEAL = '#1B8FB0';

type Pill = {text: string; from: number; to: number; at: (t: number) => THREE.Vector3; side: 1 | -1; dy?: number; bg: string; /** vị trí tuyệt đối của nhãn (px), dùng khi ở cảnh phóng to cần xếp nhãn ra khỏi hình */ cx?: number; cy?: number};
const K = (v: THREE.Vector3) => () => v;
const PULP_A = V(0.55, 1.0, 0.04);
const HORN_A = NERVE_R.getPointAt(0.05).add(V(0, 0, 0.05));
const VES_A = VESSEL_R.getPointAt(0.06).add(V(0, 0, 0.05));
const DENTIN_A = V(1.28, 1.2, 0.03);
const ENAMEL_A = V(1.72, 1.6, 0.03);
const CEMENT_A = V(1.66, -0.5, 0.03);
const LIG_A = V(1.7, -1.5, 0.03);
const BONE_A = V(2.35, -2.5, 0.03);
const GUM_A = V(2.45, -0.3, 0.03);
const CROWN_L = V(-1.75, 1.4, 0.7);
const BAC_A = V(-0.8, 2.1, 1.1);
const WALL = (x: number, y: number) => V(x, y, 0.1);
const DECAY_A = V(0.62, 2.0, 0.15);
const DECAY_MID = V(0.6, 1.5, 0.15);
const PULP_TIP = V(0.7, 1.15, 0.15);

export const PILLS: Pill[] = [
  {text: 'TỦY RĂNG', from: T.pulp, to: T.pulp + 2.2, at: K(PULP_A), side: -1, dy: -170, bg: PINK},
  {text: 'MẠCH MÁU', from: T.vessels, to: T.vessels + 1.7, at: K(VES_A), side: 1, dy: 170, bg: RED},
  {text: 'DÂY THẦN KINH', from: T.nerve, to: T.nerve + 1.7, at: K(HORN_A), side: -1, dy: -250, bg: NERVE},
  {text: 'NGÀ RĂNG', from: T.dentin, to: T.dentin + 2.2, at: K(DENTIN_A), side: 1, dy: 120, bg: DENT},
  {text: 'MEN RĂNG', from: T.enamel, to: T.enamel + 1.9, at: K(ENAMEL_A), side: 1, dy: -130, bg: '#4A8FC4'},
  {text: 'CỨNG HƠN CẢ XƯƠNG', from: T.hardMore, to: T.hardMore + 1.8, at: K(ENAMEL_A), side: -1, dy: -260, bg: '#4A8FC4'},
  {text: '95% LÀ KHOÁNG CHẤT', from: T.mineral, to: T.mineral + 2.2, at: K(V(1.2, 2.1, 0.5)), side: -1, dy: 20, bg: '#4A8FC4'},
  {text: 'XÊ MĂNG', from: T.cement, to: T.cement + 1.9, at: K(CEMENT_A), side: 1, dy: -150, bg: '#A66B2C'},
  {text: 'XƯƠNG HÀM', from: T.bone, to: T.bone + 1.7, at: K(BONE_A), side: 1, dy: 90, bg: BLUE},
  {text: 'DÂY CHẰNG', from: T.ligament, to: T.ligament + 2.4, at: K(LIG_A), side: 1, dy: -190, bg: '#E07A1F'},
  {text: 'NƯỚU', from: T.gum, to: T.gum + 2.3, at: K(GUM_A), side: 1, dy: -100, bg: GUM},
  {text: 'MẢNG BÁM', from: T.plaque, to: T.plaque + 2.2, at: K(CROWN_L), side: -1, dy: 30, bg: PURPLE},
  {text: 'VI KHUẨN', from: T.bacteria, to: T.bacteria + 1.7, at: K(BAC_A), side: -1, dy: -60, bg: PURPLE},
  {text: 'ĐƯỜNG → AXIT', from: T.acid - 0.3, to: T.zoomIn + 0.2, at: K(BAC_A), side: 1, dy: -50, bg: PURPLE},
  {text: 'MEN = TƯỜNG KHOÁNG', from: T.wall, to: T.wall + 2.6, at: () => WALL(0.9, 1.3), side: -1, bg: '#4A8FC4', cx: 640, cy: 310},
  {text: 'AXIT RÚT KHOÁNG', from: T.leave - 0.3, to: T.leave + 2.0, at: () => WALL(-0.65, -0.45), side: 1, bg: PURPLE, cx: 540, cy: 1082},
  {text: 'ĐỐM TRẮNG', from: T.spot, to: T.spot + 2.0, at: () => WALL(0, 0.45), side: 1, bg: '#6B7A99', cx: 640, cy: 310},
  {text: 'SÂU RĂNG SỚM', from: T.early, to: T.early + 1.9, at: () => WALL(0.65, -0.45), side: -1, bg: '#6B7A99', cx: 540, cy: 1082},
  {text: 'NƯỚC BỌT', from: T.saliva, to: T.saliva + 1.8, at: () => WALL(-1.3, 1.35), side: 1, bg: TEAL, cx: 400, cy: 310},
  {text: 'FLO', from: T.flo - 0.05, to: T.flo + 1.8, at: () => WALL(1.3, 0.45), side: -1, bg: MINT, cx: 800, cy: 310},
  {text: 'CÓ THỂ DỪNG LẠI', from: T.stop, to: T.stop + 0.9, at: () => WALL(0, -0.45), side: -1, bg: MINT, cx: 540, cy: 1082},
  {text: 'LỖ SÂU', from: T.hole, to: T.hole + 2.0, at: K(DECAY_A), side: 1, dy: -200, bg: '#6A4B6E'},
  {text: 'MEN KHÔNG MỌC LẠI', from: T.lost, to: T.lost + 2.0, at: K(V(1.4, 2.3, 0.3)), side: -1, dy: -170, bg: '#4A8FC4'},
  {text: 'KHÔNG TỰ LÀNH', from: T.noHeal, to: T.noHeal + 1.5, at: K(DECAY_MID), side: 1, dy: -250, bg: '#6A4B6E'},
  {text: 'LAN VÀO NGÀ', from: T.spread, to: T.spread + 1.6, at: K(DECAY_MID), side: -1, dy: -210, bg: DENT},
  {text: 'TỚI TỦY', from: T.toPulp, to: T.toPulp + 1.5, at: K(PULP_TIP), side: 1, dy: 220, bg: PINK},
  {text: 'LÚC ĐẦU: CHƯA ĐAU', from: T.noPain, to: T.noPain + 1.9, at: K(DECAY_MID), side: -1, dy: -210, bg: MINT},
  {text: 'ĐAU RÕ KHI GẦN THẦN KINH', from: T.nearNerve, to: T.nearNerve + 1.4, at: K(HORN_A), side: 1, dy: 250, bg: NERVE},
  {text: 'KHÔNG ĐAU CHƯA CHẮC KHÔNG SÂU', from: T.notSure, to: T.notSure + 2.2, at: K(DECAY_MID), side: -1, bg: PURPLE, cx: 540, cy: 310},
  {text: 'ĐÁNH RĂNG HAI LẦN/NGÀY', from: T.twice - 0.2, to: T.twice + 2.6, at: () => V(-1.9, 1.4, 0.7), side: 1, bg: BLUE, cx: 540, cy: 262},
  {text: 'KEM CÓ FLO', from: T.fluoride, to: T.fluoride + 1.9, at: () => TUBE_POSE.clone().add(V(0, 0.4, 0)), side: -1, bg: MINT, cx: 700, cy: 1085},
  {text: 'LÀM SẠCH KẼ RĂNG', from: T.floss, to: T.floss + 1.2, at: () => V(2.05, 1.6, 0.4), side: -1, bg: TEAL, cx: 640, cy: 310},
  {text: 'HẠN CHẾ ĂN VẶT NGỌT', from: T.limit, to: T.limit + 2.0, at: () => V(-0.9, 2.9, 0.9), side: -1, bg: PURPLE, cx: 540, cy: 1085},
  {text: 'MỖI LẦN ĂN: THÊM AXIT', from: T.everyTime, to: T.everyTime + 2.2, at: () => V(0.2, 2.6, 0.7), side: 1, bg: PURPLE, cx: 540, cy: 1085},
  {text: 'HỎI NHA SĨ', from: T.ask, to: T.ask + 2.2, at: () => TUBE_POSE.clone(), side: -1, bg: BLUE, cx: 700, cy: 1085},
  {text: 'KHÁM RĂNG ĐỊNH KỲ', from: T.check, to: T.check + 1.9, at: (t) => mirrorAt(t).p, side: -1, bg: BLUE, cx: 340, cy: 310},
  {text: 'LỖ SÂU NHỎ: BẮT SỚM', from: T.detect, to: T.detect + 1.8, at: () => V(0.62, 2.1, 0.2), side: -1, bg: MINT, cx: 380, cy: 310},
];

const PILL_H = 74;
const FS = 40;
const PillLabel = ({p, t, frame}: {p: Pill; t: number; frame: number}) => {
  if (t < p.from - 0.05 || t > p.to + 0.3) return null;
  const s = spring({frame: frame - Math.round(p.from * FPS), fps: FPS, config: {damping: 12, stiffness: 170}});
  const out = clamp01((t - p.to) / 0.25);
  const a = project(t, p.at(t));
  const w = p.text.length * FS * 0.66 + 64;
  const cx = p.cx ?? Math.max(w / 2 + 24, Math.min(1056 - w / 2, a.x + p.side * (170 + w / 2)));
  const cy = p.cy ?? Math.max(235, Math.min(1090, a.y + (p.dy ?? 0)));
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
  {text: 'CỨNG NHẤT CƠ THỂ?', from: 0.15, to: T.mouth + 1.0, y: 270},
  {text: 'CHÚC MỪNG!', from: T.party + 0.1, to: E(18) + 0.9, y: 245},
  {text: 'BẠN VỪA LẮP XONG CHIẾC RĂNG!', from: T.party + 0.9, to: E(18) + 0.9, size: 44, y: 365},
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

/* ---------- âm thanh: nhẹ, không âm báo vui đè lên đoạn lỗ sâu và đau ---------- */
export const sfxList = (): Sfx[] => [
  {t: 0.3, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.build, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.pulp - 0.25, src: 'sfx/pop-03.wav', v: 0.3},
  {t: T.dentin - 0.7, src: 'sfx/pop-01.wav', v: 0.26},
  {t: T.enamel - 0.9, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.cement - 0.4, src: 'sfx/pop-03.wav', v: 0.26},
  {t: T.bone - 0.5, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.gum - 0.5, src: 'sfx/pop-01.wav', v: 0.26},
  {t: T.plaque, src: 'sfx/click-01.wav', v: 0.16},
  {t: T.zoomIn, src: 'sfx/riser-01.wav', v: 0.18},
  {t: T.fix, src: 'sfx/ping-01.wav', v: 0.16},
  {t: T.zoomOut, src: 'sfx/whoosh-02.wav', v: 0.2},
  {t: T.hole, src: 'sfx/click-01.wav', v: 0.14},
  {t: S(15), src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: T.brush, src: 'sfx/pop-03.wav', v: 0.26},
  {t: T.floss, src: 'sfx/click-01.wav', v: 0.16},
  {t: T.check, src: 'sfx/pop-01.wav', v: 0.22},
  {t: T.detect + 1.2, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.party, src: 'sfx/ding-01.wav', v: 0.35},
  ...PILLS.filter((p) => p.from < T.hole - 0.5 || p.from > T.notSure + 2.4).map((p) => ({t: p.from, src: 'sfx/pop-01.wav', v: 0.22})),
];

export const LapChiecRangOverlay = ({t, frame}: {t: number; frame: number}) => (
  <AbsoluteFill>
    {PILLS.map((p, i) => (
      <PillLabel key={i} p={p} t={t} frame={frame} />
    ))}
    {BIGS.map((b, i) => (
      <BigText key={i} b={b} t={t} frame={frame} />
    ))}
    <Captions t={t} tl={timeline} />
    <Watermark t={t} tl={timeline} />
    <Outro t={t} tl={timeline} note="Thêm bài kiến thức ở phần bình luận" />
    <Mix tl={timeline} sfx={sfxList()} />
  </AbsoluteFill>
);








