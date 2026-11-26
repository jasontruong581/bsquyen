import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {Bubble} from '../../src/common/bubble';
import {BigLabel, Captions, Labels, ORANGE, Outro, Watermark} from '../../src/common/overlays';
import {useFonts} from '../../src/common/fonts';
import {Mix, type Sfx} from '../../src/common/mix';
import {FPS, P} from '../../src/timeline';
import {Card1, Card2} from './Cards';
import {Chip, Coin, Numerals, SectionChips, TopMarks} from './Coin';
import {Finger} from './Fingers';
import {LUMP, R, SK, GL, geom, onTop} from './Geo';
import {T, dentsAt, fingerAt, lookAt, moodAt, moonAt, padGlow, pressAmt, psiAt, ramp, swellAt, tiltAt, wobble} from './Motion';
import {Calendar, Check, ClinicSign, CoinIcon, Film, Moon, Needle, Notebook, NumBadge, PoseBadge, Probe, Question, ResultCard} from './Props';
import {E, S, W, timeline} from './timeline';
import {Backdrop, FarLayer, camera, toScreen, viewTransform} from './World';

export const id = 'tu-kham-vu';
export const durationInFrames = Math.ceil(timeline.total * FPS);

const FH = [168, 190, 208]; // chiều cao ba ngón (khớp Fingers.tsx)

/* Lời đọc không có chữ "ung thư". Chỗ nặng nhất là "sinh thiết" (cảnh 9): ba ngón nghiêm, không bong bóng hài, không tiếng vui.
   Bong bóng duy nhất: "Quen tay là được~" ở cảnh 3 (lời trấn an, không dính chữ nặng). */
const sfx: Sfx[] = [
  {t: 0.35, src: 'sfx/whoosh-02.wav', v: 0.2},
  ...T.badge.map((t) => ({t, src: 'sfx/pop-03.wav', v: 0.25})),
  {t: S(2) + 0.2, src: 'sfx/whoosh-02.wav', v: 0.2},
  {t: T.benign, src: 'sfx/ping-01.wav', v: 0.22},
  {t: T.before, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.after, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.know, src: 'sfx/pop-03.wav', v: 0.3},
  {t: S(4) - 0.05, src: 'sfx/whoosh-02.wav', v: 0.2},
  {t: T.calCircle, src: 'sfx/click-01.wav', v: 0.22},
  {t: T.clean, src: 'sfx/click-01.wav', v: 0.22},
  {t: T.fixed, src: 'sfx/click-01.wav', v: 0.25},
  {t: S(5) + 0.3, src: 'sfx/whoosh-02.wav', v: 0.18},
  ...T.pose.map((t) => ({t, src: 'sfx/pop-03.wav', v: 0.2})),
  {t: T.shape, src: 'sfx/ping-01.wav', v: 0.18},
  {t: T.dimple, src: 'sfx/ping-01.wav', v: 0.18},
  {t: T.nipple, src: 'sfx/ping-01.wav', v: 0.18},
  {t: S(6) + 1.2, src: 'sfx/whoosh-02.wav', v: 0.16},
  ...T.press.map((t) => ({t: t + 0.1, src: 'sfx/click-01.wav', v: 0.28})),
  {t: S(7) + 0.4, src: 'sfx/whoosh-02.wav', v: 0.18},
  {t: T.tail, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.clav, src: 'sfx/ping-01.wav', v: 0.18},
  {t: T.ruler, src: 'sfx/ping-01.wav', v: 0.18},
  {t: T.note, src: 'sfx/click-01.wav', v: 0.22},
  {t: T.clinic, src: 'sfx/ping-01.wav', v: 0.2},
  {t: T.probe, src: 'sfx/ping-01.wav', v: 0.16},
  {t: T.film, src: 'sfx/click-01.wav', v: 0.18},
  {t: T.needle + 0.7, src: 'sfx/click-01.wav', v: 0.16},
  {t: T.answer, src: 'sfx/ping-01.wav', v: 0.2},
  {t: W(10, 'Follow'), src: 'sfx/ding-01.wav', v: 0.25},
  ...timeline.scenes.flatMap((s) => s.labels.map((l) => ({t: l.t, src: 'sfx/ping-01.wav', v: 0.16}))),
];

