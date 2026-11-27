import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {BigLabel, Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P, lerp} from '../../src/timeline';
import {Card2, Chart} from './Cards';
import {Linh, LinhDefs, linhHead} from './Linh';
import {GapVirus, Magnifier, Medal, OrganDefs, Shield, medalState, type MedalKind} from './Props';
import {E, S, W, serious, timeline} from './timeline';
import {FLEE_AT, Hbv, Hpv, VirusDefs, virusPose} from './Virus';
import {Backdrop, FarLayer, Focus, MEDAL_X, MEDAL_Y, SURF, Wall, camera, toScreen, viewTransform, type Cam} from './World';

export const id = 'vac-xin-phong-ung-thu';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const smooth = (p: number) => p * p * (3 - 2 * p);
const win = (t: number, a: number, b: number, up = 0.4, down = 0.4) => smooth(P(t, a, up)) * (1 - smooth(P(t, b, down)));

/* Bong bóng thoại: chỉ ở đoạn vui sau cảnh 2 và trước cảnh 4 (Lính gác bắt quả tang, vi-rút "Á!"), .
   Không bong bóng nào trong hai cảnh [N] hay ±2 giây quanh chữ "ung thư" (kiểm bằng `serious` ở dưới). */
type Who = 'linh' | 'hbv';
const bubbles: (BubbleSpec & {who: Who})[] = [
  {at: W(3, 'nhận') - 0.3, dur: 0.7, text: 'Lộ rồi nhé!', who: 'linh'},
  {at: FLEE_AT + 0.1, dur: 0.4, text: 'Á!', who: 'hbv', size: 0.7},
];

/* Hiệu ứng âm thanh: im lặng trong ±2 giây quanh chữ "ung thư" và suốt hai cảnh [N] */
const quiet = (t: number) => serious(t, 0.1);
const sfxAll: Sfx[] = [
  {t: W(3, 'xem') - 0.15, src: 'sfx/ping-01.wav', v: 0.22},
  {t: FLEE_AT, src: 'sfx/whoosh-02.wav', v: 0.3},
  {t: W(5, '90') + 0.2, src: 'sfx/ping-01.wav', v: 0.25},
  {t: W(5, '5') + 0.05, src: 'sfx/ping-01.wav', v: 0.22},
  {t: W(6, 'tiêm') - 0.1, src: 'sfx/riser-01.wav', v: 0.2},
  {t: W(6, '24') + 0.35, src: 'sfx/ding-01.wav', v: 0.3},
  {t: W(8, 'Tuổi') + 0.8, src: 'sfx/pop-03.wav', v: 0.35},
  {t: W(8, 'tiêm') + 0.1, src: 'sfx/ding-01.wav', v: 0.22},
  {t: W(9, 'tầm') - 0.05, src: 'sfx/ping-01.wav', v: 0.25},
  {t: S(10) + 0.3, src: 'sfx/pop-03.wav', v: 0.35},
  {t: S(10) + 1.0, src: 'sfx/ding-01.wav', v: 0.25},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: 0.35})),
];
const sfx = sfxAll.filter((x) => !quiet(x.t));

