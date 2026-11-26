/* Cả video nằm trong vùng nghiêm ấm: chủ đề chăm sóc giảm nhẹ, có chữ "ung thư", "di căn", "đau". Không bong bóng hài, không mặt cười tươi, không tiếng vui.
   Đèn chỉ ân cần, im lặng; chỉ mỉm cười nhẹ ở cảnh 2, đầu cảnh 4 và câu kết. Bong bóng duy nhất là câu hỏi thật của gia đình ở cảnh 9. */
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {BigLabel, Captions, FONT, Labels, NAVY, Outro, Watermark} from '../../src/common/overlays';
import {RIGHT_EDGE} from '../../src/common/layout';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P} from '../../src/timeline';
import {Card1, Card2} from './Cards';
import {T, backSpeed, camera, lantern, ramp} from './Motion';
import {Badge, WEEK_Z, props, type Glyph} from './Props';
import {Defs, Ground, Particles, Sky, horizonY, proj, scenery} from './World';
import {S, W, timeline} from './timeline';

export const id = 'cham-soc-giam-nhe';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const sfx: Sfx[] = [
  {t: T.back0, src: 'sfx/whoosh-02.wav', v: 0.2},
  {t: S(2) + 1.3, src: 'sfx/whoosh-02.wav', v: 0.14},
  ...T.icon.map((t) => ({t, src: 'sfx/ping-01.wav', v: 0.16})),
  {t: T.beams, src: 'sfx/click-01.wav', v: 0.2},
  {t: T.beamCare, src: 'sfx/click-01.wav', v: 0.2},
  {t: T.week, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.card1, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.card2, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.bag, src: 'sfx/click-01.wav', v: 0.2},
  ...T.sign.map((t) => ({t, src: 'sfx/click-01.wav', v: 0.2})),
  {t: W(10, 'Follow'), src: 'sfx/ding-01.wav', v: 0.25},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/ping-01.wav', v: 0.16}))),
];

/* Câu hỏi mở đầu: chữ lớn "BỎ CUỘC?", sau khi hỏi xong thì có một nét gạch chéo nhẹ rồi chữ mờ đi */
const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = T.hookEnd + 0.9;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 10, stiffness: 170}});
  const out = P(t, end - 0.35, 0.35);
  const strike = P(t, T.hookEnd + 0.05, 0.35);
  return (
    <>
      <BigLabel text="BỎ CUỘC?" size={118} scale={s * (1 - out)} opacity={1 - out} />
      {strike > 0 && (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
          <path d={`M 262 ${430} L ${262 + 556 * strike} ${430 - 150 * strike}`} stroke="#fff" strokeWidth={34} strokeLinecap="round" />
          <path d={`M 262 ${430} L ${262 + 556 * strike} ${430 - 150 * strike}`} stroke="#E4573D" strokeWidth={20} strokeLinecap="round" />
        </svg>
      )}
    </>
  );
};

/* Vệt tốc độ khi máy quay bay ngược về cột mốc */
const SpeedLines = ({t, hy}: {t: number; hy: number}) => {
  const v = backSpeed(t);
  if (v < 0.04) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + 0.2;
        const r0 = 300 + ((i * 53 + t * 900) % 300);
        const r1 = r0 + 140 + 120 * v;
        return <path key={i} d={`M ${540 + Math.cos(a) * r0} ${hy + 330 + Math.sin(a) * r0 * 1.1} L ${540 + Math.cos(a) * r1} ${hy + 330 + Math.sin(a) * r1 * 1.1}`} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.5 * v} />;
      })}
    </svg>
  );
};

