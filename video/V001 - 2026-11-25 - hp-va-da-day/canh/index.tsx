import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P, lerp} from '../../src/timeline';
import {hpHead} from './Bacteria';
import {BreathInset, Chart, Corkscrew, Hook, Question, Steps} from './overlays';
import {Stomach} from './Stomach';
import {S, E, W, timeline} from './timeline';
import {WallSection, acidImpacts, bugsAt} from './WallSection';

export const id = 'hp-va-da-day';
export const durationInFrames = Math.ceil(timeline.total * FPS);

type Key = [number, number, number, number]; // [mốc rời khỏi khung này, tâm x, tâm y, độ phóng]
const camera = (t: number, keys: Key[]) => {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  if (!b || t < a[0]) return {x: a[1], y: a[2], s: a[3]};
  const p = P(t, a[0], Math.min(1.4, b[0] - a[0]));
  return {x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p), s: lerp(a[3], b[3], p)};
};
const view = (c: {x: number; y: number; s: number}) => `translate(${540 - c.x * c.s} ${900 - c.y * c.s}) scale(${c.s})`;

/* camera thế giới B: cận lớp nhầy -> HP rơi xuống -> lao vào nhầy -> lùi ra thấy cả hàng tế bào -> áp sát tế bào bị đổi -> lùi ra */
const keysB = (): Key[] => [
  [S(2), 540, 980, 1.05],
  [S(2) + 1.2, 540, 960, 1.1],
  [W(3, 'rơi') - 0.5, 540, 800, 1.0],
  [W(3, 'kẻ'), 540, 800, 1.0],
  [W(3, 'kẻ') + 1.4, 540, 640, 1.25],
  [W(4, 'xoáy'), 540, 640, 1.25],
  [W(4, 'nhầy') + 0.3, 540, 940, 1.5],
  [S(5) - 0.3, 540, 940, 1.5],
  [S(5) + 0.5, 540, 1250, 1.0],
  [W(6, 'chỉ') - 0.4, 540, 1250, 1.0],
  [W(6, 'chỉ') + 1.0, 695, 1200, 1.4],
  [S(7) - 0.5, 695, 1200, 1.4],
  [S(7) + 0.5, 540, 1250, 1.0],
];

/* điểm neo bong bóng thoại: HP chính ở thế giới B, hoặc đầu HP trong khung tròn ở cảnh 8 */
type Who = 'hp' | 'khung';
const bubbles: (BubbleSpec & {who: Who; v?: number})[] = [
  {at: W(3, 'hp') + 0.1, dur: 1.9, text: 'Chào cả nhà!', who: 'hp'},
  {at: W(4, 'cho') - 0.15, dur: 1.4, text: 'Axit à? Chuyện nhỏ!', who: 'hp'},
  {at: W(5, 'năm') - 0.05, dur: 1.3, text: 'Ở đây ấm, ở lì thôi~', who: 'hp'},
  {at: W(7, 'hp') - 0.05, dur: 0.55, text: 'Á á á!', who: 'hp', size: 0.7, v: 0.2},
  {at: W(8, 'ợ'), dur: 1.4, text: 'Ợ… lộ rồi!', who: 'khung'},
];

const sfx: Sfx[] = [
  {t: S(2) - 0.35, src: 'sfx/whoosh-02.wav', v: 0.45},
  {t: S(9) - 0.35, src: 'sfx/whoosh-02.wav', v: 0.45},
  {t: W(1, 'sao'), src: 'sfx/pop-01.wav', v: 0.35},
  {t: W(3, 'tan'), src: 'sfx/splash-01.wav', v: 0.25},
  {t: W(7, 'tin'), src: 'sfx/ding-01.wav', v: 0.4},
  ...acidImpacts(W(2, 'axit') - 0.2, E(2) + 0.2).map((t) => ({t, src: 'sfx/ping-01.wav', v: 0.3})),
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: b.v ?? 0.4})),
  {t: W(9, 'xét'), src: 'sfx/pop-03.wav', v: 0.35},
  {t: W(9, 'điều'), src: 'sfx/pop-03.wav', v: 0.35},
  {t: W(9, 'kiểm'), src: 'sfx/pop-03.wav', v: 0.35},
];

export const HpVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  /* camera thế giới A (dạ dày trong bồn axit): mở đầu đẩy nhẹ, rồi lao vào thành dạ dày; cuối video lùi ra, dạ dày nhẹ nhõm */
  const easeIn = Easing.in(Easing.cubic);
  let camA = {x: 560, y: 977, s: lerp(1, 1.06, P(t, 0, S(2)))};
  if (t >= S(2) - 0.3 && t < S(9) - 0.25) {
    const p = interpolate(t, [S(2) - 0.3, S(2) + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
    camA = {x: lerp(560, 300, p), y: lerp(977, 800, p), s: lerp(1.06, 6, p)};
  } else if (t >= S(9) - 0.25) {
    const p = P(t, S(9) - 0.25, 1.1);
    camA = {x: lerp(300, 560, p), y: lerp(800, 652, p), s: lerp(5, 0.45, p)};
  }
  const opA = (1 - P(t, S(2) + 0.15, 0.5)) + P(t, S(9) - 0.05, 0.45);
  const danger = P(t, W(1, 'tiêu') - 0.2, 0.6) * (1 - P(t, S(2), 0.3));
  const relief = P(t, S(9) + 0.1, 0.5);

  /* thế giới B (lát cắt thành dạ dày) */
  const inB = P(t, S(2) - 0.05, 0.75);
  const outB = P(t, S(9) - 0.25, 0.8);
  const opB = P(t, S(2) + 0.05, 0.55) * (1 - P(t, S(9) - 0.05, 0.5));
  const mB = lerp(0.5, 1, inB) * lerp(1, 0.35, outB);
  const camB = camera(t, keysB());

  /* toạ độ màn hình của HP chính (để đặt bong bóng thoại) */
  const bug = bugsAt(t)[0];
  const toScreen = (wx: number, wy: number) => {
    const vx = 540 + (wx - camB.x) * camB.s;
    const vy = 900 + (wy - camB.y) * camB.s;
    return {x: 540 + (vx - 540) * mB, y: 900 + (vy - 900) * mB};
  };
  const hpScreen = toScreen(bug.x, bug.y - 40);
  const khungHead = hpHead({x: 520, y: 830, angle: 0, scale: 1.6, t, spin: 9});

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {opA > 0.001 && (
          <g opacity={Math.min(1, opA)} transform={view(camA)}>
            <Stomach t={t} danger={danger} relief={relief} />
          </g>
        )}
        {opB > 0.001 && (
          <g opacity={opB} transform={`translate(540 900) scale(${mB}) translate(-540 -900)`}>
            <g transform={view(camB)}>
              <WallSection t={t} />
            </g>
          </g>
        )}
      </svg>
      <Hook t={t} frame={frame} />
      <Question t={t} frame={frame} />
      <Corkscrew t={t} frame={frame} />
      <Chart t={t} />
      <BreathInset t={t} />
      <Steps t={t} frame={frame} />
      {bubbles.map((b, i) => {
        const a = b.who === 'hp' ? hpScreen : {x: khungHead.x - 120, y: khungHead.y - 40};
        return <Bubble key={i} t={t} frame={frame} at={b.at} dur={b.dur} text={b.text} size={b.size} x={a.x} y={a.y} />;
      })}
      <Labels t={t} frame={frame} tl={timeline} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
