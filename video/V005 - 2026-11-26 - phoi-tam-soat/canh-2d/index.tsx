/* V005 bản 2D: cùng kịch bản, thời gian và lớp phủ với bản 3D (chung/), cảnh nền vẽ bằng SVG.
   Một mô hình phổi + cây phế quản, camera liên tục: trượt xuống khí quản, vào phế quản phải, mở lăng kính phóng đại phế nang,
   thu ra thấy hai phổi, xoay nhẹ, lùi ra thân người mờ, quay lại gần cho cảnh cuối. */
import {AbsoluteFill} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {useFonts} from '../../src/common/fonts';
import {FPS, P, lerp} from '../../src/timeline';
import {NAVY} from '../../src/common/overlays';
import {PhoiOverlay, NODULE_NEUTRAL, NODULE_ORANGE, dimAt, sfxList, type Anchors} from '../chung/lop-phu';
import {E, NODE_NEUTRAL_AT, NODULE_LEVEL, S, SCAN_FROM, SCAR, T_NODE, W, ringAt, smooth, timeline} from '../chung/timeline';
import {Body, Defs, HERO_LEAF, Lens, Lungs, RING, RingBack, RingFront, RingSlice} from './giai-phau-2d';

export const id = 'phoi-2d';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const sm = (t: number, a: number, d: number) => smooth(P(t, a, d, (x) => x));

/* ---------- camera ---------- */
type Cam = {x: number; y: number; s: number; rot: number};
const T_LENS0 = 3.9;
const T_LENS1 = 7.8;
const T_OUT = 9.4;
const cameraAt = (t: number): Cam => {
  const hero = {x: HERO_LEAF.x, y: HERO_LEAF.y};
  if (t < T_LENS0) {
    // trượt xuống khí quản, qua ngã ba, tới đầu mút thuỳ dưới phổi phải (đi dọc đường gấp khúc theo tiến độ làm mượt)
    const p = sm(t, 0, T_LENS0);
    const l1 = 360;
    const l2 = Math.hypot(hero.x, hero.y + 160);
    const d = p * (l1 + l2);
    if (d < l1) return {x: 0, y: lerp(-520, -160, d / l1), s: lerp(3.4, 2.6, d / l1), rot: 0};
    const q = (d - l1) / l2;
    return {x: lerp(0, hero.x, q), y: lerp(-160, hero.y, q), s: lerp(2.6, 3.5, q), rot: 0};
  }
  if (t < T_LENS1) return {x: hero.x, y: hero.y, s: 3.5 + 0.05 * (t - T_LENS0), rot: 0};
  const rot = 2.4 * Math.sin((t - T_OUT) * 0.2) * sm(t, T_OUT, 1.5);
  if (t < T_OUT) {
    const p = sm(t, T_LENS1, T_OUT - T_LENS1);
    return {x: lerp(hero.x, 0, p), y: lerp(hero.y, 0, p), s: lerp(3.55, 1.2, p), rot: 0};
  }
  const far = sm(t, S(8) + 0.1, 5.0);
  const back = sm(t, S(10) - 0.6, 3.6);
  const drift = 0.05 * Math.sin((t - T_OUT) * 0.25);
  return {x: 0, y: lerp(lerp(0, 170, far), 10, back), s: lerp(lerp(1.2 + drift, 0.55, far), 1.3, back), rot};
};

const toScreen = (c: Cam, x: number, y: number) => {
  const r = (c.rot * Math.PI) / 180;
  const dx = x - c.x;
  const dy = y - c.y;
  return {x: 540 + c.s * (dx * Math.cos(r) - dy * Math.sin(r)), y: 700 + c.s * (dx * Math.sin(r) + dy * Math.cos(r))};
};

const Y_BOTTOM = 420;
const Y_RANGE = 860;
const levelToY = (l: number) => Y_BOTTOM - Y_RANGE * l;
const NODULE = {x: -190, y: levelToY(NODULE_LEVEL)};

/* hạt bay chậm ở nền */
const DOTS = Array.from({length: 16}, (_, i) => ({x: (i * 241) % 1080, y: (i * 577) % 1920, r: 5 + (i % 4) * 3, sp: 8 + (i % 5) * 4}));

