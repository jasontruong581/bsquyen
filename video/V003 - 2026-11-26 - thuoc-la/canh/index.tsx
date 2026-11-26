import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble, type BubbleSpec} from '../../src/common/bubble';
import {BigLabel, Captions, FONT, Labels, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P} from '../../src/timeline';
import {Cell, FIX_AT, BREAK_AT, Finale, Icons, THO, Swarm} from './Panels';
import {E, S, W, WE, nearUngThu, timeline} from './timeline';
import {World, camera, khoiWorld, toScreen, viewTransform} from './World';

export const id = 'thuoc-la';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const smooth = (p: number) => p * p * (3 - 2 * p);

/* Bong bóng thoại: Khói (cảnh 1, 3) hoặc Thợ sửa (cảnh 4). Không có bong bóng nào trong ±2 giây quanh chữ "ung thư". */
type Who = 'khoi' | 'tho';
const bubbles: (BubbleSpec & {who: Who})[] = [
  {at: 0.55, dur: 1.4, text: 'Đi dạo chút nha~', who: 'khoi'},
  {at: 10.85, dur: 1.4, text: 'Quá giang nha~', who: 'khoi'},
  {at: FIX_AT + 0.25, dur: 0.85, text: 'Xong!', who: 'tho'},
];

/* Hiệu ứng âm thanh: im lặng trong ±2 giây quanh chữ "ung thư", và suốt cảnh 5-6 (tông nghiêm) */
const quiet = (t: number) => nearUngThu(t, 0.1) || (t >= S(5) - 0.05 && t <= E(6) + 0.1);
const sfxAll: Sfx[] = [
  {t: 0.5, src: 'sfx/whoosh-02.wav', v: 0.25},
  {t: S(2) - 0.35, src: 'sfx/whoosh-02.wav', v: 0.3},
  {t: S(4) - 0.4, src: 'sfx/whoosh-02.wav', v: 0.3},
  {t: W(3, 'gan'), src: 'sfx/ping-01.wav', v: 0.2},
  {t: W(3, 'thận'), src: 'sfx/ping-01.wav', v: 0.2},
  {t: W(3, 'bàng'), src: 'sfx/ping-01.wav', v: 0.2},
  {t: BREAK_AT, src: 'sfx/click-01.wav', v: 0.55},
  {t: FIX_AT, src: 'sfx/click-01.wav', v: 0.6},
  {t: FIX_AT + 0.08, src: 'sfx/ping-01.wav', v: 0.25},
  {t: W(7, 'ít') + 0.1, src: 'sfx/click-01.wav', v: 0.3},
  {t: W(7, 'lào') + 0.1, src: 'sfx/click-01.wav', v: 0.3},
  {t: WE(7, 'tử') + 0.1, src: 'sfx/click-01.wav', v: 0.3},
  {t: W(9, '1800'), src: 'sfx/ding-01.wav', v: 0.35},
  {t: S(10) + 0.1, src: 'sfx/pop-03.wav', v: 0.4},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/pop-01.wav', v: 0.35}))),
  ...bubbles.map((b) => ({t: b.at, src: 'sfx/pop-03.wav', v: 0.4})),
];
const sfx = sfxAll.filter((x) => !quiet(x.t));

/* Độ đặc của từng bảng hình (bảng phủ lên thế giới người) */
const panels = (t: number) => {
  const swarm = P(t, S(2) - 0.25, 0.3) * (1 - P(t, S(3) - 0.3, 0.3));
  const cell = P(t, S(4) - 0.3, 0.4) * (1 - P(t, E(5), 0.3));
  const icons = P(t, S(7) - 0.15, 0.3) * (1 - P(t, E(7) + 0.04, 0.3));
  const finaleBg = P(t, S(8) - 0.15, 0.3);
  const finale = finaleBg * (1 - P(t, E(10) + 0.3, 0.4));
  return {swarm, cell, icons, finale, veil: Math.max(swarm, cell, icons, finaleBg)};
};

/* Câu mở đầu hiện ngay khung đầu, nhường chỗ cho nhãn "KHÔNG CHỈ Ở PHỔI" */
const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = W(1, 'Không') - 0.15;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="MỘT HƠI THUỐC ĐI ĐÂU?" size={58} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

export const ThuocLaVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam = camera(t);
  const pa = panels(t);

  /* neo bong bóng: đỉnh đầu Khói (trong thế giới) hoặc đỉnh đầu Thợ sửa */
  const anchor = (who: Who) => {
    if (who === 'tho') return {x: THO.x - 30, y: THO.y - 84 * THO.scale};
    const p = khoiWorld(t);
    if (!p) return {x: 540, y: 600};
    const s = toScreen(p.x, p.y, cam);
    return {x: s.x, y: s.y - p.px * 0.55};
  };

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)'}}>
      {pa.veil < 0.999 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <g transform={viewTransform(cam)}>
            <World t={t} cam={cam} />
          </g>
        </svg>
      )}
      {/* mờ dần phần thế giới ở sát mép trên và từ y 1090 xuống: vùng dưới chỉ để nền */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: 'linear-gradient(180deg, rgba(255,249,244,0.95) 0px, rgba(255,249,244,0.95) 130px, rgba(255,249,244,0) 290px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1090, bottom: 0, background: 'linear-gradient(180deg, rgba(253,241,231,0) 0px, rgba(253,241,231,1) 330px)'}} />
      {pa.veil > 0.001 && <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FFF9F4 0%, #FDEEE2 100%)', opacity: pa.veil}} />}
      <Swarm t={t} frame={frame} a={pa.swarm} />
      <Cell t={t} frame={frame} a={pa.cell} />
      <Icons t={t} frame={frame} a={pa.icons} />
      <Finale t={t} frame={frame} a={pa.finale} />
      {t >= S(6) - 0.05 && t < S(7) && (
        <div style={{position: 'absolute', left: 60, top: 1098, fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#5b6b7b', opacity: smooth(P(t, S(6), 0.3)) * (1 - smooth(P(t, E(6), 0.3)))}}>Nguồn: WHO</div>
      )}
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