const Hook = ({t, frame}: {t: number; frame: number}) => {
  const end = 2.6;
  if (t > end) return null;
  const s = spring({frame: frame + 12, fps: FPS, config: {damping: 9, stiffness: 180}});
  const out = P(t, end - 0.3, 0.3);
  const pulse = 1 + 0.02 * Math.sin(t * 9);
  return <BigLabel text="BÌNH TĨNH · 3 VIỆC" size={96} scale={s * (1 - out) * pulse} opacity={1 - out} />;
};

const win = (t: number, a: number, b: number, d = 0.3) => ramp(t, a, d) * (1 - ramp(t, b, d));

export const KhamVuVideo = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useFonts();

  const cam = camera(t);
  const tilt = tiltAt(t);
  const g = geom(t, tilt);
  const psi = psiAt(t);
  const dent = dentsAt(t);
  const sweep = 1 - ramp(t, T.know + 0.4, 0.8);
  const dim = win(t, S(4) - 0.05, E(4) - 0.1, 0.4);
  const hubSink = win(t, T.nipple, E(5) + 0.1);
  const glow = padGlow(t);
  const look = lookAt(t);
  const fingers = [0, 1, 2].map((j) => ({j, ...fingerAt(j, t)}));

  // vị trí khối trong mặt cắt (cảnh 2) để đặt dấu tích "lành tính"
  const arcLump = g.ry * Math.sqrt(1 - (LUMP.x / R) ** 2);
  const lumpSecY = arcLump + g.sa * (SK + 0.5 * GL);
  const benign = win(t, T.benign, E(2) + 0.2, 0.3);

  // chu kỳ ở cảnh 2
  const cyc = win(t, W(2, 'chu') - 0.2, E(2) + 0.3, 0.3);
  const chipBefore = win(t, T.before, E(2) + 0.3, 0.25);
  const chipAfter = win(t, T.after, E(2) + 0.3, 0.25);

  // dấu hỏi trên đầu ba ngón khi chạm khối (cảnh 3)
  const qA = win(t, T.tryHand + 0.35, T.know - 0.4, 0.3);
  const fMid = fingers[1];

  // chữ trên hình ở cảnh 5, 7, 8
  const shapeA = win(t, T.shape, T.dimple - 0.05, 0.25);
  const dimpleA = win(t, T.dimple, T.nipple - 0.05, 0.25);
  const nipA = win(t, T.nipple, E(5) + 0.1, 0.25);
  const hole = win(t, T.tail + 0.5, E(7) + 0.2, 0.3);
  const clavA = win(t, T.clav + 0.2, E(7) + 0.2, 0.3);
  const stay = win(t, T.stay, E(8) + 0.1, 0.3);
  const moon8 = win(t, T.moon8, E(8) + 0.1, 0.3);

  // bong bóng "Quen tay là được~" bên cạnh ngón Vừa
  const bubble = toScreen(fMid.x, fMid.y - FH[1] * fMid.s - 6, cam);

  const coinK = win(t, T.coin, T.press[0] - 0.6, 0.25);
  const contact = onTop(g, 0, 0);

  return (
    <AbsoluteFill style={{background: '#E3E6FB'}}>
      <Backdrop t={t} cam={cam} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <FarLayer cam={cam} t={t} />
        <g transform={viewTransform(cam)}>
          <g transform={`translate(0 ${g.bob.toFixed(2)})`}>
            <Coin t={t} g={g} psi={psi} swell={swellAt(t)} dent={dent} sweep={sweep} hubSink={hubSink} dim={dim} />
            <g transform={`scale(1 ${g.ca.toFixed(4)})`} opacity={1 - 0.62 * dim}>
              <TopMarks t={t} psi={psi} />
            </g>
            <g opacity={1 - 0.62 * dim}>
              <Numerals g={g} psi={psi} t={t} />
            </g>
            <SectionChips t={t} />
          </g>

          {/* cảnh 2: chu kỳ kinh (căng - mềm) và dấu tích lành tính */}
          <Chip x={-190} y={-258} text="TRƯỚC KỲ: CĂNG" a={chipBefore} />
          <Chip x={190} y={-258} text="SAU KỲ: MỀM" a={chipAfter} />
          <Moon x={0} y={-258} r={30} p={moonAt(t)} a={cyc} />
          <Check x={LUMP.x} y={lumpSecY - 66 + g.bob} a={benign} />

          {/* cảnh 4: lịch */}
          <Calendar t={t} />

          {/* cảnh 5: ba tư thế đứng trước gương và dấu hiệu cần để ý trên đĩa */}
          <PoseBadge x={-150} y={-389} kind={0} t={t} />
          <PoseBadge x={0} y={-389} kind={1} t={t} />
          <PoseBadge x={150} y={-389} kind={2} t={t} />
          <Chip x={-262} y={-292} text="HÌNH DẠNG" a={shapeA} size={24} />
          <Chip x={396} y={214} text="DA LÕM" a={dimpleA} size={24} />
          <Chip x={0} y={98} text="NÚM TỤT" a={nipA} size={24} />

          {/* cảnh 6: cỡ đồng xu */}
          {coinK > 0.01 && (
            <ellipse cx={contact.x} cy={contact.y + 12} rx={30} ry={30 * g.ca} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="4 9" strokeLinecap="round" opacity={coinK} />
          )}
          <g transform="translate(150 -10) scale(1.35) translate(-150 10)">
            <CoinIcon x={150} y={-10} a={coinK} />
          </g>

          {/* cảnh 7: hố nách và xương đòn */}
          <Chip x={-452} y={-166} text="HỐ NÁCH" a={hole} size={30} />
          <Chip x={-205} y={-345} text="XƯƠNG ĐÒN" a={clavA} size={30} />

          {/* cảnh 8: sổ ghi, biển phòng khám, khối vẫn còn sau một kỳ */}
          <Notebook t={t} />
          <ClinicSign t={t} x={262} y={-170} />
          {stay > 0.01 && (
            <g opacity={stay}>
              <path d="M -96 -108 Q 40 -250 190 -190" fill="none" stroke="#E36A18" strokeWidth={7} strokeDasharray="3 13" strokeLinecap="round" />
            </g>
          )}
          <Chip x={-60} y={-150} text="VẪN CÒN" a={stay} size={28} fill="#E9E3FF" />
          <Moon x={-268} y={-64} r={28} p={moonAt(t)} a={moon8} />

          {/* cảnh 9: siêu âm, nhũ ảnh, kim, kết quả */}
          <Probe t={t} />
          <Film t={t} />
          <Needle t={t} />
          <ResultCard t={t} />

          {/* ba ngón tay */}
          {fingers.map((f) => (
            <Finger key={f.j} kind={f.j as 0 | 1 | 2} x={f.x} y={f.y} s={f.s} rot={f.rot + wobble(f.j, t)} mood={moodAt(f.j, t)} look={look} t={t} glow={glow} press={pressAmt(f.j, t)} />
          ))}
          {fingers.map((f) => (
            <NumBadge key={f.j} x={f.x} y={f.y - FH[f.j] * f.s - 40} n={f.j + 1} a={win(t, T.badge[f.j], S(2) + 0.1, 0.2)} />
          ))}
          <Question x={fMid.x + 14} y={fMid.y - FH[1] * fMid.s - 62} a={qA} t={t} />
        </g>
      </svg>
      <Hook t={t} frame={frame} />
      <Card1 t={t} frame={frame} />
      <Card2 t={t} frame={frame} />
      <Bubble t={t} frame={frame} at={T.know} dur={1.5} text="Quen tay là được~" size={0.9} x={bubble.x} y={bubble.y} />
      <Labels t={t} frame={frame} tl={timeline} />
      <Captions t={t} tl={timeline} />
      <Watermark t={t} tl={timeline} />
      <Outro t={t} tl={timeline} />
      <Mix tl={timeline} sfx={sfx} />
    </AbsoluteFill>
  );
};
