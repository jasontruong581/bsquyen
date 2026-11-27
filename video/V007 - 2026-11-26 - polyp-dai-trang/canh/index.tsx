import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {BigLabel, Captions, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P, lerp} from '../../src/timeline';
import {Card1, Card2} from './Cards';
import {faceDir, gapAt, smooth, soiMood, soiU} from './Motion';
import {R_L, U_POLYP, U_RECTUM, pathAt} from './Path';
import {POLYP_FRAME, POLYP_SCALE, Polyp, STALK_H, headR, headY, type PolypMood} from './Polyp';
import {CAL, Calendar, CausePill, Drop, GoldWindow, QuestionMark, Sign, SleepBadges, SnipFlash, SymptomBadges} from './Props';
import {Cord, Soi, T_SNARE, snareState} from './Soi';
import {E, S, W, HOA_AC, serious, timeline} from './timeline';
import {Backdrop, Colon, Focus, GhostBody, camera, toScreen, viewTransform, type Cam} from './World';

export const id = 'polyp-dai-trang';
export const durationInFrames = Math.ceil(timeline.total * FPS);

/* Bong bóng thoại: Polyp (cảnh 2, 3, 5) và Soi (cảnh 8). Không bong bóng nào trong đoạn nghiêm: từ "hoá ác" tới hết cảnh 4, cảnh 9 và ±2 giây quanh mọi chữ "ung thư"
   (kể cả cảnh 1, nên "Chào~" của Polyp dời sang cảnh 2). Kiểm bằng `serious` ở dưới. */
type Who = 'polyp' | 'soi';
const bubbles: (BubbleSpec & {who: Who})[] = [
  {at: 4.3, dur: 1.1, text: 'Chào~', who: 'polyp'},
  {at: S(3) + 0.35, dur: 1.9, text: 'Mình lớn chậm lắm~', who: 'polyp'},
  {at: T_SNARE.retract + 0.05, dur: 1.2, text: 'Tạm biệt nha~', who: 'polyp'},
  {at: S(8) + 0.9, dur: 2.6, text: 'Mình lo hết, bạn ngủ nhẹ thôi~', who: 'soi'},
];

/* Hiệu ứng âm thanh: im lặng trong đoạn nghiêm và ±2 giây quanh chữ "ung thư" */
const quiet = (t: number) => serious(t, 0.1);
const FLIPS = Array.from({length: 5}, (_, k) => S(3) + 0.25 + (k * (W(3, 'Khoảng') - 0.3 - (S(3) + 0.25))) / 5);
const sfxAll: Sfx[] = [
  {t: 0.3, src: 'sfx/whoosh-02.wav', v: 0.22},
  ...FLIPS.map((t) => ({t, src: 'sfx/click-01.wav', v: 0.2})),
  {t: T_SNARE.out, src: 'sfx/whoosh-02.wav', v: 0.28},
  {t: T_SNARE.snip, src: 'sfx/click-01.wav', v: 0.45},
  {t: T_SNARE.snip + 0.08, src: 'sfx/ding-01.wav', v: 0.32},
  {t: W(6, 'từ') - 0.1, src: 'sfx/pop-03.wav', v: 0.32},
  {t: W(6, '45'), src: 'sfx/ping-01.wav', v: 0.25},
  {t: W(6, 'Có'), src: 'sfx/pop-01.wav', v: 0.28},
  {t: S(7) + 0.1, src: 'sfx/pop-03.wav', v: 0.3},
  {t: W(7, 'FIT'), src: 'sfx/ping-01.wav', v: 0.25},
  {t: W(7, 'Cách', 1) - 0.15, src: 'sfx/ping-01.wav', v: 0.25},
  {t: S(8) - 0.1, src: 'sfx/whoosh-02.wav', v: 0.28},
  {t: W(8, 'ngủ') - 0.1, src: 'sfx/pop-03.wav', v: 0.3},
  {t: W(8, 'khoảng') - 0.1, src: 'sfx/pop-03.wav', v: 0.3},
  {t: W(8, 'thuốc') - 0.1, src: 'sfx/pop-03.wav', v: 0.3},
  {t: S(10) + 0.3, src: 'sfx/whoosh-02.wav', v: 0.25},
  {t: W(10, 'Follow'), src: 'sfx/ding-01.wav', v: 0.3},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.32}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: 0.32})),
];
const sfx = sfxAll.filter((x) => !quiet(x.t));

