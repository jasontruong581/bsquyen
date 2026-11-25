import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Captions, Labels, Outro, Watermark} from '../../common/overlays';
import {useFonts} from '../../common/fonts';
import {Mix, type Sfx} from '../../common/mix';
import {FPS, P, lerp} from '../../timeline';
import {BreathInset, Chart, Question, Steps} from './overlays';
import {Stomach} from './Stomach';
import {S, W, timeline} from './timeline';
import {WallSection} from './WallSection';

export const id = 'hp-va-da-day';
export const durationInFrames = Math.ceil(timeline.total * FPS);

type Key = [number, number, number, number]; // [mốc, tâm x, tâm y, độ phóng]
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

const keysB = (): Key[] => [
  [S(2), 540, 1000, 1.0],
  [W(2, 'niêm'), 540, 1120, 1.08],
  [S(3) - 0.2, 540, 640, 1.0],
  [W(3, 'hp'), 540, 600, 1.3],
  [S(4) + 0.8, 540, 700, 1.35],
  [W(4, 'nhầy') + 0.3, 540, 940, 1.35],
  [W(4, 'kiềm'), 540, 940, 1.5],
  [S(5) + 0.2, 540, 980, 1.0],
  [W(6, 'mỏng') - 0.2, 540, 1150, 1.1],
  [W(6, 'ung') - 0.2, 680, 1200, 1.35],
  [S(7) + 0.2, 540, 1000, 1.0],
  [S(8), 540, 900, 1.0],
];

const sfx: Sfx[] = [
  {t: S(2) - 0.35, src: 'sfx/whoosh-02.wav', v: 0.45},
  {t: S(9) - 0.35, src: 'sfx/whoosh-02.wav', v: 0.45},
  {t: S(7), src: 'sfx/ding-01.wav', v: 0.4},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  {t: W(9, 'xét'), src: 'sfx/pop-03.wav', v: 0.35},
  {t: W(9, 'điều'), src: 'sfx/pop-03.wav', v: 0.35},
  {t: W(9, 'kiểm'), src: 'sfx/pop-03.wav', v: 0.35},
];

export const HpVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  /* camera thế giới A (dạ dày): mở đầu đẩy nhẹ, rồi lao vào thành dạ dày; cuối video lùi ra */
  const easeIn = Easing.in(Easing.cubic);
  let camA = {x: 575, y: 700, s: lerp(1, 1.07, P(t, 0, S(2)))};
  if (t >= S(2) - 0.3 && t < S(9) - 0.25) {
    const p = interpolate(t, [S(2) - 0.3, S(2) + 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
    camA = {x: lerp(575, 300, p), y: lerp(700, 800, p), s: lerp(1.07, 6, p)};
  } else if (t >= S(9) - 0.25) {
    const p = P(t, S(9) - 0.25, 1.1);
    camA = {x: lerp(300, 575, p), y: lerp(800, 1263, p), s: lerp(5, 0.62, p)};
  }
  const opA = (1 - P(t, S(2) + 0.15, 0.5)) + P(t, S(9) - 0.05, 0.45);
  const danger = P(t, W(1, 'tiêu') - 0.2, 0.6) * (1 - P(t, S(2), 0.3));

  /* thế giới B (lát cắt thành dạ dày) */
  const inB = P(t, S(2) - 0.05, 0.75);
  const outB = P(t, S(9) - 0.25, 0.8);
  const opB = P(t, S(2) + 0.05, 0.55) * (1 - P(t, S(9) - 0.05, 0.5));
  const mB = lerp(0.5, 1, inB) * lerp(1, 0.35, outB);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {opA > 0.001 && (
          <g opacity={Math.min(1, opA)} transform={view(camA)}>
            <Stomach t={t} danger={danger} />
          </g>
        )}
        {opB > 0.001 && (
          <g opacity={opB} transform={`translate(540 900) scale(${mB}) translate(-540 -900)`}>
            <g transform={view(camera(t, keysB()))}>
              <WallSection t={t} />
            </g>
          </g>
        )}
      </svg>
      <Question t={t} frame={frame} />
      <Chart t={t} />
      <BreathInset t={t} />
      <Steps t={t} frame={frame} />
      <Labels t={t} frame={frame} tl={timeline} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
