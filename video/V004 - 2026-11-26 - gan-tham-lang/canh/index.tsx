import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {BigLabel, Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P} from '../../src/timeline';
import {Card1, Card2} from './Cards';
import {Gan, ganHead} from './Gan';
import {BloodTube, Barbell, Probe, SymptomIcons, UsDefs, VIRUS_ARRIVE, Virus, VirusTag, virusAlpha, virusPos} from './Props';
import {E, S, W, nearUngThu, timeline} from './timeline';
import {Backdrop, Focus, GhostBody, LIVER_C, Liver, camera, fibrosis, toScreen, viewTransform, type Cam} from './World';

export const id = 'gan-tham-lang';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const smooth = (p: number) => p * p * (3 - 2 * p);

/* Bong bóng thoại: Gan (cảnh 1, 2, 8) và vi-rút B (cảnh 3). Không có bong bóng nào từ cảnh 4 tới hết cảnh 6, cũng không trong ±2 giây quanh chữ "ung thư". */
type Who = 'gan' | 'ganL' | 'virus';
const bubbles: (BubbleSpec & {who: Who})[] = [
  {at: 0.5, dur: 1.5, text: 'Ổn mà~', who: 'gan'},
  {at: S(2) + 1.9, dur: 1.4, text: 'Ổn mà~', who: 'gan'},
  {at: VIRUS_ARRIVE + 0.1, dur: 1.6, text: 'Ở nhờ chút nha~', who: 'virus'},
  {at: W(8, 'không') - 0.5, dur: 1.3, text: 'Nhột quá~', who: 'ganL'},
];

/* Hiệu ứng âm thanh: im lặng trong ±2 giây quanh chữ "ung thư" và suốt đoạn nghiêm (từ trước nhãn "UNG THƯ" 2 giây tới hết cảnh 6) */
const quiet = (t: number) => nearUngThu(t, 0.1) || (t >= W(5, 'Viêm') - 2.1 && t <= E(6) + 0.1);
const sfxAll: Sfx[] = [
  {t: 0.35, src: 'sfx/whoosh-02.wav', v: 0.22},
  {t: S(2) + 0.2, src: 'sfx/pop-03.wav', v: 0.3},
  {t: S(3) - 0.1, src: 'sfx/whoosh-02.wav', v: 0.3},
  {t: VIRUS_ARRIVE, src: 'sfx/ping-01.wav', v: 0.22},
  {t: S(7) + 0.05, src: 'sfx/ding-01.wav', v: 0.25},
  {t: W(7, '6'), src: 'sfx/ping-01.wav', v: 0.25},
  {t: S(8) - 0.2, src: 'sfx/click-01.wav', v: 0.35},
  {t: W(9, 'Làm') + 0.4, src: 'sfx/ding-01.wav', v: 0.35},
  {t: S(10) + 0.1, src: 'sfx/pop-03.wav', v: 0.4},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: 0.4})),
];
const sfx = sfxAll.filter((x) => !quiet(x.t));

/* Vùng được nhấn (phần còn lại mờ đi ~35%): tâm/bán kính theo toạ độ thế giới */
const focusAt = (t: number) => {
  const ramp = (a: number, b: number) => smooth(P(t, a, 0.5)) * (1 - smooth(P(t, b, 0.5)));
  if (t < S(3) - 0.3) return {x: LIVER_C.x - 140, y: LIVER_C.y - 140, r: 420, a: ramp(S(2) + 0.1, S(3) - 0.3) * 0.8};
  if (t < S(5)) return {x: LIVER_C.x - 100, y: LIVER_C.y - 20, r: 330, a: ramp(S(3), S(5) - 0.1)};
  if (t < S(6)) return {x: LIVER_C.x - 110, y: LIVER_C.y - 10, r: 400, a: ramp(S(5), S(6)) * 0.8};
  if (t < S(7)) return {x: 540, y: 960, r: 430, a: ramp(S(6) + 1.8, S(7) - 0.2) * 0.8};
  if (t < S(10)) return {x: LIVER_C.x + 180, y: LIVER_C.y - 140, r: 420, a: ramp(W(9, 'xét') - 0.2, S(10) - 0.1) * 0.8};
  return {x: 540, y: 700, r: 400, a: 0};
};

const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = 2.75;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="GAN IM LẶNG" size={96} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

export const GanVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam: Cam = camera(t);
  const fib = fibrosis(t);
  const va = virusAlpha(t);
  const vb = virusPos(t, 'b');
  const vc = virusPos(t, 'c');
  const talk = t < VIRUS_ARRIVE + 1.9;
  const heatA = va * smooth(P(t, W(3, 'Chúng') - 0.2, 1.2)) * (1 - 0.4 * smooth(P(t, S(4), 1)));
  const heat = [
    {x: vb.x - 10, y: vb.y + 10, a: heatA},
    {x: vc.x - 6, y: vc.y, a: heatA},
  ];
  const f = focusAt(t);
  const bodyDim = 0.95 - 0.1 * smooth(P(t, S(8) - 0.5, 0.5));

  const anchor = (who: Who) => {
    if (who === 'virus') {
      const s = toScreen(LIVER_C.x + vb.x, LIVER_C.y + vb.y, cam);
      return {x: s.x, y: s.y - 40 * cam.s};
    }
    const h = ganHead();
    const s = toScreen(LIVER_C.x + h.x, LIVER_C.y + h.y, cam);
    return {x: s.x - (who === 'ganL' ? 250 * cam.s : 0), y: s.y};
  };

  return (
    <AbsoluteFill style={{background: '#FFE5D3'}}>
      <Backdrop t={t} cam={cam} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <UsDefs />
        </defs>
        <GhostBody cam={cam} dim={bodyDim} t={t} />
        <g transform={viewTransform(cam)}>
          <Liver t={t} cam={cam} fib={fib} heat={heat}>
            <Barbell t={t} frame={frame} />
            <Gan t={t} />
            {va > 0.01 && (
              <g>
                <Virus x={vb.x} y={vb.y} tag="B" body="#7E57C2" spike="#B39DDB" t={t} talk={talk} alpha={va} rot={10} scale={1.15} />
                <Virus x={vc.x} y={vc.y} tag="C" body="#2BA39B" spike="#8FE0D5" t={t} talk={talk} alpha={va} rot={-8} scale={1.15} />
                {vb.p >= 1 && <VirusTag x={vb.x} y={vb.y} tag="B" alpha={va} />}
                {vc.p >= 1 && <VirusTag x={vc.x} y={vc.y} tag="C" alpha={va} />}
              </g>
            )}
            <Probe t={t} frame={frame} />
            <BloodTube t={t} frame={frame} />
          </Liver>
        </g>
      </svg>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <SymptomIcons t={t} frame={frame} />
      </svg>
      <Focus cam={cam} x={f.x} y={f.y} r={f.r} a={f.a} />
      <Card1 t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
      <Hook t={t} frame={frame} />
      {bubbles.map((b, i) => {
        const a = anchor(b.who);
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