/* Vùng được nhấn (phần còn lại mờ đi ~35%): mốc [t, x, y, bán kính, độ đặc] theo toạ độ thế giới, nội suy mượt */
type FK = [number, number, number, number, number];
const at = (du: number): [number, number] => {
  const p = pathAt(U_POLYP + du);
  return [p.x, p.y];
};
const sigma = pathAt(soiU(S(8) + 1.2));
const rect = pathAt(U_RECTUM - 130);
const FOCUS_KEYS: FK[] = [
  [0, ...at(120), 500, 0],
  [S(2) + 0.4, ...at(100), 460, 0.6],
  [E(2), ...at(100), 460, 0.6],
  [S(3) + 0.3, ...at(-50), 300, 0.8],
  [E(3), ...at(-50), 310, 0.8],
  [S(4) + 0.5, ...at(80), 330, 0.7],
  [E(4), ...at(80), 330, 0.7],
  [S(5) + 0.4, ...at(100), 300, 0.8],
  [E(5), ...at(100), 300, 0.8],
  [S(6) + 1, ...at(100), 520, 0],
  [E(7), 615, 880, 900, 0],
  [S(8) + 1.8, sigma.x + 20, sigma.y, 380, 0.7],
  [E(8), sigma.x + 20, sigma.y, 380, 0.7],
  [S(9) + 1.7, rect.x, rect.y, 400, 0.7],
  [E(9), rect.x, rect.y, 400, 0.7],
  [S(10) + 1.6, sigma.x, sigma.y, 600, 0],
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
  return <BigLabel text="CẮT POLYP = PHÒNG BỆNH" size={96} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

const camRot = (t: number) => camera(t).rot;
const pr = (POLYP_FRAME.rot * Math.PI) / 180;
const toWorld = (lx: number, ly: number) => ({x: POLYP_FRAME.x + POLYP_SCALE * (lx * Math.cos(pr) - ly * Math.sin(pr)), y: POLYP_FRAME.y + POLYP_SCALE * (lx * Math.sin(pr) + ly * Math.cos(pr))});
const toPolyp = (wx: number, wy: number) => {
  const dx = wx - POLYP_FRAME.x;
  const dy = wy - POLYP_FRAME.y;
  return {x: (dx * Math.cos(pr) + dy * Math.sin(pr)) / POLYP_SCALE, y: (-dx * Math.sin(pr) + dy * Math.cos(pr)) / POLYP_SCALE};
};

export const PolypVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam: Cam = camera(t);
  const f = focusAt(t);
  const mood = soiMood(t);

  // --- Soi: vị trí đầu, hướng mặt, dây ---
  const su = soiU(t);
  const sp0 = pathAt(su);
  const soi = {x: sp0.x, y: sp0.y + 4 * Math.sin(t * 2.1)};
  const fd = faceDir(t, camRot);
  const dim = smooth(P(t, HOA_AC - 0.3, 0.8)) * (1 - smooth(P(t, E(4) + 0.2, 0.8))) + smooth(P(t, S(9) - 0.2, 0.8)) * (1 - smooth(P(t, E(9) + 0.2, 0.8)));
  const light = 0.95 - 0.35 * Math.min(1, dim);
  const sweep = t < E(2) ? 10 * Math.sin((t - 0.5) * 1.5) * smooth(P(t, 2.5, 1)) : 2 * Math.sin(t * 1.2);

  // --- Polyp ---
  const grow = smooth(P(t, S(3) + 0.4, HOA_AC - S(3) - 0.3));
  const pMood: PolypMood = t < 4.3 ? 'calm' : t < HOA_AC - 0.3 ? 'smile' : t < E(4) + 0.1 ? 'quiet' : t < T_SNARE.retract ? 'calm' : 'smile';
  const pOpacity = 1 - 0.38 * smooth(P(t, HOA_AC - 0.2, 0.7)) * (1 - smooth(P(t, E(4) + 0.2, 0.6)));
  const headW = toWorld(0, headY(1));
  const neckW = toWorld(0, -STALK_H * 0.6);
  const toSoi = (w: {x: number; y: number}) => ({x: w.x - soi.x, y: w.y - soi.y});
  const snare = snareState(t, toSoi(headW), toSoi(neckW));
  const cut = t >= T_SNARE.snip ? 1 : 0;
  let carry: {x: number; y: number; s: number} | undefined;
  if (snare.carry) {
    const c = toPolyp(soi.x + snare.carry.x, soi.y + snare.carry.y);
    carry = {x: c.x, y: c.y, s: snare.carry.s};
  } else if (cut && t >= T_SNARE.retract) carry = {x: 0, y: 0, s: 0};
  const polypShown = !(cut && (!carry || carry.s <= 0.02));

  // --- neo bong bóng ---
  const hr = headR(grow);
  const polypHeadW = carry && cut ? toWorld(carry.x, carry.y) : toWorld(0, headY(grow));
  const anchor = (who: Who) => {
    if (who === 'soi') {
      const s = toScreen(soi.x, soi.y, cam);
      return {x: s.x - 20 * cam.s, y: s.y - 56 * cam.s};
    }
    const s = toScreen(polypHeadW.x, polypHeadW.y, cam);
    return {x: s.x, y: s.y - hr * 0.9 * cam.s};
  };

  // --- cảnh 9: giọt đỏ, dấu hỏi, ô nguyên nhân, biển ĐI KHÁM (toạ độ màn hình) ---
  const s9 = t >= S(9) - 0.3 && t <= E(9) + 0.7;
  const s9out = 1 - smooth(P(t, E(9) + 0.1, 0.4));
  const aheadP = (d: number) => pathAt(Math.max(0, su - d));
  const dropS = toScreen(aheadP(193).x, aheadP(193).y, cam);
  const signS = toScreen(aheadP(337).x, aheadP(337).y, cam);
  const sp9 = (a: number, d = 0.35) => smooth(P(t, a, d)) * s9out;

  const snipPos = toSoi(neckW);
  const flashK = snare.flash;

  return (
    <AbsoluteFill style={{background: '#FFDDD6'}}>
      <Backdrop t={t} cam={cam} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GhostBody cam={cam} t={t} />
        <g transform={viewTransform(cam)}>
          <Colon t={t} wave={t > S(10) + 1 ? 0.9 : 0.22} dim={Math.min(1, dim)} />
          <Calendar t={t} />
          {polypShown && <Polyp t={t} mood={pMood} grow={grow} opacity={pOpacity} cut={cut} carry={carry} />}
          <Cord t={t} u={su} />
          <g transform={`translate(${soi.x.toFixed(1)} ${soi.y.toFixed(1)}) rotate(${(-cam.rot).toFixed(2)}) scale(${fd.toFixed(3)} 1)`}>
            <Soi t={t} mood={mood} light={light} sweep={sweep} look={t >= S(10) + 1.9 ? [0, 0.15] : [-0.85, 0.15]} snare={snare}>
              <SnipFlash x={snipPos.x} y={snipPos.y} k={flashK} />
            </Soi>
          </g>
          <GoldWindow t={t} />
        </g>
      </svg>
      <Focus cam={cam} x={f.x} y={f.y} r={f.r} a={f.a} />
      <Hook t={t} frame={frame} />
      <Card1 t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
      <SymptomBadges t={t} frame={frame} />
      <SleepBadges t={t} frame={frame} />
      {s9 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Drop x={dropS.x} y={dropS.y} show={sp9(W(9, 'máu') - 0.1)} t={t} />
          <QuestionMark x={dropS.x} y={dropS.y - 92} show={sp9(W(9, 'kết'))} t={t} />
          <CausePill x={70} y={985} w={250} label="Trĩ" show={sp9(W(9, 'trĩ') - 0.25, 0.5)} to={[dropS.x, dropS.y + 56]} icon="tri" />
          <CausePill x={350} y={985} w={440} label="Khối ở trực tràng" show={sp9(W(9, 'nhưng') - 0.15, 0.5)} to={[dropS.x, dropS.y + 56]} icon="khoi" />
          <Sign x={signS.x} y={signS.y - 30} show={sp9(W(9, 'khám') - 0.3)} t={t} />
        </svg>
      )}
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