export const Phoi2dVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam = cameraAt(t);
  const ring = ringAt(t);
  const ringY = levelToY(ring.level);
  const dim = dimAt(t);

  /* lăng kính phóng đại phế nang */
  const lensR = 520 * sm(t, T_LENS0 - 0.2, 0.8) * (1 - sm(t, T_LENS1, 0.6));
  const nerve = sm(t, W(2, 'ít') - 0.2, 0.6);

  /* nốt phổi */
  const nodVis = t >= T_NODE - 0.1 && t <= SCAR.to;
  const nodGrow = sm(t, T_NODE - 0.1, 0.25);
  const neutral = sm(t, NODE_NEUTRAL_AT, 0.4);
  const scanning = t >= SCAN_FROM - 0.2 && t < E(5) + 0.8;
  const trailFade = 1 - sm(t, E(5) - 0.2, 0.6);

  const anchors: Anchors = {
    ct: null,
    nodule: {...toScreen(cam, NODULE.x, NODULE.y), u: cam.s},
    face: {eyeL: toScreen(cam, -165, -70), eyeR: toScreen(cam, 165, -70), mouth: toScreen(cam, 0, 70), u: 150 * cam.s},
    lungs: {...toScreen(cam, 0, 0), u: cam.s * 170},
  };
  if (ring.k > 0.04) {
    const p = toScreen(cam, 0, ringY + ring.k * (RING.ry + RING.h / 2));
    anchors.ct = {x: p.x, y: p.y, u: 105 * ring.k * cam.s * 1.15};
  }

  const bodyOp = 0.5 + 0.5 * sm(t, S(8), 3);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)'}}>
      {/* nền có không gian: vầng sáng + hạt bay chậm */}
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 38%, rgba(255,214,190,0.55) 0%, rgba(255,214,190,0) 60%)'}} />
      <AbsoluteFill style={{filter: dim > 0.01 ? `blur(${(6 * dim).toFixed(1)}px)` : undefined}}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Defs />
          {DOTS.map((d, i) => (
            <circle key={i} cx={(d.x + 40 * Math.sin(t * 0.3 + i)) % 1080} cy={(((d.y - t * d.sp) % 1920) + 1920) % 1920} r={d.r} fill="#F9A05F" opacity={0.22} />
          ))}
          <g transform={`translate(540 700) rotate(${cam.rot}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`}>
            <Body opacity={bodyOp} />
            {ring.k > 0.01 && <RingBack y={ringY} k={ring.k} />}
            <Lungs t={t} />
            {nodVis && (
              <g transform={`translate(${NODULE.x} ${NODULE.y}) scale(${nodGrow})`}>
                <circle r={26 * (1 + 0.15 * Math.sin(t * 7))} fill={NODULE_ORANGE} opacity={(1 - neutral) * 0.35} />
                <circle r={14} fill={NAVY} />
                <circle r={10.5} fill={neutral > 0.5 ? NODULE_NEUTRAL : NODULE_ORANGE} />
                <circle cx={-3} cy={-3.5} r={3} fill="#fff" opacity={0.7} />
              </g>
            )}
            {scanning &&
              Array.from({length: 12}, (_, i) => {
                const y = levelToY(1 - (i + 0.5) / 12);
                if (!(ringY > y + 6) || trailFade < 0.01) return null;
                return <ellipse key={i} cx={0} cy={y + RING.h * 0.4 * ring.k} rx={RING.ri - 30} ry={RING.rj - 14} fill="none" stroke="#5CC8EC" strokeWidth={4} opacity={0.4 * trailFade} />;
              })}
            {ring.k > 0.01 && scanning && <RingSlice y={ringY} k={ring.k} a={1} />}
            {ring.k > 0.01 && <RingFront y={ringY} k={ring.k} />}
          </g>
          {/* lăng kính phóng đại phế nang */}
          {lensR > 4 && (
            <g transform="translate(540 720)">
              <clipPath id="lensClip">
                <circle r={lensR} />
              </clipPath>
              <circle r={lensR + 14} fill={NAVY} />
              <g clipPath="url(#lensClip)" transform={`scale(${lensR / 520})`}>
                <Lens t={t} nerve={nerve} />
              </g>
              <path d={`M ${-lensR * 0.78} ${-lensR * 0.3} A ${lensR * 0.84} ${lensR * 0.84} 0 0 1 ${-lensR * 0.3} ${-lensR * 0.78}`} stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.7} />
            </g>
          )}
        </svg>
      </AbsoluteFill>
      <PhoiOverlay t={t} frame={frame} a={anchors} sfx={sfxList([{t: T_LENS0 - 0.1, src: 'sfx/whoosh-02.wav', v: 0.3}])} />
    </AbsoluteFill>
  );
};

