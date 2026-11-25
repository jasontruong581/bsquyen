import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS} from '../../src/timeline';
import {Com} from './Com';
import {camera, closeAt, com1, com1Mood, com2, com2Mood, com2Visible, epiglottis, noEntry, scopeLen, squeezers, toScreen, valveOpenAt, valveShutAt, water} from './motion';
import {Cards, Cup, GoodBadge, Hook, ScopePills, Stairs, Veil} from './Overlays';
import {S, W, WE, timeline} from './timeline';
import {World} from './World';

export const id = 'nuot-nghen';
export const durationInFrames = Math.ceil(timeline.total * FPS);

/* Bong bóng thoại: neo vào Cơm thứ nhất (a) hoặc Cơm thứ hai (b) */
type Who = 'a' | 'b';
const bubbles: (BubbleSpec & {who: Who})[] = [
  {at: 0.5, dur: 1.7, text: 'Xuất phát!', who: 'a'},
  {at: W(3, 'đẩy') + 0.05, dur: 1.5, text: 'Wheee~', who: 'a'},
  {at: valveOpenAt + 1.0, dur: 1.2, text: 'Tới nơi!', who: 'a'},
  {at: S(5) + 1.05, dur: 1.9, text: 'Ơ, kẹt rồi…', who: 'b'},
];

/* Không hiệu ứng âm thanh trong ±2 giây quanh chữ "ung thư" (và im lặng suốt cảnh 8 cùng 2 giây sau chữ đó) */
const quietFrom = S(8) - 0.05;
const quietTo = WE(8, 'thư') + 2.05;
const quiet = (t: number) => t >= quietFrom && t <= quietTo;

const sfxAll: Sfx[] = [
  {t: W(1, 'nuốt') + 0.3, src: 'sfx/pop-01.wav', v: 0.3},
  {t: closeAt + 0.1, src: 'sfx/click-01.wav', v: 0.8},
  {t: closeAt + 0.3, src: 'sfx/ping-01.wav', v: 0.2},
  {t: W(3, 'đẩy') - 0.1, src: 'sfx/whoosh-02.wav', v: 0.25},
  {t: valveOpenAt + 0.05, src: 'sfx/pop-03.wav', v: 0.35},
  {t: valveShutAt + 0.05, src: 'sfx/click-01.wav', v: 0.5},
  {t: S(5) - 0.3, src: 'sfx/whoosh-02.wav', v: 0.4},
  {t: W(5, 'nước') - 0.1, src: 'sfx/splash-01.wav', v: 0.3},
  {t: W(7, 'lành'), src: 'sfx/ding-01.wav', v: 0.35},
  {t: W(9, 'biết'), src: 'sfx/ding-01.wav', v: 0.4},
  {t: S(10) + 0.1, src: 'sfx/pop-03.wav', v: 0.4},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: 0.4})),
];
const sfx = sfxAll.filter((x) => !quiet(x.t));

const view = (c: {x: number; y: number; s: number}) => `translate(${540 - c.x * c.s} ${700 - c.y * c.s}) scale(${c.s})`;

export const NuotNghenVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam = camera(t);
  const sq = squeezers(t);
  const c1 = com1(t);
  const c2 = com2(t);
  const wtr = water(t);

  /* neo bong bóng: đỉnh đầu Cơm trên màn hình */
  const anchor = (who: Who) => {
    const c = who === 'a' ? c1 : c2;
    const p = toScreen(c.x, c.y - 52, cam);
    return {x: p.x, y: p.y - 6 * cam.s};
  };

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={view(cam)}>
          <World t={t} sq={sq} epiglottis={epiglottis(t)} noEntry={noEntry(t)} water={wtr} scopeLen={scopeLen(t)} refluxFrom={W(7, 'lành')} refluxTo={S(8) + 0.4}>
            <Com x={c1.x} y={c1.y} sx={c1.sx} sy={c1.sy} rot={c1.rot} mood={com1Mood(t)} t={t} band={t < W(2, 'đầu') + 0.4} look={t > S(6) ? 1 : 0} />
            {com2Visible(t) && <Com x={c2.x} y={c2.y} sx={c2.sx} sy={c2.sy} rot={c2.rot} mood={com2Mood(t)} t={t} />}
          </World>
        </g>
      </svg>
      {/* mờ dần phần thế giới ở sát mép trên và từ y 1100 xuống: vùng dưới chỉ để nền */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: 'linear-gradient(180deg, rgba(255,249,244,0.95) 0px, rgba(255,249,244,0.95) 130px, rgba(255,249,244,0) 290px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1090, bottom: 0, background: 'linear-gradient(180deg, rgba(253,241,231,0) 0px, rgba(253,241,231,1) 330px)'}} />
      <Veil t={t} />
      <Hook t={t} frame={frame} />
      <Cards t={t} frame={frame} />
      <GoodBadge t={t} frame={frame} />
      <Stairs t={t} frame={frame} />
      <ScopePills t={t} frame={frame} />
      <Cup t={t} frame={frame} />
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