/* Cảnh 2: Đèn mang theo ba điều chăm sóc giảm nhẹ mang lại, ba huy hiệu bay quanh Đèn, nối với Đèn bằng sợi sáng */
const GIFTS: {dx: number; dy: number; kind: Glyph; text: string}[] = [
  {dx: -250, dy: -110, kind: 'pain', text: 'bớt đau'},
  {dx: 250, dy: -110, kind: 'breath', text: 'bớt khó chịu'},
  {dx: 0, dy: -290, kind: 'support', text: 'được nâng đỡ'},
];
const Gifts = ({t, frame, x, y}: {t: number; frame: number; x: number; y: number}) => {
  const out = ramp(t, S(3) - 0.15, 0.5);
  if (t < T.icon[0] - 0.05 || out >= 1) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      {GIFTS.map((g, i) => {
        const s = Math.min(1.06, spring({frame: frame - Math.round(T.icon[i] * FPS), fps: FPS, config: {damping: 10, stiffness: 160}}));
        if (t < T.icon[i] - 0.02) return null;
        const bob = 7 * Math.sin(t * 2 + i * 2);
        const cx = x + g.dx;
        const cy = y + g.dy + bob;
        const w = g.text.length * 19 + 44;
        return (
          <g key={i}>
            <path d={`M ${x} ${y - 60} L ${cx} ${cy}`} stroke="#FFD27A" strokeWidth={7} strokeLinecap="round" strokeDasharray="2 16" opacity={0.9 * Math.min(1, s)} />
            <g transform={`translate(${cx} ${cy}) scale(${s})`}>
              <Badge kind={g.kind} t={t} r={66} />
              <g transform="translate(0 100)">
                <rect x={-w / 2} y={-27} width={w} height={54} rx={27} fill="#fff" stroke={NAVY} strokeWidth={5} />
                <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={NAVY}>
                  {g.text}
                </text>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

/* Câu hỏi mẫu của gia đình ở cảnh 9 (nguyên văn trong bài): bong bóng hai dòng, đuôi chỉ về Đèn */
const LINES = ['Bác sĩ ơi, người nhà tôi có cần', 'thêm chăm sóc giảm nhẹ không?'];
const Ask = ({t, frame, x, y}: {t: number; frame: number; x: number; y: number}) => {
  if (t < T.ask - 0.02 || t > T.askEnd + 0.3) return null;
  const s = spring({frame: frame - Math.round(T.ask * FPS), fps: FPS, config: {damping: 12, stiffness: 150}});
  const out = P(t, T.askEnd, 0.3);
  const w = 800;
  const h = 150;
  const bx = 50 + (RIGHT_EDGE - 50 - w) / 2;
  const by = 420;
  const tailX = Math.max(bx + 80, Math.min(bx + w - 80, x));
  const r = 36;
  const d = `M ${bx + r} ${by} H ${bx + w - r} Q ${bx + w} ${by} ${bx + w} ${by + r} V ${by + h - r} Q ${bx + w} ${by + h} ${bx + w - r} ${by + h} H ${tailX + 26} L ${x} ${y} L ${tailX - 26} ${by + h} H ${bx + r} Q ${bx} ${by + h} ${bx} ${by + h - r} V ${by + r} Q ${bx} ${by} ${bx + r} ${by} Z`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - out, transformOrigin: `${x}px ${y}px`, transform: `scale(${Math.min(1.04, s) * (1 - 0.15 * out)})`}}>
      <path d={d} fill="#fff" stroke={NAVY} strokeWidth={7} strokeLinejoin="round" />
      {LINES.map((l, i) => (
        <text key={i} x={bx + w / 2} y={by + 62 + i * 52} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill={NAVY}>
          {l}
        </text>
      ))}
    </svg>
  );
};

export const ChamSocGiamNheVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam = camera(t);
  const lant = lantern(t);
  const hy = horizonY(cam);
  const weekBand = {z: WEEK_Z * ramp(t, T.week - 0.2, 0.9), a: ramp(t, T.early - 0.1, 0.6) * (1 - ramp(t, S(7) - 0.5, 1.4))};
  const sprites = [...scenery(cam, t), ...props(cam, t, lant)].sort((a, b) => b.depth - a.depth);
  const ls = proj(cam, lant.x, lant.y, lant.z);

  return (
    <AbsoluteFill style={{background: '#CDB4EA'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Defs />
        <Sky t={t} cam={cam} />
        <Ground t={t} cam={cam} week={weekBand} />
        {sprites.map((s) => s.el)}
        <Particles t={t} cam={cam} />
      </svg>
      <SpeedLines t={t} hy={hy} />
      <Hook t={t} frame={frame} />
      <Gifts t={t} frame={frame} x={ls.sx} y={ls.sy} />
      <Card1 t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
      <Ask t={t} frame={frame} x={Math.max(120, Math.min(RIGHT_EDGE - 60, ls.sx))} y={ls.sy - 120 * ls.k * 0.8 - 6} />
      <Labels t={t} frame={frame} tl={timeline} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
