import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble} from '../../src/common/bubble';
import {BigLabel, Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P, lerp} from '../../src/timeline';
import {Card1, Card2} from './Cards';
import {T, loud, smooth, tinFace, tinPos, tinPose, tinWorry} from './Motion';
import {Doctor, Console, Ribbon, Signs, Stations} from './Props';
import {Tin} from './Tin';
import {E, S, W, timeline} from './timeline';
import {Backdrop, Brain, Cable, Body, FarLayer, Focus, Nerve, PainSpot, camera, toScreen, viewTransform, type Cam} from './World';

export const id = 'morphin-nghien';
export const durationInFrames = Math.ceil(timeline.total * FPS);

/* Cả video nằm trong vùng nghiêm (có chữ "đau", "nghiện", "ung thư", "di căn"): không mặt cười, không bong bóng hài, không tiếng vui.
   Duy nhất một bong bóng nhỏ "Tin khẩn!" lúc Tin bắt đầu chạy; Tin chỉ lo, im lặng, rồi nghỉ khi âm lượng hạ. */
const sfx: Sfx[] = [
  {t: T.run0, src: 'sfx/whoosh-02.wav', v: 0.2},
  {t: T.arrive, src: 'sfx/ping-01.wav', v: 0.22},
  ...T.st.map((t) => ({t, src: 'sfx/ping-01.wav', v: 0.18})),
  ...T.tag.map((t) => ({t, src: 'sfx/click-01.wav', v: 0.22})),
  {t: T.morphin, src: 'sfx/click-01.wav', v: 0.3},
  {t: S(5) + 0.15, src: 'sfx/whoosh-02.wav', v: 0.16},
  ...T.sign.map((t) => ({t, src: 'sfx/ping-01.wav', v: 0.2})),
  {t: T.split, src: 'sfx/click-01.wav', v: 0.2},
  {t: T.shield, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.doc, src: 'sfx/ping-01.wav', v: 0.2},
  {t: S(9) - 0.1, src: 'sfx/whoosh-02.wav', v: 0.16},
  {t: W(9, 'tự') - 0.1, src: 'sfx/click-01.wav', v: 0.25},
  {t: W(10, 'Follow'), src: 'sfx/ding-01.wav', v: 0.25},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/ping-01.wav', v: 0.18}))),
];

/* Vùng được nhấn (phần còn lại mờ đi ~35%): mốc [t, x, y, bán kính, độ đặc] theo toạ độ thế giới, nội suy mượt */
type FK = [number, number, number, number, number];
const FOCUS_KEYS: FK[] = [
  [0, 500, 700, 900, 0],
  [S(4) + 0.6, 60, 260, 520, 0],
  [S(4) + 1.4, 60, 270, 360, 0.7],
  [E(4) - 0.2, 60, 270, 360, 0.7],
  [S(5) + 0.9, 500, 660, 560, 0],
  [S(5) + 1.6, 500, 665, 430, 0.6],
  [E(7), 500, 700, 430, 0.6],
  [S(8) + 0.6, 480, 880, 400, 0.6],
  [E(8), 480, 880, 400, 0.6],
  [S(9) + 1.4, 60, 270, 560, 0],
  [S(10) + 1.5, 500, 700, 900, 0],
];
const focusAt = (t: number) => {
  const k = FOCUS_KEYS;
  if (t <= k[0][0]) return {x: k[0][1], y: k[0][2], r: k[0][3], a: k[0][4]};
  for (let i = 0; i < k.length - 1; i++) {
    if (t < k[i + 1][0]) {
      const p = smooth((t - k[i][0]) / (k[i + 1][0] - k[i][0]));
      return {x: lerp(k[i][1], k[i + 1][1], p), y: lerp(k[i][2], k[i + 1][2], p), r: lerp(k[i][3], k[i + 1][3], p), a: lerp(k[i][4], k[i + 1][4], p)};
    }
  }
  const l = k[k.length - 1];
  return {x: l[1], y: l[2], r: l[3], a: l[4]};
};

const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = 2.35;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="MORPHIN = NGHIỆN?" size={96} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

export const MorphinVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam: Cam = camera(t);
  const f = focusAt(t);
  const vol = loud(t);
  const pose = tinPose(t);
  const tp = tinPos(t);
  const face = tinFace(t);
  const tinScale = 1.2 + 0.25 * smooth(P(t, S(10) + 0.6, 1.2));
  const worry = tinWorry(t);
  const glow = smooth(P(t, T.arrive - 0.15, 0.3)) * (1 - smooth(P(t, T.arrive + 1.0, 1.0)));
  const calm = (1 - vol) * smooth(P(t, T.morphin + 0.5, 1.6));
  // bảng tổng đài mờ đi khi camera ở xa nó (cảnh 5–8) rồi hiện lại khi Tin quay về
  const consoleFade = 1 - 0.55 * smooth(P(t, E(4) + 0.1, 0.6)) * (1 - smooth(P(t, S(9) - 0.3, 0.9)));
  const lookTarget: [number, number] = t >= T.doc - 0.3 && t < S(9) ? [0.4, 0.5] : [0.8, 0.1];
  const tinScreen = toScreen(tp.x, tp.y - 135, cam);

  return (
    <AbsoluteFill style={{background: '#D3E0FA'}}>
      <Backdrop t={t} cam={cam} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <FarLayer cam={cam} t={t} />
        <g transform={viewTransform(cam)}>
          <Body t={t} />
          <Nerve t={t} vol={vol} />
          <Stations t={t} frame={frame} />
          <PainSpot t={t} vol={vol} />
          <Brain t={t} glow={glow} calm={calm} />
          <Cable t={t} />
          <Console t={t} frame={frame} fade={consoleFade} />
          <Signs t={t} frame={frame} />
          <Ribbon t={t} frame={frame} />
          <Doctor t={t} frame={frame} />
          <g transform={`translate(${tp.x.toFixed(1)} ${(tp.y - 14).toFixed(1)}) scale(${(tinScale * face).toFixed(3)} ${tinScale.toFixed(3)})`}>
            <Tin t={t} pose={pose} worry={worry} look={lookTarget} />
          </g>
        </g>
      </svg>
      <Focus cam={cam} x={f.x} y={f.y} r={f.r} a={f.a} />
      <Hook t={t} frame={frame} />
      <Card1 t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
      <Bubble t={t} frame={frame} at={T.run0 + 0.1} dur={1.5} text="Tin khẩn!" size={0.8} x={tinScreen.x} y={tinScreen.y} />
      <Labels t={t} frame={frame} tl={timeline} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