/* Vùng được nhấn (phần còn lại nhạt đi ~35%): mốc [t, x, y, bán kính, độ đặc], nội suy mượt */
type FK = [number, number, number, number, number];
const FOCUS_KEYS: FK[] = [
  [0, 600, 700, 500, 0],
  [S(2) + 0.5, 650, 650, 460, 0],
  [S(2) + 1.5, 680, 640, 400, 0.8],
  [E(2), 700, 650, 440, 0.8],
  [S(3) + 1, 680, 640, 520, 0.7],
  [S(4), 640, 700, 520, 0.4],
  [S(4) + 1.4, 320, 980, 380, 0.85],
  [E(4), 300, 980, 400, 0.85],
  [S(5) + 0.6, 1010, 600, 380, 0.8],
  [E(5), 1010, 580, 380, 0.8],
  [S(6) + 0.8, 540, 980, 430, 0.8],
  [E(6), 540, 980, 430, 0.8],
  [S(7) + 1.5, 850, 1060, 380, 0.85],
  [E(7), 850, 1060, 380, 0.85],
  [S(8) + 2.5, 1200, 1060, 400, 0.8],
  [E(9), 1170, 1100, 420, 0.8],
  [S(10) + 1.5, 540, 700, 600, 0],
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
  const end = 2.75;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="VẮC-XIN PHÒNG UNG THƯ?" size={96} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

const MEDALS: MedalKind[] = ['liver', 'baby', 'cervix', 'female', 'male'];

export const VacXinVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam: Cam = camera(t);
  const f = focusAt(t);
  const hbv = virusPose(t, 'hbv');
  const hpv = virusPose(t, 'hpv');
  const handSweep = smooth(P(t, W(6, 'trong'), E(6) - W(6, 'trong') - 0.1));

  // ribbon trên khiên
  const ribbon2 = {lines: ['KHÔNG PHẢI', 'THUỐC CHỮA'], size: 70, p: win(t, W(2, 'không') - 0.1, S(3) + 0.3, 0.4, 0.4), y: 96};
  const ribbon9 = {lines: ['PHÒNG,', 'KHÔNG CHỮA'], size: 70, p: win(t, W(9, 'Còn') - 0.1, E(9) + 0.3, 0.4, 0.4), y: -150};
  const ribbon = ribbon2.p > 0.01 ? ribbon2 : ribbon9.p > 0.01 ? ribbon9 : undefined;
  const glow = win(t, W(6, 'tiêm') - 0.1, E(6) + 0.2, 0.5, 0.6);
  const gap = smooth(P(t, W(9, 'vẫn'), 0.8)) * (1 - smooth(P(t, E(9), 0.4)));
  const lens = win(t, W(9, 'tầm') - 0.2, W(9, 'Còn') - 0.35, 0.5, 0.4);

  // vi-rút "mờ và im" bên trong ở hai cảnh [N]: cùng khuôn nhưng chỉ làm nền, không nói, không cười
  const ghostB = win(t, S(4) + 0.6, E(4) + 0.5, 0.6, 0.8) * 0.4;
  const ghostH = win(t, S(7) + 0.8, E(7) + 0.5, 0.6, 0.8) * 0.4;

  const anchor = (who: Who) => {
    if (who === 'hbv') {
      const s = toScreen(hbv.x, SURF - 170, cam);
      return {x: s.x, y: s.y};
    }
    const h = linhHead(t);
    const s = toScreen(h.x, h.y, cam);
    return {x: s.x, y: s.y};
  };

  return (
    <AbsoluteFill style={{background: '#D9F0FC'}}>
      <Backdrop t={t} cam={cam} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <LinhDefs />
          <VirusDefs />
          <OrganDefs />
        </defs>
        <FarLayer cam={cam} t={t} />
        <g transform={viewTransform(cam)}>
          <Wall t={t} cam={cam} hand={handSweep}>
            {/* bên trong cơ thể: các huy hiệu và vi-rút mờ im lặng */}
            {MEDALS.map((k) => {
              const m = medalState(t, k);
              return <Medal key={k} kind={k} t={t} show={m.show} lit={m.lit} tone={m.tone} />;
            })}
            {ghostB > 0.01 && <Hbv x={MEDAL_X.liver + 225} y={MEDAL_Y + 78} t={t} mood="quiet" alpha={ghostB} scale={0.6} />}
            {ghostH > 0.01 && <Hpv x={985} y={SURF} t={t} mood="quiet" alpha={ghostH} scale={0.85} />}
            <GapVirus t={t} a={gap} />
            <Chart t={t} />
            <Shield t={t} glow={glow} ribbon={ribbon} gap={gap} />
            <Linh t={t} />
            {hbv.alpha > 0.01 && <Hbv x={hbv.x} t={t} mood={hbv.mood} alpha={hbv.alpha} flip={hbv.flip} moving={hbv.moving} phase={hbv.phase} lean={hbv.lean} />}
            {hpv.alpha > 0.01 && <Hpv x={hpv.x} t={t} mood={hpv.mood} alpha={hpv.alpha} flip={hpv.flip} moving={hpv.moving} phase={hpv.phase} lean={hpv.lean} />}
            <Magnifier t={t} a={lens} />
          </Wall>
        </g>
      </svg>
      <Focus cam={cam} x={f.x} y={f.y} r={f.r} a={f.a} />
      <Hook t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
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
